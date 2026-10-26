/**
 * Os avisos de plano (Bloco 8; #87 do Bloco 9), o pedaço que lê o banco e
 * entrega: o destino (pela regra pura `destinoDoAviso`), a entrega essencial e
 * a reivindicação dos avisos de texto fixo em `billing_avisos`. O cron, o
 * webhook e o cancelar passam por aqui, e um aviso não sai duas vezes.
 *
 * Os de texto fixo (`fim`, `reembolso`, `estorno`) nascem `pendente` e só
 * deixam de ser quando a entrega dá certo. A falha não libera a reivindicação:
 * o `billing-daily` reenvia os pendentes há mais de 1 hora.
 */
import { type CarteiraDoAviso, avisoFixo, destinoDoAviso, type TipoDeAvisoFixo } from './billing.ts'
import { deliverNotification } from './deliver-notification.ts'
import { renderEmailHtml, sendEmailResend } from './notification-email.ts'
import type { SupabaseAdminClient } from './supabase-admin.ts'

/** O cliente de serviço, com o pedaço do `auth` que o aviso usa (o e-mail da pessoa). */
export type AdminDoAviso = SupabaseAdminClient & {
  auth: { admin: { getUserById(id: string): Promise<{ data: { user: { email?: string | null } | null } }> } }
}
/** `workspaceId` nulo: a pessoa não está em carteira nenhuma, e o aviso vai só por e-mail. */
export type Destino = { email: string | null; workspaceId: string | null }
export type Aviso = { titulo: string; corpo: string }
export type ChaveDoAviso = { user_id: string; tipo: TipoDeAvisoFixo; referencia: string }

const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** A carteira do aviso (`destinoDoAviso`) e o e-mail da pessoa; quem já tem o e-mail o passa. */
export async function destinoDe(admin: AdminDoAviso, userId: string, email?: string | null): Promise<Destino> {
  const { data: membros, error } = await admin
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)
  if (error) throw new Error(`destino: ${error.message}`)
  const papeis = (membros ?? []) as { workspace_id: string; role: string }[]
  let carteiras: CarteiraDoAviso[] = []
  if (papeis.length) {
    const { data, error: wErr } = await admin
      .from('workspaces')
      .select('id, type, created_at')
      .in('id', papeis.map((m) => m.workspace_id))
    if (wErr) throw new Error(`destino: ${wErr.message}`)
    const papel = new Map(papeis.map((m) => [m.workspace_id, m.role]))
    carteiras = ((data ?? []) as Omit<CarteiraDoAviso, 'role'>[]).map((w) => ({ ...w, role: papel.get(w.id) ?? '' }))
  }
  if (email === undefined) {
    const { data: pessoa } = await admin.auth.admin.getUserById(userId)
    email = pessoa?.user?.email ?? null
  }
  return { email, workspaceId: destinoDoAviso(carteiras) }
}

/** Todo aviso de plano: essencial, do tipo system, com o link para os planos. Sem carteira, só o e-mail. */
export async function enviarAviso(
  admin: AdminDoAviso,
  userId: string,
  destino: Destino,
  aviso: Aviso,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (destino.workspaceId) {
    const r = await deliverNotification({
      supabaseAdmin: admin,
      userId,
      userEmail: destino.email,
      workspaceId: destino.workspaceId,
      type: 'system',
      title: aviso.titulo,
      body: aviso.corpo,
      metadata: { href: '/plans' },
      essencial: true,
    })
    return r.ok ? { ok: true } : r
  }
  if (!destino.email) return { ok: false, error: 'sem carteira e sem e-mail' }
  const appBase = Deno.env.get('APP_BASE_URL')?.trim().replace(/\/+$/, '') ?? ''
  try {
    await sendEmailResend({
      to: destino.email,
      subject: aviso.titulo,
      html: renderEmailHtml({ title: aviso.titulo, body: aviso.corpo, settingsUrl: `${appBase}/settings` }),
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: mensagem(e) }
  }
}

/**
 * Entrega um aviso de texto fixo já reivindicado. Deu certo, `pendente =
 * false`; falhou, fica pendente para o `billing-daily`. Nada lança.
 */
export async function entregarPendente(
  admin: AdminDoAviso,
  chave: ChaveDoAviso,
  email?: string | null,
): Promise<'entregue' | 'pendente'> {
  const aviso = avisoFixo(chave.tipo)
  if (!aviso) return 'pendente'
  try {
    const destino = await destinoDe(admin, chave.user_id, email)
    const r = await enviarAviso(admin, chave.user_id, destino, aviso)
    if (!r.ok) {
      console.error('aviso de cobrança: entrega', chave.tipo, chave.user_id, r.error)
      return 'pendente'
    }
  } catch (e) {
    console.error('aviso de cobrança: entrega', chave.tipo, chave.user_id, mensagem(e))
    return 'pendente'
  }
  // Falhou a marca, o aviso fica pendente e o cron o repete: um aviso a mais, nunca um a menos.
  const { error } = await admin
    .from('billing_avisos')
    .update({ pendente: false })
    .eq('user_id', chave.user_id)
    .eq('tipo', chave.tipo)
    .eq('referencia', chave.referencia)
  if (error) console.error('aviso de cobrança: marcar entregue', chave.tipo, chave.user_id, error.message)
  return 'entregue'
}

/**
 * Um aviso de texto fixo por `(pessoa, tipo, referência)`: a reivindicação
 * nasce pendente e a entrega vem depois. `'repetido'`: outro processo já o
 * reivindicou (e o entrega, ou o cron reenvia). `'falhou'`: nem a
 * reivindicação gravou. Nada lança: quem chama já fez o que o aviso conta.
 */
export async function avisarUmaVez(
  admin: AdminDoAviso,
  chave: ChaveDoAviso,
  email?: string | null,
): Promise<'entregue' | 'pendente' | 'repetido' | 'falhou'> {
  try {
    const { error } = await admin.from('billing_avisos').insert({ ...chave, pendente: true })
    if (error?.code === '23505') return 'repetido'
    if (error) throw new Error(error.message)
  } catch (e) {
    console.error('aviso de cobrança: reivindicar', chave.tipo, chave.user_id, mensagem(e))
    return 'falhou'
  }
  return await entregarPendente(admin, chave, email)
}
