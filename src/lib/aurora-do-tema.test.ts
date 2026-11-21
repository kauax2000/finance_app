import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import { AURORA, animarAurora, criarFaixa, mascaraDaAurora, quadrosDaFaixa, quadrosDaMascara } from "./aurora-do-tema"

describe("a aurora da troca de tema", () => {
    it("tem os tempos e o volume aprovados", () => {
        expect(AURORA).toEqual({
            duracao: 1100,
            varredura: 0.6,
            faixa: 0.6,
            opacidade: 0.85,
            easing: "cubic-bezier(0.45, 0, 0.2, 1)",
        })
    })

    it("a máscara é o SVG da borda em onda, embutido sem aspas duplas nem # cru", () => {
        const acima = mascaraDaAurora("acima")
        const abaixo = mascaraDaAurora("abaixo")
        expect(acima).not.toBe(abaixo)
        for (const m of [acima, abaixo]) {
            expect(m.startsWith('url("data:image/svg+xml,')).toBe(true)
            expect(m).toContain("viewBox='0 0 200 300'")
            expect(m).toContain("stdDeviation='2.2'")
            expect(m).toContain("Q25 138 50 150 T100 150 T150 150 T200 150")
            const miolo = m.slice('url("'.length, -'")'.length)
            expect(miolo).not.toContain('"')
            expect(miolo).not.toContain("#")
        }
        expect(acima).toContain("V-10H-10Z")
        expect(abaixo).toContain("V310H-10Z")
    })

    it("no escuro a borda desce, deslizando para o lado, e para na varredura", () => {
        const q = quadrosDaMascara(1000, 400, "desce")
        expect(q).toHaveLength(3)
        expect(q[0].maskPosition).toBe("0px -1650px")
        expect(q[0].easing).toBe(AURORA.easing)
        expect(q[1].offset).toBe(0.6)
        expect(q[1].maskPosition).toBe("-320px -350px")
        expect(q[2].maskPosition).toBe("-480px -350px")
        for (const k of q) {
            expect(k.maskImage).toBe(mascaraDaAurora("acima"))
            expect(k.maskSize).toBe("800px 3000px")
            expect(k.maskRepeat).toBe("repeat-x")
            expect(k.webkitMaskPosition).toBe(k.maskPosition)
            expect(k.webkitMaskImage).toBe(k.maskImage)
            expect(k.webkitMaskSize).toBe(k.maskSize)
            expect(k.webkitMaskRepeat).toBe(k.maskRepeat)
        }
    })

    it("no claro a borda sobe", () => {
        const q = quadrosDaMascara(1000, 400, "sobe")
        expect(q[0].maskPosition).toBe("0px -350px")
        expect(q[1].maskPosition).toBe("-320px -1650px")
        expect(q[0].maskImage).toBe(mascaraDaAurora("abaixo"))
    })

    it("no fim a imagem (3 telas) cobre a tela inteira nos dois sentidos", () => {
        for (const sentido of ["desce", "sobe"] as const) {
            const y = Number(String(quadrosDaMascara(1000, 400, sentido)[2].maskPosition).split(" ")[1].replace("px", ""))
            expect(y).toBe(sentido === "desce" ? -350 : -1650)
            expect(y <= 0 && y + 3000 >= 1000).toBe(true)
        }
    })

    it("a foto velha do vidro leva a imagem oposta, deslocada pela caixa dele, sem recorte", () => {
        const q = quadrosDaMascara(1000, 400, "desce", "velho", { x: 20, y: 700 })
        expect(q[0].maskImage).toBe(mascaraDaAurora("abaixo"))
        expect(q[0].maskPosition).toBe("-20px -2350px")
        for (const k of q) {
            expect(k.maskClip).toBe("no-clip")
            expect(k.webkitMaskClip).toBe("no-clip")
        }
        expect(quadrosDaMascara(1000, 400, "desce")[0].maskClip).toBeUndefined()
    })

    it("a faixa anda na frente da borda e some no fim", () => {
        const desce = quadrosDaFaixa(1000, "desce")
        expect(desce[0].transform).toBe("translateY(-660px)")
        expect(desce[0].opacity).toBe(0.85)
        expect(desce[1].transform).toBe("translateY(440px)")
        expect(desce[1].offset).toBe(0.6)
        expect(desce[2].opacity).toBe(0)
        const sobe = quadrosDaFaixa(1000, "sobe")
        expect(sobe[0].transform).toBe("translateY(1060px)")
        expect(sobe[1].transform).toBe("translateY(-40px)")
        expect(sobe[2].opacity).toBe(0)
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
        criarFaixa(doc, 1000, "sobe")
        const tirar = criarFaixa(doc, 1000, "sobe")
        expect(corpo).toHaveLength(1)
        expect(corpo[0].className).toBe("theme-aurora")
        expect(corpo[0].style.viewTransitionName).toBe("theme-aurora")
        expect(corpo[0].atributos["aria-hidden"]).toBe("true")
        expect(corpo[0].style.height).toBe("600px")
        expect(corpo[0].atributos["data-sentido"]).toBe("sobe")
        tirar()
        expect(corpo).toHaveLength(0)
    })

    it("a faixa acaba 50ms antes da raiz e é devolvida, para sair antes do fim da transição", () => {
        const chamadas: { tempo: KeyframeAnimationOptions; animacao: object }[] = []
        const html = {
            animate(_q: Keyframe[], tempo: KeyframeAnimationOptions) {
                const animacao = { finished: Promise.resolve() }
                chamadas.push({ tempo, animacao })
                return animacao
            },
        } as unknown as HTMLElement
        const faixa = animarAurora(html, 1000, 375, "desce", [])
        const raiz = chamadas.find((c) => c.tempo.pseudoElement === "::view-transition-new(root)")!
        const daFaixa = chamadas.find((c) => c.tempo.pseudoElement === "::view-transition-new(theme-aurora)")!
        expect(raiz.tempo.duration).toBe(AURORA.duracao)
        expect(daFaixa.tempo.duration).toBe(AURORA.duracao - 50)
        expect(daFaixa.tempo.fill).toBe("both")
        expect(faixa).toBe(daFaixa.animacao)
    })

    it("a altura vem de quem chama, lida uma vez no toque", () => {
        expect(lerFonte("src/lib/aurora-do-tema.ts")).not.toContain("innerHeight")
    })

    it("o nome de transição da faixa nunca é permanente no CSS", () => {
        expect(lerFonte("src/app/globals.css")).not.toContain("view-transition-name: theme-aurora")
    })

    it("o CSS da faixa: borrão de 24px, a paleta fria por padrão e a quente quando sobe", () => {
        const css = lerFonte("src/app/globals.css")
        const i = css.indexOf("@utility theme-aurora")
        const bloco = css.slice(i, css.indexOf("\n}\n", i))
        expect(bloco).toContain("blur(24px)")
        expect(bloco).toMatch(/\[data-sentido="?sobe"?\]/)
        for (const t of ["violet", "indigo", "blue", "amber", "coral", "magenta"]) {
            expect(bloco).toContain(`var(--brand-${t})`)
        }
        expect(bloco).not.toContain("view-transition-name")
    })
})
