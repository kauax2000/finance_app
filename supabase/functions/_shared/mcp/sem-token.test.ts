import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1.0.19'

Deno.test('mcp: sem token responde 401 com o resource_metadata', async () => {
  Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321')
  const { handler } = await import('../../mcp/index.ts')
  const res = await handler(
    new Request('http://127.0.0.1:54321/functions/v1/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'teste', version: '0' } },
      }),
    }),
  )
  await res.body?.cancel()
  assertEquals(res.status, 401)
  assertStringIncludes(res.headers.get('www-authenticate') ?? '', 'resource_metadata=')
})

Deno.test('mcp: as nove ferramentas, só registrar_lancamento grava', async () => {
  Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321')
  const { createMcpHandler } = await import('npm:@modelcontextprotocol/server@^2.0.0')
  const { servidor } = await import('../../mcp/index.ts')
  // tools/list não toca o banco: o contexto falso basta.
  const ctx = { userClaims: { id: 'u' }, jwtClaims: { sub: 'u' } } as unknown as Parameters<typeof servidor>[0]
  const pedir = (body: unknown) =>
    createMcpHandler(() => servidor(ctx)).fetch(
      new Request('http://x/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'mcp-protocol-version': '2025-06-18',
        },
        body: JSON.stringify(body),
      }),
    )
  const res = await pedir({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
  const texto = await res.text()
  const json = JSON.parse(texto.includes('data:') ? texto.split('data:')[1].trim().split('\n')[0] : texto)
  const tools = json.result.tools as { name: string; annotations: { readOnlyHint: boolean } }[]
  assertEquals(tools.map((t) => t.name).sort(), [
    'assinaturas', 'contas_a_pagar', 'faturas_dos_cartoes', 'listar_carteiras', 'listar_categorias',
    'listar_lancamentos', 'orcamentos_do_mes', 'registrar_lancamento', 'resumo_do_mes',
  ])
  assertEquals(tools.filter((t) => !t.annotations.readOnlyHint).map((t) => t.name), ['registrar_lancamento'])
})
