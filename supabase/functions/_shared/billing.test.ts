import { assertEquals, assertThrows } from 'jsr:@std/assert@1.0.19'
import {
  acaoDoDia,
  aguardandoConfirmacao,
  ARREPENDIMENTO_DIAS,
  type Assinatura,
  AVISO_RENOVACAO_DIAS,
  AVISOS,
  cpfValido,
  efeitoDoEvento,
  falhaNaRenovacao,
  type Mudanca,
  type Pagamento,
  PARCELAS,
  podeReembolsar,
  precoPara,
  TOLERANCIA_DIAS,
} from './billing.ts'

const DIA = 24 * 60 * 60 * 1000
const FIM = '2027-03-10T15:00:00.000Z'
const fim = new Date(FIM)
const em = (ms: number) => new Date(fim.getTime() + ms)
const iso = (d: Date) => d.toISOString()
const espaco = (s: string) => s.replace(/ /g, ' ')

const sub = (x: Partial<Assinatura> = {}): Assinatura => ({
  id: 'sub-1',
  user_id: 'user-1',
  provider: 'asaas',
  provider_ref: 'inst-velho',
  status: 'active',
  current_period_end: FIM,
  cancel_at_period_end: false,
  price_cents: 35880,
  founder: false,
  grace_until: null,
  reembolsavel_ate: null,
  card_token: 'tok-1',
  checkout_criado_em: null,
  ...x,
})

const pag = (x: Partial<Pagamento> = {}): Pagamento => ({
  id: 'pay-1',
  installment: 'inst-novo',
  customer: 'cus-1',
  externalReference: 'sub-1',
  status: 'CONFIRMED',
  ...x,
})

Deno.test('constantes de cobrança', () => {
  assertEquals([PARCELAS, TOLERANCIA_DIAS, AVISO_RENOVACAO_DIAS, ARREPENDIMENTO_DIAS], [12, 7, 7, 7])
})

// precoPara

Deno.test('precoPara: fundador até 31/01/2027 em Brasília, cheio a partir de 01/02 00:00', () => {
  assertEquals(precoPara(new Date('2027-02-01T02:59:59Z')), { centavos: 23880, fundador: true })
  assertEquals(precoPara(new Date('2027-02-01T03:00:00Z')), { centavos: 35880, fundador: false })
})

// cpfValido

Deno.test('cpfValido: verificadores certos, com ou sem pontuação', () => {
  assertEquals(cpfValido('123.456.789-09'), true)
  assertEquals(cpfValido('12345678909'), true)
})

Deno.test('cpfValido: recusa dígito errado, tamanho errado e onze iguais', () => {
  assertEquals(cpfValido('123.456.789-08'), false)
  assertEquals(cpfValido('123.456.789-19'), false)
  assertEquals(cpfValido('1234567890'), false)
  assertEquals(cpfValido('111.111.111-11'), false)
  assertEquals(cpfValido(''), false)
})

// efeitoDoEvento

Deno.test('efeitoDoEvento: compra nova (sem período) começa agora, com 7 dias de arrependimento', () => {
  const agora = new Date('2026-11-01T12:00:00Z')
  const s = sub({ status: 'pending', provider_ref: null, current_period_end: null, card_token: null })
  const p = pag({ creditCard: { creditCardToken: 'tok-novo', creditCardNumber: '4444', creditCardBrand: 'VISA' } })
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', p, s, agora), {
    status: 'active',
    provider_ref: 'inst-novo',
    grace_until: null,
    cancel_at_period_end: false,
    current_period_end: '2027-11-01T12:00:00.000Z',
    reembolsavel_ate: '2026-11-08T12:00:00.000Z',
    card_token: 'tok-novo',
    card_last4: '4444',
    card_brand: 'VISA',
  })
})

