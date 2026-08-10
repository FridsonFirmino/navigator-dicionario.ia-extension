import { useState } from "react";
import type { Definition, ResponseMessage } from "../types/messages";

export default function Popup() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="w-80 bg-white text-gray-900">
      <header className="border-b border-gray-200 px-4 py-3">
        <h1 className="text-base font-bold text-indigo-600">Dicionário IA</h1>
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
    </main>
  );
}
