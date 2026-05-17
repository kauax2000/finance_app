export async function sendEmailResend(args: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')

  const from = Deno.env.get('RESEND_FROM')?.trim() || 'Finance App <no-reply@finance.app>'

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
    throw new Error(`Resend error: ${res.status} ${text.slice(0, 300)}`)
  }
}

export function renderEmailHtml(args: {
  title: string
  body: string
  settingsUrl: string
}): string {
  const safeTitle = args.title.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const safeBody = args.body.replaceAll('<', '&lt;').replaceAll('>', '&gt;')

  return [
    '<!doctype html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width,initial-scale=1" />',
    `    <title>${safeTitle}</title>`,
    '  </head>',
    '  <body style="margin:0;padding:0;background:#0b0b0d;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">',
    '    <div style="max-width:560px;margin:0 auto;padding:24px;">',
    '      <div style="background:#141418;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;color:#fff;">',
    `        <h1 style="margin:0 0 10px;font-size:18px;line-height:1.3;">${safeTitle}</h1>`,
    `        <p style="margin:0;color:rgba(255,255,255,.75);font-size:14px;line-height:1.5;">${safeBody}</p>`,
    '        <div style="margin-top:16px;">',
    `          <a href="${args.settingsUrl}" style="display:inline-block;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.10);color:#fff;text-decoration:none;font-size:13px;">Gerenciar preferências</a>`,
    '        </div>',
    '      </div>',
    '      <p style="margin:14px 4px 0;color:rgba(255,255,255,.55);font-size:12px;line-height:1.4;">',
    '        Você recebeu este email porque habilitou notificações por email no Finance App.',
    '      </p>',
    '    </div>',
    '  </body>',
    '</html>',
  ].join('\n')
}
