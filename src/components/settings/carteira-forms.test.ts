import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const carteira = () => semComentarios(lerFonte("src/components/settings/workspace-appearance-settings.tsx"), "tudo")
const FORMULARIOS = ["src/components/settings/carteira-divisao-dialog.tsx", "src/components/settings/carteira-projeto-form.tsx"]

describe("ymdParaData", () => {
    it("1º de março é 1º de março em qualquer fuso", async () => {
        const { ymdParaData } = await import("./carteira-projeto-form")
        const data = ymdParaData("2026-03-01")
        expect(data?.getDate()).toBe(1)
        expect(data?.getMonth()).toBe(2)
    })

    it("vazio é undefined", async () => {
        const { ymdParaData } = await import("./carteira-projeto-form")
        expect(ymdParaData("")).toBeUndefined()
    })
})

describe("resumoDoCalendario", () => {
    it("sem nada, Sem datas", async () => {
        const { resumoDoCalendario } = await import("./carteira-projeto-form")
        expect(resumoDoCalendario({ starts_on: null, ends_on: null, budget_total: null })).toBe("Sem datas")
        expect(resumoDoCalendario({})).toBe("Sem datas")
    })

    it("as datas gravadas, sem deslocar o dia", async () => {
        const { resumoDoCalendario } = await import("./carteira-projeto-form")
        expect(resumoDoCalendario({ starts_on: "2026-03-01", ends_on: "2026-04-30", budget_total: null })).toBe("01/03/2026 a 30/04/2026")
        expect(resumoDoCalendario({ starts_on: "2026-03-01", ends_on: null })).toBe("01/03/2026 a …")
    })

    it("o orçamento aparece em reais, com ou sem datas", async () => {
        const { resumoDoCalendario } = await import("./carteira-projeto-form")
        expect(resumoDoCalendario({ budget_total: 5000 })).toContain("R$")
        expect(resumoDoCalendario({ starts_on: "2026-03-01", ends_on: "2026-04-30", budget_total: 5000 })).toMatch(/2026 · R\$/)
    })
})

describe("Formulários da Carteira", () => {
    it.each(FORMULARIOS)("%s: design system, sem wireframe nem campo cru", (arquivo) => {
        const fonte = lerFonte(arquivo)
        expect(fonte).toContain("FormSubmit")
        expect(fonte).toContain("FormCancel")
        expect(fonte).toContain("FormError")
        expect(fonte).not.toContain("WireframeBox")
        expect(fonte).not.toContain("<input")
    })

    it("Divisão: grava como o wireframe, só o que mudou, e avisa ao salvar", () => {
        const f = lerFonte("src/components/settings/carteira-divisao-dialog.tsx")
        for (const texto of ["gravarModo", "gravarPesos", "refreshWorkspaces", "chaves.pesos", "chaves.saldos", "NADA_MUDOU", "lerPeso", "toastSuccess", "FormRadioGroup"]) expect(f).toContain(texto)
    })

    it("Datas: o mesmo formulário nas Configurações e na criação", () => {
        const f = semComentarios(lerFonte("src/components/settings/carteira-projeto-form.tsx"), "tudo")
        for (const texto of ["editarCarteiraProjeto", "camposDaCarteiraProjeto", "refreshWorkspaces", "NADA_MUDOU", "DatePicker", "localYmdFromDate", "cancelarLabel"]) expect(f).toContain(texto)
        expect(f).not.toContain("new Date(")
        const criacao = lerFonte("src/components/workspace/project-form-dialog.tsx")
        expect(criacao).toContain("<CarteiraProjetoForm")
        expect(criacao).toContain('cancelarLabel="Agora não"')
        expect(criacao).toContain("key={carteiraDeProjeto.id}")
    })

    it("os wireframes saíram, e a página não os monta", () => {
        const pagina = lerFonte("src/app/(app)/settings/page-client.tsx")
        const divisao = lerFonte("src/components/wireframe/divisao-wireframe.tsx")
        const projetos = lerFonte("src/components/wireframe/projetos-wireframe.tsx")
        for (const fora of ["ModoEPesosDaCarteiraWireframe", "function ModoEPesos", "FormularioDoModo"]) expect(divisao).not.toContain(fora)
        for (const fora of ["DatasDaCarteiraProjetoWireframe", "FormularioDaCarteiraProjeto"]) expect(projetos).not.toContain(fora)
        expect(pagina).not.toContain("Wireframe")
        expect(pagina).toContain("<WorkspaceAppearanceSettings />")
        expect(divisao).toContain('from "@/lib/divisao/use-adultos"')
    })
})

