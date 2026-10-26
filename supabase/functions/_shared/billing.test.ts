import { assertEquals, assertThrows } from 'jsr:@std/assert@1.0.19'
import {
  acaoDoDia,
  aguardandoConfirmacao,
  ARREPENDIMENTO_DIAS,
  type Assinatura,
  type CobrancaAberta,
  AVISO_RENOVACAO_DIAS,
  AVISOS,
  checkoutPendente,
  cpfValido,
  efeitoDoEvento,
  eventoDaLinha,
  falhaNaRenovacao,
  jaEstornado,
  notaPendente,
  pagamentoEmDobro,
  type Parcelamento,
  type Mudanca,
  type Pagamento,
  PARCELAS,
  planoDoCheckout,
  podeCancelar,
  podeDesfazer,
  podeReembolsar,
  precoPara,
  resultadoDaCobranca,
  TOLERANCIA_DIAS,
  triagemDasAbertas,
  vereditoDaEspera,
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
    checkout_ref: null,
    checkout_url: null,
    checkout_criado_em: null,
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
    checkout_ref: null,
    checkout_url: null,
    checkout_criado_em: null,
    current_period_end: '2028-03-10T15:00:00.000Z',
  })
})

Deno.test('efeitoDoEvento (Ruling 17): toda ativação zera checkout_ref, checkout_url e checkout_criado_em', () => {
  const s = sub({ checkout_criado_em: iso(em(-2 * DIA)) })
  for (const [m, quando] of [[sub({ status: 'expired', current_period_end: null }), em(0)], [s, em(-DIA)]] as const) {
    const mudanca = efeitoDoEvento('PAYMENT_CONFIRMED', pag(), m, quando)
    assertEquals([mudanca?.checkout_ref, mudanca?.checkout_url, mudanca?.checkout_criado_em], [null, null, null])
  }
  // o estorno não mexe na tentativa
  assertEquals('checkout_ref' in efeitoDoEvento('PAYMENT_REFUNDED', pag(), sub({ provider_ref: 'inst-novo' }), em(0))!, false)
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

Deno.test('efeitoDoEvento (Ruling 3): parcela atrasada do parcelamento X depois da renovação Y é ignorada', () => {
  // Y foi confirmada em fim − 1 dia: a linha está paga até fim + 1 ano.
  const renovada = sub({ provider_ref: 'inst-Y', current_period_end: '2028-03-10T15:00:00.000Z' })
  const x = pag({ installment: 'inst-X' })
  assertEquals(efeitoDoEvento('PAYMENT_RECEIVED', x, renovada, em(3 * DIA)), null)
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', x, renovada, em(30 * DIA)), null)
})

Deno.test('efeitoDoEvento (Ruling 3): parcela atrasada depois de uma compra nova Z feita após expirar é ignorada', () => {
  const compraZ = sub({ provider_ref: 'inst-Z', current_period_end: '2027-06-01T12:00:00.000Z' })
  assertEquals(efeitoDoEvento('PAYMENT_RECEIVED', pag({ installment: 'inst-X' }), compraZ, new Date('2026-06-20T12:00:00Z')), null)
})

Deno.test('efeitoDoEvento (Ruling 3 e 20): a janela abre em fim − 3 dias', () => {
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag(), sub(), em(-3 * DIA - 1)), null)
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag(), sub(), em(-3 * DIA))?.current_period_end, '2028-03-10T15:00:00.000Z')
  // a cobrança do cron em fim − 2 dias cai dentro
  assertEquals(efeitoDoEvento('PAYMENT_CONFIRMED', pag(), sub(), em(-2 * DIA))?.current_period_end, '2028-03-10T15:00:00.000Z')
})

Deno.test('efeitoDoEvento: o vaivém X/Y do revisor não estende nada', () => {
  // A linha renovada para Y; chegam, alternados, os RECEIVED mensais de X e de Y.
  let s = sub({ provider_ref: 'inst-Y', current_period_end: '2028-03-10T15:00:00.000Z' })
  for (const [i, inst] of ['inst-X', 'inst-Y', 'inst-X', 'inst-Y'].entries()) {
    const m = efeitoDoEvento('PAYMENT_RECEIVED', pag({ installment: inst }), s, em((3 + 30 * i) * DIA))
    assertEquals(m, null)
    s = { ...s, ...m }
  }
  assertEquals([s.provider_ref, s.current_period_end], ['inst-Y', '2028-03-10T15:00:00.000Z'])
})

