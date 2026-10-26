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
/** A renovação começa em `fim - 2 dias`: duas chances antes do fim (Ruling 20). */
const INICIO_DA_RENOVACAO_DIAS = 2
/**
 * Com a folga do webhook, um pagamento de outro parcelamento antes de
 * `fim - 3 dias` numa linha paga é parcela atrasada do parcelamento anterior,
 * não renovação (Ruling 3, com a Ruling 20).
 */
const JANELA_DA_RENOVACAO_DIAS = 3
/** Uma cobrança aceita que espera há mais que isso é conferida no Asaas (Ruling 19). */
const VERIFICAR_ESPERA_DIAS = 1

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
  /** `YYYY-MM-DD`, como o `GET /payments` devolve. */
  dateCreated?: string
  deleted?: boolean
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
      | 'status'
      | 'provider_ref'
      | 'current_period_end'
      | 'grace_until'
      | 'reembolsavel_ate'
      | 'cancel_at_period_end'
      | 'checkout_criado_em'
    >
  >
  & {
    card_token?: string | null
    card_last4?: string | null
    card_brand?: string | null
    checkout_ref?: string | null
    checkout_url?: string | null
  }

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
      // Ruling 17: a ativação fecha a tentativa; o checkout_ref antigo não fica parecendo "pago, esperando".
      checkout_ref: null,
      checkout_url: null,
      checkout_criado_em: null,
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

/**
 * N1: um evento só vale para a linha do Asaas com cliente, e com o mesmo
 * cliente. `null === null` deixaria um evento forjado ativar uma linha
 * `manual`, ou uma `pending` cujo cliente não chegou a ser criado.
 */
