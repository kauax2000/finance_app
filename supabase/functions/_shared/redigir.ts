/**
 * Tira os dados pessoais de um texto antes de ele sair para um provedor de IA.
 * É a versão do servidor do `removerIdentificacao` do app, e mais forte: o
 * cliente não é confiável, então a Edge redige de novo.
 *
 * Fica o que a IA precisa ler: valores ("42,90", "1.234,56") e datas
 * ("12/10", "2026-10-22").
 */

import { normalizarDescricao } from './frase.ts'

const mascaraCartao = (m: string) => `•••• ${m.replace(/\D/g, '').slice(-4)}`

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

/** 12 dígitos ou mais em blocos separados é cartão (4-4-4-4, 4-6-5, 8-8, 4-8-4…). */
const mascaraBlocos = (m: string) => (m.replace(/\D/g, '').length >= 12 ? mascaraCartao(m) : m)

const SUBSTITUICOES: Array<[RegExp, string | ((m: string) => string)]> = [
  // E-mail primeiro: ele pode ter dígitos que as regras abaixo comeriam pela metade.
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]'],
  // Cartão em blocos, com separador repetido ("5502  0912", "5502 - 0912", "/", "_").
  // O último bloco não engole o valor ou a data seguinte: "9012 23,90" fica "•••• 9012 23,90".
  // Blocos de 3 dígitos ou mais: com o "/" de separador, "03/10" seria um bloco.
  [re(String.raw`${ANTES}\d{4,8}(?:[ \t._/-]{1,3}\d{3,8}){1,4}${DEPOIS}`), mascaraBlocos],
  [re(String.raw`${ANTES}\d{13,}${DEPOIS}`), mascaraCartao],
  [re(String.raw`${ANTES}\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}${DEPOIS}`), '[cnpj]'],
  [re(String.raw`${ANTES}\d{3}[. ]?\d{3}[. ]?\d{3}[ -]?\d{2}${DEPOIS}`), '[cpf]'],
  [re(String.raw`${ANTES}\d{5}-\d{3}${DEPOIS}|\bcep\W*\d{5}[ -]?\d{3}${DEPOIS}`, 'gi'), '[cep]'],
  // Telefone com DDD (ou +55): os blocos aceitam espaço, ponto ou hífen.
  [
    re(String.raw`(?:\+55[ .-]?)?(?:\(\d{2}\)[ .-]?|${ANTES}\b\d{2}[ .-]?)(?:9[ .-]?)?\d{4}[ .-]?\d{4}${DEPOIS}`),
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
  for (const [re, troca] of SUBSTITUICOES) r = r.replace(re, troca as string)
  r = r.split('\n').map(redigirEndereco).join('\n')

  // Cada palavra de cada nome, com 3 letras ou mais, comparada sem caixa e sem acento.
  const palavras = new Set(
    nomes.flatMap((n) => normalizarDescricao(n).split(' ')).filter((p) => p.length >= 3 && !PARTICULAS.has(p)),
  )
  if (palavras.size === 0) return r
  return r.replace(/[\p{L}\p{M}\p{N}]+/gu, (p) => (palavras.has(normalizarDescricao(p)) ? '[nome]' : p))
}
