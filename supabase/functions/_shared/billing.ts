/**
 * As regras de cobrança do Plano Família (Bloco 8), puras: nada aqui lê banco,
 * relógio ou rede. O webhook (`efeitoDoEvento`), o cron (`acaoDoDia`) e o
 * cancelamento (`podeReembolsar`) decidem por elas, e os testes as travam.
 */
import { appTodayYmd } from './credit-card-cycle.ts'
import { currencyBRL } from './formatters.ts'
import { FIM_FUNDADORES, PRECO_FAMILIA_CENTAVOS, PRECO_FUNDADOR_CENTAVOS } from './plano.ts'

export const PARCELAS = 12
export const TOLERANCIA_DIAS = 7
export const AVISO_RENOVACAO_DIAS = 7
export const ARREPENDIMENTO_DIAS = 7
/** Uma cobrança criada há menos que isso ainda espera o webhook: não cobra de novo. */
const ESPERA_DO_CHECKOUT_DIAS = 2
/**
 * Só cobramos a renovação a partir de `fim - 1 dia`; com a folga do webhook, um
 * pagamento de outro parcelamento antes de `fim - 2 dias` numa linha paga é
 * parcela atrasada do parcelamento anterior, não renovação (Ruling 3).
 */
const JANELA_DA_RENOVACAO_DIAS = 2

const DIA_MS = 24 * 60 * 60 * 1000

export type Status = 'pending' | 'active' | 'past_due' | 'expired'
export type Assinatura = {
  id: string
  user_id: string
  provider: 'asaas' | 'manual' | 'apple' | 'google'
  provider_ref: string | null
  status: Status
  current_period_end: string | null
  cancel_at_period_end: boolean
  price_cents: number | null
  founder: boolean
  grace_until: string | null
  reembolsavel_ate: string | null
  card_token: string | null
  checkout_criado_em: string | null
}
export type Pagamento = {
  id: string
  installment: string | null
  customer: string
  externalReference: string | null
  status: string
  creditCard?: {
    creditCardToken?: string | null
    creditCardNumber?: string | null
    creditCardBrand?: string | null
  } | null
}
export type Mudanca =
  & Partial<
    Pick<
      Assinatura,
      'status' | 'provider_ref' | 'current_period_end' | 'grace_until' | 'reembolsavel_ate' | 'cancel_at_period_end'
    >
  >
  & { card_token?: string | null; card_last4?: string | null; card_brand?: string | null }

const maisDias = (d: Date, dias: number) => new Date(d.getTime() + dias * DIA_MS)
const maisUmAno = (d: Date) => {
  const r = new Date(d)
  r.setUTCFullYear(r.getUTCFullYear() + 1)
  return r
}

export function precoPara(agora: Date): { centavos: number; fundador: boolean } {
  return agora < new Date(FIM_FUNDADORES)
    ? { centavos: PRECO_FUNDADOR_CENTAVOS, fundador: true }
    : { centavos: PRECO_FAMILIA_CENTAVOS, fundador: false }
}

export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const verificador = (n: number) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  return verificador(9) === Number(d[9]) && verificador(10) === Number(d[10])
}

/** Um link de pagamento criado há menos que isso ainda vale: o checkout o devolve em vez de cobrar de novo. */
const VALIDADE_DO_CHECKOUT_MS = DIA_MS
/**
 * Um `checkout_criado_em` mais novo que isso e sem link é uma tentativa em
 * andamento: outro checkout que reivindicou a linha, ou o cron cobrando o
 * cartão (a Tarefa 6 grava a data antes de chamar o Asaas).
 */
const TENTATIVA_EM_ANDAMENTO_MS = 2 * 60 * 1000

export type PlanoDoCheckout =
  | { tipo: 'bloqueado' }
  | { tipo: 'reusar' }
  | { tipo: 'aguardar' }
  | { tipo: 'novo'; centavos: number; fundador: boolean; renovacao: boolean }

