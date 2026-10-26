import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const DIARIO = "supabase/functions/billing-daily/index.ts"

describe("Edge billing-daily", () => {
    it("só o cron chama, pelo x-cron-secret", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))")
        expect(f).toContain("return json(401")
    })

    it("lê o enforced_since antes de pedir os avisos, e desligado pula", () => {
        const f = fonte(DIARIO)
        const config = f.indexOf(".from('billing_settings')")
        expect(config).toBeGreaterThan(-1)
        expect(f.indexOf("avisos_de_teste_pendentes")).toBeGreaterThan(config)
        expect(f).toContain("pulado: 'desligado'")
    })

    it("o aviso é essencial, do tipo system, com o link para os planos", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("essencial: true")
        expect(f).toContain("type: 'system'")
        expect(f).toContain("metadata: { href: '/plans' }")
        expect(f).toContain("avisoDoTeste(")
    })

    it("o dedupe 'teste' é liberado quando a entrega falha", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("tipo: 'teste'")
        expect(f).toContain(".from('billing_avisos')")
        expect(f).toContain("claimDedupe(")
        expect(f).toContain("releaseDedupe(")
        expect(f).toContain("forEachLimit(")
        expect(f).toContain("FAN_OUT_CONCURRENCY")
        // a falha de entrega e a exceção liberam o dedupe
        expect(f.split("await releaseDedupe(admin, dedupe)").length - 1).toBe(2)
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
        expect(usos.filter((l) => !/let cpf|\{ nome, cpf \}|cpfValido\(cpf\)|criarCliente\(/.test(l))).toEqual([])
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
        expect(f).toContain("payment.customer !== linha.asaas_customer_id")
        expect(f).toContain("efeitoDoEvento(")
        expect(f).toContain("checkout_url: null")
    })

    it("a gravação da linha é condicional ao updated_at lido", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain(".eq('updated_at', linha.updated_at)")
    })

    it("o erro de banco apaga o evento e volta 500, para o Asaas tentar de novo", () => {
        const f = fonte(WEBHOOK)
        const apaga = f.indexOf(".from('billing_events').delete()")
        expect(apaga).toBeGreaterThan(-1)
        expect(f).toContain("json(500")
    })

    it("Ruling 8: estorna o pagamento em dobro só depois do pagamentoEmDobro, e a falha apaga o evento", () => {
        const f = fonte(WEBHOOK)
        const dobro = f.indexOf("pagamentoEmDobro(")
        const estorno = f.indexOf("estornarParcelamento(cfg")
        expect(dobro).toBeGreaterThan(-1)
        expect(estorno).toBeGreaterThan(dobro)
        expect(f).toContain("installment !== linha.provider_ref")
        const falha = f.slice(estorno, estorno + 600)
        expect(falha).toContain("esquecer(")
        expect(falha).toContain("json(500")
        expect(f).toContain("Cobrança em dobro devolvida")
        expect(f).toContain("Recebemos um pagamento a mais pelo plano e já pedimos o estorno ao Asaas. O valor volta para o cartão em até 10 dias úteis.")
        expect(f).toContain("type: 'system'")
        expect(f).toContain("essencial: true")
        expect(f).toContain("metadata: { href: '/plans' }")
        expect(f).toContain(".eq('type', 'personal')")
    })

    it("o CPF não vai a log", () => {
        const f = fonte(WEBHOOK)
        for (const l of f.split("\n").filter((l) => /console\.|internalError\(/.test(l))) expect(l).not.toMatch(/cpf/i)
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.asaas-webhook\]\s*\nverify_jwt = false/)
    })
})
