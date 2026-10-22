import { assert, assertEquals, assertFalse } from 'jsr:@std/assert@1.0.19'
import { FATIA_FATURA } from './ia-config.ts'
import {
  type ContextoIA,
  interpretar,
  lerFatura,
  lerImagem,
  validarCampos,
  validarItensFatura,
} from './ia.ts'

const HOJE = '2026-10-22'
const CHAVES = { GROQ_API_KEY: 'g-teste', CLOUDFLARE_ACCOUNT_ID: 'conta-teste', CLOUDFLARE_API_TOKEN: 'cf-teste' }

type Pedido = { url: string; body: string }
type Responder = (url: string, init: RequestInit) => Response | Promise<Response>

/** Troca o `fetch` e as chaves pelo tempo do teste, e devolve os dois no `finally`. */
async function comFetch(
  responder: Responder,
  corpo: (pedidos: Pedido[]) => Promise<void>,
  chaves: Partial<typeof CHAVES> = CHAVES,
) {
  const original = globalThis.fetch
  const pedidos: Pedido[] = []
  globalThis.fetch = ((input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input)
    pedidos.push({ url, body: String(init.body ?? '') })
    return Promise.resolve(responder(url, init))
  }) as typeof fetch
  for (const [k, v] of Object.entries(chaves)) Deno.env.set(k, v)
  try {
    await corpo(pedidos)
  } finally {
    globalThis.fetch = original
    for (const k of Object.keys(CHAVES)) Deno.env.delete(k)
  }
}

const resposta = (conteudo: unknown) =>
  new Response(JSON.stringify({ choices: [{ message: { content: typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo) } }] }), {
    status: 200,
  })

const CAMPOS = { valor: 42.9, data: '2026-10-21', descricao: 'Mercado', tipo: 'expense', parcelas: null, forma: 'pix', cartao: null }

function adminFalso(op: { cota?: boolean; cache?: Record<string, unknown> } = {}) {
  const rpcs: Array<{ fn: string; args?: Record<string, unknown> }> = []
  const upserts: Array<Record<string, unknown>> = []
  const admin = {
    rpc(fn: string, args?: Record<string, unknown>) {
      rpcs.push({ fn, args })
      return Promise.resolve({ data: fn === 'consumir_cota_ia' ? (op.cota ?? true) : null, error: null })
    },
    from() {
      let chave = ''
      const q = {
        select: () => q,
        eq: (_c: string, v: string) => {
          chave = v
          return q
        },
        maybeSingle: () => {
          const resultado = op.cache?.[chave]
          return Promise.resolve({ data: resultado ? { resultado } : null, error: null })
        },
        upsert: (row: Record<string, unknown>) => {
          upserts.push(row)
          return Promise.resolve({ error: null })
        },
      }
      return q
    },
  }
  const ctx: ContextoIA = { admin, userId: 'u1', hoje: HOJE, nomes: ['Maria Souza'] }
  return { ctx, rpcs, upserts, eventos: () => rpcs.filter((r) => r.fn === 'registrar_evento_ia') }
}

// ---- validarCampos ----

Deno.test('validarCampos: valor negativo ou zero descarta a resposta', () => {
  assertEquals(validarCampos({ ...CAMPOS, valor: -5 }, HOJE), null)
  assertEquals(validarCampos({ ...CAMPOS, valor: 0 }, HOJE), null)
  assertEquals(validarCampos({ ...CAMPOS, valor: 1_000_001 }, HOJE), null)
})

Deno.test('validarCampos: "1.234,56" vira 1234.56', () => {
  assertEquals(validarCampos({ ...CAMPOS, valor: '1.234,56' }, HOJE)?.valor, 1234.56)
  assertEquals(validarCampos({ ...CAMPOS, valor: 'R$ 42,90' }, HOJE)?.valor, 42.9)
})

Deno.test('validarCampos: data futura vira nula, data impossível descarta', () => {
  assertEquals(validarCampos({ ...CAMPOS, data: '2099-01-01' }, HOJE)?.data, null)
  assertEquals(validarCampos({ ...CAMPOS, data: '2026-10-23' }, HOJE)?.data, '2026-10-23')
  assertEquals(validarCampos({ ...CAMPOS, data: '2026-02-30' }, HOJE), null)
})

Deno.test('validarCampos: JSON em cercas é aceito', () => {
  const r = validarCampos('```json\n' + JSON.stringify(CAMPOS) + '\n```', HOJE)
  assertEquals(r?.valor, 42.9)
  assertEquals(r?.descricao, 'Mercado')
})

