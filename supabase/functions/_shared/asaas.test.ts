import { assertEquals } from 'jsr:@std/assert@1.0.19'
import {
  agendarNota,
  asaas,
  buscarCobranca,
  buscarParcelamento,
  type AsaasConfig,
  configDoAsaas,
  criarCliente,
  criarCobranca,
  estornarNoAsaas,
  estornarParcelamento,
  listarCobrancasAbertas,
  removerCobranca,
} from './asaas.ts'

const CFG: AsaasConfig = { url: 'https://api-sandbox.asaas.com/v3', chave: 'chave-de-teste' }

type Pedido = { url: string; init: RequestInit; corpo: Record<string, unknown> | null }

async function comFetch(
  responder: (url: string, init: RequestInit) => Response | Promise<Response>,
  corpo: (pedidos: Pedido[]) => Promise<void>,
) {
  const original = globalThis.fetch
  const pedidos: Pedido[] = []
  globalThis.fetch = ((input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input)
    pedidos.push({ url, init, corpo: init.body ? JSON.parse(String(init.body)) : null })
    return Promise.resolve().then(() => responder(url, init))
  }) as typeof fetch
  try {
    await corpo(pedidos)
  } finally {
    globalThis.fetch = original
  }
}

const json = (status: number, dados: unknown) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } })

const COBRANCA = { cliente: 'cus_1', centavos: 23880, referencia: 'sub-1', vencimento: '2026-11-01' }

Deno.test('configDoAsaas: null sem as duas variáveis; tira a barra do fim da URL', () => {
  try {
    Deno.env.delete('ASAAS_API_URL')
    Deno.env.delete('ASAAS_API_KEY')
    assertEquals(configDoAsaas(), null)
    Deno.env.set('ASAAS_API_URL', 'https://api-sandbox.asaas.com/v3/')
    assertEquals(configDoAsaas(), null)
    Deno.env.set('ASAAS_API_KEY', 'chave-de-teste')
    assertEquals(configDoAsaas(), CFG)
  } finally {
    Deno.env.delete('ASAAS_API_URL')
    Deno.env.delete('ASAAS_API_KEY')
  }
})

Deno.test('asaas: URL, método, cabeçalhos e prazo', async () => {
  await comFetch(() => json(200, { id: 'x' }), async (pedidos) => {
    assertEquals(await asaas(CFG, 'GET', '/payments/pay_1'), { ok: true, dados: { id: 'x' } })
    const [p] = pedidos
    assertEquals(p.url, 'https://api-sandbox.asaas.com/v3/payments/pay_1')
    assertEquals(p.init.method, 'GET')
    assertEquals(p.init.headers, {
      access_token: 'chave-de-teste',
      'Content-Type': 'application/json',
      'User-Agent': 'finance-app',
    })
    assertEquals(p.init.body, undefined)
    assertEquals(p.init.signal instanceof AbortSignal, true)
  })
})

Deno.test('asaas: 400 devolve as descrições de errors[]', async () => {
  const erro = { errors: [{ code: 'invalid_cpfCnpj', description: 'O CPF informado é inválido.' }] }
  await comFetch(() => json(400, erro), async () => {
    assertEquals(await asaas(CFG, 'POST', '/customers', {}), {
      ok: false,
      status: 400,
      erros: ['O CPF informado é inválido.'],
    })
  })
})

Deno.test('asaas: 500 sem JSON devolve erros vazio', async () => {
  await comFetch(() => new Response('Bad Gateway', { status: 502 }), async () => {
    assertEquals(await asaas(CFG, 'GET', '/x'), { ok: false, status: 502, erros: [] })
  })
})

Deno.test('asaas: o prazo estourado vira status 0', async () => {
  await comFetch(() => {
    throw new DOMException('Signal timed out.', 'TimeoutError')
  }, async () => {
    const r = await asaas(CFG, 'GET', '/x')
    assertEquals(r.ok, false)
    if (!r.ok) {
      assertEquals(r.status, 0)
      assertEquals(r.incerto, true)
      assertEquals(r.erros, ['O Asaas não respondeu a tempo.'])
    }
  })
})

Deno.test('asaas: falha de rede vira status 0', async () => {
  await comFetch(() => {
    throw new TypeError('error sending request')
  }, async () => {
    assertEquals(await asaas(CFG, 'GET', '/x'), { ok: false, status: 0, erros: ['Falha de rede ao chamar o Asaas.'] })
  })
})

