import { lookupWord } from "../services/dictionaryService";
import type { Definition, RequestMessage } from "../types/messages";
import { DEFAULT_SETTINGS } from "../types/messages";
import { getSettings, saveSettings } from "../utils/storage";

chrome.runtime.onInstalled.addListener(async () => {
  await saveSettings(await getSettings());

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "dicionario-ia-lookup",
      title: 'Consultar "%s" no Dicionário.IA',
      contexts: ["selection"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (
    info.menuItemId === "dicionario-ia-lookup" &&
    info.selectionText &&
    tab?.id
  ) {
    const word = info.selectionText.trim();
    if (word) {
      void lookupAndShow(word, tab.id);
    }
  }
});

chrome.runtime.onMessage.addListener(
  (message: RequestMessage, _sender, sendResponse) => {
    if (message.type === "LOOKUP_WORD") {
      lookupWordWithSettings(message.word)
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

async function lookupWordWithSettings(word: string): Promise<Definition> {
  return lookupWord(word, await getSettings());
}

async function lookupAndShow(word: string, tabId: number): Promise<void> {
  try {
    const definition = await lookupWordWithSettings(word);
    await chrome.tabs.sendMessage(tabId, {
      type: "SHOW_DEFINITION",
      definition,
    });
  } catch (error) {
    await chrome.tabs.sendMessage(tabId, {
      type: "SHOW_DEFINITION",
      definition: {
        word,
        meaning: `Não foi possível consultar "${word}".`,
        examples: [],
        synonyms: [],
        source: String(error),
      },
    });
  }
}
