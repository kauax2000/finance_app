import { describe, expect, it } from "vitest"
import { lerFonte } from "@/test/fonte"
import {
    AURORA,
    RITMO,
    animarAurora,
    criarAro,
    criarFaixa,
    mascaraDaAurora,
    mascaraDoAro,
    quadrosDaFaixa,
    quadrosDaMascara,
    quadrosDoAro,
} from "./aurora-do-tema"

describe("a aurora da troca de tema", () => {
    it("tem os tempos e o volume aprovados", () => {
        expect(AURORA).toEqual({ varredura: 0.6, faixa: 0.6, opacidade: 0.85 })
        expect(RITMO).toEqual({
            desce: { duracao: 1250, easing: "cubic-bezier(0.55, 0, 0.15, 1)" },
            sobe: { duracao: 950, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
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
            expect(m).toContain("Q-75 144 -50 150")
            expect(m).toContain("T300 150")
            const miolo = m.slice('url("'.length, -'")'.length)
            expect(miolo).not.toContain('"')
            expect(miolo).not.toContain("#")
        }
        expect(acima).toContain("V-30H-100Z")
        expect(abaixo).toContain("V330H-100Z")
    })

    it("no escuro a borda desce em três ondas por tela, deslizando para o lado, e para na varredura", () => {
        const q = quadrosDaMascara(1000, 600, "desce")
        expect(q).toHaveLength(3)
        expect(q[0].maskPosition).toBe("0px -1650px")
        expect(q[0].easing).toBe(RITMO.desce.easing)
        expect(q[1].offset).toBe(0.6)
        expect(q[1].maskPosition).toBe("-160px -350px")
        expect(q[2].maskPosition).toBe("-240px -350px")
        for (const k of q) {
            expect(k.maskImage).toBe(mascaraDaAurora("acima"))
            expect(k.maskSize).toBe("400px 3000px")
            expect(k.maskRepeat).toBe("repeat-x")
            expect(k.webkitMaskPosition).toBe(k.maskPosition)
            expect(k.webkitMaskImage).toBe(k.maskImage)
            expect(k.webkitMaskSize).toBe(k.maskSize)
            expect(k.webkitMaskRepeat).toBe(k.maskRepeat)
        }
    })

    it("no claro a borda sobe", () => {
        const q = quadrosDaMascara(1000, 600, "sobe")
        expect(q[0].maskPosition).toBe("0px -350px")
        expect(q[0].easing).toBe(RITMO.sobe.easing)
        expect(q[1].maskPosition).toBe("-160px -1650px")
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

    it("a faixa anda colada à borda, passa 0,1 tela e some no fim", () => {
        const desce = quadrosDaFaixa(1000, "desce")
        expect(desce[0].transform).toBe("translateY(-702px)")
        expect(desce[0].opacity).toBe(0.85)
        expect(desce[0].easing).toBe(RITMO.desce.easing)
        expect(desce[1].transform).toBe("translateY(598px)")
        expect(desce[1].offset).toBe(0.6)
        expect(desce[2].transform).toBe("translateY(698px)")
        expect(desce[2].opacity).toBe(0)
        const sobe = quadrosDaFaixa(1000, "sobe")
        expect(sobe[0].transform).toBe("translateY(1102px)")
        expect(sobe[1].transform).toBe("translateY(-198px)")
        expect(sobe[2].transform).toBe("translateY(-298px)")
        expect(sobe[2].opacity).toBe(0)
        expect(sobe[0].easing).toBe(RITMO.sobe.easing)
    })

    it("o aro anda centrado na borda e some depois da varredura", () => {
        const q = quadrosDoAro(1000, "desce")
        expect(q[0].transform).toBe("translateY(-350px)")
        expect(q[0].opacity).toBe(1)
        expect(q[1].transform).toBe("translateY(950px)")
        expect(q[1].offset).toBe(0.6)
        expect(q[2].opacity).toBe(0)
        expect(quadrosDoAro(1000, "sobe")[0].transform).toBe("translateY(950px)")
    })

    it("a máscara do aro é só o traço da onda, sem aspas duplas nem # cru", () => {
        const m = mascaraDoAro()
        expect(m).toContain("viewBox='0 130 200 40'")
        expect(m).toContain("non-scaling-stroke")
        expect(m).toContain("fill='none'")
        expect(m).toContain("Q-75 144 -50 150")
        const miolo = m.slice('url("'.length, -'")'.length)
        expect(miolo).not.toContain('"')
        expect(miolo).not.toContain("#")
    })

    it("a faixa é uma só, com nome de transição inline, e sai pela função devolvida", () => {
        const { doc, corpo } = documentoFalso()
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

    it("o aro é um só, com nome de transição inline, a máscara da onda e três ondas por tela", () => {
        const { doc, corpo } = documentoFalso()
        criarAro(doc, 1000, 600)
        const { aro, tirar } = criarAro(doc, 1000, 600)
        expect(corpo).toHaveLength(1)
        expect(aro).toBe(corpo[0])
        expect(corpo[0].className).toBe("theme-aurora-aro")
        expect(corpo[0].style.viewTransitionName).toBe("theme-aurora-aro")
        expect(corpo[0].atributos["aria-hidden"]).toBe("true")
        expect(corpo[0].style.height).toBe("400px")
        expect(corpo[0].style.maskImage).toBe(mascaraDoAro())
        expect(corpo[0].style.webkitMaskImage).toBe(mascaraDoAro())
        expect(corpo[0].style.maskSize).toBe("400px 400px")
        expect(corpo[0].style.maskRepeat).toBe("repeat-x")
        tirar()
        expect(corpo).toHaveLength(0)
    })

    it("a faixa acaba 50ms antes da raiz e vem primeiro, para sair antes do fim da transição", () => {
        for (const sentido of ["desce", "sobe"] as const) {
            const chamadas: { quadros: Keyframe[]; tempo: KeyframeAnimationOptions; animacao: object }[] = []
            const animate = (quadros: Keyframe[], tempo: KeyframeAnimationOptions) => {
                const animacao = { finished: Promise.resolve() }
                chamadas.push({ quadros, tempo, animacao })
                return animacao
            }
            const html = { animate } as unknown as HTMLElement
            const aro = { animate } as unknown as HTMLElement
            const animacoes = animarAurora(html, 1000, 600, sentido, [], aro)
            const raiz = chamadas.find((c) => c.tempo.pseudoElement === "::view-transition-new(root)")!
            const daFaixa = chamadas.find((c) => c.tempo.pseudoElement === "::view-transition-new(theme-aurora)")!
            const doAro = chamadas.find((c) => c.tempo.pseudoElement === "::view-transition-new(theme-aurora-aro)")!
            const mascaraDoAroAnda = chamadas.find((c) => c.tempo.pseudoElement === undefined)!
            expect(raiz.tempo.duration).toBe(RITMO[sentido].duracao)
            expect(daFaixa.tempo.duration).toBe(RITMO[sentido].duracao - 50)
            expect(daFaixa.tempo.fill).toBe("both")
            expect(doAro.quadros).toEqual(quadrosDoAro(1000, sentido))
            // O aro sai com a faixa, 50ms antes: com a duração inteira ele sumia a 10% num estalo.
            expect(doAro.tempo.duration).toBe(RITMO[sentido].duracao - 50)
            expect(doAro.tempo.fill).toBe("both")
            expect(mascaraDoAroAnda.tempo.duration).toBe(RITMO[sentido].duracao - 50)
            expect(mascaraDoAroAnda.tempo.fill).toBe("both")
            expect(mascaraDoAroAnda.quadros.map((q) => q.maskPosition)).toEqual(["0px 0px", "-160px 0px", "-240px 0px"])
            expect(animacoes).toHaveLength(4)
            expect(animacoes[0]).toBe(daFaixa.animacao)
            expect(animacoes).toContain(raiz.animacao)
        }
    })

    it("sem aro, só a faixa e a raiz", () => {
        const html = { animate: () => ({}) } as unknown as HTMLElement
        expect(animarAurora(html, 1000, 600, "sobe", [])).toHaveLength(2)
    })

    it("a altura vem de quem chama, lida uma vez no toque", () => {
        expect(lerFonte("src/lib/aurora-do-tema.ts")).not.toContain("innerHeight")
    })

    it("o nome de transição da faixa nunca é permanente no CSS", () => {
        expect(lerFonte("src/app/globals.css")).not.toContain("view-transition-name: theme-aurora")
    })

    it("o CSS da faixa: borrão de 24px e a virada quando sobe, lida no <html>", () => {
        const css = lerFonte("src/app/globals.css")
        const i = css.indexOf("@utility theme-aurora {")
        const bloco = css.slice(i, css.indexOf("\n}\n", i))
        expect(bloco).toContain("blur(24px)")
        expect(bloco).toMatch(/html\[data-aurora="sobe"\]/)
        expect(bloco).not.toContain("--aurora-1:")
        expect(bloco).not.toContain("view-transition-name")
    })

    it("a paleta mora no <html> da troca: frias por padrão, quentes quando sobe", () => {
        const css = lerFonte("src/app/globals.css")
        const fria = css.slice(css.indexOf(".theme-reveal {"), css.indexOf("}", css.indexOf(".theme-reveal {")))
        for (const t of ["violet", "indigo", "blue"]) expect(fria).toContain(`var(--brand-${t})`)
        const i = css.indexOf('.theme-reveal[data-aurora="sobe"] {')
        expect(i).toBeGreaterThan(-1)
        const quente = css.slice(i, css.indexOf("}", i))
        for (const t of ["amber", "coral", "magenta"]) expect(quente).toContain(`var(--brand-${t})`)
    })

    it("o CSS do aro: depois do no-scrollbar, a cor clara da paleta num token, sem nome de transição", () => {
        const css = lerFonte("src/app/globals.css")
        const i = css.indexOf("@utility theme-aurora-aro {")
        expect(i).toBeGreaterThan(css.indexOf("@utility no-scrollbar"))
        const bloco = css.slice(i, css.indexOf("\n}\n", i))
        expect(bloco).toContain("var(--aurora-3) 45%")
        // O filtro no elemento roda antes da máscara e o halo era cortado: ele mora na foto.
        expect(bloco).not.toContain("filter")
        const foto = css.slice(css.indexOf(".theme-reveal::view-transition-new(theme-aurora-aro) {"))
        expect(css).toContain(".theme-reveal::view-transition-new(theme-aurora-aro) {")
        const regra = foto.slice(0, foto.indexOf("}"))
        expect(regra).toContain("blur(1.5px)")
        expect(regra).toContain("drop-shadow(0 0 6px color-mix(in oklch, var(--aurora-3) 70%, var(--scrim-foreground)))")
        expect(bloco).toContain("var(--scrim-foreground)")
        expect(bloco).not.toContain("view-transition-name")
        expect(css).toMatch(/::view-transition-new\(theme-aurora-aro\)[^{]*\{\s*animation: none;/)
        expect(css).toMatch(/::view-transition-new\(theme-aurora-parada\)[^{]*\{\s*animation: none;/)
    })
})

/** Sem jsdom no projeto: um documento falso com o que `criarFaixa` e `criarAro` tocam. */
function documentoFalso() {
    type No = { className: string; style: Record<string, string>; atributos: Record<string, string>; setAttribute(k: string, v: string): void; remove(): void }
    const corpo: No[] = []
    const doc = {
        createElement: () => {
            const no: No = {
                className: "",
                style: {},
                atributos: {},
                setAttribute(k, v) { no.atributos[k] = v },
                remove() { if (corpo.includes(no)) corpo.splice(corpo.indexOf(no), 1) },
            }
            return no
        },
        querySelectorAll: (sel: string) => corpo.filter((n) => sel === `.${n.className}`),
        body: { append: (n: No) => corpo.push(n) },
    } as unknown as Document
    return { doc, corpo }
}
