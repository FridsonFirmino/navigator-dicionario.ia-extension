# Dicionário.IA

[![Pipeline CI](https://github.com/FridsonFirmino/navigator-dicionario.ia-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/FridsonFirmino/navigator-dicionario.ia-extension/actions/workflows/ci.yml)

Extensão para Google Chrome que ajuda a pesquisar termos e expressões técnicas, incluindo texto selecionado numa página e um contexto de conhecimento escolhido pelo utilizador.

> **Estado atual:** a estrutura da extensão e as interfaces estão implementadas, mas a integração com um serviço de IA ainda está pendente. As consultas usam dados de demonstração. O endpoint e a chave nas opções ainda não executam uma chamada real.

## Funcionalidades

- Abre uma interface no painel lateral do Chrome ao clicar no ícone da extensão.
- Permite pesquisar um termo ou expressão pelo painel lateral.
- No menu de contexto, permite escolher uma área para o texto selecionado, como Economia, Tecnologia, Ciências, Saúde ou Direito.
- Apresenta definição, exemplos e termos relacionados.
- Inclui tema claro e escuro, com preferência guardada no navegador.
- Guarda as opções da extensão em `chrome.storage.sync`.

## Tecnologias

- TypeScript
- React 19
- Vite 8 e CRXJS
- Tailwind CSS 4
- Chrome Extensions Manifest V3

## Requisitos

- Node.js `^20.19.0` ou `>=22.12.0`
- pnpm `12.8.1` (versão usada pelo pipeline CI)
- Google Chrome para carregar e utilizar a extensão

## Desenvolvimento

Instale as dependências a partir do `pnpm-lock.yaml` e inicie o servidor de desenvolvimento:

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

Comandos disponíveis:

| Comando | Descrição |
| --- | --- |
| `pnpm run dev` | Inicia o Vite em modo de desenvolvimento. |
| `pnpm run typecheck` | Verifica os tipos TypeScript sem gerar ficheiros. |
| `pnpm run build` | Verifica os tipos e cria a extensão em `dist/`. |
| `pnpm run preview` | Serve a build para pré-visualização. |

## Carregar no Chrome

1. Execute `pnpm run build`.
2. Abra `chrome://extensions` no Chrome.
3. Ative o **Modo do programador**.
4. Clique em **Carregar sem compactação** e selecione a pasta `dist/`.
5. Clique no ícone da extensão para abrir o painel lateral.
6. Para consultar texto de uma página, selecione-o, clique com o botão direito e escolha **Traduzir no contexto de…**. Depois, selecione a área de conhecimento.

## Estrutura do projeto

```text
src/
├── background/background.ts  # Service worker, menu de contexto e mensagens
├── options/                  # Página de opções
├── popup/                    # Interface React reutilizada pelo painel lateral
├── services/                 # Serviço de consulta e dados de demonstração
├── sidepanel/                # Página do painel lateral do Chrome
├── types/messages.ts         # Tipos de mensagens e dados partilhados
├── utils/storage.ts          # Leitura e gravação de opções
├── global.css                # Tokens de tema e estilos globais
├── theme-init.ts             # Aplica o tema antes da renderização da interface
└── manifest.json             # Configuração Manifest V3 da extensão
```

## Pipeline CI

O GitHub Actions executa o pipeline definido em `.github/workflows/ci.yml` em cada push, pull request e também manualmente. O fluxo:

1. Instala as dependências com `pnpm install --frozen-lockfile`.
2. Executa `pnpm run typecheck`.
3. Executa `pnpm run build`.
4. Publica a pasta `dist/` como artefacto descarregável da execução, retido por sete dias.

O pipeline valida e empacota a extensão; não publica automaticamente na Chrome Web Store.

## Releases automáticas

O workflow `.github/workflows/release.yml` cria uma GitHub Release quando um tag começado por `v` é enviado. A release inclui um ZIP com o conteúdo de `dist/`, pronto para extrair e carregar no Chrome.

Para publicar uma versão, atualize o campo `version` em `package.json` e em `src/manifest.json` para o mesmo valor. Depois, crie e envie o tag com o prefixo `v` correspondente:

```bash
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
```

O workflow usa o `GITHUB_TOKEN` fornecido pelo GitHub Actions e requer a permissão de escrita em `contents`, já declarada no próprio workflow.

## Integração com IA

A página de opções permite preencher um endpoint, uma chave de API e o idioma. A chamada real ainda está marcada como `TODO` em `src/services/dictionaryService.ts`. Até essa integração ser implementada, a extensão apresenta definições fictícias de demonstração.
