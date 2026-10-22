import type { Definition, Settings } from '../types/messages'

/**
 * Provedor de definições de palavras.
 *
 * TODO: substituir a implementação de exemplo por uma chamada real a uma API de IA
 * (o endpoint e a chave são configurados pelo usuário na página de opções e
 * ficam disponíveis em `settings`).
 */
export async function lookupWord(
  word: string,
  settings: Settings,
  context?: string,
): Promise<Definition> {
  if (settings.apiEndpoint) {
    // TODO: integrar com a API de IA configurada em `settings.apiEndpoint`.
    return fetchDefinitionFromApi(word, settings, context)
  }

  return buildPlaceholderDefinition(word, context)
}

async function fetchDefinitionFromApi(
  _word: string,
  _settings: Settings,
  _context?: string,
): Promise<Definition> {
  throw new Error(
    'Integração com a API de IA ainda não implementada. Configure um provedor ou aguarde a próxima versão.',
  )
}

function buildPlaceholderDefinition(word: string, context?: string): Definition {
  const normalized = word.charAt(0).toUpperCase() + word.slice(1)

  return {
    word,
    meaning: `Significado de "${normalized}"${context ? ` no contexto de ${context}` : ""}. Conecte uma API de IA nas opções da extensão para obter definições reais geradas por inteligência artificial.`,
    examples: [
      `Exemplo de uso 1 de "${word}".`,
      `Exemplo de uso 2 de "${word}".`,
    ],
    synonyms: ['sinônimo 1', 'sinônimo 2', 'sinônimo 3'],
    source: 'Dicionário IA (modo de demonstração)',
  }
}