Deno.test('efeitoDoEvento: PAYMENT_RECEIVED conta como confirmado; o cartão ausente não entra na mudança', () => {
  const agora = new Date('2026-11-01T12:00:00Z')
  const m = efeitoDoEvento('PAYMENT_RECEIVED', pag(), sub({ status: 'expired', current_period_end: null }), agora)
  assertEquals(m?.status, 'active')
  assertEquals('card_token' in m!, false)
  assertEquals('card_last4' in m!, false)
})

Deno.test('efeitoDoEvento: card_last4 são os 4 últimos do número', () => {
  const m = efeitoDoEvento(
    'PAYMENT_CONFIRMED',
    pag({ creditCard: { creditCardNumber: '************1234' } }),
    sub(),
    em(-DIA),
  )
  assertEquals(m?.card_last4, '1234')
})

Deno.test('efeitoDoEvento: renovação estende do fim antigo e mantém o reembolsável', () => {
  const s = sub({ reembolsavel_ate: '2026-03-17T15:00:00.000Z', cancel_at_period_end: true, grace_until: iso(em(7 * DIA)) })
  const m = efeitoDoEvento('PAYMENT_CONFIRMED', pag(), s, em(-DIA))
  assertEquals(m, {
    status: 'active',
    provider_ref: 'inst-novo',
    grace_until: null,
    cancel_at_period_end: false,
    current_period_end: '2028-03-10T15:00:00.000Z',
  })
})

Deno.test('efeitoDoEvento: renovação confirmada 3 dias depois do fim ainda estende do fim antigo', () => {
  const m = efeitoDoEvento('PAYMENT_CONFIRMED', pag(), sub({ status: 'past_due' }), em(3 * DIA))
  assertEquals(m?.current_period_end, '2028-03-10T15:00:00.000Z')
  assertEquals('reembolsavel_ate' in m!, false)
})

Deno.test('efeitoDoEvento: passados os 7 dias de tolerância, é compra nova a partir de agora', () => {
  const agora = em(7 * DIA)
  const m = efeitoDoEvento('PAYMENT_CONFIRMED', pag(), sub({ status: 'past_due' }), agora)
  assertEquals(m?.current_period_end, '2028-03-17T15:00:00.000Z')
  assertEquals(m?.reembolsavel_ate, iso(new Date(agora.getTime() + 7 * DIA)))
})

Deno.test('efeitoDoEvento: a 2ª parcela do mesmo parcelamento não muda nada', () => {
  const s = sub({ provider_ref: 'inst-novo' })
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag(), s, em(30 * DIA)), null)
  assertEquals(efeitoDoEvento('PAYMENT_RECEIVED', pag(), s, em(30 * DIA)), null)
})

Deno.test('efeitoDoEvento: pagamento sem parcelamento não ativa', () => {
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag({ installment: null }), sub(), em(-DIA)), null)
})

Deno.test('efeitoDoEvento: externalReference de outra linha é ignorado', () => {
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag({ externalReference: 'sub-2' }), sub(), em(-DIA)), null)
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag({ externalReference: null }), sub(), em(-DIA)), null)
  const s = sub({ provider_ref: 'inst-novo' })
  assertEquals(efeitoDoEvento('PAYMENT_REFUNDED', pag({ externalReference: 'sub-2' }), s, em(-DIA)), null)
})

Deno.test('efeitoDoEvento: estorno e chargeback do parcelamento atual expiram agora', () => {
  const agora = em(-100 * DIA)
  const s = sub({ provider_ref: 'inst-novo' })
  const esperado: Mudanca = { status: 'expired', current_period_end: iso(agora) }
  assertEquals(efeitoDoEvento('PAYMENT_REFUNDED', pag(), s, agora), esperado)
  assertEquals(efeitoDoEvento('PAYMENT_CHARGEBACK_REQUESTED', pag(), s, agora), esperado)
})

