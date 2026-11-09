/**
 * A IA para o app (Decisão 11): o formulário manda a frase, a foto ou o texto
 * da fatura com o JWT da pessoa, e recebe os campos para conferir. Nada aqui
 * grava lançamento — quem grava é o formulário, com a pessoa olhando.
 *
 * Ordem: método → JWT → Content-Length → corpo com teto → membro → plano → IA.
 * O `workspaceId` mora no corpo, então o corpo é lido antes do membro; o JWT já
 * autenticou quem chama, e os tetos são pequenos.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { bearerJwt, getAuthUserFromJwt } from '../_shared/auth-user.ts'
import { tipoDoArquivo } from '../_shared/captura.ts'
import { appTodayYmd, formatYmd } from '../_shared/credit-card-cycle.ts'
import { internalError, lerCorpo } from '../_shared/http.ts'
import {
  alinharFatura,
  ehDataValida,
  interpretar,
  type ItemParaAlinhar,
  lerFatura,
  lerImagem,
  nomesDosMembros,
  type ResultadoIA,
} from '../_shared/ia.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-session-id',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** A foto já chega comprimida pelo cliente (WebP, ~1600 px); o limite de imagem do provedor. */
const MAX_FOTO = 4 * 1024 * 1024
/** A fatura de 80.000 caracteres cabe com folga, mesmo com acento (2 bytes cada). */
const MAX_JSON = 256 * 1024
const MAX_TEXTO = { frase: 500, fatura: 80_000 } as const
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ERRO_TIPO = 'Envie uma foto (JPG, PNG ou WebP).'
const SEM_SESSAO = () => json(401, { error: 'Entre de novo para usar a IA.' })
const GRANDE = (multipart: boolean) =>
  json(413, { error: multipart ? 'Foto grande demais.' : 'Texto grande demais para a IA.' })
const INVALIDO = (error: string) => json(422, { error })

type Pedido =
  | { op: 'frase'; workspaceId: string; texto: string }
  | { op: 'fatura'; workspaceId: string; texto: string; fechamento: string }
  | { op: 'imagem'; workspaceId: string; bytes: Uint8Array; mime: string }
  | { op: 'alinhar'; workspaceId: string; banco: ItemParaAlinhar[]; app: ItemParaAlinhar[] }

/** Uma lista de `ItemParaAlinhar`, com descrição de até 200 caracteres; null se algum item falhar. */
function listaParaAlinhar(v: unknown): ItemParaAlinhar[] | null {
  if (!Array.isArray(v)) return null
  const ok = v.every((x) => {
    const { i, data, descricao, valor, estorno } = (x ?? {}) as Record<string, unknown>
    return Number.isInteger(i) && (i as number) >= 0 && ehDataValida(data) &&
      typeof descricao === 'string' && descricao.length <= 200 &&
      typeof valor === 'number' && Number.isFinite(valor) && valor > 0 && typeof estorno === 'boolean'
  })
  // Só os cinco campos seguem adiante: id, categoria ou autor que viessem junto ficam aqui.
  return ok ? v.map(({ i, data, descricao, valor, estorno }) => ({ i, data, descricao, valor, estorno })) : null
}

// Um erro solto viraria 500 sem CORS, que o navegador mostra como "Sem conexão".
Deno.serve(async (req: Request) => {
  try {
    return await atender(req)
  } catch (e) {
    return json(500, { error: internalError('ia-ler', e) })
  }
})

