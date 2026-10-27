/**
 * Captura sem abrir o app: o Atalho do iPhone manda a frase (ou os dados do
 * Apple Pay) com o token pessoal `fac_…`, e a função grava o lançamento como a
 * pessoa. A regra mora em `_shared/captura.ts`; aqui é só I/O.
 *
 * Bloco 3B: a foto chega em multipart (campo `file`, e `text`, `source` e `id`
 * opcionais), é lida pela IA e vira anexo; a frase confusa vai à IA depois do
 * parser; parcelas > 1 viram plano pela RPC `criar_plano_parcelado`.
 *
 * Usa a service role, então repete o que a RLS garantiria (Decisão 8): o autor é
 * o dono do token, e a carteira de destino é uma das dele. O aviso aos membros
 * sai do trigger `transactions_notify_created`, não daqui.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import {
  type CamposDaIA,
  clientIdDoPedido,
  ERRO_VALOR,
  montarLancamento,
  precisaDeIA,
  resumoDoLancamento,
  tipoDoArquivo,
  validarPedido,
  valoresDoPlano,
} from '../_shared/captura.ts'
import { appTodayYmd, formatYmd } from '../_shared/credit-card-cycle.ts'
import type { CartaoParaCasar, LinhaHistorico } from '../_shared/frase.ts'
import { internalError, lerCorpo } from '../_shared/http.ts'
import { interpretar, lerImagem, nomesDosMembros } from '../_shared/ia.ts'
import { sha256Hex } from '../_shared/token-hash.ts'

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const MAX_CORPO = 16 * 1024
/** O multipart da foto; o bucket `attachments` aceita até 10 MB por arquivo. */
const MAX_FOTO = 10 * 1024 * 1024
/** Acima disto a foto não vai à IA (o limite de imagem do provedor; memória do worker): o texto decide. */
const MAX_FOTO_IA = 4 * 1024 * 1024
const HISTORICO_POR_CARTEIRA = 300
const TOKEN_INVALIDO = () => json(401, { error: 'Token inválido.' })
const CORPO_GRANDE = (multipart: boolean) =>
  json(413, { error: multipart ? 'Foto acima de 10 MB.' : 'Corpo acima de 16 KB.' })
const ERRO_PDF = 'PDF de fatura: use Conferir fatura no app.'
const ERRO_TIPO = 'Envie uma foto (JPG, PNG ou WebP).'
const ERRO_FOTO = 'Não entendi a foto. Mande o valor no texto.'
const ERRO_FOTO_GRANDE = 'Foto grande demais para a IA. Reduza a foto ou mande o valor no texto.'
/** O convidado só lança despesa (Bloco 7A, Ruling 11); a RLS barraria o mesmo pelo app. */
const ERRO_RECEITA_DO_CONVIDADO = 'Convidado lança só despesa. Peça a um adulto da carteira para lançar a receita.'
const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const
type Foto = { bytes: Uint8Array; mime: keyof typeof EXTENSAO }

