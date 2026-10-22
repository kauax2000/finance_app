/**
 * A frase rápida ("42 mercado nubank em 3x") vira um lançamento, o cartão citado
 * casa com um cartão da pessoa e o histórico preenche categoria e forma.
 *
 * **Sem nenhum import**: roda igual no Deno (Edge `capture`) e no Node (o app,
 * por `src/lib/captura/frase.ts`, que só reexporta este arquivo).
 */

export type FormaDePagamento = 'pix' | 'debit' | 'credit_card' | 'cash'

export type FraseInterpretada = {
  valor: number | null // sempre positivo
  data: string // YYYY-MM-DD
  parcelas: number | null // "em 3x", "3x", "em 3 vezes"
  tipo: 'expense' | 'income'
  estorno: boolean
  forma: FormaDePagamento | null
  cartaoTexto: string | null // palavra que sobrou e pode ser cartão
  descricao: string
  duvidas: string[] // "valor", "data", "cartao", "parcelas", "descricao"
}

/** Minúscula, sem acento, sem pontuação, espaços colapsados. */
export function normalizarDescricao(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** A primeira palavra normalizada com 3 letras ou mais e não numérica. */
export function palavraSignificativa(s: string): string | null {
  return normalizarDescricao(s)
    .split(' ')
    .find((p) => p.length >= 3 && !/^\d+$/.test(p)) ?? null
}

const DESCRICAO_PADRAO = 'Lançamento rápido'

const NUMEROS = new Map<string, number>([
  ['zero', 0], ['um', 1], ['uma', 1], ['dois', 2], ['duas', 2], ['tres', 3], ['quatro', 4],
  ['cinco', 5], ['seis', 6], ['sete', 7], ['oito', 8], ['nove', 9], ['dez', 10], ['onze', 11],
  ['doze', 12], ['treze', 13], ['quatorze', 14], ['catorze', 14], ['quinze', 15],
  ['dezesseis', 16], ['dezessete', 17], ['dezoito', 18], ['dezenove', 19], ['vinte', 20],
  ['trinta', 30], ['quarenta', 40], ['cinquenta', 50], ['sessenta', 60], ['setenta', 70],
  ['oitenta', 80], ['noventa', 90], ['cem', 100], ['cento', 100],
  ['duzentos', 200], ['duzentas', 200], ['trezentos', 300], ['trezentas', 300],
  ['quatrocentos', 400], ['quatrocentas', 400], ['quinhentos', 500], ['quinhentas', 500],
  ['seiscentos', 600], ['seiscentas', 600], ['setecentos', 700], ['setecentas', 700],
  ['oitocentos', 800], ['oitocentas', 800], ['novecentos', 900], ['novecentas', 900],
])

const FORMAS = new Map<string, FormaDePagamento>([
  ['pix', 'pix'], ['debito', 'debit'], ['dinheiro', 'cash'],
  ['credito', 'credit_card'], ['cartao', 'credit_card'],
])

/** Ligam a palavra seguinte: colados antes de uma palavra consumida, saem com ela. */
const CONECTIVOS = new Set(['no', 'na', 'em', 'de', 'do', 'da', 'com', 'pelo', 'pela', 'via', 'e'])
/** Antes da última palavra, dizem que ela é do nome ("pão de queijo", "uma pizza"), não um cartão. */
const PRENDEM_A_SEGUINTE = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'um', 'uma', 'o', 'a', 'os', 'as'])

type Token = { texto: string; chave: string; usado: boolean }