Deno.test('efeitoDoEvento: estorno de outro parcelamento ou de linha já expirada não muda nada', () => {
  assertEquals(efeitoDoEvento('PAYMENT_REFUNDED', pag(), sub(), em(-DIA)), null)
  const expirada = sub({ provider_ref: 'inst-novo', status: 'expired' })
  assertEquals(efeitoDoEvento('PAYMENT_REFUNDED', pag(), expirada, em(-DIA)), null)
})

Deno.test('efeitoDoEvento: outros eventos não mudam nada', () => {
  for (const e of ['PAYMENT_CREATED', 'PAYMENT_OVERDUE', 'PAYMENT_UPDATED', 'PAYMENT_DELETED']) {
    assertEquals(efeitoDoEvento(e, pag(), sub(), em(-DIA)), null)
  }
})

// acaoDoDia

Deno.test('acaoDoDia: fora do Asaas ou sem período, nada', () => {
  assertEquals(acaoDoDia(sub({ provider: 'manual' }), em(0)), null)
  assertEquals(acaoDoDia(sub({ provider: 'apple' }), em(0)), null)
  assertEquals(acaoDoDia(sub({ current_period_end: null }), em(0)), null)
})

Deno.test('acaoDoDia active: renova a partir de fim − 1 dia; avisa antes disso, desde fim − 7 dias', () => {
  assertEquals(acaoDoDia(sub(), em(-DIA)), 'renovar')
  assertEquals(acaoDoDia(sub(), em(-DIA - 60_000)), 'avisar_renovacao')
  assertEquals(acaoDoDia(sub(), em(-7 * DIA)), 'avisar_renovacao')
  assertEquals(acaoDoDia(sub(), em(-7 * DIA - 60_000)), null)
  assertEquals(acaoDoDia(sub(), em(2 * DIA)), 'renovar')
})

Deno.test('acaoDoDia active: tentativa há 1 dia espera o webhook; há 3 dias renova de novo', () => {
  assertEquals(acaoDoDia(sub({ checkout_criado_em: iso(em(-2 * DIA)) }), em(-DIA)), null)
  assertEquals(acaoDoDia(sub({ checkout_criado_em: iso(em(-4 * DIA)) }), em(-DIA)), 'renovar')
})

Deno.test('acaoDoDia active com cancelamento: expira no fim, sem aviso nem renovação antes', () => {
  const s = sub({ cancel_at_period_end: true })
  assertEquals(acaoDoDia(s, em(-3 * DIA)), null)
  assertEquals(acaoDoDia(s, em(-DIA)), null)
  assertEquals(acaoDoDia(s, em(-1)), null)
  assertEquals(acaoDoDia(s, em(0)), 'expirar')
})

Deno.test('acaoDoDia active esperando confirmação (Ruling 2): nunca renova; expira no grace_until', () => {
  const s = sub({ grace_until: iso(em(7 * DIA)), checkout_criado_em: iso(em(-DIA)) })
  assertEquals(acaoDoDia(s, em(-DIA)), null)
  assertEquals(acaoDoDia(s, em(3 * DIA)), null) // tentativa há 4 dias: mesmo assim não cobra de novo
  assertEquals(acaoDoDia(s, em(7 * DIA - 1)), null)
  assertEquals(acaoDoDia(s, em(7 * DIA)), 'expirar')
  assertEquals(acaoDoDia(s, em(9 * DIA)), 'expirar')
})

Deno.test('acaoDoDia past_due: expira no grace_until; senão renova se a última tentativa passou de 2 dias', () => {
  const s = (x: Partial<Assinatura> = {}) => sub({ status: 'past_due', grace_until: iso(em(7 * DIA)), ...x })
  const agora = em(3 * DIA)
  assertEquals(acaoDoDia(s(), agora), 'renovar')
  assertEquals(acaoDoDia(s({ checkout_criado_em: iso(em(2 * DIA)) }), agora), null)
  assertEquals(acaoDoDia(s({ checkout_criado_em: iso(em(0)) }), agora), 'renovar')
  assertEquals(acaoDoDia(s(), em(7 * DIA)), 'expirar')
})

