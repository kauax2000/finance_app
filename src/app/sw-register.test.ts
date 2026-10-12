import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

/**
 * O registro do service worker, trancado num ponto só.
 *
 * Ele existe por um defeito medido: quatro componentes novos "não apareciam" no
 * catálogo com **tudo** no lugar — arquivos, registry, `docs-map`,
 * `search-index`, e as rotas respondendo 200 com os nomes no HTML do servidor.
 *
 * A causa era client-side, e a falha é silenciosa: **não registrar não é o
 * mesmo que não estar registrado.** Um service worker instalado antes segue
 * controlando a página e servindo o casco do precache, e nada avisa.
 */

const FONTE = lerFonte("src/app/sw-register.tsx")

/** O comentário explica o defeito e cita as APIs; varrer o texto cru testaria
 *  o comentário e não o código. */
const CODIGO = semComentarios(FONTE, "fora-de-url")

describe("o registro do service worker", () => {
    it("o ramo de não-registrar desregistra o que existir", () => {
        // Sem isto, quem rodar um `next build` local uma vez fica preso ao
        // casco em cache para sempre — e a única saída é saber abrir o DevTools
        // e desregistrar à mão, que é conhecimento que ninguém tem na hora que
        // precisa.
        const ramo = CODIGO.slice(
            CODIGO.indexOf("if (!shouldRegisterSw())"),
            CODIGO.indexOf("let refreshing")
        )
        expect(ramo).toBeTruthy()
        expect(ramo).toContain("getRegistrations")
        expect(ramo).toContain("unregister")
    })

    it("o caminho de produção não mudou", () => {
        // O conserto é só do ramo negativo. Em produção `shouldRegisterSw()`
        // devolve `true` e o registro segue idêntico — inclusive o
        // `controllerchange` que recarrega numa troca de versão.
        expect(CODIGO).toContain('register("/sw.js"')
        expect(CODIGO).toContain("controllerchange")
        expect(CODIGO).toMatch(/NEXT_PUBLIC_PWA_ENABLED/)
    })
})