/**
 * O que o checkout faz com a linha da pessoa. `temLink` diz se a linha guarda a
 * `checkout_url`. Só uma compra depois de `expired` (ou sem linha) recalcula o
 * preço; o `past_due` recuperado, e o `active` vencido (Ruling 6), mantêm o da
 * linha.
 */
export function planoDoCheckout(sub: Assinatura | null, agora: Date, temLink: boolean): PlanoDoCheckout {
  if (sub?.status === 'active') {
    // A cobrança aceita espera a confirmação: um checkout novo cobraria duas vezes.
    if (sub.grace_until) return { tipo: 'bloqueado' }
    if (sub.cancel_at_period_end) return { tipo: 'bloqueado' }
    if (!sub.current_period_end || new Date(sub.current_period_end) > agora) return { tipo: 'bloqueado' }
  }
  // Daqui para baixo, um `active` está vencido: só acontece com o cron parado.
  const vencida = sub?.status === 'past_due' || sub?.status === 'active'
  if ((vencida || sub?.status === 'pending') && sub.checkout_criado_em) {
    const idade = agora.getTime() - new Date(sub.checkout_criado_em).getTime()
    if (temLink && idade < VALIDADE_DO_CHECKOUT_MS) return { tipo: 'reusar' }
    if (!temLink && idade < TENTATIVA_EM_ANDAMENTO_MS) return { tipo: 'aguardar' }
  }
  if (vencida) {
    return {
      tipo: 'novo',
      centavos: sub.price_cents ?? (sub.founder ? PRECO_FUNDADOR_CENTAVOS : PRECO_FAMILIA_CENTAVOS),
      fundador: sub.founder,
      renovacao: true,
    }
  }
  return { tipo: 'novo', ...precoPara(agora), renovacao: false }
}

/** Uma cobrança em aberto no Asaas (PENDING ou OVERDUE), como `GET /payments` a devolve. */
export type CobrancaAberta = Pagamento & { value: number; dueDate: string; invoiceUrl: string }

/**
 * O que fazer com as cobranças em aberto da linha antes de criar outra
 * (Ruling 7): um parcelamento nosso, do mesmo cliente, com o total pedido e
 * todo PENDING, é reusado pela 1ª parcela; todo o resto é removido, um item por
 * parcelamento (a remoção do parcelamento leva as 12 parcelas). Com uma parcela
 * OVERDUE ele é removido e trocado, para ninguém receber uma fatura morta. O
 * parcelamento que está sendo pago (`pago`, o `provider_ref` da linha) nunca é
 * tocado.
 */
export function triagemDasAbertas(
  abertas: CobrancaAberta[],
  centavos: number,
  cliente: string,
  pago: string | null,
): { reusar: CobrancaAberta | null; remover: CobrancaAberta[] } {
  const grupos = new Map<string, CobrancaAberta[]>()
  for (const c of abertas) {
    if (pago && c.installment === pago) continue
    const chave = c.installment ?? c.id
    grupos.set(chave, [...(grupos.get(chave) ?? []), c])
  }
  let reusar: CobrancaAberta | null = null
  const remover: CobrancaAberta[] = []
  for (const grupo of grupos.values()) {
    const primeira = grupo.reduce((a, b) => (b.dueDate < a.dueDate ? b : a))
    const total = grupo.reduce((soma, c) => soma + Math.round(c.value * 100), 0)
    const emDia = grupo.every((c) => c.status === 'PENDING')
    if (!reusar && emDia && primeira.installment && primeira.customer === cliente && total === centavos) {
      reusar = primeira
    } else remover.push(primeira)
  }
  return { reusar, remover }
}

/**
 * O que um evento de pagamento do Asaas muda na linha da pessoa. `null` é
 * "nada a fazer": outra pessoa, o mesmo parcelamento (as 12 parcelas mensais
 * disparam o mesmo evento) ou um evento que não nos importa.
 */
