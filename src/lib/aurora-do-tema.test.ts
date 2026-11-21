import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { AURORA, criarFaixa, mascaraDaAurora, quadrosDaFaixa, quadrosDaMascara } from "./aurora-do-tema"

describe("a aurora da troca de tema", () => {
    it("tem os tempos e o volume aprovados", () => {
        expect(AURORA).toEqual({
            duracao: 1100,
            varredura: 0.6,
            faixa: 0.75,
            opacidade: 0.9,
            easing: "cubic-bezier(0.45, 0, 0.2, 1)",
        })
    })

    it("a máscara é o SVG da borda ondulada, embutido sem aspas duplas nem # cru", () => {
        const m = mascaraDaAurora()
        expect(m.startsWith('url("data:image/svg+xml,')).toBe(true)
        expect(m).toContain("stdDeviation='2.2'")
        expect(m).toContain("M-10 -10H110V122C88 134 72 115 54 126S22 138 -10 125Z")
        const miolo = m.slice('url("'.length, -'")'.length)
        expect(miolo).not.toContain('"')
        expect(miolo).not.toContain("#")
        const invertida = mascaraDaAurora(true)
        expect(invertida).not.toBe(m)
        expect(invertida).toContain("evenodd")
    })

    it("a máscara varre a tela de cima para baixo e para na varredura", () => {
        const q = quadrosDaMascara(1000)
        expect(q).toHaveLength(3)
        expect(q[0].maskPosition).toBe("0 -2320px")
        expect(q[0].easing).toBe(AURORA.easing)
        expect(q[1].offset).toBe(0.6)
        expect(q[1].maskPosition).toBe("0 -120px")
        expect(q[2].maskPosition).toBe("0 -120px")
        for (const k of q) {
            expect(k.maskSize).toBe("100% 2400px")
            expect(k.maskRepeat).toBe("no-repeat")
            expect(k.webkitMaskPosition).toBe(k.maskPosition)
            expect(k.webkitMaskImage).toBe(k.maskImage)
        }
    })

    it("no fim a imagem ainda cobre o topo, e a borda já passou do pé", () => {
        const fim = quadrosDaMascara(1000)[2]
        // A imagem começa em -120px: cobre o topo. A onda (115 a 138 de 240, em 2400px) fica
        // entre 1030 e 1260px: abaixo da tela de 1000.
        expect(fim.maskPosition).toBe("0 -120px")
        const inv = quadrosDaMascara(1000, 0, true)
        expect(inv[0].maskSize).toBe("100% 4800px")
        expect(inv[2].maskPosition).toBe(fim.maskPosition)
    })

    it("deslocada pelo topo do vidro, casa com a página", () => {
        expect(quadrosDaMascara(1000, 40)[1].maskPosition).toBe("0 -160px")
    })

    it("a faixa desce com a borda e some no fim", () => {
        const q = quadrosDaFaixa(1000)
        expect(q[0].transform).toBe("translateY(-750px)")
        expect(q[0].opacity).toBe(0.9)
        expect(q[1].transform).toBe("translateY(587.5px)")
        expect(q[2].opacity).toBe(0)
    })

    it("a faixa é uma só, com nome de transição inline, e sai pela função devolvida", () => {
        // Sem jsdom no projeto: um documento falso com o que `criarFaixa` toca.
        type No = { className: string; style: Record<string, string>; atributos: Record<string, string>; setAttribute(k: string, v: string): void; remove(): void }
        const corpo: No[] = []
        const doc = {
            createElement: () => {
                const no: No = {
                    className: "",
                    style: {},
                    atributos: {},
                    setAttribute(k, v) { no.atributos[k] = v },
                    remove() { corpo.splice(corpo.indexOf(no), 1) },
                }
                return no
            },
            querySelectorAll: (sel: string) => corpo.filter((n) => sel === `.${n.className}`),
            body: { append: (n: No) => corpo.push(n) },
        } as unknown as Document
        criarFaixa(doc, 1000)
        const tirar = criarFaixa(doc, 1000)
        expect(corpo).toHaveLength(1)
        expect(corpo[0].className).toBe("theme-aurora")
        expect(corpo[0].style.viewTransitionName).toBe("theme-aurora")
        expect(corpo[0].atributos["aria-hidden"]).toBe("true")
        expect(corpo[0].style.height).toBe("750px")
        tirar()
        expect(corpo).toHaveLength(0)
    })

    it("a altura vem de quem chama, lida uma vez no toque", () => {
        expect(lerFonte("src/lib/aurora-do-tema.ts")).not.toContain("innerHeight")
    })

    it("o nome de transição da faixa nunca é permanente no CSS", () => {
        expect(lerFonte("src/app/globals.css")).not.toContain("view-transition-name: theme-aurora")
    })
})
