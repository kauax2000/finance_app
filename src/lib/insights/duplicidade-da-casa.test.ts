import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { politicasFinais } from "@/test/migracoes"

// #96: o "Apagar um" do convidado que não enxerga um dos dois lançamentos não
// acontece, porque o insight de duplicidade é da carteira e só o adulto o vê.
describe("a duplicidade é da casa: o convidado não a vê (#96)", () => {
    const daily = semComentarios(lerFonte("supabase/functions/insights-daily/index.ts"))

    it("o insight de duplicidade nasce com user_id nulo", () => {
        expect(daily).toContain("detectarDuplicidades(lancs, duplicidade).map((a) => linha(workspaceId, 'duplicidade', a, a.dataYmd))")
        expect(daily).toContain("return { workspace_id: workspaceId, user_id: null, kind, dedupe_key: chave, payload, dataYmd }")
    })

    it("a leitura do insight da carteira é só do adulto", () => {
        const p = politicasFinais().get("public.insights|insights_select")
        expect(p?.texto).toContain("user_id is null and public.is_workspace_adult(workspace_id)")
    })

    it("o push do insight da carteira vai só aos adultos", () => {
        expect(daily).toContain("const membros = adultosDaCarteira(memberRows ?? [])")
    })
})
