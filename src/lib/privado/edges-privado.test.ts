import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { leitoresDoCartao } from "../../../supabase/functions/_shared/destinatarios"

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
        // O resumo da fatura é da Ruling 5: com titular, sempre do titular e dos donos.
        expect(f).toContain("leitoresDoCartao(membros ?? [], c.holder_user_id, true)")
        expect(f).toContain("linhas.push({ ...l, user_id: u })")
        // O relatório da carteira não conta a diferença do cartão com titular.
        expect(f).toContain("card.holder_user_id ||")
        // O insight de uma pessoa avisa só ela; as chaves gravadas incluem as dela.
        expect(f).toContain("!ins.user_id || u === ins.user_id")
        expect(f).not.toContain(".is('user_id', null)")
    })

    it.each(["insights-daily/index.ts", "credit-card-calendar-alerts/index.ts", "evaluate-credit-card-alerts/index.ts"])(
        "%s: quem lê o aviso do cartão é o leitoresDoCartao, sem regra escrita à mão",
        (caminho) => {
            const f = edge(caminho)
            expect(f).toMatch(/\.from\('credit_cards'\)\s*\.select\('[^']*holder_user_id/)
            expect(f).toContain("leitoresDoCartao(")
            expect(f).not.toContain("donos.includes(")
        },
    )

    it("calendário: só o aviso que levou o total do banco marca usaBanco (Ruling 6)", () => {
        const f = edge("credit-card-calendar-alerts/index.ts")
        // fecha em breve não lê o banco; fechada, vence e vence hoje só com o total gravado.
        expect(f).toContain("const banco = isClosedCycle(ev) ? bankTotals.get(")
        expect(f).toContain("usaBanco: banco !== undefined")
        // a fatura alta, quando alguma fechada da média tem o total do banco.
        expect(f).toContain("const usaBanco = fechadas.some((w) => banco.has(formatYmd(w.end)))")
        expect(f).toContain("leitoresDoCartao(memberRows ?? [], ev.holder ?? null, ev.usaBanco)")
    })

    it("limite: só com a fechada pelo total do banco fica com titular e dono (Ruling 6)", () => {
        expect(edge("evaluate-credit-card-alerts/index.ts")).toContain(
            "leitoresDoCartao(memberRows ?? [], card.holder_user_id ?? null, !paidRow && bankTotal != null)",
        )
    })

    it("o fecha em breve e a fechada sem total do banco chegam a todo adulto; com o total, só titular e dono", () => {
        const membros = [
            { user_id: "dono", role: "owner" },
            { user_id: "ana", role: "member" },
            { user_id: "bia", role: "member" },
            { user_id: "filho", role: "guest" },
        ]
        // fecha em breve (nunca usa o banco) e a fechada sem total gravado
        expect(leitoresDoCartao(membros, "ana", false)).toEqual(["dono", "ana", "bia"])
        // a fechada com o total do banco
        expect(leitoresDoCartao(membros, "ana", true)).toEqual(["dono", "ana"])
        // o cartão da casa
        expect(leitoresDoCartao(membros, null, true)).toEqual(["dono", "ana", "bia"])
    })
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
            expect(fonte(caminho), caminho).toContain('.from("transactions")')
        }
        // O original só mora em transacoes_privadas, que só o autor lê.
        const mig = fonte("supabase/migrations/20261030120000_privado.sql")
        expect(mig).toMatch(
            /create policy transacoes_privadas_select on public\.transacoes_privadas\s+for select to authenticated\s+using \(user_id = \(select auth\.uid\(\)\)\);/,
        )
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