for (const [nome, quando, status] of [
  ['fim − 1 dia', -DIA, 'active'],
  ['fim + 3 dias', 3 * DIA, 'past_due'],
] as const) {
  Deno.test(`efeitoDoEvento: renovação confirmada em ${nome} estende uma vez só, do fim antigo`, () => {
    const antes = sub({ status, provider_ref: 'inst-X' })
    const m = efeitoDoEvento('PAYMENT_CONFIRMED', pag({ installment: 'inst-Y' }), antes, em(quando))
    assertEquals(m?.current_period_end, '2028-03-10T15:00:00.000Z')
    const depois = { ...antes, ...m }
    // As outras parcelas de Y e as de X que ainda chegam não mexem mais.
    for (const inst of ['inst-Y', 'inst-X']) {
      for (const e of ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']) {
        assertEquals(efeitoDoEvento(e, pag({ installment: inst }), depois, em(quando + DIA)), null)
        assertEquals(efeitoDoEvento(e, pag({ installment: inst }), depois, em(quando + 32 * DIA)), null)
      }
    }
  })
}

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

Deno.test('acaoDoDia active (Ruling 20): renova a partir de fim − 2 dias; avisa de fim − 7 a fim − 2', () => {
  assertEquals(acaoDoDia(sub(), em(-2 * DIA)), 'renovar')
  assertEquals(acaoDoDia(sub(), em(-DIA)), 'renovar')
  assertEquals(acaoDoDia(sub(), em(-2 * DIA - 60_000)), 'avisar_renovacao')
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

Deno.test('acaoDoDia active esperando confirmação (Ruling 2 e 19): nunca renova; verifica depois de 1 dia; expira no grace_until', () => {
  const s = sub({ grace_until: iso(em(7 * DIA)), checkout_criado_em: iso(em(-DIA)) })
  assertEquals(acaoDoDia(s, em(-DIA)), null)
  assertEquals(acaoDoDia(s, em(0)), null) // tentativa há 1 dia exato: ainda espera
  assertEquals(acaoDoDia(s, em(1)), 'verificar')
  assertEquals(acaoDoDia(s, em(3 * DIA)), 'verificar') // tentativa há 4 dias: confere, nunca cobra de novo
  assertEquals(acaoDoDia(s, em(7 * DIA - 1)), 'verificar')
  assertEquals(acaoDoDia(sub({ grace_until: iso(em(7 * DIA)) }), em(0)), 'verificar') // sem data, confere
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

Deno.test('acaoDoDia past_due sem grace_until: o limite é fim + 7 dias', () => {
  const s = sub({ status: 'past_due' })
  assertEquals(acaoDoDia(s, em(7 * DIA - 1)), 'renovar')
  assertEquals(acaoDoDia(s, em(7 * DIA)), 'expirar')
})

Deno.test('acaoDoDia past_due com cancelamento (Ruling 11): nunca renova; expira no grace_until', () => {
  const s = sub({ status: 'past_due', grace_until: iso(em(7 * DIA)), cancel_at_period_end: true })
  assertEquals(acaoDoDia(s, em(3 * DIA)), null)
  assertEquals(acaoDoDia(s, em(7 * DIA - 1)), null)
  assertEquals(acaoDoDia(s, em(7 * DIA)), 'expirar')
  // sem grace_until, o limite é fim + 7 dias
  const semCarencia = sub({ status: 'past_due', cancel_at_period_end: true })
  assertEquals(acaoDoDia(semCarencia, em(DIA)), null)
  assertEquals(acaoDoDia(semCarencia, em(7 * DIA)), 'expirar')
})

Deno.test('acaoDoDia: pending e expired não têm ação', () => {
  assertEquals(acaoDoDia(sub({ status: 'pending' }), em(0)), null)
  assertEquals(acaoDoDia(sub({ status: 'expired' }), em(0)), null)
})

// podeCancelar / podeDesfazer

Deno.test('podeCancelar: active e past_due do Asaas; o active com grace_until está renovando (Ruling 12)', () => {
  const agora = em(-3 * DIA)
  assertEquals(podeCancelar(sub(), agora), 'sim')
  assertEquals(podeCancelar(sub({ status: 'past_due', grace_until: iso(em(7 * DIA)) }), em(3 * DIA)), 'sim')
  assertEquals(podeCancelar(sub({ grace_until: iso(em(7 * DIA)) }), agora), 'renovando')
  assertEquals(podeCancelar(sub({ provider: 'manual' }), agora), 'nao')
  assertEquals(podeCancelar(sub({ status: 'pending' }), agora), 'nao')
  assertEquals(podeCancelar(sub({ status: 'expired' }), agora), 'nao')
})

Deno.test('podeCancelar: a cobrança iniciada há menos de 5 min pode estar em voo', () => {
  const agora = em(-DIA)
  const ha = (ms: number) => iso(new Date(agora.getTime() - ms))
  assertEquals(podeCancelar(sub({ checkout_criado_em: ha(30_000) }), agora), 'cobrando')
  assertEquals(podeCancelar(sub({ checkout_criado_em: ha(5 * 60_000 - 1) }), agora), 'cobrando')
  assertEquals(podeCancelar(sub({ status: 'past_due', checkout_criado_em: ha(60_000) }), agora), 'cobrando')
  assertEquals(podeCancelar(sub({ checkout_criado_em: ha(5 * 60_000) }), agora), 'sim')
  assertEquals(podeCancelar(sub({ checkout_criado_em: ha(2 * DIA) }), agora), 'sim')
  assertEquals(podeCancelar(sub({ provider: 'manual', checkout_criado_em: ha(30_000) }), agora), 'nao')
})

Deno.test('podeDesfazer: só cancelado, até o fim do período ou da tolerância do past_due', () => {
  const c = (x: Partial<Assinatura> = {}) => sub({ cancel_at_period_end: true, ...x })
  assertEquals(podeDesfazer(c(), em(-1)), true)
  assertEquals(podeDesfazer(c(), em(0)), false)
  assertEquals(podeDesfazer(sub(), em(-DIA)), false)
  assertEquals(podeDesfazer(c({ provider: 'manual' }), em(-DIA)), false)
  assertEquals(podeDesfazer(c({ status: 'expired' }), em(-DIA)), false)
  const atraso = c({ status: 'past_due', grace_until: iso(em(7 * DIA)) })
  assertEquals(podeDesfazer(atraso, em(3 * DIA)), true)
  assertEquals(podeDesfazer(atraso, em(7 * DIA)), false)
})

// falhaNaRenovacao / aguardandoConfirmacao / podeReembolsar

Deno.test('falhaNaRenovacao: past_due com tolerância de fim + 7 dias', () => {
  assertEquals(falhaNaRenovacao(sub(), em(-DIA)), { status: 'past_due', grace_until: iso(em(7 * DIA)) })
})

Deno.test('falhaNaRenovacao: a tolerância não se estende a cada tentativa', () => {
  const s = sub({ status: 'past_due', grace_until: iso(em(7 * DIA)) })
  assertEquals(falhaNaRenovacao(s, em(5 * DIA)), { status: 'past_due', grace_until: iso(em(7 * DIA)) })
})

Deno.test('aguardandoConfirmacao: active com grace_until = fim + 7 dias', () => {
  assertEquals(aguardandoConfirmacao(sub()), { status: 'active', grace_until: iso(em(7 * DIA)) })
  assertThrows(() => aguardandoConfirmacao(sub({ current_period_end: null })))
})

Deno.test('aguardandoConfirmacao (Ruling 4): um past_due com a nova tentativa aceita não é cobrado de novo', () => {
  const s = sub({ status: 'past_due', grace_until: iso(em(7 * DIA)), checkout_criado_em: iso(em(DIA)) })
  assertEquals(acaoDoDia(s, em(3 * DIA)), 'renovar') // sem a mudança, cobraria de novo
  const esperando = { ...s, ...aguardandoConfirmacao(s) }
  assertEquals(esperando.status, 'active')
  assertEquals(acaoDoDia(esperando, em(DIA + 60_000)), null)
  assertEquals(acaoDoDia(esperando, em(3 * DIA)), 'verificar')
  assertEquals(acaoDoDia(esperando, em(6 * DIA)), 'verificar')
  assertEquals(acaoDoDia(esperando, em(7 * DIA)), 'expirar')
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

Deno.test('AVISOS.renovacao: sem price_cents, o fundador cai no preço de fundador', () => {
  assertEquals(
    espaco(AVISOS.renovacao(sub({ price_cents: null, founder: true }), '1234').corpo),
    'A renovação é de 12x de R$ 19,90 no cartão final 1234. Cancelar é em 1 toque, em Planos.',
  )
  assertEquals(
    espaco(AVISOS.renovacao(sub({ price_cents: null, founder: false }), null).corpo),
    'A renovação é de 12x de R$ 29,90. Cancelar é em 1 toque, em Planos.',
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

Deno.test('AVISOS.cartao: sem grace_until, sem data', () => {
  assertEquals(AVISOS.cartao(sub()).corpo, 'Atualize o cartão em Planos. Depois disso, a conta fica em só leitura.')
})

Deno.test('AVISOS.reembolso (Ruling 16)', () => {
  assertEquals(AVISOS.reembolso(), {
    titulo: 'Reembolso confirmado',
    corpo:
      'O Asaas confirmou o reembolso do plano. O valor volta para o cartão em até 10 dias úteis. Sua conta está em só leitura: tudo continua visível, e exportar e apagar seguem liberados.',
  })
})

Deno.test('AVISOS.fim', () => {
  assertEquals(AVISOS.fim(), {
    titulo: 'Seu plano terminou',
    corpo:
      'Sua conta está em só leitura: tudo continua visível, e exportar e apagar seguem liberados. Assine em Planos para voltar a lançar.',
  })
})

// planoDoCheckout

const AGORA = new Date('2027-03-01T12:00:00Z') // depois do fim do preço de fundador

Deno.test('planoDoCheckout: active esperando a confirmação de uma cobrança aceita é bloqueado', () => {
  const grace = iso(em(7 * DIA))
  assertEquals(planoDoCheckout(sub({ grace_until: grace }), AGORA, false), { tipo: 'bloqueado' })
  // mesmo com o fim já passado: um checkout novo cobraria duas vezes
  assertEquals(planoDoCheckout(sub({ grace_until: grace }), em(DIA), false), { tipo: 'bloqueado' })
})

Deno.test('planoDoCheckout: active no período, ou manual sem fim, é bloqueado', () => {
  assertEquals(planoDoCheckout(sub(), AGORA, false), { tipo: 'bloqueado' })
  assertEquals(planoDoCheckout(sub({ provider: 'manual', current_period_end: null }), AGORA, false), { tipo: 'bloqueado' })
})

Deno.test('planoDoCheckout: active com cancelamento marcado é bloqueado (a tela oferece desfazer)', () => {
  assertEquals(planoDoCheckout(sub({ cancel_at_period_end: true }), AGORA, false), { tipo: 'bloqueado' })
})

Deno.test('planoDoCheckout: pending ou past_due com checkout de menos de 24 h reusa o link', () => {
  const criado = iso(new Date(AGORA.getTime() - 23 * 60 * 60 * 1000))
  assertEquals(planoDoCheckout(sub({ status: 'pending', checkout_criado_em: criado }), AGORA, true), { tipo: 'reusar' })
  assertEquals(planoDoCheckout(sub({ status: 'past_due', checkout_criado_em: criado }), AGORA, true), { tipo: 'reusar' })
})

Deno.test('planoDoCheckout: past_due mantém o preço de fundador da linha depois de 31/01/2027', () => {
  const antigo = iso(new Date(AGORA.getTime() - 25 * 60 * 60 * 1000))
  const linha = sub({ status: 'past_due', price_cents: 23880, founder: true, checkout_criado_em: antigo })
  assertEquals(planoDoCheckout(linha, AGORA, false), { tipo: 'novo', centavos: 23880, fundador: true, renovacao: true })
})

Deno.test('planoDoCheckout: past_due sem price_cents cai no preço do founder da linha', () => {
  const linha = sub({ status: 'past_due', price_cents: null, founder: true })
  assertEquals(planoDoCheckout(linha, AGORA, false), { tipo: 'novo', centavos: 23880, fundador: true, renovacao: true })
})

Deno.test('planoDoCheckout: expired volta ao preço do dia', () => {
  const linha = sub({ status: 'expired', price_cents: 23880, founder: true })
  assertEquals(planoDoCheckout(linha, AGORA, false), { tipo: 'novo', centavos: 35880, fundador: false, renovacao: false })
  assertEquals(planoDoCheckout(linha, new Date('2026-12-01T12:00:00Z'), false), {
    tipo: 'novo',
    centavos: 23880,
    fundador: true,
    renovacao: false,
  })
})

Deno.test('planoDoCheckout: sem linha, ou pending antigo, é compra nova pelo preço do dia', () => {
  assertEquals(planoDoCheckout(null, AGORA, false), { tipo: 'novo', centavos: 35880, fundador: false, renovacao: false })
  const antigo = iso(new Date(AGORA.getTime() - 25 * 60 * 60 * 1000))
  assertEquals(planoDoCheckout(sub({ status: 'pending', checkout_criado_em: antigo }), AGORA, false), {
    tipo: 'novo',
    centavos: 35880,
    fundador: false,
    renovacao: false,
  })
  assertEquals(planoDoCheckout(sub({ status: 'pending', checkout_criado_em: null }), AGORA, false).tipo, 'novo')
})

Deno.test('planoDoCheckout (Ruling 6): active vencido, sem carência nem cancelamento, é past_due com o preço da linha', () => {
  const linha = sub({ current_period_end: '2027-02-20T12:00:00Z', founder: true, price_cents: 23880 })
  assertEquals(planoDoCheckout(linha, AGORA, false), { tipo: 'novo', centavos: 23880, fundador: true, renovacao: true })
  const criado = iso(new Date(AGORA.getTime() - 60 * 60 * 1000))
  assertEquals(planoDoCheckout({ ...linha, checkout_criado_em: criado }, AGORA, true), { tipo: 'reusar' })
})

Deno.test('planoDoCheckout: checkout recente sem link não é reusado; com menos de 2 minutos, aguarda', () => {
  const ha = (ms: number) => iso(new Date(AGORA.getTime() - ms))
  const linha = (criado: string) => sub({ status: 'past_due', checkout_criado_em: criado })
  assertEquals(planoDoCheckout(linha(ha(60 * 1000)), AGORA, false), { tipo: 'aguardar' })
  assertEquals(planoDoCheckout(sub({ status: 'pending', checkout_criado_em: ha(60 * 1000) }), AGORA, false), {
    tipo: 'aguardar',
  })
  // passados 2 minutos sem link, a tentativa morreu: compra de novo (o checkout lista antes de criar)
  assertEquals(planoDoCheckout(linha(ha(3 * 60 * 1000)), AGORA, false), {
    tipo: 'novo',
    centavos: 35880,
    fundador: false,
    renovacao: true,
  })
  // com link, mas de mais de 24 h, também
  assertEquals(planoDoCheckout(linha(ha(25 * 60 * 60 * 1000)), AGORA, true).tipo, 'novo')
})

// triagemDasAbertas

const aberta = (x: Partial<CobrancaAberta> = {}): CobrancaAberta => ({
  id: 'pay_1',
  installment: 'inst_1',
  customer: 'cus_1',
  externalReference: 'sub-1',
  status: 'PENDING',
  value: 19.9,
  dueDate: '2026-11-01',
  invoiceUrl: 'https://asaas/i/pay_1',
  ...x,
})
const parcelas = (inst: string, valor: number, x: Partial<CobrancaAberta> = {}) =>
  Array.from({ length: 12 }, (_, i) =>
    aberta({
      id: `${inst}_${i + 1}`,
      installment: inst,
      value: valor,
      dueDate: `2027-${String(i + 1).padStart(2, '0')}-01`,
      invoiceUrl: `https://asaas/i/${inst}_${i + 1}`,
      ...x,
    }))

Deno.test('triagemDasAbertas: nada aberto, nada a fazer', () => {
  assertEquals(triagemDasAbertas([], 23880, 'cus_1', null), { reusar: null, remover: [] })
})

Deno.test('triagemDasAbertas: o parcelamento com o mesmo total e o mesmo cliente é reusado pela 1ª parcela', () => {
  const abertas = parcelas('inst_a', 19.9).reverse()
  const t = triagemDasAbertas(abertas, 23880, 'cus_1', null)
  assertEquals(t.reusar?.id, 'inst_a_1')
  assertEquals(t.remover, [])
})

Deno.test('triagemDasAbertas: com uma parcela vencida (OVERDUE), o parcelamento é removido, nunca reusado', () => {
  const abertas = parcelas('inst_a', 19.9).map((c, i) => i < 2 ? { ...c, status: 'OVERDUE' } : c)
  const t = triagemDasAbertas(abertas, 23880, 'cus_1', null)
  assertEquals(t.reusar, null)
  assertEquals(t.remover.map((c) => c.installment), ['inst_a'])
})

Deno.test('triagemDasAbertas: o parcelamento que está sendo pago (provider_ref) nunca é tocado', () => {
  const abertas = [...parcelas('inst_pago', 29.9), ...parcelas('inst_pago2', 19.9).map((c) => ({ ...c, status: 'OVERDUE' }))]
  assertEquals(triagemDasAbertas(abertas, 23880, 'cus_1', 'inst_pago'), {
    reusar: null,
    remover: [abertas[12]],
  })
  // nem reusado, mesmo com o total pedido
  assertEquals(triagemDasAbertas(parcelas('inst_pago', 19.9), 23880, 'cus_1', 'inst_pago'), { reusar: null, remover: [] })
})

Deno.test('triagemDasAbertas: outro valor, outro cliente, avulsa ou um segundo igual são removidos, um por parcelamento', () => {
  const abertas = [
    ...parcelas('inst_caro', 29.9),
    ...parcelas('inst_outro', 19.9, { customer: 'cus_2' }),
    aberta({ id: 'pay_avulsa', installment: null, value: 238.8 }),
    ...parcelas('inst_ok', 19.9),
    ...parcelas('inst_ok2', 19.9),
  ]
  const t = triagemDasAbertas(abertas, 23880, 'cus_1', null)
  assertEquals(t.reusar?.id, 'inst_ok_1')
  assertEquals(t.remover.map((c) => [c.id, c.installment]), [
    ['inst_caro_1', 'inst_caro'],
    ['inst_outro_1', 'inst_outro'],
    ['pay_avulsa', null],
    ['inst_ok2_1', 'inst_ok2'],
  ])
})

// pagamentoEmDobro (Ruling 8, decidido pelo registro da Ruling 9)

const reg = (x: Partial<Parcelamento> = {}): Parcelamento => ({
  installment: 'inst-novo',
  subscription_id: 'sub-1',
  ativado_em: null,
  estorno_status: null,
  estorno_tentado_em: null,
  ...x,
})

Deno.test('pagamentoEmDobro: um parcelamento nosso nunca ativado, numa linha paga fora da janela, é em dobro', () => {
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub(), reg(), em(-30 * DIA)), true)
  assertEquals(pagamentoEmDobro('PAYMENT_RECEIVED', pag(), sub(), reg(), em(-3 * DIA - 1)), true)
})

Deno.test('pagamentoEmDobro: o parcelamento já ativado (evento mensal) nunca é dobro — a parcela de X depois da renovação Y', () => {
  // A repro da revisão: X pagou o ano passado; a renovação Y já confirmou; o RECEIVED mensal de X chega depois.
  const renovada = sub({ provider_ref: 'inst-Y', current_period_end: '2028-03-10T15:00:00.000Z' })
  const x = pag({ installment: 'inst-X' })
  const regX = reg({ installment: 'inst-X', ativado_em: '2026-03-10T15:00:00.000Z' })
  assertEquals(efeitoDoEvento('PAYMENT_RECEIVED', x, renovada, em(3 * DIA)), null)
  assertEquals(pagamentoEmDobro('PAYMENT_RECEIVED', x, renovada, regX, em(3 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', x, renovada, regX, em(30 * DIA)), false)
  // a compra nova Z depois de expirar, com a parcela atrasada de X
  const compraZ = sub({ provider_ref: 'inst-Z', current_period_end: '2027-06-01T12:00:00.000Z' })
  assertEquals(pagamentoEmDobro('PAYMENT_RECEIVED', x, compraZ, regX, new Date('2026-06-20T12:00:00Z')), false)
})

Deno.test('pagamentoEmDobro: sem registro, ou registro de outra linha ou de outro parcelamento, não é dobro', () => {
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub(), null, em(-30 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub(), reg({ subscription_id: 'sub-2' }), em(-30 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub(), reg({ installment: 'inst-outro' }), em(-30 * DIA)), false)
})

Deno.test('pagamentoEmDobro: na janela da renovação é renovação, não dobro', () => {
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub(), reg(), em(-3 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub(), reg(), em(-2 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub({ grace_until: iso(em(7 * DIA)) }), reg(), em(DIA)), false)
})

Deno.test('pagamentoEmDobro: o mesmo parcelamento, sem parcelamento ou de outra linha não é dobro', () => {
  const velho = reg({ installment: 'inst-velho' })
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag({ installment: 'inst-velho' }), sub(), velho, em(-30 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag({ installment: null }), sub(), reg(), em(-30 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag({ externalReference: 'sub-2' }), sub(), reg(), em(-30 * DIA)), false)
})

Deno.test('pagamentoEmDobro: só numa linha active e só com pagamento confirmado', () => {
  for (const status of ['pending', 'past_due', 'expired'] as const) {
    assertEquals(pagamentoEmDobro('PAYMENT_CONFIRMED', pag(), sub({ status }), reg(), em(-30 * DIA)), false)
  }
  assertEquals(pagamentoEmDobro('PAYMENT_REFUNDED', pag(), sub(), reg(), em(-30 * DIA)), false)
  assertEquals(pagamentoEmDobro('PAYMENT_CREATED', pag(), sub(), reg(), em(-30 * DIA)), false)
})

// jaEstornado (Ruling 10)

Deno.test('jaEstornado: estorno pedido ou feito conta; cancelado ou nenhum não', () => {
  assertEquals(jaEstornado({ refunds: [{ status: 'DONE' }] }), true)
  assertEquals(jaEstornado({ refunds: [{ status: 'PENDING' }] }), true)
  assertEquals(jaEstornado({ status: 'REFUND_REQUESTED', refunds: null }), true)
  assertEquals(jaEstornado({ status: 'REFUNDED' }), true)
  assertEquals(jaEstornado({ refunds: [{ status: 'CANCELLED' }] }), false)
  assertEquals(jaEstornado({ refunds: null }), false)
  assertEquals(jaEstornado({ status: 'CONFIRMED', refunds: [] }), false)
})

// checkoutPendente (Ruling 17)

Deno.test('checkoutPendente: a fatura paga de um parcelamento nunca ativado espera o webhook', () => {
  const c = { status: 'RECEIVED', installment: 'inst-C' }
  assertEquals(checkoutPendente(c, 'inst-velho', reg({ installment: 'inst-C' })), true)
  assertEquals(checkoutPendente({ ...c, status: 'CONFIRMED' }, 'inst-velho', null), true)
})

Deno.test('checkoutPendente (C1): na 2ª renovação o checkout do ano 0, já ativado, não bloqueia', () => {
  // Ano 0: o checkout C do parcelamento X ativou. Ano 1: o cron renovou com Y. Ano 2: C segue RECEIVED.
  const c = { status: 'RECEIVED', installment: 'inst-X' }
  assertEquals(checkoutPendente(c, 'inst-X', reg({ installment: 'inst-X', ativado_em: '2026-03-10T15:00:00.000Z' })), false)
  assertEquals(checkoutPendente(c, 'inst-Y', reg({ installment: 'inst-X', ativado_em: '2026-03-10T15:00:00.000Z' })), false)
})

Deno.test('checkoutPendente: aberta, sem parcelamento ou do próprio plano não espera', () => {
  assertEquals(checkoutPendente({ status: 'PENDING', installment: 'inst-C' }, 'inst-velho', null), false)
  assertEquals(checkoutPendente({ status: 'RECEIVED', installment: null }, 'inst-velho', null), false)
  assertEquals(checkoutPendente({ status: 'RECEIVED', installment: 'inst-velho' }, 'inst-velho', null), false)
})

// resultadoDaCobranca (Ruling 18)

Deno.test('resultadoDaCobranca: confirmada ativa; aceita espera', () => {
  assertEquals(resultadoDaCobranca({ ok: true, dados: { status: 'CONFIRMED' } }), 'ativar')
  assertEquals(resultadoDaCobranca({ ok: true, dados: { status: 'RECEIVED' } }), 'ativar')
  assertEquals(resultadoDaCobranca({ ok: true, dados: { status: 'PENDING' } }), 'esperar')
})

Deno.test('resultadoDaCobranca (I1): só o 4xx é recusa; rede, prazo, 5xx e 200 ilegível esperam', () => {
  for (const status of [400, 402, 404, 422, 499]) assertEquals(resultadoDaCobranca({ ok: false, status }), 'recusada')
  for (const status of [0, 200, 500, 502, 503]) assertEquals(resultadoDaCobranca({ ok: false, status }), 'esperar')
})

// vereditoDaEspera (Ruling 19)

Deno.test('vereditoDaEspera: nada criado desde a tentativa é "nenhuma"', () => {
  assertEquals(vereditoDaEspera([], 'inst-velho', '2027-03-08'), { tipo: 'nenhuma' })
  const antigas = [
    pag({ installment: 'inst-velho', status: 'RECEIVED', dateCreated: '2027-03-08' }),
    pag({ installment: 'inst-X', status: 'RECEIVED', dateCreated: '2026-03-08' }),
    pag({ installment: 'inst-C', status: 'PENDING', dateCreated: '2027-03-08', deleted: true }),
    pag({ installment: null, status: 'PENDING', dateCreated: '2027-03-08' }),
  ]
  assertEquals(vereditoDaEspera(antigas, 'inst-velho', '2027-03-08'), { tipo: 'nenhuma' })
})

Deno.test('vereditoDaEspera: a paga desde a tentativa ativa; a pendente espera', () => {
  const paga = pag({ id: 'pay-2', installment: 'inst-Y', status: 'CONFIRMED', dateCreated: '2027-03-08' })
  const pendente = pag({ id: 'pay-3', installment: 'inst-Z', status: 'PENDING', dateCreated: '2027-03-09' })
  assertEquals(vereditoDaEspera([pendente, paga], 'inst-velho', '2027-03-08'), { tipo: 'paga', pagamento: paga })
  assertEquals(vereditoDaEspera([pendente], 'inst-velho', '2027-03-08'), { tipo: 'pendente' })
})

// notaPendente (Ruling 21)

Deno.test('notaPendente: a nota sai depois da janela de arrependimento, uma por período', () => {
  const agora = new Date('2026-11-05T12:00:00Z')
  const linha = { status: 'active' as const, provider_ref: 'inst-1', reembolsavel_ate: '2026-11-08T12:00:00.000Z', nfse_para: null }
  assertEquals(notaPendente(linha, null, agora), false)
  assertEquals(notaPendente(linha, null, new Date('2026-11-08T12:00:00Z')), true)
  assertEquals(notaPendente({ ...linha, reembolsavel_ate: null }, null, agora), true) // renovação: sem janela
  assertEquals(notaPendente({ ...linha, reembolsavel_ate: null, nfse_para: 'inst-1' }, null, agora), false)
  assertEquals(notaPendente({ ...linha, reembolsavel_ate: null, status: 'expired' }, null, agora), false)
  assertEquals(notaPendente({ ...linha, reembolsavel_ate: null, provider_ref: null }, null, agora), false)
})

Deno.test('notaPendente: nunca para um parcelamento com estorno pendente ou feito', () => {
  const agora = new Date('2027-01-01T12:00:00Z')
  const linha = { status: 'active' as const, provider_ref: 'inst-1', reembolsavel_ate: null, nfse_para: null }
  assertEquals(notaPendente(linha, { estorno_status: 'pendente' }, agora), false)
  assertEquals(notaPendente(linha, { estorno_status: 'feito' }, agora), false)
  assertEquals(notaPendente(linha, { estorno_status: null }, agora), true)
})

// eventoDaLinha (N1)

Deno.test('eventoDaLinha: só a linha do Asaas, com cliente, e o mesmo cliente', () => {
  const asaas = { provider: 'asaas' as const, asaas_customer_id: 'cus-1' }
  assertEquals(eventoDaLinha(asaas, { customer: 'cus-1' }), true)
  assertEquals(eventoDaLinha(asaas, { customer: 'cus-2' }), false)
})

Deno.test('eventoDaLinha (N1): customer nulo nunca casa com a linha sem cliente, nem fora do Asaas', () => {
  const nulo = { customer: null as unknown as string }
  // a pending cujo criarCliente falhou
  assertEquals(eventoDaLinha({ provider: 'asaas', asaas_customer_id: null }, nulo), false)
  // a vitalícia manual e as das lojas
  for (const provider of ['manual', 'apple', 'google'] as const) {
    assertEquals(eventoDaLinha({ provider, asaas_customer_id: null }, nulo), false)
    assertEquals(eventoDaLinha({ provider, asaas_customer_id: 'cus-1' }, { customer: 'cus-1' }), false)
  }
  assertEquals(eventoDaLinha({ provider: 'asaas', asaas_customer_id: 'cus-1' }, nulo), false)
})
