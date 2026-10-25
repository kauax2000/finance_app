import { assert, assertEquals } from 'jsr:@std/assert@1.0.19'
import { PALAVRAS_PROIBIDAS, textoDoInsight } from './textos.ts'

/** Um payload de exemplo por `kind` do check de `insights.kind` (Tarefa 1). */
const EXEMPLOS: Record<string, Record<string, unknown>> = {
  fatura_fechou: {
    cardId: 'card-1',
    cardNome: 'Nubank',
    total: 1125,
    contraMedia: 12.5,
    contraAnterior: -3,
    categorias: ['Mercado', 'Casa', 'Saúde'],
    parcelasNovas: ['Geladeira 1/10'],
    parcelasAcabaram: ['TV'],
    estornos: 40,
    diferencaBanco: -5,
  },
  relatorio_mes: { mes: '2026-09', lancados: 12, diferencas: 1, avisos: 3 },
  recorrencia: { nome: 'Netflix', destino: 'assinatura' },
  gasto_atipico: { alvo: 'categoria', nome: 'Mercado', mes: 601, media3: 300, categoriaId: 'cat-mercado' },
  preco_assinatura: { assinaturaId: 'sub-spot', nome: 'Spotify', de: 21.9, para: 23.9 },
  duplicidade: { descricao: 'Padaria Real', valor: 57.3, dataYmd: '2026-10-20' },
  parcelas_acabando: { descricao: 'TV', mesFim: '2027-03', liberaPorMes: 250 },
  seguro_baixo: { seguro: 180 },
  sazonal: { termo: 'ipva', mesAnterior: '2026-01', valor: 1000 },
  a_conferir: { n: 7 },
  limite_pessoa: { para: 'pessoa', nivel: 80, gasto: 400, limite: 500, ym: '2026-10', pessoaId: 'ana' },
}

Deno.test('anti-sermão: nenhum modelo tem palavra proibida nem "!"', () => {
  assertEquals(Object.keys(EXEMPLOS).length, 11)
  assertEquals([...PALAVRAS_PROIBIDAS], ['culpado', 'irresponsável', 'deveria', 'cuidado'])
  const variantes = [
    ...Object.entries(EXEMPLOS),
    ['recorrencia', { nome: 'Luz', destino: 'conta' }],
    ['gasto_atipico', { alvo: 'descricao', nome: 'Uber', mes: 81, media3: 40 }],
    ['limite_pessoa', { para: 'dono', nome: 'Ana', nivel: 100, gasto: 520, limite: 500 }],
  ] as Array<[string, Record<string, unknown>]>
  for (const [kind, payload] of variantes) {
    const t = textoDoInsight(kind, payload)
    const tudo = `${t.titulo} ${t.corpo} ${t.acao?.rotulo ?? ''}`.toLowerCase()
    for (const p of PALAVRAS_PROIBIDAS) assert(!tudo.includes(p), `${kind}: "${p}"`)
    assert(!tudo.includes('!'), `${kind}: "!"`)
    assert(t.titulo.length > 0, `${kind}: título vazio`)
  }
})

Deno.test('fatura_fechou: "↑ 12,5%" e "↓ 3,0%", 3 categorias e os extras', () => {
  const t = textoDoInsight('fatura_fechou', EXEMPLOS.fatura_fechou)
  assertEquals(t.titulo, 'Fatura do Nubank fechou: R$ 1.125,00')
  assertEquals(
    t.corpo,
    '↑ 12,5% contra a média e ↓ 3,0% contra o mês anterior. Pesaram mais Mercado, Casa e Saúde. ' +
      'Parcelas novas: Geladeira 1/10. Acabaram: TV. Estornos: R$ 40,00. Diferença para o banco: −R$ 5,00.',
  )
  assertEquals(t.acao, { rotulo: 'Ver fatura', href: '/credit-cards/card-1' })
})

Deno.test('fatura_fechou: sem histórico e sem extras, só o que existe', () => {
  const t = textoDoInsight('fatura_fechou', {
    cardId: 'c',
    cardNome: 'Inter',
    total: 300,
    contraMedia: null,
    contraAnterior: null,
    categorias: ['Mercado'],
    parcelasNovas: [],
    parcelasAcabaram: [],
    estornos: 0,
    diferencaBanco: null,
  })
  assertEquals(t.corpo, 'Pesaram mais Mercado.')
})

