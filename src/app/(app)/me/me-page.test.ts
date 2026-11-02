import { describe, expect, it } from "vitest"
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
        for (const texto of ['id="no-celular"', 'aria-label="Neste celular"', "useLancamentoInteligente", "SyncStatusChip", "InstallPwaSheet", "Digite uma frase no +"]) expect(grupo).toContain(texto)
        expect(grupo.match(/<SettingsTile>/g)).toHaveLength(2)
        expect(grupo).toMatch(/variant="primary"\s+className="w-full"/)
    })
    it("cada linha é um link com ícone mini, nome e chevron", () => {
        expect(PAGINA).toContain("<ItemChevron")
        expect(PAGINA).toContain("miniIconFor(")
        // Nenhum componente declarado na tela (invariante 1): só o default export.
        expect(PAGINA.match(/function \w+\(/g)).toHaveLength(1)
    })
})