async function comPrazos(corpo: (prazos: number[]) => Promise<void>) {
  const original = AbortSignal.timeout
  const prazos: number[] = []
  AbortSignal.timeout = (ms: number) => {
    prazos.push(ms)
    return original.call(AbortSignal, ms)
  }
  try {
    await comFetch(() => json(200, { id: 'x' }), () => corpo(prazos))
  } finally {
    AbortSignal.timeout = original
  }
}

Deno.test('prazo: 60 s na cobrança por token, 15 s no resto', async () => {
  await comPrazos(async (prazos) => {
    await criarCobranca(CFG, { ...COBRANCA, token: 'tok_1', ip: '203.0.113.7' })
    await criarCobranca(CFG, COBRANCA)
    await criarCliente(CFG, { nome: 'Ana', cpf: '12345678909', email: null, userId: 'u-1' })
    await estornarParcelamento(CFG, 'inst_1')
    await buscarParcelamento(CFG, 'inst_1')
    await asaas(CFG, 'GET', '/x')
    // o estorno corre dentro do webhook, que o Asaas espera só 10 s (Ruling 10)
    assertEquals(prazos, [60_000, 15_000, 15_000, 6_000, 3_000, 15_000])
  })
})

Deno.test('criarCobranca por token: o prazo estourado volta incerto', async () => {
  await comFetch(() => {
    throw new DOMException('Signal timed out.', 'TimeoutError')
  }, async () => {
    assertEquals(await criarCobranca(CFG, { ...COBRANCA, token: 'tok_1', ip: '203.0.113.7' }), {
      ok: false,
      status: 0,
      incerto: true,
      erros: ['O Asaas não respondeu a tempo.'],
    })
  })
})

Deno.test('criarCliente: só dígitos no CPF, referência e notificações do Asaas desligadas', async () => {
  await comFetch(() => json(200, { id: 'cus_1' }), async (pedidos) => {
    const r = await criarCliente(CFG, { nome: 'Ana Teste', cpf: '123.456.789-09', email: 'ana@exemplo.com', userId: 'u-1' })
    assertEquals(r, { ok: true, dados: { id: 'cus_1' } })
    assertEquals(pedidos[0].url, 'https://api-sandbox.asaas.com/v3/customers')
    assertEquals(pedidos[0].init.method, 'POST')
    assertEquals(pedidos[0].corpo, {
      name: 'Ana Teste',
      cpfCnpj: '12345678909',
      email: 'ana@exemplo.com',
      externalReference: 'u-1',
      notificationDisabled: true,
    })
  })
})

Deno.test('criarCobranca: 12x no cartão, valor em reais, sem dado de cartão', async () => {
  await comFetch(() => json(200, { id: 'pay_1', invoiceUrl: 'https://x' }), async (pedidos) => {
    await criarCobranca(CFG, COBRANCA)
    assertEquals(pedidos[0].url, 'https://api-sandbox.asaas.com/v3/payments')
    assertEquals(pedidos[0].corpo, {
      customer: 'cus_1',
      billingType: 'CREDIT_CARD',
      installmentCount: 12,
      totalValue: 238.8,
      dueDate: '2026-11-01',
      description: 'Finance App — Plano Família (anual)',
      externalReference: 'sub-1',
    })
  })
})

Deno.test('criarCobranca: retorno vira o callback com redirecionamento', async () => {
  await comFetch(() => json(200, {}), async (pedidos) => {
    await criarCobranca(CFG, { ...COBRANCA, retorno: 'https://app.exemplo.com/planos?pago=1' })
    assertEquals(pedidos[0].corpo?.callback, { successUrl: 'https://app.exemplo.com/planos?pago=1', autoRedirect: true })
  })
})

Deno.test('criarCobranca: com token, manda creditCardToken e remoteIp, nunca creditCard', async () => {
  await comFetch(() => json(200, {}), async (pedidos) => {
    await criarCobranca(CFG, { ...COBRANCA, token: 'tok_1', ip: '203.0.113.7' })
    assertEquals(pedidos[0].corpo, {
      customer: 'cus_1',
      billingType: 'CREDIT_CARD',
      installmentCount: 12,
      totalValue: 238.8,
      dueDate: '2026-11-01',
      description: 'Finance App — Plano Família (anual)',
      externalReference: 'sub-1',
      creditCardToken: 'tok_1',
      remoteIp: '203.0.113.7',
    })
  })
})

