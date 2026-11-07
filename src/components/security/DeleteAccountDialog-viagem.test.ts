import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = semComentarios(lerFonte("src/components/security/DeleteAccountDialog.tsx"))
const viagem = semComentarios(lerFonte("src/lib/viagem-de-passo.ts"))

describe("Excluir conta: troca de passo orgânica", () => {
    it("usa recolherPassoNoLugar / brotarPassoNoLugar e pergunta o movimento reduzido", () => {
        expect(fonte).toContain('import { brotarPassoNoLugar, recolherPassoNoLugar, segurarTecladoDe, semMovimento } from "@/lib/viagem-de-passo"')
        expect(fonte).toMatch(/!semMovimento\(\)\) \{[\s\S]*?await recolherPassoNoLugar\(corpo, cab, pe\)/)
        expect(fonte).toMatch(/if \(de && cab && corpo && pe && !semMovimento\(\)\) brotarPassoNoLugar\(corpo, cab, pe, de\)/)
    })

    it("o cabeçalho fica montado (sem key) e carrega o ref; corpo e rodapé dos dois passos também", () => {
        expect(fonte).toContain('<DialogHeader ref={cabecalhoRef} align="center">')
        expect(fonte).not.toMatch(/<DialogHeader key=/)
        expect(fonte.match(/<DialogBody ref=\{corpoRef\}>/g)).toHaveLength(2)
        expect(fonte.match(/ref=\{rodapeRef\}/g)).toHaveLength(2)
        expect(fonte.match(/data-passo/g)).toHaveLength(2)
    })

    it("Continuar e Voltar passam o botão tocado, com a guarda de troca", () => {
        expect(fonte).toContain('onClick={(e) => void irPara("confirm", e.currentTarget)}')
        expect(fonte).toContain('onClick={(e) => void irPara("warning", e.currentTarget)}')
        expect(fonte).toMatch(/if \(trocando\) return/)
        expect(fonte).toMatch(/if \(minha !== troca\.current\) return/)
    })

    it("o teclado do iOS abre no toque: ponte de texto e autoFocus na senha", () => {
        expect(fonte).toContain('segurarTecladoDe(corpo, "text")')
        expect(fonte).toMatch(/type="password"\s*autoFocus/)
        expect(fonte).toMatch(/useLayoutEffect\(\(\) => \{\s*soltarTeclado\.current\?\.\(\)/)
    })

    it("a viagem de passo exporta as funções do passo sem linha tocada", () => {
        for (const f of ["recolherPassoNoLugar(", "brotarPassoNoLugar(", "segurarTecladoDe("]) expect(viagem).toContain(`export function ${f}`)
        expect(viagem).toMatch(/segurarTecladoDe[\s\S]*?ponte\.inputMode = modo[\s\S]*?ponte\.focus/)
    })
})
