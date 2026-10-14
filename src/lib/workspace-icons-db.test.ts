import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { WORKSPACE_ICON_KEYS, WORKSPACE_ICON_PICKER_KEYS } from "@/lib/workspace-icons"

/** A chave que o seletor oferece e o banco recusa vira um "Não foi possível criar a carteira". */
describe("ícones de carteira e o CHECK do banco", () => {
    it("a última migração do workspaces_icon_allowed aceita toda chave", () => {
        const dir = "supabase/migrations"
        const ultima = readdirSync(dir)
            .sort()
            .reverse()
            .map((nome) => lerFonte(`${dir}/${nome}`))
            .find((sql) => sql.includes("workspaces_icon_allowed"))!
        for (const key of WORKSPACE_ICON_KEYS) expect(ultima).toContain(`'${key}'`)
    })

    it("o seletor não oferece o haltere que desenhava o raio", () => {
        expect(WORKSPACE_ICON_PICKER_KEYS).not.toContain("dumbbell")
        expect(WORKSPACE_ICON_KEYS).toContain("dumbbell")
    })
})
