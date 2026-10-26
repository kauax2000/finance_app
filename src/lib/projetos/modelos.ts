import { parseMoneyBrl } from "@/lib/money-brl"
import type { WorkspacePurpose, WorkspaceSplitMode } from "@/lib/supabase"

/** A regra mostrada ao escolher (spec §12, literal). */
export const REGRA_DA_ESCOLHA =
    "Vai usar o cartão da casa e são as mesmas pessoas? É um projeto. Gente de fora ou dinheiro separado? É uma carteira."

/** O `p_modelo` de `criar_carteira_de_modelo`. */
export type ModeloDeCarteira = "casa" | "casal" | "pessoal" | "viagem" | "reforma" | "evento"

export type DefinicaoDeModelo = {
    id: ModeloDeCarteira
    rotulo: string
    descricao: string
    purpose: WorkspacePurpose
    split_mode: WorkspaceSplitMode
}

/** Os seis modelos (spec §12, Decisão 3): os pares batem com a RPC. */
export const MODELOS_DE_CARTEIRA: readonly DefinicaoDeModelo[] = [
    { id: "casa", rotulo: "Casa", descricao: "O dia a dia da casa, num pote único.", purpose: "everyday", split_mode: "pooled" },
    { id: "casal", rotulo: "Casal", descricao: "O dia a dia a dois, com as despesas divididas.", purpose: "everyday", split_mode: "split" },
    { id: "pessoal", rotulo: "Pessoal", descricao: "A sua carteira pessoal, que já existe.", purpose: "everyday", split_mode: "pooled" },
    { id: "viagem", rotulo: "Viagem", descricao: "Uma viagem com dinheiro separado, dividida.", purpose: "project", split_mode: "split" },
    { id: "reforma", rotulo: "Reforma", descricao: "Uma obra com orçamento próprio, dividida.", purpose: "project", split_mode: "split" },
    { id: "evento", rotulo: "Evento", descricao: "Uma festa ou evento, com as despesas divididas.", purpose: "project", split_mode: "split" },
]

/**
 * O orçamento total digitado (do projeto e da carteira de projeto): pt-BR,
 * vazio é nulo, e o que não é maior que zero é recusado antes do check do banco.
 */
export function orcamentoTotal(texto: string): { ok: true; valor: number | null } | { ok: false; erro: string } {
    if (!texto.trim()) return { ok: true, valor: null }
    const valor = parseMoneyBrl(texto)
    if (valor == null || valor <= 0) return { ok: false, erro: "O orçamento total precisa ser maior que zero." }
    return { ok: true, valor }
}

export type CamposDaCarteiraProjeto = { starts_on: string | null; ends_on: string | null; budget_total: number | null }

/**
 * O que o formulário da carteira de projeto grava (spec §12: "datas e
 * orçamento total, sem ciclo"). O dinheiro vem em pt-BR; vazio é nulo; o fim
 * não vem antes do começo (o check `workspaces_project_fields` não confere isso).
 */
export function camposDaCarteiraProjeto(a: {
    inicio: string
    fim: string
    orcamento: string
}): { ok: true; campos: CamposDaCarteiraProjeto } | { ok: false; erro: string } {
    const inicio = a.inicio || null
    const fim = a.fim || null
    if (inicio && fim && fim < inicio) return { ok: false, erro: "O fim não pode vir antes do começo." }
    const orcamento = orcamentoTotal(a.orcamento)
    if (!orcamento.ok) return orcamento
    return { ok: true, campos: { starts_on: inicio, ends_on: fim, budget_total: orcamento.valor } }
}
