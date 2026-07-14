#!/usr/bin/env node

// Scans public/registry/{plugins,themes,widgets,skills}/*/<source> and generates:
// - api.json per item (Misskey-compatible distribution endpoint)
// - plugins.json / themes.json / widgets.json / skills.json (registry indexes)
// - index.json (master index)

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSON5 from 'json5'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REGISTRY_DIR = resolve(__dirname, '..', 'public', 'registry')
const SITE_URL = process.env.SITE_URL ?? 'https://misstore.hital.in'

const errors = []

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf-8'))
}

function readJson5(p) {
  return JSON5.parse(readFileSync(p, 'utf-8'))
}

function scanDirs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
}

// Returns iconUrl if `icon.svg` exists in the item directory.
function resolveIconUrl(itemDir, kind, id) {
  if (!existsSync(join(itemDir, 'icon.svg'))) return undefined
  return `${SITE_URL}/registry/${kind}/${id}/icon.svg`
}

// git 履歴からアイテムディレクトリの初回/最終コミット日時を取得する。
// 未コミットの新規アイテムは履歴が無いので null (呼び出し側で now にフォールバック)。
function gitDates(itemDir) {
  try {
    const out = execFileSync('git', ['log', '--format=%aI', '--', itemDir], {
      cwd: REGISTRY_DIR,
      encoding: 'utf-8',
    }).trim()
    if (!out) return { createdAt: null, updatedAt: null }
    const lines = out.split('\n')
    return { createdAt: lines[lines.length - 1], updatedAt: lines[0] }
  } catch {
    return { createdAt: null, updatedAt: null }
  }
}

function normalizeLF(text) {
  return text.replace(/\r\n/g, '\n')
}

function computeSha512(source) {
  return createHash('sha512').update(normalizeLF(source), 'utf-8').digest('hex')
}

function validateRequired(meta, id, fields) {
  for (const field of fields) {
    if (!meta[field]) {
      errors.push(`[${id}] missing required field: ${field}`)
    }
  }
}

// Minimal YAML frontmatter parser for skill .md files.
// Supports: scalars (string/number/boolean), inline arrays [a, b], and
// double-quoted strings. Block strings (|, >) and nested objects are NOT
// supported — keep skill frontmatter shallow.
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: text }
  const [, head, body] = m
  const meta = {}
  for (const rawLine of head.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (!line || /^\s*#/.test(line)) continue
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!kv) continue
    const [, key, raw] = kv
    meta[key] = parseScalar(raw)
  }
  return { meta, body }
}

