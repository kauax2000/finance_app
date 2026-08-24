/**
 * Teste table-driven do mapa de invalidação (Fase 6, D3).
 *
 * Cada domínio deve invalidar TODAS as chaves que dependem dos seus dados —
 * os gaps aqui eram a causa de bundles servindo cartão excluído e
 * billingStats de assinatura stale.
 */
import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"
import {
    invalidateWorkspaceData,
    type WorkspaceDataDomain,
} from "@/lib/queries/invalidate-workspace-data"
import { queryRoot } from "@/lib/queries/keys"

const WS = "ws-1"

/** Chaves semeadas no cache antes de cada invalidação. */
const SEEDED_KEYS: ReadonlyArray<readonly unknown[]> = [
    [queryRoot.transactions, "list", WS, "2026-08-01", "2026-08-31", "f"],
    [queryRoot.transactionsSummary, WS, "2026-08-01", "2026-08-31"],
    [queryRoot.transactionsWorkspaceAux, WS],
    [queryRoot.categories, "list", WS],
    [queryRoot.categoryDetailBundle, WS, "cat-1", "2026-08"],
    [queryRoot.creditCards, "list", WS],
    [queryRoot.creditCardsPageBundle, WS],
    [queryRoot.creditCardExpenseRows, WS],
    [queryRoot.subscriptions, "list", WS],
    [queryRoot.subscriptionsPageBundle, WS],
    [queryRoot.installmentPlans, "list", WS],
    [queryRoot.billsPageBundle, WS],
]

type Case = {
    domain: WorkspaceDataDomain
    /** Roots (primeiro elemento da queryKey) que DEVEM ficar invalidados. */
    expectInvalidated: string[]
}

const CASES: Case[] = [
    {
        domain: "transactions",
        expectInvalidated: [
            queryRoot.transactions,
            queryRoot.transactionsSummary,
            queryRoot.transactionsWorkspaceAux,
            // billingStats do bundle de assinaturas deriva de transactions
            queryRoot.subscriptionsPageBundle,
        ],
    },
    {
        domain: "credit_cards",
        expectInvalidated: [
            queryRoot.creditCards,
            queryRoot.creditCardsPageBundle,
            // bundles que embutem a lista de cartões
            queryRoot.billsPageBundle,
            queryRoot.subscriptionsPageBundle,
        ],
    },
    {
        domain: "installment_plans",
        expectInvalidated: [
            queryRoot.installmentPlans,
            // creditCardsPageBundle carrega installmentPlans
            queryRoot.creditCardsPageBundle,
        ],
    },
    {
        domain: "subscriptions",
        expectInvalidated: [
            queryRoot.subscriptions,
            queryRoot.subscriptionsPageBundle,
        ],
    },
    {
        domain: "categories",
        expectInvalidated: [queryRoot.categories, queryRoot.categoryDetailBundle],
    },
]

function seedClient(): QueryClient {
    const qc = new QueryClient()
    for (const key of SEEDED_KEYS) {
        qc.setQueryData([...key], { seeded: true })
    }
    return qc
}

function invalidatedRoots(qc: QueryClient): Set<string> {
    const out = new Set<string>()
    for (const q of qc.getQueryCache().getAll()) {
        if (q.state.isInvalidated) out.add(String(q.queryKey[0]))
    }
    return out
}

describe("invalidateWorkspaceData", () => {
    it.each(CASES)(
        "domínio $domain invalida as chaves dependentes",
        async ({ domain, expectInvalidated }) => {
            const qc = seedClient()
            await invalidateWorkspaceData(qc, WS, { domains: [domain] })
            const got = invalidatedRoots(qc)
            for (const root of expectInvalidated) {
                expect(got, `domínio ${domain} deveria invalidar ${root}`).toContain(
                    root,
                )
            }
        },
    )

    it("all invalida tudo que foi semeado", async () => {
        const qc = seedClient()
        await invalidateWorkspaceData(qc, WS, { domains: ["all"] })
        const got = invalidatedRoots(qc)
        for (const key of SEEDED_KEYS) {
            expect(got).toContain(String(key[0]))
        }
    })
})
