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
/** Antes da última palavra, dizem que ela é do nome ("pão de queijo", "uma pizza"), não um cartão; um número também. */
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

/** A ordem de grandeza de um termo por extenso: centenas 3, dezenas 2, unidades 1. */
const ordem = (v: number) => (v >= 100 ? 3 : v >= 20 ? 2 : 1)

/**
 * "quarenta e dois", "cento e vinte", "mil e duzentos": de zero a 999, mais
 * "mil", ligados por "e". "um"/"uma" sozinhos não contam ("uma pizza").
 * Dentro de um grupo cada termo é menor que o anterior; quando o seguinte não
 * é ("quarenta e dois e cinquenta"), a cadeia para e `parou` avisa.
 */
function lerExtenso(toks: Token[], i: number): { valor: number; fim: number; parou: boolean } | null {
  let total = 0
  let atual = 0
  let palavras = 0
  let fim = -1
  let anterior = 4
  let temMil = false
  let parou = false
  const ehNumero = (t: Token | undefined) => !!t && !t.usado && (t.chave === 'mil' || NUMEROS.has(t.chave))
  let j = i
  while (ehNumero(toks[j])) {
    const c = toks[j].chave
    if (c === 'mil') {
      if (temMil) {
        parou = true
        break
      }
      total += (atual || 1) * 1000
      atual = 0
      anterior = 4
      temMil = true
    } else {
      const v = NUMEROS.get(c)!
      if (ordem(v) >= anterior) {
        parou = true
        break
      }
      atual += v
      anterior = ordem(v)
    }
    palavras++
    fim = j
    j += toks[j + 1]?.chave === 'e' && !toks[j + 1].usado && ehNumero(toks[j + 2]) ? 2 : 1
  }
  if (palavras === 0) return null
  if (palavras === 1 && (toks[i].chave === 'um' || toks[i].chave === 'uma')) return null
  return { valor: total + atual, fim, parou }
}

const p2 = (n: number) => String(n).padStart(2, '0')
const centavos = (n: number) => Math.round(n * 100) / 100

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

function montarData(y: number, mes: number, dia: number): string | null {
  const dt = new Date(Date.UTC(y, mes - 1, dia))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== dia) return null
  return `${y}-${p2(mes)}-${p2(dia)}`
}

/**
 * "dd/mm/aa(aa)", ou "dd/mm" com o ano de hoje — o do ano passado quando cairia
 * depois de hoje, como o "dia N". Data inexistente dá null.
 */
function diaMes(hoje: string, dia: number, mes: number, ano?: string): string | null {
  if (ano) return montarData(Number(ano.length === 2 ? `20${ano}` : ano), mes, dia)
  const y = partes(hoje)[0]
  const d = montarData(y, mes, dia)
  return d != null && d <= hoje ? d : montarData(y - 1, mes, dia)
}

type Candidato = { valor: number; de: number; ate: number; marcado: boolean; extenso: boolean; parou: boolean }

