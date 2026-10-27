/**
 * O MCP do Finance App (Claude, ChatGPT): servidor remoto Streamable HTTP, com
 * o OAuth 2.1 do Supabase Auth. Toda ferramenta roda como a pessoa (o cliente
 * do `withSupabase`, RLS); nenhuma usa a service role. A conta mora em
 * `_shared/mcp/`, as leituras em `consultas.ts`; aqui só se registram as
 * ferramentas. Só `registrar_lancamento` grava, e nada edita nem apaga.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createMcpHandler, McpServer } from 'npm:@modelcontextprotocol/server@^2.0.0'
import { pipeline } from 'npm:@supabase/middleware@1'
import { type SupabaseContext, withOAuthProtectedResource, withSupabase } from 'npm:@supabase/server@^1.6'
import { z } from 'npm:zod@^4.3.6'
import { addCalendarDays, appTodayYmd, formatYmd, statementTotalKey } from '../_shared/credit-card-cycle.ts'
import { assinaturasAtivas, contasAPagar } from '../_shared/mcp/compromissos.ts'
import { faturaDoCartao, janelaDasFaturas } from '../_shared/mcp/faturas.ts'
import { montarLancamentoDaIA } from '../_shared/mcp/lancamento.ts'
import { dataValida, intervaloDoMes, mesAnterior, mesDe } from '../_shared/mcp/periodo.ts'
import { type Carteira, dinheiro, escolherCarteira, falha, mensagemDoErroDoBanco, ok } from '../_shared/mcp/resposta.ts'
import { orcamentosDoMes, resumoDoMes } from '../_shared/mcp/resumo.ts'
import * as consultas from './consultas.ts'

// Como na captura: no Deno puro (testes) não existe.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined

/** Recusa com a frase para a IA (entrada que não fecha), distinta do erro do banco. */
class Recusa extends Error {}

const LEITURA = { readOnlyHint: true }
const TIPO = { despesa: 'expense', receita: 'income' } as const
const TIPO_PT = { expense: 'despesa', income: 'receita' } as const
const FORMA_PT: Record<string, string> = {
  pix: 'pix', debit_card: 'debito', credit_card: 'credito', cash: 'dinheiro', ted: 'ted', other: 'outro',
}

const carteiraId = z.string().optional().describe('Id da carteira (de listar_carteiras). Sem ele, a carteira pessoal.')
const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido: use AAAA-MM.').optional()
  .describe('Mês AAAA-MM. Padrão: o mês atual.')
const data = z.string().refine(dataValida, 'Data inválida: use AAAA-MM-DD.')