Deno.test('validarCampos: parcelas, forma, descrição e o par vazio', () => {
  assertEquals(validarCampos({ ...CAMPOS, parcelas: 1 }, HOJE)?.parcelas, null)
  assertEquals(validarCampos({ ...CAMPOS, parcelas: 49 }, HOJE)?.parcelas, null)
  assertEquals(validarCampos({ ...CAMPOS, parcelas: 2.5 }, HOJE)?.parcelas, null)
  assertEquals(validarCampos({ ...CAMPOS, parcelas: 3 }, HOJE)?.parcelas, 3)
  assertEquals(validarCampos({ ...CAMPOS, forma: 'Crédito' }, HOJE)?.forma, 'credit_card')
  assertEquals(validarCampos({ ...CAMPOS, forma: 'boleto' }, HOJE)?.forma, null)
  assertEquals(validarCampos({ ...CAMPOS, descricao: '  ' + 'x'.repeat(200) }, HOJE)?.descricao?.length, 120)
  assertEquals(validarCampos({ ...CAMPOS, valor: null, descricao: ' ' }, HOJE), null)
  assertEquals(validarCampos('não é json', HOJE), null)
})

// ---- validarItensFatura ----

Deno.test('validarItensFatura: descarta item ruim e devolve null sem itens', () => {
  const r = validarItensFatura({
    itens: [
      { data: '2026-10-01', descricao: 'Loja', valor: '199,90', estorno: false, parcela: { k: 3, n: 10 } },
      { data: '2026-13-01', descricao: 'Data ruim', valor: 10, estorno: false, parcela: null },
      { data: '2026-10-02', descricao: 'Zero', valor: 0, estorno: false, parcela: null },
      { data: '2026-10-03', descricao: 'Parcela ruim', valor: 5, estorno: true, parcela: { k: 4, n: 3 } },
    ],
  })
  assertEquals(r, [
    { data: '2026-10-01', descricao: 'Loja', valor: 199.9, estorno: false, parcela: { k: 3, n: 10 } },
    { data: '2026-10-03', descricao: 'Parcela ruim', valor: 5, estorno: true, parcela: null },
  ])
  assertEquals(validarItensFatura({ itens: [{ data: 'x', descricao: 'y', valor: -1 }] }), null)
  assertEquals(validarItensFatura({ nada: [] }), null)
})

// ---- interpretar ----

Deno.test('interpretar: Groq 429 e Cloudflare ok dão cloudflare, com 2 eventos', async () => {
  const f = adminFalso()
  await comFetch(
    (url) => (url.includes('groq') ? new Response('limite', { status: 429 }) : resposta(CAMPOS)),
    async (pedidos) => {
      const r = await interpretar(f.ctx, 'mercado 42,90')
      assert(r.ok)
      assertEquals(r.provedor, 'cloudflare')
      assertEquals(r.modelo, '@cf/qwen/qwen3-30b-a3b-fp8')
      assertFalse(r.doCache)
      assertEquals(r.dados.valor, 42.9)
      assertEquals(pedidos.length, 2)
      assert(pedidos[1].url.includes('/accounts/conta-teste/ai/v1/chat/completions'))
      assertEquals(f.eventos().map((e) => e.args?.p_status), ['429', 'ok'])
      assertEquals(f.upserts.length, 1)
    },
  )
})

Deno.test('interpretar: os dois falhando dão sem_ia', async () => {
  const f = adminFalso()
  await comFetch(
    (url) => (url.includes('groq') ? new Response('x', { status: 500 }) : resposta('isso não é json')),
    async () => {
      const r = await interpretar(f.ctx, 'mercado 42,90')
      assertEquals(r, { ok: false, motivo: 'sem_ia' })
      assertEquals(f.eventos().map((e) => e.args?.p_status), ['5xx', 'invalido'])
      assertEquals(f.upserts.length, 0)
    },
  )
})

Deno.test('interpretar: cache não chama fetch nem a cota', async () => {
  const f0 = adminFalso()
  // A chave é a do texto redigido: descobre-a por um pedido que grava.
  await comFetch(() => resposta(CAMPOS), async () => {
    await interpretar(f0.ctx, 'mercado 42,90')
  })
  const chave = String(f0.upserts[0].chave)
  const f = adminFalso({ cache: { [chave]: { dados: CAMPOS, provedor: 'groq', modelo: 'openai/gpt-oss-20b' } } })
  await comFetch(() => {
    throw new Error('não devia chamar')
  }, async (pedidos) => {
    const r = await interpretar(f.ctx, 'mercado 42,90')
    assert(r.ok)
    assert(r.doCache)
    assertEquals(r.provedor, 'groq')
    assertEquals(pedidos.length, 0)
    assertEquals(f.rpcs.length, 0)
  })
})

Deno.test('interpretar: cota esgotada não chama o fetch', async () => {
  const f = adminFalso({ cota: false })
  await comFetch(() => resposta(CAMPOS), async (pedidos) => {
    assertEquals(await interpretar(f.ctx, 'mercado 42,90'), { ok: false, motivo: 'cota' })
    assertEquals(pedidos.length, 0)
    assertEquals(f.rpcs[0].args, { p_user_id: 'u1', p_dia: HOJE, p_limite: 30 })
  })
})

