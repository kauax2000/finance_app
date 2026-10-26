/**
 * Os projetos e os modelos de carteira (Bloco 7C), lidos e escritos com
 * tolerância (Ruling 8 do 7B): o dev roda contra o banco de produção, que
 * ainda não tem a tabela `projects` nem a RPC `criar_carteira_de_modelo`.
 * Sem elas, tudo aqui devolve `{ disponivel: false }`, e a tela mostra
 * "Ainda não disponível" em vez de quebrar. As telas só tocam o banco do 7C
 * por aqui.
 */
import { supabase, type Project } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { fetchAllRows } from "@/lib/queries/fetch-all-rows"
import type { CamposDaCarteiraProjeto, ModeloDeCarteira } from "@/lib/projetos/modelos"
import type { LancamentoDoResumo } from "@/lib/projetos/resumo"

export const AINDA_NAO_DISPONIVEL = "Ainda não disponível"

export type Tolerante<T> = { disponivel: false } | { disponivel: true; dados: T }

type Erro = { code?: string; message?: string } | null

/** A tabela ou a coluna que o banco ainda não tem. */
const TABELA_AUSENTE = new Set(["PGRST205", "PGRST204", "PGRST200", "42P01", "42703"])
/** A RPC que o banco ainda não tem. */
const RPC_AUSENTE = new Set(["PGRST202", "42883"])

function falhou(erro: Erro, ausente: Set<string>): Tolerante<never> {
    if (erro?.code && ausente.has(erro.code)) return { disponivel: false }
    throw new Error(formatSupabasePostgrestError(erro) ?? erro?.message ?? "Não foi possível falar com o banco.")
}

/** Uma leitura ou escrita numa tabela nova do 7C: a ausência dela não é erro. */
export async function tabelaTolerante<T>(consulta: PromiseLike<{ data: unknown; error: Erro }>): Promise<Tolerante<T>> {
    const { data, error } = await consulta
    if (error) return falhou(error, TABELA_AUSENTE)
    return { disponivel: true, dados: data as T }
}

/** Uma RPC nova do 7C: a ausência dela não é erro. */
export async function rpcTolerante<T>(nome: string, args: Record<string, unknown>): Promise<Tolerante<T>> {
    const { data, error } = await supabase.rpc(nome, args)
    if (error) return falhou(error, RPC_AUSENTE)
    return { disponivel: true, dados: data as T }
}

export type CamposDoProjeto = {
    name: string
    starts_on: string | null
    ends_on: string | null
    budget_total: number | null
}

export type ProjetoComLancamentos = Project & { transactions: LancamentoDoResumo[] }

export function listarProjetos(workspaceId: string) {
    return tabelaTolerante<Project[]>(
        supabase.from("projects").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
    )
}

/**
 * Um projeto com os lançamentos dele, pelo embed da chave `project_id`: a
 * consulta só existe quando a tabela existe, e a RLS das transações vale.
 */
export function lerProjeto(id: string) {
    return tabelaTolerante<ProjetoComLancamentos | null>(
        supabase.from("projects").select("*, transactions(amount, type, category_id, user_id)").eq("id", id).maybeSingle(),
    )
}

/** Insert e update, nunca upsert: o update só alcança as colunas que a tela edita. */
export function criarProjeto(workspaceId: string, campos: CamposDoProjeto) {
    return tabelaTolerante<null>(supabase.from("projects").insert({ workspace_id: workspaceId, ...campos }))
}

export function editarProjeto(id: string, campos: Partial<CamposDoProjeto> & { archived_at?: string | null }) {
    return tabelaTolerante<null>(supabase.from("projects").update(campos).eq("id", id))
}

/** A carteira nova de um modelo; a `pessoal` devolve a que já existe. */
export function criarCarteiraDeModelo(modelo: ModeloDeCarteira, nome: string) {
    return rpcTolerante<string>("criar_carteira_de_modelo", { p_modelo: modelo, p_nome: nome })
}

/**
 * As datas e o orçamento total da carteira de projeto: um update simples (a
 * política do dono deixa). Sem as colunas no banco, indisponível.
 */
export function editarCarteiraProjeto(workspaceId: string, campos: CamposDaCarteiraProjeto) {
    return tabelaTolerante<{ id: string }[]>(supabase.from("workspaces").update(campos).eq("id", workspaceId).select("id"))
}

/** As despesas de uma carteira de projeto, para o resumo do Painel, todas as páginas. Sem coluna do 7C. */
export function lancamentosDaCarteira(workspaceId: string): Promise<LancamentoDoResumo[]> {
    return fetchAllRows<LancamentoDoResumo>((from, to) =>
        supabase
            .from("transactions")
            .select("id, amount, type, category_id, user_id")
            .eq("workspace_id", workspaceId)
            .eq("type", "expense")
            .order("id")
            .range(from, to),
    )
}
