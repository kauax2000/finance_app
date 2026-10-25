import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { adultosDaCarteira, donosDaCarteira } from './destinatarios.ts'

const rows = [
  { user_id: 'dono', role: 'owner' },
  { user_id: 'membro', role: 'member' },
  { user_id: 'filho', role: 'guest' },
  { user_id: 'autor', role: 'member' },
  { user_id: 'dono', role: 'owner' },
]

Deno.test('adultosDaCarteira: dono e membro, sem o convidado, sem o autor e sem repetir', () => {
  assertEquals(adultosDaCarteira(rows, 'autor'), ['dono', 'membro'])
})

Deno.test('adultosDaCarteira: sem excluir, todos os adultos', () => {
  assertEquals(adultosDaCarteira(rows), ['dono', 'membro', 'autor'])
})

Deno.test('adultosDaCarteira: a despesa do convidado avisa os adultos', () => {
  assertEquals(adultosDaCarteira(rows, 'filho'), ['dono', 'membro', 'autor'])
})

Deno.test('donosDaCarteira: só os donos, uma vez cada', () => {
  assertEquals(donosDaCarteira(rows), ['dono'])
})
