import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { triggerSkipReason } from './transaction-notify-rules.ts'

const despesa = {
  type: 'expense',
  subscription_id: null,
  installment_plan_id: null,
  import_batch_id: null,
}

Deno.test('triggerSkipReason: lançamento importado é ignorado', () => {
  assertEquals(triggerSkipReason({ ...despesa, import_batch_id: 'batch-1' }), 'imported')
})

Deno.test('triggerSkipReason: despesa manual passa', () => {
  assertEquals(triggerSkipReason(despesa), null)
})

Deno.test('triggerSkipReason: receita é ignorada', () => {
  assertEquals(triggerSkipReason({ ...despesa, type: 'income' }), 'not_expense')
})

Deno.test('triggerSkipReason: parcela é ignorada', () => {
  assertEquals(triggerSkipReason({ ...despesa, installment_plan_id: 'plan-1' }), 'installment')
})

Deno.test('triggerSkipReason: assinatura é ignorada', () => {
  assertEquals(triggerSkipReason({ ...despesa, subscription_id: 'sub-1' }), 'subscription')
})
