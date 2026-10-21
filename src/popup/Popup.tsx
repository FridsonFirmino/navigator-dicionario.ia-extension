import { useEffect, useRef, useState } from "react";
import type { Definition, ResponseMessage } from "../types/messages";

export default function Popup() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastRequestId = useRef<string | null>(null);

  const lookup = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const term = word.trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setDefinition(null);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "LOOKUP_WORD",
        word: term,
      })) as ResponseMessage;

      if (response.type === "LOOKUP_RESULT" && response.ok) {
        setDefinition(response.definition);
      } else if (response.type === "LOOKUP_RESULT") {
        setError(response.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePendingLookup = (value: unknown) => {
      if (
        !value ||
        typeof value !== "object" ||
        !("word" in value) ||
        !("id" in value) ||
        typeof value.word !== "string" ||
        typeof value.id !== "string" ||
        value.id === lastRequestId.current
      ) {
        return;
      }

      lastRequestId.current = value.id;
      setWord(value.word);
      void lookupForTerm(value.word);
      void chrome.storage.session.remove("pendingLookup");
    };

    void chrome.storage.session
      .get("pendingLookup")
      .then(({ pendingLookup }) => {
        handlePendingLookup(pendingLookup);
      });

    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === "session" && changes.pendingLookup?.newValue) {
        handlePendingLookup(changes.pendingLookup.newValue);
      }
    };

    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const lookupForTerm = async (term: string) => {
    setLoading(true);
    setError(null);
    setDefinition(null);
    try {
      const response = (await chrome.runtime.sendMessage({
        type: "LOOKUP_WORD",
        word: term,
      })) as ResponseMessage;
      if (response.type === "LOOKUP_RESULT" && response.ok) {
        setDefinition(response.definition);
      } else if (response.type === "LOOKUP_RESULT") {
        setError(response.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-white text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h1 className="text-base font-bold text-indigo-600">Dicionário IA</h1>
        <a
          href="https://github.com/FridsonFirmino/navigator-dicionario.ia-extension"
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir repositório do Dicionário IA no GitHub"
          title="Ver repositório no GitHub"
          className="rounded-md p-1 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
          >
            <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.92.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.76 1.02.76 2.06v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
          </svg>
        </a>
      </header>

      <form onSubmit={lookup} className="space-y-3 px-4 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder="Digite uma palavra..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={loading || !word.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "..." : "Buscar"}
          </button>
        </div>
      </form>

      <section className="px-4 pb-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {definition && (
          <article className="space-y-3">
            <h2 className="text-lg font-bold">{definition.word}</h2>
            <p className="text-sm leading-relaxed">{definition.meaning}</p>

            {definition.examples.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                  Exemplos
                </h3>
                <ul className="list-disc pl-5 text-sm">
                  {definition.examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {definition.synonyms.length > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                  Sinônimos
                </h3>
                <div className="flex flex-wrap gap-1">
                  {definition.synonyms.map((synonym) => (
                    <span
                      key={synonym}
                      className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700"
                    >
                      {synonym}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400">{definition.source}</p>
          </article>
        )}
      </section>

      <footer className="mt-auto border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-500">
        Feito com ❤️ por Fridson Firmino
      </footer>
    </main>
  );
}
