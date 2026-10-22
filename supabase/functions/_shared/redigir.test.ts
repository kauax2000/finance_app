import { assert, assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@1.0.19'
import { redigir } from './redigir.ts'

// Números de cartão de teste, de formato real (passam no Luhn): 4111 1111 1111 1111,
// 5555 5555 5555 4444 e o Amex 3782 822463 10005.

Deno.test('redigir: cartão vira •••• e os 4 últimos, e o CPF sai', () => {
  const r = redigir('Cartão 5555 5555 5555 4444 CPF 123.456.789-09', [])
  assertStringIncludes(r, '•••• 4444')
  assertFalse(/\d{13,}/.test(r.replace(/[\s.-]/g, '')), r)
  assertFalse(r.includes('123.456.789-09'), r)
  assertFalse(r.includes('5555'), r)
})

Deno.test('redigir: cartão sem separador e CPF/CNPJ sem pontuação', () => {
  const r = redigir('cartao 5555555555554444 cpf 12345678909 cnpj 12.345.678/0001-90', [])
  assertStringIncludes(r, '•••• 4444')
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

// ---- rodada 1 da revisão ----

Deno.test('redigir: cartão com separador repetido (C1)', () => {
  for (const t of ['Cartão 5555  5555  5555  4444', '5555 - 5555 - 5555 - 4444', '4111.1111.1111.1111', '3782 822463 10005']) {
    const r = redigir(t, [])
    assertFalse(/\d{5,}/.test(r.replace(/[\s.-]/g, '')), `${t} => ${r}`)
    assert(r.includes('•••• '), `${t} => ${r}`)
  }
})

Deno.test('redigir: a máscara do cartão não engole o número vizinho (I1)', () => {
  assertEquals(redigir('cartao 5555 5555 5555 4444 42,90', []), 'cartao •••• 4444 42,90')
  assertEquals(redigir('12/10 5555 5555 5555 4444 199,90', []), '12/10 •••• 4444 199,90')
})

Deno.test('redigir: telefone com espaço ou ponto (I2)', () => {
  for (const t of ['11 98765 4321', '(11) 98765 4321', '11 3456 7890', '11.98765.4321', '+55 11 98765-4321', '+55 11 9 8765-4321']) {
    assertEquals(redigir(`tel ${t} ok`, []), 'tel [telefone] ok', t)
  }
})

Deno.test('redigir: a linha do logradouro sai inteira, o dinheiro fica (I3)', () => {
  assertEquals(redigir('moro na Av. Paulista, 1.578 - Bela Vista', []), 'moro na [endereço]')
  assertEquals(redigir('Rua 7 de Setembro, 100', []), '[endereço]')
  assertEquals(redigir('Rua das Flores, 123, apto 45, Jardim Paulista, São Paulo\nmercado 42,90', []), '[endereço]\nmercado 42,90')
  assertEquals(redigir('uber Rua Augusta 500 25,00', []), 'uber [endereço] 25,00')
})

Deno.test('redigir: nome em NFD sai (I4)', () => {
  const r = redigir('pix pra João 50', ['João'])
  assertEquals(r, 'pix pra [nome] 50')
})

Deno.test('redigir: CPF com espaços sai', () => {
  assertEquals(redigir('cpf 123 456 789 09 ok', []), 'cpf [cpf] ok')
})

Deno.test('redigir: item de fatura com AV, RUA ou TV no nome fica inteiro', () => {
  for (const t of [
    '12/10 POSTO AV BRASIL 120,00',
    'tv. samsung 55 polegadas 2.999,00',
    'TV. SAMSUNG 2.999,00',
    '03/10 PADARIA RUA NOVA 18,50',
    '05/10 PRACA DE ALIMENTACAO 1.234,56',
  ]) {
    assertEquals(redigir(t, []), t)
  }
})

Deno.test('redigir: endereço sozinho na linha sai; com dinheiro, só o trecho do endereço', () => {
  assertEquals(redigir('Rua das Flores, 123, apto 45, Jardim Paulista', []), '[endereço]')
  assertEquals(redigir('Av. Paulista, 1.578 - Bela Vista', []), '[endereço]')
  assertEquals(redigir('almoço Av. Paulista, 1.578 - 42,90', []), 'almoço [endereço] - 42,90')
  assertEquals(redigir('Travessa do Ouvidor 12 pão 8,00', []), '[endereço] pão 8,00')
})

// ---- rodada 2 da revisão ----

Deno.test('redigir: o último bloco do cartão não engole o valor nem a data (N1)', () => {
  assertEquals(redigir('12/10 UBER TRIP 4111 1111 1111 1111 23,90', []), '12/10 UBER TRIP •••• 1111 23,90')
  assertEquals(redigir('PAGAMENTO 4111 1111 1111 1111 1.234,56', []), 'PAGAMENTO •••• 1111 1.234,56')
  // Não é cartão (12 dígitos, ou sem Luhn): fica como está, com o valor e a data.
  assertEquals(redigir('12/10 COMPRA 4111 1111 1111 9,90', []), '12/10 COMPRA 4111 1111 1111 9,90')
  assertEquals(redigir('PARC 2026 1012 3456 03/10', []), 'PARC 2026 1012 3456 03/10')
  assertEquals(redigir('12/10 UBER TRIP 1234 5678 9012 23,90', []), '12/10 UBER TRIP 1234 5678 9012 23,90')
})

Deno.test('redigir: CPF e telefone não engolem valor nem data (N2, N3)', () => {
  assertEquals(redigir('12/10 LOJA 123 456 789 10,00', []), '12/10 LOJA 123 456 789 10,00')
  assertEquals(redigir('12/10 1234 5678 42,90', []), '12/10 1234 5678 42,90')
})

Deno.test('redigir: cartão com "/" ou "_" e nos agrupamentos 8-8 e 4-8-4', () => {
  for (const t of ['4111/1111/1111/1111', '4111_1111_1111_1111', '41111111 11111111', '4111 11111111 1111']) {
    assertEquals(redigir(t, []), '•••• 1111', t)
  }
})

Deno.test('redigir: CEP com espaço e telefone sem DDD depois da palavra', () => {
  assertEquals(redigir('CEP 01310 100', []), '[cep]')
  assertEquals(redigir('cel 987654321', []), 'cel [telefone]')
  assertEquals(redigir('12/10 LOJA 1234-5678 42,90', []), '12/10 LOJA 1234-5678 42,90')
})

// ---- rodada 3 da revisão: cartão por varredura e Luhn ----

Deno.test('redigir: cartão colado a "/", "." ou "," é mascarado', () => {
  const casos: Array<[string, string]> = [
    ['cartao/4111111111111111', 'cartao/•••• 1111'],
    ['num.4111111111111111', 'num.•••• 1111'],
    ['1,4111111111111111', '1,•••• 1111'],
    ['4111111111111111/12/28', '•••• 1111/12/28'],
    ['4111111111111111,90', '•••• 1111,90'],
    ['Fulano,4111111111111111,12/28,123', 'Fulano,•••• 1111,12/28,123'],
    ['Fulano,4111 1111 1111 1111,12/28', 'Fulano,•••• 1111,12/28'],
    ['cartao/4111 1111 1111 1111', 'cartao/•••• 1111'],
    ['4111 1111 1111 1111/2026', '•••• 1111/2026'],
    ['3782 822463 10005', '•••• 0005'],
  ]
  for (const [t, esperado] of casos) assertEquals(redigir(t, []), esperado, t)
})

Deno.test('redigir: o valor e a data em volta do cartão ficam', () => {
  assertEquals(redigir('12/10 UBER TRIP 4111 1111 1111 1111 23,90', []), '12/10 UBER TRIP •••• 1111 23,90')
  assertEquals(redigir('12/10 COMPRA 4111 1111 1111 9,90', []), '12/10 COMPRA 4111 1111 1111 9,90')
  assertEquals(redigir('PARC 2026 1012 3456 03/10', []), 'PARC 2026 1012 3456 03/10')
  assertEquals(redigir('12/10 PARC 2026 1012 3456 03/10 42,90', []), '12/10 PARC 2026 1012 3456 03/10 42,90')
})

Deno.test('redigir: CPF e CNPJ depois de "/" e telefone com o 0 da operadora', () => {
  assertEquals(redigir('cpf/123.456.789-09', []), 'cpf/[cpf]')
  assertEquals(redigir('cnpj/12.345.678/0001-90', []), 'cnpj/[cnpj]')
  assertEquals(redigir('tel 011 98765-4321', []), 'tel [telefone]')
  assertEquals(redigir('tel (011) 98765-4321', []), 'tel [telefone]')
  assertEquals(redigir('tel: 021 3456-7890', []), 'tel: [telefone]')
})

// ---- rodada 4 da revisão: CSV com validade partida por vírgula, bloco de 4 antes do cartão, tempo ----

Deno.test('redigir: cartão em CSV com a validade partida por vírgula (r4, Important)', () => {
  const casos: Array<[string, string]> = [
    ['Fulano,4111 1111 1111 1111,12,2028', 'Fulano,•••• 1111,12,2028'],
    ['Fulano,5555 5555 5555 4444,12,28,123', 'Fulano,•••• 4444,12,28,123'],
    ['4111 1111 1111 1111,12,28', '•••• 1111,12,28'],
    ['Fulano,4111 1111 1111 1111,12', 'Fulano,•••• 1111,12'],
    // O ";" já funcionava e continua.
    ['Fulano;4111 1111 1111 1111;12;28', 'Fulano;•••• 1111;12;28'],
    // A cabeça de 4 dígitos de um valor fecha o cartão; a cauda fica.
    ['4111 1111 1111 1111,00', '•••• 1111,00'],
    ['4111.1111.1111.1111,00', '•••• 1111,00'],
  ]
  for (const [t, esperado] of casos) assertEquals(redigir(t, []), esperado, t)
})

Deno.test('redigir: a cabeça de um valor só fecha um cartão de verdade; o valor nunca muda', () => {
  for (const t of [
    '12/10 LOJA 4111 1111 1111 1234,56',
    '12/10 COMPRA 4111 1111 1111 9,90',
    '12/10 1234 5678 42,90',
    '12/10 LOJA 123 456 789 10,00',
    'PAGAMENTO 1234 5678 9012 1.234,56',
  ]) {
    assertEquals(redigir(t, []), t)
  }
  assertEquals(redigir('PAGAMENTO 4111 1111 1111 1111 1.234,56', []), 'PAGAMENTO •••• 1111 1.234,56')
})

Deno.test('redigir: um bloco de 4 antes do cartão não desloca a máscara (r4, Minor)', () => {
  // 2026 5516 6722 4958 também passa no Luhn: a varredura prefere o trecho que termina no fim da sequência.
  assertEquals(redigir('22/10/2026 5516 6722 4958 1937 42,90', []), '22/10/2026 •••• 1937 42,90')
  assertEquals(redigir('22/10/2026 5555 5555 5555 4444 42,90', []), '22/10/2026 •••• 4444 42,90')
  assertEquals(redigir('pedido 8841 4111 1111 1111 1111', []), 'pedido 8841 •••• 1111')
  assertEquals(redigir('4111111111111111 4111111111111111', []), '•••• 1111 •••• 1111')
})

Deno.test('redigir: entrada hostil de 72k termina em menos de 1s (r4, Minor)', () => {
  const N = 72_000
  const hostis: Record<string, string> = {
    corrido: '4'.repeat(N),
    valores: '1,11 '.repeat(N / 5),
    grupos: '1111 '.repeat(N / 5),
    milhares: '1.111'.padEnd(N, '.111'),
    barras: '1/'.repeat(N / 2),
    cartoes: '4111111111111111 '.repeat(N / 17),
    palavra: 'a'.repeat(N),
  }
  for (const [nome, texto] of Object.entries(hostis)) {
    const t0 = performance.now()
    redigir(texto, ['Maria Souza'])
    const ms = performance.now() - t0
    assert(ms < 1000, `${nome}: ${ms.toFixed(0)}ms`)
  }
})
