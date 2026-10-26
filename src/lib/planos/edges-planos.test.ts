import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const DIARIO = "supabase/functions/billing-daily/index.ts"
const AVISO = "supabase/functions/_shared/aviso-de-cobranca.ts"

describe("Edge billing-daily", () => {
    it("só o cron chama, pelo x-cron-secret", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))")
        expect(f).toContain("return json(401")
    })

    it("o enforced_since nulo pula só o aviso do teste; a renovação, os estornos e a NFS-e rodam sempre", () => {
        const f = fonte(DIARIO)
        const config = f.indexOf(".from('billing_settings')")
        expect(config).toBeGreaterThan(-1)
        expect(f).not.toContain("pulado: 'desligado'")
        const teste = f.indexOf("if (config?.enforced_since) await passo(ctx, 'teste', () => avisarDoTeste(ctx))")
        expect(teste).toBeGreaterThan(config)
        expect(funcao(f, "avisarDoTeste")).toContain("avisos_de_teste_pendentes")
        for (const p of ["estornos', () => refazerEstornos(ctx))", "renovação', () => renovarAssinaturas(ctx))", "NFS-e', () => emitirNotas(ctx))", "avisos', () => reenviarAvisos(ctx))"]) {
            expect(f).toContain(`\n  await passo(ctx, '${p}`)
            expect(f.indexOf(p)).toBeGreaterThan(teste)
        }
        expect(f).toContain("return json(200, { ok: true, ...ctx.n })")
        for (const c of ["renovadas", "falhas", "expiradas", "avisos", "notas"]) expect(f).toContain(`${c}: 0`)
    })

    it("todo aviso é essencial, do tipo system, com o link para os planos", () => {
        const f = fonte(DIARIO)
        // #87: a entrega e o destino moram num lugar só, para o cron, o webhook e o cancelar
        expect(f).not.toContain("deliverNotification(")
        const a = fonte(AVISO)
        expect(a.match(/deliverNotification\(/g)?.length).toBe(1)
        const enviar = funcao(a, "enviarAviso")
        expect(enviar).toContain("deliverNotification(")
        expect(enviar).toContain("essencial: true")
        expect(enviar).toContain("type: 'system'")
        expect(enviar).toContain("metadata: { href: '/plans' }")
        expect(f).toContain("avisoDoTeste(")
        expect(f).toContain("enviarAviso(ctx.admin, dedupe.user_id, destino, aviso)")
    })

    it("os avisos são deduplicados por período, e a entrega que falha libera o dedupe", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("tipo: 'teste'")
        expect(f).toContain(".from('billing_avisos')")
        expect(f).toContain("forEachLimit(")
        expect(f).toContain("FAN_OUT_CONCURRENCY")
        // a falha de entrega e a exceção liberam o dedupe, num lugar só
        expect(f.split("await releaseDedupe(admin, dedupe)").length - 1).toBe(2)
        const entregar = funcao(f, "entregar")
        expect(entregar.split("await releaseDedupe(admin, dedupe)").length - 1).toBe(2)
        expect(entregar).toContain("claimDedupe(admin, dedupe)")
        expect(f).toContain("function referenciaDoPeriodo(ctx: Ctx, linha: Linha): string {\n  return (linha.current_period_end ?? ctx.iso).slice(0, 10)")
        expect(funcao(f, "avisar")).toContain("referencia: referenciaDoPeriodo(ctx, linha)")
        expect(f).toContain("avisar(ctx, linha, 'renovacao', AVISOS.renovacao(linha, linha.card_last4))")
        expect(f.match(/avisar\(ctx, linha, 'cartao', AVISOS\.cartao\(\{ \.\.\.linha, \.\.\.falha \}\)\)/g)?.length).toBe(3)
        // #87: o 'fim' fica pendente até a entrega dar certo, e não libera o dedupe
        expect(funcao(f, "expirar")).toContain("avisarFixo(ctx, { user_id: linha.user_id, tipo: 'fim', referencia: referenciaDoPeriodo(ctx, linha) })")
        expect(f).not.toContain("AVISOS.fim()")
    })

    it("lê as assinaturas do Asaas em todas as páginas, e uma linha que falha não para as outras", () => {
        const f = fonte(DIARIO)
        const ler = funcao(f, "renovarAssinaturas")
        expect(ler).toContain("todasAsPaginas<Linha>(")
        expect(ler).toContain(".in('status', ['active', 'past_due'])")
        expect(ler).toContain("acaoDoDia(linha, ctx.agora)")
        // todo fan-out tem o seu try/catch por item
        const laços = f.match(/forEachLimit\(/g)?.length ?? 0
        expect(laços).toBe(5)
        expect(f.match(/FAN_OUT_CONCURRENCY, async \(\w+\) => \{\n\s*try \{/g)?.length).toBe(laços)
    })

    it("grava o checkout_criado_em, condicional e sem o cancelado, antes de cobrar o token", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        const reivindica = r.indexOf("update({ checkout_criado_em: iso, checkout_url: null, updated_at: iso })")
        expect(reivindica).toBeGreaterThan(-1)
        expect(r.indexOf("criarCobranca(cfg")).toBeGreaterThan(reivindica)
        expect(r).toContain(".eq('cancel_at_period_end', false)")
        expect(r).toContain("for (const col of ['checkout_criado_em', 'grace_until', 'current_period_end'] as const)")
        expect(r).toContain("if (!minha?.length) return")
        expect(r).toContain("token: linha.card_token!")
        expect(r).toContain("ip: linha.ultimo_ip")
        expect(r).toContain("referencia: linha.id")
        expect(r).toContain("linha.price_cents ??")
    })

    it("sem token ou sem ultimo_ip não cobra: falhaNaRenovacao e o aviso do cartão", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        expect(r).toContain("const comToken = !!(linha.card_token && linha.ultimo_ip && linha.asaas_customer_id)")
        const sem = r.slice(r.indexOf("if (!comToken)"), r.indexOf("const cfg = ctx.cfg"))
        expect(sem).toContain("falhaNaRenovacao(linha, agora)")
        expect(sem).toContain("checkout_criado_em: iso, checkout_url: null")
        expect(sem).toContain("AVISOS.cartao(")
        expect(sem).not.toContain("criarCobranca(")
        expect(r.indexOf("if (!comToken)")).toBeLessThan(r.indexOf("criarCobranca(cfg"))
    })

    it("toda gravação do checkout_criado_em zera o checkout_url", () => {
        const f = fonte(DIARIO)
        const gravacoes = f.split("\n").filter((l) => /\.update\(\{[^}]*checkout_criado_em: iso/.test(l))
        expect(gravacoes.length).toBe(2)
        for (const l of gravacoes) expect(l).toContain("checkout_url: null")
    })

    it("tira do ar a fatura aberta do checkout antes de cobrar, e nunca o provider_ref (Ruling 7)", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        const paga = r.indexOf("faturaPagaDoCheckout(ctx, cfg, linha)")
        const lista = r.indexOf("listarCobrancasAbertas(cfg, linha.id)")
        const triagem = r.indexOf("triagemDasAbertas(abertas.dados, centavos, linha.asaas_customer_id!, linha.provider_ref)")
        const remove = r.indexOf("removerCobranca(cfg, c)")
        const cobra = r.indexOf("criarCobranca(cfg")
        expect(paga).toBeGreaterThan(-1)
        expect(lista).toBeGreaterThan(paga)
        expect(triagem).toBeGreaterThan(lista)
        expect(remove).toBeGreaterThan(triagem)
        expect(cobra).toBeGreaterThan(remove)
        expect(r).toContain("reusar ? [reusar, ...remover] : remover")
        // a falha de leitura ou remoção não cobra: devolve a data de antes (e o 401/403/408/429 da cobrança, Ruling 26)
        expect(r.match(/return await soltar\(/g)?.length).toBe(4)
    })

    it("registra o parcelamento da renovação antes de gravar o resultado (Ruling 9)", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        const registro = r.indexOf(".from('billing_parcelamentos').insert({ installment, subscription_id: linha.id })")
        expect(registro).toBeGreaterThan(r.indexOf("criarCobranca(cfg"))
        expect(registro).toBeLessThan(r.indexOf("aplicarPagamento(ctx, linha, cobranca.dados, gravar)"))
        expect(registro).toBeLessThan(r.indexOf("aguardandoConfirmacao("))
        expect(registro).toBeLessThan(r.indexOf("falhaNaRenovacao(linha, agora)", r.indexOf("criarCobranca(cfg")))
        expect(r).toContain("const installment = cobranca.ok ? cobranca.dados.installment : null")
        expect(fonte(DIARIO)).not.toContain("criadosHoje")
    })

    it("o resultado: confirmada ativa, aceita ou incerta espera, recusada vira past_due", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        expect(r).toContain("const resultado = resultadoDaCobranca(cobranca)")
        expect(r).toContain("if (cobranca.ok && resultado === 'ativar') {")
        const efeito = r.indexOf("aplicarPagamento(ctx, linha, cobranca.dados, gravar)")
        const espera = r.indexOf("if (cobranca.ok || resultado !== 'recusada') {")
        const recusa = r.indexOf("const falha = falhaNaRenovacao(linha, agora)", espera)
        expect(efeito).toBeGreaterThan(-1)
        expect(espera).toBeGreaterThan(efeito)
        expect(r.slice(espera, recusa)).toContain("gravar(aguardandoConfirmacao(linha))")
        expect(recusa).toBeGreaterThan(espera)
        expect(r.slice(recusa)).toContain("AVISOS.cartao(")
        // um efeito nulo não grava nada e cai na espera
        expect(r).toContain("if (await aplicarPagamento(ctx, linha, cobranca.dados, gravar)) return")
        const aplica = funcao(fonte(DIARIO), "aplicarPagamento")
        expect(aplica).toContain("const m = efeitoDoEvento('PAYMENT_CONFIRMED', p, linha, ctx.agora)")
        expect(aplica).toContain("if (!m) return false")
        expect(aplica).toContain("marcarAtivado(ctx, m.provider_ref, linha.id)")
        // depois da cobrança, a gravação vale só para a reivindicação desta chamada
        expect(r).toContain(".eq('checkout_criado_em', iso)")
    })

    it("expira condicional ao que leu", () => {
        const e = funcao(fonte(DIARIO), "expirar")
        expect(e).toContain("status: 'expired', checkout_url: null")
        expect(e).toContain(".eq('updated_at', linha.updated_at)")
        expect(e).toContain(".eq('status', linha.status)")
    })

    it("refaz os estornos pendentes com mais de 1 hora, e o reembolso concluído expira a linha (Ruling 10 e 13)", () => {
        const s = funcao(fonte(DIARIO), "refazerEstornos")
        expect(s).toContain(".eq('estorno_status', 'pendente')")
        expect(s).toContain(".lt('estorno_tentado_em', limite)")
        expect(s).toContain("UMA_HORA_MS")
        const tentativa = s.indexOf(".eq('estorno_tentado_em', p.estorno_tentado_em)")
        const pede = s.indexOf("estornarNoAsaas(cfg, p.installment, linha.asaas_customer_id)")
        const feito = s.indexOf("update({ estorno_status: 'feito' })")
        const expira = s.indexOf("status: 'expired'")
        expect(tentativa).toBeGreaterThan(-1)
        expect(pede).toBeGreaterThan(tentativa)
        expect(feito).toBeGreaterThan(pede)
        expect(expira).toBeGreaterThan(feito)
        // #87 (c): o texto sai do registro, não do provider_ref de agora (uma compra nova o troca)
        expect(s).toContain("if (textoDoEstornoConcluido(p, linha) === 'reembolso')")
        expect(s).not.toContain("p.installment === linha.provider_ref")
        expect(s.slice(expira)).toContain(".eq('status', 'active')")
        expect(s.slice(expira)).toContain(".eq('provider_ref', p.installment)")
    })

    it("o estorno da cobrança em dobro leva o aviso do webhook, uma vez, e o reembolso não", () => {
        const f = fonte(DIARIO)
        const s = funcao(f, "refazerEstornos")
        const ramo = s.indexOf("if (textoDoEstornoConcluido(p, linha) === 'reembolso')")
        const aviso = s.indexOf("avisarFixo(ctx, { user_id: linha.user_id, tipo: 'estorno', referencia: p.installment })")
        expect(aviso).toBeGreaterThan(ramo)
        expect(s.slice(ramo, aviso)).toContain("return\n      }")
        expect(s).toContain("if (!marcou?.length) return")
        // a mesma reivindicação do webhook: tipo 'estorno' por parcelamento
        expect(f).not.toContain("AVISOS.estorno()")
        expect(fonte(WEBHOOK)).toContain("avisarUmaVez(admin, { user_id: linha.user_id, tipo: 'estorno', referencia: parcelamento })")
    })

    it("a NFS-e: uma por parcelamento pago, sem os segredos pula com um console.error", () => {
        const n = funcao(fonte(DIARIO), "emitirNotas")
        expect(n).toContain("Deno.env.get('ASAAS_NFSE_SERVICO_CODIGO')")
        expect(n).toContain("Deno.env.get('ASAAS_NFSE_SERVICO_NOME')")
        const pula = n.indexOf("if (!cfg || !codigo || !nome) {")
        expect(n.slice(pula, n.indexOf("return", pula)).match(/console\.error\(/g)?.length).toBe(1)
        expect(n).toContain(".eq('status', 'active')")
        expect(n).toContain(".not('provider_ref', 'is', null)")
        expect(n).toContain("l.nfse_para !== l.provider_ref")
        expect(n).toContain("agendarNota(cfg, { parcelamento: ref, centavos, data: ctx.hoje, codigo, nome })")
        // M4: a nota é reivindicada, condicional, antes de agendar; só a recusa 4xx devolve a reivindicação
        const reivindica = n.indexOf("update({ nfse_para: ref })")
        expect(reivindica).toBeGreaterThan(-1)
        expect(reivindica).toBeLessThan(n.indexOf("agendarNota(cfg"))
        expect(n).toContain("reivindica.is('nfse_para', null) : reivindica.eq('nfse_para', linha.nfse_para)")
        expect(n.indexOf("if (!minha?.length) return")).toBeLessThan(n.indexOf("agendarNota(cfg"))
        const falha = n.slice(n.indexOf("if (!r.ok) {"), n.indexOf("ctx.n.notas += 1"))
        expect(falha).toContain("if (r.status < 400 || r.status >= 500) {")
        expect(falha).toContain("console.error('billing-daily: NFS-e incerta, confira no painel antes de emitir'")
        expect(falha.indexOf("update({ nfse_para: linha.nfse_para })")).toBeGreaterThan(falha.indexOf("r.status >= 500"))
        expect(falha).toContain(".eq('nfse_para', ref)")
    })

    it("C1 / Ruling 17: a fatura do checkout só segura a renovação se o parcelamento dela nunca ativou", () => {
        const f = fonte(DIARIO)
        const c = funcao(f, "faturaPagaDoCheckout")
        const busca = c.indexOf("buscarCobranca(cfg, linha.checkout_ref)")
        const registro = c.indexOf(".from('billing_parcelamentos')", busca)
        const pendente = c.indexOf("checkoutPendente(r.dados, linha.provider_ref, registro)")
        expect(busca).toBeGreaterThan(-1)
        expect(registro).toBeGreaterThan(busca)
        expect(pendente).toBeGreaterThan(registro)
        const r = funcao(f, "renovar")
        expect(r.indexOf("criarCobranca(cfg")).toBeGreaterThan(r.indexOf("faturaPagaDoCheckout(ctx, cfg, linha)"))
        expect(f).not.toMatch(/r\.dados\.status === 'CONFIRMED'/)
    })

    it("I2: a fatura do checkout paga sem o webhook é aplicada pelo cron, na renovação e antes de expirar o past_due", () => {
        const f = fonte(DIARIO)
        const r = funcao(f, "renovar")
        const paga = r.slice(r.indexOf("if (paga) {"), r.indexOf("listarCobrancasAbertas(cfg"))
        expect(paga).toContain("aplicarPagamento(ctx, linha, paga, gravar)")
        expect(paga).not.toContain("criarCobranca(")
        // a gravação da renovação existe antes da fatura paga, condicional à reivindicação desta chamada
        expect(r.indexOf("const gravar = async")).toBeLessThan(r.indexOf("faturaPagaDoCheckout(ctx, cfg, linha)"))
        const e = funcao(f, "expirar")
        const confere = e.indexOf("if (linha.status === 'past_due' && linha.checkout_ref && ctx.cfg) {")
        const aplica = e.indexOf("if (await aplicarPagamento(ctx, linha, paga, gravar)) return")
        const expira = e.indexOf("status: 'expired'")
        expect(confere).toBeGreaterThan(-1)
        expect(aplica).toBeGreaterThan(confere)
        expect(expira).toBeGreaterThan(aplica)
        // o Asaas fora do ar adia o fim; nunca expira um plano que pode estar pago
        expect(e.slice(confere, aplica)).toContain("if (paga && 'falha' in paga) return erro(")
        expect(e.slice(0, confere)).toContain(".eq('updated_at', linha.updated_at)")
    })

    it("C1: o marcarAtivado cria o registro que faltou, já ativado, antes de marcar", () => {
        const m = funcao(fonte(DIARIO), "marcarAtivado")
        const upsert = m.indexOf(".upsert({ installment: parcelamento, subscription_id: linhaId, ativado_em: ctx.iso }")
        expect(upsert).toBeGreaterThan(-1)
        expect(m).toContain("onConflict: 'installment'")
        expect(m).toContain("ignoreDuplicates: true")
        expect(m.indexOf(".is('ativado_em', null)")).toBeGreaterThan(upsert)
        expect(fonte(DIARIO)).not.toMatch(/marcarAtivado\(ctx, [^,)]+\)/)
    })

    it("I4 / Ruling 26: 401/403/408/429 da cobrança por token soltam a tentativa, sem aviso nem past_due; 5xx espera", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        const solta = r.indexOf("if (!cobranca.ok && resultado === 'soltar') return await soltar('cobrança por token', cobranca.status, cobranca.erros)")
        expect(solta).toBeGreaterThan(r.indexOf("const resultado = resultadoDaCobranca(cobranca)"))
        expect(solta).toBeLessThan(r.indexOf("if (cobranca.ok || resultado !== 'recusada') {"))
        expect(solta).toBeLessThan(r.indexOf("falhaNaRenovacao(linha, agora)", r.indexOf("criarCobranca(cfg")))
        // o soltar loga (console.error pelo erro) e devolve a data de antes, condicional à reivindicação
        const soltar = r.slice(r.indexOf("const soltar = async"), r.indexOf("const gravar = async"))
        expect(soltar).toContain("erro(ctx, onde, linha.id")
        expect(soltar).toContain("update({ checkout_criado_em: linha.checkout_criado_em })")
        expect(soltar).toContain(".eq('checkout_criado_em', iso)")
        const regra = fonte("supabase/functions/_shared/billing.ts")
        expect(regra).toContain("if ([401, 403, 408, 429].includes(r.status)) return 'soltar'")
        expect(regra).not.toMatch(/r\.status >= 500\) return 'soltar'/)
    })

    it("I1 / Ruling 18: só o resultado 'recusada' (4xx) vira past_due e aviso do cartão", () => {
        const r = funcao(fonte(DIARIO), "renovar")
        const espera = r.indexOf("if (cobranca.ok || resultado !== 'recusada') {")
        expect(r.slice(espera, r.indexOf("return", espera))).toContain("aguardandoConfirmacao(linha)")
        expect(r.indexOf("falhaNaRenovacao(linha, agora)", r.indexOf("criarCobranca(cfg"))).toBeGreaterThan(espera)
        expect(r).not.toContain("cobranca.incerto")
    })

    it("I2 / Ruling 19: a renovação em espera há mais de 1 dia é conferida no Asaas", () => {
        const f = fonte(DIARIO)
        expect(funcao(f, "renovarAssinaturas")).toContain("else if (acao === 'verificar') await verificar(ctx, linha)")
        const v = funcao(f, "verificar")
        const lista = v.indexOf("listarCobrancasDesde(cfg, linha.id, desde)")
        const veredito = v.indexOf("vereditoDaEspera(r.dados, linha.provider_ref, desde)")
        expect(lista).toBeGreaterThan(-1)
        expect(veredito).toBeGreaterThan(lista)
        expect(v).toContain("if (!r.ok) return erro(")
        expect(v).toContain("if (veredito.tipo === 'pendente') return")
        const fimDaPaga = v.indexOf("const falha = falhaNaRenovacao(linha, agora)")
        expect(fimDaPaga).toBeGreaterThan(v.indexOf("if (veredito.tipo === 'paga') {"))
        const paga = v.slice(v.indexOf("if (veredito.tipo === 'paga') {"), fimDaPaga)
        expect(paga).toContain("aplicarPagamento(ctx, linha, p, gravar)")
        const nenhuma = v.slice(fimDaPaga)
        expect(nenhuma).toContain("falhaNaRenovacao(linha, agora)")
        expect(nenhuma).toContain("checkout_criado_em: iso, checkout_url: null")
        expect(nenhuma).toContain("avisar(ctx, linha, 'cartao', AVISOS.cartao({ ...linha, ...falha }))")
        expect(v).toContain(".eq('updated_at', linha.updated_at)")
        expect(v).toContain(".eq('grace_until', linha.grace_until!)")
        expect(v).not.toContain("criarCobranca(")
    })

    it("I4 / Ruling 16: o reembolso concluído pelo cron avisa, uma vez por parcelamento", () => {
        const s = funcao(fonte(DIARIO), "refazerEstornos")
        const ramo = s.slice(s.indexOf("if (textoDoEstornoConcluido(p, linha) === 'reembolso')"), s.indexOf("tipo: 'estorno'"))
        const aviso = ramo.indexOf("avisarFixo(ctx, { user_id: linha.user_id, tipo: 'reembolso', referencia: p.installment })")
        expect(aviso).toBeGreaterThan(ramo.indexOf("status: 'expired'"))
    })

    it("I5 / Ruling 21: a NFS-e passa pelo notaPendente, com o estorno do registro", () => {
        const n = funcao(fonte(DIARIO), "emitirNotas")
        const registro = n.indexOf(".select('estorno_status')")
        const pendente = n.indexOf("if (!notaPendente(linha, registro, ctx.agora)) return")
        expect(registro).toBeGreaterThan(-1)
        expect(pendente).toBeGreaterThan(registro)
        expect(n.indexOf("agendarNota(cfg")).toBeGreaterThan(pendente)
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-daily\]\s*\nverify_jwt = false/)
    })
})

