# Dicionário IA — Extensão para Chrome

Extensão de dicionário com IA para o Google Chrome, construída com:

- **TypeScript**
- **React 19**
- **Vite 8** (+ [CRXJS](https://crxjs.dev) para build de extensões)
- **Manifest V3**
- **Tailwind CSS 4**
- **Chrome Extension APIs**

## Estrutura

```
src/
├── manifest.json          # Manifesto V3 (entradas da extensão)
├── global.css             # Estilos globais (Tailwind)
├── background/index.ts    # Service worker (menus de contexto, mensagens, configurações)
├── content/index.ts       # Script de conteúdo (painel de definição sobre a página)
├── popup/                 # Popup da extensão (React + Tailwind)
├── options/               # Página de opções (React + Tailwind)
├── services/              # Provedor de definições (integração com IA)
└── types/messages.ts      # Contrato de mensagens e tipos compartilhados
```

## Scripts

```bash
npm install    # instala as dependências
npm run dev    # modo desenvolvimento com HMR
npm run build  # gera o bundle em dist/
npm run typecheck
```

## Como carregar no Chrome

1. Rode `npm run build` (ou `npm run dev` e use o HMR).
2. Acesse `chrome://extensions` no Google Chrome.
3. Ative o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta `dist/`.
5. Teste: selecione um texto em qualquer página ou use o menu de contexto para ver a definição.

## Configurando a API de IA

Na página de opções da extensão você pode definir um endpoint e chave de API.
A implementação real da chamada de IA está marcada com `TODO` em
`src/services/dictionaryService.ts` — até lá a extensão usa um modo de demonstração.
