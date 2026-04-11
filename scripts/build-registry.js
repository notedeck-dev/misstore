#!/usr/bin/env node

// Scans public/registry/{plugins,themes}/*/meta.json and generates index JSONs.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REGISTRY_DIR = resolve(__dirname, '..', 'public', 'registry')

function readJson(p) { return JSON.parse(readFileSync(p, 'utf-8')) }

function scanDirs(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
}

function buildPlugins() {
  const dir = join(REGISTRY_DIR, 'plugins')
  return scanDirs(dir).flatMap(id => {
    const meta = join(dir, id, 'meta.json')
    const src = join(dir, id, 'plugin.is')
    if (!existsSync(meta) || !existsSync(src)) return []
    const m = readJson(meta)
    return [{
      id: m.id || id, name: m.name, version: m.version, author: m.author,
      description: m.description, category: m.category || 'utility',
      tags: m.tags || [], sourceUrl: `registry/plugins/${id}/plugin.is`,
      createdAt: m.createdAt || new Date().toISOString(),
    }]
  }).sort((a, b) => a.name.localeCompare(b.name))
}

function buildThemes() {
  const dir = join(REGISTRY_DIR, 'themes')
  return scanDirs(dir).flatMap(id => {
    const meta = join(dir, id, 'meta.json')
    if (!existsSync(meta)) return []
    const sf = existsSync(join(dir, id, 'theme.json5')) ? 'theme.json5'
      : existsSync(join(dir, id, 'theme.json')) ? 'theme.json' : null
    if (!sf) return []
    const m = readJson(meta)
    return [{
      id: m.id || id, name: m.name, version: m.version || '1.0.0',
      author: m.author, description: m.description, base: m.base || 'dark',
      tags: m.tags || [], sourceUrl: `registry/themes/${id}/${sf}`,
      previewColors: m.previewColors || {},
      createdAt: m.createdAt || new Date().toISOString(),
    }]
  }).sort((a, b) => a.name.localeCompare(b.name))
}

const now = new Date().toISOString()
const plugins = buildPlugins()
const themes = buildThemes()

writeFileSync(join(REGISTRY_DIR, 'plugins.json'), JSON.stringify({ version: 1, updatedAt: now, plugins }, null, 2) + '\n')
writeFileSync(join(REGISTRY_DIR, 'themes.json'), JSON.stringify({ version: 1, updatedAt: now, themes }, null, 2) + '\n')

console.log(`plugins.json: ${plugins.length} plugin(s), themes.json: ${themes.length} theme(s)`)
