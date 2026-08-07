import type { ContentMessage, Definition } from '../types/messages'

const PANEL_STYLES = `
  .dia-panel {
    position: fixed;
    z-index: 2147483647;
    min-width: 260px;
    max-width: 360px;
    padding: 16px;
    border-radius: 12px;
    background: #ffffff;
    color: #111827;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    font-family: ui-sans-serif, system-ui, sans-serif;
    border: 1px solid #e5e7eb;
  }
  .dia-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .dia-panel__word {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }
  .dia-panel__close {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 16px;
    cursor: pointer;
    line-height: 1;
    padding: 2px;
  }
  .dia-panel__close:hover { color: #111827; }
  .dia-panel__meaning { font-size: 14px; line-height: 1.5; margin: 0 0 12px; }
  .dia-panel__section { font-size: 12px; font-weight: 600; color: #6b7280; margin: 8px 0 4px; }
  .dia-panel__list { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5; }
  .dia-panel__source {
    margin-top: 12px;
    font-size: 11px;
    color: #9ca3af;
  }
`

class DefinitionPanel {
  private root?: ShadowRoot

  constructor() {
    document.addEventListener('mouseup', (event) => this.onSelect(event))
  }

  onShow(definition: Definition): void {
    this.ensurePanel()
    this.render(definition)
    this.positionNearSelection()
  }

  onHide(): void {
    this.root?.host.remove()
    this.root = undefined
  }

  private onSelect(event: MouseEvent): void {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const text = selection.toString().trim()
    if (!text || text.length > 100) return

    if (this.isInsidePanel(event.target as Node)) return

    chrome.runtime
      .sendMessage({ type: 'LOOKUP_WORD', word: text })
      .then((response) => {
        if (response?.ok) {
          this.onShow(response.definition)
        }
      })
      .catch(() => {
        return
      })
  }

  private isInsidePanel(node: Node | null): boolean {
    return Boolean(node && this.root && this.root.contains(node))
  }

  private ensurePanel(): void {
    if (this.root) return

    const host = document.createElement('div')
    host.id = 'dicionario-ia-panel-host'
    const shadow = host.attachShadow({ mode: 'open' })

    const style = document.createElement('style')
    style.textContent = PANEL_STYLES

    const panel = document.createElement('div')
    panel.className = 'dia-panel'
    panel.addEventListener('mousedown', (event) => event.stopPropagation())

    shadow.appendChild(style)
    shadow.appendChild(panel)
    document.documentElement.appendChild(host)

    this.root = shadow
  }

  private render(definition: Definition): void {
    const panel = this.root?.querySelector('.dia-panel') as HTMLElement | null
    if (!panel) return

    const examples = definition.examples.length
      ? `<ul class="dia-panel__list">${definition.examples.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
      : '<p class="dia-panel__meaning">Sem exemplos.</p>'

    const synonyms = definition.synonyms.length
      ? `<ul class="dia-panel__list">${definition.synonyms.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      : '<p class="dia-panel__meaning">Sem sinônimos.</p>'

    panel.innerHTML = `
      <div class="dia-panel__header">
        <p class="dia-panel__word">${escapeHtml(definition.word)}</p>
        <button class="dia-panel__close" aria-label="Fechar">&times;</button>
      </div>
      <p class="dia-panel__meaning">${escapeHtml(definition.meaning)}</p>
      <p class="dia-panel__section">Exemplos</p>
      ${examples}
      <p class="dia-panel__section">Sinônimos</p>
      ${synonyms}
      <p class="dia-panel__source">${escapeHtml(definition.source)}</p>
    `

    panel.querySelector('.dia-panel__close')?.addEventListener('click', () => this.onHide())
  }

  private positionNearSelection(): void {
    const host = this.root?.host as HTMLElement | null
    const panel = this.root?.querySelector('.dia-panel') as HTMLElement | null
    const selection = window.getSelection()
    if (!host || !panel || !selection || selection.rangeCount === 0) return

    const rect = selection.getRangeAt(0).getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()

    let x = rect.left + window.scrollX
    let y = rect.bottom + window.scrollY + 8

    if (x + panelRect.width > window.scrollX + window.innerWidth) {
      x = window.innerWidth - panelRect.width - 8
    }
    if (y + panelRect.height > window.scrollY + window.innerHeight) {
      y = rect.top + window.scrollY - panelRect.height - 8
    }

    host.style.left = `${Math.max(8, x)}px`
    host.style.top = `${Math.max(8, y)}px`
  }
}

function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char)
}

const panel = new DefinitionPanel()

chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'SHOW_DEFINITION') {
    panel.onShow(message.definition)
  } else if (message.type === 'HIDE_DEFINITION') {
    panel.onHide()
  }
})