export function efeitoDoEvento(evento: string, pagamento: Pagamento, sub: Assinatura, agora: Date): Mudanca | null {
  if (pagamento.externalReference !== sub.id) return null
  const parcelamento = pagamento.installment

  if (evento === 'PAYMENT_CONFIRMED' || evento === 'PAYMENT_RECEIVED') {
    // Sem parcelamento não é cobrança nossa; com o mesmo, já foi ativado.
    if (!parcelamento || parcelamento === sub.provider_ref) return null
    const fimAntigo = sub.current_period_end ? new Date(sub.current_period_end) : null
    const emDia = (sub.status === 'active' || sub.status === 'past_due') && fimAntigo !== null
    if (emDia && agora < maisDias(fimAntigo, -JANELA_DA_RENOVACAO_DIAS)) return null
    const renovacao = emDia && maisDias(fimAntigo!, TOLERANCIA_DIAS) > agora
    const mudanca: Mudanca = {
      status: 'active',
      provider_ref: parcelamento,
      grace_until: null,
      cancel_at_period_end: false,
      ...(renovacao
        ? { current_period_end: maisUmAno(fimAntigo!).toISOString() }
        : {
          current_period_end: maisUmAno(agora).toISOString(),
          reembolsavel_ate: maisDias(agora, ARREPENDIMENTO_DIAS).toISOString(),
        }),
    }
    const cartao = pagamento.creditCard
    if (cartao?.creditCardToken) mudanca.card_token = cartao.creditCardToken
    if (cartao?.creditCardNumber) mudanca.card_last4 = cartao.creditCardNumber.slice(-4)
    if (cartao?.creditCardBrand) mudanca.card_brand = cartao.creditCardBrand
    return mudanca
  }

  if (evento === 'PAYMENT_REFUNDED' || evento === 'PAYMENT_CHARGEBACK_REQUESTED') {
    if (!parcelamento || parcelamento !== sub.provider_ref || sub.status === 'expired') return null
    return { status: 'expired', current_period_end: agora.toISOString() }
  }

  return null
}

/** Um parcelamento que nós criamos, em `billing_parcelamentos` (Ruling 9). */
export type Parcelamento = {
  installment: string
  subscription_id: string
  ativado_em: string | null
  estorno_status: 'pendente' | 'feito' | null
  estorno_tentado_em: string | null
}

/**
 * Ruling 8, decidida pelo registro (Ruling 9): um parcelamento nosso, desta
 * linha e nunca ativado, confirmado com a linha já paga no período por outro
 * (o `efeitoDoEvento` o ignora), é cobrança em dobro. Um já ativado é evento
 * mensal — a parcela de X que chega depois da renovação Y — e nunca é dobro.
 */
export function pagamentoEmDobro(
  evento: string,
  pagamento: Pagamento,
  sub: Assinatura,
  registro: Parcelamento | null,
  agora: Date,
): boolean {
  return (evento === 'PAYMENT_CONFIRMED' || evento === 'PAYMENT_RECEIVED') &&
    sub.status === 'active' &&
    pagamento.externalReference === sub.id &&
    !!pagamento.installment &&
    pagamento.installment !== sub.provider_ref &&
    registro?.installment === pagamento.installment &&
    registro.subscription_id === sub.id &&
    registro.ativado_em === null &&
    efeitoDoEvento(evento, pagamento, sub, agora) === null
}

/**
 * O parcelamento lido do Asaas já tem estorno pedido ou feito (Ruling 10): um
 * `refunds[]` que não foi cancelado, ou o status de estorno.
 */
export function jaEstornado(p: { status?: string | null; refunds?: { status?: string | null }[] | null }): boolean {
  if (p.status && ['REFUNDED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS'].includes(p.status)) return true
  return (p.refunds ?? []).some((r) => r.status !== 'CANCELLED')
}