Deno.test('criarCobranca: nenhuma variação envia creditCard nem creditCardHolderInfo', async () => {
  await comFetch(() => json(200, {}), async (pedidos) => {
    await criarCobranca(CFG, COBRANCA)
    await criarCobranca(CFG, { ...COBRANCA, retorno: 'https://app.exemplo.com/planos' })
    await criarCobranca(CFG, { ...COBRANCA, token: 'tok_1', ip: null })
    for (const p of pedidos) {
      assertEquals('creditCard' in p.corpo!, false)
      assertEquals('creditCardHolderInfo' in p.corpo!, false)
      assertEquals(/creditCardNumber|ccv|holderName/.test(String(p.init.body)), false)
    }
  })
})

Deno.test('estornarParcelamento: POST /installments/{id}/refund com corpo vazio (estorno total)', async () => {
  await comFetch(() => json(200, { id: 'inst_1' }), async (pedidos) => {
    await estornarParcelamento(CFG, 'inst_1')
    assertEquals(pedidos[0].url, 'https://api-sandbox.asaas.com/v3/installments/inst_1/refund')
    assertEquals(pedidos[0].init.method, 'POST')
    assertEquals(pedidos[0].corpo, {})
  })
})

Deno.test('buscarParcelamento: GET /installments/{id}, com os estornos', async () => {
  await comFetch(() => json(200, { id: 'inst_1', customer: 'cus_1', refunds: [{ status: 'DONE' }] }), async (pedidos) => {
    const r = await buscarParcelamento(CFG, 'inst 1')
    assertEquals(pedidos[0].url, 'https://api-sandbox.asaas.com/v3/installments/inst%201')
    assertEquals(pedidos[0].init.method, 'GET')
    assertEquals(r, { ok: true, dados: { id: 'inst_1', customer: 'cus_1', refunds: [{ status: 'DONE' }] } })
  })
})

Deno.test('buscarParcelamento: o prazo estourado volta incerto', async () => {
  await comFetch(() => {
    throw new DOMException('Signal timed out.', 'TimeoutError')
  }, async () => {
    const r = await buscarParcelamento(CFG, 'inst_1')
    assertEquals(r.ok, false)
    if (!r.ok) assertEquals(r.incerto, true)
  })
})

Deno.test('estornarNoAsaas: lê antes; já estornado não pede de novo', async () => {
  await comFetch(() => json(200, { id: 'inst_1', customer: 'cus_1', refunds: [{ status: 'PENDING' }] }), async (pedidos) => {
    assertEquals(await estornarNoAsaas(CFG, 'inst_1', 'cus_1'), { ok: true })
    assertEquals(pedidos.map((p) => p.init.method), ['GET'])
  })
})

Deno.test('estornarNoAsaas: GET e depois o POST do estorno', async () => {
  await comFetch(() => json(200, { id: 'inst_1', customer: 'cus_1', refunds: [] }), async (pedidos) => {
    assertEquals(await estornarNoAsaas(CFG, 'inst_1', 'cus_1'), { ok: true })
    assertEquals(pedidos.map((p) => p.init.method), ['GET', 'POST'])
    assertEquals(pedidos[1].url, 'https://api-sandbox.asaas.com/v3/installments/inst_1/refund')
  })
})

Deno.test('estornarNoAsaas: outro cliente ou leitura falha não pede estorno', async () => {
  await comFetch(() => json(200, { id: 'inst_1', customer: 'cus_2' }), async (pedidos) => {
    const r = await estornarNoAsaas(CFG, 'inst_1', 'cus_1')
    assertEquals(r.ok ? null : [r.etapa, r.status], ['cliente', 0])
    assertEquals(pedidos.length, 1)
  })
  await comFetch(() => json(500, {}), async (pedidos) => {
    const r = await estornarNoAsaas(CFG, 'inst_1', 'cus_1')
    assertEquals(r.ok ? null : r.etapa, 'leitura')
    assertEquals(pedidos.length, 1)
  })
})

Deno.test('estornarNoAsaas: o POST recusado ou estourado volta na etapa estorno', async () => {
  await comFetch((_url, init) => init.method === 'GET' ? json(200, { id: 'inst_1', customer: 'cus_1' }) : json(400, {}), async () => {
    const r = await estornarNoAsaas(CFG, 'inst_1', 'cus_1')
    assertEquals(r.ok ? null : [r.etapa, r.status], ['estorno', 400])
  })
})

