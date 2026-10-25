/**
 * Os modelos de frase dos insights, em pt-BR e no tom neutro (spec §11: nunca
 * sermão). **Sem nenhum import**, como `detectores.ts`. O payload é o que o
 * detector gravou; um campo ausente sai vazio, nunca quebra.
 */

export type Texto = { titulo: string; corpo: string; acao: { rotulo: string; href: string } | null } // null = "Entendi"

/** O teste varre todos os modelos contra elas e contra o "!". */
export const PALAVRAS_PROIBIDAS: readonly string[] = ['culpado', 'irresponsável', 'deveria', 'cuidado']

/**
 * "R$ 1.234,56", escrito à mão como o `moneyBRL` de `notification-copy.ts`: o
 * `Intl` do Deno pode vir sem os dados de pt-BR e o texto sairia "BRL 1,234.56".
 * Negativo com U+2212; o espaço é o inseparável.
 */
function brl(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const cents = Math.round(Math.abs(value) * 100)
  const int = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${value < 0 && cents > 0 ? '−' : ''}R$ ${int},${String(cents % 100).padStart(2, '0')}`
}

/** "↑ 12,5%", "↓ 3,0%"; zero sai "= 0,0%". */
function pct(v: number): string {
  const seta = v > 0 ? '↑' : v < 0 ? '↓' : '='
  return `${seta} ${Math.abs(v).toFixed(1).replace('.', ',')}%`
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
/** "2026-03" → "março". */
const mesDe = (ym: unknown) => MESES[Number(String(ym).slice(5, 7)) - 1] ?? ''

/** "a", "a e b", "a, b e c". */
function lista(xs: string[]): string {
  return xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}`
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0))
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const transacoes = (p: Record<string, string>) => `/transactions?${new URLSearchParams(p)}`

const SAZONAL: Record<string, string> = {
  ipva: 'IPVA',
  iptu: 'IPTU',
  'material escolar': 'Material escolar',
  matricula: 'Matrícula',
  licenciamento: 'Licenciamento',
}

