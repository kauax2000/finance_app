import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { currencyBRL } from '../formatters.ts'
import { dinheiro, escolherCarteira, falha, mensagemDoErroDoBanco, ok } from './resposta.ts'

Deno.test('mcp: dinheiro em reais e texto', () => {
  assertEquals(dinheiro(76950), { valor: 769.5, texto: currencyBRL(769.5) })
})

Deno.test('mcp: ok e falha', () => {
  const r = ok({ a: 1 })
  assertEquals(r.structuredContent, { a: 1 })
  assertEquals(r.content[0].text, '{"a":1}')
  assertEquals(falha('x').isError, true)
})

Deno.test('mcp: mensagem do erro do banco', () => {
  assertEquals(
    mensagemDoErroDoBanco({ message: 'workspace_somente_leitura' }),
    'Sua carteira está só leitura no plano atual. Para registrar, a pessoa titular precisa reativar o plano no app.',
  )
  assertEquals(mensagemDoErroDoBanco({ code: '42501' }), 'Você não tem permissão para isso nessa carteira.')
  assertEquals(mensagemDoErroDoBanco({}), 'Não foi possível concluir. Tente de novo.')
})

Deno.test('mcp: escolher carteira', () => {
  const cs = [
    { id: 'b', name: 'Casa', type: 'shared' as const },
    { id: 'a', name: 'Eu', type: 'personal' as const },
  ]
  assertEquals(escolherCarteira(cs), { carteira: cs[1] })
  assertEquals(escolherCarteira([cs[0], { id: 'c', name: 'Ana', type: 'shared' }]), {
    carteira: { id: 'c', name: 'Ana', type: 'shared' },
  })
  assertEquals(escolherCarteira(cs, 'b'), { carteira: cs[0] })
  assertEquals(escolherCarteira(cs, 'zzz'), {
    erro: 'Carteira não encontrada. Use listar_carteiras para ver os ids.',
  })
  assertEquals(escolherCarteira([]), { erro: 'Você ainda não participa de nenhuma carteira.' })
})