describe("entrega essencial", () => {
    it("deliverNotification pula o interruptor do tipo e usa canaisDoAviso", () => {
        const f = fonte("supabase/functions/_shared/deliver-notification.ts")
        expect(f).toContain("essencial?: boolean")
        expect(f).toContain("canaisDoAviso(prefs, essencial)")
        expect(f).toMatch(/!skipTypePref && !essencial && !isTypeAllowedForPrefs/)
    })
})

const CHECKOUT = "supabase/functions/billing-checkout/index.ts"

describe("Edge billing-checkout", () => {
    it("recusa o convidado antes de qualquer chamada ao Asaas", () => {
        const f = fonte(CHECKOUT)
        const guest = f.indexOf(".eq('role', 'guest')")
        expect(guest).toBeGreaterThan(-1)
        expect(f).toContain("Seu acesso vem de quem te convidou. Peça para essa pessoa cuidar do plano.")
        expect(f.indexOf("criarCliente(cfg")).toBeGreaterThan(guest)
        expect(f.indexOf("criarCobranca(cfg")).toBeGreaterThan(guest)
        expect(f.indexOf("planoDoCheckout(")).toBeGreaterThan(guest)
    })

    it("o CORS inclui x-app-session-id e o erro solto volta com CORS", () => {
        const f = fonte(CHECKOUT)
        expect(f).toMatch(/'Access-Control-Allow-Headers': '[^']*x-app-session-id[^']*'/)
        expect(f).toContain("return json(500, { error: internalError('billing-checkout', e) })")
        expect(f).toContain("bearerJwt(req.headers.get('Authorization'))")
        expect(f).toContain("getAuthUserFromJwt(")
    })

    it("o CPF não vai a log, a tabela nem a resposta", () => {
        const f = fonte(CHECKOUT)
        const linhas = f.split("\n")
        for (const l of linhas.filter((l) => /console\.|internalError\(/.test(l))) expect(l).not.toMatch(/cpf/i)
        for (const l of linhas.filter((l) => /json\(\d+/.test(l))) expect(l.slice(l.search(/json\(\d+/)).replace("CPF inválido.", "")).not.toMatch(/cpf/i)
        for (const l of linhas.filter((l) => /\.(update|upsert|insert)\(/.test(l))) expect(l).not.toMatch(/cpf/i)
        // o CPF só sai pelo criarCliente
        const usos = linhas.filter((l) => /\bcpf\b/.test(l))
        expect(usos.filter((l) => !/let cpf|\{ nome, cpf \}|cpfValido\(cpf\)|criarCliente\(|atualizarCliente\(/.test(l))).toEqual([])
    })

    it("reivindica a linha antes de chamar o Asaas, e nunca a grava sem condição", () => {
        const f = fonte(CHECKOUT)
        const reivindica = f.indexOf(".eq('status', linha.status)")
        expect(reivindica).toBeGreaterThan(-1)
        expect(f.indexOf("criarCliente(cfg")).toBeGreaterThan(reivindica)
        expect(f).toContain(".is('asaas_customer_id', null)")
        // a única gravação sem condição é a da linha que ainda não existe
        expect(f.match(/\.upsert\(/g)?.length).toBe(1)
        expect(f).toContain("ignoreDuplicates: true")
        // a gravação final só vale se a reivindicação ainda é desta chamada
        expect(f.split(".eq('checkout_criado_em', reivindicado)").length - 1).toBeGreaterThanOrEqual(2)
        expect(f).toContain("Seu plano mudou agora. Abra Planos de novo.")
        expect(f).toContain("Estamos tentando renovar com seu cartão. Tente de novo em alguns minutos.")
        // M3: na 1ª compra não há renovação
        const aguardar = f.slice(f.indexOf("if (plano.tipo === 'aguardar') {"), f.indexOf("if (plano.tipo === 'bloqueado')"))
        expect(aguardar.indexOf("if (status === 'pending') {")).toBeLessThan(aguardar.indexOf("Estamos tentando renovar"))
        expect(aguardar).toContain("Estamos confirmando seu pagamento. Tente de novo em alguns minutos.")
        expect(f).toContain("respostaDoEstado(plano, linha.checkout_url, linha.status)")
    })

    it("lista antes de criar: reusa, remove ou espera a confirmação (Ruling 7)", () => {
        const f = fonte(CHECKOUT)
        const lista = f.indexOf("listarCobrancasAbertas(cfg")
        const remove = f.indexOf("removerCobranca(cfg")
        const cria = f.indexOf("criarCobranca(cfg")
        expect(lista).toBeGreaterThan(-1)
        expect(remove).toBeGreaterThan(lista)
        expect(cria).toBeGreaterThan(remove)
        expect(f).toContain("buscarCobranca(cfg, linha.checkout_ref)")
        expect(f).toContain("Seu pagamento está sendo confirmado.")
        // Ruling 17: o checkout_ref de um parcelamento já ativado não responde "sendo confirmado"
        const busca = f.indexOf("buscarCobranca(cfg, linha.checkout_ref)")
        const registro = f.indexOf(".from('billing_parcelamentos')", busca)
        expect(registro).toBeGreaterThan(busca)
        expect(f.indexOf("checkoutPendente(r.dados, linha.provider_ref, registro)")).toBeGreaterThan(registro)
        expect(f.indexOf("Seu pagamento está sendo confirmado.")).toBeGreaterThan(f.indexOf("checkoutPendente(r.dados"))
        expect(f).toContain("triagemDasAbertas(")
    })

    it("a cobrança que falhou, incerta ou não, solta a linha e volta 502", () => {
        const f = fonte(CHECKOUT)
        const falha = f.slice(f.indexOf("if (!cobranca.ok)"), f.indexOf("if (!cobranca.ok)") + 200)
        expect(falha).toContain("await soltar()")
        expect(falha).toContain("SEM_RESPOSTA()")
    })

    it("não manda dado de cartão e nem token: o cartão é digitado na fatura", () => {
        const f = fonte(CHECKOUT)
        expect(f).not.toContain("creditCard")
        expect(f).not.toMatch(/token:/)
    })

    it("grava o IP do x-forwarded-for e o link da fatura", () => {
        const f = fonte(CHECKOUT)
        expect(f).toContain("req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 45)")
        expect(f).toContain("onConflict: 'user_id'")
        expect(f).toContain("...(ip ? { ultimo_ip: ip } : {})")
        expect(f).toContain("checkout_url: url")
        expect(f).toContain("referencia: linha.id")
        expect(f).toContain("retorno: `${appBase}/plans?pago=1`")
        expect(f).toContain("vencimento: formatYmd(appTodayYmd())")
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-checkout\]\s*\nverify_jwt = false/)
    })
})

const WEBHOOK = "supabase/functions/asaas-webhook/index.ts"

/** Cada chamada `console.…(…)` inteira, com os argumentos em várias linhas. */
function chamadasDeLog(f: string): string[] {
    const chamadas: string[] = []
    for (const m of f.matchAll(/console\.\w+\(|internalError\(/g)) {
        let fundo = 0
        let fim = m.index!
        for (; fim < f.length; fim++) {
            if (f[fim] === "(") fundo++
            else if (f[fim] === ")" && --fundo === 0) break
        }
        chamadas.push(f.slice(m.index!, fim + 1))
    }
    return chamadas
}

/** O corpo de uma função de topo do arquivo, até a próxima. */
function funcao(f: string, nome: string): string {
    const inicio = f.indexOf(`async function ${nome}(`)
    expect(inicio, nome).toBeGreaterThan(-1)
    const proxima = f.indexOf("\nasync function ", inicio + 1)
    return f.slice(inicio, proxima === -1 ? undefined : proxima)
}

describe("Edge asaas-webhook", () => {
    it("confere o token do Asaas antes de tocar no banco, e só o token errado volta 401", () => {
        const f = fonte(WEBHOOK)
        const token = f.indexOf("secretMatches(Deno.env.get('ASAAS_WEBHOOK_TOKEN'), req.headers.get('asaas-access-token'))")
        expect(token).toBeGreaterThan(-1)
        expect(f.indexOf("from(")).toBeGreaterThan(token)
        expect(f.indexOf("createClient(")).toBeGreaterThan(token)
        expect(f.match(/json\(401/g)?.length).toBe(1)
        expect(f).toContain("lerCorpo(req, 65536)")
        expect(f).not.toContain("Access-Control-Allow-Origin")
    })

    it("grava o evento antes de mudar a linha, e o repetido volta 200", () => {
        const f = fonte(WEBHOOK)
        const evento = f.indexOf(".from('billing_events').insert(")
        const linha = f.indexOf(".from('billing_subscriptions').update(")
        expect(evento).toBeGreaterThan(-1)
        expect(linha).toBeGreaterThan(evento)
        expect(f).toContain("'23505'")
        expect(f).toContain("repetido: true")
    })

    it("ignora com 200 o cliente diferente do da linha, e decide pelo efeitoDoEvento", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain("if (!linha || !eventoDaLinha(linha, payment)) return ignorado('linha')")
        expect(f).not.toContain("payment.customer !== linha.asaas_customer_id")
        expect(f).toContain("efeitoDoEvento(")
        // N1: a guarda vem antes do registro da Ruling 15 e de todo estorno
        const tratar = funcao(f, "tratar")
        const guarda = tratar.indexOf("eventoDaLinha(linha, payment)")
        expect(guarda).toBeLessThan(tratar.indexOf(".insert({ installment: parcelamento, subscription_id: linha.id })"))
        expect(guarda).toBeLessThan(tratar.indexOf("estornar(admin, linha, registro)"))
        const regra = fonte("supabase/functions/_shared/billing.ts")
        expect(regra).toContain("linha.provider === 'asaas' && !!linha.asaas_customer_id && pagamento.customer === linha.asaas_customer_id")
        expect(f).toContain("checkout_url: null")
    })

    it("a gravação da linha é condicional ao estado lido", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain(".eq('updated_at', linha.updated_at)")
        expect(f).toContain(".eq('status', linha.status)")
        expect(f).toContain("for (const col of ['provider_ref', 'current_period_end'] as const)")
        expect(f).toContain("q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])")
    })

    it("Ruling 9: decide pelo registro dos parcelamentos — desconhecido é ignorado, já ativado é mensal", () => {
        const f = fonte(WEBHOOK)
        const tratar = funcao(f, "tratar")
        const registro = tratar.indexOf(".from('billing_parcelamentos')")
        expect(registro).toBeGreaterThan(-1)
        expect(tratar.indexOf("efeitoDoEvento(")).toBeGreaterThan(tratar.indexOf("eventoDaLinha(linha, payment)"))
        expect(tratar).toContain("console.error('asaas-webhook: parcelamento desconhecido'")
        expect(tratar).toContain("ignorado('parcelamento')")
        expect(tratar).toContain("if (registro.ativado_em)")
        // Ruling 15: o desconhecido da própria linha e do próprio cliente entra no registro antes de decidir
        const cliente = tratar.indexOf("eventoDaLinha(linha, payment)")
        const insere = tratar.indexOf(".insert({ installment: parcelamento, subscription_id: linha.id })")
        expect(insere).toBeGreaterThan(cliente)
        expect(insere).toBeGreaterThan(registro)
        expect(insere).toBeLessThan(tratar.indexOf("registro.subscription_id !== linha.id"))
        // C1: o desconhecido só entra quando este evento ativa a linha; senão, log e 200, sem registro
        expect(tratar.indexOf("const mudanca = efeitoDoEvento(event, payment, linha, agora)")).toBeLessThan(insere)
        const guarda = tratar.slice(tratar.indexOf("if (!registro) {"), insere)
        expect(guarda).toContain("if (!mudanca) {")
        expect(guarda).toContain("console.error('asaas-webhook: parcelamento desconhecido'")
        expect(guarda).toContain("return ignorado('parcelamento')")
        // ativar marca o ativado_em, e o evento do provider_ref cria o registro que faltou (C1)
        expect(tratar).toContain("await marcarAtivado(admin, parcelamento, linha.id)")
        expect(tratar).toContain("await marcarAtivado(admin, mudanca.provider_ref, linha.id)")
        const m = funcao(f, "marcarAtivado")
        const upsert = m.indexOf(".upsert({ installment: parcelamento, subscription_id: linhaId, ativado_em: agora }")
        expect(upsert).toBeGreaterThan(-1)
        expect(m).toContain("onConflict: 'installment'")
        expect(m).toContain("ignoreDuplicates: true")
        expect(m.indexOf(".is('ativado_em', null)")).toBeGreaterThan(upsert)
    })

    it("Ruling 25: o evento entra sem processado_em e só é marcado depois do tratamento", () => {
        const f = fonte(WEBHOOK)
        const corpo = f.slice(f.indexOf("Deno.serve("), f.indexOf("async function tratar("))
        const insere = corpo.indexOf(".from('billing_events').insert({ id, tipo: event })")
        const trata = corpo.indexOf("await tratar(admin, event, payment")
        const marca = corpo.indexOf(".update({ processado_em: new Date().toISOString() })")
        expect(insere).toBeGreaterThan(-1)
        expect(trata).toBeGreaterThan(insere)
        expect(marca).toBeGreaterThan(trata)
        expect(corpo).not.toMatch(/insert\(\{[^}]*processado_em/)
        // a marca que falha só loga: o evento já foi tratado
        expect(corpo.slice(marca)).toContain("console.error('asaas-webhook: marcar o evento'")
    })

    it("Ruling 25: o repetido processado é 200; parado há mais de 5 min é retomado; em andamento é 503", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain("const EVENTO_EM_ANDAMENTO_MS = 5 * 60 * 1000")
        const corpo = f.slice(f.indexOf("Deno.serve("), f.indexOf("async function tratar("))
        const repetido = corpo.slice(corpo.indexOf("if (insErr) {"), corpo.indexOf("const esquecer"))
        expect(repetido).toContain(".select('recebido_em, processado_em')")
        const processado = repetido.indexOf("if (ev?.processado_em) return json(200, { ok: true, repetido: true })")
        const andamento = repetido.indexOf("Date.now() - new Date(ev.recebido_em).getTime() < EVENTO_EM_ANDAMENTO_MS")
        const toma = repetido.indexOf(".update({ recebido_em: new Date().toISOString() })")
        expect(processado).toBeGreaterThan(-1)
        expect(andamento).toBeGreaterThan(processado)
        expect(toma).toBeGreaterThan(andamento)
        expect(repetido.slice(andamento, toma)).toContain("return json(503")
        // a retomada é condicional: só um processo toma o evento parado
        expect(repetido).toContain(".eq('recebido_em', ev.recebido_em)")
        expect(repetido).toContain(".is('processado_em', null)")
        expect(repetido.slice(toma)).toContain("if (!tomei?.length) return json(503")
        // o esquecer do erro de banco nunca apaga um evento já processado
        expect(f).toContain(".from('billing_events').delete().eq('id', evento).is('processado_em', null)")
    })

    it("o erro de banco apaga o evento e volta 500, para o Asaas tentar de novo", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain(".from('billing_events').delete()")
        expect(f).toContain("await esquecer(id)")
        expect(f).toContain("json(500")
    })

    it("Ruling 8 e 10: estorna só depois do pagamentoEmDobro, lê o parcelamento antes, e nunca volta 500", () => {
        const f = fonte(WEBHOOK)
        const dobro = f.indexOf("pagamentoEmDobro(")
        expect(dobro).toBeGreaterThan(-1)
        expect(f.indexOf("estornarNoAsaas(cfg")).toBeGreaterThan(dobro)
        expect(f).toContain("payment.installment !== linha.provider_ref")
        const estornar = funcao(f, "estornar")
        // um problema no estorno fica pendente para o billing-daily, e a fila segue
        expect(estornar).not.toContain("json(500")
        expect(estornar).not.toContain("esquecer(")
        expect(estornar).toContain("estorno_status: 'pendente'")
        expect(estornar).toContain("estorno_status: 'feito'")
        expect(estornar).toContain(".is('estorno_status', null)")
        expect(estornar.indexOf("estorno_status: 'pendente'")).toBeLessThan(estornar.indexOf("estornarNoAsaas(cfg"))
        expect(estornar.indexOf("avisarUmaVez(admin, { user_id: linha.user_id, tipo: 'estorno', referencia: parcelamento })")).toBeGreaterThan(estornar.indexOf("estorno_status: 'feito'"))
    })

    it("o aviso do estorno passa pela reivindicação compartilhada (#87)", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain("import { avisarUmaVez } from '../_shared/aviso-de-cobranca.ts'")
        expect(f).not.toContain("deliverNotification(")
        expect(f).not.toContain("'personal'")
        expect(f).not.toContain("avisarDoEstorno")
        const billing = fonte("supabase/functions/_shared/billing.ts")
        expect(billing).toContain("Cobrança em dobro devolvida")
        expect(billing).toContain("Recebemos um pagamento a mais pelo plano e já pedimos o estorno ao Asaas. O valor volta para o cartão em até 10 dias úteis.")
    })

    it("o CPF não vai a log", () => {
        const chamadas = chamadasDeLog(fonte(WEBHOOK))
        expect(chamadas.length).toBeGreaterThan(5)
        for (const c of chamadas) expect(c).not.toMatch(/cpf/i)
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.asaas-webhook\]\s*\nverify_jwt = false/)
    })
})

describe("Edge billing-checkout registra o parcelamento (Ruling 9)", () => {
    it("grava em billing_parcelamentos o que cria ou reusa, antes de entregar o link", () => {
        const f = fonte(CHECKOUT)
        const registro = f.indexOf(".from('billing_parcelamentos').insert(")
        expect(registro).toBeGreaterThan(f.indexOf("criarCobranca(cfg"))
        expect(registro).toBeLessThan(f.indexOf("checkout_url: url"))
        expect(f).toContain("subscription_id: linha.id")
        expect(f).toContain("reusar.installment")
        expect(f).toContain("cobranca.dados.installment")
    })
})

describe("estorno compartilhado (Ruling 10)", () => {
    it("estornarNoAsaas lê o parcelamento, confere o cliente e só então pede", () => {
        const f = fonte("supabase/functions/_shared/asaas.ts")
        const helper = f.slice(f.indexOf("export async function estornarNoAsaas("))
        const busca = helper.indexOf("buscarParcelamento(cfg")
        expect(busca).toBeGreaterThan(-1)
        expect(helper.indexOf("estado.dados.customer !== cliente")).toBeGreaterThan(busca)
        expect(helper.indexOf("jaEstornado(")).toBeGreaterThan(busca)
        expect(helper.indexOf("estornarParcelamento(cfg")).toBeGreaterThan(helper.indexOf("jaEstornado("))
    })
})

const CANCEL = "supabase/functions/billing-cancel/index.ts"

describe("Edge billing-cancel", () => {
    it("exige o JWT antes de ler o corpo e o banco, com o CORS do app", () => {
        const f = fonte(CANCEL)
        const jwt = f.indexOf("bearerJwt(req.headers.get('Authorization'))")
        expect(jwt).toBeGreaterThan(-1)
        expect(f.indexOf("getAuthUserFromJwt(")).toBeGreaterThan(jwt)
        expect(f.indexOf("lerCorpo(req")).toBeGreaterThan(f.indexOf("getAuthUserFromJwt("))
        expect(f.indexOf("createClient(")).toBeGreaterThan(f.indexOf("getAuthUserFromJwt("))
        expect(f.match(/json\(401/g)?.length).toBe(2)
        expect(f).toContain(".eq('user_id', auth.user.id)")
        expect(f).toMatch(/'Access-Control-Allow-Headers': '[^']*x-app-session-id[^']*'/)
        expect(f).toContain("return json(500, { error: internalError('billing-cancel', e) })")
        expect(f).toContain("Ação desconhecida.")
    })

    it("cancelar: active e past_due, recusa a renovação esperando confirmação (Ruling 11 e 12)", () => {
        const f = fonte(CANCEL)
        const c = funcao(f, "cancelar")
        expect(c).toContain("A renovação deste ano já foi cobrada e está sendo confirmada. Depois de confirmada, você pode cancelar a próxima.")
        expect(c).toContain("Não há assinatura para cancelar.")
        expect(c).toContain(".eq('status', linha.status)")
        expect(c).toContain("for (const col of ['grace_until', 'checkout_criado_em'] as const)")
        expect(c).toContain("q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])")
        expect(c).toContain("podeCancelar(linha, agora)")
        expect(c).toContain("Estamos renovando seu plano agora. Tente cancelar daqui a alguns minutos.")
        expect(funcao(f, "desfazer")).toContain("podeDesfazer(linha, agora)")
    })

    it("reembolsar: podeReembolsar antes de qualquer chamada ao Asaas, e só o provider_ref da linha", () => {
        const r = funcao(fonte(CANCEL), "reembolsar")
        const pode = r.indexOf("podeReembolsar(linha, agora)")
        expect(pode).toBeGreaterThan(-1)
        expect(r.indexOf("configDoAsaas(")).toBeGreaterThan(pode)
        expect(r.indexOf("estornarNoAsaas(cfg, ref, linha.asaas_customer_id)")).toBeGreaterThan(pode)
        expect(r).toContain("const ref = linha?.provider_ref ?? null")
        expect(r).toContain("O prazo de 7 dias para reembolso terminou.")
    })

    it("reembolsar: reivindica o registro antes de pedir, e expira só depois do estorno confirmado", () => {
        const r = funcao(fonte(CANCEL), "reembolsar")
        const reivindica = r.indexOf("estorno_status: 'pendente'")
        const pede = r.indexOf("estornarNoAsaas(cfg")
        const falha = r.indexOf("if (!r.ok)")
        const feito = r.indexOf("estorno_status: 'feito'")
        const expira = r.indexOf("status: 'expired'")
        expect(r).toContain(".is('estorno_status', null)")
        expect(reivindica).toBeLessThan(pede)
        expect(falha).toBeGreaterThan(pede)
        expect(feito).toBeGreaterThan(falha)
        expect(expira).toBeGreaterThan(feito)
        expect(r.match(/status: 'expired'/g)?.length).toBe(1)
        expect(r).toContain(".eq('provider_ref', ref)")
    })

    it("reembolsar: o pedido estourado ou recusado fica pendente e volta 202, sem pedir de novo (Ruling 13)", () => {
        const f = fonte(CANCEL)
        expect(f).toContain("json(202, { ok: true, pendente: true, mensagem: 'Pedimos o reembolso ao Asaas. Avisamos quando ele for confirmado.' })")
        const r = funcao(f, "reembolsar")
        // o pendente responde antes de qualquer chamada ao Asaas
        expect(r.indexOf("registro?.estorno_status === 'pendente'")).toBeLessThan(r.indexOf("estornarNoAsaas(cfg"))
        expect(r.slice(r.indexOf("if (!r.ok)"), r.indexOf("estorno_status: 'feito'"))).not.toContain("status: 'expired'")
    })

    it("reembolsar: nenhuma falha solta a reivindicação, e o toque que perdeu só expira com 'feito' (I1)", () => {
        const r = funcao(fonte(CANCEL), "reembolsar")
        expect(r).not.toContain("estorno_status: null")
        expect(r).not.toContain("json(502")
        const falha = r.slice(r.indexOf("if (!r.ok)"), r.indexOf("estorno_status: 'feito'"))
        expect(falha).toContain("return REEMBOLSO_PEDIDO()")
        expect(falha).not.toContain("etapa ===")
        const perdeu = r.slice(r.indexOf("if (!meu?.length)"), r.indexOf("} else {", r.indexOf("if (!meu?.length)")))
        expect(perdeu).toContain("if (registro?.estorno_status !== 'feito') return REEMBOLSO_PEDIDO()")
        expect(r.indexOf("!== 'feito') return REEMBOLSO_PEDIDO()")).toBeLessThan(r.indexOf("status: 'expired'"))
    })

    it("I4 / Ruling 16: o reembolso concluído por este toque avisa, essencial e deduplicado", () => {
        const f = fonte(CANCEL)
        const r = funcao(f, "reembolsar")
        // o registro que faltou é o parcelamento do plano ativo: nasce ativado, e o cron o lê como reembolso
        expect(r).toContain(".insert({ installment: ref, subscription_id: linha.id, ativado_em: agora.toISOString() })")
        expect(r.indexOf("concluiu = true")).toBeGreaterThan(r.indexOf("estorno_status: 'feito'"))
        // #87: a mesma reivindicação do cron, pendente até a entrega dar certo
        expect(r.indexOf("if (concluiu) await avisarUmaVez(admin, { user_id: linha.user_id, tipo: 'reembolso', referencia: ref }, email)")).toBeGreaterThan(r.indexOf("status: 'expired'"))
        expect(f).toMatch(/import \{[^}]*\bavisarUmaVez\b[^}]*\} from '\.\.\/_shared\/aviso-de-cobranca\.ts'/)
        expect(f).not.toContain("deliverNotification(")
        expect(f).not.toContain("'personal'")
        expect(f).not.toContain(".from('billing_avisos')")
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-cancel\]\s*\nverify_jwt = false/)
    })
})

