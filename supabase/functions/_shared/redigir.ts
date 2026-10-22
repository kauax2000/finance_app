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

const SUBSTITUICOES: Array<[RegExp, string | ((m: string) => string)]> = [
  // E-mail primeiro: ele pode ter dígitos que as regras abaixo comeriam pela metade.
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]'],
  // Cartão pela forma, com separador repetido ("5502  0912", "5502 - 0912"), sem
  // engolir o número vizinho: 4-4-4-(1..7), Amex 4-6-5, e corrido de 13 a 19.
  [/\b\d{4}(?:[ \t.-]{1,3}\d{4}){2}[ \t.-]{1,3}\d{1,7}\b/g, mascaraCartao],
  [/\b\d{4}[ \t.-]{1,3}\d{6}[ \t.-]{1,3}\d{5}\b/g, mascaraCartao],
  [/\b\d{13,19}\b/g, mascaraCartao],
  [/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[cnpj]'],
  [/\b\d{3}[. ]?\d{3}[. ]?\d{3}[ -]?\d{2}\b/g, '[cpf]'],
  [/\b\d{5}-\d{3}\b|\bcep\W*\d{8}\b/gi, '[cep]'],
  // Telefone: com DDD (ou +55) os blocos aceitam espaço, ponto ou hífen; sem
  // DDD, só o hífen. "42,90", "1.234,56" e "12/10" não têm a forma.
  [
    /(?:\+55[ .-]?)?(?:\(\d{2}\)[ .-]?|\b\d{2}[ .-]?)(?:9[ .-]?)?\d{4}[ .-]?\d{4}\b|\b9?\d{4}-\d{4}\b/g,
    '[telefone]',
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
