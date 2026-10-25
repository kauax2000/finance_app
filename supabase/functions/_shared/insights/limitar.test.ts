import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { limitarAchados } from './limitar.ts'

Deno.test('limitarAchados: o mais recente primeiro, e no mesmo dia pela prioridade do tipo', () => {
  const achados = [
    { kind: 'sazonal', dataYmd: '2026-10-25', id: 1 },
    { kind: 'recorrencia', dataYmd: '2026-10-25', id: 2 },
    { kind: 'duplicidade', dataYmd: '2026-10-10', id: 3 },
    { kind: 'fatura_fechou', dataYmd: '2026-10-24', id: 4 },
    { kind: 'a_conferir', dataYmd: '2026-10-25', id: 5 },
    { kind: 'gasto_atipico', dataYmd: '2026-10-25', id: 6 },
    { kind: 'relatorio_mes', dataYmd: '2026-10-25', id: 7 },
  ]
  assertEquals(limitarAchados(achados, 5).map((a) => a.id), [7, 5, 2, 6, 1])
  assertEquals(limitarAchados(achados, 10).map((a) => a.id), [7, 5, 2, 6, 1, 4, 3])
  assertEquals(achados[0].id, 1)
})
