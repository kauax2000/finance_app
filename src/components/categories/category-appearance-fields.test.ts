import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TILE_PALETTE } from "@/lib/tile-palette"
import {
    CATEGORY_GRID_ICONS,
    CATEGORY_ICONS,
    CategoryColorSwatches,
    CategoryIconGrid,
    categoryIconComponents,
    normalizeCategoryIcon,
} from "./category-appearance-fields"

describe("aparência da categoria", () => {
    it("a grade não repete desenho", () => {
        const minis = CATEGORY_GRID_ICONS.map((id) => categoryIconComponents[id].mini)
        expect(new Set(minis).size).toBe(minis.length)
    })

    it("ids fora da grade continuam lidos", () => {
        expect(normalizeCategoryIcon("dog")).toBe("dog")
        expect(CATEGORY_ICONS).toContain("dog")
        expect(CATEGORY_GRID_ICONS).not.toContain("dog")
    })

    it("o ícone antigo fora da grade aparece marcado", () => {
        const html = renderToStaticMarkup(
            createElement(CategoryIconGrid, { value: "dog", onChange: () => {} })
        )
        expect(html).toContain('aria-label="Ícone Cachorro"')
    })

    const nona = (value: string) => {
        const html = renderToStaticMarkup(createElement(CategoryColorSwatches, { value, onChange: () => {} }))
        expect(html).toContain('type="color"')
        expect(html).toContain('aria-label="Outra cor"')
        return html.match(/<label[^>]*data-state="(on|off)"/)?.[1]
    }

    it("a cor livre é a nona amostra", () => {
        expect(nona("#123456")).toBe("on")
        expect(nona(TILE_PALETTE[0].hex)).toBe("off")
    })
})
