import { existsSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

describe("sessões e atividades saíram do front", () => {
    it("as rotas e as bibliotecas não existem", () => {
        for (const c of [
            "src/app/(app)/account/sessions",
            "src/app/(app)/account/activity",
            "src/lib/sessions.ts",
            "src/lib/activity.ts",
            "src/lib/family.ts",
        ]) expect(existsSync(c)).toBe(false)
    })
    it("ninguém registra sessão nem grava atividade", () => {
        expect(lerFonte("src/components/providers.tsx")).not.toMatch(/createSession|validateCurrentSession|lib\/sessions/)
        expect(lerFonte("src/lib/edge-invoke.ts")).not.toContain("x-app-session-id")
        for (const f of ["src/components/security/ChangePasswordDialog.tsx", "src/components/account/edit-profile-dialog.tsx"])
            expect(lerFonte(f)).not.toContain("createActivity")
    })
})

describe("o que dependia de sessão saiu", () => {
    it("sem sessão expirada", () => {
        expect(existsSync("src/lib/auth-signout-reason.ts")).toBe(false)
        expect(lerFonte("src/components/login-form.tsx")).not.toContain("session-expired")
        expect(lerFonte("src/components/auth/showcase/scenes.ts")).not.toMatch(/session-expired|palette-session/)
        expect(lerFonte("src/lib/scene-script.ts")).not.toContain("palette-session")
    })
    it("a privacidade não promete o que saiu", () => {
        expect(lerFonte("src/components/wireframe/privacidade-wireframe.tsx")).not.toContain("As sessões e os aparelhos conectados")
        expect(lerFonte("src/components/wireframe/cofre-aberto-wireframe.tsx")).not.toContain("mostrar onde a conta está aberta")
    })
})

describe("tokens de captura", () => {
    const fonteTudo = (...arquivos: string[]) => arquivos.map((a) => semComentarios(lerFonte(`src/components/account/${a}`), "tudo")).join("\n")

    it("cria, revoga e mostra o token uma vez só", () => {
        const f = fonteTudo("atalho-secao.tsx", "novo-aparelho-dialog.tsx", "como-configurar-dialog.tsx")
        expect(f).toContain('rpc("create_capture_token"')
        expect(f).toContain('rpc("revoke_capture_token"')
        expect(f).toContain("Guarde agora: ele não aparece de novo.")
        expect(f).toContain("/functions/v1/capture")
        expect(f).toContain("docs/captura/atalho-iphone.md")
        // Só as sete colunas que o authenticated lê: `select('*')` dá 42501.
        expect(f).not.toMatch(/select\(\s*["']\*["']\s*\)/)
        // Lido sem cortar comentário: o `tudo` come o `//` da URL.
        expect(lerFonte("src/components/account/como-configurar-dialog.tsx")).toContain(
            "https://github.com/kauax2000/finance_app/blob/main/docs/captura/atalho-iphone.md",
        )
    })
    it("o token vive só no estado do diálogo", () => {
        const f = fonteTudo("atalho-secao.tsx", "novo-aparelho-dialog.tsx")
        expect(f).not.toMatch(/localStorage|sessionStorage|setQueryData\(\s*\[\s*["']capture_tokens|console\./)
    })
    it("os erros do banco em português", async () => {
        const { mensagemDoErroDeToken } = await import("./atalho-secao")
        expect(mensagemDoErroDeToken({ code: "P0001", message: "nao_membro" })).toBe("Você não é membro dessa carteira.")
        expect(mensagemDoErroDeToken({ code: "P0001", message: "limite_tokens" })).toBe(
            "Limite de 10 tokens ativos. Revogue um para criar outro.",
        )
        expect(mensagemDoErroDeToken({ code: "23514", message: "x" })).toBe("Nome do aparelho: de 1 a 60 caracteres.")
        expect(mensagemDoErroDeToken({ code: "23502", message: "x" })).toBe("Nome do aparelho: de 1 a 60 caracteres.")
    })
    it("o token novo vive no diálogo, e fechar o descarta", () => {
        const d = lerFonte("src/components/account/novo-aparelho-dialog.tsx")
        expect(d).toContain("Guarde agora: ele não aparece de novo.")
        expect(d).toContain("Escolha a carteira padrão.")
        expect(d).toMatch(/setTokenNovo\(null\)/)
        expect(d).not.toMatch(/localStorage|sessionStorage|console\./)
    })
    it("só tokens ativos, e revogar pede confirmação de verdade", () => {
        const f = lerFonte("src/components/account/atalho-secao.tsx")
        expect(f).toContain("revoked_at")
        expect(f).toContain("AlertDialog")
        expect(f).not.toContain("window.confirm")
    })
})

describe("a página Minha conta", () => {
    const p = () => lerFonte("src/app/(app)/account/page-client.tsx")
    it("compõe as seções, nesta ordem, sem wireframe nem menu ⋯", () => {
        const f = p()
        const ordem = ["Acesso e plano", "<AtalhoSecao", "<IasSecao", "Privacidade", "Sair", "Excluir conta"].map((t) => f.indexOf(t))
        expect(ordem.every((n) => n >= 0)).toBe(true)
        expect([...ordem].sort((a, b) => a - b)).toEqual(ordem)
        expect(f).not.toMatch(/Wireframe|DropdownMenu|md:hidden/)
    })
    it("o plano usa o título do resumo e aguenta a espera", () => {
        expect(p()).toContain("resumoDoPlano(plano, new Date(), null).titulo")
        expect(p()).toMatch(/plano \?/)
    })
    it("mantém o título do desktop como Configurações", () => {
        expect(p()).toContain("<PageHeader collapse>")
        expect(p()).toContain('aria-hidden="true"')
    })
    it("as seções mostram o próprio erro, sem o toast global", () => {
        for (const f of ["atalho-secao.tsx", "ias-secao.tsx"])
            expect(lerFonte(`src/components/account/${f}`)).toContain("meta: { errorToast: false }")
    })
    it("a data de membro não trunca", () => {
        expect(p()).toContain("<Muted>Membro desde")
    })
    it("o endereço da captura não duplica a barra do fim", async () => {
        const { enderecoDeCaptura } = await import("./como-configurar-dialog")
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co/")
        expect(enderecoDeCaptura()).toBe("https://x.supabase.co/functions/v1/capture")
        vi.unstubAllEnvs()
    })
})

describe("IAs conectadas", () => {
    it("monta a URL com ou sem barra", async () => {
        const { urlDoMcp } = await import("./ias-secao")
        expect(urlDoMcp("https://x.supabase.co/")).toBe("https://x.supabase.co/functions/v1/mcp")
        expect(urlDoMcp("https://x.supabase.co")).toBe("https://x.supabase.co/functions/v1/mcp")
    })
    it("lista, confirma de verdade e mostra o erro sem derrubar a tela", () => {
        const f = lerFonte("src/components/account/ias-secao.tsx")
        expect(f).toContain("listGrants")
        expect(f).toContain("revokeGrant")
        expect(f).toContain("Não foi possível carregar as conexões.")
        expect(f).not.toContain("window.confirm")
    })
    it("as três instruções", () => {
        const d = lerFonte("src/components/account/conectar-ia-dialog.tsx")
        for (const t of ["Claude", "ChatGPT", "claude mcp add --transport http finance-app"]) expect(d).toContain(t)
    })
})

describe("CampoDeCopiar", () => {
    it("o timer da confirmação não apaga uma recusa posterior", () => {
        const f = lerFonte("src/components/account/campo-de-copiar.tsx")
        expect(f).toContain("clearTimeout")
        expect(f).toContain("useRef")
    })
})
