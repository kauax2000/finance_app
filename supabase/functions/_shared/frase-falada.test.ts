import { assertEquals } from 'jsr:@std/assert@1.0.19'
import {
  interpretarFrase,
  palavrasDosCartoes,
  escolherCategoria,
  normalizarDescricao,
  separarCategoriaDita,
  type CartaoParaCasar,
  type CategoriaParaCasar,
  type LinhaHistorico,
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
/** As da revisão: lugares e donos que também são categoria. */
const LUGARES: CategoriaParaCasar[] = ['Casa', 'Transporte', 'Trabalho', 'Mercado', 'Saúde', 'Água', 'Pet', 'Filhos'].map((name) => ({
  id: normalizarDescricao(name),
  name,
  type: 'expense' as const,
}))
const SO_NUBANK = palavrasDosCartoes([cartao('Nubank')])
/** A frase pelo parser e, na descrição dele, a categoria dita. */
const dita = (s: string, cats = DITAS) => {
  const f = interpretarFrase(s, HOJE, SO_NUBANK)
  return separarCategoriaDita(f.descricao, f.tipo, cats)
}
/** A frase pelo parser e a escolha da categoria (a regra do app e da Edge). */
const escolha = (s: string, historico: LinhaHistorico[] = [], cats = LUGARES) => {
  const f = interpretarFrase(s, HOJE, SO_NUBANK)
  const e = escolherCategoria(f.descricao, f.tipo, cats, historico, HOJE)
  return [e.descricao, e.categoria?.categoryId ?? null, e.categoria?.motivo ?? null, e.aConferir]
}
const linhaDe = (description: string, category_id: string): LinhaHistorico => ({
  description,
  category_id,
  payment_method: 'pix',
  payment_credit_card_id: null,
  date: '2026-11-01T12:00:00.000Z',
  type: 'expense',
})

Deno.test('dita: a tabela do pedido', () => {
  const casos: [string, string, string, boolean][] = [
    ['42 mercado', 'Mercado', 'mercado', true],
    ['42 mercado mercado', 'Mercado', 'mercado', true],
    ['pão mercado 12', 'Pão', 'mercado', true],
    // Depois de um conectivo, a dita é fraca.
    ['12 pão no mercado', 'Pão', 'mercado', false],
    ['pão 12 categoria mercado', 'Pão', 'mercado', true],
    ['remédio farmácia 30', 'Remédio', 'farmacia', true],
    ['uber transporte 20', 'Uber', 'transporte', true],
    ['arroz e feijão mercado 50 nubank', 'Arroz e feijão', 'mercado', true],
    ['30 mercados', 'Mercados', 'mercado', true],
    ['recebi 3000 salário', 'Salário', 'salario', true],
  ]
  for (const [frase, descricao, categoryId, forte] of casos) {
    assertEquals([frase, dita(frase)], [frase, { descricao, categoryId, forte }])
  }
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
  assertEquals(separarCategoriaDita('Pão mercado', 'expense', duas), { descricao: 'Pão', categoryId: 'mercado', forte: true })
  assertEquals(separarCategoriaDita('Pão bairro', 'expense', duas), { descricao: 'Pão', categoryId: 'bairro', forte: true })
  assertEquals(separarCategoriaDita('Pão do mercado do bairro', 'expense', duas), {
    descricao: 'Pão do mercado do bairro',
    categoryId: 'bairro',
    forte: false,
  })
  const ambiguas: CategoriaParaCasar[] = [
    { id: 'm1', name: 'Mercado do bairro', type: 'expense' },
    { id: 'm2', name: 'Mercado central', type: 'expense' },
  ]
  assertEquals(separarCategoriaDita('Pão mercado', 'expense', ambiguas), null)
})

Deno.test('dita: sobrando só palavras vazias, a descrição fica inteira', () => {
  const comLuz = [...DITAS, { id: 'luz', name: 'Luz', type: 'expense' as const }]
  assertEquals(dita('conta de luz 150', comLuz), { descricao: 'Conta de luz', categoryId: 'luz', forte: false })
  assertEquals(dita('compra no mercado 30'), { descricao: 'Compra no mercado', categoryId: 'mercado', forte: false })
  assertEquals(dita('compra mercado 30'), { descricao: 'Compra mercado', categoryId: 'mercado', forte: true })
})

Deno.test('dita: o marcador "categoria" casa em qualquer lugar', () => {
  assertEquals(separarCategoriaDita('Categoria mercado pão', 'expense', DITAS), { descricao: 'Pão', categoryId: 'mercado', forte: true })
  assertEquals(separarCategoriaDita('Pão categoria xyz', 'expense', DITAS), null)
})

Deno.test('dita: os conectivos e artigos soltos saem com a categoria', () => {
  assertEquals(dita('uber para casa 25', LUGARES), { descricao: 'Uber', categoryId: 'casa', forte: false })
  assertEquals(dita('uber até casa 25', LUGARES), { descricao: 'Uber', categoryId: 'casa', forte: false })
  assertEquals(dita('brinquedo para o pet 40', LUGARES), { descricao: 'Brinquedo', categoryId: 'pet', forte: false })
  // Depois de "de"/"do"/"da"/"dos"/"das" a categoria compõe o nome: a descrição fica inteira.
  assertEquals(dita('escola dos filhos 500', LUGARES), { descricao: 'Escola dos filhos', categoryId: 'filhos', forte: false })
  assertEquals(dita('plano de saúde 300', LUGARES), { descricao: 'Plano de saúde', categoryId: 'saude', forte: false })
  assertEquals(dita('garrafa de água 5', LUGARES), { descricao: 'Garrafa de água', categoryId: 'agua', forte: false })
})

Deno.test('dita: a fraca pergunta antes ao que a pessoa já lançou', () => {
  const uber = [linhaDe('Uber', 'transporte'), linhaDe('Uber', 'transporte'), linhaDe('Uber', 'transporte')]
  assertEquals(escolha('uber pra casa 25', uber), ['Uber pra casa', 'transporte', 'historico', false])
  assertEquals(escolha('uber para casa 25', uber), ['Uber para casa', 'transporte', 'historico', false])
  // O voto aprendido também vence ("Uber centro" ensina Transporte pela palavra).
  const aprendido = [linhaDe('Uber centro', 'transporte'), linhaDe('Uber aeroporto', 'transporte')]
  assertEquals(escolha('uber pra casa 25', aprendido), ['Uber pra casa', 'transporte', 'aprendido', false])
  // Sem histórico, vale a dita, a conferir.
  assertEquals(escolha('uber pra casa 25'), ['Uber', 'casa', 'dita', true])
  assertEquals(escolha('12 pão no mercado'), ['Pão', 'mercado', 'dita', true])
  assertEquals(escolha('plano de saúde 300'), ['Plano de saúde', 'saude', 'dita', true])
  // O histórico que concorda com a dita a torna limpa: pela descrição sem a categoria...
  assertEquals(escolha('uber pra casa 25', [linhaDe('Uber', 'casa')]), ['Uber', 'casa', 'dita', false])
  assertEquals(escolha('lanche em casa 20', [linhaDe('Lanche', 'casa')]), ['Lanche', 'casa', 'dita', false])
  // ...ou pela que fica inteira ("conta de luz").
  const comLuz = [...LUGARES, { id: 'luz', name: 'Luz', type: 'expense' as const }]
  assertEquals(escolha('conta de luz 150', [linhaDe('Conta de luz', 'luz')], comLuz), ['Conta de luz', 'luz', 'dita', false])
  assertEquals(escolha('plano de saúde 300', [linhaDe('Plano de saúde', 'saude')]), ['Plano de saúde', 'saude', 'dita', false])
  // Sem histórico, segue a conferir.
  assertEquals(escolha('conta de luz 150', [], comLuz), ['Conta de luz', 'luz', 'dita', true])
  assertEquals(escolha('lanche em casa 20'), ['Lanche', 'casa', 'dita', true])
  // A forte vence o histórico.
  assertEquals(escolha('pão mercado 12', [linhaDe('Pão', 'casa')]), ['Pão', 'mercado', 'dita', false])
})
