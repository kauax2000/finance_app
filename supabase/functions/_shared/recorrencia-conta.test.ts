import { assertEquals, assertThrows } from 'jsr:@std/assert@1.0.19'
import {
  primeiroVencimento,
  proximoVencimento,
  proximoVencimentoDaConta,
  vencimentosQueFaltam,
} from './recorrencia-conta.ts'

const MENSAL_10 = { frequency: 'monthly', due_day_of_month: 10, end_date: null, is_active: true } as const

Deno.test('recorrencia: primeiro vencimento no mês do início ou no seguinte', () => {
  assertEquals(primeiroVencimento('2026-08-05', 10), '2026-08-10')
  assertEquals(primeiroVencimento('2026-08-10', 10), '2026-08-10')
  assertEquals(primeiroVencimento('2026-08-11', 10), '2026-09-10')
  assertEquals(primeiroVencimento('2026-12-20', 10), '2027-01-10')
})

Deno.test('recorrencia: dia 31 vira o último dia do mês', () => {
  assertEquals(primeiroVencimento('2026-02-01', 31), '2026-02-28')
  assertEquals(primeiroVencimento('2028-02-01', 31), '2028-02-29')
  assertEquals(proximoVencimento('2026-01-31', 'monthly', 31), '2026-02-28')
  assertEquals(proximoVencimento('2026-02-28', 'monthly', 31), '2026-03-31')
  assertEquals(proximoVencimento('2026-03-31', 'monthly', 31), '2026-04-30')
  assertEquals(proximoVencimento('2028-01-31', 'monthly', 31), '2028-02-29')
})

Deno.test('recorrencia: bimestral, trimestral e anual', () => {
  assertEquals(proximoVencimento('2026-11-15', 'bimonthly', 15), '2027-01-15')
  assertEquals(proximoVencimento('2026-01-31', 'quarterly', 31), '2026-04-30')
  assertEquals(proximoVencimento('2026-11-10', 'quarterly', 10), '2027-02-10')
  assertEquals(proximoVencimento('2028-02-29', 'yearly', 29), '2029-02-28')
  assertEquals(proximoVencimento('2027-02-28', 'yearly', 29), '2028-02-29')
})

Deno.test('recorrencia: one_time não tem próximo', () => {
  assertEquals(proximoVencimento('2026-08-10', 'one_time', 10), null)
})

Deno.test('recorrencia: data malformada lança erro claro', () => {
  for (const ruim of ['lixo', '2026-13-05', '2026-8-5', '2026-08-00', '2026-08-32']) {
    assertThrows(() => proximoVencimento(ruim, 'monthly', 10), Error, 'data inválida')
    assertThrows(() => primeiroVencimento(ruim, 10), Error, 'data inválida')
  }
})

Deno.test('recorrencia: a próxima da conta respeita ativa, one_time e end_date', () => {
  assertEquals(proximoVencimentoDaConta(MENSAL_10, '2026-08-10'), '2026-09-10')
  assertEquals(proximoVencimentoDaConta({ ...MENSAL_10, is_active: false }, '2026-08-10'), null)
  assertEquals(proximoVencimentoDaConta({ ...MENSAL_10, frequency: 'one_time' }, '2026-08-10'), null)
  assertEquals(proximoVencimentoDaConta({ ...MENSAL_10, end_date: '2026-09-10' }, '2026-08-10'), '2026-09-10')
  assertEquals(proximoVencimentoDaConta({ ...MENSAL_10, end_date: '2026-09-09' }, '2026-08-10'), null)
})

Deno.test('recorrencia: vencimentos que faltam até hoje, inclusive', () => {
  assertEquals(vencimentosQueFaltam(MENSAL_10, '2026-08-10', '2026-11-15'), [
    '2026-09-10',
    '2026-10-10',
    '2026-11-10',
  ])
  assertEquals(vencimentosQueFaltam(MENSAL_10, '2026-08-10', '2026-11-09'), ['2026-09-10', '2026-10-10'])
  assertEquals(vencimentosQueFaltam(MENSAL_10, '2026-08-10', '2026-09-10'), ['2026-09-10'])
  assertEquals(vencimentosQueFaltam(MENSAL_10, '2026-11-10', '2026-11-15'), [])
})

Deno.test('recorrencia: vencimentos que faltam param no fim, na inatividade e no one_time', () => {
  assertEquals(vencimentosQueFaltam({ ...MENSAL_10, end_date: '2026-10-10' }, '2026-08-10', '2026-11-15'), [
    '2026-09-10',
    '2026-10-10',
  ])
  assertEquals(vencimentosQueFaltam({ ...MENSAL_10, is_active: false }, '2026-08-10', '2026-11-15'), [])
  assertEquals(vencimentosQueFaltam({ ...MENSAL_10, frequency: 'one_time' }, '2026-08-10', '2026-11-15'), [])
})

Deno.test('recorrencia: dia 31 mensal cruza fevereiro sem perder o dia', () => {
  const c = { ...MENSAL_10, due_day_of_month: 31 }
  assertEquals(vencimentosQueFaltam(c, '2026-01-31', '2026-04-30'), ['2026-02-28', '2026-03-31', '2026-04-30'])
})
