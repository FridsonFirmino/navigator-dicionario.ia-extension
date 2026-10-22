import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Definition, ResponseMessage } from "../types/messages";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("dicionario-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Popup() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupContext, setLookupContext] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const lastRequestId = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("dicionario-theme", theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0a0a0b" : "#ffffff");
  }, [theme]);

  const search = async (term: string, context?: string) => {
    const normalized = term.trim();
    if (!normalized) return;

    setWord(normalized);
    setHasSearched(true);
    setLookupContext(context ?? null);
    setLoading(true);
    setError(null);
    setDefinition(null);

    try {
      const response = (await chrome.runtime.sendMessage({
        type: "LOOKUP_WORD",
        word: normalized,
        context,
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
      const context =
        "context" in value && typeof value.context === "string"
          ? value.context
          : undefined;
      void search(value.word, context);
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

  const clearSearch = () => {
    setWord("");
    setHasSearched(false);
    setDefinition(null);
    setError(null);
    setLookupContext(null);
  };

  return (
    <main className="flex min-h-screen w-full flex-col bg-surface text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-sm font-semibold text-ink-secondary">
          Dicionário.IA
        </span>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/FridsonFirmino/navigator-dicionario.ia-extension"
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir repositório do Dicionário IA no GitHub"
            title="Ver repositório no GitHub"
            className="rounded-md p-2 text-ink-faint transition hover:bg-hover hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
          >
            <GitHubIcon />
          </a>
          <button
            type="button"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
            aria-label={
              theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
            }
            title={
              theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
            }
            className="rounded-md p-2 text-ink-faint transition hover:bg-hover hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </header>

      {!hasSearched ? (
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-6">
          <div className="mb-8 flex w-full max-w-3xl flex-col items-center gap-6 px-2">
            <Logo />
            <p className="text-center text-[15px] leading-relaxed text-ink-muted">
              Pesquise qualquer termo ou expressão técnica e entenda{" "}
              <span className="font-medium text-ink-secondary">
                pelo contexto certo
              </span>
            </p>
            <SearchBar
              value={word}
              onChange={setWord}
              onSubmit={() => void search(word, lookupContext ?? undefined)}
              onClear={clearSearch}
              loading={loading}
              size="large"
            />
            <div className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
              <TargetIcon />
              Área de conhecimento atual: {lookupContext ?? "Geral"}
            </div>
            <SearchExamples
              onSelect={(term) => void search(term, lookupContext ?? undefined)}
            />
          </div>
        </section>
      ) : (
        <section className="flex-1 pt-6 pb-12">
          <div className="mx-auto mb-8 w-full max-w-3xl px-4 sm:px-6">
            <SearchBar
              value={word}
              onChange={setWord}
              onSubmit={() => void search(word, lookupContext ?? undefined)}
              onClear={clearSearch}
              loading={loading}
              size="default"
            />
          </div>

          {loading && <LoadingState />}
          {error && (
            <ErrorState
              message={error}
              onRetry={() => void search(word, lookupContext ?? undefined)}
            />
          )}
          {definition && (
            <DefinitionResult definition={definition} context={lookupContext} />
          )}
        </section>
      )}

      <footer className="mt-auto border-t border-line px-4 py-3 text-center text-xs text-ink-muted">
        Feito com ❤️ por Fridson Firmino
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <h1 className="text-4xl font-semibold tracking-tight text-ink">
      Dicionário<span className="text-ink-faint">.ia</span>
    </h1>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading: boolean;
  size: "default" | "large";
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  loading,
  size,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isLarge = size === "large";

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (value.trim()) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <p className="mb-2 text-center text-[11px] leading-relaxed text-ink-faint">
        Pode conter imprecisões. Confirme informações importantes em outras
        fontes.
      </p>
      <div
        className={`group flex w-full items-center rounded-xl border border-line-strong bg-raised shadow-sm transition ${isLarge ? "h-12 md:h-14" : "h-12"} focus-within:border-line-focus focus-within:ring-2 focus-within:ring-line-focus focus-within:shadow-md focus-within:shadow-focus`}
      >
        <span className="shrink-0 pl-4 pr-2 text-ink-faint">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Pesquise uma palavra ou conceito..."
          aria-label="Termo ou expressão para pesquisar"
          autoComplete="off"
          autoFocus={isLarge}
          className={`min-w-0 flex-1 border-none bg-transparent px-2 text-ink outline-none placeholder:text-ink-faint ${value.length > 40 ? "text-xs" : isLarge ? "text-base" : "text-sm md:text-base"}`}
        />
        {loading && (
          <span className="pr-2 text-ink-faint">
            <LoadingIcon />
          </span>
        )}
        <div className="flex w-[72px] shrink-0 items-center justify-end gap-1 pr-3">
          {value && !loading && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar pesquisa"
              className="text-ink-faint transition-colors hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
            >
              <ClearIcon />
            </button>
          )}
          <kbd className="hidden items-center rounded-md bg-sunken px-1.5 py-0.5 font-mono text-xs text-ink-faint sm:inline-flex">
            ⌘ K
          </kbd>
        </div>
      </div>
    </form>
  );
}

function SearchExamples({ onSelect }: { onSelect: (term: string) => void }) {
  const examples = ["API", "closure", "inflação", "machine learning"];
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-wider text-ink-faint">
        Experimente pesquisar
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {examples.map((example) => (
          <button
            type="button"
            key={example}
            onClick={() => onSelect(example)}
            className="rounded-full bg-sunken px-3 py-1.5 text-sm text-ink-muted transition hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function DefinitionResult({
  definition,
  context,
}: {
  definition: Definition;
  context: string | null;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-7 px-4 sm:px-6">
      <div className="flex items-center gap-2 text-xs text-ink-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-solid" />
        <span>Conteúdo de demonstração</span>
        <span aria-hidden="true">·</span>
        <span>Área: {context ?? "Geral"}</span>
      </div>
      <h1 className="text-3xl font-bold text-ink">{definition.word}</h1>
      <section className="-mx-4 rounded-xl border border-line bg-raised p-4 shadow-sm sm:mx-0">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Resposta rápida
        </h2>
        <p className="text-base leading-relaxed text-ink-secondary">
          {definition.meaning}
        </p>
      </section>
      {definition.examples.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Exemplos
          </h2>
          <ul className="space-y-2 text-sm text-ink-body">
            {definition.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </section>
      )}
      {definition.synonyms.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Termos relacionados
          </h2>
          <div className="flex flex-wrap gap-2">
            {definition.synonyms.map((synonym) => (
              <span
                key={synonym}
                className="rounded-full bg-sunken px-3 py-1.5 text-sm text-ink-secondary"
              >
                {synonym}
              </span>
            ))}
          </div>
        </section>
      )}
      <p className="text-xs text-ink-muted">{definition.source}</p>
    </article>
  );
}

function LoadingState() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6"
      aria-label="A carregar resultado"
    >
      <div className="h-4 w-48 animate-pulse rounded-md bg-hover" />
      <div className="h-10 w-64 animate-pulse rounded-md bg-hover" />
      <div className="h-32 animate-pulse rounded-lg bg-hover" />
      <div className="h-20 animate-pulse rounded-lg bg-hover" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-danger">
        <AlertIcon />
      </div>
      <h2 className="text-lg font-semibold text-ink-secondary">
        Não foi possível concluir a pesquisa
      </h2>
      <p className="text-sm text-ink-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-sunken px-4 py-2 text-sm text-ink-secondary transition hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus"
      >
        Tentar novamente
      </button>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
    >
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.92.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.76 1.02.76 2.06v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  return theme === "dark" ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path strokeLinecap="round" d="m16 16 4 4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 fill-none stroke-current"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="5.5" />
      <circle cx="8" cy="8" r="2" />
      <path strokeLinecap="round" d="M8 0.8v2M15.2 8h-2M8 15.2v-2M.8 8h2" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 animate-spin fill-none stroke-current"
      strokeWidth="2"
    >
      <path strokeLinecap="round" d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5m0 4h.01" />
    </svg>
  );
}
