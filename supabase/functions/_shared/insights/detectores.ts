/**
 * Os detectores do motor de insights (Bloco 6B), em funções puras. **Sem
 * nenhum import**: roda igual no Deno (Edge `insights-daily`) e no Node (o app
 * reexporta em `src/lib/insights/insights.ts`). As datas são `YYYY-MM-DD` no
 * dia de Brasília; quem chama passa `appTodayYmd()`.
 */

export type Lanc = {
  id: string
  type: 'income' | 'expense'
  amount: number
  dateYmd: string
  description: string | null
  category_id: string | null
  payment_method: string | null
  payment_credit_card_id: string | null
  subscription_id: string | null
  installment_plan_id: string | null
  ligadoAConta: boolean
  needs_review: boolean
  /**
   * Gasto privado (Bloco 7B): a linha chega mascarada ('Gasto pessoal', sem
   * categoria). Os detectores a ignoram — o "Gasto pessoal" repetido viraria
   * recorrência falsa. O valor continua nos totais (a fatura).
   */
  is_private?: boolean
}

/** Os lançamentos que os detectores leem: sem as privadas. */
const visiveis = (lancs: Lanc[]) => lancs.filter((l) => !l.is_private)

// ── Datas e números ──────────────────────────────────────────────────────────

const ym = (ymd: string) => ymd.slice(0, 7)
const dia = (ymd: string) => Number(ymd.slice(8, 10))

/** "2026-10" + n meses. */
function somaMeses(m: string, n: number): string {
  const t = Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1 + n
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

/** "2026-10-25" − n dias. */
function menosDias(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

const centavos = (v: number) => Math.round(v * 100)
const reais = (v: number) => Math.round(v * 100) / 100
const soma = (vs: number[]) => vs.reduce((a, b) => a + b, 0)

/** Variação em %, com uma casa; nula sem base. */
function variacao(atual: number, base: number): number | null {
  if (!(base > 0)) return null
  const v = Math.round((atual / base - 1) * 1000) / 10
  return v === 0 ? 0 : v
}

// ── Descrição ────────────────────────────────────────────────────────────────

/**
 * A chave de comparação (Decisão 7): minúsculas, sem acento, sem domínio
 * (".com", ".com.br"), sem dígitos e sem pontuação, com os espaços colapsados
 * e as palavras de até 2 letras tiradas. "Netflix.com 12/10" → "netflix".
 */
export function normalizarDescricao(s: string | null): string {
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.(com|net|org)(\.br)?\b|\.br\b/g, ' ')
    .replace(/[^a-z]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 2)
    .join(' ')
}

/**
 * O nome que o texto mostra e que o `?q=` busca: a descrição original do mais
 * recente (a busca é `ilike`, sensível a acento). Vazia, a chave com maiúscula.
 */
function nomeDe(grupo: Lanc[], chave: string): string {
  const recente = grupo.reduce((a, b) => (b.dateYmd > a.dateYmd ? b : a))
  return recente.description?.trim() || chave.charAt(0).toUpperCase() + chave.slice(1)
}

/** A frase contém o termo como palavras inteiras ("uber" não casa "uberlandia"). */
const contem = (frase: string, termo: string) => termo !== '' && ` ${frase} `.includes(` ${termo} `)

function agrupar<T>(xs: T[], chave: (x: T) => string | null): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const x of xs) {
    const k = chave(x)
    if (!k) continue
    const g = m.get(k)
    if (g) g.push(x)
    else m.set(k, [x])
  }
  return m
}

// ── Recorrência ──────────────────────────────────────────────────────────────

/** Valores a no máximo ±10% entre si (o maior até 10% acima do menor). */
const dentroDe10 = (vs: number[]) => Math.max(...vs) <= Math.min(...vs) * 1.1 + 0.005

const ASSINATURA_POR = new Set(['credit_card', 'debit_card'])

/**
 * Mesma descrição em 3 meses seguidos, ou em 2 meses seguidos no mesmo dia
 * ±3, com os valores a ±10% entre si e um lançamento só por mês. O mês do mais
 * recente é a âncora e precisa ser o atual ou o anterior. Só despesa sem
 * vínculo (assinatura, parcela ou conta). `jaCadastrados` são os nomes das
 * contas e assinaturas ativas: a descrição que casa com um deles (como no
 * sazonal) não vira recorrência, senão o "Criar" faria uma segunda "Aluguel"
 * ao lado da que a família paga por Pix sem ligar.
 */