describe("Carteira em linhas", () => {
    it("não recebe children e tudo mora num cartão só, sem ação no cabeçalho", () => {
        const f = carteira()
        expect(f).not.toContain("children")
        expect(f).not.toContain("actions=")
        expect(f.match(/<Card padding="none">/g)).toHaveLength(2) // o do esqueleto e o da seção
        expect(f).toContain("Vale para todos em ${currentWorkspace.name}.")
    })

    it("os dois diálogos abrem por Alterar", () => {
        const f = carteira()
        expect(f.match(/>\s*Alterar\s*</g)).toHaveLength(2)
        expect(f).toContain("setDivisaoOpen(true)")
        expect(f).toContain("setDatasOpen(true)")
        expect(f).toContain("<CarteiraDivisaoDialog")
        expect(f).toContain("<CarteiraProjetoForm")
    })

    it("trocar de carteira fecha todos os diálogos", () => {
        expect(carteira()).toMatch(
            /setDeleteOpen\(false\)[\s\S]*setLeaveOpen\(false\)[\s\S]*setDivisaoOpen\(false\)[\s\S]*setDatasOpen\(false\)[\s\S]*?\[currentWorkspace\?\.id\]\)/,
        )
    })

    it("Editar e Alterar só para o dono; Divisão fora da pessoal, Datas só em projeto", () => {
        const f = carteira()
        expect(f).toMatch(/owner \? \(\s*<Button[^>]*onClick=\{openEdit\}/)
        expect(f).toMatch(/podeDivisao = owner && !isPersonal/)
        expect(f).toMatch(/podeDatas = owner && currentWorkspace\?\.purpose === "project"/)
        expect(f).toMatch(/\{podeDivisao \? \(/)
        expect(f).toMatch(/\{podeDatas \? \(/)
        // Um diálogo aberto não sobrevive a perder a permissão.
        expect(f).toContain("open={divisaoOpen && podeDivisao}")
        expect(f).toContain("open={datasOpen && podeDatas}")
    })

    it("Divisão ainda indisponível não tem Alterar", () => {
        expect(carteira()).toMatch(/splitMode === undefined \? null : \(\s*<Button/)
        expect(carteira()).toContain("AINDA_NAO_DISPONIVEL")
    })

    it("a última linha: excluir, sair, ou nada para o dono da pessoal", () => {
        const f = carteira()
        expect(f).toMatch(/canDeleteProject \?[\s\S]*Excluir carteira[\s\S]*!owner \?[\s\S]*Sair da carteira[\s\S]*: null/)
        expect(f).toContain('variant="destructive"')
    })
})

describe("Achados da revisão final", () => {
    it("Divisão: pesos antes do modo, e erro de carga visível", () => {
        const f = semComentarios(lerFonte("src/components/settings/carteira-divisao-dialog.tsx"), "tudo")
        expect(f.indexOf("await gravarPesos(")).toBeLessThan(f.indexOf("await gravarModo("))
        expect(f).toContain("erro || pesos.isError")
        expect(f).toContain("Não foi possível carregar.")
        expect(semComentarios(lerFonte("src/lib/divisao/use-adultos.ts"), "tudo")).toContain("erro: q.isError")
    })

    it("Notificações: sem preferências não há linhas, sem carteira não há cartão", () => {
        const f = semComentarios(lerFonte("src/components/settings/notification-preferences.tsx"), "tudo")
        expect(f).toContain("!loading && currentWorkspaceId && prefs ?")
        expect(f).toContain("showSkeleton || currentWorkspaceId ?")
    })

    it("Carteira: Alterar com nome acessível próprio", () => {
        const f = carteira()
        expect(f).toContain('aria-label="Alterar divisão"')
        expect(f).toContain('aria-label="Alterar datas e orçamento"')
    })
})
