import { secretMatches } from './timing-safe-equal.ts'

function bearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

/** Chamada do servidor: o Bearer da service role, ou `x-cron-secret` igual a `CRON_SECRET`. */
export function isServiceAuthorized(req: Request): boolean {
  const bearer = bearerToken(req.headers.get('Authorization'))
  if (secretMatches(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), bearer)) return true
  if (secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) return true
  return false
}
