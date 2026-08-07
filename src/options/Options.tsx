import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS } from '../types/messages'
import type { ResponseMessage, Settings } from '../types/messages'

export default function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void chrome.runtime
      .sendMessage({ type: 'GET_SETTINGS' })
      .then((response: ResponseMessage) => {
        if (response.type === 'SETTINGS') {
          setSettings(response.settings)
        }
      })
  }, [])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaved(false)

    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-indigo-600">Opções do Dicionário IA</h1>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="apiEndpoint" className="block text-sm font-semibold text-gray-700">
            Endpoint da API de IA
          </label>
          <input
            id="apiEndpoint"
            type="url"
            value={settings.apiEndpoint}
            onChange={(event) => update('apiEndpoint', event.target.value)}
            placeholder="https://api.exemplo.com/v1/definir"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <p className="text-xs text-gray-500">
            URL do serviço de IA que gerará as definições. Deixe vazio para usar o modo de demonstração.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700">
            Chave da API
          </label>
          <input
            id="apiKey"
            type="password"
            value={settings.apiKey}
            onChange={(event) => update('apiKey', event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <p className="text-xs text-gray-500">A chave fica armazenada com segurança no chrome.storage.sync.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="language" className="block text-sm font-semibold text-gray-700">
            Idioma
          </label>
          <select
            id="language"
            value={settings.language}
            onChange={(event) => update('language', event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="pt">Português</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Salvar
          </button>
          {saved && <span className="text-sm font-medium text-green-600">Configurações salvas!</span>}
        </div>
      </form>
    </main>
  )
}
