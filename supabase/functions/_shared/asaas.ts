/**
 * O cliente HTTP do Asaas (API v3). Nenhuma função aqui envia dado de cartão:
 * a pessoa digita o cartão na fatura do Asaas, e a renovação usa só o
 * `creditCardToken` que ele devolveu.
 */
import { type Pagamento, PARCELAS } from './billing.ts'

export type AsaasConfig = { url: string; chave: string }
/** `incerto`: o prazo estourou e o Asaas pode ter processado o pedido (Ruling 5). */
export type RespostaAsaas<T> =
  | { ok: true; dados: T }
  | { ok: false; status: number; erros: string[]; incerto?: true }

const PRAZO_MS = 15_000
/** A cobrança no cartão pede pelo menos 60 s, pela orientação do Asaas. */
export const PRAZO_CARTAO_MS = 60_000

export function configDoAsaas(): AsaasConfig | null {
  const url = Deno.env.get('ASAAS_API_URL')?.trim()
  const chave = Deno.env.get('ASAAS_API_KEY')?.trim()
  if (!url || !chave) return null
  return { url: url.replace(/\/+$/, ''), chave }
}

export async function asaas<T>(
  cfg: AsaasConfig,
  metodo: 'GET' | 'POST',
  caminho: string,
  corpo?: unknown,
  prazoMs = PRAZO_MS,
): Promise<RespostaAsaas<T>> {
  let res: Response
  try {
    res = await fetch(cfg.url + caminho, {
      method: metodo,
      headers: { access_token: cfg.chave, 'Content-Type': 'application/json', 'User-Agent': 'finance-app' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(prazoMs),
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      return { ok: false, status: 0, incerto: true, erros: ['O Asaas não respondeu a tempo.'] }
    }
    return { ok: false, status: 0, erros: ['Falha de rede ao chamar o Asaas.'] }
  }
  const json = await res.json().catch(() => null)
  if (res.ok) {
    if (json === null) return { ok: false, status: res.status, erros: ['Resposta inválida do Asaas.'] }
    return { ok: true, dados: json as T }
  }
  const erros = Array.isArray(json?.errors)
    ? json.errors.map((e: { description?: unknown }) => String(e?.description ?? '')).filter(Boolean)
    : []
  return { ok: false, status: res.status, erros }
}

export function criarCliente(
  cfg: AsaasConfig,
  c: { nome: string; cpf: string; email: string | null; userId: string },
): Promise<RespostaAsaas<{ id: string }>> {
  return asaas(cfg, 'POST', '/customers', {
    name: c.nome,
    cpfCnpj: c.cpf.replace(/\D/g, ''),
    email: c.email,
    externalReference: c.userId,
    notificationDisabled: true,
  })
}

export function criarCobranca(cfg: AsaasConfig, c: {
  cliente: string
  centavos: number
  referencia: string
  vencimento: string // YYYY-MM-DD
  retorno?: string
  token?: string
  ip?: string | null
}): Promise<RespostaAsaas<Pagamento & { invoiceUrl: string }>> {
  const corpo = {
    customer: c.cliente,
    billingType: 'CREDIT_CARD',
    installmentCount: PARCELAS,
    totalValue: c.centavos / 100,
    dueDate: c.vencimento,
    description: 'Finance App — Plano Família (anual)',
    externalReference: c.referencia,
    ...(c.retorno ? { callback: { successUrl: c.retorno, autoRedirect: true } } : {}),
    ...(c.token ? { creditCardToken: c.token, remoteIp: c.ip } : {}),
  }
  return asaas(cfg, 'POST', '/payments', corpo, c.token ? PRAZO_CARTAO_MS : PRAZO_MS)
}

export function estornarParcelamento(cfg: AsaasConfig, parcelamento: string): Promise<RespostaAsaas<unknown>> {
  return asaas(cfg, 'POST', `/installments/${encodeURIComponent(parcelamento)}/refund`, {})
}

export function agendarNota(
  cfg: AsaasConfig,
  n: { parcelamento: string; centavos: number; data: string; codigo: string; nome: string },
): Promise<RespostaAsaas<{ id: string }>> {
  return asaas(cfg, 'POST', '/invoices', {
    installment: n.parcelamento,
    serviceDescription: 'Assinatura anual do Finance App, Plano Família',
    observations: '',
    value: n.centavos / 100,
    deductions: 0,
    effectiveDate: n.data,
    municipalServiceCode: n.codigo,
    municipalServiceName: n.nome,
    taxes: { retainIss: false, iss: 0, cofins: 0, csll: 0, inss: 0, ir: 0, pis: 0 },
  })
}