Deno.test('relatorio_mes, a_conferir e seguro_baixo', () => {
  const r = textoDoInsight('relatorio_mes', EXEMPLOS.relatorio_mes)
  assertEquals(r.titulo, 'Seu mês de setembro')
  assertEquals(r.corpo, 'O app lançou 12 sozinho, a conferência achou 1 diferença e 3 avisos chegaram antes do vencimento.')
  assertEquals(r.acao, { rotulo: 'Ver mês', href: '/previsao' })
  const c = textoDoInsight('a_conferir', EXEMPLOS.a_conferir)
  assertEquals(c.titulo, '7 lançamentos para conferir')
  assertEquals(c.acao, { rotulo: 'Conferir agora', href: '/transactions?conferir=1' })
  const s = textoDoInsight('seguro_baixo', EXEMPLOS.seguro_baixo)
  assertEquals(s.corpo, 'O seguro para gastar está em R$ 180,00, abaixo de 10% da renda do mês.')
  assertEquals(s.acao, { rotulo: 'Ver o que pesa', href: '/previsao' })
})

Deno.test('recorrencia: assinatura ou conta a pagar', () => {
  const a = textoDoInsight('recorrencia', EXEMPLOS.recorrencia)
  assertEquals([a.titulo, a.corpo, a.acao?.rotulo], ['Netflix todo mês', 'Virar assinatura?', 'Criar'])
  assertEquals(a.acao?.href, '/subscriptions?new=1')
  const c = textoDoInsight('recorrencia', { nome: 'Luz', destino: 'conta' })
  assertEquals([c.corpo, c.acao?.href], ['Virar conta a pagar?', '/bills?new=1'])
})

Deno.test('gasto_atipico: filtro de categoria ou busca pela descrição', () => {
  const cat = textoDoInsight('gasto_atipico', EXEMPLOS.gasto_atipico)
  assertEquals(cat.titulo, 'Mercado acima do comum')
  assertEquals(cat.corpo, 'Este mês: R$ 601,00. A média dos 3 anteriores: R$ 300,00.')
  assertEquals(cat.acao, { rotulo: 'Ver lançamentos', href: '/transactions?cats=cat-mercado' })
  const desc = textoDoInsight('gasto_atipico', { alvo: 'descricao', nome: 'Padaria Real', mes: 81, media3: 40 })
  assertEquals(desc.acao?.href, '/transactions?q=Padaria+Real')
  const acento = textoDoInsight('gasto_atipico', { alvo: 'descricao', nome: 'Conta de Água', mes: 200, media3: 90 })
  assertEquals(acento.titulo, 'Conta de Água acima do comum')
  assertEquals(acento.acao?.href, '/transactions?q=Conta+de+%C3%81gua')
  assertEquals(new URLSearchParams(acento.acao!.href.split('?')[1]).get('q'), 'Conta de Água')
})

Deno.test('preco_assinatura, duplicidade, parcelas_acabando e sazonal', () => {
  const p = textoDoInsight('preco_assinatura', EXEMPLOS.preco_assinatura)
  assertEquals([p.titulo, p.corpo, p.acao?.rotulo], ['Spotify mudou de preço', 'De R$ 21,90 para R$ 23,90.', 'Atualizar valor'])
  const d = textoDoInsight('duplicidade', EXEMPLOS.duplicidade)
  assertEquals([d.titulo, d.corpo, d.acao?.rotulo], ['Possível lançamento repetido', 'Padaria Real · R$ 57,30 em 20/10, duas vezes.', 'Apagar um'])
  assertEquals(d.acao?.href, '/transactions?q=Padaria+Real&from=2026-10-20&to=2026-10-20')
  const f = textoDoInsight('parcelas_acabando', EXEMPLOS.parcelas_acabando)
  assertEquals([f.titulo, f.corpo, f.acao?.href], ['Em março acaba TV', 'Sobram R$ 250,00 por mês.', '/previsao'])
  const z = textoDoInsight('sazonal', EXEMPLOS.sazonal)
  assertEquals([z.titulo, z.corpo], ['IPVA chega no começo do ano', 'No ano passado foi R$ 1.000,00 em janeiro.'])
  assertEquals(z.acao, { rotulo: 'Criar conta a pagar', href: '/bills?new=1' })
})

Deno.test('limite_pessoa: a frase da pessoa e a do dono, e o destino de cada uma', () => {
  const p = textoDoInsight('limite_pessoa', EXEMPLOS.limite_pessoa)
  assertEquals(p.corpo.replaceAll('\u00a0', ' '), 'Você chegou a 80% do seu limite do mês (R$ 400,00 de R$ 500,00).')
  assertEquals(p.acao, { rotulo: 'Ver limite', href: '/dashboard' })
  const d = textoDoInsight('limite_pessoa', { para: 'dono', nome: 'Ana', nivel: 100, gasto: 520, limite: 500 })
  assertEquals(d.corpo.replaceAll('\u00a0', ' '), 'Ana chegou a 100% do limite do mês (R$ 520,00 de R$ 500,00).')
  assertEquals(d.acao, { rotulo: 'Ver limite', href: '/members#limites' })
})

Deno.test('kind desconhecido: "Entendi" (ação nula)', () => {
  assertEquals(textoDoInsight('outro', {}).acao, null)
})
