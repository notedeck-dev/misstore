#!/usr/bin/env node

// Scans public/registry/{plugins,themes}/*/meta.json and generates:
// - api.json per item (Misskey-compatible distribution endpoint)
// - plugins.json / themes.json (registry indexes)
// - index.json (master index)

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
        createdAt: meta.createdAt || now,
        updatedAt: meta.updatedAt || meta.createdAt || now,
        ...(meta.authorUrl && { authorUrl: meta.authorUrl }),
        ...(meta.license && { license: meta.license }),
        ...(meta.repository && { repository: meta.repository }),
        ...(meta.permissions?.length && { permissions: meta.permissions }),
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
        createdAt: meta.createdAt || now,
        updatedAt: meta.updatedAt || meta.createdAt || now,
      },
    ]
  })
}

// --- Build ---

const now = new Date().toISOString()
const plugins = buildPlugins().sort((a, b) => a.name.localeCompare(b.name))
const themes = buildThemes().sort((a, b) => a.name.localeCompare(b.name))

// Write indexes
writeFileSync(
  join(REGISTRY_DIR, 'plugins.json'),
  JSON.stringify({ version: 1, updatedAt: now, plugins }, null, 2) + '\n',
)

writeFileSync(
  join(REGISTRY_DIR, 'themes.json'),
  JSON.stringify({ version: 1, updatedAt: now, themes }, null, 2) + '\n',
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
    },
    null,
    2,
  ) + '\n',
)

// Report
console.log(
  `plugins.json: ${plugins.length} plugin(s), themes.json: ${themes.length} theme(s)`,
)

if (errors.length > 0) {
  console.error('\nValidation errors:')
  for (const e of errors) {
    console.error(`  ✗ ${e}`)
  }
  process.exit(1)
}
