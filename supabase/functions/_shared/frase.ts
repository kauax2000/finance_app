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
  cartaoTexto: string | null // palavra que sobrou e pode ser cartão, normalizada
  cartaoPalavra?: string | null // a mesma, como foi escrita (volta assim à descrição)
  descricao: string
  /** A palavra (como foi escrita) que decidiu estorno, parcelada ou receita; `null` numa despesa sem marca. */
  motivoDoTipo: string | null
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

/** Dizem que o valor ao lado é o de uma parcela, não o total. */
const PARCELA = new Set(['parcela', 'parcelas', 'prestacao', 'prestacoes'])
/** Depois de um valor, com parcelas na frase, dizem que ele é o de cada mês ("100 mensais 4x"). */
const POR_MES = new Set(['mensal', 'mensais', '/mes'])

/** Ligam a palavra seguinte: colados antes de uma palavra consumida, saem com ela. */
const CONECTIVOS = new Set(['no', 'na', 'em', 'de', 'do', 'da', 'com', 'pelo', 'pela', 'via', 'e', 'pro', 'pra', 'para'])
/** Antes da última palavra, dizem que ela é do nome ("pão de queijo", "uma pizza"), não um cartão; um número também. */
const PRENDEM_A_SEGUINTE = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'um', 'uma', 'o', 'a', 'os', 'as', 'x'])

