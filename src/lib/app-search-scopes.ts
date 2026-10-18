import { normalizeSearchText } from "@/lib/command-filter"

export type EscopoId =
  | "telas"
  | "acoes"
  | "transacoes"
  | "cartoes"
  | "categorias"
  | "parcelas"
  | "assinaturas"
  | "contas"
  | "membros"
  | "carteiras"

export type Escopo = { id: EscopoId; comando: string; rotulo: string; aliases: string[] }

/** Os escopos do "/comando" da paleta, na ordem em que a lista os mostra. */
export const ESCOPOS: readonly Escopo[] = [
  { id: "telas", comando: "/telas", rotulo: "Telas", aliases: ["paginas"] },
  { id: "acoes", comando: "/acoes", rotulo: "Ações", aliases: ["adicionar", "novo"] },
  { id: "transacoes", comando: "/transacoes", rotulo: "Transações", aliases: ["lancamentos", "gastos"] },
  { id: "cartoes", comando: "/cartoes", rotulo: "Cartões", aliases: ["fatura"] },
  { id: "categorias", comando: "/categorias", rotulo: "Categorias", aliases: [] },
  { id: "parcelas", comando: "/parcelas", rotulo: "Compras parceladas", aliases: ["parceladas"] },
  { id: "assinaturas", comando: "/assinaturas", rotulo: "Assinaturas", aliases: ["recorrentes"] },
  { id: "contas", comando: "/contas", rotulo: "Contas a pagar", aliases: ["boletos"] },
  { id: "membros", comando: "/membros", rotulo: "Membros", aliases: ["pessoas"] },
  { id: "carteiras", comando: "/carteiras", rotulo: "Carteiras", aliases: ["workspaces"] },
]

/** Os nomes que levam a um escopo, já sem acento e sem caixa: o comando (sem a barra) e os aliases. */
function nomes(escopo: Escopo): string[] {
  return [escopo.comando.slice(1), ...escopo.aliases].map(normalizeSearchText)
}

/**
 * `null` quando o termo não é comando (não começa com "/"). Senão: o que vem
 * depois da barra até o primeiro espaço (`parcial`), se houve espaço
 * (`fechado`) e o resto depois dele (`resto`, aparado à esquerda).
 */
export function lerComando(termo: string): { parcial: string; fechado: boolean; resto: string } | null {
  const m = /^\/(\S*)(\s?)\s*([\s\S]*)$/.exec(termo)
  if (!m) return null
  return { parcial: m[1], fechado: m[2] !== "", resto: m[3] }
}

/** Os escopos cujo comando ou alias começa por `parcial`; `""` devolve todos. */
export function casarEscopos(parcial: string): Escopo[] {
  const q = normalizeSearchText(parcial)
  return ESCOPOS.filter((e) => nomes(e).some((n) => n.startsWith(q)))
}

/** O escopo cujo comando ou alias é exatamente `parcial`, ou `null`. */
export function escopoExato(parcial: string): Escopo | null {
  const q = normalizeSearchText(parcial)
  return ESCOPOS.find((e) => nomes(e).includes(q)) ?? null
}