async function atender(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const jwt = bearerJwt(req.headers.get('Authorization'))
  if (!jwt) return SEM_SESSAO()
  const auth = await getAuthUserFromJwt(supabaseUrl, anonKey, jwt)
  if (!auth.user) return SEM_SESSAO()
  const userId = auth.user.id

  const contentType = req.headers.get('content-type') ?? ''
  const multipart = /^multipart\/form-data/i.test(contentType)
  const teto = multipart ? MAX_FOTO : MAX_JSON
  if (Number(req.headers.get('content-length') ?? 0) > teto) return GRANDE(multipart)
  let bruto = await lerCorpo(req, teto)
  if (bruto == null) return GRANDE(multipart)

  let pedido: Pedido
  try {
    if (multipart) {
      const form = await new Response(bruto, { headers: { 'content-type': contentType } }).formData()
      bruto = null
      if (form.get('op') !== 'imagem') return INVALIDO('Operação inválida.')
      const arquivo = form.get('file')
      if (!(arquivo instanceof File)) return INVALIDO(ERRO_TIPO)
      const bytes = new Uint8Array(await arquivo.arrayBuffer())
      // Pelos bytes, não pelo nome; PDF também cai aqui (a fatura vai como texto).
      const mime = tipoDoArquivo(bytes)
      if (mime == null || mime === 'application/pdf') return INVALIDO(ERRO_TIPO)
      pedido = { op: 'imagem', workspaceId: String(form.get('workspaceId') ?? ''), bytes, mime }
    } else {
      const corpo = JSON.parse(new TextDecoder().decode(bruto)) as Record<string, unknown>
      const { op, workspaceId, texto, fechamento } = corpo ?? {}
      if (op === 'alinhar') {
        const banco = listaParaAlinhar(corpo.banco)
        const app = listaParaAlinhar(corpo.app)
        if (!banco || !app) return INVALIDO('Itens para alinhar inválidos.')
        pedido = { op, workspaceId: typeof workspaceId === 'string' ? workspaceId : '', banco, app }
      } else {
        if (op !== 'frase' && op !== 'fatura') return INVALIDO('Operação inválida.')
        if (typeof texto !== 'string' || !texto.trim()) {
          return INVALIDO(op === 'frase' ? 'Escreva a frase em até 500 caracteres.' : 'Texto da fatura vazio.')
        }
        if (texto.length > MAX_TEXTO[op]) {
          // A fatura longa demais responde como o `lerFatura`: o cliente mostra a dica do CSV.
          if (op === 'fatura') return json(200, { ok: false, motivo: 'fatura_grande' })
          return INVALIDO('Escreva a frase em até 500 caracteres.')
        }
        const ws = typeof workspaceId === 'string' ? workspaceId : ''
        if (op === 'frase') pedido = { op, workspaceId: ws, texto }
        else {
          if (!ehDataValida(fechamento)) return INVALIDO('Data de fechamento inválida.')
          pedido = { op, workspaceId: ws, texto, fechamento }
        }
      }
    }
  } catch {
    return INVALIDO('Corpo inválido.')
  }
  if (!UUID.test(pedido.workspaceId)) return INVALIDO('Carteira inválida.')

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: membro, error: memErr } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', pedido.workspaceId)
    .eq('user_id', userId)
    .maybeSingle()
  if (memErr) return json(500, { error: internalError('ia-ler: membro', memErr) })
  if (!membro) return json(403, { error: 'Você não é membro dessa carteira.' })

  const { data: plano, error: planoErr } = await admin.rpc('workspace_plan', { p_workspace_id: pedido.workspaceId })
  if (planoErr) return json(500, { error: internalError('ia-ler: plano', planoErr) })
  if (plano !== 'familia') return json(402, { error: 'Sem plano ativo nesta carteira.' })

  const hoje = formatYmd(appTodayYmd())
  const responder = <T>(r: ResultadoIA<T>, chave: 'campos' | 'itens' | 'pares') => {
    if (r.ok) return json(200, { ok: true, [chave]: r.dados, provedor: r.provedor, modelo: r.modelo })
    // Sem chave é problema de configuração: para a pessoa, a IA só não respondeu.
    if (r.motivo === 'sem_chave') console.error('ia-ler: sem chave de provedor')
    return json(200, { ok: false, motivo: r.motivo === 'sem_chave' ? 'sem_ia' : r.motivo })
  }

  // A imagem não se redige (Decisão 6), então não leva nomes.
  if (pedido.op === 'imagem') {
    return responder(await lerImagem({ admin, userId, hoje, nomes: [] }, pedido.bytes, pedido.mime), 'campos')
  }

  // Sem os nomes, o texto sairia sem redigir: sem IA.
  const nomes = await nomesDosMembros(admin, [pedido.workspaceId])
  if (!nomes) return json(200, { ok: false, motivo: 'sem_ia' })
  const ctx = { admin, userId, hoje, nomes }
  if (pedido.op === 'frase') return responder(await interpretar(ctx, pedido.texto), 'campos')
  if (pedido.op === 'alinhar') return responder(await alinharFatura(ctx, pedido.banco, pedido.app), 'pares')
  return responder(await lerFatura(ctx, pedido.texto, pedido.fechamento), 'itens')
}