export function servidor(ctx: SupabaseContext) {
  const { supabase } = ctx
  const userId = ctx.userClaims!.id
  const clientId = typeof ctx.jwtClaims?.client_id === 'string' ? ctx.jwtClaims.client_id : null
  const hojeYmd = appTodayYmd()
  const hoje = formatYmd(hojeYmd)

  async function naCarteira(pedida: string | undefined, fazer: (c: Carteira) => Promise<Record<string, unknown>>) {
    try {
      const escolha = escolherCarteira(await consultas.carteirasDaPessoa(supabase, userId), pedida)
      if ('erro' in escolha) return falha(escolha.erro)
      const c = escolha.carteira
      return ok({ carteira: { id: c.id, nome: c.name }, ...(await fazer(c)) })
    } catch (e) {
      if (e instanceof Recusa) return falha(e.message)
      console.error('mcp:', e)
      return falha(mensagemDoErroDoBanco(e as { code?: string; message?: string }))
    }
  }

  const server = new McpServer({ name: 'finance-app', version: '1.0.0' })

  server.registerTool('listar_carteiras', {
    description: 'Lista as carteiras da pessoa (id, nome, tipo e papel); use os ids nas outras ferramentas.',
    inputSchema: z.object({}),
    annotations: LEITURA,
  }, async () => {
    try {
      const lista = await consultas.carteirasDaPessoa(supabase, userId)
      const escolha = escolherCarteira(lista)
      return ok({
        carteiras: lista.map((c) => ({ id: c.id, nome: c.name, tipo: c.type === 'personal' ? 'pessoal' : 'compartilhada', papel: c.role })),
        carteira: 'carteira' in escolha ? { id: escolha.carteira.id, nome: escolha.carteira.name } : null,
      })
    } catch (e) {
      console.error('mcp:', e)
      return falha(mensagemDoErroDoBanco(e as { code?: string; message?: string }))
    }
  })

  server.registerTool('listar_categorias', {
    description: 'Lista as categorias de despesa e receita de uma carteira.',
    inputSchema: z.object({ carteira_id: carteiraId }),
    annotations: LEITURA,
  }, ({ carteira_id }) =>
    naCarteira(carteira_id, async (c) => ({
      categorias: (await consultas.categorias(supabase, c.id)).map((x) => ({ id: x.id, nome: x.name, tipo: TIPO_PT[x.type] })),
    })))

  server.registerTool('listar_lancamentos', {
    description: 'Lista lançamentos de um período (padrão: o mês atual), com filtros por tipo, categoria, cartão e texto.',
    inputSchema: z.object({
      carteira_id: carteiraId,
      de: data.optional().describe('Início AAAA-MM-DD. Padrão: dia 1 do mês atual.'),
      ate: data.optional().describe('Fim AAAA-MM-DD. Padrão: o último dia do mês atual.'),
      tipo: z.enum(['despesa', 'receita']).optional(),
      categoria_id: z.string().optional().describe('Id de listar_categorias.'),
      cartao_id: z.string().optional().describe('Id de faturas_dos_cartoes.'),
      busca: z.string().max(100).optional().describe('Texto contido na descrição.'),
      limite: z.number().int().min(1).max(100).optional().describe('Quantos, de 1 a 100. Padrão: 50.'),
    }),
    annotations: LEITURA,
  }, (a) =>
    naCarteira(a.carteira_id, async (c) => {
      const doMes = intervaloDoMes(mesDe(hoje))
      const de = a.de ?? doMes.inicio
      const ate = a.ate ?? doMes.fim
      if (de > ate) throw new Recusa('O início do período vem depois do fim.')
      const linhas = await consultas.lancamentos(supabase, c.id, {
        de, ate, tipo: a.tipo && TIPO[a.tipo], categoriaId: a.categoria_id, cartaoId: a.cartao_id, busca: a.busca,
        limite: a.limite ?? 50,
      })
      return {
        de,
        ate,
        lancamentos: linhas.map((l) => ({
          id: l.id,
          data: l.date.slice(0, 10),
          descricao: l.description,
          valor: dinheiro(Math.round(Number(l.amount) * 100)),
          tipo: TIPO_PT[l.type],
          categoria: l.categories?.name ?? null,
          cartao: l.credit_cards?.name ?? null,
          forma: l.payment_method ? (FORMA_PT[l.payment_method] ?? l.payment_method) : null,
          precisa_conferir: l.needs_review,
        })),
      }
    }))

  server.registerTool('resumo_do_mes', {
    description: 'Receitas, despesas, saldo e gasto por categoria de um mês, com o mês anterior para comparar.',
    inputSchema: z.object({ carteira_id: carteiraId, mes }),
    annotations: LEITURA,
  }, (a) =>
    naCarteira(a.carteira_id, async (c) => {
      const m = a.mes ?? mesDe(hoje)
      const atual = intervaloDoMes(m)
      const anterior = intervaloDoMes(mesAnterior(m))
      const [doMes, doAnterior, cats] = await Promise.all([
        consultas.linhasParaSomar(supabase, c.id, atual.inicio, atual.fim),
        consultas.linhasParaSomar(supabase, c.id, anterior.inicio, anterior.fim),
        consultas.categorias(supabase, c.id),
      ])
      return { mes: m, ...resumoDoMes(doMes, doAnterior, cats) }
    }))

  server.registerTool('orcamentos_do_mes', {
    description: 'Orçado, gasto e percentual usado de cada orçamento de categoria num mês.',
    inputSchema: z.object({ carteira_id: carteiraId, mes }),
    annotations: LEITURA,
  }, (a) =>
    naCarteira(a.carteira_id, async (c) => {
      const m = a.mes ?? mesDe(hoje)
      const { inicio, fim } = intervaloDoMes(m)
      const [ano, numero] = m.split('-').map(Number)
      const [orcs, doMes, cats] = await Promise.all([
        consultas.orcamentos(supabase, c.id, ano, numero),
        consultas.linhasParaSomar(supabase, c.id, inicio, fim),
        consultas.categorias(supabase, c.id),
      ])
      return { mes: m, orcamentos: orcamentosDoMes(orcs, doMes, cats) }
    }))

  server.registerTool('faturas_dos_cartoes', {
    description: 'Para cada cartão ativo, a fatura aberta (período, total, vencimento) e a última fechada.',
    inputSchema: z.object({ carteira_id: carteiraId }),
    annotations: LEITURA,
  }, (a) =>
    naCarteira(a.carteira_id, async (c) => {
      const cards = await consultas.cartoes(supabase, c.id)
      // Sem cartão ativo a janela não existe: nada a consultar.
      if (cards.length === 0) return { cartoes: [] }
      const janela = janelaDasFaturas(cards, hojeYmd)
      const [linhas, totais] = await Promise.all([
        consultas.linhasParaSomar(supabase, c.id, janela.inicio, janela.fim),
        consultas.totaisDasFaturas(supabase, c.id, janela.inicio, janela.fim),
      ])
      const doBanco = new Map(totais.map((t) => [statementTotalKey(t.credit_card_id, t.statement_close_date), t.bank_total]))
      return { cartoes: cards.map((card) => faturaDoCartao(card, linhas, doBanco, hojeYmd)) }
    }))

  server.registerTool('contas_a_pagar', {
    description: 'Contas vencidas e as que vencem nos próximos dias (padrão 30), com o total.',
    inputSchema: z.object({
      carteira_id: carteiraId,
      dias: z.number().int().min(1).max(90).optional().describe('Quantos dias à frente, de 1 a 90. Padrão: 30.'),
    }),
    annotations: LEITURA,
  }, (a) =>
    naCarteira(a.carteira_id, async (c) => {
      const dias = a.dias ?? 30
      const ate = formatYmd(addCalendarDays(hojeYmd, dias))
      return { dias, ...contasAPagar(await consultas.instanciasDeContas(supabase, c.id, ate), hoje, dias) }
    }))

  server.registerTool('assinaturas', {
    description: 'Assinaturas ativas, com valor, próxima cobrança e o total por mês.',
    inputSchema: z.object({ carteira_id: carteiraId }),
    annotations: LEITURA,
  }, (a) => naCarteira(a.carteira_id, async (c) => assinaturasAtivas(await consultas.assinaturas(supabase, c.id))))

  server.registerTool('registrar_lancamento', {
    description:
      'Registra uma despesa ou receita (parcelada só no cartão). Entra marcada para a pessoa conferir no app.',
    inputSchema: z.object({
      carteira_id: carteiraId,
      valor: z.number().positive().describe('Valor total em reais, ex.: 42.5.'),
      descricao: z.string().min(1).max(200).describe('O que foi, ex.: "Padaria".'),
      tipo: z.enum(['despesa', 'receita']),
      data: data.optional().describe('AAAA-MM-DD. Padrão: hoje.'),
      categoria: z.string().optional().describe('Nome da categoria (de listar_categorias). Sem ela, o histórico sugere.'),
      cartao: z.string().optional().describe('Nome, apelido ou 4 últimos dígitos do cartão de crédito.'),
      forma_de_pagamento: z.enum(['pix', 'debito', 'credito', 'dinheiro', 'ted', 'outro']).optional(),
      parcelas: z.number().int().min(2).max(48).optional().describe('Número de parcelas no cartão, de 2 a 48.'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false },
  }, ({ carteira_id, ...pedido }) =>
    naCarteira(carteira_id, async (c) => {
      const [categorias, cartoes, historico] = await Promise.all([
        consultas.categorias(supabase, c.id),
        consultas.cartoes(supabase, c.id),
        consultas.historico(supabase, c.id),
      ])
      const montado = montarLancamentoDaIA(
        { ...pedido, valor: Math.round(pedido.valor * 100) / 100 },
        { userId, carteiraId: c.id, hoje, categorias, cartoes, historico, clientId },
      )
      if ('erro' in montado) throw new Recusa(montado.erro)
      const { linha, parcelas } = montado
      // O plano parcelado só aceita despesa (`transactions_installment_plan_expense_only`).
      if (parcelas && linha.type === 'income') throw new Recusa('Parcelado só para despesa no cartão.')
      // Meio-dia UTC, como a captura grava: o dia não escorrega no fuso.
      const occurredAt = `${linha.date}T12:00:00.000Z`

      let id: string
      if (!parcelas) {
        const { data: criada, error } = await supabase
          .from('transactions')
          .insert({ ...linha, date: occurredAt })
          .select('id')
          .single()
        if (error) throw error
        id = (criada as { id: string }).id
      } else {
        const { data: planoId, error } = await supabase.rpc('create_workspace_installment_plan', {
          p_workspace_id: c.id,
          p_category_id: linha.category_id,
          p_description: linha.description,
          p_payment_method: 'credit_card',
          p_payment_credit_card_id: linha.payment_credit_card_id,
          p_total_installments: parcelas.total,
          p_installment_amount: parcelas.valor_parcela,
          p_final_installment_amount: parcelas.valor_final,
          p_next_billing_date: parcelas.primeira,
          // A origem vai dentro da RPC: o token da IA não altera linha (20261103130000).
          p_source: linha.source,
          p_needs_review: linha.needs_review,
          p_capture_meta: linha.capture_meta,
        })
        if (error) throw error
        id = planoId as string
      }

      // Os mesmos avisos que o app dispara com o JWT da pessoa; não seguram a resposta.
      if (linha.type === 'expense') {
        const corpo = {
          workspace_id: c.id,
          category_id: linha.category_id,
          occurred_at: occurredAt,
          payment_method: linha.payment_method,
          payment_credit_card_id: linha.payment_credit_card_id,
        }
        const avisos = [
          supabase.functions.invoke('evaluate-budgets', { body: parcelas ? corpo : { ...corpo, transaction_id: id } }),
        ]
        if (linha.payment_credit_card_id) {
          avisos.push(supabase.functions.invoke('evaluate-credit-card-alerts', { body: corpo }))
        }
        const todos = Promise.allSettled(avisos)
        if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(todos)
      }

      const valor = dinheiro(Math.round(linha.amount * 100)).texto
      return { id, resumo: `${linha.description} · ${valor} · ${linha.date}`, precisa_conferir: true }
    }))

  return server
}

export const handler = pipeline(
  [withOAuthProtectedResource(), withSupabase({ auth: 'user' })],
  (req, ctx) => createMcpHandler(() => servidor(ctx)).fetch(req),
)

if (import.meta.main) Deno.serve(handler)
