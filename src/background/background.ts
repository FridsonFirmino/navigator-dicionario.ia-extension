import { lookupWord } from "../services/dictionaryService";
import type { Definition, RequestMessage } from "../types/messages";
import { DEFAULT_SETTINGS } from "../types/messages";
import { getSettings, saveSettings } from "../utils/storage";

chrome.runtime.onInstalled.addListener(async () => {
  await saveSettings(await getSettings());
  await chrome.sidePanel.setOptions({ path: "src/sidepanel/index.html" });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "dicionario-ia-lookup",
      title: 'Traduzir "%s" no Dicionário IA',
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
      void openSidebarWithWord(word, tab.windowId);
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

async function openSidebarWithWord(word: string, windowId: number): Promise<void> {
  const opening = chrome.sidePanel.open({ windowId });
  await chrome.storage.session.set({
    pendingLookup: { word, id: `${Date.now()}-${Math.random()}` },
  });
  await opening;
}