/** O corpo de uma função exportada, até a próxima declaração de topo. */
function exportada(f: string, nome: string): string {
    const inicio = f.indexOf(`export async function ${nome}(`)
    expect(inicio, nome).toBeGreaterThan(-1)
    const proxima = f.slice(inicio + 1).search(/\n(export |async function |function |const |type )/)
    return f.slice(inicio, proxima === -1 ? undefined : inicio + 1 + proxima)
}

describe("#81: o cliente do Asaas atualizado no checkout", () => {
    it("com o cliente gravado, atualiza nome e CPF antes da cobrança; a falha só registra o status e segue", () => {
        const f = fonte(CHECKOUT)
        const criar = f.indexOf("if (!cliente) {")
        const atualizar = f.indexOf("atualizarCliente(cfg, cliente, { nome: nomeLimpo, cpf, email: auth.user.email ?? null })")
        expect(criar).toBeGreaterThan(-1)
        expect(atualizar).toBeGreaterThan(criar)
        expect(f.slice(criar, atualizar)).toContain("} else {")
        expect(f.indexOf("buscarCobranca(cfg")).toBeGreaterThan(atualizar)
        expect(f.indexOf("criarCobranca(cfg")).toBeGreaterThan(atualizar)
        const falha = f.slice(atualizar, f.indexOf("\n  }\n", atualizar))
        expect(falha).toContain("if (!r.ok) console.error('billing-checkout: atualizarCliente', r.status)")
        expect(falha).not.toContain("return")
        expect(falha).not.toContain("soltar()")
    })

    it("o roteiro manda as migrações até a do Bloco 9 antes das Edges, e lista o módulo novo", () => {
        const r = lerFonte("supabase/BLOCO_8_DEPLOYMENT.md")
        expect(r.match(/até `20261102120000_bloco9\.sql`/g)?.length).toBeGreaterThanOrEqual(2)
        expect(r).toContain("`_shared/aviso-de-cobranca.ts`")
        expect(r).not.toContain("Nenhum módulo antigo do `_shared` mudou")
    })

    it("o verbo do Asaas está nas perguntas do §0 do roteiro", () => {
        expect(lerFonte("supabase/BLOCO_8_DEPLOYMENT.md")).toContain("PUT ou POST em `/v3/customers/{id}`?")
    })
})