export function detectarRecorrencias(
  lancs: Lanc[],
  hojeYmd: string,
  jaCadastrados: string[],
): Array<{
  chave: string
  nome: string
  valorMedio: number
  dia: number
  destino: 'assinatura' | 'conta'
  lancamentos: string[]
  payment_method: string | null
  card_id: string | null
  category_id: string | null
}> {
  const atual = ym(hojeYmd)
  const soltos = visiveis(lancs).filter(
    (l) =>
      l.type === 'expense' && !l.subscription_id && !l.installment_plan_id && !l.ligadoAConta && l.dateYmd <= hojeYmd,
  )
  const nomes = jaCadastrados.map(normalizarDescricao)
  const saida: ReturnType<typeof detectarRecorrencias> = []
  for (const [chave, grupo] of agrupar(soltos, (l) => normalizarDescricao(l.description))) {
    if (nomes.some((n) => contem(n, chave) || contem(chave, n))) continue
    const porMes = agrupar(grupo, (l) => ym(l.dateYmd))
    const ancora = [...porMes.keys()].sort().at(-1)!
    if (ancora !== atual && ancora !== somaMeses(atual, -1)) continue
    // Um lançamento por mês na janela: dois cafés no mesmo mês não são conta.
    const janela = (n: number) => {
      const meses = Array.from({ length: n }, (_, i) => porMes.get(somaMeses(ancora, i - n + 1)))
      return meses.every((g) => g?.length === 1) ? meses.map((g) => g![0]) : null
    }
    const tres = janela(3)
    const dois = janela(2)
    const achados =
      tres && dentroDe10(tres.map((l) => l.amount))
        ? tres
        : dois && dentroDe10(dois.map((l) => l.amount)) &&
            // ponytail: dia 30 contra dia 1 do mês seguinte não casa; virada de mês se pedir.
            Math.abs(dia(dois[0].dateYmd) - dia(dois[1].dateYmd)) <= 3
        ? dois
        : null
    if (!achados) continue
    const ultimo = achados.at(-1)!
    saida.push({
      chave: `rec:${chave}`,
      nome: nomeDe(achados, chave),
      valorMedio: reais(soma(achados.map((l) => l.amount)) / achados.length),
      dia: dia(ultimo.dateYmd),
      destino: ASSINATURA_POR.has(ultimo.payment_method ?? '') ? 'assinatura' : 'conta',
      lancamentos: achados.map((l) => l.id),
      payment_method: ultimo.payment_method,
      card_id: ultimo.payment_credit_card_id,
      category_id: ultimo.category_id,
    })
  }
  return saida
}

// ── Gasto atípico ────────────────────────────────────────────────────────────

/**
 * Por categoria e por descrição: o mês corrente até hoje acima de 2× a média
 * dos 3 meses completos anteriores (com média maior que zero).
 */
export function detectarAtipicos(
  lancs: Lanc[],
  hojeYmd: string,
  nomesCategoria: Record<string, string>,
): Array<{ chave: string; alvo: 'categoria' | 'descricao'; nome: string; mes: number; media3: number; categoriaId?: string }> {
  const atual = ym(hojeYmd)
  const anteriores = [1, 2, 3].map((n) => somaMeses(atual, -n))
  const despesas = visiveis(lancs).filter((l) => l.type === 'expense' && l.dateYmd <= hojeYmd)
  const saida: ReturnType<typeof detectarAtipicos> = []
  const avaliar = (
    alvo: 'categoria' | 'descricao',
    grupos: Map<string, Lanc[]>,
    nome: (k: string, grupo: Lanc[]) => string | undefined,
  ) => {
    for (const [k, grupo] of grupos) {
      const total = (m: string) => soma(grupo.filter((l) => ym(l.dateYmd) === m).map((l) => centavos(l.amount)))
      const mes = total(atual)
      const media3 = soma(anteriores.map(total)) / 3
      const n = nome(k, grupo)
      if (!n || !(media3 > 0) || mes <= 2 * media3) continue
      saida.push({
        // A descrição entra na chave normalizada; a categoria, pelo nome.
        chave: `atip:${alvo}:${alvo === 'categoria' ? n : k}:${atual}`,
        alvo,
        nome: n,
        mes: mes / 100,
        media3: reais(media3 / 100),
        ...(alvo === 'categoria' ? { categoriaId: k } : {}),
      })
    }
  }
  avaliar('categoria', agrupar(despesas, (l) => l.category_id), (k) => nomesCategoria[k])
  avaliar('descricao', agrupar(despesas, (l) => normalizarDescricao(l.description)), (k, g) => nomeDe(g, k))
  return saida
}

