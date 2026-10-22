/**
 * A cadeia de modelos da IA, por tarefa: o primeiro que responder JSON válido
 * vence. IDs conferidos em 22/10/2026 nas páginas da Groq e da Cloudflare.
 * O `qwen/qwen3.8-27b` da Groq é *preview* e pode sair sem aviso: a Cloudflare
 * cobre.
 */

export type Provedor = 'groq' | 'cloudflare'
export type Tarefa = 'texto' | 'imagem' | 'fatura'

export const CADEIA: Record<Tarefa, Array<{ provedor: Provedor; modelo: string }>> = {
  texto: [
    { provedor: 'groq', modelo: 'openai/gpt-oss-20b' },
    { provedor: 'cloudflare', modelo: '@cf/qwen/qwen3-30b-a3b-fp8' },
  ],
  imagem: [
    { provedor: 'groq', modelo: 'qwen/qwen3.8-27b' },
    { provedor: 'cloudflare', modelo: '@cf/meta/llama-4-scout-17b-16e-instruct' },
  ],
  fatura: [
    { provedor: 'groq', modelo: 'openai/gpt-oss-120b' },
    { provedor: 'cloudflare', modelo: '@cf/qwen/qwen3-30b-a3b-fp8' },
  ],
}

/** Prazo de cada chamada a um provedor. */
export const PRAZO_MS = 10_000
/** Chamadas de IA por pessoa por dia (dia de São Paulo). */
export const LIMITE_DIARIO = 30
/** Caracteres por fatia do texto de uma fatura. */
export const FATIA_FATURA = 12_000
/** Acima disso, a fatura não vai à IA (`fatura_grande`). */
export const MAX_FATIAS = 6
