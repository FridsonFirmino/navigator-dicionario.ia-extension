import { DEFAULT_SETTINGS } from '../types/messages'
import type { Settings } from '../types/messages'

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS))
  return { ...DEFAULT_SETTINGS, ...(stored as unknown as Partial<Settings>) }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set(settings)
}