/** A fala abre com o verbo ("gastei 200 de abastecimento"): no começo da frase, ele sai. */
const VERBOS_DE_ABERTURA = new Set([
  'gastei', 'paguei', 'comprei', 'dei', 'foi', 'custou', 'deu', 'saiu', 'torrei', 'fiz', 'tive',
  'gastamos', 'pagamos', 'compramos', 'demos',
])
/** O artigo que abre a descrição sai ("Um café" → "Café"); no meio dela fica ("jantar uma pizza"). */
const ARTIGOS = new Set(['a', 'o', 'um', 'uma'])
/** O verbo que já diz o gasto vira a 1ª palavra da descrição ("abasteci 150" → "Abastecimento"). */
const VERBOS_QUE_NOMEIAM = new Map([['abasteci', 'Abastecimento'], ['almocei', 'Almoço'], ['jantei', 'Jantar'], ['lanchei', 'Lanche']])

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
export function lerNumero(chave: string): number | null {
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

const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']

/** O dia da semana (0 = domingo) mais recente até hoje; `anterior` nunca devolve hoje. */
function diaDaSemana(hoje: string, alvo: number, anterior: boolean): string {
  const [y, m, d] = partes(hoje)
  const atual = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  let atras = (atual - alvo + 7) % 7
  if (anterior && atras === 0) atras = 7
  return somarDias(hoje, -atras)
}

/** Substantivos de receita: saem da descrição só se sobrar outra palavra ("reembolso 45 uber"). */
const RECEITA_SUBSTANTIVO = new Set(['reembolso', 'rendimento', 'rendimentos', 'dividendo', 'dividendos'])

type Candidato = { valor: number; de: number; ate: number; marcado: boolean; extenso: boolean; parou: boolean }

/**
 * Com `palavrasDeCartao` (de `palavrasDosCartoes`), a última palavra solta só
 * vira cartão se for de um cartão da pessoa; sem ele, qualquer uma pode ser.
 */
export function interpretarFrase(texto: string, hoje: string, palavrasDeCartao?: ReadonlySet<string>): FraseInterpretada {
  const toks: Token[] = texto
    .replace(/(\d)(\/m[eê]s)(?=$|[\s.,;:!?)])/giu, '$1 $2') // "100/mês"
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
  let motivoEstorno: string | null = null
  let motivoParcelas: string | null = null
  let motivoReceita: string | null = null
  const substantivos: number[] = []
  const sobra = () => toks.flatMap((t, i) => (!t.usado && /[\p{L}\p{N}]/u.test(t.texto) ? [i] : []))
  const escrito = (i: number) => toks[i].texto.replace(/^[("'“‘]+|[)"'”’.,;:!?]+$/g, '')

  // A primeira data vale; uma inválida ou uma segunda diferente pede conferência.
  const definirData = (d: string | null) => {
    if (d == null) duvida('data')
    else if (data == null) data = d
    else if (d !== data) duvida('data')
  }

  // "por mês", "ao mês", "mensal", "/mês" em algum lugar da frase.
  const porMes = toks.some((t, i) => POR_MES.has(t.chave) || ((t.chave === 'ao' || t.chave === 'por') && k(i + 1) === 'mes'))
  const numeroEm = (j: number) => lerNumero(k(k(j) === 'r$' ? j + 1 : j)) != null
  // A palavra da contagem depois do número: "x", "vezes", "parcelas", "prestações", com "iguais"
  // opcional; "meses" só com um valor ao lado ("4 meses de 100", "100 por mês 4 meses").
  const contagem = (j: number) => {
    let fim = -1
    if (['x', 'vezes', 'vez', 'parcelas', 'prestacoes'].includes(k(j))) fim = j
    else if (k(j) === 'meses' && (porMes || (k(j + 1) === 'de' && numeroEm(j + 2)))) fim = j
    if (fim >= 0 && k(fim + 1) === 'iguais') fim++
    return fim
  }
  // "Nx de V": V é a parcela. O total sai depois do valor, que pode tê-lo dito ("400 em 4x de 100").
  let porParcela: { n: number; v: number; valida: boolean; duvidar: boolean } | null = null

  // 1ª passada: parcelas, data, tipo, forma e a moeda. O que casa é consumido.
  for (let i = 0; i < toks.length; i++) {
    const c = k(i)
    const t = toks[i]

    // O verbo da fala, antes de qualquer palavra da descrição ("ontem gastei 50").
    if (toks.slice(0, i).every((u) => u.usado)) {
      if (VERBOS_DE_ABERTURA.has(c)) {
        t.usado = true
        continue
      }
      const nome = VERBOS_QUE_NOMEIAM.get(c)
      if (nome) {
        t.texto = nome
        t.chave = chaveDe(nome)
        continue
      }
    }

    // "3x", "3 x", "3 vezes", "três vezes", "três x", "4 parcelas"; com "de V", V é a parcela.
    // Um número solto logo depois de "r$" é dinheiro, nunca a contagem ("R$ 30 x 2");
    // o "12x" colado nunca é dinheiro, então vale mesmo depois de "r$". "4x100" é "4x de 100";
    // "x4" só conta logo depois de um número ("100 x4").
    let n: number | null = null
    let fim = i
    let colado: number | null = null
    const x = /^(\d+)x(\d[\d.,]*)?$/.exec(c)
    const dinheiro = k(i - 1) === 'r$'
    if (x) {
      n = Number(x[1])
      colado = x[2] ? lerNumero(x[2]) : null
    } else if (/^x\d+$/.test(c) && lerNumero(k(i - 1)) != null) n = Number(c.slice(1))
    else if (!dinheiro && /^\d+$/.test(c) && contagem(i + 1) >= 0) {
      n = Number(c)
      fim = contagem(i + 1)
    } else if (!dinheiro && NUMEROS.has(c)) {
      const ext = lerExtenso(toks, i)
      if (ext && contagem(ext.fim + 1) >= 0) {
        n = ext.valor
        fim = contagem(ext.fim + 1)
      }
    }
    if (n != null) {
      usar(i, fim)
      const valida = n >= 2 && n <= 48
      if (valida) {
        if (parcelas == null) {
          const dePalavra = k(i - 1) === 'em' && !toks[i - 1].usado ? i - 1 : i
          motivoParcelas = toks.slice(dePalavra, fim + 1).map((_, j) => escrito(dePalavra + j)).join(' ')
        }
        parcelas ??= n
      }
      else duvida('parcelas')
      // O número logo depois ("10x de 30", "10x de R$ 30", "10x 30"): a pessoa confere,
      // a não ser que a palavra diga que ele é a parcela ("4 parcelas de 100", "4 meses de 100").
      const comDe = colado == null && k(fim + 1) === 'de'
      let j = comDe ? fim + 2 : fim + 1
      if (k(j) === 'r$') j++
      const seguinte = colado ?? (toks[j] && !toks[j].usado ? lerNumero(k(j)) : null)
      if (seguinte != null) {
        // Com "de", V é a parcela e o total é N × V; sem "de", V fica como o valor.
        if ((comDe || colado != null) && porParcela == null) {
          const explicita = toks.slice(i, fim + 1).some((t) => PARCELA.has(t.chave) || t.chave === 'meses')
          porParcela = { n, v: seguinte, valida, duvidar: !explicita }
          if (comDe) {
            usar(fim + 1, j)
            fim = j
          }
        } else duvida('valor')
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

    // "sexta-feira" é a sexta; "segunda via" é a cópia de um boleto, não o dia.
    const diaSemana = k(i + 1) === 'via' ? -1 : DIAS_DA_SEMANA.indexOf(c.replace(/-feira$/, ''))
    if (diaSemana >= 0) {
      t.usado = true
      const anterior = k(i + 1) === 'passado' || k(i + 1) === 'passada'
      if (anterior) toks[++i].usado = true
      definirData(diaDaSemana(hoje, diaSemana, anterior))
      continue
    }

    // "pix do João 150": na primeira posição, com "de/do/da" e um nome, é dinheiro que entrou.
    if (i === 0 && c === 'pix' && ['de', 'do', 'da'].includes(k(1)) && /^\p{L}{2,}$/u.test(k(2))) {
      tipo = 'income'
      forma ??= 'pix'
      motivoReceita ??= escrito(0)
      usar(0, 1)
      i = 1
      continue
    }

    if (c === 'recebi' || c === 'receita' || c === 'salario' || c === 'ganhei' || c === 'vendi' || RECEITA_SUBSTANTIVO.has(c)) {
      tipo = 'income'
      motivoReceita ??= escrito(i)
      if (RECEITA_SUBSTANTIVO.has(c)) substantivos.push(i)
      t.usado = c === 'recebi' || c === 'ganhei' || c === 'vendi' // "receita" e "salário" são boas descrições; ficam
      continue
    }
    if (c === 'estorno' || c === 'estornou') {
      tipo = 'income'
      estorno = true
      motivoEstorno ??= escrito(i)
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
    let escolhido: Candidato | undefined = candidatos.find((c) => c.marcado) ?? candidatos.find((c) => !c.extenso) ?? candidatos[0]
    // Junto de "Nx de V", só é o total um número maior que a parcela ("3 cafés 10x de 5" não é).
    if (porParcela && escolhido && escolhido.valor <= porParcela.v) escolhido = undefined
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
      // "parcela 100", "parcela de R$ 100", "100 a parcela", "100 por parcela", "100 cada":
      // o valor é o da parcela, e o total é parcelas × valor. Sem o número de parcelas, a conta fica a conferir.
      let antes = escolhido.de - 1
      if (k(antes) === 'r$') antes--
      if (k(antes) === 'de') antes--
      let depois = escolhido.ate + 1
      if (k(depois) === 'reais') depois++
      const ligaDepois = ['a', 'por', 'cada'].includes(k(depois)) && !toks[depois].usado
      let daParcela = -1
      if (PARCELA.has(k(antes)) && !toks[antes].usado) daParcela = antes
      else if (PARCELA.has(k(depois + (ligaDepois ? 1 : 0))) && !toks[depois + (ligaDepois ? 1 : 0)].usado) {
        daParcela = depois + (ligaDepois ? 1 : 0)
        if (ligaDepois) toks[depois].usado = true
      } else if (k(depois) === 'cada' && ligaDepois) daParcela = depois
      if (daParcela >= 0) {
        toks[daParcela].usado = true
        if (parcelas != null) valor = centavos(parcelas * valor)
        else duvida('valor')
      } else if (parcelas != null) {
        // "100 mensais 4x", "100 ao mês em 4x", "100 por mês 4 meses", "100 /mês em 4x".
        const mes = POR_MES.has(k(depois)) ? depois : ['ao', 'por'].includes(k(depois)) && k(depois + 1) === 'mes' ? depois + 1 : -1
        if (mes >= 0 && !toks[mes].usado) {
          usar(depois, mes)
          valor = centavos(parcelas * valor)
        }
      }
    }
  }
  if (porParcela) {
    const total = porParcela.valida ? centavos(porParcela.n * porParcela.v) : porParcela.v
    if (valor == null) {
      valor = total
      if (porParcela.duvidar) duvida('valor')
    } else if (valor !== total) duvida('valor')
  }
  for (let i = 0; i < toks.length; i++) if (k(i) === 'r$' || k(i) === 'reais') toks[i].usado = true
  // O "x" solto entre dois números ("R$ 30 x 2", "R$ 15 x 2 vezes"), ou antes de "de",
  // é o "vezes": sai da descrição, e a conta é ambígua. Fora disso é palavra ("raio x").
  const ehNumero = (i: number) => lerNumero(k(i)) != null
  for (let i = 1; i < toks.length; i++) {
    if (toks[i].usado || k(i) !== 'x' || !ehNumero(i - 1) || !(ehNumero(i + 1) || k(i + 1) === 'de')) continue
    toks[i].usado = true
    duvida('valor')
  }
  if (valor != null && valor <= 0) valor = null
  // Sem valor, ou com outro número sobrando na descrição ("3 cafés 15", "mil 200 tv"), a pessoa confere.
  const outroNumero = (t: Token) =>
    lerNumero(t.chave) != null || /^\d+x$/.test(t.chave) || t.chave === 'mil' || (NUMEROS.has(t.chave) && t.chave !== 'um' && t.chave !== 'uma')
  if (valor == null || toks.some((t) => !t.usado && outroNumero(t))) duvida('valor')

  // O conectivo colado antes do que foi consumido sai junto ("no débito", "em 3x").
  for (let i = toks.length - 2; i >= 0; i--) {
    if (!toks[i].usado && CONECTIVOS.has(k(i)) && toks[i + 1].usado) toks[i].usado = true
  }

  // O substantivo de receita só fica na descrição quando é a única palavra (conectivos soltos já saíram acima).
  if (sobra().some((i) => !substantivos.includes(i))) for (const i of substantivos) toks[i].usado = true

  // O cartão: a palavra logo depois de "cartão"/"crédito"; senão, numa despesa
  // (ou estorno) sem pix/débito/dinheiro, a última palavra que sobrou quando sobram duas ou mais.
  // Com `palavrasDeCartao`, só a palavra de um cartão; sem ele, quem chama devolve a palavra à descrição se `casarCartao` falhar.
  const ehPalavra = (i: number) => /^\p{L}{3,}$/u.test(k(i)) && !CONECTIVOS.has(k(i))
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
    const deCartao = !palavrasDeCartao || palavrasDeCartao.has(k(ultima))
    // Com os cartões, o conectivo não conta quando a palavra sozinha é um gasto comum:
    // "gastei 50 no mercado" com um Mercado Pago é o mercado; "estorno de 50 no nubank" é o Nubank.
    const naoConectivas = s.filter((i) => !CONECTIVOS.has(k(i))).length
    const bastam = s.length >= 2 && (!palavrasDeCartao || naoConectivas >= 2 || conceitoDe(k(ultima)) == null)
    if (bastam && ehPalavra(ultima) && !prende && deCartao) cartaoIdx = ultima
  }
  let cartaoTexto: string | null = null
  let cartaoPalavra: string | null = null
  if (cartaoIdx >= 0) {
    cartaoTexto = k(cartaoIdx)
    cartaoPalavra = toks[cartaoIdx].texto.replace(/^[("'“‘]+|[)"'”’.,;:!?]+$/g, '')
    toks[cartaoIdx].usado = true
    const antes = toks[cartaoIdx - 1]
    if (antes && !antes.usado && CONECTIVOS.has(antes.chave)) antes.usado = true
  }
  if (cartaoTexto == null && (forma === 'credit_card' || parcelas != null)) duvida('cartao')

  // A descrição: o resto, sem conectivo solto nas pontas.
  const resto = sobra()
  while (resto.length && CONECTIVOS.has(k(resto[0]))) resto.shift()
  if (resto.length > 1 && ARTIGOS.has(k(resto[0]))) resto.shift()
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
    cartaoPalavra,
    descricao,
    motivoDoTipo: motivoEstorno ?? motivoParcelas ?? motivoReceita,
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

/** As palavras (3+ letras, não numéricas, normalizadas) do nome e do apelido dos cartões ativos. */
export function palavrasDosCartoes(cartoes: CartaoParaCasar[]): Set<string> {
  const out = new Set<string>()
  for (const c of cartoes) {
    if (!c.is_active) continue
    for (const p of normalizarDescricao(`${c.name} ${c.wallet_alias ?? ''}`).split(' ')) {
      if (p.length >= 3 && !/^\d+$/.test(p)) out.add(p)
    }
  }
  return out
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
  /** Quantas vezes a linha se repete (a RPC agrupa); ausente é 1. */
  n?: number
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

export type CategoriaParaCasar = { id: string; name: string; type: 'expense' | 'income' }

/** De onde veio a categoria escolhida pela frase; `dita` é a que a pessoa escreveu nela ("pão mercado"). */
export type MotivoDaCategoria = 'dita' | 'historico' | 'aprendido' | 'nome' | 'comum' | 'ia'

/** As palavras de 3+ letras, normalizadas, com e sem o "s" final ("cafés" casa "café"). */
function palavrasDe(s: string): Set<string> {
  const out = new Set<string>()
  for (const p of normalizarDescricao(s).split(' ')) {
    if (p.length < 3 || /^\d+$/.test(p)) continue
    out.add(p)
    if (p.length > 3 && p.endsWith('s')) out.add(p.slice(0, -1))
  }
  return out
}

/**
 * Palavras comuns de uma descrição e os nomes de categoria que as abrigam, do
 * mais específico ao mais geral: "uber" cai em "Transporte", ou em "Carro"
 * quando não há "Transporte". A primeira palavra da descrição que casa decide.
 */
export const CONCEITOS: { id: string; palavras: string[]; nomes: string[] }[] = [
  {
    id: 'mercado',
    palavras: ['mercado', 'supermercado', 'feira', 'hortifruti', 'sacolao', 'acougue', 'atacadao', 'assai', 'carrefour', 'atacarejo', 'hiper', 'hipermercado', 'pao de acucar', 'oxxo', 'sams', 'makro', 'guanabara'],
    nomes: ['mercado', 'supermercado', 'feira', 'alimentacao', 'comida'],
  },
  {
    id: 'restaurante',
    palavras: ['restaurante', 'lanche', 'lanchonete', 'almoco', 'jantar', 'ifood', 'delivery', 'pizza', 'pizzaria', 'hamburguer', 'burger', 'sushi', 'cafe', 'cafeteria', 'padaria', 'bar', 'marmita', 'rappi', 'mcdonalds', 'starbucks', 'acai', 'sorvete', 'pastel', 'salgado', 'churrasco', 'boteco', 'ze delivery', 'outback', 'coco bambu', 'habibs', 'bobs', 'burger king'],
    nomes: ['restaurante', 'delivery', 'lanche', 'refeicao', 'refeicoe', 'alimentacao', 'comida'],
  },
  {
    id: 'combustivel',
    palavras: ['gasolina', 'etanol', 'alcool', 'diesel', 'gnv', 'combustivel', 'abastecimento', 'abasteci', 'posto', 'shell', 'ipiranga', 'petrobras'],
    nomes: ['combustivel', 'carro', 'veiculo', 'automovel', 'transporte', 'mobilidade'],
  },
  {
    id: 'carro',
    palavras: ['estacionamento', 'pedagio', 'oficina', 'ipva', 'licenciamento', 'lavagem', 'mecanico', 'seguro auto', 'sem parar', 'veloe'],
    nomes: ['carro', 'veiculo', 'automovel', 'transporte', 'combustivel'],
  },
  {
    id: 'transporte',
    palavras: ['uber', 'taxi', 'onibus', 'metro', 'trem', 'cabify', 'patinete', 'bilhete'],
    nomes: ['transporte', 'mobilidade', 'carro', 'veiculo'],
  },
  {
    id: 'saude',
    palavras: ['farmacia', 'drogaria', 'drogasil', 'remedio', 'medico', 'consulta', 'exame', 'dentista', 'hospital', 'psicologo', 'terapia', 'laboratorio', 'clinica', 'raia', 'drogaraia', 'pague menos', 'panvel', 'unimed', 'plano de saude'],
    nomes: ['saude', 'farmacia', 'medico', 'remedio'],
  },
  {
    id: 'casa',
    palavras: ['aluguel', 'condominio', 'iptu', 'luz', 'energia', 'agua', 'gas', 'internet', 'celular', 'telefone', 'enel', 'sabesp', 'cemig', 'copel', 'light', 'vivo', 'claro', 'tim', 'botijao', 'ultragaz', 'conta de luz', 'conta de agua'],
    nomes: ['moradia', 'casa', 'contas', 'habitacao', 'aluguel', 'servico'],
  },
  {
    id: 'assinatura',
    palavras: ['netflix', 'spotify', 'disney', 'hbo', 'youtube', 'globoplay', 'deezer', 'icloud', 'chatgpt', 'assinatura', 'prime', 'paramount', 'crunchyroll'],
    nomes: ['assinatura', 'streaming', 'servico', 'lazer', 'entretenimento'],
  },
  {
    id: 'viagem',
    palavras: ['hotel', 'airbnb', 'passagem', 'voo', 'latam', 'booking', 'hospedagem', 'pousada', 'viagem'],
    nomes: ['viagem', 'lazer'],
  },
  {
    id: 'lazer',
    palavras: ['cinema', 'show', 'ingresso', 'teatro', 'steam', 'balada', 'festa', 'passeio', 'parque', 'museu'],
    nomes: ['lazer', 'entretenimento', 'diversao'],
  },
  {
    id: 'educacao',
    palavras: ['escola', 'faculdade', 'curso', 'livro', 'apostila', 'udemy', 'alura', 'material', 'livraria', 'mensalidade'],
    nomes: ['educacao', 'estudo', 'escola', 'curso', 'livro'],
  },
  {
    id: 'vestuario',
    palavras: ['roupa', 'sapato', 'tenis', 'camisa', 'camiseta', 'calca', 'vestido', 'shein', 'renner', 'zara', 'riachuelo', 'shopee', 'amazon', 'magalu', 'shopping'],
    nomes: ['vestuario', 'roupa', 'compra', 'shopping'],
  },
  {
    id: 'pets',
    palavras: ['pet', 'petshop', 'racao', 'veterinario', 'cachorro', 'gato', 'cobasi', 'petz'],
    nomes: ['pet', 'animai', 'cachorro', 'gato'],
  },
  {
    id: 'beleza',
    palavras: ['cabelo', 'cabeleireiro', 'salao', 'barbeiro', 'barbearia', 'manicure', 'unha', 'estetica', 'perfume', 'maquiagem', 'cosmetico'],
    nomes: ['beleza', 'cuidado', 'estetica', 'pessoal'],
  },
  {
    id: 'academia',
    palavras: ['academia', 'smartfit', 'crossfit', 'pilates', 'natacao', 'futebol', 'esporte'],
    nomes: ['academia', 'esporte', 'saude'],
  },
  {
    id: 'salario',
    palavras: ['salario', 'holerite', 'ordenado', 'adiantamento'],
    nomes: ['salario', 'trabalho', 'renda'],
  },
  {
    id: 'freela',
    palavras: ['freela', 'freelance', 'bico', 'cliente'],
    nomes: ['freela', 'freelance', 'extra', 'trabalho', 'renda'],
  },
  {
    id: 'rendimento',
    palavras: ['rendimento', 'juros', 'dividendo', 'cdb', 'tesouro', 'investimento', 'poupanca'],
    nomes: ['rendimento', 'investimento', 'juros'],
  },
  {
    id: 'reembolso',
    palavras: ['reembolso', 'devolucao', 'ressarcimento'],
    nomes: ['reembolso', 'devolucao'],
  },
]

/** A entrada (uma ou mais palavras) começa em `ws[i]`; a de uma palavra casa também sem o "s" final. */
function casaEm(ws: string[], i: number, entrada: string): boolean {
  const e = entrada.split(' ')
  if (e.length === 1) return ws[i] === entrada || (ws[i].endsWith('s') && ws[i].slice(0, -1) === entrada)
  return e.every((w, k) => ws[i + k] === w)
}

/** Palavra (de uma palavra só) → posição do primeiro conceito que a tem; montado uma vez. */
const POSICAO_DO_CONCEITO = new Map<string, number>()
CONCEITOS.forEach((g, i) => {
  for (const e of g.palavras) if (!e.includes(' ') && !POSICAO_DO_CONCEITO.has(e)) POSICAO_DO_CONCEITO.set(e, i)
})

/** O `id` do conceito de uma palavra normalizada (com e sem o "s" final); `null` fora de todos. */
export function conceitoDe(palavra: string): string | null {
  const exata = POSICAO_DO_CONCEITO.get(palavra)
  const semS = palavra.endsWith('s') ? POSICAO_DO_CONCEITO.get(palavra.slice(0, -1)) : undefined
  // Como no `find` pela ordem de CONCEITOS: vence o conceito que vem antes.
  const i = exata == null ? semS : semS == null ? exata : Math.min(exata, semS)
  return i == null ? null : CONCEITOS[i].id
}

/** Não votam: dizem como foi pago, ou nada dizem do gasto. */
const PALAVRAS_VAZIAS = new Set([
  'compra', 'compras', 'pagamento', 'gasto', 'conta', 'valor', 'reais', 'real', 'coisa', 'coisas',
  'hoje', 'ontem', 'cartao', 'credito', 'debito', 'pix', 'dinheiro', 'loja', 'parcela',
])

/** As palavras de 3+ letras que contam, normalizadas e no singular ("xablaus" → "xablau"), sem as vazias. */
function palavrasQueContam(s: string): string[] {
  const out: string[] = []
  for (const p of normalizarDescricao(s).split(' ')) {
    if (p.length < 3 || /^\d+$/.test(p)) continue
    const singular = p.length > 3 && p.endsWith('s') ? p.slice(0, -1) : p
    if (PALAVRAS_VAZIAS.has(p) || PALAVRAS_VAZIAS.has(singular)) continue
    out.push(singular)
  }
  return out
}

/**
 * Se a descrição é coberta pelo nome da categoria: toda palavra que conta
 * (`palavrasQueContam`) está no nome ("42 mercado" e Mercado sim; "Mercado
 * Livre" e Mercado, não).
 */
export function nomeCobreDescricao(descricao: string, nomeDaCategoria: string): boolean {
  const doNome = palavrasDe(nomeDaCategoria)
  return palavrasQueContam(descricao).every((p) => doNome.has(p))
}

/** A mesma palavra normalizada, com ou sem o "s" final ("mercados" é "mercado"). */
function mesmaPalavra(a: string, b: string): boolean {
  return a === b || (a.length > 3 && a === `${b}s`) || (b.length > 3 && b === `${a}s`)
}

/**
 * Ligam a categoria dita ao resto ("pão no mercado", "brinquedo para o pet"):
 * soltos no fim, saem com ela, e dizem que ela é um lugar ou um dono, não a
 * categoria com certeza (a dita fraca). O "a" é o artigo e o "à" sem acento.
 */
const LIGAM_A_CATEGORIA = new Set([
  'no', 'na', 'nos', 'nas', 'em', 'pra', 'pro', 'para', 'pros', 'pras', 'ate', 'ao', 'aos', 'a', 'as',
  'de', 'do', 'da', 'dos', 'das', 'o', 'os',
])
/** Depois deles a categoria compõe o nome ("plano de saúde", "garrafa de água"): a descrição fica inteira. */
const COMPOEM_O_NOME = new Set(['de', 'do', 'da', 'dos', 'das'])

/**
 * A categoria de um trecho da descrição: o nome inteiro de uma só categoria (o
 * mais longo que `trecho(m)`, as `m` palavras, casa), senão uma palavra que conta
 * (3+ letras, fora das vazias) do nome de uma só. Duas no mesmo degrau: `null`.
 */
function categoriaDoTrecho(
  nomes: { id: string; ws: string[] }[],
  trecho: (m: number) => string[] | null,
): { id: string; m: number } | null {
  for (let m = Math.max(0, ...nomes.map((c) => c.ws.length)); m >= 1; m--) {
    const t = trecho(m)
    if (!t) continue
    const achadas = nomes.filter((c) => c.ws.length === m && c.ws.every((w, k) => mesmaPalavra(w, t[k])))
    if (achadas.length === 1) return { id: achadas[0].id, m }
    if (achadas.length > 1) return null
  }
  const conta = (w: string) => palavrasQueContam(w).length > 0
  const p = trecho(1)?.[0]
  if (!p || !conta(p)) return null
  const achadas = nomes.filter((c) => c.ws.some((w) => conta(w) && mesmaPalavra(w, p)))
  return achadas.length === 1 ? { id: achadas[0].id, m: 1 } : null
}

type Dita = { descricao: string; categoryId: string; forte: boolean }

/** A dita, e a descrição sem a categoria (a que o histórico confere na fraca). */
function separar(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
): (Dita & { semCategoria: string }) | null {
  const nomes = categorias
    .filter((c) => c.type === tipo)
    .map((c) => ({ id: c.id, ws: normalizarDescricao(c.name).split(' ').filter(Boolean) }))
  const toks = descricao.trim().split(/\s+/).filter(Boolean)
  const ks = toks.map(normalizarDescricao)
  if (!nomes.length || !toks.length) return null

  let achada: { id: string; m: number } | null = null
  let resto: string[] = []
  let dita: string[] = []
  const marcador = ks.findIndex((k, i) => k === 'categoria' && i + 1 < ks.length)
  if (marcador >= 0) {
    const ini = marcador + 1
    achada = categoriaDoTrecho(nomes, (m) => (ini + m <= ks.length ? ks.slice(ini, ini + m) : null))
    if (achada) {
      dita = toks.slice(ini, ini + achada.m)
      resto = [...toks.slice(0, marcador), ...toks.slice(ini + achada.m)]
    }
  }
  const peloMarcador = achada != null
  if (!achada) {
    achada = categoriaDoTrecho(nomes, (m) => (m <= ks.length ? ks.slice(ks.length - m) : null))
    if (!achada) return null
    const m = achada.m
    let ini = ks.length - m
    // Repetida ("mercado mercado"): conta uma vez.
    while (ini - m >= 0 && ks.slice(ini - m, ini).every((k, j) => mesmaPalavra(k, ks[ini + j]))) ini -= m
    dita = toks.slice(ini, ini + m)
    resto = toks.slice(0, ini)
  }
  const soltos: string[] = []
  while (resto.length && LIGAM_A_CATEGORIA.has(normalizarDescricao(resto[resto.length - 1]))) {
    soltos.push(normalizarDescricao(resto.pop()!))
  }
  const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
  const semCategoria = maiuscula((resto.length ? resto : dita).join(' '))
  // Forte: pelo marcador, colada no fim sem conectivo, ou a única coisa dita ("42 mercado").
  const forte = peloMarcador || !soltos.length || !resto.length
  // A categoria que compõe o nome, ou só palavras vazias sobrando ("conta de luz" em Luz): a descrição fica inteira.
  const inteira =
    resto.length > 0 && (soltos.some((k) => COMPOEM_O_NOME.has(k)) || !palavrasQueContam(resto.join(' ')).length)
  return { descricao: inteira ? maiuscula(toks.join(' ')) : semCategoria, semCategoria, categoryId: achada.id, forte }
}

/**
 * A categoria que a pessoa escreveu na frase ("pão mercado" → Pão em Mercado), e
 * a descrição sem ela. Vale a do fim da descrição (com o mesmo trecho repetido
 * contando uma vez, e os conectivos e artigos soltos saindo junto), ou a que
 * segue o marcador "categoria" em qualquer lugar. No começo, com outras palavras
 * depois, é nome de loja ("Mercado Livre"), e não há categoria dita. Sem nada que
 * sobre, a descrição fica com uma ocorrência dela ("42 mercado" → Mercado);
 * sobrando só palavras vazias, ou depois de "de"/"do"/"da"/"dos"/"das" ("plano de
 * saúde"), fica inteira. `forte` é a colada no fim sem conectivo, a do marcador ou
 * a única coisa dita; depois de um conectivo ("uber pra casa") é fraca, um lugar
 * ou um dono que pode não ser a categoria. Só as categorias do `tipo`; ambígua, `null`.
 */
export function separarCategoriaDita(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
): Dita | null {
  const d = separar(descricao, tipo, categorias)
  return d && { descricao: d.descricao, categoryId: d.categoryId, forte: d.forte }
}

/**
 * A categoria da frase, a mesma regra no app e na Edge `capture`:
 * 1. a **dita forte** (`separarCategoriaDita`) vence tudo, com a descrição limpa;
 * 2. a **dita fraca** ("uber pra casa") pergunta antes ao que a pessoa já lançou,
 *    pela descrição sem a categoria e pela que fica: concordando, a dita fica limpa
 *    ("Conta de luz" já lançada em Luz); com outra categoria, ela vence, e a
 *    descrição fica inteira ("Uber pra casa" em Transporte); sem nada, vale a dita,
 *    a conferir (`aConferir`);
 * 3. sem dita (ou com `podeDitar` falso: o estabelecimento, a foto), `casarCategoria`.
 */
export function escolherCategoria(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
  historico: LinhaHistorico[],
  hoje: string,
  podeDitar = true,
): { descricao: string; categoria: { categoryId: string; motivo: MotivoDaCategoria } | null; aConferir: boolean } {
  const dita = podeDitar ? separar(descricao, tipo, categorias) : null
  if (!dita) return { descricao, categoria: casarCategoria(descricao, tipo, categorias, historico, hoje), aConferir: false }
  const comoDita = { categoryId: dita.categoryId, motivo: 'dita' as const }
  if (dita.forte) return { descricao: dita.descricao, categoria: comoDita, aConferir: false }
  // O que já foi lançado, pela descrição sem a categoria e pela que fica (inteira no "plano de saúde").
  const jas = [dita.semCategoria, ...(dita.descricao !== dita.semCategoria ? [dita.descricao] : [])]
    .map((d) => peloQueJaLancou(d, tipo, categorias, historico, hoje))
    .filter((j) => j != null)
  // Concorda com a dita: ela fica limpa.
  if (jas.some((j) => j.categoryId === dita.categoryId)) return { descricao: dita.descricao, categoria: comoDita, aConferir: false }
  if (jas.length) return { descricao, categoria: jas[0], aConferir: false }
  return { descricao: dita.descricao, categoria: comoDita, aConferir: true }
}

/** O histórico exato, senão o voto aprendido (qualquer peso), só nas categorias do `tipo`. */
function peloQueJaLancou(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
  historico: LinhaHistorico[],
  hoje: string,
): { categoryId: string; motivo: MotivoDaCategoria } | null {
  const doTipo = categorias.filter((c) => c.type === tipo)
  const ids = new Set(doTipo.map((c) => c.id))
  const linhas = historico.filter((l) => l.type === tipo && l.description && l.category_id && ids.has(l.category_id))
  const alvo = normalizarDescricao(descricao)
  const exata = alvo ? maisRecente(linhas.filter((l) => normalizarDescricao(l.description!) === alvo)) : null
  if (exata) return { categoryId: exata.category_id!, motivo: 'historico' }
  const aprendida = voto(descricao, tipo, doTipo, linhas, hoje)
  return aprendida && { categoryId: aprendida.categoryId, motivo: 'aprendido' }
}

type Termos = {
  /** Cada palavra que conta, com o termo do conceito dela (`#id`) ou `null`. */
  palavras: [string, string | null][]
  /** Tudo o que a linha do histórico vota: as palavras e os conceitos delas. */
  todos: Set<string>
}

/** O Importar pergunta pelas mesmas descrições milhares de vezes; o teto evita crescer sem fim. */
const TERMOS_EM_CACHE = new Map<string, Termos>()
const TETO_DO_CACHE = 5000

/**
 * As palavras que votam, cada uma em duas formas: ela mesma, no singular, e o
 * conceito dela (`#combustivel` para "posto" e "abastecimento"). O `#` separa o
 * conceito da palavra de mesmo nome ("mercado").
 */
function termos(s: string): Termos {
  let t = TERMOS_EM_CACHE.get(s)
  if (t) return t
  const palavras = palavrasQueContam(s).map((p): [string, string | null] => {
    const c = conceitoDe(p)
    return [p, c && `#${c}`]
  })
  t = { palavras, todos: new Set(palavras.flatMap(([p, c]) => (c ? [p, c] : [p]))) }
  if (TERMOS_EM_CACHE.size >= TETO_DO_CACHE) TERMOS_EM_CACHE.clear()
  TERMOS_EM_CACHE.set(s, t)
  return t
}

const MES_MS = 30.4375 * 86_400_000

/** Meses (fracionados) de `data` até `hoje`; uma data futura conta como hoje. */
function mesesEntre(data: string, hoje: string): number {
  return Math.max(0, (Date.parse(hoje.slice(0, 10)) - Date.parse(data.slice(0, 10))) / MES_MS)
}

/** Abaixo disto (um lançamento de mais de 6 meses pesa menos que isto) um termo não vota. */
const PESO_MINIMO_DO_TERMO = 0.5
/**
 * Hábito firme: com este peso o aprendido passa à frente do nome da categoria. O peso
 * soma, em cada termo que votou, o de cada linha da vencedora (`n` × ½ a cada 6 meses):
 * dois lançamentos recentes de uma palavra, ou um só com duas palavras que votam.
 */
const PESO_DO_HABITO = 2

/**
 * O voto de `votarCategoria`, com o peso que a vencedora somou em todos os termos.
 */
function voto(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
  historico: LinhaHistorico[],
  hoje: string,
): { categoryId: string; peso: number } | null {
  const ids = new Set(categorias.filter((c) => c.type === tipo).map((c) => c.id))
  const daDescricao = termos(descricao)
  if (!daDescricao.palavras.length) return null
  // termo → categoria → peso
  const votos = new Map<string, Map<string, number>>()
  for (const l of historico) {
    if (l.type !== tipo || !l.description || !l.category_id || !ids.has(l.category_id)) continue
    const peso = (l.n ?? 1) * 0.5 ** (mesesEntre(l.date, hoje) / 6)
    // Uma data ilegível (NaN) não pode fazer ninguém vencer.
    if (!Number.isFinite(peso) || peso <= 0) continue
    for (const t of termos(l.description).todos) {
      if (!daDescricao.todos.has(t)) continue
      const porCategoria = votos.get(t) ?? new Map<string, number>()
      porCategoria.set(l.category_id, (porCategoria.get(l.category_id) ?? 0) + peso)
      votos.set(t, porCategoria)
    }
  }
  const totalDe = (t: string) => {
    let total = 0
    for (const v of votos.get(t)?.values() ?? []) total += v
    return total
  }
  // A palavra vota por si; o conceito só entra no lugar dela quando ela, sozinha, não tem voto.
  const escolhidos = new Set(
    daDescricao.palavras.map(([p, c]) => (c && totalDe(p) < PESO_MINIMO_DO_TERMO ? c : p)),
  )
  const score = new Map<string, number>()
  const somado = new Map<string, number>()
  let comVoto = 0
  for (const t of escolhidos) {
    const porCategoria = votos.get(t)
    const total = totalDe(t)
    if (!porCategoria || total < PESO_MINIMO_DO_TERMO) continue
    comVoto++
    for (const [c, v] of porCategoria) {
      score.set(c, (score.get(c) ?? 0) + v / total)
      somado.set(c, (somado.get(c) ?? 0) + v)
    }
  }
  const [primeiro, segundo] = [...score].sort((a, b) => b[1] - a[1])
  if (!primeiro || primeiro[1] < 0.6 * comVoto || primeiro[1] - (segundo?.[1] ?? 0) < 0.5) return null
  return { categoryId: primeiro[0], peso: somado.get(primeiro[0])! }
}

/**
 * A categoria que o histórico ensina para a descrição. Cada palavra da descrição
 * vota por si; só quando ela não soma meio voto entra o conceito dela ("padaria"
 * com histórico próprio não herda o iFood). Cada termo
 * reparte um voto entre as categorias das linhas que o têm, pesadas por `n` e
 * pela idade (o peso cai à metade a cada 6 meses); um termo com menos de meio
 * voto não conta. Vence quem soma 60% dos termos que votaram e abre meio voto
 * sobre a segunda; senão, `null`. Só valem as linhas do `tipo` com uma
 * categoria de `categorias` do `tipo`.
 */
export function votarCategoria(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
  historico: LinhaHistorico[],
  hoje: string,
): string | null {
  return voto(descricao, tipo, categorias, historico, hoje)?.categoryId ?? null
}

/**
 * A categoria pela descrição, em ordem (a primeira que decide vence):
 * 1. **histórico** — a linha mais recente com a mesma descrição normalizada e categoria;
 * 2. **aprendido**, se é hábito firme — o voto das palavras em tudo o que a pessoa já lançou
 *    (`votarCategoria`), quando a vencedora soma peso 2 ou mais nos termos que votaram
 *    (cada lançamento pesa `n` × ½ a cada 6 meses de idade, em cada termo em que aparece);
 * 3. **nome** — uma palavra do nome de uma categoria está na descrição ("42 mercado" → "Mercado");
 *    duas categorias com o mesmo número de palavras casadas é empate, e ninguém vence;
 *    depois dele, o **aprendido** de peso menor;
 * 4. **comum** — uma palavra conhecida (`CONCEITOS`) leva ao nome de categoria que a abriga.
 * Só valem as categorias de `categorias` do `tipo`: uma apagada no histórico não volta.
 */
export function casarCategoria(
  descricao: string,
  tipo: 'expense' | 'income',
  categorias: CategoriaParaCasar[],
  historico: LinhaHistorico[],
  hoje: string,
): { categoryId: string; motivo: MotivoDaCategoria } | null {
  const doTipo = categorias.filter((c) => c.type === tipo)
  if (!doTipo.length) return null
  const ids = new Set(doTipo.map((c) => c.id))
  const linhas = historico.filter((l) => l.type === tipo && l.description && l.category_id && ids.has(l.category_id))

  const alvo = normalizarDescricao(descricao)
  const exata = alvo ? maisRecente(linhas.filter((l) => normalizarDescricao(l.description!) === alvo)) : null
  if (exata) return { categoryId: exata.category_id!, motivo: 'historico' }

  const aprendida = voto(descricao, tipo, doTipo, linhas, hoje)
  if (aprendida && aprendida.peso >= PESO_DO_HABITO) return { categoryId: aprendida.categoryId, motivo: 'aprendido' }

  const daDescricao = palavrasDe(descricao)
  let melhor: CategoriaParaCasar | null = null
  let pontos = 0
  let empate = false
  for (const c of doTipo) {
    const n = [...palavrasDe(c.name)].filter((p) => daDescricao.has(p)).length
    if (n > pontos) {
      melhor = c
      pontos = n
      empate = false
    } else if (n > 0 && n === pontos) empate = true
  }
  if (melhor && !empate) return { categoryId: melhor.id, motivo: 'nome' }
  if (aprendida) return { categoryId: aprendida.categoryId, motivo: 'aprendido' }

  const ws = normalizarDescricao(descricao).split(' ')
  for (let i = 0; i < ws.length; i++) {
    const grupo = CONCEITOS.find((g) => g.palavras.some((e) => casaEm(ws, i, e)))
    if (!grupo) continue
    for (const nome of grupo.nomes) {
      const achadas = doTipo.filter((c) => palavrasDe(c.name).has(nome))
      if (achadas.length === 1) return { categoryId: achadas[0].id, motivo: 'comum' }
      if (achadas.length > 1) return null
    }
  }
  return null
}

/**
 * O cartão do "crédito" dito sem nome: o que o formulário pré-escolhe ao tocar
 * em Crédito (`escolhidoNoForm`: o único ativo, ou o último escolhido na
 * carteira neste aparelho); sem ele, o da compra no crédito mais recente do
 * histórico, se o cartão segue ativo. `null` quando nenhum dos dois serve.
 */
export function cartaoDoCredito(
  cartoes: CartaoParaCasar[],
  historico: LinhaHistorico[],
  escolhidoNoForm: string | null,
): CartaoParaCasar | null {
  const ativos = cartoes.filter((c) => c.is_active)
  const doForm = ativos.find((c) => c.id === escolhidoNoForm)
  if (doForm) return doForm
  const linha = maisRecente(
    historico.filter((l) => l.payment_method === 'credit_card' && ativos.some((c) => c.id === l.payment_credit_card_id)),
  )
  return linha ? ativos.find((c) => c.id === linha.payment_credit_card_id)! : null
}
