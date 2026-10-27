import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"

const MIGRACAO = "20261103140000_mcp_guarda_rpc.sql"
const sql = lerFonte(`supabase/migrations/${MIGRACAO}`).replace(/--.*$/gm, "")

describe(`migração ${MIGRACAO}`, () => {
    it("o token de IA só chama a RPC do parcelado, e não altera nem apaga", () => {
        expect(sql).toMatch(/if not public\.eh_token_de_ia\(\) then\s+return;/)
        expect(sql).toMatch(/metodo in \('PATCH', 'PUT', 'DELETE'\)/)
        expect(sql).toMatch(/caminho like '\/rpc\/%' and caminho <> '\/rpc\/create_workspace_installment_plan'/)
        expect(sql).toMatch(/raise exception 'token_de_ia_somente_leitura' using errcode = '42501'/)
    })

    it("lê as configurações sem erro e roda para todo papel da API", () => {
        expect(sql).toMatch(/current_setting\('request\.method', true\)/)
        expect(sql).toMatch(/current_setting\('request\.path', true\)/)
        expect(sql).toMatch(/security definer\s+set search_path = ''/)
        expect(sql).toContain("grant execute on function public.guarda_do_token_de_ia() to anon, authenticated, service_role;")
    })

    it("é o único db_pre_request do projeto", () => {
        const comPreRequest = readdirSync("supabase/migrations").filter((f) =>
            lerFonte(`supabase/migrations/${f}`).includes("pgrst.db_pre_request"),
        )
        expect(comPreRequest).toEqual([MIGRACAO])
        expect(sql).toContain("alter role authenticator set pgrst.db_pre_request = 'public.guarda_do_token_de_ia';")
        expect(sql).toContain("notify pgrst, 'reload config';")
    })
})
