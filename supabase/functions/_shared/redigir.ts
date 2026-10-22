/**
 * Tira os dados pessoais de um texto antes de ele sair para um provedor de IA.
 * É a versão do servidor do `removerIdentificacao` do app, e mais forte: o
 * cliente não é confiável, então a Edge redige de novo.
 *
 * Fica o que a IA precisa ler: valores ("42,90", "1.234,56") e datas
 * ("12/10", "2026-10-22").
 */

import { normalizarDescricao } from './frase.ts'

/** Uma linha com valor em reais ("42,90", "1.234,56"): é item de fatura ou frase de compra. */
const TEM_DINHEIRO = /\b\d{1,3}(?:\.\d{3})*,\d{2}\b|\b\d+,\d{2}\b/

// Sem "tv"/"tv.": colide com TV ("TV. SAMSUNG 2.999,00"); "Travessa" fica por extenso.
const PALAVRA_LOGRADOURO = String.raw`(?:\b(?:av|r|al)\.\s*|\b(?:rua|av|avenida|travessa|alameda|rodovia|estrada)\s+|\bpra[cç]a\s+)`

/** Sem dinheiro na linha: do logradouro ao fim dela ("linha com logradouro", Decisão 6). */
const LOGRADOURO_ATE_O_FIM = new RegExp(String.raw`${PALAVRA_LOGRADOURO}[^\n]*`, 'gi')

/**
 * Com dinheiro na linha, só o trecho que parece mesmo endereço: o logradouro,
 * um nome sem dígito, vírgula ou espaço, e um número que não é o começo de um
 * valor. "12/10 POSTO AV BRASIL 120,00" fica inteiro: o item da fatura vale mais.
 */
const LOGRADOURO_COM_NUMERO = new RegExp(
  String.raw`${PALAVRA_LOGRADOURO}[^\d\n,]{1,60}?(?:,\s*|\s+)(?:n[º°o.]?\s*)?(?:\d{1,3}(?:\.\d{3})+|\d{1,5})\b(?![.,]\d)`,
  'gi',
)

function redigirEndereco(linha: string): string {
  if (TEM_DINHEIRO.test(linha)) return linha.replace(LOGRADOURO_COM_NUMERO, '[endereço]')
  return linha.replace(LOGRADOURO_ATE_O_FIM, (m) => (/\d/.test(m) ? '[endereço]' : m))
}

// Um número não começa colado a outro, a uma data ("12/10") ou a um valor
// ("1.234,56"), e não termina no começo de um valor ou de uma data ("23,90", "03/10").
const ANTES = String.raw`(?<![\d/.,])`
const DEPOIS = String.raw`(?!\d|[.,/]\d)`
const re = (fonte: string, flags = 'g') => new RegExp(fonte, flags)

// ---------------------------------------------------------------- cartão

/** Todo cartão de verdade passa no Luhn; um número de lançamento quase nunca. */
function passaLuhn(digitos: string): boolean {
  let soma = 0
  for (let i = 0; i < digitos.length; i++) {
    let d = Number(digitos[digitos.length - 1 - i])
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2
    soma += d
  }
  return soma % 10 === 0
}

/** Blocos de dígitos ligados por 1 a 3 de [espaço . - _ /]; a vírgula nunca liga. */
const BLOCOS = /\d+(?:[ \t._/-]{1,3}\d+)*/g
/** Um valor em reais: "1.234,56", "42,90", "9.90". O fim não encosta em dígito nem em "/". */
const VALOR = /(?<!\d)\d{1,3}(?:\.\d{3})+,\d{2}(?![\d/])|\d+[.,]\d{2}(?![\d/])/g

type Bloco = { ini: number; fim: number; digitos: string }

/**
 * O cartão é achado por varredura, não por regex com guarda (que vazou duas
 * vezes): em cada sequência de blocos, o trecho mais longo de 13 a 19 dígitos
 * que começa num bloco de 4 ou mais, só tem blocos de 3 ou mais e passa no
 * Luhn vira "•••• " + os 4
 * últimos. Um bloco dentro de um valor corta a sequência e nunca entra no
 * cartão, então "4111 1111 1111 1111 23,90" mascara o cartão e deixa o valor.
 * Um número corrido de 13 a 19 dígitos que passa no Luhn é mascarado mesmo
 * colado a um valor ("4111111111111111,90").
 */
