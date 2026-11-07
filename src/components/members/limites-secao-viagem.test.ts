import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/members/limites-secao.tsx"))
const viagem = semComentarios(lerFonte("src/lib/viagem-de-passo.ts"))

describe("Editar limite: o nome da linha viaja até o título", () => {
    it("a linha e o título marcam o nome; o título tem o prefixo à parte", () => {
        expect(fonte).toContain("<span ref={nomeRef} data-nome>{linha.nome}</span>")
        expect(fonte).toMatch(/<DialogTitle>\s*<span data-prefixo>Limite de <\/span>\s*<span data-nome>\{linha\.nome\}<\/span>/)
    })

    it("só o lápis arma a viagem, e ela roda com o conteúdo montado", () => {
        expect(fonte).toMatch(/aria-label=\{`Editar o limite de \$\{linha\.nome\}`\}\s*onClick=\{\(\) => \{\s*viajar\.current = true/)
        expect(fonte).toContain("<DialogContent ref={conteudoRef}")
        expect(fonte).toContain("viajarParaOTitulo(nomeRef.current, el)")
    })

    it("o voo respeita movimento reduzido, não deixa quadro rodando e se encerra sozinho", () => {
        const fn = viagem.slice(viagem.indexOf("export function viajarParaOTitulo"))
        expect(fn).toContain("if (semMovimento()) return")
        expect(fn).toContain("cancelAnimationFrame(quadro)")
        expect(fn).toContain("fantasma.remove()")
        expect(fn).toContain("window.setTimeout(acabar")
        expect(fn).toContain('"menu-morph"')
    })
})
