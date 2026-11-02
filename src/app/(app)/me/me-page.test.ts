import { describe, expect, it } from "vitest"
import { getVoceGroups } from "@/config/mobile-navigation"
import { lerFonte, semComentarios } from "@/test/fonte"

const PAGINA = semComentarios(lerFonte("src/app/(app)/me/page-client.tsx"))
const ROTA = semComentarios(lerFonte("src/app/(app)/me/page.tsx"))

describe("a página Você", () => {
    it("adia a montagem com o esqueleto da rota", () => {
        expect(ROTA).toContain("<AdiarMontagem fallback={<Loading />}>")
    })
    it("os grupos vêm da regra e das abas que saíram", () => {
        expect(PAGINA).toContain("getVoceGroups(useAbasFora(), useWorkspace().papel)")
        expect(PAGINA).toContain('<VoceAvatar size="xl" />')
    })
    it("o grupo do telefone fecha a página, só abaixo do md, e a âncora do QR rola até ele", () => {
        expect(PAGINA).toContain("{isMobile ? <NesteCelularGrupo /> : null}")
        expect(PAGINA).toContain("rolarAteAncora(window.location.hash, document)")
        const grupo = semComentarios(lerFonte("src/components/settings/neste-celular-grupo.tsx"))
        for (const texto of ['id="no-celular"', ">Neste celular<", "useLancamentoInteligente", "SyncStatusChip", "InstallPwaSheet", "Digite uma frase no +"]) expect(grupo).toContain(texto)
        expect(grupo).not.toContain("SettingsTile")
        expect(grupo).not.toContain("SettingsRow")
        // Com o app instalado a linha some, e a fila pendente segue alcançável.
        expect(grupo).toMatch(/instalado \? \(\s+shell && shell\.pendingSyncCount > 0/)
        expect(grupo).toContain(">Sincronização<")
        expect(grupo).not.toContain("instalado neste aparelho")
        expect(grupo).toMatch(/variant="primary"\s+className="w-full"/)
    })
    it("os grupos têm nome, e Sair pede confirmação e fecha a página", () => {
        expect(PAGINA).toContain("<PageSectionTitle>{grupo.label}</PageSectionTitle>")
        expect(PAGINA).toContain("<AlertDialog")
        expect(PAGINA).toContain("Sair da conta?")
        expect(PAGINA.indexOf("<NesteCelularGrupo")).toBeLessThan(PAGINA.indexOf("signOut()"))
        expect(PAGINA).toContain("grupo.items.length === 0")
        expect(PAGINA).toContain('<VoceAvatar size="xl" />')
    })
    it("Cofre aberto diz o que é, e Cartões abre a carteira", () => {
        expect(PAGINA).toContain("item.description")
        const grupos = getVoceGroups([], "owner")
        expect(grupos[0].items.map((i) => i.name)).toEqual(["Cartões", "Contas a pagar", "Assinaturas", "Projetos", "Membros e convidados"])
        expect(grupos[1].items.find((i) => i.name === "Cofre aberto")?.description).toBe("Seus dados: exportar e apagar")
    })
    it("Neste celular veste as mesmas linhas", () => {
        const grupo = semComentarios(lerFonte("src/components/settings/neste-celular-grupo.tsx"))
        expect(grupo).toContain(">Neste celular<")
        expect(grupo.match(/pointer-coarse:text-base/g)?.length).toBeGreaterThanOrEqual(3)
    })
    it("cada linha é um link com ícone mini, nome e chevron", () => {
        expect(PAGINA).toContain("<ItemChevron")
        expect(PAGINA).toContain("miniIconFor(")
        // Nenhum componente declarado na tela (invariante 1): só o default export.
        expect(PAGINA.match(/function \w+\(/g)).toHaveLength(1)
    })
})