Deno.test('acaoDoDia: pending e expired não têm ação', () => {
  assertEquals(acaoDoDia(sub({ status: 'pending' }), em(0)), null)
  assertEquals(acaoDoDia(sub({ status: 'expired' }), em(0)), null)
})

// falhaNaRenovacao / aguardandoConfirmacao / podeReembolsar

Deno.test('falhaNaRenovacao: past_due com tolerância de fim + 7 dias', () => {
  assertEquals(falhaNaRenovacao(sub(), em(-DIA)), { status: 'past_due', grace_until: iso(em(7 * DIA)) })
})

Deno.test('falhaNaRenovacao: a tolerância não se estende a cada tentativa', () => {
  const s = sub({ status: 'past_due', grace_until: iso(em(7 * DIA)) })
  assertEquals(falhaNaRenovacao(s, em(5 * DIA)), { status: 'past_due', grace_until: iso(em(7 * DIA)) })
})

Deno.test('aguardandoConfirmacao: só grace_until = fim + 7 dias, status intacto', () => {
  assertEquals(aguardandoConfirmacao(sub()), { grace_until: iso(em(7 * DIA)) })
  assertThrows(() => aguardandoConfirmacao(sub({ current_period_end: null })))
})

Deno.test('podeReembolsar: só active dentro do prazo', () => {
  const agora = new Date('2026-11-03T12:00:00Z')
  const ate = '2026-11-08T12:00:00.000Z'
  assertEquals(podeReembolsar(sub({ reembolsavel_ate: ate }), agora), true)
  assertEquals(podeReembolsar(sub({ reembolsavel_ate: ate }), new Date(ate)), false)
  assertEquals(podeReembolsar(sub({ reembolsavel_ate: null }), agora), false)
  assertEquals(podeReembolsar(sub({ reembolsavel_ate: ate, status: 'past_due' }), agora), false)
})

// AVISOS

Deno.test('AVISOS.renovacao: valor, cartão final e cancelar', () => {
  const a = AVISOS.renovacao(sub(), '1234')
  assertEquals(a.titulo, 'Seu plano renova em 7 dias')
  assertEquals(
    espaco(a.corpo),
    'A renovação é de 12x de R$ 29,90 no cartão final 1234. Cancelar é em 1 toque, em Planos.',
  )
})

Deno.test('AVISOS.renovacao: preço de fundador e cartão sem final', () => {
  assertEquals(
    espaco(AVISOS.renovacao(sub({ price_cents: 23880, founder: true }), null).corpo),
    'A renovação é de 12x de R$ 19,90. Cancelar é em 1 toque, em Planos.',
  )
})

Deno.test('AVISOS.renovacao: sem card_token, pede para confirmar o cartão', () => {
  assertEquals(
    espaco(AVISOS.renovacao(sub({ card_token: null }), '1234').corpo),
    'A renovação é de 12x de R$ 29,90. Confirme o cartão em Planos para renovar. Cancelar é em 1 toque, em Planos.',
  )
})

Deno.test('AVISOS.cartao: a data é a do grace_until, no dia de Brasília', () => {
  const a = AVISOS.cartao(sub({ grace_until: '2027-03-18T02:00:00.000Z' })) // 17/03, 23:00 em Brasília
  assertEquals(a.titulo, 'Não conseguimos renovar seu plano')
  assertEquals(a.corpo, 'Atualize o cartão em Planos até 17/03. Depois disso, a conta fica em só leitura.')
})

Deno.test('AVISOS.fim', () => {
  assertEquals(AVISOS.fim(), {
    titulo: 'Seu plano terminou',
    corpo:
      'Sua conta está em só leitura: tudo continua visível, e exportar e apagar seguem liberados. Assine em Planos para voltar a lançar.',
  })
})
