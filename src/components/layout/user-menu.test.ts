import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const MENU = semComentarios(lerFonte("src/components/layout/user-menu.tsx"))

describe("o menu do usuário (desktop)", () => {
    it("Editar perfil abre o diálogo, no lugar do link de Minha conta", () => {
        expect(MENU).toContain("Editar perfil")
        expect(MENU).toContain("<EditProfileDialog open={editarAberto}")
        expect(MENU).not.toContain("ROUTES.ACCOUNT")
    })

    it("o diálogo mora fora do menu, para fechar o menu não fechar o diálogo", () => {
        expect(MENU.indexOf("<EditProfileDialog")).toBeGreaterThan(MENU.indexOf("</DropdownMenu>"))
    })
})
