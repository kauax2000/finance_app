/** Prefer secret APP_BASE_URL in PRD; in dev the browser sends `Origin` on `functions.invoke` (e.g. http://localhost:3000). */
export function resolvePublicAppBase(req: Request): string {
  const fromEnv = Deno.env.get('APP_BASE_URL')?.trim()?.replace(/\/$/, '') || ''
  if (fromEnv) return fromEnv
  return req.headers.get('origin')?.trim()?.replace(/\/$/, '') || ''
}

export function buildInviteAcceptUrl(appBase: string, tokenRaw: string): string {
  const path = `/invites/accept?token=${encodeURIComponent(tokenRaw)}`
  if (!appBase) return path
  return `${appBase.replace(/\/$/, '')}${path}`
}

/** Resend-provided sender: does not require verifying your own domain (dev / smoke tests). Production: set RESEND_FROM to an address on a verified domain. */
const RESEND_FROM_FALLBACK_TEST = 'Convites <onboarding@resend.dev>'

export async function sendEmailResend(args: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY não está definido nos secrets do Supabase (Edge Functions → Secrets).',
    )
  }

  const from = Deno.env.get('RESEND_FROM')?.trim() || RESEND_FROM_FALLBACK_TEST

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let parsed: { message?: string; name?: string } | null = null
    try {
      parsed = JSON.parse(text) as { message?: string; name?: string }
    } catch {
      /* body may not be JSON */
    }
    const msg = typeof parsed?.message === 'string' ? parsed.message : ''
    const lower = msg.toLowerCase()
    if (
      res.status === 403 &&
      (lower.includes('not verified') ||
        lower.includes('domain') ||
        parsed?.name === 'validation_error')
    ) {
      throw new Error(
        'O domínio do remetente não está verificado na Resend. Defina RESEND_FROM nos secrets do Supabase com um endereço de um domínio verificado em https://resend.com/domains.',
      )
    }
    if (msg) throw new Error(`Envio de e-mail: ${msg}`)
    throw new Error(`Falha ao enviar e-mail (${res.status}). ${text.slice(0, 280)}`)
  }
}

export function renderInviteHtml(args: {
  inviterName: string
  workspaceName: string
  inviteUrl: string
}): string {
  const workspace = args.workspaceName.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const inviter = args.inviterName.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const url = args.inviteUrl

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Convite para workspace</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0d;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#141418;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;color:#fff;">
        <h1 style="margin:0 0 10px;font-size:18px;line-height:1.3;">Você recebeu um convite</h1>
        <p style="margin:0 0 12px;color:rgba(255,255,255,.75);font-size:14px;line-height:1.5;">
          ${inviter} convidou você para participar do workspace <strong>${workspace}</strong>.
        </p>
        <a href="${url}" style="display:inline-block;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.10);color:#fff;text-decoration:none;font-size:13px;">
          Aceitar convite
        </a>
      </div>
    </div>
  </body>
</html>`
}
