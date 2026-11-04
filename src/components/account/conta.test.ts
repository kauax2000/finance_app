import { existsSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { TELAS_DO_APPLE_PAY } from "@/components/account/passo-a-passo"

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

    it("o aparelho do atalho antigo pede o atalho novo", () => {
        expect(lerFonte("src/components/account/aparelhos-de-captura.ts")).toMatch(/const COLUNAS = "[^"]*\batalho_versao\b/)
        const f = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        expect(f).toContain("Baixe o atalho de novo para ter o formulário")
        expect(f).toContain("Baixar o atalho de novo")
        expect(f).toContain("ArrowDownTrayIcon")
        expect(f).toMatch(/t\.last_used_at != null && t\.atalho_versao == null/)
        expect(f).toMatch(/setSubstituir\(t\)/)
        expect(f).toMatch(/substituir=\{substituir\}/)
        expect(f).not.toContain("passoInicial")
    })

    it("baixar de novo cria um código novo com o nome e a carteira do aparelho, e só depois desconecta o antigo", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).not.toContain("passoInicial")
        expect(g).toContain("substituir?: CaptureToken")
        expect(g).toContain("setNome(substituir?.name ??")
        expect(g).toContain('setCarteira(substituir?.workspace_id ?? "")')
        expect(g).toContain("O código antigo para de funcionar quando você criar este.")
        const criar = g.indexOf('rpc("create_capture_token"')
        const revogar = g.indexOf('rpc("revoke_capture_token"')
        expect(criar).toBeGreaterThan(0)
        expect(revogar).toBeGreaterThan(criar)
        expect(g.slice(criar, revogar)).toContain("if (!resposta.error && substituir)")
        // Só o antigo, e uma vez só.
        expect(g.match(/rpc\("revoke_capture_token"/g)).toHaveLength(1)
        expect(g).toContain('rpc("revoke_capture_token", { p_id: substituir.id })')
        expect(g).toMatch(/if \(erroDaTroca\) setErro\(`[^`]*\$\{mensagemDoErroDeToken\(erroDaTroca\)\}`\)/)
        // O último passo nomeia a carteira usada no código.
        expect(g).toContain("setCarteira(carteiraEscolhida)")
    })

    it("cria, revoga e mostra o código uma vez só", () => {
        const f = fonteTudo("atalho-secao.tsx", "guia-do-atalho.tsx")
        expect(f).toContain('rpc("create_capture_token"')
        expect(f).toContain('rpc("revoke_capture_token"')
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
        expect(g).not.toContain("Montar à mão")
    })
    it("a cópia automática não quebra sem permissão, e o texto só promete a cópia que houve", () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        expect(g).toMatch(/clipboard\.writeText\([^)]*\)\.then\(\(\) => setCopiado\(true\)\)\.catch\(/)
        expect(g).toMatch(
            /copiado\s*\?\s*"Toque no campo e cole: o código já está copiado\."\s*:\s*"Copie o código abaixo, toque no campo e cole\."/,
        )
        expect(g).not.toMatch(/Toque no botão/)
    })
    it("só o passo ativo ocupa a folha, e a altura anda numa mola só", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        const p = semComentarios(lerFonte("src/components/account/passo-a-passo.tsx"))
        for (const n of ["CaixaDoPasso", "PecaDoPasso", "PontosDoPasso", "JanelaDoAparelho"]) expect(g).toContain(n)
        expect(g).toMatch(/from "@\/components\/account\/passo-a-passo"/)
        expect(g).not.toContain("useAlturaAnimada")
        expect(g).not.toContain("const PECA")
        expect(g).not.toContain("col-start-1 row-start-1")
        expect(g).not.toContain("AnimatePresence")
        expect(p).toContain('data-altura-em-voo=""')
        expect(p).toContain("useAlturaAnimada<HTMLDivElement>()")
        expect(p).toContain("staggerChildren: 0.03")
    })
    it("o guia do iPhone tem 6 passos, e o 7 virou outra seção", async () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        const lista = g.slice(g.indexOf("const PASSOS"), g.indexOf("]\n", g.indexOf("const PASSOS")))
        expect(lista.match(/titulo: "/g)).toHaveLength(6)
        expect(g).not.toContain("Lance ao pagar")
        expect(g).not.toMatch(/de 7/)
    })
    it("os pontos ficam depois dos passos e antes do rodapé", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        const passos = g.indexOf("<CaixaDoPasso")
        const pontos = g.indexOf("<PontosDoPasso")
        const rodape = g.indexOf("<DialogFooter")
        expect(passos).toBeGreaterThan(0)
        expect(pontos).toBeGreaterThan(passos)
        expect(rodape).toBeGreaterThan(pontos)
    })
    it("o último passo ensina a abrir o atalho", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toContain("Como abrir o atalho")
        for (const o of ["Siri", "Botão", "Toque", "Bloqueio", "Ícone"]) expect(g).toContain(`rotulo: "${o}"`)
        for (const x of [
            "Diga \"E aí Siri, Lançar gasto\".",
            "Ajustes › Botão de Ação › deslize até Atalho › Escolher um Atalho › Lançar gasto.",
            "Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto.",
            "Toque e segure a Tela Bloqueada › Personalizar › toque no + de baixo › Executar Atalho › Lançar gasto.",
            "No app Atalhos, toque e segure Lançar gasto › Compartilhar › Adicionar à Tela de Início.",
            "O atalho pergunta a frase ou um formulário, conforme o Lançamento inteligente em Configurações.",
        ])
            expect(g.replace(/\s+/g, " ")).toContain(x.replace(/\\"/g, '"'))
        expect(g).not.toContain("Ditar")
        for (const a of ["atalho-5-siri", "atalho-11-botao-de-acao", "atalho-12-acessibilidade", "atalho-13-tela-de-inicio", "atalho-14-tela-bloqueada"])
            expect(g).toContain(`from "./assets/${a}.webp"`)
        expect(g).toMatch(/tela=\{[^}]*COMO_ABRIR[^}]*\.tela\}/)
        expect(g).not.toContain('como === "siri"')
        expect(g).not.toMatch(/<TabsList[^>]*scrollable/)
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
        expect(lerFonte("src/components/account/aparelhos-de-captura.ts")).toContain("revoked_at == null")
        expect(f).toContain("AlertDialog")
        expect(f).not.toContain("window.confirm")
    })
})

describe("Configurações", () => {
    it("guarda os aparelhos de captura e as IAs, antes das notificações, que fecham a página", () => {
        const f = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        const ordem = ["<AtalhoSecao", "<IasSecao", "<NotificationPreferences"].map((t) => f.indexOf(t))
        expect(ordem.every((n) => n >= 0)).toBe(true)
        expect([...ordem].sort((a, b) => a - b)).toEqual(ordem)
    })
})

describe("a página Minha conta", () => {
    const p = () => lerFonte("src/app/(app)/account/page-client.tsx")
    it("compõe as seções, nesta ordem, sem wireframe nem menu ⋯", () => {
        const f = p()
        const ordem = ["Acesso e plano", "Privacidade", "Sair", "Excluir conta"].map((t) => f.indexOf(t))
        expect(ordem.every((n) => n >= 0)).toBe(true)
        expect(f).not.toMatch(/AtalhoSecao|IasSecao/)
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
        for (const f of ["aparelhos-de-captura.ts", "ias-secao.tsx"])
            expect(lerFonte(`src/components/account/${f}`)).toContain("meta: { errorToast: false }")
    })
    it("a data de membro é o selo, com a frase inteira como nome", () => {
        expect(p()).toContain("<Seal")
        expect(p()).toContain("label={`Membro desde ${formatTransactionMonthYearPtBr(user.created_at)}`}")
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

describe("Lançar gastos pelo iPhone: o vazio", () => {
    it("o vazio convida a conectar, e o cabeçalho não repete a ação", () => {
        const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        expect(s).toContain("Lance gastos sem abrir o app")
        expect(s).toContain("Conectar o iPhone")
        expect(s).toMatch(/<EmptyState/)
        expect(s).not.toContain("Nenhum aparelho conectado.")
        expect(s).toMatch(/tokens\.length > 0 \?[\s\S]*Conectar aparelho/)
        expect(s).toMatch(/lista\.isError \|\| tokens\.length > 0 \?/)
    })
})

describe("Lançar ao pagar", () => {
    const conta = (a: string) => semComentarios(lerFonte(`src/components/account/${a}`))
    it("os aparelhos vêm do hook, numa queryKey só", () => {
        const h = conta("aparelhos-de-captura.ts")
        expect(h).toContain('queryKey: ["capture_tokens", user?.id]')
        expect(h).toContain("COLUNAS")
        expect(h).toContain("revoked_at == null")
        expect(conta("atalho-secao.tsx")).toContain("useAparelhosDeCaptura()")
        expect(conta("atalho-secao.tsx")).not.toContain('from("capture_tokens")')
    })
    it("o convite mora na seção do iPhone e só aparece com aparelho conectado", () => {
        const a = conta("atalho-secao.tsx")
        expect(a).toMatch(/!lista\.isError && tokens\.length > 0 \? <ApplePayConvite \/> : null/)
        const c = conta("apple-pay-convite.tsx")
        expect(c).toContain("Lance ao pagar com Apple Pay")
        expect(c).toContain('<JanelaDoAparelho tela={TELA_DA_CARTEIRA} tamanho="mini" />')
        expect(c).toContain("Configurar")
        expect(c).toContain("<GuiaDoApplePay")
        expect(c).not.toContain("SettingsSection")
    })
    it("a página não tem mais uma seção própria para o Apple Pay", () => {
        expect(lerFonte("src/app/(app)/account/page-client.tsx")).not.toContain("ApplePaySecao")
    })
    it("nenhum texto de tela fala em token", () => {
        for (const f of ["apple-pay-convite.tsx", "guia-do-apple-pay.tsx"]) {
            const s = conta(f)
            expect(s).not.toMatch(/>[^<{]*\btokens?\b[^<]*</i)
            expect(s).not.toMatch(/"[^"\n]*\btokens?\b[^"\n]*"/i)
        }
    })
})

describe("Guia do Apple Pay", () => {
    const g = lerFonte("src/components/account/guia-do-apple-pay.tsx")
    const lista = g.slice(g.indexOf("const PASSOS"), g.indexOf("]\n", g.indexOf("const PASSOS")))
    it("tem 5 passos na ordem: o app, o +, colar a descrição, conferir e a notificação", () => {
        const titulos = [...lista.matchAll(/titulo: "([^"]+)"/g)].map((m) => m[1])
        expect(titulos).toEqual([
            "Abra o app Atalhos",
            "Toque em Automação e no +",
            "Cole a descrição",
            "Confira e salve",
            "Pague com o iPhone",
        ])
        const blocos = lista.slice(lista.indexOf("= [")).split("titulo:").slice(1)
        expect(blocos[0]).toContain("TELAS_DO_APPLE_PAY.atalhos")
        expect(blocos[1]).toContain("TELAS_DO_APPLE_PAY.adicionar")
        expect(blocos[2]).toContain("TELAS_DO_APPLE_PAY.descrever")
        expect(blocos[2]).toMatch(/<CampoDeCopiar[^>]*valor=\{DESCRICAO_DA_AUTOMACAO\}[^>]*multilinha/)
        expect(blocos[3]).not.toContain("tela:")
        expect(blocos[4]).toContain("TELA_DA_NOTIFICACAO")
    })
    it("a descrição nomeia a Carteira, o Lançar gasto e o sem confirmação", async () => {
        const { DESCRICAO_DA_AUTOMACAO } = await import("./guia-do-apple-pay")
        for (const t of ["Carteira", "Lançar gasto", "sem pedir confirmação"]) expect(DESCRICAO_DA_AUTOMACAO).toContain(t)
    })
    it("o texto nomeia os botões, guarda o caminho antigo e não fala difícil", () => {
        const s = semComentarios(g)
        for (const n of ["Atalhos", "Automação", "Descrever um atalho", "Transação", "Executar Imediatamente", "Lançar gasto"])
            expect(s).toContain(`<strong>${n}</strong>`)
        expect(s).not.toMatch(/gatilho|token|Entrada do atalho/i)
        expect(g).not.toContain("shortcut:")
    })
    it("o alvo cai na parte visível da janela", () => {
        for (const t of Object.values(TELAS_DO_APPLE_PAY)) {
            expect(t.ponto).toBeDefined()
            if (t.ancora === "topo") expect(t.ponto!.y).toBeLessThanOrEqual(58)
            else expect(t.ponto!.y).toBeGreaterThanOrEqual(42)
        }
    })
    it("recomeça ao abrir e não anima sob movimento reduzido", () => {
        expect(g).toMatch(/setPasso\(0\)/)
        expect(g).toContain("entrar={!reduzido && mudou}")
    })
})

describe("Linha do aparelho e da IA", () => {
    const atalho = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
    const ias = semComentarios(lerFonte("src/components/account/ias-secao.tsx"))
    for (const [nome, f] of [["atalho", atalho], ["ias", ias]] as const) {
        it(`${nome}: ladrilho e ⋯ com Desconectar destrutivo e ícone`, () => {
            expect(f).toContain('ItemMedia variant="tile"')
            expect(f).toContain('size="icon-md"')
            expect(f).toContain("<EllipsisHorizontalIcon aria-hidden />")
            expect(f).toContain('variant="destructive"')
            expect(f).toContain("LinkSlashIcon")
            expect(f).not.toContain("Desconectar…")
            expect(f).not.toMatch(/<ItemActions>\s*<Button[^>]*>\s*Desconectar/)
            expect(f).toContain("aria-label={`Mais opções para ${")
        })
        it(`${nome}: o AlertDialog fica fora do Card`, () => {
            expect(f.indexOf("<AlertDialog")).toBeGreaterThan(f.lastIndexOf("</Card>"))
        })
    }
    it("aparelho: ícone, marca da carteira e último gasto", () => {
        for (const s of ["DevicePhoneMobileIcon", "BadgeDot", "formatRelativeTimePtBr", '"ainda não lançou nada"', "último gasto"])
            expect(atalho).toContain(s)
        expect(atalho).not.toContain("formatDateTimeShortPtBr")
        expect(atalho).not.toContain('"nunca usado"')
        expect(atalho).toContain('carteira?.name ?? "Carteira"')
        expect(atalho).toContain("toLowerCase()")
    })
    it("o item do ⋯ só escolhe o alvo; o diálogo abre fora do menu", () => {
        expect(atalho).toMatch(/variant="destructive" onSelect=\{\(\) => setAlvo\(t\)\}/)
        expect(ias).toMatch(/onSelect=\{\(\) => setAlvo\(\{/)
    })
    it("IA: ícone de brilho", () => {
        expect(ias).toContain("SparklesIcon")
    })
})

describe("IAs conectadas: o vazio", () => {
    it("o vazio convida com as capas das IAs, e o cabeçalho não repete a ação", () => {
        const v = semComentarios(lerFonte("src/components/account/ias-vazio.tsx"))
        for (const t of [
            "Uma IA que entende o seu dinheiro",
            "Conecte o Claude ou o ChatGPT e peça análises, o resumo do mês e onde cortar. Ela também lê seus lançamentos e lança o que você pedir.",
            "Onde dá para cortar gastos este mês sem apertar demais?",
            "Resuma meu mês em 3 pontos",
            // As garantias são as que o código impõe ao token da IA.
            "Não edita nem apaga nada no Finance",
            "O que ela lança espera você conferir",
            "Você desconecta quando quiser",
            "Conectar uma IA",
        ])
            expect(v).toContain(t)
        expect(v).toMatch(/<Capa marca="claude"/)
        expect(v).toMatch(/<Capa marca="chatgpt"/)
        expect(v).toMatch(/<Capa marca="finance" tamanho="grande"/)
        expect(v).not.toMatch(/Grok|Gemini|MCP/)
        const s = semComentarios(lerFonte("src/components/account/ias-secao.tsx"))
        expect(s).toContain("<IasVazio")
        expect(s).not.toContain("Nenhuma IA conectada.")
        // Sem IA, o "Conectar" do cabeçalho some: quem convida é o vazio.
        expect(s).toMatch(/actions=\{[^}]*grants\.length/)
        // Com a lista em erro, o "Conectar" do cabeçalho continua.
        expect(s).toMatch(/actions=\{[^}]*lista\.isError \|\| grants\.length > 0/)
        const a = lerFonte(".claude/skills/design-system-guard/scripts/audit.mjs")
        expect(a.match(/"marcas-de-ia"/g)).toHaveLength(2)
    })
})

describe("Lançar ao pagar: o estado do cartão", () => {
    it("novo, aguardando e funcionando", async () => {
        const { estadoDoApplePay } = await import("./lancar-ao-pagar")
        const compra = { amount: 42.9, description: "Mercado", created_at: "2026-11-03T12:00:00Z" }
        expect(estadoDoApplePay(null, null)).toBe("novo")
        expect(estadoDoApplePay("2026-11-03T10:00:00Z", null)).toBe("aguardando")
        // A compra é a prova: funciona mesmo sem o Pronto do guia.
        expect(estadoDoApplePay(null, compra)).toBe("funcionando")
        expect(estadoDoApplePay("2026-11-03T10:00:00Z", compra)).toBe("funcionando")
    })
    it("lê a coluna da conta e a última compra pelo Apple Pay, e o Pronto salva", () => {
        const h = semComentarios(lerFonte("src/components/account/lancar-ao-pagar.ts"))
        expect(h).toContain('.select("apple_pay_configurado_em")')
        expect(h).toContain('.eq("source", "apple_pay")')
        expect(h).toContain("apple_pay_configurado_em: new Date().toISOString()")
        const g = semComentarios(lerFonte("src/components/account/guia-do-apple-pay.tsx"))
        expect(g).toMatch(/onConcluir\?\.\(\)\s*onOpenChange\(false\)/)
        const c = semComentarios(lerFonte("src/components/account/apple-pay-convite.tsx"))
        for (const t of ["Aguardando a 1ª compra", "Funcionando", "Ver os passos de novo", "onConcluir="]) expect(c).toContain(t)
    })
})
