import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { opcoesDeModo } from "@/components/settings/carteira-divisao"
import { AINDA_NAO_DISPONIVEL } from "@/lib/projetos/dados"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const carteira = () => semComentarios(lerFonte("src/components/settings/workspace-appearance-settings.tsx"), "tudo")
// O valor passado a `acoes=`, até o fim do `WorkspaceAppearanceEditDialog`.
const acoesDe = (f: string) => f.slice(f.indexOf("acoes={"), f.indexOf("\n            />", f.indexOf("acoes={")))
const FORMULARIOS = ["src/components/settings/carteira-projeto-form.tsx"]

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

    it("Divisão: grava só o que mudou, no Salvar do Editar carteira", () => {
        const f = lerFonte("src/components/settings/carteira-divisao.tsx")
        for (const texto of ["gravarModo", "gravarPesos", "refreshWorkspaces", "chaves.pesos", "chaves.saldos", "NADA_MUDOU", "lerPeso", "<TabsList", "<FormInput"]) expect(f).toContain(texto)
        expect(f).not.toContain("<input")
        const dialogo = semComentarios(lerFonte("src/components/settings/workspace-appearance-edit-dialog.tsx"), "tudo")
        // Pesos inválidos param antes de gravar o nome; a divisão grava depois dele.
        expect(dialogo.indexOf("divisao?.validar()")).toBeLessThan(dialogo.indexOf("await updateWorkspace("))
        expect(dialogo.indexOf("await updateWorkspace(")).toBeLessThan(dialogo.indexOf("await divisao.salvar()"))
        expect(dialogo).toContain("<CamposDaDivisao divisao={divisao} />")
        expect(dialogo).toContain("<DialogFooter start={rodapeInicio}>")
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
        const pagina = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
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
        expect(f).toContain("export function WorkspaceAppearanceSettings() {")
        expect(f).not.toContain("actions=")
        expect(f.match(/<Card padding="none">/g)).toHaveLength(2) // o do esqueleto e o da seção
        expect(f).not.toContain("Vale para todos")
    })

    it("a divisão mora no Editar; Datas abre o diálogo dela", () => {
        const f = carteira()
        expect(f.match(/<SettingsLink/g)).toHaveLength(1)
        expect(f).not.toContain("CarteiraDivisaoDialog")
        expect(f).toContain("divisao={podeDivisao && splitMode !== undefined ? divisao : undefined}")
        // A divisão só é lida com o Editar aberto.
        expect(f).toContain("useDivisaoEditavel(dialogOpen && podeDivisao && splitMode !== undefined ? currentWorkspace : null)")
        expect(f).toContain("setDatasOpen(true)")
        expect(f).toContain("<CarteiraProjetoForm")
    })

    it("trocar de carteira fecha todos os diálogos", () => {
        expect(carteira()).toMatch(
            /setDeleteOpen\(false\)[\s\S]*setLeaveOpen\(false\)[\s\S]*setDatasOpen\(false\)[\s\S]*?\[currentWorkspace\?\.id\]\)/,
        )
    })

    it("Editar e Alterar só para o dono; Divisão fora da pessoal, Datas só em projeto", () => {
        const f = carteira()
        expect(f).toMatch(/owner \? \(\s*<Button[^>]*variant="tertiary"[^>]*onClick=\{openEdit\}/)
        expect(f).not.toContain("DropdownMenu")
        expect(f).not.toContain("EllipsisVerticalIcon")
        // Toda carteira divide e convida; a primeira só não se apaga.
        expect(f).toMatch(/podeDivisao = owner$/m)
        expect(f).toContain("owner && currentWorkspace && !isPrimeira")
        expect(f).toMatch(/podeDatas = owner && currentWorkspace\?\.purpose === "project"/)
        const acoes = acoesDe(f)
        expect(acoes).toMatch(/\{podeDatas \? \(/)
        expect(acoes).toContain('titulo="Datas e orçamento"')
        // Um diálogo aberto não sobrevive a perder a permissão.
        expect(f).toContain("open={datasOpen && podeDatas}")
    })

    it("Divisão ainda indisponível não tem Alterar", () => {
        expect(carteira()).toMatch(/splitMode === undefined \? \(\s*<SettingsRow titulo="Divisão" descricao=\{AINDA_NAO_DISPONIVEL\} \/>/)
        expect(carteira()).toContain("AINDA_NAO_DISPONIVEL")
    })

    it("Excluir mora no acoes do Editar; Sair fica no cartão, só para quem não é dono", () => {
        const f = carteira()
        expect(f).toMatch(/rodapeInicio=\{\s*canDeleteProject \?[\s\S]*Excluir carteira/)
        expect(f.replace(acoesDe(f), "")).toMatch(/!owner \?[\s\S]*Sair da carteira/)
        expect(acoesDe(f)).not.toContain("Sair da carteira")
    })
})

describe("Achados da revisão final", () => {
    it("Divisão: pesos antes do modo, e erro de carga visível", () => {
        const f = semComentarios(lerFonte("src/components/settings/carteira-divisao.tsx"), "tudo")
        expect(f.indexOf("await gravarPesos(")).toBeLessThan(f.indexOf("await gravarModo("))
        expect(f).toContain("erroAdultos || pesos.isError")
        expect(f).toContain("Não foi possível carregar a divisão.")
        expect(semComentarios(lerFonte("src/lib/divisao/use-adultos.ts"), "tudo")).toContain("erro: q.isError")
    })

    it("Notificações: sem preferências não há chaves, sem carteira só o título", () => {
        const f = semComentarios(lerFonte("src/components/settings/notification-preferences.tsx"), "tudo")
        expect(f).toContain("!showSkeleton && currentWorkspaceId ?")
        expect(f).toContain("{prefs ? (")
    })

    it("Carteira: Alterar com nome acessível próprio", () => {
        const f = carteira()
        expect(f).toContain('aria-label="Alterar datas e orçamento"')
    })
})

describe("opcoesDeModo", () => {
    const dividida = (partes: boolean, modo: "pooled" | "split") =>
        opcoesDeModo(partes, modo).find((m) => m.value === "split") as { disabled?: boolean; description: string }

    it("trava Dividida sem as partes no banco", () => {
        expect(dividida(false, "pooled").disabled).toBe(true)
        expect(dividida(false, "pooled").description).toBe(AINDA_NAO_DISPONIVEL)
    })

    it("solta com as partes no banco", () => {
        expect(dividida(true, "pooled").disabled).toBeUndefined()
    })

    it("a carteira que já divide continua podendo", () => {
        expect(dividida(false, "split").disabled).toBeUndefined()
    })

    it("nunca trava o Pote único", () => {
        expect(opcoesDeModo(false, "pooled").find((m) => m.value === "pooled")).not.toHaveProperty("disabled")
    })
})

describe("O topo da Carteira", () => {
    it("não veste capa nem marca: a cor fica só no ladrilho", () => {
        const f = carteira()
        expect(f).not.toContain("brand-field")
        expect(f).not.toContain("<ColorTile")
    })
})