function parseScalar(raw) {
  const v = raw.trim()
  if (v === '' || v === '~' || v === 'null') return null
  if (v === 'true') return true
  if (v === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  if (/^\[.*\]$/.test(v)) {
    const inner = v.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(',').map((s) => parseScalar(s))
  }
  if (/^".*"$/.test(v) || /^'.*'$/.test(v)) return v.slice(1, -1)
  return v
}

// --- Plugins ---

function buildPlugins() {
  const dir = join(REGISTRY_DIR, 'plugins')
  return scanDirs(dir).flatMap((id) => {
    const metaPath = join(dir, id, 'meta.json')
    const srcPath = join(dir, id, 'plugin.is')

    if (!existsSync(metaPath)) {
      errors.push(`[${id}] missing meta.json`)
      return []
    }
    if (!existsSync(srcPath)) {
      errors.push(`[${id}] missing plugin.is`)
      return []
    }

    const meta = readJson(metaPath)
    validateRequired(meta, id, ['name', 'version', 'author', 'description'])

    const source = readFileSync(srcPath, 'utf-8')
    const normalized = normalizeLF(source)
    const sha512 = computeSha512(source)

    // Generate api.json (Misskey-compatible)
    const apiJson = { type: 'plugin', data: normalized }
    writeFileSync(
      join(dir, id, 'api.json'),
      JSON.stringify(apiJson) + '\n',
    )

    const now = new Date().toISOString()
    const git = gitDates(join(dir, id))
    const iconUrl = resolveIconUrl(join(dir, id), 'plugins', id)

    return [
      {
        id: meta.id || id,
        name: meta.name,
        version: meta.version,
        author: meta.author,
        description: meta.description,
        category: meta.category || 'utility',
        tags: meta.tags || [],
        sourceUrl: `${SITE_URL}/registry/plugins/${id}/plugin.is`,
        apiUrl: `${SITE_URL}/registry/plugins/${id}/api.json`,
        sha512,
        createdAt: meta.createdAt || git.createdAt || now,
        updatedAt: meta.updatedAt || git.updatedAt || meta.createdAt || now,
        ...(meta.authorUrl && { authorUrl: meta.authorUrl }),
        ...(meta.license && { license: meta.license }),
        ...(meta.repository && { repository: meta.repository }),
        ...(meta.permissions?.length && { permissions: meta.permissions }),
        ...(iconUrl && { iconUrl }),
      },
    ]
  })
}

// --- Themes ---

function buildThemes() {
  const dir = join(REGISTRY_DIR, 'themes')
  return scanDirs(dir).flatMap((id) => {
    const metaPath = join(dir, id, 'meta.json')
    if (!existsSync(metaPath)) {
      errors.push(`[${id}] missing meta.json`)
      return []
    }

    const sourceFile = existsSync(join(dir, id, 'theme.json5'))
      ? 'theme.json5'
      : existsSync(join(dir, id, 'theme.json'))
        ? 'theme.json'
        : null

    if (!sourceFile) {
      errors.push(`[${id}] missing theme.json5 or theme.json`)
      return []
    }

    const meta = readJson(metaPath)
    validateRequired(meta, id, ['name', 'author', 'description'])

    const source = readFileSync(join(dir, id, sourceFile), 'utf-8')
    const normalized = normalizeLF(source)
    const sha512 = computeSha512(source)

    // Parse theme source to extract props for preview
    const themeData = sourceFile.endsWith('.json5')
      ? readJson5(join(dir, id, sourceFile))
      : readJson(join(dir, id, sourceFile))

    // Generate api.json (Misskey-compatible)
    const apiJson = { type: 'theme', data: normalized }
    writeFileSync(
      join(dir, id, 'api.json'),
      JSON.stringify(apiJson) + '\n',
    )

    const now = new Date().toISOString()
    const git = gitDates(join(dir, id))
    const themeBaseUrl = `${SITE_URL}/registry/themes/${id}`

    return [
      {
        id: meta.id || id,
        name: meta.name,
        version: meta.version || '1.0.0',
        author: meta.author,
        description: meta.description,
        base: meta.base || themeData.base || 'dark',
        tags: meta.tags || [],
        sourceUrl: `${themeBaseUrl}/${sourceFile}`,
        apiUrl: `${themeBaseUrl}/api.json`,
        sha512,
        themeProps: themeData.props || {},
        createdAt: meta.createdAt || git.createdAt || now,
        updatedAt: meta.updatedAt || git.updatedAt || meta.createdAt || now,
        ...(meta.authorUrl && { authorUrl: meta.authorUrl }),
        ...(meta.license && { license: meta.license }),
        ...(meta.repository && { repository: meta.repository }),
      },
    ]
  })
}

// --- Widgets ---

function buildWidgets() {
  const dir = join(REGISTRY_DIR, 'widgets')
  return scanDirs(dir).flatMap((id) => {
    const metaPath = join(dir, id, 'meta.json')
    const srcPath = join(dir, id, 'widget.is')

    if (!existsSync(metaPath)) {
      errors.push(`[${id}] missing meta.json`)
      return []
    }
    if (!existsSync(srcPath)) {
      errors.push(`[${id}] missing widget.is`)
      return []
    }

    const meta = readJson(metaPath)
    validateRequired(meta, id, [
      'name',
      'version',
      'author',
      'description',
      'icon',
      'category',
    ])

    const source = readFileSync(srcPath, 'utf-8')
    const normalized = normalizeLF(source)
    const sha512 = computeSha512(source)

    const apiJson = { type: 'widget', data: normalized }
    writeFileSync(
      join(dir, id, 'api.json'),
      JSON.stringify(apiJson) + '\n',
    )

    const now = new Date().toISOString()
    const git = gitDates(join(dir, id))
    const iconUrl = resolveIconUrl(join(dir, id), 'widgets', id)

    return [
      {
        id: meta.id || id,
        name: meta.name,
        version: meta.version,
        author: meta.author,
        description: meta.description,
        icon: meta.icon,
        autoRun: meta.autoRun ?? true,
        category: meta.category,
        capabilities: meta.capabilities || [],
        tags: meta.tags || [],
        sourceUrl: `${SITE_URL}/registry/widgets/${id}/widget.is`,
        apiUrl: `${SITE_URL}/registry/widgets/${id}/api.json`,
        sha512,
        createdAt: meta.createdAt || git.createdAt || now,
        updatedAt: meta.updatedAt || git.updatedAt || meta.createdAt || now,
        ...(meta.authorUrl && { authorUrl: meta.authorUrl }),
        ...(meta.license && { license: meta.license }),
        ...(meta.repository && { repository: meta.repository }),
        ...(iconUrl && { iconUrl }),
      },
    ]
  })
}

// --- Skills ---

function buildSkills() {
  const dir = join(REGISTRY_DIR, 'skills')
  return scanDirs(dir).flatMap((id) => {
    const srcPath = join(dir, id, 'skill.md')

    if (!existsSync(srcPath)) {
      errors.push(`[${id}] missing skill.md`)
      return []
    }

    const source = readFileSync(srcPath, 'utf-8')
    const { meta } = parseFrontmatter(source)
    validateRequired(meta, id, [
      'id',
      'name',
      'version',
      'author',
      'description',
      'mode',
    ])

    const validModes = ['always', 'manual', 'trigger', 'heartbeat']
    if (meta.mode && !validModes.includes(meta.mode)) {
      errors.push(
        `[${id}] invalid mode: ${meta.mode} (expected one of ${validModes.join(', ')})`,
      )
    }

    const normalized = normalizeLF(source)
    const sha512 = computeSha512(source)

    const apiJson = { type: 'skill', data: normalized }
    writeFileSync(
      join(dir, id, 'api.json'),
      JSON.stringify(apiJson) + '\n',
    )

    const now = new Date().toISOString()
    const git = gitDates(join(dir, id))
    const iconUrl = resolveIconUrl(join(dir, id), 'skills', id)

    return [
      {
        id: meta.id || id,
        name: meta.name,
        version: meta.version,
        author: meta.author,
        description: meta.description,
        category: meta.category || 'utility',
        mode: meta.mode,
        triggers: meta.triggers || [],
        scope: meta.scope || 'global',
        tags: meta.tags || [],
        sourceUrl: `${SITE_URL}/registry/skills/${id}/skill.md`,
        apiUrl: `${SITE_URL}/registry/skills/${id}/api.json`,
        sha512,
        createdAt: meta.createdAt || git.createdAt || now,
        updatedAt: meta.updatedAt || git.updatedAt || meta.createdAt || now,
        ...(meta.authorUrl && { authorUrl: meta.authorUrl }),
        ...(meta.license && { license: meta.license }),
        ...(meta.repository && { repository: meta.repository }),
        ...(meta.builtIn !== undefined && { builtIn: !!meta.builtIn }),
        ...(meta.isPersona !== undefined && { isPersona: !!meta.isPersona }),
        ...(iconUrl && { iconUrl }),
      },
    ]
  })
}

// --- Build ---

const now = new Date().toISOString()
const plugins = buildPlugins().sort((a, b) => a.name.localeCompare(b.name))
const themes = buildThemes().sort((a, b) => a.name.localeCompare(b.name))
const widgets = buildWidgets().sort((a, b) => a.name.localeCompare(b.name))
const skills = buildSkills().sort((a, b) => a.name.localeCompare(b.name))

// Write indexes
writeFileSync(
  join(REGISTRY_DIR, 'plugins.json'),
  JSON.stringify({ version: 1, updatedAt: now, plugins }, null, 2) + '\n',
)

writeFileSync(
  join(REGISTRY_DIR, 'themes.json'),
  JSON.stringify({ version: 1, updatedAt: now, themes }, null, 2) + '\n',
)

writeFileSync(
  join(REGISTRY_DIR, 'widgets.json'),
  JSON.stringify({ version: 1, updatedAt: now, widgets }, null, 2) + '\n',
)

writeFileSync(
  join(REGISTRY_DIR, 'skills.json'),
  JSON.stringify({ version: 1, updatedAt: now, skills }, null, 2) + '\n',
)

// Write master index
writeFileSync(
  join(REGISTRY_DIR, 'index.json'),
  JSON.stringify(
    {
      version: 1,
      updatedAt: now,
      plugins: { count: plugins.length, updatedAt: now },
      themes: { count: themes.length, updatedAt: now },
      widgets: { count: widgets.length, updatedAt: now },
      skills: { count: skills.length, updatedAt: now },
    },
    null,
    2,
  ) + '\n',
)

// Report
console.log(
  `plugins.json: ${plugins.length} plugin(s), themes.json: ${themes.length} theme(s), widgets.json: ${widgets.length} widget(s), skills.json: ${skills.length} skill(s)`,
)

if (errors.length > 0) {
  console.error('\nValidation errors:')
  for (const e of errors) {
    console.error(`  ✗ ${e}`)
  }
  process.exit(1)
}
