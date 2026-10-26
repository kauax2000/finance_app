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
        const chamadas = (re: RegExp) => [...f.matchAll(re)].map((m) => m[0])
        for (const c of chamadas(/console\.\w+\([^)]*\)/g)) expect(c).not.toMatch(/cpf/i)
        for (const c of chamadas(/internalError\([^)]*\)/g)) expect(c).not.toMatch(/cpf/i)
        for (const c of chamadas(/json\(\d+, \{[^}]*\}\)/g)) expect(c).not.toMatch(/cpf\b(?! inválido)/i)
        const upsert = f.slice(f.indexOf(".upsert("), f.indexOf("onConflict"))
        expect(upsert).not.toMatch(/cpf/i)
        expect(f.match(/\bcpf\b/g)?.length).toBe(5) // declarar, ler do corpo, validar (2) e mandar ao cliente
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
        expect(f).toContain("checkout_url: cobranca.dados.invoiceUrl")
        expect(f).toContain("retorno: `${appBase}/plans?pago=1`")
        expect(f).toContain("vencimento: formatYmd(appTodayYmd())")
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-checkout\]\s*\nverify_jwt = false/)
    })
})
