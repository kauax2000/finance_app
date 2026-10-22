/**
 * Tira os dados pessoais de um texto antes de ele sair para um provedor de IA.
 * É a versão do servidor do `removerIdentificacao` do app, e mais forte: o
 * cliente não é confiável, então a Edge redige de novo.
 *
 * Fica o que a IA precisa ler: valores ("42,90", "1.234,56") e datas
 * ("12/10", "2026-10-22").
 */

import { normalizarDescricao } from './frase.ts'

const SUBSTITUICOES: Array<[RegExp, string | ((m: string) => string)]> = [
  // E-mail primeiro: ele pode ter dígitos que as regras abaixo comeriam pela metade.
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]'],
  // Cartão: 13 a 19 dígitos, com ou sem espaço, ponto ou hífen entre eles.
  [/\b(?:\d[ .-]?){12,18}\d\b/g, (m) => `•••• ${m.replace(/\D/g, '').slice(-4)}`],
  [/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[cnpj]'],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[cpf]'],
  [/\b\d{5}-\d{3}\b|\bcep\W*\d{8}\b/gi, '[cep]'],
  // Telefone: com DDD (entre parênteses ou não) ou o número com hífen. Exige
  // 8 dígitos seguidos de bloco, então "42,90" e "12/10" não casam.
  [/(?:\+?55\s?)?(?:\(\d{2}\)\s?|\b\d{2}[\s-]?)9?\d{4}-?\d{4}\b|\b9?\d{4}-\d{4}\b/g, '[telefone]'],
  // Logradouro até o número. O número não pode ser o começo de um valor ("estrada 12,50").
  [
    /\b(?:rua|r\.|av\.?|avenida|travessa|tv\.|alameda|al\.|rodovia|estrada|pra[cç]a)\s+[^\d\n]{1,60}?\s*(?:n[º°o.]?\s*)?\d{1,5}[a-z]?\b(?![.,]\d)/gi,
    '[endereço]',
  ],
]

/** Partículas de nome que não identificam ninguém e são palavras comuns. */
const PARTICULAS = new Set(['dos', 'das', 'del', 'von', 'van'])

export function redigir(texto: string, nomes: string[]): string {
  let r = texto
  for (const [re, troca] of SUBSTITUICOES) r = r.replace(re, troca as string)

  // Cada palavra de cada nome, com 3 letras ou mais, comparada sem caixa e sem acento.
  const palavras = new Set(
    nomes.flatMap((n) => normalizarDescricao(n).split(' ')).filter((p) => p.length >= 3 && !PARTICULAS.has(p)),
  )
  if (palavras.size === 0) return r
  return r.replace(/[\p{L}\p{N}]+/gu, (p) => (palavras.has(normalizarDescricao(p)) ? '[nome]' : p))
}
