import { type Dinheiro, dinheiro } from './resposta.ts'

type Item = { id: string; nome: string; vencimento: string; valor: Dinheiro | null }

const centavos = (v: string | number) => Math.round(Number(v) * 100)

function somaDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function contasAPagar(
  instancias: {
    id: string
    nome: string
    due_date: string
    amount: string | number | null
    status: 'pending' | 'paid' | 'skipped'
  }[],
  hoje: string,
  dias: number,
): { vencidas: Item[]; a_vencer: Item[]; total: Dinheiro } {
  const limite = somaDias(hoje, dias)
  const pendentes = instancias
    .filter((i) => i.status === 'pending' && i.due_date <= limite)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
  const item = (i: (typeof pendentes)[number]): Item => ({
    id: i.id,
    nome: i.nome,
    vencimento: i.due_date,
    valor: i.amount == null ? null : dinheiro(centavos(i.amount)),
  })
  const total = pendentes.reduce((s, i) => s + (i.amount == null ? 0 : centavos(i.amount)), 0)
  return {
    vencidas: pendentes.filter((i) => i.due_date < hoje).map(item),
    a_vencer: pendentes.filter((i) => i.due_date >= hoje).map(item),
    total: dinheiro(total),
  }
}

// Mensal equivalente em centavos; semanal × 52 / 12, anual / 12, bimestral / 2.
const aoMes = { weekly: (c: number) => (c * 52) / 12, monthly: (c: number) => c, bimonthly: (c: number) => c / 2, yearly: (c: number) => c / 12 }

export function assinaturasAtivas(
  linhas: {
    id: string
    name: string
    amount: string | number
    billing_interval: 'weekly' | 'monthly' | 'bimonthly' | 'yearly'
    next_billing_date: string | null
    is_active: boolean
  }[],
): {
  itens: { id: string; nome: string; valor: Dinheiro; intervalo: string; proxima_cobranca: string | null }[]
  total_mensal: Dinheiro
} {
  const ativas = linhas.filter((l) => l.is_active)
  const total = ativas.reduce((s, l) => s + Math.round(aoMes[l.billing_interval](centavos(l.amount))), 0)
  return {
    itens: ativas.map((l) => ({
      id: l.id,
      nome: l.name,
      valor: dinheiro(centavos(l.amount)),
      intervalo: l.billing_interval,
      proxima_cobranca: l.next_billing_date,
    })),
    total_mensal: dinheiro(total),
  }
}
