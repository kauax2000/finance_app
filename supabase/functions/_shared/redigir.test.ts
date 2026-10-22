import { assert, assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@1.0.19'
import { redigir } from './redigir.ts'

Deno.test('redigir: cartão vira •••• e os 4 últimos, e o CPF sai', () => {
  const r = redigir('Cartão 5502 0912 3456 7890 CPF 123.456.789-09', [])
  assertStringIncludes(r, '•••• 7890')
  assertFalse(/\d{13,}/.test(r.replace(/[\s.-]/g, '')), r)
  assertFalse(r.includes('123.456.789-09'), r)
  assertFalse(r.includes('5502'), r)
})

Deno.test('redigir: cartão sem separador e CPF/CNPJ sem pontuação', () => {
  const r = redigir('cartao 5502091234567890 cpf 12345678909 cnpj 12.345.678/0001-90', [])
  assertStringIncludes(r, '•••• 7890')
  assertFalse(r.includes('12345678909'), r)
  assertFalse(r.includes('0001-90'), r)
})

Deno.test('redigir: e-mail, telefone, CEP e logradouro saem', () => {
  const r = redigir(
    'fale com maria.souza+x@exemplo.com.br ou (11) 98765-4321, CEP 01310-100, Rua das Flores, 123',
    [],
  )
  assertFalse(r.includes('@'), r)
  assertFalse(r.includes('98765'), r)
  assertFalse(r.includes('01310-100'), r)
  assertFalse(/flores/i.test(r), r)
  assertFalse(r.includes('123'), r)
})

Deno.test('redigir: Av. com número e telefone sem DDD', () => {
  const r = redigir('Av. Paulista 1000 tel 98765-4321', [])
  assertFalse(/paulista/i.test(r), r)
  assertFalse(r.includes('1000'), r)
  assertFalse(r.includes('98765'), r)
})

Deno.test('redigir: o nome de um membro sai, sem caixa e sem acento, só palavra inteira', () => {
  const r = redigir('pix pra Maria Souza 50; MARIA pagou; mariana não é ela; Joao', ['Maria Souza', 'João', 'Al'])
  assertFalse(/maria\b/i.test(r), r)
  assertFalse(/souza/i.test(r), r)
  assertFalse(/joao/i.test(r), r)
  assertStringIncludes(r, 'mariana')
})

Deno.test('redigir: dinheiro e data ficam', () => {
  assertEquals(redigir('mercado 42,90', []), 'mercado 42,90')
  assertEquals(redigir('12/10 notebook 1.234,56', []), '12/10 notebook 1.234,56')
  assertEquals(redigir('2026-10-22 uber 18,50', []), '2026-10-22 uber 18,50')
  assertEquals(redigir('pedágio estrada 12,50', []), 'pedágio estrada 12,50')
  assert(redigir('12/10 PARCELA 3/10 LOJA 199,90', []).includes('199,90'))
})
