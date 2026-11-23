import { assertEquals } from 'jsr:@std/assert@1.0.19'
import {
  interpretarFrase,
  palavrasDosCartoes,
  separarCategoriaDita,
  type CartaoParaCasar,
  type CategoriaParaCasar,
} from './frase.ts'

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

// --- A categoria dita na frase sai da descrição ------------------------------

const DITAS: CategoriaParaCasar[] = [
  { id: 'mercado', name: 'Mercado', type: 'expense' },
  { id: 'alimentacao', name: 'Alimentação', type: 'expense' },
  { id: 'transporte', name: 'Transporte', type: 'expense' },
  { id: 'farmacia', name: 'Farmácia', type: 'expense' },
  { id: 'salario', name: 'Salário', type: 'income' },
]
const SO_NUBANK = palavrasDosCartoes([cartao('Nubank')])
/** A frase pelo parser e, na descrição dele, a categoria dita. */
const dita = (s: string, cats = DITAS) => {
  const f = interpretarFrase(s, HOJE, SO_NUBANK)
  return separarCategoriaDita(f.descricao, f.tipo, cats)
}

Deno.test('dita: a tabela do pedido', () => {
  const casos: [string, string, string][] = [
    ['42 mercado', 'Mercado', 'mercado'],
    ['42 mercado mercado', 'Mercado', 'mercado'],
    ['pão mercado 12', 'Pão', 'mercado'],
    ['12 pão no mercado', 'Pão', 'mercado'],
    ['pão 12 categoria mercado', 'Pão', 'mercado'],
    ['remédio farmácia 30', 'Remédio', 'farmacia'],
    ['uber transporte 20', 'Uber', 'transporte'],
    ['arroz e feijão mercado 50 nubank', 'Arroz e feijão', 'mercado'],
    ['30 mercados', 'Mercados', 'mercado'],
    ['recebi 3000 salário', 'Salário', 'salario'],
  ]
  for (const [frase, descricao, categoryId] of casos) assertEquals([frase, dita(frase)], [frase, { descricao, categoryId }])
})

Deno.test('dita: no começo é nome de loja, não categoria', () => {
  assertEquals(dita('Mercado Livre 80'), null)
  assertEquals(dita('Farmácia São João 30'), null)
})

Deno.test('dita: só as categorias do tipo, e a palavra ambígua não decide', () => {
  // "salário" numa despesa não é a categoria de receita.
  assertEquals(separarCategoriaDita('Adiantamento salário', 'expense', DITAS), null)
  const duas: CategoriaParaCasar[] = [
    { id: 'mercado', name: 'Mercado', type: 'expense' },
    { id: 'bairro', name: 'Mercado do bairro', type: 'expense' },
  ]
  // O nome inteiro "Mercado" casa uma só: vence a palavra, que casaria as duas.
  assertEquals(separarCategoriaDita('Pão mercado', 'expense', duas), { descricao: 'Pão', categoryId: 'mercado' })
  assertEquals(separarCategoriaDita('Pão bairro', 'expense', duas), { descricao: 'Pão', categoryId: 'bairro' })
  assertEquals(separarCategoriaDita('Pão do mercado do bairro', 'expense', duas), { descricao: 'Pão', categoryId: 'bairro' })
  const ambiguas: CategoriaParaCasar[] = [
    { id: 'm1', name: 'Mercado do bairro', type: 'expense' },
    { id: 'm2', name: 'Mercado central', type: 'expense' },
  ]
  assertEquals(separarCategoriaDita('Pão mercado', 'expense', ambiguas), null)
})

Deno.test('dita: sobrando só palavras vazias, a descrição fica inteira', () => {
  const comLuz = [...DITAS, { id: 'luz', name: 'Luz', type: 'expense' as const }]
  assertEquals(dita('conta de luz 150', comLuz), { descricao: 'Conta de luz', categoryId: 'luz' })
  assertEquals(dita('compra no mercado 30'), { descricao: 'Compra no mercado', categoryId: 'mercado' })
  assertEquals(dita('pão mercado 12'), { descricao: 'Pão', categoryId: 'mercado' })
})

Deno.test('dita: o marcador "categoria" casa em qualquer lugar', () => {
  assertEquals(separarCategoriaDita('Categoria mercado pão', 'expense', DITAS), { descricao: 'Pão', categoryId: 'mercado' })
  assertEquals(separarCategoriaDita('Pão categoria xyz', 'expense', DITAS), null)
})