// ── Duplicidade ──────────────────────────────────────────────────────────────

/**
 * Mesmo valor, mesma descrição e mesmo dia, só despesa. Parcela não entra, e
 * dois lançamentos da mesma assinatura também não. O estorno é receita: fora.
 * `desdeYmd` corta a evidência antiga (o acervo da primeira execução) e
 * `valorMinimo` a compra pequena repetida de verdade (duas passagens, dois cafés).
 */
export function detectarDuplicidades(
  lancs: Lanc[],
  opcoes: { desdeYmd?: string; valorMinimo?: number } = {},
): Array<{ chave: string; ids: [string, string]; valor: number; descricao: string; dataYmd: string }> {
  const { desdeYmd = '', valorMinimo = 0 } = opcoes
  const candidatos = visiveis(lancs).filter(
    (l) => l.type === 'expense' && !l.installment_plan_id && l.dateYmd >= desdeYmd && l.amount >= valorMinimo,
  )
  const grupos = agrupar(candidatos, (l) => {
    const d = normalizarDescricao(l.description)
    return d ? `${centavos(l.amount)}|${l.dateYmd}|${d}` : null
  })
  const saida: ReturnType<typeof detectarDuplicidades> = []
  for (const grupo of grupos.values()) {
    const ordem = [...grupo].sort((a, b) => (a.id < b.id ? -1 : 1))
    for (let i = 0; i + 1 < ordem.length; i++) {
      const [a, b] = [ordem[i], ordem[i + 1]]
      if (a.subscription_id && a.subscription_id === b.subscription_id) continue
      saida.push({
        chave: `dup:${a.id}:${b.id}`,
        ids: [a.id, b.id],
        valor: a.amount,
        descricao: (a.description ?? '').trim(),
        dataYmd: a.dateYmd,
      })
    }
  }
  return saida
}

// ── Preço de assinatura ──────────────────────────────────────────────────────

/**
 * Um lançamento solto dos últimos 40 dias cuja descrição contém o nome de uma
 * assinatura ativa de despesa, com valor diferente em mais de R$ 0,01 e menos
 * de 50%. Fica o mais recente por assinatura.
 */
export function detectarPrecoDeAssinatura(
  lancs: Lanc[],
  assinaturas: Array<{ id: string; name: string; amount: number; is_active: boolean; kind?: string }>,
  hojeYmd: string,
): Array<{ chave: string; assinaturaId: string; nome: string; de: number; para: number; lancamentoId: string }> {
  const desde = menosDias(hojeYmd, 40)
  const soltos = visiveis(lancs)
    .filter(
      (l) =>
        l.type === 'expense' && !l.subscription_id && !l.installment_plan_id && l.dateYmd >= desde && l.dateYmd <= hojeYmd,
    )
    .sort((a, b) => (a.dateYmd < b.dateYmd ? 1 : -1))
  const saida: ReturnType<typeof detectarPrecoDeAssinatura> = []
  for (const s of assinaturas) {
    if (!s.is_active || (s.kind ?? 'expense') !== 'expense') continue
    const nome = normalizarDescricao(s.name)
    const l = soltos.find((x) => contem(normalizarDescricao(x.description), nome))
    if (!l) continue
    const dif = Math.abs(centavos(l.amount) - centavos(s.amount))
    if (dif <= 1 || dif >= centavos(s.amount) / 2) continue
    saida.push({
      chave: `preco:${s.id}:${l.amount.toFixed(2)}`,
      assinaturaId: s.id,
      nome: s.name,
      de: s.amount,
      para: l.amount,
      lancamentoId: l.id,
    })
  }
  return saida
}

// ── Parcelas acabando ────────────────────────────────────────────────────────

