import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { orfaos } from '../_shared/attachments-orphans.ts'
import { internalError } from '../_shared/http.ts'
import { secretMatches } from '../_shared/timing-safe-equal.ts'

// Só servidor a servidor (cron semanal): sem CORS.
const BUCKET = 'attachments'
const PAGINA = 1000
const LOTE_CONSULTA = 100
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

type Objeto = { name: string; created_at: string | null; id: string | null }

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })
  if (!secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))) {
    return json(401, { error: 'Unauthorized' })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const storage = admin.storage.from(BUCKET)
  const agora = new Date().toISOString()

  async function listar(pasta: string): Promise<Objeto[]> {
    const todos: Objeto[] = []
    for (let offset = 0; ; offset += PAGINA) {
      const { data, error } = await storage.list(pasta, { limit: PAGINA, offset })
      if (error) throw error
      todos.push(...(data as Objeto[]))
      if (data.length < PAGINA) return todos
    }
  }

  try {
    // Na raiz, as entradas sem `id` são as pastas: uma por carteira.
    const pastas = (await listar('')).filter((o) => o.id == null && UUID.test(o.name)).map((o) => o.name)
    let removidos = 0

    for (const pasta of pastas) {
      const arquivos = (await listar(pasta))
        .filter((o) => o.id != null && o.created_at)
        .map((o) => ({ name: `${pasta}/${o.name}`, created_at: o.created_at! }))
      // Só os candidatos (sem linha conhecida e com mais de 24 h) vão ao banco, em lotes:
      // uma consulta sem limite pararia em 1000 linhas e apagaria anexo válido.
      const candidatos = orfaos(arquivos, new Set(), agora)
      const comLinha = new Set<string>()
      for (let i = 0; i < candidatos.length; i += LOTE_CONSULTA) {
        const { data: linhas, error } = await admin
          .from('attachments')
          .select('path')
          .in('path', candidatos.slice(i, i + LOTE_CONSULTA))
        if (error) throw error
        for (const l of (linhas ?? []) as Array<{ path: string }>) comLinha.add(l.path)
      }

      const sair = candidatos.filter((c) => !comLinha.has(c))
      for (let i = 0; i < sair.length; i += PAGINA) {
        const { error: erroRemover } = await storage.remove(sair.slice(i, i + PAGINA))
        if (erroRemover) throw erroRemover
      }
      removidos += sair.length
    }

    return json(200, { ok: true, pastas: pastas.length, removidos })
  } catch (e) {
    return json(500, { error: internalError('attachments-cleanup', e) })
  }
})
