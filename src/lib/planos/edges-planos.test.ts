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
