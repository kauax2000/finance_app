import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { ultimasFuncoes } from "@/test/migracoes"

const capture = () => semComentarios(lerFonte("supabase/functions/capture/index.ts"))

describe("captura: um anexo e um plano por client_id (#95)", () => {
    it("com client_id a foto tem caminho fixo, e o upload que já existe não cria outro anexo", () => {
        const f = capture()
        expect(f).toContain("`${linha.workspace_id}/${clientId ?? crypto.randomUUID()}.${EXTENSAO[foto.mime]}`")
        expect(f).toContain("upsert: false")
        expect(f).toMatch(/if \(jaExiste\(upErr\)\)/)
    })

    it("o 409 só prova o objeto: confere a linha do anexo pelo caminho e, sem ela, a grava sem apagar o objeto", () => {
        const f = capture()
        const ramo = f.slice(f.indexOf("if (jaExiste(upErr))"), f.indexOf("else if (upErr)"))
        expect(ramo).toContain(".eq('path', path)")
        expect(ramo).toContain("gravarAnexo(path)")
        expect(ramo).not.toContain("remove(")
    })

    it("criar_plano_parcelado acha o plano do client_id em qualquer carteira da pessoa", () => {
        const corpo = ultimasFuncoes().get("criar_plano_parcelado")!.texto
        const busca = corpo.slice(corpo.indexOf("pg_advisory_xact_lock"), corpo.indexOf("if v_plan_id is not null"))
        expect(busca).not.toContain("t.workspace_id = p_workspace_id")
        expect(busca).toContain("m.user_id = p_user_id")
    })
})
