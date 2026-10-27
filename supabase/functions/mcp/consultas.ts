/**
 * As leituras do MCP, uma por tabela, sempre com o cliente da pessoa (RLS):
 * nenhuma usa a service role. Erro do PostgREST sobe como está, e o
 * `index.ts` o traduz por `mensagemDoErroDoBanco`.
 */
import type { SupabaseContext } from 'npm:@supabase/server@^1.6'
import type { CardTxRow } from '../_shared/credit-card-cycle.ts'
import type { CartaoParaCasar, LinhaHistorico } from '../_shared/frase.ts'
import type { Carteira } from '../_shared/mcp/resposta.ts'
import type { Categoria, LinhaLancamento } from '../_shared/mcp/resumo.ts'
import type { Cartao } from '../_shared/mcp/faturas.ts'

type Cliente = SupabaseContext['supabase']
type Resultado<T> = { data: T | null; error: { code?: string; message?: string } | null }

function linhas<T>(r: Resultado<T>): T {
  if (r.error) throw r.error
  return r.data as T
}

// `date` é timestamptz: o dia vira a faixa inteira, como o resto do app filtra.
const inicioDoDia = (ymd: string) => `${ymd}T00:00:00.000Z`
const fimDoDia = (ymd: string) => `${ymd}T23:59:59.999Z`

export async function carteirasDaPessoa(supabase: Cliente, userId: string): Promise<(Carteira & { role: string })[]> {
  const r = linhas(
    await supabase.from('workspace_members').select('role, workspaces(id, name, type)').eq('user_id', userId),
  ) as unknown as { role: string; workspaces: Carteira | null }[]
  return r.filter((m) => m.workspaces).map((m) => ({ ...m.workspaces!, role: m.role }))
}

export async function categorias(supabase: Cliente, carteiraId: string): Promise<Categoria[]> {
  return linhas(
    await supabase.from('categories').select('id, name, type').eq('workspace_id', carteiraId).order('name'),
  ) as Categoria[]
}

export type LinhaDaLista = {
  id: string
  date: string
  description: string | null
  amount: string | number
  type: 'income' | 'expense'
  payment_method: string | null
  needs_review: boolean
  categories: { name: string } | null
  credit_cards: { name: string } | null
}

export async function lancamentos(
  supabase: Cliente,
  carteiraId: string,
  f: { de: string; ate: string; tipo?: 'income' | 'expense'; categoriaId?: string; cartaoId?: string; busca?: string; limite: number },
): Promise<LinhaDaLista[]> {
  let q = supabase
    .from('transactions')
    .select('id, date, description, amount, type, payment_method, needs_review, categories(name), credit_cards(name)')
    .eq('workspace_id', carteiraId)
    .gte('date', inicioDoDia(f.de))
    .lte('date', fimDoDia(f.ate))
  if (f.tipo) q = q.eq('type', f.tipo)
  if (f.categoriaId) q = q.eq('category_id', f.categoriaId)
  if (f.cartaoId) q = q.eq('payment_credit_card_id', f.cartaoId)
  // `%`, `_` e `\` da busca são texto, não curinga.
  if (f.busca) q = q.ilike('description', `%${f.busca.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
  return linhas(await q.order('date', { ascending: false }).limit(f.limite)) as unknown as LinhaDaLista[]
}

/** As linhas que `resumo.ts` e `faturas.ts` somam, de `de` a `ate`. */
export async function linhasParaSomar(
  supabase: Cliente,
  carteiraId: string,
  de: string,
  ate: string,
): Promise<(LinhaLancamento & CardTxRow)[]> {
  return linhas(
    await supabase
      .from('transactions')
      .select('amount, type, date, category_id, payment_method, payment_credit_card_id')
      .eq('workspace_id', carteiraId)
      .gte('date', inicioDoDia(de))
      .lte('date', fimDoDia(ate)),
  ) as (LinhaLancamento & CardTxRow)[]
}

export async function orcamentos(
  supabase: Cliente,
  carteiraId: string,
  ano: number,
  mes: number,
): Promise<{ category_id: string; amount: string | number }[]> {
  return linhas(
    await supabase
      .from('budgets')
      .select('category_id, amount')
      .eq('workspace_id', carteiraId)
      .eq('year', ano)
      .eq('month', mes),
  ) as { category_id: string; amount: string | number }[]
}

export async function cartoes(supabase: Cliente, carteiraId: string): Promise<(Cartao & CartaoParaCasar)[]> {
  return linhas(
    await supabase
      .from('credit_cards')
      .select('id, name, closing_day, due_day, last_four, wallet_alias, workspace_id, is_active')
      .eq('workspace_id', carteiraId)
      .eq('is_active', true)
      .order('name'),
  ) as (Cartao & CartaoParaCasar)[]
}

export async function totaisDasFaturas(
  supabase: Cliente,
  carteiraId: string,
  de: string,
  ate: string,
): Promise<{ credit_card_id: string; statement_close_date: string; bank_total: string | number }[]> {
  return linhas(
    await supabase
      .from('credit_card_statement_totals')
      .select('credit_card_id, statement_close_date, bank_total')
      .eq('workspace_id', carteiraId)
      .gte('statement_close_date', de)
      .lte('statement_close_date', ate),
  ) as { credit_card_id: string; statement_close_date: string; bank_total: string | number }[]
}

export async function instanciasDeContas(
  supabase: Cliente,
  carteiraId: string,
  ate: string,
): Promise<{ id: string; nome: string; due_date: string; amount: string | number | null; status: 'pending' | 'paid' | 'skipped' }[]> {
  const r = linhas(
    await supabase
      .from('bill_instances')
      .select('id, due_date, amount, status, bills!inner(name)')
      .eq('workspace_id', carteiraId)
      .eq('status', 'pending')
      .lte('due_date', ate)
      .order('due_date'),
  ) as unknown as { id: string; due_date: string; amount: string | number | null; status: 'pending'; bills: { name: string } }[]
  return r.map(({ bills, ...i }) => ({ ...i, nome: bills.name }))
}

export async function assinaturas(supabase: Cliente, carteiraId: string) {
  return linhas(
    await supabase
      .from('workspace_subscriptions')
      .select('id, name, amount, billing_interval, next_billing_date, is_active')
      .eq('workspace_id', carteiraId)
      .eq('is_active', true)
      .order('name'),
  ) as {
    id: string
    name: string
    amount: string | number
    billing_interval: 'weekly' | 'monthly' | 'bimonthly' | 'yearly'
    next_billing_date: string | null
    is_active: boolean
  }[]
}

/** O mesmo recorte da captura: as 300 mais recentes, para sugerir categoria e forma. */
export async function historico(supabase: Cliente, carteiraId: string): Promise<LinhaHistorico[]> {
  return linhas(
    await supabase
      .from('transactions')
      .select('description, category_id, payment_method, payment_credit_card_id, date, type')
      .eq('workspace_id', carteiraId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(300),
  ) as LinhaHistorico[]
}
