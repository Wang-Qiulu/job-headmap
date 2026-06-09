// Dual-mode storage adapter for Zustand persist:
// - Inside Tauri: invoke Rust commands -> writes to ~/Library/Application Support/<id>/data.json
// - Browser dev / preview: localStorage (so `npm run dev:web` still works)
//
// We detect Tauri by `window.__TAURI_INTERNALS__` which Tauri 2 always injects.
// `@tauri-apps/api/core` is dynamically imported so this file doesn't drag the
// Tauri runtime into a pure-web build (would otherwise fail to resolve).

import type { StateStorage } from 'zustand/middleware'

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

// Browser fallback — used by `npm run dev:web` and in unit tests
const lsStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}

// Tauri impl — Rust handles atomic write + 7-rotation backups
const tauriStorage: StateStorage = {
  async getItem(_name) {
    const { invoke } = await import('@tauri-apps/api/core')
    const v = await invoke<string | null>('load_data')
    return v ?? null
  },
  async setItem(_name, value) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_data', { json: value })
  },
  async removeItem(_name) {
    const { invoke } = await import('@tauri-apps/api/core')
    // Clear by writing an empty store; the Rust side still snapshots, so a
    // reset can be undone from the backups/ folder.
    await invoke('save_data', { json: '' })
  },
}

export function createAppStorage(): StateStorage {
  return isTauri() ? tauriStorage : lsStorage
}