Deno.test('interpretar: sem chave nenhuma dá sem_chave sem gastar cota', async () => {
  const f = adminFalso()
  await comFetch(() => resposta(CAMPOS), async (pedidos) => {
    assertEquals(await interpretar(f.ctx, 'mercado 42,90'), { ok: false, motivo: 'sem_chave' })
    assertEquals(pedidos.length, 0)
    assertEquals(f.rpcs.length, 0)
  }, {})
})

Deno.test('interpretar: sem a chave da Groq vai direto à Cloudflare', async () => {
  const f = adminFalso()
  const soCf = { CLOUDFLARE_ACCOUNT_ID: CHAVES.CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN: CHAVES.CLOUDFLARE_API_TOKEN }
  await comFetch(() => resposta(CAMPOS), async (pedidos) => {
    const r = await interpretar(f.ctx, 'mercado 42,90')
    assert(r.ok)
    assertEquals(r.provedor, 'cloudflare')
    assertEquals(pedidos.length, 1)
  }, soCf)
})

Deno.test('interpretar: o corpo enviado não leva cartão, CPF nem nome', async () => {
  const f = adminFalso()
  await comFetch(() => resposta(CAMPOS), async (pedidos) => {
    await interpretar(f.ctx, 'uber Maria Souza 5502 0912 3456 7890 cpf 123.456.789-09 42,90')
    const corpo = pedidos[0].body
    assertFalse(corpo.includes('5502'), corpo)
    assertFalse(corpo.includes('123.456.789-09'), corpo)
    assertFalse(corpo.includes('Souza'), corpo)
    const json = JSON.parse(corpo)
    assertEquals(json.model, 'openai/gpt-oss-20b')
    assertEquals(json.response_format, { type: 'json_object' })
    assertEquals(json.temperature, 0)
    assertEquals(json.max_tokens, 400)
  })
})

Deno.test('interpretar: um provedor que não responde vence o prazo e passa ao próximo', async () => {
  const f = adminFalso()
  f.ctx.prazoMs = 20
  await comFetch(
    (url, init) =>
      url.includes('groq')
        ? new Promise<Response>((_, rej) => init.signal?.addEventListener('abort', () => rej(init.signal?.reason)))
        : resposta(CAMPOS),
    async () => {
      const r = await interpretar(f.ctx, 'mercado 42,90')
      assert(r.ok)
      assertEquals(r.provedor, 'cloudflare')
      assertEquals(f.eventos().map((e) => e.args?.p_status), ['timeout', 'ok'])
    },
  )
})

// ---- lerImagem ----

Deno.test('lerImagem: vai como data URL no image_url', async () => {
  const f = adminFalso()
  await comFetch(() => resposta(CAMPOS), async (pedidos) => {
    const r = await lerImagem(f.ctx, new Uint8Array([1, 2, 3]), 'image/jpeg')
    assert(r.ok)
    const json = JSON.parse(pedidos[0].body)
    assertEquals(json.model, 'qwen/qwen3.8-27b')
    const imagem = json.messages.at(-1).content.find((p: { type: string }) => p.type === 'image_url')
    assertEquals(imagem.image_url.url, 'data:image/jpeg;base64,AQID')
  })
})

// ---- lerFatura ----

const LINHA = '12/10 LOJA EXEMPLO 199,90\n'

Deno.test('lerFatura: 13 fatias dão fatura_grande sem cota nem fetch', async () => {
  const f = adminFalso()
  const texto = LINHA.repeat(Math.ceil((FATIA_FATURA * 12.5) / LINHA.length))
  await comFetch(() => resposta({ itens: [] }), async (pedidos) => {
    assertEquals(await lerFatura(f.ctx, texto, '2026-10-20'), { ok: false, motivo: 'fatura_grande' })
    assertEquals(pedidos.length, 0)
    assertEquals(f.rpcs.length, 0)
  })
})

Deno.test('lerFatura: duas fatias, duas cotas, itens juntados', async () => {
  const f = adminFalso()
  const texto = LINHA.repeat(Math.ceil((FATIA_FATURA * 1.5) / LINHA.length))
  let n = 0
  await comFetch(() => {
    n++
    return resposta({ itens: [{ data: `2026-10-0${n}`, descricao: `Loja ${n}`, valor: 10 * n, estorno: false, parcela: null }] })
  }, async (pedidos) => {
    const r = await lerFatura(f.ctx, texto, '2026-10-20')
    assert(r.ok)
    assertEquals(r.dados.map((i) => i.descricao), ['Loja 1', 'Loja 2'])
    assertEquals(pedidos.length, 2)
    assert(pedidos.every((p) => p.body.length < FATIA_FATURA + 4000))
    assertEquals(JSON.parse(pedidos[0].body).max_tokens, 4000)
    assertEquals(f.rpcs.filter((r) => r.fn === 'consumir_cota_ia').length, 2)
  })
})
