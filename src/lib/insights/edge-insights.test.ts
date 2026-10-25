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

    it("no máximo 5 novos por carteira, cortados por limitarAchados depois de tirar os já gravados", () => {
        expect(f).toContain("const NOVOS_POR_EXECUCAO = 5")
        const gravadas = f.indexOf("chavesGravadas(admin, workspaceId, linhas)")
        const corte = f.indexOf("limitarAchados(")
        const insert = f.indexOf("rpc('inserir_insights'")
        expect(gravadas).toBeGreaterThan(-1)
        expect(corte).toBeGreaterThan(gravadas)
        expect(insert).toBeGreaterThan(corte)
        expect(f).toContain("NOVOS_POR_EXECUCAO,")
    })

    it("a duplicidade olha só os últimos 30 dias e a partir de R$ 10", () => {
        expect(f).toContain("const DUPLICIDADE_DIAS = 30")
        expect(f).toContain("const DUPLICIDADE_VALOR_MINIMO = 10")
        expect(f).toContain("detectarDuplicidades(lancs, duplicidade)")
    })

    it("só quem tem push ligado e um aparelho inscrito reivindica o teto", () => {
        expect(f).toContain(".from('push_subscriptions')")
        expect(f).toContain("if (prefs.notify_push && inscritos.has(userId)) {")
    })

    it("o insight nunca vai por e-mail", () => {
        const gate = entrega.slice(entrega.indexOf("const emailAllowed"), entrega.indexOf("if (canais.email"))
        expect(gate).not.toContain("'insight'")
        expect(entrega).toContain("semPush")
        expect(entrega).toMatch(/canais\.push && !semPush/)
    })
})
