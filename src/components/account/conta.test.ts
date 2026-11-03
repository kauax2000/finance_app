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

    it("cria, revoga e mostra o código uma vez só", () => {
        const f = fonteTudo("atalho-secao.tsx", "guia-do-atalho.tsx")
        expect(f).toContain('rpc("create_capture_token"')
        expect(f).toContain('rpc("revoke_capture_token"')
        expect(f).toContain("/functions/v1/capture")
        expect(f).not.toMatch(/select\(\s*["']\*["']\s*\)/)
        expect(f).not.toMatch(/github\.com|docs\/captura/)
        // Nenhum "token" em texto de tela (entre > e <).
        expect(lerFonte("src/components/account/guia-do-atalho.tsx")).not.toMatch(/>[^<{]*\btoken\b[^<]*</i)
    })
    it("o código vive só no estado do guia, e fechar o descarta", () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        expect(g).toMatch(/setCodigo\(null\)/)
        expect(g).toMatch(/setPasso\(0\)/)
        expect(g).not.toMatch(/localStorage|sessionStorage|console\./)
        expect(fonteTudo("atalho-secao.tsx", "guia-do-atalho.tsx")).not.toMatch(/setQueryData\(\s*\[\s*["']capture_tokens/)
    })
    it("o passo 1 cria pelo formulário, e só o sucesso avança", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toContain("Criar código")
        expect(g).toMatch(/<FormSubmit/)
        expect(g).toMatch(/if \(error\) return setErro\(mensagemDoErroDeToken\(error\)\)/)
    })
    it("o atalho assinado é baixado daqui, com as telas reais do iPhone", () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        for (const a of ["atalho-1-baixar", "atalho-2-arquivos", "atalho-3-configurar", "atalho-4-colar"])
            expect(g).toContain(`from "./assets/${a}.webp"`)
        expect(g).toContain('"/atalho/Lan%C3%A7ar%20gasto.shortcut"')
        expect(g).toMatch(/<a href=\{ARQUIVO_DO_ATALHO\} download>/)
        expect(g).not.toMatch(/NEXT_PUBLIC_CAPTURE_SHORTCUT_URL|icloud\.com|DeviceFrame/)
        expect(g).toContain("Montar à mão")
    })
    it("a cópia automática não quebra sem permissão, e o texto só promete a cópia que houve", () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        expect(g).toMatch(/clipboard\.writeText\([^)]*\)\.then\(\(\) => setCopiado\(true\)\)\.catch\(/)
        expect(g).toMatch(
            /copiado\s*\?\s*"Toque no campo e cole: o código já está copiado\."\s*:\s*"Copie o código abaixo, toque no campo e cole\."/,
        )
        expect(g).not.toMatch(/Toque no botão/)
    })
    it("os passos dividem uma célula só, e o inativo fica inerte", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toContain('className="grid"')
        expect(g).toContain("col-start-1 row-start-1")
        expect(g).toMatch(/inert=\{!ativo\}/)
        expect(g).toMatch(/!ativo && "invisible"/)
        expect(g).not.toContain("AnimatePresence")
    })
    it("os pontos ficam depois dos passos e antes do rodapé", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        const passos = g.indexOf("col-start-1 row-start-1")
        const pontos = g.indexOf('<div aria-hidden className="flex shrink-0 justify-center gap-1.5')
        const rodape = g.indexOf("<DialogFooter")
        expect(passos).toBeGreaterThan(0)
        expect(pontos).toBeGreaterThan(passos)
        expect(rodape).toBeGreaterThan(pontos)
    })
    it("o passo da Siri ensina a digitar, sem ditado", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toContain("<strong>digite</strong>")
        expect(g).not.toContain("Ditar")
    })
    it("a seção não fala em token na tela", () => {
        const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        expect(s).toContain("Desconectar este aparelho?")
        // Revogar saiu do texto; nenhuma frase (entre aspas, numa linha só) fala em token.
        expect(s).not.toMatch(/>\s*Revogar|"[^"\n]*(\btokens?\b|Revog)[^"\n]*"/)
    })
    it("os erros do banco em português", async () => {
        const { mensagemDoErroDeToken } = await import("./atalho-secao")
        expect(mensagemDoErroDeToken({ code: "P0001", message: "nao_membro" })).toBe("Você não é membro dessa carteira.")
        expect(mensagemDoErroDeToken({ code: "P0001", message: "limite_tokens" })).toBe(
            "Limite de 10 aparelhos conectados. Desconecte um para conectar outro.",
        )
        expect(mensagemDoErroDeToken({ code: "23514", message: "x" })).toBe("Nome do aparelho: de 1 a 60 caracteres.")
        expect(mensagemDoErroDeToken({ code: "23502", message: "x" })).toBe("Nome do aparelho: de 1 a 60 caracteres.")
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
    it("a data de membro é o selo, com a frase inteira como nome", () => {
        expect(p()).toContain("<Seal")
        expect(p()).toContain("label={`Membro desde ${formatTransactionMonthYearPtBr(user.created_at)}`}")
    })
    it("o endereço da captura não duplica a barra do fim", async () => {
        const { enderecoDeCaptura } = await import("./guia-do-atalho")
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

describe("Lançar sem abrir o app: o vazio", () => {
    it("o vazio convida a conectar, e o cabeçalho não repete a ação", () => {
        const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        expect(s).toContain("Lance gastos falando com a Siri")
        expect(s).toContain("Conectar o iPhone")
        expect(s).toMatch(/<EmptyState/)
        expect(s).not.toContain("Nenhum aparelho conectado.")
        expect(s).toMatch(/tokens\.length > 0 \?[\s\S]*Conectar aparelho/)
        expect(s).toMatch(/lista\.isError \|\| tokens\.length > 0 \?/)
    })
})
