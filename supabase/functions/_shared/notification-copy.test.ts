import { assertEquals } from 'jsr:@std/assert@1.0.19'
import {
  billCopy,
  budgetCopy,
  cardLabel,
  cardLimitCopy,
  ddmm,
  invoiceCopy,
  moneyBRL,
  monthNamePt,
} from './notification-copy.ts'

Deno.test('moneyBRL escreve o real sem depender do locale do runtime', () => {
  assertEquals(moneyBRL(0), 'R$\u00a00,00')
  assertEquals(moneyBRL(5), 'R$\u00a05,00')
  assertEquals(moneyBRL(1234.5), 'R$\u00a01.234,50')
  assertEquals(moneyBRL(1234567.891), 'R$\u00a01.234.567,89')
  assertEquals(moneyBRL(0.1 + 0.2), 'R$\u00a00,30')
  assertEquals(moneyBRL(-10), '−R$\u00a010,00')
})

Deno.test('ddmm, monthNamePt e cardLabel', () => {
  assertEquals(ddmm('2026-11-10'), '10/11')
  assertEquals(monthNamePt(10), 'outubro')
  assertEquals(monthNamePt(3), 'março')
  assertEquals(cardLabel('Nubank', '1234'), 'Nubank ··1234')
  assertEquals(cardLabel('Nubank', ''), 'Nubank')
})

Deno.test('budgetCopy nos três limiares', () => {
  assertEquals(budgetCopy({ categoria: 'Mercado', mes: 'outubro', gasto: 850, limite: 1000, nivel: '80' }), {
    title: 'Mercado: 85% do orçamento de outubro',
    body: 'R$\u00a0850,00 de R$\u00a01.000,00 — restam R$\u00a0150,00.',
  })
  assertEquals(budgetCopy({ categoria: 'Mercado', mes: 'outubro', gasto: 1000, limite: 1000, nivel: '100' }), {
    title: 'Mercado: orçamento de outubro esgotado',
    body: 'R$\u00a01.000,00 de R$\u00a01.000,00.',
  })
  assertEquals(budgetCopy({ categoria: 'Mercado', mes: 'outubro', gasto: 1260, limite: 1000, nivel: 'over' }), {
    title: 'Mercado: orçamento de outubro estourado',
    body: 'R$\u00a01.260,00 de R$\u00a01.000,00 (126%) — R$\u00a0260,00 acima.',
  })
  // 29% em ponto flutuante dá 28,999…; a conta em centavos não erra.
  assertEquals(
    budgetCopy({ categoria: 'Lazer', mes: 'maio', gasto: 0.29, limite: 1, nivel: '80' }).title,
    'Lazer: 29% do orçamento de maio'
  )
})

Deno.test('cardLimitCopy', () => {
  assertEquals(cardLimitCopy({ cartao: 'Nubank ··1234', usado: 4500, limite: 5000 }), {
    title: 'Nubank ··1234: 90% do limite',
    body: 'R$\u00a04.500,00 de R$\u00a05.000,00; disponível R$\u00a0500,00.',
  })
  // Acima do limite, o disponível não fica negativo.
  assertEquals(
    cardLimitCopy({ cartao: 'Nubank', usado: 5500, limite: 5000 }).body,
    'R$\u00a05.500,00 de R$\u00a05.000,00; disponível R$\u00a00,00.'
  )
})

Deno.test('invoiceCopy', () => {
  assertEquals(invoiceCopy({ cartao: 'Nubank', evento: 'closed', valor: 0, data: '10/11' }), null)
  assertEquals(invoiceCopy({ cartao: 'Nubank', evento: 'closed', valor: 1234.5, data: '10/11' }), {
    title: 'Fatura do Nubank fechou',
    body: 'Total R$\u00a01.234,50, vence em 10/11.',
  })
  assertEquals(invoiceCopy({ cartao: 'Nubank', evento: 'due_today', valor: 300, data: '10/11' }), {
    title: 'Fatura do Nubank vence hoje',
    body: 'R$\u00a0300,00 — vencimento 10/11.',
  })
  assertEquals(invoiceCopy({ cartao: 'Nubank', evento: 'due_soon', valor: 300, data: '10/11', dias: 3 }), {
    title: 'Fatura do Nubank vence em 3 dias',
    body: 'R$\u00a0300,00 — vencimento 10/11.',
  })
  assertEquals(invoiceCopy({ cartao: 'Nubank', evento: 'closing_soon', valor: 80, data: '03/11', dias: 2 }), {
    title: 'Fatura do Nubank fecha em 2 dias',
    body: 'Parcial R$\u00a080,00, fecha em 03/11.',
  })
  assertEquals(invoiceCopy({ cartao: 'Nubank', evento: 'due_soon', valor: 0, data: '10/11', dias: 3 }), null)
})

Deno.test('billCopy', () => {
  assertEquals(billCopy({ conta: 'Luz', valor: 180, data: '20/10', dias: 3 }), {
    title: 'Luz vence em 3 dias',
    body: 'R$\u00a0180,00 em 20/10.',
  })
  assertEquals(billCopy({ conta: 'Luz', valor: 180, data: '20/10', dias: 0 }).title, 'Luz vence hoje')
  assertEquals(billCopy({ conta: 'Luz', valor: 180, data: '20/10', dias: 1 }).title, 'Luz vence amanhã')
  assertEquals(billCopy({ conta: 'Luz', valor: 180, data: '20/10', dias: -2 }), {
    title: 'Luz está atrasada',
    body: 'Vencia em 20/10 (R$\u00a0180,00). Registre o pagamento.',
  })
  assertEquals(billCopy({ conta: 'Luz', valor: null, data: '20/10', dias: 3 }).body, 'Vence em 20/10.')
  assertEquals(
    billCopy({ conta: 'Luz', valor: null, data: '20/10', dias: -2 }).body,
    'Vencia em 20/10. Registre o pagamento.'
  )
})
