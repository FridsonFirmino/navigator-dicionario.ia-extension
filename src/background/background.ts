import { lookupWord } from "../services/dictionaryService";
import type { Definition, RequestMessage } from "../types/messages";
import { DEFAULT_SETTINGS } from "../types/messages";
import { getSettings, saveSettings } from "../utils/storage";

const TRANSLATION_CONTEXTS = [
  { id: "geral", label: "Geral" },
  { id: "economia", label: "Economia" },
  { id: "tecnologia", label: "Tecnologia" },
  { id: "ciencias", label: "Ciências" },
  { id: "saude", label: "Saúde" },
  { id: "direito", label: "Direito" },
  { id: "educacao", label: "Educação" },
  { id: "meio-ambiente", label: "Meio ambiente" },
  { id: "historia", label: "História" },
  { id: "artes-cultura", label: "Artes e cultura" },
  { id: "desporto", label: "Desporto" },
  { id: "negocios", label: "Negócios" },
];

chrome.runtime.onInstalled.addListener(async () => {
  await saveSettings(await getSettings());
  await chrome.sidePanel.setOptions({ path: "src/sidepanel/index.html" });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "dicionario-ia-translate",
      title: "Traduzir no contexto de…",
      contexts: ["selection"],
    });

    for (const context of TRANSLATION_CONTEXTS) {
      chrome.contextMenus.create({
        id: `dicionario-ia-context-${context.id}`,
        parentId: "dicionario-ia-translate",
        title: context.label,
        contexts: ["selection"],
      });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (
    typeof info.menuItemId === "string" &&
    info.menuItemId.startsWith("dicionario-ia-context-") &&
    info.selectionText &&
    tab?.id
  ) {
    const word = info.selectionText.trim();
    if (word) {
      const contextId = info.menuItemId.slice("dicionario-ia-context-".length);
      const context = TRANSLATION_CONTEXTS.find((item) => item.id === contextId);
      if (context) {
        void openSidebarWithWord(word, context.label, tab.windowId);
      }
    }
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId !== undefined) {
    void chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener(
  (message: RequestMessage, _sender, sendResponse) => {
    if (message.type === "LOOKUP_WORD") {
      lookupWordWithSettings(message.word, message.context)
        .then((definition) =>
          sendResponse({ type: "LOOKUP_RESULT", ok: true, definition }),
        )
        .catch((error: unknown) =>
          sendResponse({
            type: "LOOKUP_RESULT",
            ok: false,
            error: String(error),
          }),
        );
      return true;
    }

    if (message.type === "GET_SETTINGS") {
      void getSettings().then((settings) =>
        sendResponse({ type: "SETTINGS", settings }),
      );
      return true;
    }

    if (message.type === "SAVE_SETTINGS") {
      void saveSettings({ ...DEFAULT_SETTINGS, ...message.settings }).then(() =>
        sendResponse({ type: "SETTINGS_SAVED", ok: true }),
      );
      return true;
    }

    return false;
  },
);

async function lookupWordWithSettings(
  word: string,
  context?: string,
): Promise<Definition> {
  return lookupWord(word, await getSettings(), context);
}

async function openSidebarWithWord(
  word: string,
  context: string,
  windowId: number,
): Promise<void> {
  const opening = chrome.sidePanel.open({ windowId });
  await chrome.storage.session.set({
    pendingLookup: { word, context, id: `${Date.now()}-${Math.random()}` },
  });
  await opening;
}
