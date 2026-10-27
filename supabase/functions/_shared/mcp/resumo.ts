import { ehEstornoNoCartao, sinalNaDespesa } from '../credit-card-cycle.ts'
import { type Dinheiro, dinheiro } from './resposta.ts'

export type LinhaLancamento = {
  amount: string | number
  type: 'income' | 'expense'
  date: string
  category_id: string | null
  payment_method: string | null
  payment_credit_card_id: string | null
}
export type Categoria = { id: string; name: string; type: 'income' | 'expense' }

const centavos = (l: LinhaLancamento) => Math.round(Number(l.amount) * 100)

// Estorno no cartão é receita no banco, mas abate despesa: não entra em receitas.
function totais(linhas: LinhaLancamento[]) {
  let receitas = 0
  let despesas = 0
  for (const l of linhas) {
    if (l.type === 'income' && !ehEstornoNoCartao(l)) receitas += centavos(l)
    despesas += sinalNaDespesa(l) * centavos(l)
  }
  return { receitas, despesas, saldo: receitas - despesas }
}

function tresValores(t: ReturnType<typeof totais>) {
  return { receitas: dinheiro(t.receitas), despesas: dinheiro(t.despesas), saldo: dinheiro(t.saldo) }
}

function gastoPorCategoria(linhas: LinhaLancamento[]) {
  const mapa = new Map<string | null, number>()
  for (const l of linhas) {
    const s = sinalNaDespesa(l)
    if (s !== 0) mapa.set(l.category_id, (mapa.get(l.category_id) ?? 0) + s * centavos(l))
  }
  return mapa
}

export function resumoDoMes(doMes: LinhaLancamento[], doAnterior: LinhaLancamento[], categorias: Categoria[]): {
  receitas: Dinheiro
  despesas: Dinheiro
  saldo: Dinheiro
  por_categoria: { categoria_id: string | null; nome: string; total: Dinheiro }[]
  mes_anterior: { receitas: Dinheiro; despesas: Dinheiro; saldo: Dinheiro }
} {
  const nomes = new Map(categorias.map((c) => [c.id, c.name]))
  const por_categoria = [...gastoPorCategoria(doMes)]
    .filter(([, total]) => total !== 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, total]) => ({
      categoria_id: id,
      nome: id ? (nomes.get(id) ?? 'Sem categoria') : 'Sem categoria',
      total: dinheiro(total),
    }))
  return {
    ...tresValores(totais(doMes)),
    por_categoria,
    mes_anterior: tresValores(totais(doAnterior)),
  }
}

export function orcamentosDoMes(
  orcamentos: { category_id: string; amount: string | number }[],
  doMes: LinhaLancamento[],
  categorias: Categoria[],
): { categoria_id: string; nome: string; orcado: Dinheiro; gasto: Dinheiro; percentual: number }[] {
  const nomes = new Map(categorias.map((c) => [c.id, c.name]))
  const gastos = gastoPorCategoria(doMes)
  return orcamentos.map((o) => {
    const orcado = Math.round(Number(o.amount) * 100)
    const gasto = gastos.get(o.category_id) ?? 0
    return {
      categoria_id: o.category_id,
      nome: nomes.get(o.category_id) ?? 'Sem categoria',
      orcado: dinheiro(orcado),
      gasto: dinheiro(gasto),
      percentual: orcado > 0 ? Math.round((gasto / orcado) * 100) : 0,
    }
  })
}
