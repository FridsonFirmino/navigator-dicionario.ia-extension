export const TRANSLATION_CONTEXTS = [
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
] as const;

export const DEFAULT_TRANSLATION_CONTEXT = TRANSLATION_CONTEXTS[0].label;
export const TRANSLATION_CONTEXT_STORAGE_KEY = "translationContext";
