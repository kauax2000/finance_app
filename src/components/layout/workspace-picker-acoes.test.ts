import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const corpo = () => semComentarios(lerFonte("src/components/layout/workspace-picker-menu-body.tsx"), "tudo")
const seletor = () => semComentarios(lerFonte("src/components/layout/workspace-switcher.tsx"), "tudo")
const acoes = () => semComentarios(lerFonte("src/components/workspace/acoes-da-carteira.tsx"), "tudo")

describe("Ações da carteira no seletor", () => {
    it("a linha da carteira atual leva o ícone de editar ou de sair, irmão do rádio", () => {
        const f = corpo()
        expect(f).toContain("workspace.id === currentWorkspaceId")
        // Dentro da linha, mas irmão do rádio; o `data-menu-row` mantém o respiro entre linhas.
        expect(f).toMatch(/<div key=\{workspace\.id\} data-menu-row className="relative">\s*\{item\}\s*\{editar \? \(\s*<DropdownMenuItem/)
        expect(f).toContain('className={editar || sair ? "pr-10 pointer-coarse:pr-12" : undefined}')
        expect(f).toContain('className="absolute top-1/2 right-1 mt-0! -translate-y-1/2 pointer-coarse:min-h-9"')
        expect(f).toMatch(/aria-label=\{`Editar carteira \$\{workspace\.name\}`\}[\s\S]*?<PencilIcon aria-hidden \/>/)
        expect(f).toMatch(/aria-label=\{`Sair da carteira \$\{workspace\.name\}`\}[\s\S]*?<ArrowRightStartOnRectangleIcon aria-hidden \/>/)
        expect(f).toMatch(/callbacks\.closePicker\(\)\s*editar\(\)/)
        expect(f).toMatch(/callbacks\.closePicker\(\)\s*sair\(\)/)
        expect(f).toContain("editarCarteira?: () => void")
        expect(f).toContain("sairDaCarteira?: () => void")
    })

    it("o seletor monta os diálogos e passa as ações", () => {
        const f = seletor()
        expect(f).toContain("const acoes = useAcoesDaCarteira()")
        expect(f).toContain("{acoes.dialogos}")
        expect(f).toContain("editarCarteira: acoes.editar ?? undefined")
        expect(f).toContain("sairDaCarteira: acoes.sair ?? undefined")
    })

    it("o hook fecha os diálogos ao trocar de carteira, e escolhe a ação pelo dono", () => {
        const f = acoes()
        expect(f).toMatch(/setDeleteOpen\(false\)[\s\S]*setLeaveOpen\(false\)[\s\S]*setDatasOpen\(false\)[\s\S]*?\[currentWorkspace\?\.id\]\)/)
        expect(f).toContain("editar: owner ? openEdit : null")
        expect(f).toContain("sair: !owner ? () => setLeaveOpen(true) : null")
    })
})
