/**
 * Tira os dados pessoais de um texto antes de ele sair para um provedor de IA.
 * É a versão do servidor do `removerIdentificacao` do app, e mais forte: o
 * cliente não é confiável, então a Edge redige de novo.
 *
 * Fica o que a IA precisa ler: valores ("42,90", "1.234,56") e datas
 * ("12/10", "2026-10-22").
 */

import { normalizarDescricao } from './frase.ts'

/**
 * Uma linha com valor em reais ("42,90", "1.234,56"): é item de fatura ou frase
 * de compra. Até quatro grupos de milhar (trilhões): sem teto, "1.111.111…" de
 * 72k faz o grupo recuar a linha inteira em cada posição.
 */
const TEM_DINHEIRO = /\b\d{1,3}(?:\.\d{3}){0,4},\d{2}\b|\b\d+,\d{2}\b/

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
/**
 * Um valor em reais: "1.234,56", "42,90", "9.90". O fim não encosta em dígito,
 * em "/" nem em outra cauda: "1111,12,28" é validade de cartão, não valor. O
 * `(?<!\d)` do começo e o teto de quatro milhares são o que mantém a busca
 * linear: sem eles, o `\d+` e o `(\.\d{3})+` recuam a sequência inteira em
 * cada posição de um número corrido de 72k.
 */
const VALOR = /(?<!\d)\d{1,3}(?:\.\d{3}){1,4},\d{2}(?![\d/]|[.,]\d)|(?<!\d)\d+[.,]\d{2}(?![\d/]|[.,]\d)/g

type Bloco = { ini: number; fim: number; digitos: string }

/**
 * O cartão é achado por varredura, não por regex com guarda (que vazou duas
 * vezes): em cada sequência de blocos, um trecho de 13 a 19 dígitos que começa
 * num bloco de 4 ou mais, só tem blocos de 3 ou mais e passa no Luhn vira
 * "•••• " + os 4 últimos.
 *
 * A varredura vai do fim da sequência para o começo e fica com o trecho que
 * termina mais à direita (o mais longo, em empate): um bloco de 4 antes do
 * cartão ("22/10/2026 5516 6722 …") passa no Luhn por acaso uma vez em dez, e
 * da esquerda ele levaria o ano e exporia 8 dígitos.
 *
 * Um bloco dentro de um valor corta a sequência e não entra no cartão, então
 * "4111 1111 1111 1111 23,90" mascara o cartão e deixa o valor. A exceção é a
 * cabeça de exatamente 4 dígitos de um valor ("1111,12"): ela pode fechar o
 * trecho, e só fechar, porque o CSV com a validade partida por vírgula
 * ("…,4111 1111 1111 1111,12") seria lido como valor e vazaria o cartão; a
 * cauda fica, e os 4 dígitos continuam no texto. Um número corrido de 13 a 19
 * dígitos que passa no Luhn é mascarado mesmo colado a um valor
 * ("4111111111111111,90").
 */
function mascararCartoes(texto: string): string {
  // Um byte por posição: 1 dentro de um valor, 2 no começo da cabeça de 4 dígitos ("1111,12").
  const valor = new Uint8Array(texto.length)
  for (const m of texto.matchAll(VALOR)) {
    valor.fill(1, m.index, m.index + m[0].length)
    if (m[0].length === 7) valor[m.index] = 2
  }

  const trechos: Array<[number, number, string]> = []
  for (const m of texto.matchAll(BLOCOS)) {
    const sequencias: Bloco[][] = [[]]
    for (const d of m[0].matchAll(/\d+/g)) {
      const b: Bloco = { ini: m.index + d.index, fim: m.index + d.index + d[0].length, digitos: d[0] }
      const marca = valor[b.ini]
      if (marca !== 1) sequencias.at(-1)!.push(b)
      if (marca) {
        if (marca === 1 && b.digitos.length >= 13 && b.digitos.length <= 19 && passaLuhn(b.digitos)) {
          trechos.push([b.ini, b.fim, b.digitos])
        }
        sequencias.push([])
      }
    }
    for (const seq of sequencias) {
      for (let fim = seq.length - 1; fim >= 0; fim--) {
        let digitos = ''
        let achou = -1
        for (let ini = fim; ini >= 0; ini--) {
          // Bloco de 1 ou 2 dígitos é dia, mês ou parcela ("03/10"), nunca pedaço de cartão.
          if (seq[ini].digitos.length < 3) break
          digitos = seq[ini].digitos + digitos
          if (digitos.length > 19) break
          if (seq[ini].digitos.length >= 4 && digitos.length >= 13 && passaLuhn(digitos)) achou = ini
        }
        if (achou < 0) continue
        const todos = seq.slice(achou, fim + 1).map((b) => b.digitos).join('')
        trechos.push([seq[achou].ini, seq[fim].fim, todos])
        fim = achou
      }
    }
  }
  trechos.sort((a, b) => a[0] - b[0])
  let r = ''
  let pos = 0
  for (const [ini, fim, digitos] of trechos) {
    r += `${texto.slice(pos, ini)}•••• ${digitos.slice(-4)}`
    pos = fim
  }
  return r + texto.slice(pos)
}

// ---------------------------------------------------------------- o resto

// O `(?<!…)` só deixa a busca começar no início da palavra: sem ele, 72k de
// dígitos custavam 2,5s (o `+` recuava tudo em cada posição à procura do "@").
const EMAIL = /(?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g

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