/** O que o cron diário faz com a linha hoje. A renovação começa um dia antes do fim (Decisão 8). */
export function acaoDoDia(sub: Assinatura, agora: Date): 'avisar_renovacao' | 'renovar' | 'expirar' | null {
  if (sub.provider !== 'asaas' || !sub.current_period_end) return null
  const fim = new Date(sub.current_period_end)
  const esperandoWebhook = sub.checkout_criado_em !== null &&
    agora.getTime() - new Date(sub.checkout_criado_em).getTime() < ESPERA_DO_CHECKOUT_DIAS * DIA_MS

  if (sub.status === 'active') {
    // Ruling 2: a cobrança já foi aceita e espera a confirmação; cobrar de novo seria cobrar duas vezes.
    if (sub.grace_until) return agora >= new Date(sub.grace_until) ? 'expirar' : null
    if (sub.cancel_at_period_end) return agora >= fim ? 'expirar' : null
    if (agora >= maisDias(fim, -1)) return esperandoWebhook ? null : 'renovar'
    if (agora >= maisDias(fim, -AVISO_RENOVACAO_DIAS)) return 'avisar_renovacao'
    return null
  }

  if (sub.status === 'past_due') {
    const limite = sub.grace_until ? new Date(sub.grace_until) : maisDias(fim, TOLERANCIA_DIAS)
    if (agora >= limite) return 'expirar'
    return esperandoWebhook ? null : 'renovar'
  }

  return null
}

export function podeReembolsar(sub: Assinatura, agora: Date): boolean {
  return sub.status === 'active' && sub.reembolsavel_ate !== null && agora < new Date(sub.reembolsavel_ate)
}

/** O cartão recusou a renovação. A tolerância conta do fim do período e não se estende a cada tentativa. */
export function falhaNaRenovacao(sub: Assinatura, agora: Date): Mudanca {
  const base = sub.current_period_end ? new Date(sub.current_period_end) : agora
  return { status: 'past_due', grace_until: sub.grace_until ?? maisDias(base, TOLERANCIA_DIAS).toISOString() }
}

/**
 * O Asaas aceitou a cobrança da renovação, e falta o webhook: o plano segue até
 * `fim + 7 dias` (Decisão 8). Um `past_due` volta a `active` para o ramo da
 * Ruling 2 assumir e nada ser cobrado de novo na espera (Ruling 4).
 */
export function aguardandoConfirmacao(sub: Assinatura): Mudanca {
  if (!sub.current_period_end) throw new Error('aguardandoConfirmacao: assinatura sem current_period_end')
  return { status: 'active', grace_until: maisDias(new Date(sub.current_period_end), TOLERANCIA_DIAS).toISOString() }
}

const parcela = (sub: Assinatura) =>
  `${PARCELAS}x de ${currencyBRL(
    (sub.price_cents ?? (sub.founder ? PRECO_FUNDADOR_CENTAVOS : PRECO_FAMILIA_CENTAVOS)) / (PARCELAS * 100),
  )}`

/** "DD/MM" no horário de Brasília. */
const diaMes = (iso: string) => {
  const { m, d } = appTodayYmd(new Date(iso))
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

const CANCELAR = 'Cancelar é em 1 toque, em Planos.'

export const AVISOS = {
  renovacao(sub: Assinatura, final: string | null): { titulo: string; corpo: string } {
    const cartao = !sub.card_token
      ? '. Confirme o cartão em Planos para renovar.'
      : final
      ? ` no cartão final ${final}.`
      : '.'
    return { titulo: 'Seu plano renova em 7 dias', corpo: `A renovação é de ${parcela(sub)}${cartao} ${CANCELAR}` }
  },
  cartao(sub: Assinatura): { titulo: string; corpo: string } {
    const ate = sub.grace_until ? ` até ${diaMes(sub.grace_until)}` : ''
    return {
      titulo: 'Não conseguimos renovar seu plano',
      corpo: `Atualize o cartão em Planos${ate}. Depois disso, a conta fica em só leitura.`,
    }
  },
  fim(): { titulo: string; corpo: string } {
    return {
      titulo: 'Seu plano terminou',
      corpo:
        'Sua conta está em só leitura: tudo continua visível, e exportar e apagar seguem liberados. Assine em Planos para voltar a lançar.',
    }
  },
}
