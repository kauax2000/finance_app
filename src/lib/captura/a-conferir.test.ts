import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { isTypeAllowedForPrefs, type WorkspaceNotificationPrefs } from "@/lib/notification-href"
import { DEFAULT_WORKSPACE_NOTIFICATION_PREFS } from "@/lib/workspace-notification-prefs"
import { mergeTransactionsSearchParams } from "@/lib/transactions-list-search-params"

// As preferências importam o cliente do Supabase, que pede as variáveis do .env.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

const fonte = (caminho: string) => semComentarios(lerFonte(caminho), "tudo")
const EDGE = "supabase/functions/review-reminder/index.ts"

describe("Edge review-reminder", () => {
    it("confere o segredo do cron antes da primeira consulta", () => {
        const f = fonte(EDGE)
        const segredo = f.indexOf("secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))")
        const serve = f.indexOf("Deno.serve(")
        expect(segredo).toBeGreaterThan(serve)
        expect(serve).toBeGreaterThan(-1)
        // O dedupe é declarado acima; dentro do handler, nada consulta antes do segredo.
        expect(f.indexOf(".from(", serve)).toBeGreaterThan(segredo)
    })

    it("lê os itens a conferir, faz o dedupe do dia e leva à lista", () => {
        const f = fonte(EDGE)
        expect(f).toContain(".eq('needs_review', true)")
        expect(f).toContain("review_reminder_dedupe")
        expect(f).toContain("error?.code === '23505'")
        expect(f).toContain("'/transactions?conferir=1'")
        expect(f).toContain("type: 'review'")
        expect(f).toContain("pessoasParaLembrar(")
    })

    it("só lembra quem ainda é membro, respeita notify_review e desfaz o dedupe na falha", () => {
        const f = fonte(EDGE)
        expect(f).toContain(".from('workspace_members')")
        expect(f).toContain("prefs.notify_review === false")
        expect(f).toMatch(/if \(!delivered\.ok\) \{\s*await releaseDedupe\(/)
    })

    it("a função não pede JWT e entra na lista de deploy", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.review-reminder\]\s*verify_jwt = false/)
        expect(lerFonte("package.json")).toMatch(/supabase:deploy:functions[^\n]*\breview-reminder\b/)
    })
})

describe("preferência notify_review", () => {
    const base: WorkspaceNotificationPrefs = { ...DEFAULT_WORKSPACE_NOTIFICATION_PREFS }

    it("nasce ligada", () => {
        expect(base.notify_review).toBe(true)
    })

    it("'review' segue notify_review", () => {
        expect(isTypeAllowedForPrefs("review", base)).toBe(true)
        expect(isTypeAllowedForPrefs("review", { ...base, notify_review: false })).toBe(false)
    })

    it("o servidor lê e normaliza a coluna", () => {
        const f = fonte("supabase/functions/_shared/deliver-notification.ts")
        expect(f).toMatch(/PREFS_COLUMNS =\s*'[^']*\bnotify_review\b/)
        expect(f).toContain("notify_review: prefs.notify_review !== false")
    })

    it("o banco aceita a notificação do tipo 'review'", () => {
        const sql = semComentarios(lerFonte("supabase/migrations/20261023120000_captura.sql")).replace(/--.*$/gm, "")
        expect(sql).toMatch(/drop constraint if exists notifications_type_check/)
        expect(sql).toMatch(/add constraint notifications_type_check[^;]*'bill'[^;]*'review'/)
    })
})

describe("telas de a conferir", () => {
    it("?conferir=1 sobrevive à reescrita da URL pelo controlador da lista", () => {
        const atual = new URLSearchParams("conferir=1&type=expense")
        const proxima = new URLSearchParams("q=mercado")
        expect(mergeTransactionsSearchParams(atual, proxima).get("conferir")).toBe("1")
    })

    it("a página de transações mostra a lista com ?conferir=1", () => {
        const f = fonte("src/app/(app)/transactions/page-client.tsx")
        expect(f).toMatch(/import\s*\{[^}]*\bAConferirListaWireframe\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/a-conferir-lista-wireframe["']/)
        expect(f).toContain('searchParams?.get("conferir") === "1"')
    })

    it("o Painel mostra a contagem", () => {
        const f = fonte("src/app/(app)/dashboard/page-client.tsx")
        expect(f).toMatch(/import\s*\{[^}]*\bAConferirContagemWireframe\b[^}]*\}\s*from\s*["']@\/components\/wireframe\/a-conferir-contagem-wireframe["']/)
    })

    it("a contagem é só o número, sem trazer as linhas", () => {
        const f = fonte("src/components/wireframe/a-conferir-contagem-wireframe.tsx")
        expect(f).toContain('{ count: "exact", head: true }')
        expect(f).toContain('.eq("needs_review", true)')
        expect(f).toContain("/transactions?conferir=1")
    })

    it("a lista: 50 da carteira, do mais recente, e o confirmar exige uma linha", () => {
        const f = fonte("src/components/wireframe/a-conferir-lista-wireframe.tsx")
        expect(f).toContain('.eq("workspace_id", workspaceId)')
        expect(f).toContain('.order("date", { ascending: false })')
        expect(f).toContain('.order("created_at", { ascending: false })')
        expect(f).toContain(".limit(LIMITE)")
        expect(f).toContain('.update({ needs_review: false })')
        expect(f).toMatch(/data\?\.length !== 1/)
        expect(f).toContain("Nada a conferir.")
    })

    it("o domínio de transações invalida a lista e a contagem", () => {
        expect(fonte("src/lib/queries/invalidate-workspace-data.ts")).toContain("queryRoot.aConferir, workspaceId")
    })

    it("Configurações liga e desliga o lembrete", () => {
        expect(fonte("src/app/(app)/settings/page-client.tsx")).toContain("LembreteConferirWireframe")
        const f = fonte("src/components/wireframe/a-conferir-lembrete-wireframe.tsx")
        expect(f).toContain("patch({ notify_review:")
        expect(f).toContain("Lembrete às 20h de itens a conferir")
    })
})

describe("o detalhe recebe o capture_meta (o lembrar da Wallet)", () => {
    it("o ?txn= de fora da lista traz a coluna", () => {
        const f = fonte("src/components/transactions/use-transactions-list-controller.ts")
        expect(f).toMatch(/\.select\("[^"]*\bneeds_review, import_batch_id, capture_meta\b[^"]*"\)/)
    })

    it("o range traz a coluna", () => {
        const f = fonte("src/lib/queries/use-transactions-range.ts")
        expect(f).toMatch(/TRANSACTION_RANGE_COLUMNS =\s*"[^"]*\bcapture_meta\b/)
    })

    it("a lista e o detalhe leem todas as colunas", () => {
        expect(fonte("src/lib/transactions-detail-sheet-query.ts")).toMatch(/TRANSACTION_DETAIL_SHEET_SELECT =\s*"\*,/)
    })
})
