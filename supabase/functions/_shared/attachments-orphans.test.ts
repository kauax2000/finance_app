import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { orfaos } from './attachments-orphans.ts'

Deno.test('só o objeto sem linha e com mais de 24 h é órfão', () => {
  const agora = '2026-10-21T12:00:00.000Z'
  const objetos = [
    { name: 'ws/com-linha.webp', created_at: '2026-10-01T12:00:00.000Z' },
    { name: 'ws/velho.pdf', created_at: '2026-10-19T12:00:00.000Z' },
    { name: 'ws/recente.webp', created_at: '2026-10-21T11:00:00.000Z' },
  ]
  assertEquals(orfaos(objetos, new Set(['ws/com-linha.webp']), agora), ['ws/velho.pdf'])
})
