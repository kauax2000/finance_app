import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { interpretarFrase, palavrasDosCartoes, type CartaoParaCasar } from './frase.ts'

const HOJE = '2026-11-23'
const cartao = (name: string): CartaoParaCasar => ({ id: name, name, wallet_alias: null, last_four: null, workspace_id: 'w', is_active: true })
const CARTOES = palavrasDosCartoes([cartao('Nubank'), cartao('Mercado Pago')])
const ler = (s: string) => interpretarFrase(s, HOJE, CARTOES)

Deno.test('fala: o verbo de abertura não vira descrição', () => {
  assertEquals([ler('gastei 200 reais de abastecimento').descricao, ler('gastei 200 reais de abastecimento').valor], ['Abastecimento', 200])
  assertEquals(ler('paguei 80 na farmácia').descricao, 'Farmácia')
  assertEquals(ler('comprei pão 12,50').descricao, 'Pão')
  assertEquals(ler('Dei 30 reais pro flanelinha').descricao, 'Flanelinha')
})

Deno.test('fala: o verbo que nomeia vira a descrição', () => {
  assertEquals(ler('abasteci 150 no posto').descricao, 'Abastecimento no posto')
  assertEquals(ler('almocei 35').descricao, 'Almoço')
})

Deno.test('fala: palavra solta só é cartão se for de um cartão', () => {
  assertEquals(ler('paguei 80 na farmácia').cartaoTexto, null)
  assertEquals(ler('posto ipiranga 180').descricao, 'Posto ipiranga')
  assertEquals(ler('200 abastecimento nubank').cartaoTexto, 'nubank')
  assertEquals(ler('200 abastecimento nubank').descricao, 'Abastecimento')
  // Review Focus 1: "mercado" é de um cartão, e o casamento parcial segue a conferir em quem chama.
  assertEquals(ler('50 compras no mercado').cartaoTexto, 'mercado')
})

Deno.test('fala: só verbo e valor fica com dúvida de descrição', () => {
  const f = ler('gastei 50')
  assertEquals(f.valor, 50)
  assertEquals(f.duvidas.includes('descricao'), true)
})

Deno.test('fala: sem o conjunto de cartões, o comportamento de antes', () => {
  assertEquals(interpretarFrase('paguei 80 na farmácia', HOJE).cartaoTexto, 'farmacia')
})

Deno.test('fala: verbo no plural e artigo do começo saem', () => {
  assertEquals(ler('gastamos 40 no mercado').descricao, 'Mercado')
  assertEquals(ler('pagamos 90 no jantar').descricao, 'Jantar')
  assertEquals(ler('compramos 30 de pão').descricao, 'Pão')
  assertEquals(ler('demos 20 pro flanelinha').descricao, 'Flanelinha')
  assertEquals(ler('um café 8').descricao, 'Café')
  assertEquals(ler('A conta de luz 150').descricao, 'Conta de luz')
  // No meio da frase o artigo fica.
  assertEquals(ler('jantar uma pizza 60').descricao, 'Jantar uma pizza')
})

Deno.test('fala: "no mercado" com um cartão Mercado Pago fica na descrição', () => {
  const f = ler('gastei 50 no mercado')
  assertEquals([f.descricao, f.cartaoTexto], ['Mercado', null])
})

Deno.test('fala: "no nubank" sozinho segue sendo o cartão (não é um gasto comum)', () => {
  assertEquals(ler('estorno de 50 no nubank').cartaoTexto, 'nubank')
  assertEquals(ler('50 no nubank').cartaoTexto, 'nubank')
})
