import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const f = semComentarios(lerFonte("supabase/functions/insights-daily/index.ts"))
const entrega = semComentarios(lerFonte("supabase/functions/_shared/deliver-notification.ts"))

describe("Edge insights-daily", () => {
    it("só o cron chama, pelo x-cron-secret", () => {
        expect(f).toContain("secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))")
        expect(f).toContain("return json(401")
    })

    it("as leituras são paginadas por id em páginas de 1000", () => {
        expect(f).toContain("todasAsPaginas")
        expect(f).toContain(".order('id', { ascending: true })")
        expect(f).toContain(".range(")
    })

    it("grava pela RPC com on conflict do índice, nunca por upsert", () => {
        expect(f).toContain("rpc('inserir_insights'")
        expect(f).not.toContain(".upsert(")
        expect(f).not.toContain(".from('insights').insert(")
    })

    it("reivindica o push antes de entregar, e quem não reivindicou recebe sem push", () => {
        const reivindica = f.indexOf("rpc('reivindicar_push_de_insight'")
        expect(reivindica).toBeGreaterThan(-1)
        expect(f.indexOf("deliverNotification(", reivindica)).toBeGreaterThan(reivindica)
        expect(f).toContain("semPush: !")
        expect(f).toContain("type: 'insight'")
        expect(f).toContain("segundaDaSemana(")
    })

    it("quem silenciou o tipo não recebe o aviso", () => {
        expect(f).toContain(".from('insights_silenciados')")
    })

    it("cada carteira roda num try/catch, em paralelo com teto", () => {
        const laco = f.indexOf("forEachLimit(")
        expect(laco).toBeGreaterThan(-1)
        expect(f.indexOf("try {", laco)).toBeGreaterThan(laco)
        expect(f.indexOf("} catch (e) {", laco)).toBeGreaterThan(laco)
    })

    it("devolve carteiras, novos, push e inApp", () => {
        expect(f).toMatch(/json\(200, \{[^}]*carteiras[^}]*novos[^}]*push[^}]*inApp/)
    })

    it("o insight nunca vai por e-mail", () => {
        const gate = entrega.slice(entrega.indexOf("const emailAllowed"), entrega.indexOf("if (canais.email"))
        expect(gate).not.toContain("'insight'")
        expect(entrega).toContain("semPush")
        expect(entrega).toMatch(/canais\.push && !semPush/)
    })
})
