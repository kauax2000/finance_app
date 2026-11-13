import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { isTypeAllowedForPrefs, type WorkspaceNotificationPrefs } from "@/lib/notification-href"
import { DEFAULT_WORKSPACE_NOTIFICATION_PREFS } from "@/lib/workspace-notification-prefs"
import { mergeTransactionsSearchParams } from "@/lib/transactions-list-search-params"
import { lerFiltrosDaUrl } from "@/lib/transactions/filtros"
import { existsSync } from "node:fs"

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

    it("pagina por chave, não por deslocamento", () => {
        const f = fonte(EDGE)
        expect(f).toContain(".gt('id', lastId)")
        expect(f).toContain(".order('id', { ascending: true }).limit(PAGE_SIZE)")
        expect(f).not.toContain(".range(")
    })

    it("o release confere o erro e a resposta não ecoa mensagens cruas", () => {
        const f = fonte(EDGE)
        expect(f).toMatch(/const \{ error \} = await admin\s*\.from\('review_reminder_dedupe'\)\s*\.delete\(\)/)
        expect(f).toContain("if (error) console.error('review-reminder: releaseDedupe failed:', error.message)")
        const resposta = f.slice(f.lastIndexOf("return json(200,"))
        expect(resposta).toContain("failures,")
        expect(resposta).not.toMatch(/errors|error:/)
    })

    it("o e-mail sai para o lembrete, como para a conta a pagar", () => {
        const f = fonte("supabase/functions/_shared/deliver-notification.ts")
        expect(f).toMatch(/const emailAllowed =[^;]*type === 'bill' \|\|[^;]*type === 'review' \|\|/)
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

    it("?conferir=1 vira o token conferir da lista (a vista do wireframe saiu)", () => {
        const lido = lerFiltrosDaUrl(new URLSearchParams("conferir=1"))
        expect(lido.filtros).toContainEqual({ field: "conferir", operator: "is", values: [] })
        expect(lido.migrou).toBe(true)
    })

    it("a página de transações mostra o aviso a conferir, e o Revisar aplica o token", () => {
        const f = fonte("src/app/(app)/transactions/page-client.tsx")
        expect(f).toMatch(/import\s*\{[^}]*\bAvisoAConferir\b[^}]*\}\s*from\s*["']@\/components\/transactions\/aviso-a-conferir["']/)
        expect(f).toContain('field: "conferir"')
        expect(f).not.toContain("AConferirListaWireframe")
        expect(existsSync("src/components/wireframe/a-conferir-lista-wireframe.tsx")).toBe(false)
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

    it("Confirmar todos tira a marca da carteira inteira, num update só", () => {
        const f = fonte("src/lib/transactions/mutations.ts")
        expect(f).toMatch(/marcarTodosConferidos[\s\S]*?\.update\(\{ needs_review: false \}\)\s*\.eq\("workspace_id", workspaceId\)\s*\.eq\("needs_review", true\)/)
        expect(fonte("src/components/transactions/use-transacoes-da-tela.ts")).toContain("marcarTodosConferidos(currentWorkspaceId)")
    })

    it("o domínio de transações invalida a lista e a contagem", () => {
        expect(fonte("src/lib/queries/invalidate-workspace-data.ts")).toContain("queryRoot.aConferir, workspaceId")
    })

    it("Configurações liga e desliga o lembrete", () => {
        const f = fonte("src/components/settings/notificacoes-temas.tsx")
        expect(f).toContain("notify_review")
        expect(f).toContain("patch({ [tema]: checked })")
        expect(f).toContain("Itens a conferir")
    })
})

describe("o detalhe recebe o capture_meta (o lembrar da Wallet)", () => {
    it("o ?txn= de fora da lista traz a coluna", () => {
        const f = fonte("src/components/transactions/use-transactions-list-controller.ts")
        // `*` desde a Ruling 8 do 7B: traz o `capture_meta` e o que vier depois.
        expect(f).toMatch(/\.from\("transactions"\)\s*\.select\("\*"\)\s*\.eq\("id", txnParam\)/)
    })

    it("o range traz a coluna", () => {
        const f = fonte("src/lib/queries/use-transactions-range.ts")
        expect(f).toMatch(/TRANSACTION_RANGE_COLUMNS =\s*"\*"/)
    })

    it("a lista e o detalhe leem todas as colunas", () => {
        expect(fonte("src/lib/transactions-detail-sheet-query.ts")).toMatch(/TRANSACTION_DETAIL_SHEET_SELECT =\s*"\*,/)
    })
})

describe("o a conferir no detalhe (redesenho de Transações)", () => {
    it("o detalhe monta o AConferirNoDetalhe, e o desfazer pergunta num AlertDialog", () => {
        const sheet = fonte("src/components/transactions/transaction-detail-sheet.tsx")
        expect(sheet).toMatch(/import\s*\{[^}]*\bAConferirNoDetalhe\b[^}]*\}\s*from\s*["']@\/components\/transactions\/a-conferir-no-detalhe["']/)
        expect(sheet).not.toContain("a-conferir-wireframe")
        const bloco = fonte("src/components/transactions/a-conferir-no-detalhe.tsx")
        expect(bloco).toContain('<Card padding="none" data-slot="a-conferir" className="shrink-0" tone={mostraConfirmar ? "info" : undefined}>')
        expect(bloco).toContain("`Apagar os ${n} lançamentos desta importação?`")
        expect(bloco).toContain("Como chegou")
        expect(bloco).not.toContain("window.confirm")
    })
})