type Gravado = {
  id: string
  needs_review: boolean
  amount: number
  description: string
  payment_credit_card_id: string | null
  capture_meta: { ia?: unknown } | null
}
const COLUNAS_GRAVADO = 'id, needs_review, amount, description, payment_credit_card_id, capture_meta'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  // Revogado, desconhecido ou mal formado: a mesma resposta (Foco 2). O formato
  // se confere antes de ler o corpo.
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(fac_[0-9a-f]{64})$/)?.[1]
  if (!token) return TOKEN_INVALIDO()

  // A foto vem em multipart, com outro teto; o resto é o JSON de sempre. O
  // corpo só é lido depois do token, do plano e do membro: sem token válido,
  // a Edge não guarda 10 MB de ninguém.
  const contentType = req.headers.get('content-type') ?? ''
  const multipart = /^multipart\/form-data/i.test(contentType)
  const teto = multipart ? MAX_FOTO : MAX_CORPO
  if (Number(req.headers.get('content-length') ?? 0) > teto) return CORPO_GRANDE(multipart)

  const tokenHash = await sha256Hex(token)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const { data: tok, error: tokErr } = await admin
    .from('capture_tokens')
    .select('id, user_id, workspace_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle()
  if (tokErr) return json(500, { error: internalError('capture: token', tokErr) })
  if (!tok) return TOKEN_INVALIDO()
  const { id: tokenId, user_id: userId, workspace_id: carteiraPadrao } = tok as {
    id: string
    user_id: string
    workspace_id: string
  }

  // O plano é o da carteira padrão do token (spec §9), antes de tudo.
  const { data: plano, error: planoErr } = await admin.rpc('workspace_plan', { p_workspace_id: carteiraPadrao })
  if (planoErr) return json(500, { error: internalError('capture: plano', planoErr) })
  if (plano !== 'familia') return json(402, { error: 'Sem plano ativo nesta carteira.' })

  const { data: membros, error: memErr } = await admin
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)
  if (memErr) return json(500, { error: internalError('capture: membro', memErr) })
  const carteirasDaPessoa = (membros ?? []).map((m: { workspace_id: string }) => m.workspace_id)
  // O convidado só vê as transações dele (Bloco 7A): o histórico que casa também.
  const convidadoEm = new Set(
    (membros ?? []).filter((m: { role: string }) => m.role === 'guest').map((m: { workspace_id: string }) => m.workspace_id),
  )
  // Saiu da carteira padrão: o token não vale mais.
  if (!carteirasDaPessoa.includes(carteiraPadrao)) return TOKEN_INVALIDO()

  let bruto = await lerCorpo(req, teto)
  if (bruto == null) return CORPO_GRANDE(multipart)

  let corpo: unknown
  let foto: Foto | null = null
  try {
    if (multipart) {
      const form = await new Response(bruto, { headers: { 'content-type': contentType } }).formData()
      bruto = null
      const arquivo = form.get('file')
      if (!(arquivo instanceof File)) return json(422, { error: ERRO_TIPO })
      const bytes = new Uint8Array(await arquivo.arrayBuffer())
      // Pelos bytes, não pelo nome: HEIC e o resto caem no tipo (o guia manda converter).
      const tipo = tipoDoArquivo(bytes)
      if (tipo === 'application/pdf') return json(422, { error: ERRO_PDF })
      if (tipo == null) return json(422, { error: ERRO_TIPO })
      foto = { bytes, mime: tipo }
      corpo = {
        text: form.get('text') ?? undefined,
        source: form.get('source') ?? undefined,
        id: form.get('id') ?? undefined,
      }
    } else corpo = JSON.parse(new TextDecoder().decode(bruto))
  } catch {
    return json(422, { error: 'Corpo inválido.' })
  }
  const validado = validarPedido(corpo, foto != null)
  if (!validado.ok) return json(422, { error: validado.erro })
  const pedido = validado.pedido

  const { data: cartoesLidos, error: cErr } = await admin
    .from('credit_cards')
    .select('id, name, wallet_alias, last_four, workspace_id, is_active')
    .in('workspace_id', carteirasDaPessoa)
    .eq('is_active', true)
  if (cErr) return json(500, { error: internalError('capture: cartões', cErr) })
  const cartoes = (cartoesLidos ?? []) as CartaoParaCasar[]

  // O resumo de um retry vem da linha gravada, não do pedido. `anexo` é null
  // sem foto; `ia` diz se a linha passou pela IA (Decisão 2).
  const responder = (g: Gravado, anexo: boolean | null) =>
    json(200, {
      ok: true,
      id: g.id,
      needs_review: g.needs_review,
      resumo: resumoDoLancamento(
        Number(g.amount),
        g.description,
        cartoes.find((c) => c.id === g.payment_credit_card_id)?.name,
      ),
      ia: g.capture_meta?.ia != null,
      anexo,
    })

  // O Storage responde 409 ("Duplicate") quando o objeto do caminho já existe;
  // o storage-js põe o HTTP em `status` e o código em `statusCode`, conforme a versão.
  const jaExiste = (err: unknown) => {
    if (err == null) return false
    const e = err as { status?: unknown; statusCode?: unknown }
    return String(e.status) === '409' || String(e.statusCode) === '409' || e.statusCode === 'Duplicate'
  }

  // Num retry a foto não sobe de novo: o anexo é o que a 1ª vez gravou.
  const temAnexo = async (transacaoId: string) => {
    const { count, error } = await admin
      .from('attachments')
      .select('id', { count: 'exact', head: true })
      .eq('transaction_id', transacaoId)
    if (error) console.error('capture: anexo do retry', error)
    return (count ?? 0) > 0
  }

  // Com `id`, o retry do Atalho cai no mesmo `client_id` e não duplica (Foco 1);
  // sem `id`, `client_id` nulo nunca conflita, e cada pedido é um lançamento novo.
  const clientId = pedido.id ? await clientIdDoPedido(tokenId, pedido.id) : null
  if (clientId) {
    // Procura em todas as carteiras da pessoa: entre um toque e o retry o
    // destino pode ter mudado (um cartão desativado), e a chave é por carteira.
    const { data: anterior, error: antErr } = await admin
      .from('transactions')
      .select(COLUNAS_GRAVADO)
      .in('workspace_id', carteirasDaPessoa)
      .eq('client_id', clientId)
      .limit(1)
      .maybeSingle()
    if (antErr) return json(500, { error: internalError('capture: retry', antErr) })
    if (anterior) {
      const g = anterior as Gravado
      return responder(g, foto ? await temAnexo(g.id) : null)
    }
  }

  // ponytail: o histórico de todas as carteiras da pessoa (o destino só se sabe
  // depois de casar o cartão); uma família tem poucas. Se crescer, casar antes.
  const historicos = await Promise.all(
    carteirasDaPessoa.map((w: string) => {
      const q = admin
        .from('transactions')
        .select('description, category_id, payment_method, payment_credit_card_id, date, type')
        .eq('workspace_id', w)
      return (convidadoEm.has(w) ? q.eq('user_id', userId) : q)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(HISTORICO_POR_CARTEIRA)
    }),
  )
  const historicoPorCarteira: Record<string, LinhaHistorico[]> = {}
  for (const [i, r] of historicos.entries()) {
    if (r.error) return json(500, { error: internalError('capture: histórico', r.error) })
    historicoPorCarteira[carteirasDaPessoa[i]] = (r.data ?? []) as LinhaHistorico[]
  }

  const hoje = formatYmd(appTodayYmd())

  // A IA (Decisões 8 e 9): a foto vai sempre; a frase, só se o parser não deu
  // conta. Sem IA (cota, provedor fora, sem chave), segue o caminho de hoje.
  let lido: Awaited<ReturnType<typeof interpretar>> | null = null
  if (foto) {
    // A imagem não se redige (Decisão 6), então não leva nomes. Grande demais, o anexo segue e o texto decide.
    if (foto.bytes.byteLength <= MAX_FOTO_IA) lido = await lerImagem({ admin, userId, hoje, nomes: [] }, foto.bytes, foto.mime)
  } else if (precisaDeIA(pedido, hoje)) {
    // Sem os nomes, o texto sairia sem redigir: sem IA.
    const nomes = await nomesDosMembros(admin, carteirasDaPessoa)
    if (nomes) lido = await interpretar({ admin, userId, hoje, nomes }, pedido.text ?? '')
  }
  let campos: CamposDaIA | undefined
  if (lido?.ok) campos = { ...lido.dados, provedor: lido.provedor, modelo: lido.modelo }
  else if (lido) console.error('capture: ia', lido.motivo)

  const montado = montarLancamento(
    { ...pedido, campos },
    { userId, carteiraPadrao, carteirasDaPessoa, cartoes, historicoPorCarteira, hoje },
  )
  if (!montado.ok) {
    // Sem valor e com foto: ou a IA não leu, ou a foto nem foi a ela (acima de 4 MB).
    const erroDaFoto = foto && foto.bytes.byteLength > MAX_FOTO_IA ? ERRO_FOTO_GRANDE : ERRO_FOTO
    return json(montado.status, { error: foto && montado.erro === ERRO_VALOR ? erroDaFoto : montado.erro })
  }
  const { linha } = montado
  // A service role não passa pela RLS: a recusa do convidado se repete aqui.
  if (linha.type === 'income' && convidadoEm.has(linha.workspace_id)) return json(422, { error: ERRO_RECEITA_DO_CONVIDADO })

  let gravado: Gravado | undefined
  let novo: boolean
  const valores = montado.parcelas ? valoresDoPlano(linha.amount, montado.parcelas) : null
  if (valores) {
    // Decisão 10: parcela capturada vira plano de verdade. A RPC cria as
    // parcelas vencidas até hoje, já com a origem e a conferir.
    const { data: planoId, error: planoRpcErr } = await admin.rpc('criar_plano_parcelado', {
      p_user_id: userId,
      p_workspace_id: linha.workspace_id,
      p_category_id: linha.category_id,
      p_description: linha.description,
      p_payment_method: linha.payment_method,
      p_payment_credit_card_id: linha.payment_credit_card_id,
      p_total_installments: montado.parcelas,
      p_installment_amount: valores.parcela,
      p_final_installment_amount: valores.ultima,
      p_next_billing_date: linha.date.slice(0, 10),
      p_source: linha.source,
      p_needs_review: true,
      // A chave e a capture_meta vão na 1ª parcela dentro da RPC: com o mesmo
      // `client_id`, dois retries simultâneos dão um plano só (Bloco 9, #23).
      p_client_id: clientId,
      p_capture_meta: linha.capture_meta,
    })
    if (planoRpcErr) return json(500, { error: internalError('capture: plano parcelado', planoRpcErr) })
    const { data: primeira, error: primErr } = await admin
      .from('transactions')
      .select(COLUNAS_GRAVADO)
      .eq('installment_plan_id', planoId)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (primErr) return json(500, { error: internalError('capture: 1ª parcela', primErr) })
    // Defensivo: `montarLancamento` já traz a data para hoje, então a 1ª parcela
    // sempre existe. Sem ela, o plano existe e a parcela nasceria no cron.
    if (!primeira) {
      return json(200, {
        ok: true,
        id: null,
        needs_review: true,
        resumo: montado.resumo,
        ia: campos != null,
        anexo: foto ? false : null,
      })
    }
    // O plano não tem `client_id`: a chave está na 1ª parcela, e o retry a
    // acha pela busca de cima. O 2º de dois retries simultâneos recebe o plano
    // do 1º e conta como novo: a foto não duplica porque o caminho é o do
    // `client_id` (#95), e os avisos têm dedupe.
    gravado = primeira as Gravado
    novo = true
  } else {
    const { data: inseridos, error: insErr } = await admin
      .from('transactions')
      .upsert({ ...linha, client_id: clientId }, { onConflict: 'workspace_id,client_id', ignoreDuplicates: true })
      .select(COLUNAS_GRAVADO)
    if (insErr) return json(500, { error: internalError('capture: insert', insErr) })

    gravado = (inseridos ?? [])[0] as Gravado | undefined
    novo = gravado != null
    if (!gravado) {
      // Dois retries ao mesmo tempo: o outro gravou primeiro.
      const { data: existente, error: lerErr } = await admin
        .from('transactions')
        .select(COLUNAS_GRAVADO)
        .eq('workspace_id', linha.workspace_id)
        .eq('client_id', clientId)
        .maybeSingle()
      if (lerErr || !existente) return json(500, { error: internalError('capture: retry', lerErr ?? 'sem linha') })
      gravado = existente as Gravado
    }
  }

  // A foto vira anexo do lançamento novo (Decisão 8): o objeto sobe antes da
  // linha, e sem linha (cota estourada, 'cota_anexos_excedida') o objeto sai.
  // O lançamento fica salvo de qualquer jeito, com `anexo: false`.
  let anexo: boolean | null = null
  if (foto && !novo) anexo = await temAnexo(gravado.id)
  else if (foto) {
    anexo = false
    // Com `client_id` o caminho é fixo: o reenvio simultâneo bate no objeto do 1º.
    const path = `${linha.workspace_id}/${clientId ?? crypto.randomUUID()}.${EXTENSAO[foto.mime]}`
    const bucket = admin.storage.from('attachments')
    const gravarAnexo = async (caminho: string) =>
      (await admin.from('attachments').insert({
        workspace_id: linha.workspace_id,
        transaction_id: gravado.id,
        path: caminho,
        mime: foto.mime,
        size_bytes: foto.bytes.byteLength,
        created_by: userId,
      })).error
    const { error: upErr } = await bucket.upload(path, foto.bytes, { contentType: foto.mime, upsert: false })
    if (jaExiste(upErr)) {
      // O 409 só prova o objeto: o 1º envio pode ter morrido antes da linha, ou
      // o objeto ficou de um lançamento apagado. O objeto é do 1º: não sai daqui.
      const { count, error: lerErr } = await admin
        .from('attachments')
        .select('id', { count: 'exact', head: true })
        .eq('path', path)
      if (lerErr) console.error('capture: anexo existente', lerErr)
      else if ((count ?? 0) > 0) anexo = true
      else {
        const anexoErr = await gravarAnexo(path)
        if (anexoErr) console.error('capture: anexo', anexoErr)
        else anexo = true
      }
    } else if (upErr) console.error('capture: anexo upload', upErr)
    else {
      const anexoErr = await gravarAnexo(path)
      if (anexoErr) {
        console.error('capture: anexo', anexoErr)
        const { error: rmErr } = await bucket.remove([path])
        if (rmErr) console.error('capture: anexo remove', rmErr)
      } else anexo = true
    }
  }

  const { error: usoErr } = await admin
    .from('capture_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenId)
  if (usoErr) console.error('capture: last_used_at', usoErr)

  // Os alertas de orçamento e de limite, como o front faz depois de salvar uma
  // despesa, com o Bearer da service role (o `isServiceAuthorized` deles). Só
  // para a linha nova: um retry não avalia duas vezes. Falha só vira log.
  if (novo && linha.type === 'expense') {
    const avaliar = (fn: string, body: Record<string, unknown>) =>
      fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/${fn}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify(body),
      })
        .then((r) => {
          if (!r.ok) console.error(`capture: ${fn}`, r.status)
        })
        .catch((e) => console.error(`capture: ${fn}`, e))
    // O `evaluate-budgets` vai sempre, com ou sem categoria: o limite da pessoa
    // vale para toda despesa, e a Edge lê carteira e autor da própria linha.
    // O orçamento continua precisando da categoria, e a Edge confere.
    const chamadas: Promise<void>[] = [
      avaliar('evaluate-budgets', {
        transaction_id: gravado.id,
        category_id: linha.category_id,
        occurred_at: linha.date,
        payment_method: linha.payment_method,
        payment_credit_card_id: linha.payment_credit_card_id,
      }),
    ]
    if (linha.payment_credit_card_id) {
      chamadas.push(
        avaliar('evaluate-credit-card-alerts', {
          workspace_id: linha.workspace_id,
          payment_credit_card_id: linha.payment_credit_card_id,
          category_id: linha.category_id,
          occurred_at: linha.date,
        }),
      )
    }
    const todas = Promise.all(chamadas)
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(todas)
    else await todas
  }

  return responder(gravado, anexo)
})