describe("#87: os avisos de cobrança que não se perdem", () => {
    it("o destino é um só, pela ordem do destinoDoAviso, e sem carteira vai só por e-mail", () => {
        const a = fonte(AVISO)
        const d = exportada(a, "destinoDe")
        expect(d).toContain(".from('workspace_members')")
        expect(d).toContain("destinoDoAviso(")
        expect(d).toContain("auth.admin.getUserById(userId)")
        const e = exportada(a, "enviarAviso")
        expect(e.indexOf("sendEmailResend(")).toBeGreaterThan(e.indexOf("if (destino.workspaceId)"))
        for (const edge of [DIARIO, WEBHOOK, CANCEL]) expect(fonte(edge)).not.toContain("'personal'")
    })

    it("o aviso de texto fixo nasce pendente, e só a entrega que deu certo o marca entregue", () => {
        const a = fonte(AVISO)
        const u = exportada(a, "avisarUmaVez")
        const claim = u.indexOf(".from('billing_avisos').insert({ ...chave, pendente: true })")
        expect(claim).toBeGreaterThan(-1)
        expect(u).toContain("'23505'")
        expect(u.indexOf("entregarPendente(admin, chave, email)")).toBeGreaterThan(claim)
        const p = exportada(a, "entregarPendente")
        const envio = p.indexOf("enviarAviso(admin, chave.user_id, destino, aviso)")
        expect(envio).toBeGreaterThan(-1)
        expect(p.indexOf("update({ pendente: false })")).toBeGreaterThan(envio)
        // a falha não libera a reivindicação: o billing-daily reenvia
        expect(a).not.toContain(".delete()")
    })

    it("o billing-daily reenvia os pendentes com mais de 1 hora, reivindicando pelo enviado_em lido", () => {
        const f = fonte(DIARIO)
        const r = funcao(f, "reenviarAvisos")
        expect(r).toContain("new Date(ctx.agora.getTime() - UMA_HORA_MS).toISOString()")
        expect(r).toContain("todasAsPaginas<")
        expect(r).toContain(".from('billing_avisos')")
        expect(r).toContain(".eq('pendente', true)")
        expect(r).toContain(".lt('enviado_em', limite)")
        const reivindica = r.indexOf(".update({ enviado_em: ctx.iso })")
        expect(reivindica).toBeGreaterThan(-1)
        expect(r.slice(reivindica)).toContain(".eq('pendente', true)")
        expect(r.slice(reivindica)).toContain(".eq('enviado_em', a.enviado_em)")
        expect(r).toContain("if (!minha?.length) return")
        expect(r.indexOf("entregarPendente(ctx.admin, a)")).toBeGreaterThan(reivindica)
        expect(r).toContain(".in('tipo', TIPOS_DE_AVISO_FIXO)")
        expect(r).not.toContain("avisoFixo(")
    })
})