Deno.test('agendarNota: POST /invoices do parcelamento, valor total e impostos zerados', async () => {
  await comFetch(() => json(200, { id: 'inv_1' }), async (pedidos) => {
    const r = await agendarNota(CFG, {
      parcelamento: 'inst_1',
      centavos: 35880,
      data: '2026-11-02',
      codigo: '01.07',
      nome: 'Suporte técnico',
    })
    assertEquals(r, { ok: true, dados: { id: 'inv_1' } })
    assertEquals(pedidos[0].url, 'https://api-sandbox.asaas.com/v3/invoices')
    assertEquals(pedidos[0].corpo, {
      installment: 'inst_1',
      serviceDescription: 'Assinatura anual do Finance App, Plano Família',
      observations: '',
      value: 358.8,
      deductions: 0,
      effectiveDate: '2026-11-02',
      municipalServiceCode: '01.07',
      municipalServiceName: 'Suporte técnico',
      taxes: { retainIss: false, iss: 0, cofins: 0, csll: 0, inss: 0, ir: 0, pis: 0 },
    })
  })
})

const ABERTA = (x: Record<string, unknown> = {}) => ({
  id: 'pay_1',
  installment: 'inst_1',
  customer: 'cus_1',
  externalReference: 'sub-1',
  status: 'PENDING',
  value: 19.9,
  dueDate: '2026-11-01',
  invoiceUrl: 'https://sandbox.asaas.com/i/pay_1',
  ...x,
})

Deno.test('listarCobrancasAbertas: PENDING e OVERDUE da referência, juntas', async () => {
  await comFetch((url) =>
    json(200, {
      object: 'list',
      hasMore: false,
      data: url.includes('status=PENDING') ? [ABERTA()] : [ABERTA({ id: 'pay_0', status: 'OVERDUE' })],
    }), async (pedidos) => {
    const r = await listarCobrancasAbertas(CFG, 'sub 1')
    assertEquals(r.ok && r.dados.map((c) => c.id), ['pay_1', 'pay_0'])
    assertEquals(pedidos.map((p) => [p.init.method, p.url]), [
      ['GET', 'https://api-sandbox.asaas.com/v3/payments?externalReference=sub%201&status=PENDING&limit=100'],
      ['GET', 'https://api-sandbox.asaas.com/v3/payments?externalReference=sub%201&status=OVERDUE&limit=100'],
    ])
  })
})

Deno.test('listarCobrancasAbertas: uma falha devolve a falha, sem lista parcial', async () => {
  await comFetch(
    (url) => url.includes('OVERDUE') ? json(500, {}) : json(200, { data: [ABERTA()] }),
    async () => {
      const r = await listarCobrancasAbertas(CFG, 'sub-1')
      assertEquals(r.ok, false)
    },
  )
})

Deno.test('listarCobrancasAbertas: resposta sem data é lista vazia', async () => {
  await comFetch(() => json(200, { object: 'list' }), async () => {
    assertEquals(await listarCobrancasAbertas(CFG, 'sub-1'), { ok: true, dados: [] })
  })
})

Deno.test('buscarCobranca: GET /payments/{id}', async () => {
  await comFetch(() => json(200, ABERTA({ status: 'CONFIRMED' })), async (pedidos) => {
    const r = await buscarCobranca(CFG, 'pay_1')
    assertEquals(r.ok && r.dados.status, 'CONFIRMED')
    assertEquals([pedidos[0].init.method, pedidos[0].url], ['GET', 'https://api-sandbox.asaas.com/v3/payments/pay_1'])
  })
})

Deno.test('removerCobranca: o parcelamento inteiro pelo installment; a avulsa pelo id', async () => {
  await comFetch(() => json(200, { deleted: true }), async (pedidos) => {
    assertEquals((await removerCobranca(CFG, { id: 'pay_1', installment: 'inst_1' })).ok, true)
    assertEquals((await removerCobranca(CFG, { id: 'pay_2', installment: null })).ok, true)
    assertEquals(pedidos.map((p) => [p.init.method, p.url, p.init.body]), [
      ['DELETE', 'https://api-sandbox.asaas.com/v3/installments/inst_1', undefined],
      ['DELETE', 'https://api-sandbox.asaas.com/v3/payments/pay_2', undefined],
    ])
  })
})

Deno.test('removerCobranca: a recusa do Asaas volta como falha', async () => {
  await comFetch(() => json(400, { errors: [{ description: 'Não é possível remover.' }] }), async () => {
    assertEquals(await removerCobranca(CFG, { id: 'pay_1', installment: 'inst_1' }), {
      ok: false,
      status: 400,
      erros: ['Não é possível remover.'],
    })
  })
})
