import { describe, expect, it } from "vitest"

import {
    hexParaMatiz,
    MATIZ_PADRAO,
    matizParaHex,
    TRILHO_DE_MATIZ,
    TILE_COLORS,
    TILE_EXPENSE_DEFAULT,
    TILE_INCOME_DEFAULT,
    TILE_PALETTE,
    tileColorFor,
} from "./tile-palette"

/**
 * A dobra é idempotente, e o resto do código assume isso: `ColorTile` a aplica em todos os
 * sítios e a tela de detalhe da categoria a aplica de novo antes do gráfico; sem isso uma cor
 * passaria por duas dobras e sairia em outro matiz.
 */
describe("tileColorFor", () => {
    it("deixa passar o que já é parada da marca, e por isso é idempotente", () => {
        for (const hex of TILE_COLORS) {
            expect(tileColorFor(hex)).toBe(hex)
            expect(tileColorFor(tileColorFor(hex))).toBe(hex)
        }
    })

    it("dobra os 22 presets legados em parada da marca — ou no neutro", () => {
        const LEGADOS = [
            "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
            "#EC4899", "#6366F6", "#14B8A6", "#F97316", "#6B7280",
            "#2563EB", "#7C3AED", "#DB2777", "#DC2626", "#EA580C",
            "#CA8A04", "#16A34A", "#0D9488", "#0891B2", "#4F46E5",
            "#9333EA", "#C026D3",
        ]
        for (const hex of LEGADOS) {
            const saida = tileColorFor(hex)
            // `null` é o ladrilho sem cor, e só o cinza legado chega nele: o
            // matiz de um croma de 0,023 é ruído, e dobrá-lo faria de um cinza
            // deliberado um azul.
            if (hex === "#6B7280") expect(saida).toBeNull()
            else expect(TILE_COLORS).toContain(saida)
            expect(tileColorFor(saida)).toBe(saida)
        }
    })

    it("não toca no que a pessoa escolheu no seletor livre", () => {
        // O seletor da carteira é um `<input type="color">`: qualquer hexadecimal
        // cabe, e nenhum deles é decisão do produto para reescrever.
        for (const meu of ["#123456", "#FFFFFF", "#000000", "#ABCDEF"]) {
            expect(tileColorFor(meu)).toBe(meu)
        }
    })

    it("trata vazio, espaço e ausente como sem cor", () => {
        for (const nada of ["", "   ", null, undefined]) {
            expect(tileColorFor(nada)).toBeNull()
        }
    })

    it("aceita o hexadecimal em qualquer caixa", () => {
        expect(tileColorFor("#10b981")).toBe(tileColorFor("#10B981"))
    })

    it("os padrões de receita e despesa são paradas da paleta", () => {
        expect(TILE_COLORS).toContain(TILE_INCOME_DEFAULT)
        expect(TILE_COLORS).toContain(TILE_EXPENSE_DEFAULT)
        expect(TILE_INCOME_DEFAULT).not.toBe(TILE_EXPENSE_DEFAULT)
    })

    it("as oito paradas são distintas e cobrem o círculo", () => {
        expect(new Set(TILE_COLORS).size).toBe(8)
        const matizes = [...TILE_PALETTE.map((p) => p.matiz)].sort((a, b) => a - b)
        // O espaçamento é o da rampa da marca, e a asserção acusa quem mexer nela sem olhar o
        // seletor de amostras. O menor vão é índigo→violeta, 28°; duas amostras a menos que
        // isso leem como a mesma cor.
        const gaps = matizes.map((m, i) =>
            i === 0 ? m + 360 - matizes[matizes.length - 1]! : m - matizes[i - 1]!
        )
        expect(Math.min(...gaps)).toBe(28)
    })
})

describe("matiz da carteira", () => {
    it("a volta pelo hexadecimal preserva o matiz em todo o círculo", () => {
        for (let h = 0; h < 360; h += 15) {
            const hex = matizParaHex(h)
            expect(hex).toMatch(/^#[0-9a-f]{6}$/)
            const volta = hexParaMatiz(hex)
            const erro = Math.abs(((volta - h + 540) % 360) - 180)
            expect(erro).toBeLessThanOrEqual(3)
        }
    })

    it("cor sem matiz cai no teal padrão, e valor inválido também", () => {
        for (const cinza of ["#808080", "#000000", "#ffffff", "azul", ""]) expect(hexParaMatiz(cinza)).toBe(MATIZ_PADRAO)
    })

    it("o trilho percorre o círculo na claridade e no croma do ladrilho", () => {
        expect(TRILHO_DE_MATIZ).toBe("linear-gradient(to right in oklch longer hue, oklch(0.76 0.2 0), oklch(0.76 0.2 360))")
    })
})
