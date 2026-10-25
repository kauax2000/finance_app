import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const edge = (caminho: string) => fonte(`supabase/functions/${caminho}`)

describe("Edges e o gasto privado (Bloco 7B)", () => {
    it("o aviso de lançamento novo diz de quem é a privada, com o nome", () => {
        const f = edge("_shared/process-transaction-notification.ts")
        expect(f).toMatch(/select\(\s*'[^']*\bis_private\b[^']*'/)
        expect(f).toContain("tx.is_private")
        expect(f).toContain("`Gasto pessoal de ${actorName}`")
    })

    it("o histórico da capture ignora as privadas", () => {
        const f = edge("capture/index.ts")
        const i = f.indexOf(".select('description, category_id, payment_method, payment_credit_card_id, date, type')")
        expect(i).toBeGreaterThan(-1)
        expect(f.slice(i, i + 200)).toContain(".eq('is_private', false)")
    })

    it("insights-daily lê is_private e o entrega aos detectores", () => {
        const f = edge("insights-daily/index.ts")
        expect(f).toMatch(/const TX_COLUMNS =\s*'[^']*\bis_private\b/)
        expect(f).toContain("is_private: t.is_private === true")
        const d = edge("_shared/insights/detectores.ts")
        expect(d).toContain("is_private?: boolean")
        for (const nome of [
            "detectarRecorrencias",
            "detectarAtipicos",
            "detectarDuplicidades",
            "detectarPrecoDeAssinatura",
            "detectarSazonais",
        ]) {
            const inicio = d.indexOf(`export function ${nome}(`)
            expect(inicio, nome).toBeGreaterThan(-1)
            const fim = d.indexOf("export function", inicio + 1)
            expect(d.slice(inicio, fim), nome).toContain("visiveis(lancs)")
        }
    })

    it("o resumo do cartão com titular vai ao titular e aos donos, como insight de cada um (Ruling 5)", () => {
        const f = edge("insights-daily/index.ts")
        expect(f).toMatch(/\.from\('credit_cards'\)\s*\.select\('[^']*holder_user_id/)
        expect(f).toContain("donosDaCarteira(")
        expect(f).toContain("new Set([c.holder_user_id, ...donos])")
        expect(f).toContain("linhas.push({ ...l, user_id: u })")
        // O relatório da carteira não conta a diferença do cartão com titular.
        expect(f).toContain("card.holder_user_id ||")
        // O insight de uma pessoa avisa só ela; as chaves gravadas incluem as dela.
        expect(f).toContain("!ins.user_id || u === ins.user_id")
        expect(f).not.toContain(".is('user_id', null)")
    })

    it.each(["credit-card-calendar-alerts/index.ts", "evaluate-credit-card-alerts/index.ts"])(
        "%s: o aviso do cartão com titular vai só ao titular e aos donos",
        (caminho) => {
            const f = edge(caminho)
            expect(f).toMatch(/\.from\('credit_cards'\)\s*\.select\('[^']*holder_user_id/)
            expect(f).toContain("donosDaCarteira(")
            expect(f).toMatch(/=== (ev\.holder|card\.holder_user_id) \|\| donos\.includes\(u\)/)
        },
    )
})

describe("o autor junta os detalhes da privada", () => {
    it.each([
        "src/lib/queries/fetch-transactions-list-page.ts",
        "src/lib/transactions-detail-sheet-query.ts",
        "src/components/transactions/use-transactions-list-controller.ts",
    ])("%s passa por juntarDetalhesPrivados", (caminho) => {
        expect(fonte(caminho)).toContain("juntarDetalhesPrivados(")
    })

    it("a busca filtra a linha mascarada: a descrição original não acha a privada de outra pessoa", () => {
        for (const caminho of ["src/lib/queries/use-transactions-search.ts", "src/lib/queries/fetch-transactions-list-page.ts"]) {
            const f = fonte(caminho)
            expect(f, caminho).toContain('.from("transactions")')
            expect(f, caminho).not.toContain("transacoes_privadas")
        }
        // O filtro de descrição da lista roda antes da junção, na linha mascarada.
        const lista = fonte("src/lib/queries/fetch-transactions-list-page.ts")
        expect(lista.indexOf('qb.ilike("description"')).toBeGreaterThan(-1)
        expect(lista.indexOf('qb.ilike("description"')).toBeLessThan(lista.indexOf("juntarDetalhesPrivados("))
    })

    it("o Cofre exporta as privadas da pessoa com os detalhes dela", () => {
        const f = fonte("src/lib/cofre/exportar.ts")
        expect(f).toContain('.from("transacoes_privadas")')
        expect(f).toContain("comDetalhesPrivados(")
    })
})