/** O último vencimento do plano cai no mês corrente ou no seguinte. */
export function detectarParcelasAcabando(
  planos: Array<{
    id: string
    description: string
    installment_amount: number
    total_installments: number
    generated_count: number
    next_billing_date: string
    is_active: boolean
  }>,
  hojeYmd: string,
): Array<{ chave: string; planoId: string; descricao: string; mesFim: string; liberaPorMes: number }> {
  const atual = ym(hojeYmd)
  const saida: ReturnType<typeof detectarParcelasAcabando> = []
  for (const p of planos) {
    const faltam = p.total_installments - p.generated_count
    if (!p.is_active || faltam < 1) continue
    // `next_billing_date` é a próxima a gerar; a última vem `faltam - 1` meses depois.
    const mesFim = somaMeses(ym(p.next_billing_date), faltam - 1)
    if (mesFim !== atual && mesFim !== somaMeses(atual, 1)) continue
    saida.push({ chave: `fim:${p.id}`, planoId: p.id, descricao: p.description, mesFim, liberaPorMes: p.installment_amount })
  }
  return saida
}

// ── Sazonal ──────────────────────────────────────────────────────────────────

export const TERMOS_SAZONAIS = ['ipva', 'iptu', 'material escolar', 'matricula', 'licenciamento'] as const

/**
 * Entre 1º de janeiro e 15 de fevereiro, os termos achados de janeiro a março
 * do ano anterior que não têm conta ativa parecida. O valor é o do primeiro
 * mês em que o termo apareceu.
 */
export function detectarSazonais(
  lancs: Lanc[],
  hojeYmd: string,
  contasAtivas: string[],
): Array<{ chave: string; termo: string; mesAnterior: string; valor: number }> {
  const ano = Number(hojeYmd.slice(0, 4))
  if (hojeYmd.slice(5) > '02-15') return []
  const de = `${ano - 1}-01-01`
  const ate = `${ano - 1}-03-31`
  const passados = visiveis(lancs).filter((l) => l.type === 'expense' && l.dateYmd >= de && l.dateYmd <= ate)
  const contas = contasAtivas.map(normalizarDescricao)
  const saida: ReturnType<typeof detectarSazonais> = []
  for (const termo of TERMOS_SAZONAIS) {
    if (contas.some((c) => contem(c, termo))) continue
    const achados = passados.filter((l) => contem(normalizarDescricao(l.description), termo))
    if (!achados.length) continue
    const mesAnterior = achados.map((l) => ym(l.dateYmd)).sort()[0]
    const valor = soma(achados.filter((l) => ym(l.dateYmd) === mesAnterior).map((l) => centavos(l.amount))) / 100
    saida.push({ chave: `saz:${termo}:${ano}`, termo, mesAnterior, valor })
  }
  return saida
}

// ── Resumo da fatura ─────────────────────────────────────────────────────────

/**
 * O payload do `fatura_fechou`. `fechadasAnteriores` vem da mais recente para a
 * mais antiga: a primeira é o "mês anterior", e a média é de todas.
 * `cardId` vai para o link "Ver fatura".
 */
export function resumoDaFatura(e: {
  cardId?: string
  cardNome: string
  closeYmd: string
  total: number
  fechadasAnteriores: number[]
  porCategoria: Array<{ nome: string; total: number }>
  maiores: Array<{ descricao: string; valor: number }>
  parcelasNovas: string[]
  parcelasAcabaram: string[]
  estornos: number
  bancoTotal: number | null
}): Record<string, unknown> {
  const anteriores = e.fechadasAnteriores
  const media = anteriores.length ? soma(anteriores) / anteriores.length : 0
  return {
    cardId: e.cardId ?? null,
    cardNome: e.cardNome,
    closeYmd: e.closeYmd,
    total: e.total,
    contraMedia: variacao(e.total, media),
    contraAnterior: variacao(e.total, anteriores[0] ?? 0),
    categorias: [...e.porCategoria].sort((a, b) => b.total - a.total).slice(0, 3).map((c) => c.nome),
    maiores: [...e.maiores].sort((a, b) => b.valor - a.valor).slice(0, 3),
    parcelasNovas: e.parcelasNovas,
    parcelasAcabaram: e.parcelasAcabaram,
    estornos: e.estornos,
    diferencaBanco: e.bancoTotal == null ? null : reais(e.total - e.bancoTotal),
  }
}
