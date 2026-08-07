export interface Settings {
  apiEndpoint: string
  apiKey: string
  language: string
}

export const DEFAULT_SETTINGS: Settings = {
  apiEndpoint: '',
  apiKey: '',
  language: 'pt',
}

export interface Definition {
  word: string
  meaning: string
  examples: string[]
  synonyms: string[]
  source: string
}

export type RequestMessage =
  | { type: 'LOOKUP_WORD'; word: string }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: Settings }

export type ResponseMessage =
  | { type: 'LOOKUP_RESULT'; ok: true; definition: Definition }
  | { type: 'LOOKUP_RESULT'; ok: false; error: string }
  | { type: 'SETTINGS'; settings: Settings }
  | { type: 'SETTINGS_SAVED'; ok: boolean }

export type ContentMessage =
  | { type: 'SHOW_DEFINITION'; definition: Definition }
  | { type: 'HIDE_DEFINITION' }