export function textoDoInsight(kind: string, p: Record<string, unknown>): Texto {
  switch (kind) {
    case 'fatura_fechou': {
      const frases: string[] = []
      const variacoes = [
        p.contraMedia != null ? `${pct(num(p.contraMedia))} contra a média` : '',
        p.contraAnterior != null ? `${pct(num(p.contraAnterior))} contra o mês anterior` : '',
      ].filter(Boolean)
      if (variacoes.length) frases.push(`${variacoes.join(' e ')}.`)
      const categorias = strs(p.categorias)
      if (categorias.length) frases.push(`Pesaram mais ${lista(categorias)}.`)
      if (strs(p.parcelasNovas).length) frases.push(`Parcelas novas: ${strs(p.parcelasNovas).join(', ')}.`)
      if (strs(p.parcelasAcabaram).length) frases.push(`Acabaram: ${strs(p.parcelasAcabaram).join(', ')}.`)
      if (num(p.estornos) > 0) frases.push(`Estornos: ${brl(num(p.estornos))}.`)
      if (p.diferencaBanco != null && Math.abs(num(p.diferencaBanco)) >= 0.01) {
        frases.push(`Diferença para o banco: ${brl(num(p.diferencaBanco))}.`)
      }
      return {
        titulo: `Fatura do ${str(p.cardNome)} fechou: ${brl(num(p.total))}`,
        corpo: frases.join(' '),
        acao: { rotulo: 'Ver fatura', href: p.cardId ? `/credit-cards/${str(p.cardId)}` : '/credit-cards' },
      }
    }
    case 'relatorio_mes': {
      const avisos = num(p.avisos)
      return {
        titulo: `Seu mês de ${mesDe(p.mes)}`,
        corpo:
          `O app lançou ${num(p.lancados)} sozinho, a conferência achou ${plural(num(p.diferencas), 'diferença', 'diferenças')} ` +
          `e ${plural(avisos, 'aviso', 'avisos')} ${avisos === 1 ? 'chegou' : 'chegaram'} antes do vencimento.`,
        acao: { rotulo: 'Ver mês', href: '/previsao' },
      }
    }
    case 'recorrencia': {
      const assinatura = p.destino === 'assinatura'
      // A Tarefa 4 abre o diálogo de confirmação; o href é o cadastro, de reserva.
      return {
        titulo: `${str(p.nome)} todo mês`,
        corpo: assinatura ? 'Virar assinatura?' : 'Virar conta a pagar?',
        acao: { rotulo: 'Criar', href: assinatura ? '/subscriptions?new=1' : '/bills?new=1' },
      }
    }
    case 'gasto_atipico':
      return {
        titulo: `${str(p.nome)} acima do comum`,
        corpo: `Este mês: ${brl(num(p.mes))}. A média dos 3 anteriores: ${brl(num(p.media3))}.`,
        acao: {
          rotulo: 'Ver lançamentos',
          href: p.alvo === 'categoria' && p.categoriaId ? transacoes({ cats: str(p.categoriaId) }) : transacoes({ q: str(p.nome) }),
        },
      }
    case 'preco_assinatura':
      return {
        titulo: `${str(p.nome)} mudou de preço`,
        corpo: `De ${brl(num(p.de))} para ${brl(num(p.para))}.`,
        acao: { rotulo: 'Atualizar valor', href: '/subscriptions' },
      }
    case 'duplicidade': {
      const data = str(p.dataYmd)
      return {
        titulo: 'Possível lançamento repetido',
        corpo: `${str(p.descricao)} · ${brl(num(p.valor))} em ${data.slice(8, 10)}/${data.slice(5, 7)}, duas vezes.`,
        acao: { rotulo: 'Apagar um', href: transacoes({ q: str(p.descricao), from: data, to: data }) },
      }
    }
    case 'parcelas_acabando':
      return {
        titulo: `Em ${mesDe(p.mesFim)} acaba ${str(p.descricao)}`,
        corpo: `Sobram ${brl(num(p.liberaPorMes))} por mês.`,
        acao: { rotulo: 'Ver previsão', href: '/previsao' },
      }
    case 'seguro_baixo':
      return {
        titulo: 'Pouco espaço até o fim do mês',
        corpo: `O seguro para gastar está em ${brl(num(p.seguro))}, abaixo de 10% da renda do mês.`,
        acao: { rotulo: 'Ver o que pesa', href: '/previsao' },
      }
    case 'sazonal':
      // As contas a pagar não leem um nome na URL: o link só abre o cadastro.
      return {
        titulo: `${SAZONAL[str(p.termo)] ?? str(p.termo)} chega no começo do ano`,
        corpo: `No ano passado foi ${brl(num(p.valor))} em ${mesDe(p.mesAnterior)}.`,
        acao: { rotulo: 'Criar conta a pagar', href: '/bills?new=1' },
      }
    case 'a_conferir':
      return {
        titulo: `${num(p.n)} lançamentos para conferir`,
        corpo: 'Eles foram salvos e só precisam de uma olhada.',
        acao: { rotulo: 'Conferir agora', href: '/transactions?conferir=1' },
      }
    case 'limite_pessoa': {
      // `para` diz quem lê: a própria pessoa ou um dono. O dono vê na seção
      // de limites de Membros; para a pessoa, o destino sai do papel dela na
      // hora da leitura (Tarefa 4), e o Painel é a reserva.
      const valores = `(${brl(num(p.gasto))} de ${brl(num(p.limite))})`
      const dono = p.para === 'dono'
      return {
        titulo: dono ? `Limite de ${str(p.nome)}` : 'Seu limite do mês',
        corpo: dono
          ? `${str(p.nome)} chegou a ${num(p.nivel)}% do limite do mês ${valores}.`
          : `Você chegou a ${num(p.nivel)}% do seu limite do mês ${valores}.`,
        acao: { rotulo: 'Ver limite', href: dono ? '/members#limites' : '/dashboard' },
      }
    }
    default:
      return { titulo: 'Novidade na carteira', corpo: '', acao: null }
  }
}
