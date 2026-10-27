import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { type ContextoDaIA, montarLancamentoDaIA, type PedidoDaIA } from './lancamento.ts'

const cartao = (id: string, name: string, last_four: string | null = null) => ({
  id, name, wallet_alias: null, last_four, workspace_id: 'w', is_active: true,
})
const ctx: ContextoDaIA = {
  userId: 'u', carteiraId: 'w', hoje: '2026-10-27',
  categorias: [{ id: 'm', name: 'Mercado', type: 'expense' }, { id: 's', name: 'Salário', type: 'income' }],
  cartoes: [cartao('c1', 'Nubank'), cartao('c2', 'Nubank Ultravioleta', '2222')],
  historico: [{ description: 'Padaria', category_id: 'm', payment_method: 'debit_card', payment_credit_card_id: null, date: '2026-10-01', type: 'expense' }],
  clientId: 'cli',
}
const base: PedidoDaIA = { valor: 42, descricao: 'Padaria', tipo: 'despesa' }
const monta = (p: Partial<PedidoDaIA>) => montarLancamentoDaIA({ ...base, ...p }, ctx)

Deno.test('mcp: lançamento preenche pelo histórico', () => {
  const r = monta({}) as Exclude<ReturnType<typeof montarLancamentoDaIA>, { erro: string }>
  assertEquals(r.linha, {
    user_id: 'u', workspace_id: 'w', category_id: 'm', type: 'expense', amount: 42, description: 'Padaria',
    date: '2026-10-27', payment_method: 'debit_card', payment_credit_card_id: null,
    source: 'ia_externa', needs_review: true, capture_meta: { via: 'mcp', client_id: 'cli' },
  })
  assertEquals(r.parcelas, null)
})

Deno.test('mcp: lançamento casa categoria sem acento/caixa e recusa inexistente', () => {
  assertEquals((monta({ categoria: 'mercado' }) as { linha: { category_id: string } }).linha.category_id, 'm')
  assertEquals(monta({ categoria: 'Viagem' }), { erro: 'Categoria "Viagem" não existe nessa carteira. Categorias: Mercado.' })
})

Deno.test('mcp: lançamento casa cartão', () => {
  assertEquals(monta({ cartao: 'Nubank' }), {
    erro: 'Mais de um cartão casa com "Nubank": Nubank, Nubank Ultravioleta. Diga o nome exato ou os 4 últimos dígitos.',
  })
  const r = monta({ cartao: '2222' }) as { linha: { payment_credit_card_id: string; payment_method: string } }
  assertEquals([r.linha.payment_credit_card_id, r.linha.payment_method], ['c2', 'credit_card'])
  assertEquals(monta({ cartao: 'Inter' }), { erro: 'Cartão "Inter" não encontrado. Cartões: Nubank, Nubank Ultravioleta.' })
})

Deno.test('mcp: lançamento valida valor, data e parcelas', () => {
  assertEquals(monta({ valor: 0 }), { erro: 'O valor precisa ser maior que zero.' })
  assertEquals(monta({ data: '2026-02-30' }), { erro: 'Data inválida: use AAAA-MM-DD.' })
  assertEquals(monta({ parcelas: 3 }), { erro: 'Parcelado só no cartão de crédito: diga o cartão.' })
})

Deno.test('mcp: lançamento parcelado fecha o centavo na última', () => {
  const r = monta({ valor: 100, parcelas: 3, cartao: '2222' }) as { parcelas: unknown }
  assertEquals(r.parcelas, { total: 3, valor_parcela: 33.33, valor_final: 33.34, primeira: '2026-10-27' })
})

Deno.test('mcp: lançamento recusa parcela de zero centavo', () => {
  assertEquals(monta({ valor: 0.05, parcelas: 10, cartao: '2222' }), { erro: 'Valor pequeno demais para parcelar em 10x.' })
})