export function eventoDaLinha(
  linha: Pick<Assinatura, 'provider'> & { asaas_customer_id: string | null },
  pagamento: Pick<Pagamento, 'customer'>,
): boolean {
  return linha.provider === 'asaas' && !!linha.asaas_customer_id && pagamento.customer === linha.asaas_customer_id
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

/**
 * O que o cron diário faz com a linha hoje. A renovação começa dois dias antes
 * do fim (Decisão 8, Ruling 20). `'verificar'` é a cobrança aceita que espera
 * há mais de um dia: o cron a confere no Asaas (Ruling 19).
 */
export function acaoDoDia(
  sub: Assinatura,
  agora: Date,
): 'avisar_renovacao' | 'renovar' | 'verificar' | 'expirar' | null {
  if (sub.provider !== 'asaas' || !sub.current_period_end) return null
  const fim = new Date(sub.current_period_end)
  const esperandoWebhook = sub.checkout_criado_em !== null &&
    agora.getTime() - new Date(sub.checkout_criado_em).getTime() < ESPERA_DO_CHECKOUT_DIAS * DIA_MS

  if (sub.status === 'active') {
    // Ruling 2: a cobrança já foi aceita e espera a confirmação; cobrar de novo seria cobrar duas vezes.
    if (sub.grace_until) {
      if (agora >= new Date(sub.grace_until)) return 'expirar'
      const tentativa = sub.checkout_criado_em ? new Date(sub.checkout_criado_em).getTime() : 0
      return agora.getTime() - tentativa > VERIFICAR_ESPERA_DIAS * DIA_MS ? 'verificar' : null
    }
    if (sub.cancel_at_period_end) return agora >= fim ? 'expirar' : null
    if (agora >= maisDias(fim, -INICIO_DA_RENOVACAO_DIAS)) return esperandoWebhook ? null : 'renovar'
    if (agora >= maisDias(fim, -AVISO_RENOVACAO_DIAS)) return 'avisar_renovacao'
    return null
  }

  if (sub.status === 'past_due') {
    if (agora >= limiteDoAtraso(sub, fim)) return 'expirar'
    // Ruling 11: quem cancelou com o cartão recusado não é cobrado de novo.
    if (sub.cancel_at_period_end) return null
    return esperandoWebhook ? null : 'renovar'
  }

  return null
}

/** Até quando um `past_due` segue com o plano: a `grace_until`, ou o fim mais a tolerância. */
const limiteDoAtraso = (sub: Assinatura, fim: Date) =>
  sub.grace_until ? new Date(sub.grace_until) : maisDias(fim, TOLERANCIA_DIAS)

/** A cobrança por token leva até `PRAZO_CARTAO_MS` (60 s); 5 min cobrem ela e a gravação do resultado. */
const COBRANCA_EM_VOO_MS = 5 * 60 * 1000

/**
 * O "cancelar em 1 toque": vale no `active` e no `past_due` (Ruling 11) do
 * Asaas. `'renovando'` é um `active` com `grace_until`: a renovação foi cobrada
 * e espera a confirmação, que desligaria o cancelamento em silêncio (Ruling 12).
 * `'cobrando'` é um `checkout_criado_em` de menos de 5 min: a cobrança pode
 * estar em voo.
 */
export function podeCancelar(sub: Assinatura, agora: Date): 'sim' | 'renovando' | 'cobrando' | 'nao' {
  if (sub.provider !== 'asaas' || (sub.status !== 'active' && sub.status !== 'past_due')) return 'nao'
  // A cobrança por token pode estar em voo (até 60 s) e a confirmação desligaria o cancelamento.
  if (sub.checkout_criado_em && agora.getTime() - new Date(sub.checkout_criado_em).getTime() < COBRANCA_EM_VOO_MS) {
    return 'cobrando'
  }
  if (sub.status === 'active' && sub.grace_until) return 'renovando'
  return 'sim'
}

/** Desfazer o cancelamento enquanto o plano não acabou: o período, ou a tolerância de um `past_due`. */
export function podeDesfazer(sub: Assinatura, agora: Date): boolean {
  if (sub.provider !== 'asaas' || !sub.cancel_at_period_end || !sub.current_period_end) return false
  const fim = new Date(sub.current_period_end)
  if (sub.status === 'active') return agora < fim
  return sub.status === 'past_due' && agora < limiteDoAtraso(sub, fim)
}

export function podeReembolsar(sub: Assinatura, agora: Date): boolean {
  return sub.status === 'active' && sub.reembolsavel_ate !== null && agora < new Date(sub.reembolsavel_ate)
}

/**
 * Ruling 17: a fatura do checkout está paga e espera o webhook — só se o
 * parcelamento dela não é o do plano e nunca ativou. Um já ativado é um
 * período que passou, não um pagamento pendente.
 */
export function checkoutPendente(
  cobranca: { status: string; installment: string | null },
  providerRef: string | null,
  registro: Pick<Parcelamento, 'ativado_em'> | null,
): boolean {
  const paga = cobranca.status === 'CONFIRMED' || cobranca.status === 'RECEIVED'
  return paga && !!cobranca.installment && cobranca.installment !== providerRef && !registro?.ativado_em
}

/**
 * Ruling 18 e 26: o que a resposta da cobrança por token quer dizer. 401, 403,
 * 408 e 429 não são o cartão nem cobraram: a chave ou o limite — `'soltar'`
 * devolve a tentativa e o cron tenta no dia seguinte, sem aviso. Só os outros
 * 4xx são recusa (o Asaas não cria a cobrança recusada); 5xx, rede, prazo
 * estourado ou 200 ilegível podem ter cobrado, e esperam (a verificação da
 * Ruling 19 confere no dia seguinte).
 */
export function resultadoDaCobranca(
  r: { ok: true; dados: { status: string } } | { ok: false; status: number },
): 'ativar' | 'esperar' | 'recusada' | 'soltar' {
  if (r.ok) return r.dados.status === 'CONFIRMED' || r.dados.status === 'RECEIVED' ? 'ativar' : 'esperar'
  if ([401, 403, 408, 429].includes(r.status)) return 'soltar'
  return r.status >= 400 && r.status < 500 ? 'recusada' : 'esperar'
}

/** Os status de uma cobrança que ainda pode ser paga (I1). REFUSED, REPROVED…, OVERDUE e os estornos não. */
const COBRANCA_VIVA = ['PENDING', 'AWAITING_RISK_ANALYSIS', 'AUTHORIZED']

/**
 * Ruling 19: as cobranças da linha no Asaas, desde o dia da tentativa, dizem
 * se a renovação em espera foi paga, segue pendente ou nunca foi criada. O
 * parcelamento do plano (`provider_ref`) e as removidas não contam. I1: só um
 * parcelamento com todas as parcelas vivas está pendente; um com qualquer
 * parcela recusada, vencida ou estornada morreu e conta como "nenhuma" — a
 * pessoa recebe o aviso do cartão e paga pelo checkout no preço da linha. M5:
 * a cobrança sem `dateCreated` conta (o filtro do servidor já cortou).
 */
export function vereditoDaEspera(
  pagamentos: Pagamento[],
  providerRef: string | null,
  desde: string,
): { tipo: 'nenhuma' } | { tipo: 'paga'; pagamento: Pagamento } | { tipo: 'pendente' } {
  const dela = pagamentos.filter((p) =>
    !p.deleted && !!p.installment && p.installment !== providerRef && (!p.dateCreated || p.dateCreated >= desde)
  )
  const paga = dela.find((p) => p.status === 'CONFIRMED' || p.status === 'RECEIVED')
  if (paga) return { tipo: 'paga', pagamento: paga }
  const mortos = new Set(dela.filter((p) => !COBRANCA_VIVA.includes(p.status)).map((p) => p.installment))
  return dela.some((p) => !mortos.has(p.installment)) ? { tipo: 'pendente' } : { tipo: 'nenhuma' }
}

/**
 * Ruling 21: a NFS-e do período sai depois da janela de arrependimento (a
 * renovação não tem janela) e nunca para um parcelamento com estorno.
 */
export function notaPendente(
  sub: Pick<Assinatura, 'status' | 'provider_ref' | 'reembolsavel_ate'> & { nfse_para: string | null },
  registro: Pick<Parcelamento, 'estorno_status'> | null,
  agora: Date,
): boolean {
  return sub.status === 'active' && !!sub.provider_ref && sub.nfse_para !== sub.provider_ref &&
    (!sub.reembolsavel_ate || agora >= new Date(sub.reembolsavel_ate)) && !registro?.estorno_status
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
  /** O reembolso do arrependimento concluído (Ruling 16): no billing-cancel e no cron. */
  reembolso(): { titulo: string; corpo: string } {
    return {
      titulo: 'Reembolso confirmado',
      corpo:
        'O Asaas confirmou o reembolso do plano. O valor volta para o cartão em até 10 dias úteis. Sua conta está em só leitura: tudo continua visível, e exportar e apagar seguem liberados.',
    }
  },
  /** A cobrança em dobro estornada (Ruling 8): o webhook e o cron, ao concluir um estorno pendente. */
  estorno(): { titulo: string; corpo: string } {
    return {
      titulo: 'Cobrança em dobro devolvida',
      corpo:
        'Recebemos um pagamento a mais pelo plano e já pedimos o estorno ao Asaas. O valor volta para o cartão em até 10 dias úteis.',
    }
  },
}

/** Os avisos de texto fixo: ficam pendentes em `billing_avisos` até a entrega dar certo (#87). */
export type TipoDeAvisoFixo = 'fim' | 'reembolso' | 'estorno'

/** O texto de um aviso pendente, para o reenvio; `null` para os que dependem da linha. */
export function avisoFixo(tipo: string): { titulo: string; corpo: string } | null {
  if (tipo === 'fim') return AVISOS.fim()
  if (tipo === 'reembolso') return AVISOS.reembolso()
  if (tipo === 'estorno') return AVISOS.estorno()
  return null
}

/**
 * O estorno pendente concluído pelo cron (#87 c): o parcelamento ativado é o
 * do plano pago, e o estorno dele é o reembolso do arrependimento; o nunca
 * ativado é a cobrança em dobro. Decide pelo registro, não pelo
 * `provider_ref` de agora, que uma compra nova troca.
 */
export function textoDoEstornoConcluido(p: { ativado_em: string | null }): 'reembolso' | 'estorno' {
  return p.ativado_em ? 'reembolso' : 'estorno'
}

export type CarteiraDoAviso = { id: string; type: string | null; role: string; created_at: string | null }

/**
 * A carteira onde o aviso de plano entra (#87 b): a pessoal, senão a mais
 * antiga em que a pessoa é dona, senão qualquer uma (a mais antiga). `null`
 * sem nenhuma: o aviso vai só por e-mail.
 */
export function destinoDoAviso(carteiras: CarteiraDoAviso[]): string | null {
  const peso = (c: CarteiraDoAviso) => c.role !== 'owner' ? 2 : c.type === 'personal' ? 0 : 1
  const data = (c: CarteiraDoAviso) => c.created_at ? new Date(c.created_at).getTime() : Infinity
  return [...carteiras].sort((a, b) => peso(a) - peso(b) || data(a) - data(b))[0]?.id ?? null
}
