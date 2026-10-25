import { assert, assertStringIncludes } from 'jsr:@std/assert@1.0.19'
import { renderInviteHtml } from './workspace-invite-email.ts'

const base = { inviterName: 'ana@exemplo.com', workspaceName: 'Casa', inviteUrl: 'https://app.test/x' }
const PARAGRAFO = 'criou este convite como responsável legal e autorizou o uso do app por você, como pede a LGPD (art. 14).'

Deno.test('renderInviteHtml: o convite menor traz o parágrafo da LGPD com o responsável', () => {
  assertStringIncludes(renderInviteHtml({ ...base, menor: true }), `ana@exemplo.com ${PARAGRAFO}`)
})

Deno.test('renderInviteHtml: sem menor, nada muda', () => {
  assert(!renderInviteHtml(base).includes('LGPD'))
  assert(!renderInviteHtml({ ...base, menor: false }).includes('LGPD'))
})
