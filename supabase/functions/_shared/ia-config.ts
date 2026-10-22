/**
 * A cadeia de modelos da IA, por tarefa: o primeiro que responder JSON válido
 * vence. IDs conferidos em 22/10/2026 nas páginas da Groq e da Cloudflare.
 * O `qwen/qwen3.8-27b` da Groq é *preview* e pode sair sem aviso: a Cloudflare
 * cobre.
 */

export type Provedor = 'groq' | 'cloudflare'
export type Tarefa = 'texto' | 'imagem' | 'fatura'

/**
 * O que muda por modelo mora aqui, nunca num `if` sobre o nome em `ia.ts`:
 * - `extra` entra no corpo do pedido (o gpt-oss pensa, e o pensamento gasta o
 *   `max_tokens`: `reasoning_effort: "low"` o encurta);
 * - `semPensar` acrescenta `/no_think` ao prompt (o Qwen3 pula o bloco
 *   `<think>`).
 */
export type ElosDaCadeia = Array<{
  provedor: Provedor
  modelo: string
  extra?: Record<string, unknown>
  semPensar?: boolean
}>

const RACIOCINIO_CURTO = { reasoning_effort: 'low' }

export const CADEIA: Record<Tarefa, ElosDaCadeia> = {
  texto: [
    { provedor: 'groq', modelo: 'openai/gpt-oss-20b', extra: RACIOCINIO_CURTO },
    { provedor: 'cloudflare', modelo: '@cf/qwen/qwen3-30b-a3b-fp8', semPensar: true },
  ],
  imagem: [
    { provedor: 'groq', modelo: 'qwen/qwen3.8-27b' },
    { provedor: 'cloudflare', modelo: '@cf/meta/llama-4-scout-17b-16e-instruct' },
  ],
  fatura: [
    { provedor: 'groq', modelo: 'openai/gpt-oss-120b', extra: RACIOCINIO_CURTO },
    { provedor: 'cloudflare', modelo: '@cf/qwen/qwen3-30b-a3b-fp8', semPensar: true },
  ],
}

/** Teto de tokens da resposta de uma frase ou de uma imagem (o pensamento conta). */
export const MAX_TOKENS_CAMPOS = 1500
/** Teto de tokens da resposta de cada fatia de fatura. */
export const MAX_TOKENS_FATIA = 8000

/** Prazo de cada chamada a um provedor. */
export const PRAZO_MS = 10_000
/** Chamadas de IA por pessoa por dia (dia de São Paulo). */
export const LIMITE_DIARIO = 30
/** Caracteres por fatia do texto de uma fatura. */
export const FATIA_FATURA = 12_000
/** Acima disso, a fatura não vai à IA (`fatura_grande`). */
export const MAX_FATIAS = 6
