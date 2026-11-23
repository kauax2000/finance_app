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
