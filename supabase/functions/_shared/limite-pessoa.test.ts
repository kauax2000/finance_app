import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { addCalendarDays, formatYmd, statementCloseYmdForPurchaseYmd } from './credit-card-cycle.ts'
import {
  decidirAvisosDoLimite,
  destinoDoAvisoDoLimite,
  gastoDaPessoaNoMes,
  type LancamentoDaPessoa,
  mesDaCompra,
  nivelDoLimite,
  nivelNovo,
} from './limite-pessoa.ts'

Deno.test('nivelDoLimite: 80 a partir de 80%, 100 a partir de 100%', () => {
  assertEquals(nivelDoLimite(79_99, 100_00), 0)
  assertEquals(nivelDoLimite(80_00, 100_00), 80)
  assertEquals(nivelDoLimite(100_00, 100_00), 100)
  assertEquals(nivelDoLimite(150_00, 100_00), 100)
  assertEquals(nivelDoLimite(10, 0), 0)
})

const lanc = (p: Partial<LancamentoDaPessoa>): LancamentoDaPessoa => ({
  user_id: 'ana',
  type: 'expense',
  amount: 10,
  date: '2026-10-10T12:00:00.000Z',
  payment_method: 'pix',
  card: null,
  ...p,
})

Deno.test('gastoDaPessoaNoMes: o crédito de 28/10 num cartão que fecha no 25 conta em novembro', () => {
  const credito = lanc({ amount: 200, date: '2026-10-28T12:00:00.000Z', payment_method: 'credit_card', card: { closing_day: 25 } })
  assertEquals(gastoDaPessoaNoMes([credito], 'ana', '2026-10'), 0)
  assertEquals(gastoDaPessoaNoMes([credito], 'ana', '2026-11'), 200_00)
})

Deno.test('gastoDaPessoaNoMes: só as despesas da pessoa', () => {
  const lancs = [
    lanc({ amount: 12.34 }),
    lanc({ amount: 50, user_id: 'bia' }),
    lanc({ amount: 900, type: 'income' }),
    // O cartão só vale no crédito: um Pix com cartão anotado conta pelo dia.
    lanc({ amount: 1, date: '2026-10-28T12:00:00.000Z', card: { closing_day: 25 } }),
  ]
  assertEquals(gastoDaPessoaNoMes(lancs, 'ana', '2026-10'), 12_34 + 1_00)
})

Deno.test('mesDaCompra: o mesmo mês que statementCloseYmdForPurchaseYmd, todo dia de 2026 e todo fechamento', () => {
  for (let cd = 1; cd <= 31; cd++) {
    let dia = { y: 2026, m: 1, d: 1 }
    for (let i = 0; i < 366; i++) {
      const esperado = formatYmd(statementCloseYmdForPurchaseYmd(dia, cd)).slice(0, 7)
      assertEquals(mesDaCompra(`${formatYmd(dia)}T12:00:00.000Z`, cd), esperado, `${formatYmd(dia)} fecha ${cd}`)
      dia = addCalendarDays(dia, 1)
    }
  }
  assertEquals(mesDaCompra('2026-12-28', 25), '2027-01')
  assertEquals(mesDaCompra('2026-10-28', null), '2026-10')
  assertEquals(mesDaCompra('lixo', 25), null)
})

const membros = [
  { user_id: 'dona', role: 'owner' },
  { user_id: 'bia', role: 'member' },
  { user_id: 'caio', role: 'guest' },
]

Deno.test('decidirAvisosDoLimite: a pessoa e cada dono, uma vez cada', () => {
  assertEquals(decidirAvisosDoLimite('bia', membros, 80_00, 100_00), {
    nivel: 80,
    reivindicar: [80],
    destinatarios: ['bia', 'dona'],
  })
  // O dono que é a própria pessoa recebe um aviso, não dois.
  assertEquals(decidirAvisosDoLimite('dona', membros, 100_00, 100_00).destinatarios, ['dona'])
  // Dois donos; o convidado recebe o próprio, e o membro não dono não recebe.
  const dois = [...membros, { user_id: 'davi', role: 'owner' }]
  assertEquals(decidirAvisosDoLimite('caio', dois, 90_00, 100_00).destinatarios, ['caio', 'dona', 'davi'])
})

Deno.test('decidirAvisosDoLimite: o 100 reivindica o 80 junto; abaixo de 80, nada', () => {
  assertEquals(decidirAvisosDoLimite('bia', membros, 101_00, 100_00).reivindicar, [80, 100])
  assertEquals(decidirAvisosDoLimite('bia', membros, 79_99, 100_00), { nivel: 0, reivindicar: [], destinatarios: [] })
  // Quem não é membro da carteira não tem limite avaliado.
  assertEquals(decidirAvisosDoLimite('fora', membros, 200_00, 100_00), { nivel: 0, reivindicar: [], destinatarios: [] })
})

Deno.test('nivelNovo: só avisa o nível que a reivindicação devolveu', () => {
  assertEquals(nivelNovo(100, [80, 100]), true) // 79% → 101%: avisa o 100
  assertEquals(nivelNovo(100, [100]), true) // o 80 já tinha saído
  assertEquals(nivelNovo(80, []), false) // o segundo lançamento acima de 80%
  assertEquals(nivelNovo(100, [80]), false)
})

Deno.test('destinoDoAvisoDoLimite: o convidado no Painel, o adulto nos limites de Membros', () => {
  assertEquals(destinoDoAvisoDoLimite('guest'), '/dashboard')
  assertEquals(destinoDoAvisoDoLimite('member'), '/members#limites')
  assertEquals(destinoDoAvisoDoLimite('owner'), '/members#limites')
})
