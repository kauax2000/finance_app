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

    it("o relatório do mês sai no dia 1 ou no 2, e a chave rel:{mes} segura a repetição", () => {
        expect(f).toContain("if (hoje.d <= 2) {")
        expect(f).not.toContain("hoje.d === 1")
        expect(f).toContain("chave: `rel:${mes}`")
        // O mês é o anterior nos dois dias: a repetição do dia 2 cai na mesma chave.
        expect(f).toContain("const inicio = inicioDoMes(hoje, 1)")
        expect(f).toMatch(/linhas\.filter\(\(l\) => !gravadas\.has\(chaveDe\(l\)\)\)/)
    })

    it("o prazo do relatório compara o dia de Brasília do pagamento, não o UTC", () => {
        expect(f).toContain("const diaDeBrasilia = (iso: string) => formatYmd(appTodayYmd(new Date(iso)))")
        expect(f).toContain("diaDeBrasilia(c.paid_at) <= dia(c.due_date)")
        expect(f).toContain("diaDeBrasilia(p.paid_at) <=")
        expect(f).not.toContain("dia(c.paid_at)")
        expect(f).not.toContain("dia(p.paid_at)")
    })

    it("a recorrência recebe os nomes das contas e assinaturas ativas, e as contas são lidas sempre", () => {
        expect(f).toContain("const jaCadastrados = [...contas.map((c) => c.name), ...assinaturas.map((s) => s.name)]")
        expect(f).toContain("detectarRecorrencias(lancs, hojeYmd, jaCadastrados)")
        const contas = f.slice(f.indexOf(".from('bills')") - 200, f.indexOf(".from('bills')"))
        expect(contas).not.toContain("sazonal")
    })

    it("uma falha antes do laço do aviso fica no log com os insights sem aviso, e a carteira segue contada", () => {
        const aviso = f.indexOf("await avisar(admin, workspaceId, novos, semana, c)")
        expect(aviso).toBeGreaterThan(-1)
        const antes = f.slice(f.lastIndexOf("try {", aviso), aviso)
        expect(antes).toContain("try {")
        expect(f.slice(aviso, aviso + 400)).toContain("'insights-daily: insights sem aviso'")
    })

    it("o insight nunca vai por e-mail", () => {
        const gate = entrega.slice(entrega.indexOf("const emailAllowed"), entrega.indexOf("if (canais.email"))
        expect(gate).not.toContain("'insight'")
        expect(entrega).toContain("semPush")
        expect(entrega).toMatch(/canais\.push && !semPush/)
    })
})
