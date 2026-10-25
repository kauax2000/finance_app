import { assertEquals } from 'jsr:@std/assert@1.0.19'
import { adultosDaCarteira, donosDaCarteira, leitoresDoCartao } from './destinatarios.ts'

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

Deno.test('leitoresDoCartao: sem titular, todos os adultos, com ou sem dado do banco', () => {
  assertEquals(leitoresDoCartao(rows, null, false), ['dono', 'membro', 'autor'])
  assertEquals(leitoresDoCartao(rows, null, true), ['dono', 'membro', 'autor'])
})

Deno.test('leitoresDoCartao: com titular, o aviso sem dado do banco vai a todos os adultos', () => {
  assertEquals(leitoresDoCartao(rows, 'autor', false), ['dono', 'membro', 'autor'])
})

Deno.test('leitoresDoCartao: com titular e dado do banco, só o titular e os donos', () => {
  assertEquals(leitoresDoCartao(rows, 'autor', true), ['dono', 'autor'])
})

Deno.test('leitoresDoCartao: o titular que é dono não se repete', () => {
  assertEquals(leitoresDoCartao(rows, 'dono', true), ['dono'])
})

Deno.test('leitoresDoCartao: o convidado nunca entra, nem como titular; o que saiu também não', () => {
  assertEquals(leitoresDoCartao(rows, 'filho', true), ['dono'])
  assertEquals(leitoresDoCartao(rows, 'filho', false), ['dono', 'membro', 'autor'])
  assertEquals(leitoresDoCartao(rows, 'saiu', true), ['dono'])
})