function mascararCartoes(texto: string): string {
  const valores: Array<[number, number]> = [...texto.matchAll(VALOR)].map((m) => [m.index, m.index + m[0].length])
  const dentroDeValor = (b: Bloco) => valores.some(([i, f]) => b.ini < f && b.fim > i)

  const trechos: Array<[number, number, string]> = []
  for (const m of texto.matchAll(BLOCOS)) {
    const blocos: Bloco[] = [...m[0].matchAll(/\d+/g)].map((d) => ({
      ini: m.index + d.index,
      fim: m.index + d.index + d[0].length,
      digitos: d[0],
    }))
    // Corta a sequência em cada bloco de valor; o bloco corrido de 13 a 19 vale sozinho.
    const sequencias: Bloco[][] = [[]]
    for (const b of blocos) {
      if (!dentroDeValor(b)) sequencias.at(-1)!.push(b)
      else {
        if (b.digitos.length >= 13 && b.digitos.length <= 19 && passaLuhn(b.digitos)) {
          trechos.push([b.ini, b.fim, b.digitos])
        }
        sequencias.push([])
      }
    }
    for (const seq of sequencias) {
      let i = 0
      while (i < seq.length) {
        let achou = -1
        let digitos = ''
        if (seq[i].digitos.length >= 4) {
          for (let j = i; j < seq.length; j++) {
            // Bloco de 1 ou 2 dígitos é dia, mês ou parcela ("03/10"), nunca pedaço de cartão.
            if (seq[j].digitos.length < 3) break
            digitos += seq[j].digitos
            if (digitos.length > 19) break
            if (digitos.length >= 13 && passaLuhn(digitos)) achou = j
          }
        }
        if (achou < 0) {
          i++
          continue
        }
        const todos = seq.slice(i, achou + 1).map((b) => b.digitos).join('')
        trechos.push([seq[i].ini, seq[achou].fim, todos])
        i = achou + 1
      }
    }
  }
  let r = texto
  for (const [ini, fim, digitos] of trechos.sort((a, b) => b[0] - a[0])) {
    r = `${r.slice(0, ini)}•••• ${digitos.slice(-4)}${r.slice(fim)}`
  }
  return r
}

// ---------------------------------------------------------------- o resto

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g

const SUBSTITUICOES: Array<[RegExp, string]> = [
  // CPF e CNPJ podem vir depois de "/" ("cpf/123.456.789-09"): antes, só "não é dígito".
  [re(String.raw`(?<!\d)\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}${DEPOIS}`), '[cnpj]'],
  [re(String.raw`(?<!\d)\d{3}[. ]?\d{3}[. ]?\d{3}[ -]?\d{2}${DEPOIS}`), '[cpf]'],
  [re(String.raw`${ANTES}\d{5}-\d{3}${DEPOIS}|\bcep\W*\d{5}[ -]?\d{3}${DEPOIS}`, 'gi'), '[cep]'],
  // Telefone com DDD (com ou sem o 0 da operadora, ou +55): os blocos aceitam espaço, ponto ou hífen.
  [
    re(
      String.raw`(?:\+55[ .-]?(?:\(0?\d{2}\)|0?\d{2})|\(0?\d{2}\)|${ANTES}\b0?\d{2})[ .-]?(?:9[ .-]?)?\d{4}[ .-]?\d{4}${DEPOIS}`,
    ),
    '[telefone]',
  ],
  // Sem DDD, só depois da palavra: "cel 987654321". Sozinho, "1234-5678" pode ser código da compra.
  [
    re(String.raw`\b(cel|celular|tel|telefone|fone|whats|whatsapp)(\W{1,3})9?\d{4}[ .-]?\d{4}${DEPOIS}`, 'gi'),
    '$1$2[telefone]',
  ],
]

/** Partículas de nome que não identificam ninguém e são palavras comuns. */
const PARTICULAS = new Set(['dos', 'das', 'del', 'von', 'van'])

export function redigir(texto: string, nomes: string[]): string {
  // NFC: o texto de PDF chega decomposto ("Joa" + acento), e o nome não casaria.
  let r = texto.normalize('NFC')
  // E-mail primeiro: ele pode ter dígitos que as regras abaixo comeriam pela metade.
  r = mascararCartoes(r.replace(EMAIL, '[email]'))
  for (const [regra, troca] of SUBSTITUICOES) r = r.replace(regra, troca)
  r = r.split('\n').map(redigirEndereco).join('\n')

  // Cada palavra de cada nome, com 3 letras ou mais, comparada sem caixa e sem acento.
  const palavras = new Set(
    nomes.flatMap((n) => normalizarDescricao(n).split(' ')).filter((p) => p.length >= 3 && !PARTICULAS.has(p)),
  )
  if (palavras.size === 0) return r
  return r.replace(/[\p{L}\p{M}\p{N}]+/gu, (p) => (palavras.has(normalizarDescricao(p)) ? '[nome]' : p))
}