/** Sem acento, minúscula, sem a pontuação das pontas ("42," → "42"). */
function chaveDe(t: string): string {
  return t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/^[("'“‘]+|[)"'”’.,;:!?]+$/g, '')
}

/** "42", "42,90", "r$42", "1.234,56", "1.234" (mil) e "12.50" (ponto com até 2 casas é decimal). */
function lerNumero(chave: string): number | null {
  const t = chave.replace(/^r\$/, '')
  let n: number | null = null
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) n = Number(t.replace(/\./g, '').replace(',', '.'))
  else if (/^\d+(,\d{1,2})?$/.test(t)) n = Number(t.replace(',', '.'))
  else if (/^\d+\.\d{1,2}$/.test(t)) n = Number(t)
  return n == null ? null : Math.round(n * 100) / 100
}

/**
 * "quarenta e dois", "cento e vinte", "mil e duzentos": de zero a 999, mais
 * "mil", ligados por "e". "um"/"uma" sozinhos não contam ("uma pizza").
 */
function lerExtenso(toks: Token[], i: number): { valor: number; fim: number } | null {
  let total = 0
  let atual = 0
  let palavras = 0
  let fim = -1
  const ehNumero = (t: Token | undefined) => !!t && !t.usado && (t.chave === 'mil' || NUMEROS.has(t.chave))
  let j = i
  while (ehNumero(toks[j])) {
    const c = toks[j].chave
    if (c === 'mil') {
      total += (atual || 1) * 1000
      atual = 0
    } else atual += NUMEROS.get(c)!
    palavras++
    fim = j
    j += toks[j + 1]?.chave === 'e' && !toks[j + 1].usado && ehNumero(toks[j + 2]) ? 2 : 1
  }
  if (palavras === 0) return null
  if (palavras === 1 && (toks[i].chave === 'um' || toks[i].chave === 'uma')) return null
  return { valor: total + atual, fim }
}

const p2 = (n: number) => String(n).padStart(2, '0')

function partes(hoje: string): [number, number, number] {
  const [y, m, d] = hoje.split('-').map(Number)
  return [y, m, d]
}

function somarDias(hoje: string, dias: number): string {
  const [y, m, d] = partes(hoje)
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** "dia N": do mês corrente, ou do passado quando N passa de hoje; preso ao último dia. */
function diaDoMes(hoje: string, n: number): string | null {
  if (n < 1 || n > 31) return null
  const [ano, mes, d] = partes(hoje)
  let y = ano
  let m = mes
  if (n > d) {
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${y}-${p2(m)}-${p2(Math.min(n, ultimo))}`
}

/** "dd/mm" com o ano de hoje (ou "dd/mm/aa(aa)"); data inexistente dá null. */
function diaMes(hoje: string, dia: number, mes: number, ano?: string): string | null {
  const y = ano ? Number(ano.length === 2 ? `20${ano}` : ano) : partes(hoje)[0]
  const dt = new Date(Date.UTC(y, mes - 1, dia))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== dia) return null
  return `${y}-${p2(mes)}-${p2(dia)}`
}

export function interpretarFrase(texto: string, hoje: string): FraseInterpretada {
  const toks: Token[] = texto
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ texto: t, chave: chaveDe(t), usado: false }))
  const k = (i: number) => toks[i]?.chave ?? ''
  const duvidas: string[] = []
  const duvida = (d: string) => {
    if (!duvidas.includes(d)) duvidas.push(d)
  }

  let data: string | null = null
  let parcelas: number | null = null
  let tipo: 'expense' | 'income' = 'expense'
  let estorno = false
  let forma: FormaDePagamento | null = null
  let ultimoCredito = -1

  // 1ª passada: parcelas, data, tipo, forma e a moeda. O que casa é consumido.
  for (let i = 0; i < toks.length; i++) {
    const c = k(i)
    const t = toks[i]

    const x = /^(\d+)x$/.exec(c)
    const vezes = /^\d+$/.test(c) && (k(i + 1) === 'vezes' || k(i + 1) === 'vez')
    if (x || vezes) {
      const n = Number(x ? x[1] : c)
      t.usado = true
      if (vezes) toks[++i].usado = true
      if (n < 2 || n > 48) duvida('parcelas')
      else parcelas ??= n
      continue
    }

    if (c === 'hoje' || c === 'ontem' || c === 'anteontem') {
      t.usado = true
      data ??= somarDias(hoje, c === 'hoje' ? 0 : c === 'ontem' ? -1 : -2)
      continue
    }
    if (c === 'dia' && /^\d{1,2}$/.test(k(i + 1))) {
      t.usado = true
      toks[++i].usado = true
      if (data == null) {
        data = diaDoMes(hoje, Number(k(i)))
        if (data == null) duvida('data')
      }
      continue
    }
    const dm = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/.exec(c)
    if (dm) {
      t.usado = true
      if (data == null) {
        data = diaMes(hoje, Number(dm[1]), Number(dm[2]), dm[3])
        if (data == null) duvida('data')
      }
      continue
    }

    if (c === 'recebi' || c === 'receita' || c === 'salario') {
      tipo = 'income'
      t.usado = c === 'recebi' // "receita" e "salário" são boas descrições; ficam
      continue
    }
    if (c === 'estorno' || c === 'estornou') {
      tipo = 'income'
      estorno = true
      t.usado = true
      continue
    }

    const f = FORMAS.get(c)
    if (f) {
      forma ??= f
      if (f === 'credit_card') ultimoCredito = i
      t.usado = true
      continue
    }

    if (c === 'r$' || c === 'reais') t.usado = true
  }

  // 2ª passada: o valor. O primeiro número em algarismos; sem nenhum, o primeiro por extenso.
  let valor: number | null = null
  for (let i = 0; i < toks.length && valor == null; i++) {
    if (toks[i].usado) continue
    const n = lerNumero(k(i))
    if (n != null) {
      toks[i].usado = true
      valor = n
    }
  }
  for (let i = 0; i < toks.length && valor == null; i++) {
    const ext = toks[i].usado ? null : lerExtenso(toks, i)
    if (!ext) continue
    for (let j = i; j <= ext.fim; j++) toks[j].usado = true
    valor = ext.valor
  }
  if (valor != null && valor <= 0) valor = null
  if (valor == null) duvida('valor')

  // O conectivo colado antes do que foi consumido sai junto ("no débito", "em 3x").
  for (let i = toks.length - 2; i >= 0; i--) {
    if (!toks[i].usado && CONECTIVOS.has(k(i)) && toks[i + 1].usado) toks[i].usado = true
  }

  // O cartão: a palavra logo depois de "cartão"/"crédito"; senão, numa despesa
  // (ou estorno) sem pix/débito/dinheiro, a última palavra que sobrou quando sobram duas ou mais.
  // ponytail: o parser não conhece os cartões; quem chama devolve a palavra à descrição se `casarCartao` falhar.
  const ehPalavra = (i: number) => /^\p{L}{3,}$/u.test(k(i)) && !CONECTIVOS.has(k(i))
  const sobra = () => toks.flatMap((t, i) => (!t.usado && /[\p{L}\p{N}]/u.test(t.texto) ? [i] : []))
  let cartaoIdx = -1
  const depoisDoCredito = ultimoCredito + 1
  if (ultimoCredito >= 0 && toks[depoisDoCredito] && !toks[depoisDoCredito].usado && ehPalavra(depoisDoCredito)) {
    cartaoIdx = depoisDoCredito
  } else if ((tipo === 'expense' || estorno) && (forma == null || forma === 'credit_card')) {
    const s = sobra()
    const ultima = s[s.length - 1]
    if (s.length >= 2 && ehPalavra(ultima) && !PRENDEM_A_SEGUINTE.has(k(s[s.length - 2]))) cartaoIdx = ultima
  }
  let cartaoTexto: string | null = null
  if (cartaoIdx >= 0) {
    cartaoTexto = k(cartaoIdx)
    toks[cartaoIdx].usado = true
    const antes = toks[cartaoIdx - 1]
    if (antes && !antes.usado && CONECTIVOS.has(antes.chave)) antes.usado = true
  }
  if (cartaoTexto == null && (forma === 'credit_card' || parcelas != null)) duvida('cartao')

  // A descrição: o resto, sem conectivo solto nas pontas.
  const resto = sobra()
  while (resto.length && CONECTIVOS.has(k(resto[0]))) resto.shift()
  while (resto.length && CONECTIVOS.has(k(resto[resto.length - 1]))) resto.pop()
  let descricao = resto
    .map((i) => toks[i].texto)
    .join(' ')
    .replace(/^[\s,;:.!?-]+|[\s,;:.!?-]+$/g, '')
  if (!descricao) {
    descricao = DESCRICAO_PADRAO
    duvida('descricao')
  } else descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1)

  return {
    valor,
    data: data ?? hoje,
    parcelas,
    tipo,
    estorno,
    forma,
    cartaoTexto,
    descricao,
    duvidas,
  }
}

export type CartaoParaCasar = {
  id: string
  name: string
  wallet_alias: string | null
  last_four: string | null
  workspace_id: string
  is_active: boolean
}

/**
 * Em ordem: o `wallet_alias` igual; uma palavra (3+ letras) do texto igual a uma
 * do `name`; os 4 dígitos iguais a `last_four`. Tudo normalizado, só ativos.
 * Mais de um no mesmo nível dá `null` — a não ser que os 4 dígitos do texto
 * deixem um só entre eles ("Nubank 2222" com dois Nubank).
 */
export function casarCartao(texto: string | null, cartoes: CartaoParaCasar[]): CartaoParaCasar | null {
  const alvo = normalizarDescricao(texto ?? '')
  if (!alvo) return null
  const palavrasDe = (s: string) => normalizarDescricao(s).split(' ').filter((p) => p.length >= 3 && !/^\d+$/.test(p))
  const doTexto = palavrasDe(alvo)
  const digitos = alvo.split(' ').filter((p) => /^\d{4}$/.test(p))
  const pelosDigitos = (c: CartaoParaCasar) => c.last_four != null && digitos.includes(c.last_four)
  const niveis = [
    (c: CartaoParaCasar) => c.wallet_alias != null && normalizarDescricao(c.wallet_alias) === alvo,
    (c: CartaoParaCasar) => palavrasDe(c.name).some((p) => doTexto.includes(p)),
    pelosDigitos,
  ]
  const ativos = cartoes.filter((c) => c.is_active)
  for (const nivel of niveis) {
    const achados = ativos.filter(nivel)
    if (achados.length === 1) return achados[0]
    if (achados.length > 1) {
      const desempate = achados.filter(pelosDigitos)
      return desempate.length === 1 ? desempate[0] : null
    }
  }
  return null
}

export type LinhaHistorico = {
  description: string | null
  category_id: string | null
  payment_method: string | null
  payment_credit_card_id: string | null
  date: string
  type: 'expense' | 'income'
}

function maisRecente(lista: LinhaHistorico[]): LinhaHistorico | null {
  let melhor: LinhaHistorico | null = null
  for (const l of lista) if (!melhor || l.date > melhor.date) melhor = l
  return melhor
}

/**
 * A linha mais recente de mesmo `tipo` com a mesma descrição normalizada; sem
 * ela, a de mesma `palavraSignificativa`. Devolve categoria, forma e cartão dela.
 */
export function preencherPeloHistorico(
  descricao: string,
  tipo: 'expense' | 'income',
  historico: LinhaHistorico[],
): { categoryId: string | null; paymentMethod: string | null; creditCardId: string | null } {
  const doTipo = historico.filter((l) => l.type === tipo && l.description)
  const alvo = normalizarDescricao(descricao)
  const palavra = palavraSignificativa(descricao)
  const linha =
    (alvo ? maisRecente(doTipo.filter((l) => normalizarDescricao(l.description!) === alvo)) : null) ??
    (palavra ? maisRecente(doTipo.filter((l) => palavraSignificativa(l.description!) === palavra)) : null)
  return {
    categoryId: linha?.category_id ?? null,
    paymentMethod: linha?.payment_method ?? null,
    creditCardId: linha?.payment_credit_card_id ?? null,
  }
}