export function interpretarFrase(texto: string, hoje: string): FraseInterpretada {
  const toks: Token[] = texto
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ({ texto: t, chave: chaveDe(t), usado: false }))
  const k = (i: number) => toks[i]?.chave ?? ''
  const usar = (de: number, ate: number) => {
    for (let j = de; j <= ate; j++) toks[j].usado = true
  }
  const duvidas: string[] = []
  const duvida = (d: string) => {
    if (!duvidas.includes(d)) duvidas.push(d)
  }

  let valor: number | null = null
  let data: string | null = null
  let parcelas: number | null = null
  let tipo: 'expense' | 'income' = 'expense'
  let estorno = false
  let forma: FormaDePagamento | null = null
  let ultimoCredito = -1

  // A primeira data vale; uma inválida ou uma segunda diferente pede conferência.
  const definirData = (d: string | null) => {
    if (d == null) duvida('data')
    else if (data == null) data = d
    else if (d !== data) duvida('data')
  }

  // 1ª passada: parcelas, data, tipo, forma e a moeda. O que casa é consumido.
  for (let i = 0; i < toks.length; i++) {
    const c = k(i)
    const t = toks[i]

    // "3x", "3 x", "3 vezes", "três vezes"; com "de V", V é a parcela.
    let n: number | null = null
    let fim = i
    const x = /^(\d+)x$/.exec(c)
    if (x) n = Number(x[1])
    else if (/^\d+$/.test(c) && ['x', 'vezes', 'vez'].includes(k(i + 1))) {
      n = Number(c)
      fim = i + 1
    } else if (NUMEROS.has(c)) {
      const ext = lerExtenso(toks, i)
      if (ext && ['vezes', 'vez'].includes(k(ext.fim + 1))) {
        n = ext.valor
        fim = ext.fim + 1
      }
    }
    if (n != null) {
      usar(i, fim)
      const valida = n >= 2 && n <= 48
      if (valida) parcelas ??= n
      else duvida('parcelas')
      // "10x de 30": o total é 10 × 30, e a dúvida pede que a pessoa confirme.
      const parcela = k(fim + 1) === 'de' && toks[fim + 2] && !toks[fim + 2].usado ? lerNumero(k(fim + 2)) : null
      if (parcela != null && valor == null) {
        usar(fim + 1, fim + 2)
        valor = valida ? centavos(n * parcela) : parcela
        duvida('valor')
        fim += 2
      }
      i = fim
      continue
    }

    if (c === 'hoje' || c === 'ontem' || c === 'anteontem') {
      t.usado = true
      definirData(somarDias(hoje, c === 'hoje' ? 0 : c === 'ontem' ? -1 : -2))
      continue
    }
    if (c === 'dia' && /^\d{1,2}$/.test(k(i + 1))) {
      usar(i, i + 1)
      definirData(diaDoMes(hoje, Number(k(++i))))
      continue
    }
    const dm = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/.exec(c)
    if (dm) {
      t.usado = true
      if (k(i - 1) === 'dia') toks[i - 1].usado = true // "dia 31/03"
      definirData(diaMes(hoje, Number(dm[1]), Number(dm[2]), dm[3]))
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
  }

  // 2ª passada: o valor. Vence o marcado (logo depois de "r$" ou logo antes de
  // "reais"); sem marcado, o primeiro em algarismos; sem nenhum, o por extenso,
  // que só conta no começo da frase ou antes de "reais" ("padaria dois irmãos" não tem valor).
  if (valor == null) {
    const candidatos: Candidato[] = []
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].usado || k(i) === 'r$' || k(i) === 'reais') continue
      let n = lerNumero(k(i))
      if (n != null) {
        let ate = i
        if (k(i + 1) === 'mil' && !toks[i + 1].usado) {
          n = centavos(n * 1000) // "2 mil", "1,5 mil"
          ate = i + 1
        }
        const marcado = k(i).startsWith('r$') || k(i - 1) === 'r$' || k(ate + 1) === 'reais'
        candidatos.push({ valor: n, de: i, ate, marcado, extenso: false, parou: false })
        i = ate
        continue
      }
      const ext = lerExtenso(toks, i)
      if (!ext) continue
      const noComeco = toks.slice(0, i).every((t) => t.usado || t.chave === 'r$')
      const marcado = k(i - 1) === 'r$' || k(ext.fim + 1) === 'reais'
      if (noComeco || marcado) candidatos.push({ valor: ext.valor, de: i, ate: ext.fim, marcado, extenso: true, parou: ext.parou })
      i = ext.fim
    }
    const escolhido = candidatos.find((c) => c.marcado) ?? candidatos.find((c) => !c.extenso) ?? candidatos[0]
    if (escolhido) {
      usar(escolhido.de, escolhido.ate)
      valor = escolhido.valor
      if (escolhido.parou) duvida('valor')
      // "42 reais e 90 centavos"
      const e = escolhido.ate + 2
      if (k(e - 1) === 'reais' && k(e) === 'e' && toks[e + 1] && !toks[e + 1].usado) {
        const digitos = lerNumero(k(e + 1))
        const ext = digitos == null ? lerExtenso(toks, e + 1) : null
        const cent = digitos ?? ext?.valor
        const fimCent = digitos != null ? e + 1 : ext?.fim ?? -1
        if (cent != null && Number.isInteger(cent) && cent < 100 && /^centavos?$/.test(k(fimCent + 1))) {
          usar(e, fimCent + 1)
          valor = centavos(valor + cent / 100)
        }
      }
    }
  }
  for (let i = 0; i < toks.length; i++) if (k(i) === 'r$' || k(i) === 'reais') toks[i].usado = true
  if (valor != null && valor <= 0) valor = null
  // Sem valor, ou com outro número sobrando na descrição ("3 cafés 15"), a pessoa confere.
  if (valor == null || toks.some((t) => !t.usado && lerNumero(t.chave) != null)) duvida('valor')

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
    const antes = k(s[s.length - 2])
    // "3 itens", "dois cafés", "pão de queijo": a palavra depois de número ou de "de" é do nome.
    const prende = PRENDEM_A_SEGUINTE.has(antes) || NUMEROS.has(antes) || antes === 'mil' || /\d/.test(antes)
    if (s.length >= 2 && ehPalavra(ultima) && !prende) cartaoIdx = ultima
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
