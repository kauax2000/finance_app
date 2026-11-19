import { existsSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { TELAS_DO_APPLE_PAY } from "@/components/account/passo-a-passo"
import { MODOS_DO_ATALHO, modoDoGatilho, tituloDoAtalho, alvoDaTroca } from "@/components/account/gatilhos-do-atalho"
import { legendaDoAtalho } from "@/components/account/atalho-secao"
import type { CaptureToken } from "@/lib/supabase"

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

    it("o atalho novo troca o do mesmo modo (ou o de baixar de novo), e só depois desconecta o antigo", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).not.toContain("passoInicial")
        expect(g).toContain("substituir?: CaptureToken")
        expect(g).toContain("atalhos?: CaptureToken[]")
        expect(g).not.toContain("nomesEmUso")
        expect(g).toContain('setCarteira(substituir?.workspace_id ?? "")')
        expect(g).toContain("const trocado = alvoDaTroca(modo, substituir, atalhos)")
        expect(semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))).toMatch(/substituir=\{substituir\}\s+atalhos=\{tokens\}/)
        const criar = g.indexOf('rpc("create_capture_token"')
        const revogar = g.indexOf('rpc("revoke_capture_token"')
        expect(criar).toBeGreaterThan(0)
        expect(revogar).toBeGreaterThan(criar)
        expect(g.slice(criar, revogar)).toContain("if (!resposta.error && trocado)")
        // Só o antigo, e uma vez só.
        expect(g.match(/rpc\("revoke_capture_token"/g)).toHaveLength(1)
        expect(g).toContain('rpc("revoke_capture_token", { p_id: trocado.id })')
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
    it("o passo 2 cria o código pelo formulário, e só o sucesso avança", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toContain("Criar código")
        expect(g).toMatch(/<FormSubmit/)
        expect(g).toMatch(/if \(error\) return setErro\(mensagemDoErroDeToken\(error\)\)/)
    })
    it("o modo vem antes do código, e o arquivo baixado é o dele", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toMatch(/titulo: "Como você vai usar\?"/)
        expect(g.indexOf('"Como você vai usar?"')).toBeLessThan(g.indexOf('"Escolha a carteira"'))
        expect(g).toMatch(/<a href=\{atual\.arquivo\} download onClick=\{noAppDoIphone \? baixarPeloSafari : undefined\}>/)
        expect(g).toMatch(/<a href=\{outro\.arquivo\} download onClick=\{noAppDoIphone \? baixarPeloSafari : undefined\}>/)
        expect(g).toMatch(/icon=\{o\.valor === "voz" \? MicrophoneIcon : CursorArrowRippleIcon\}/)
        expect(g).toMatch(/from "@heroicons\/react\/16\/solid"/)
        expect(g).not.toMatch(/<TabsList aria-label="Como abrir o atalho">/)
        expect(g).toMatch(/<TabsList aria-label="Onde pôr o atalho">/)
        expect(g).toMatch(/setModo\(modoDoGatilho\(substituir\?\.atalho_gatilho \?\? null\)\)/)
        expect(g).toMatch(/setLugar\(LUGARES\.find\(\(l\) => l\.valor === substituir\?\.atalho_gatilho\)\?\.valor \?\? "acao"\)/)
        for (const t of ["Quer o outro também?", "O mesmo código serve.", "Baixar {outro.nome}"]) expect(g).toContain(t)
        for (const a of ["atalho-1-baixar", "atalho-2-arquivos", "atalho-3-configurar", "atalho-4-colar"])
            expect(g).toContain(`from "./assets/${a}.webp"`)
        expect(g).not.toMatch(/NEXT_PUBLIC_CAPTURE_SHORTCUT_URL|icloud\.com|DeviceFrame/)
        expect(g).not.toContain("Montar à mão")
    })
    it("dois arquivos: voz e toque, cada um com o seu nome", () => {
        expect(MODOS_DO_ATALHO.map((m) => m.arquivo)).toEqual([
            "/atalho/Lan%C3%A7ar%20gasto.shortcut",
            "/atalho/Lan%C3%A7ar%20gasto%20r%C3%A1pido.shortcut",
        ])
        expect(MODOS_DO_ATALHO.map((m) => m.nome)).toEqual(["Lançar gasto", "Lançar gasto rápido"])
        for (const { arquivo, nome } of MODOS_DO_ATALHO) {
            expect(decodeURIComponent(arquivo)).toBe(`/atalho/${nome}.shortcut`)
            expect(existsSync(`public/atalho/${nome}.shortcut`)).toBe(true)
        }
        expect(existsSync("public/atalho/siri")).toBe(false)
    })
    it("o gatilho guardado vira o modo: só a Siri é voz", () => {
        expect(modoDoGatilho("siri")).toBe("voz")
        expect(modoDoGatilho("acao")).toBe("toque")
        expect(modoDoGatilho(null)).toBe("toque")
    })
    it("trocar o gatilho com o código criado não cria outro código", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toMatch(/if \(codigo\) return irPara\(2\)/)
    })
    it("no app instalado do iPhone o download vai ao Safari, que salva o .shortcut", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toMatch(/useIsIos\(\) && isStandalone/)
        expect(lerFonte("src/components/account/guia-do-atalho.tsx")).toContain(
            "x-safari-https://${host}${caminho}",
        )
        expect(g).toMatch(/visibilityState === "visible"\) window\.location\.assign\(caminho\)/)
    })
    it("a cópia automática não quebra sem permissão, e o texto só promete a cópia que houve", () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        expect(g).toMatch(/clipboard\.writeText\([^)]*\)\.then\(\(\) => setCopiado\(true\)\)\.catch\(/)
        expect(g).toMatch(
            /copiado\s*\?\s*"Toque no campo e cole: o código já está copiado\."\s*:\s*"Copie o código abaixo, toque no campo e cole\."/,
        )
        expect(g).not.toMatch(/Toque no botão/)
    })
    it("a caixa tem a altura do maior passo: os outros são fantasmas na mesma célula", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        const p = semComentarios(lerFonte("src/components/account/passo-a-passo.tsx"))
        for (const n of ["CaixaDoPasso", "PecaDoPasso", "PontosDoPasso", "JanelaDoAparelho"]) expect(g).toContain(n)
        expect(g).toMatch(/from "@\/components\/account\/passo-a-passo"/)
        expect(g).not.toContain("useAlturaAnimada")
        expect(g).not.toContain("const PECA")
        expect(g).not.toContain("col-start-1 row-start-1")
        expect(g).not.toContain("AnimatePresence")
        expect(p).not.toContain("useAlturaAnimada")
        expect(p).toContain("[grid-area:1/1]")
        expect(p).toContain("aria-hidden inert")
        expect(g).toContain("fantasmas={fantasmas}")
        expect(p).toContain("staggerChildren: 0.03")
    })
    it("o guia do iPhone tem 7 passos: o gatilho, e depois os de antes", async () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        const lista = g.slice(g.indexOf("const PASSOS"), g.indexOf("]\n", g.indexOf("const PASSOS")))
        expect(lista.match(/titulo: "/g)).toHaveLength(7)
        expect(g).not.toContain("Lance ao pagar")
    })
    it("o passo 1 põe o celular no palco: legenda de vidro, seletor Voz | Toque e o botão diz o modo", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        const p = semComentarios(lerFonte("src/components/account/passo-a-passo.tsx"))
        expect(g).not.toContain("<RadioGroup")
        expect(g).toMatch(/<ToggleGroup\b[^>]*variant="segmented"/)
        expect(g).toContain('tamanho="palco"')
        expect(p).toMatch(/\bpalco: \{/)
        expect(g).not.toContain("OrbeDaSiri")
        expect(g).toMatch(/rounded-full bg-muted text-info">\s*<MicrophoneIcon aria-hidden className="size-4" \/>/)
        expect(g).toContain("E aí Siri, Lançar gasto")
        expect(g).toMatch(/Continuar com \$\{/)
        for (const l of ["Botão de Ação", "Costas", "Bloqueio", "Ícone"]) expect(g).toContain(`nome: "${l}"`)
        expect(g).toMatch(/aria-label=\{l\.aria \?\? l\.nome\}/)
        expect(g).toContain("menuPanelTintClassName")
        // O passo 1 em Voz e em Toque estão entre os fantasmas: a caixa não muda de altura com a escolha.
        expect(g).toMatch(/passoDe\(0, "siri", true\)/)
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
        expect(g).toContain("Ligue o gatilho")
        expect(MODOS_DO_ATALHO.map((o) => o.rotulo)).toEqual(["Voz", "Toque"])
        for (const x of [
            "Diga \"E aí Siri, Lançar gasto\". Ela pergunta e responde falando.",
            "Ajustes › Botão de Ação › deslize até Atalho › Escolher um Atalho › Lançar gasto rápido.",
            "Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto rápido.",
            "Toque e segure a Tela Bloqueada › Personalizar › toque no + de baixo › Executar Atalho › Lançar gasto rápido.",
            "No app Atalhos, toque e segure Lançar gasto rápido › Compartilhar › Adicionar à Tela de Início.",
            "O atalho pergunta a frase ou um formulário, conforme o Lançamento inteligente, em Você › Neste celular.",
        ])
            expect(g.replace(/\s+/g, " ")).toContain(x.replace(/\\"/g, '"'))
        expect(g).not.toContain("Ditar")
        for (const a of ["atalho-5-siri", "atalho-11-botao-de-acao", "atalho-12-acessibilidade", "atalho-13-tela-de-inicio", "atalho-14-tela-bloqueada"])
            expect(g).toContain(`from "./assets/${a}.webp"`)
        expect(g).toMatch(/tela=\{[^}]*COMO_ABRIR[^}]*\.tela\}/)
        expect(g).not.toContain('como === "siri"')
    })
    it("a seção não fala em token na tela", () => {
        const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        expect(s).toContain("Desconectar este atalho?")
        // Revogar saiu do texto; nenhuma frase (entre aspas, numa linha só) fala em token.
        expect(s).not.toMatch(/>\s*Revogar|"[^"\n]*(\btokens?\b|Revog)[^"\n]*"/)
    })
    it("os erros do banco em português", async () => {
        const { mensagemDoErroDeToken } = await import("./gatilhos-do-atalho")
        expect(mensagemDoErroDeToken({ code: "P0001", message: "nao_membro" })).toBe("Você não é membro dessa carteira.")
        expect(mensagemDoErroDeToken({ message: "limite_tokens" })).toBe("Limite de 10 atalhos. Desconecte um para criar outro.")
        expect(mensagemDoErroDeToken({ code: "P0001", message: "nao_encontrado" })).toBe("Este atalho não existe mais.")
        expect(mensagemDoErroDeToken({ code: "23514", message: "x" })).toBe("Não foi possível concluir. Tente de novo.")
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

describe("o que era de Minha conta", () => {
    it("as seções mostram o próprio erro, sem o toast global", () => {
        expect(lerFonte("src/components/account/aparelhos-de-captura.ts")).toContain("meta: { errorToast: false }")
        expect(lerFonte("src/hooks/use-ias-conectadas.ts")).toContain("meta: { errorToast: false }")
    })
    it("a data de membro é o selo na Você, com a frase inteira como nome", () => {
        const p = lerFonte("src/app/(app)/me/page-client.tsx")
        expect(p).toContain("<SeloDeMembro desde={user.created_at} />")
        expect(p).not.toContain("<Seal")
        const selo = lerFonte("src/components/account/selo-de-membro.tsx")
        for (const t of ["MEMBRO DESDE · ", "· FINANCE APP · ", "<AppLogo />", "label={`Membro desde ${formatTransactionMonthYearPtBr(desde)}`}"]) expect(selo).toContain(t)
    })
})

describe("IAs conectadas", () => {
    it("monta a URL com ou sem barra", async () => {
        const { urlDoMcp } = await import("./ias-secao")
        expect(urlDoMcp("https://x.supabase.co/")).toBe("https://x.supabase.co/functions/v1/mcp")
        expect(urlDoMcp("https://x.supabase.co")).toBe("https://x.supabase.co/functions/v1/mcp")
    })
    it("lista, confirma de verdade e mostra o erro sem derrubar a tela", () => {
        expect(lerFonte("src/hooks/use-ias-conectadas.ts")).toContain("listGrants")
        const f = lerFonte("src/components/account/ias-secao.tsx")
        expect(f).toContain("revokeGrant")
        expect(f).toContain("Não foi possível carregar as conexões.")
        expect(f).not.toContain("window.confirm")
    })
    it("as três instruções", () => {
        const d = lerFonte("src/components/account/conectar-ia-dialog.tsx")
        for (const t of ["Claude", "ChatGPT", "claude mcp add --transport http finance "]) expect(d).toContain(t)
    })
})

describe("Conectar minha IA: o guia", () => {
    it("o guia tem os cinco passos e o caminho de cada IA", () => {
        const g = semComentarios(lerFonte("src/components/account/conectar-ia-dialog.tsx")).replace(/\s+/g, " ")
        for (const t of [
            "Conectar minha IA",
            "Escolha sua IA",
            "Copie o endereço do Finance",
            "Copie o comando",
            "Autorize no Finance",
            "Faça a primeira pergunta",
            "Funciona em todos os planos. No gratuito, cabe um conector.",
            "Precisa de um plano pago e do Modo desenvolvedor.",
            "Toque em Adicionar conector personalizado.",
            "Abra Configurações › Conectores › Avançado e ligue o Modo desenvolvedor.",
            "Depois, digite /mcp e entre com a sua conta do Finance.",
            "Faça um raio-x do meu mês e me dê 3 dicas para economizar.",
            "Concluir",
        ])
            expect(g).toContain(t)
        expect(g).toContain("PontosDoPasso")
        expect(g).toMatch(/<Capa marca=/)
        expect(g).toContain("GARANTIAS")
        expect(semComentarios(lerFonte("src/components/account/ias-vazio.tsx"))).not.toMatch(/const GARANTIAS = \[/)
    })
})

describe("Conectar minha IA: a troca de passo orgânica", () => {
    it("a IA escolhida viaja ao título e o guia brota e recolhe pela viagem de passo", () => {
        const g = semComentarios(lerFonte("src/components/account/conectar-ia-dialog.tsx")).replace(/\s+/g, " ")
        for (const t of ["sairDaEscolhaPeloNome(", "chegarAoValor(", "sairDoValor(", "chegarAEscolha(", "recolherPasso(", "brotarPasso(", "semMovimento()"])
            expect(g).toContain(t)
        // A linha marcada e o nome que viaja; o título do guia recebe o nome.
        expect(g).toContain("<div key={chave} data-linha={chave}>")
        expect(g).toContain("<span data-nome>{IAS[chave].nome}</span>")
        expect(g).toContain("<span data-prefixo>Conectar o </span>")
        expect(g).toContain("<span data-nome>{escolhida.nome}</span>")
        // Só o passo atual leva `data-passo`, dentro da caixa que mede o maior (os fantasmas ficam).
        expect(g).toMatch(/<CaixaDoPasso[^>]*fantasmas=\{fantasmas\}>[^<]*<div ref=\{atualRef\} data-passo/)
        expect(g).toContain("if (trocando) return")
        expect(g).toContain("useLayoutEffect(")
    })
    it("as funções novas da viagem só somam: as de antes seguem com a mesma assinatura", () => {
        const v = lerFonte("src/lib/viagem-de-passo.ts")
        for (const t of [
            "export function sairDaEscolha(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, tocada: HTMLElement)",
            "export function sairDaEscolhaPeloNome(corpo: HTMLElement, cabecalho: HTMLElement, rodape: HTMLElement, tocada: HTMLElement)",
            "export function recolherPasso(corpo: HTMLElement)",
            "export function brotarPasso(corpo: HTMLElement)",
        ])
            expect(v).toContain(t)
    })
})

describe("CampoDeCopiar", () => {
    it("o timer da confirmação não apaga uma recusa posterior", () => {
        const f = lerFonte("src/components/account/campo-de-copiar.tsx")
        expect(f).toContain("clearTimeout")
        expect(f).toContain("useRef")
    })
})

describe("Lançar pelo iPhone: o vazio", () => {
    it("o vazio convida a adicionar; com atalho, a última linha da lista adiciona outro", () => {
        const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        const vazio = semComentarios(lerFonte("src/components/account/lancar-pelo-iphone-vazio.tsx"))
        expect(s).toContain("<LancarPeloIphoneVazio onConectar={() => setGuiaAberto(true)} />")
        expect(vazio).toContain("Lance gastos sem abrir o app")
        expect(vazio).toContain("Adicionar atalho")
        expect(vazio).not.toContain("Conecte o iPhone")
        expect(vazio).toMatch(/<EmptyState/)
        expect(s).not.toContain("Nenhum aparelho conectado.")
        expect(s).toMatch(/lista\.isError \|\| tokens\.length > 0 \?[\s\S]*Adicionar atalho/)
        expect(s).not.toContain("Conectar aparelho")
        expect(s).toContain("<PageSectionTitle>Atalhos</PageSectionTitle>")
        expect(s).toContain("<PageSectionTitle>Apple Pay</PageSectionTitle>")
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
        expect(a).toMatch(/!lista\.isError && tokens\.length > 0 \? \([\s\S]*<ApplePayConvite \/>[\s\S]*\) : null/)
        const c = conta("apple-pay-convite.tsx")
        expect(c).toContain("Lance ao pagar com Apple Pay")
        expect(c).toContain('<JanelaDoAparelho tela={TELA_DA_CARTEIRA} tamanho="mini" />')
        expect(c).toContain("Configurar")
        expect(c).toContain("<GuiaDoApplePay")
        expect(c).not.toContain("SettingsSection")
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
    it("atalho: ícone do modo, marca da carteira e último gasto", () => {
        for (const s of ["MicrophoneIcon", "CursorArrowRippleIcon", "BadgeDot", "formatRelativeTimePtBr", '"ainda não lançou nada"', "último gasto"])
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
            "Onde dá para cortar gastos este mês?",
            "Resuma meu mês em 3 pontos",
            "Conectar minha IA",
        ])
            expect(v).toContain(t)
        // As garantias são as que o código impõe ao token da IA, numa constante só (o guia diz as mesmas).
        expect(v).toContain("GARANTIAS.map")
        const m = lerFonte("src/components/account/marcas-de-ia.tsx")
        for (const t of [
            "Não edita nem apaga nada no Finance",
            "O que ela lança espera você conferir",
            "Você desconecta quando quiser",
        ])
            expect(m).toContain(t)
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

describe("Segurança no Editar perfil", () => {
    it("a seção mora no diálogo, entre o e-mail e os alertas", () => {
        const f = semComentarios(lerFonte("src/components/account/edit-profile-dialog.tsx"))
        for (const t of [">Segurança<", ">Alterar senha<", ">Excluir conta<", "<ChangePasswordDialog", "<DeleteAccountDialog"])
            expect(f).toContain(t)
        expect(f).toMatch(/text-destructive[^>]*>Excluir conta</)
        expect(f.match(/<button type="button" disabled=\{saving\}/g)).toHaveLength(2)
        const i = f.indexOf('id="edit-email"')
        const s = f.indexOf(">Segurança<")
        expect(i).toBeGreaterThan(-1)
        expect(s).toBeGreaterThan(i)
        expect(f.indexOf("{errorMessage &&", s)).toBeGreaterThan(s)
        // Dentro do DialogContent, depois do form: a gaveta filha empilha (NestedRoot) e não herda o pending.
        const fim = f.indexOf("</CustomForm>")
        expect(f.indexOf("<ChangePasswordDialog")).toBeGreaterThan(fim)
        expect(f.indexOf("<DeleteAccountDialog")).toBeGreaterThan(fim)
        expect(f.indexOf("<DeleteAccountDialog")).toBeLessThan(f.indexOf("</DialogContent>"))
    })
})

describe("Excluir conta: dois passos enxutos", () => {
    const f = semComentarios(lerFonte("src/components/security/DeleteAccountDialog.tsx"), "tudo")
    const aviso = f.slice(f.indexOf("const bodyWarning"), f.indexOf("const footerWarning"))
    const confirmar = f.slice(f.indexOf("const bodyConfirm"))
    it("os marcadores das fatias existem", () => {
        for (const m of ["const bodyWarning", "const footerWarning", "const bodyConfirm"])
            expect(f.indexOf(m)).toBeGreaterThan(-1)
    })
    it("o passo 1: o que se apaga com o total na ponta, e a cópia antes", () => {
        expect(aviso).not.toContain("Atenção")
        expect(aviso).not.toContain('variant="outline"')
        expect(aviso).not.toContain("Alert")
        expect(aviso.match(/<Card /g)).toHaveLength(1)
        expect(aviso).toContain('<Card variant="plain" padding="none">')
        expect(aviso).not.toContain("<Separator")
        for (const t of [
            "Será apagado",
            "Guarde uma cópia",
            "Tudo num .zip",
            '<Item variant="muted" size="lg" className="mt-3">',
            "<ArrowDownTrayIcon",
            'variant="secondary"',
            '"Exportando…" : "Exportar"',
            "aria-busy={exportando",
            "disabled={exportando || workspaces.length === 0}",
            "<Spinner",
            'aria-labelledby="delete-account-loss-title"',
            "{total && totais ? (",
            "numberBR(totais[total])",
        ]) expect(aviso).toContain(t)
        for (const t of [
            '{ label: "Lançamentos", icon: BanknotesIcon, total: "lancamentos" }',
            '{ label: "Carteiras", icon: WalletIcon, total: "carteiras" }',
            '{ label: "Categorias", icon: TagIcon, total: "categorias" }',
            '{ label: "Perfil e preferências", icon: UserCircleIcon, total: null }',
            'supabase.rpc("get_account_delete_impact")',
            "baixarExportacao(",
            "Não foi possível exportar agora. Tente novamente.",
            "\"Não dá para desfazer.\"",
        ]) expect(f).toContain(t)
        // A lista por carteira saiu do aviso, a pedido do dono.
        for (const t of ["Carteiras compartilhadas que você criou", "sharedOwned", "other_members"]) expect(f).not.toContain(t)
        expect(f).not.toMatch(/<DialogTitle[^>]*text-destructive/)
        expect(f).not.toContain("Passo 1 de 2")
        expect(f).toMatch(/<Button type="button" disabled=\{exportando\} onClick=\{\(e\) => void irPara\("confirm", e\.currentTarget\)\}>/)
    })
    it("o passo 2 pede só a senha", () => {
        expect(f).not.toContain("confirm-email")
        expect(f).not.toContain("confirmEmail")
        for (const t of ["Confirme com sua senha", "\"Sua conta e os dados acima serão apagados.\""]) expect(f).toContain(t)
        expect(confirmar).toContain('id="delete-password"')
        expect(confirmar).toContain("disabled={!password}")
    })
})

describe("a lista de atalhos", () => {
    it("a legenda é carteira · uso; o modo fica no título e no ícone", () => {
        const base = { last_used_at: null, atalho_gatilho: null } as CaptureToken
        expect(legendaDoAtalho({ ...base, atalho_gatilho: "siri" }, "Casa")).toBe("Casa · ainda não lançou nada")
        expect(legendaDoAtalho(base, "Casa")).toBe("Casa · ainda não lançou nada")
        expect(legendaDoAtalho({ ...base, last_used_at: new Date().toISOString() }, "Casa")).toMatch(/^Casa · último gasto /)
    })
    it("a lista fala de atalho, e cada um muda de carteira sem reinstalar", () => {
        const s = semComentarios(lerFonte("src/components/account/atalho-secao.tsx"))
        for (const t of ["Adicionar atalho", ">Atalhos<", "Mudar carteira", "Desconectar este atalho?", "tituloDoAtalho(t)", "MicrophoneIcon"])
            expect(s).toContain(t)
        expect(s).toContain("Não foi possível listar os atalhos.")
        expect(s).toMatch(/workspaces\.length > 1 \?[\s\S]*Mudar carteira[\s\S]*Desconectar/)
        expect(s).not.toContain("NOME_INVALIDO")
        const m = lerFonte("src/components/account/mudar-carteira-do-atalho.tsx")
        expect(m).toContain("set_capture_token_workspace")
        expect(m).toContain('surface="auto"')
        expect(m).toContain("<FormSubmit>Salvar</FormSubmit>")
        expect(m).toMatch(/<\/DialogHeader>\s+<CustomForm/)
        expect(m).toContain('className="flex min-h-0 min-w-0 flex-1 flex-col"')
        // A frase do erro mora em gatilhos-do-atalho: o diálogo e o guia não importam a seção.
        expect(m).not.toContain("atalho-secao")
        expect(lerFonte("src/components/account/guia-do-atalho.tsx")).not.toContain("atalho-secao")
    })
})

describe("o guia cria um atalho de cada modo, na carteira escolhida", () => {
    it("o título do atalho sai do gatilho; sem ele, o nome guardado", () => {
        expect(tituloDoAtalho({ name: "iPhone de Kauã", atalho_gatilho: "siri" })).toBe("Lançar gasto")
        for (const g of ["bloqueio", "acao", "toque", "inicio"] as const)
            expect(tituloDoAtalho({ name: "iPhone de Kauã", atalho_gatilho: g })).toBe("Lançar gasto rápido")
        expect(tituloDoAtalho({ name: "iPhone de Kauã", atalho_gatilho: null })).toBe("iPhone de Kauã")
    })
    it("o alvo da troca é um de cada modo: o de baixar de novo só se for do modo, senão o ativo do modo", () => {
        const t = (id: string, atalho_gatilho: CaptureToken["atalho_gatilho"]) => ({ id, atalho_gatilho }) as CaptureToken
        const voz = t("voz", "siri")
        const toque = t("toque", "bloqueio")
        const antigo = t("antigo", null)
        const atalhos = [voz, toque, antigo]
        expect(alvoDaTroca("voz", undefined, atalhos)).toBe(voz)
        expect(alvoDaTroca("toque", undefined, atalhos)).toBe(toque)
        expect(alvoDaTroca("toque", undefined, [voz, antigo])).toBeUndefined()
        // Baixar de novo o de voz e trocar para toque: sai o de toque, o de voz fica.
        expect(alvoDaTroca("toque", voz, atalhos)).toBe(toque)
        expect(alvoDaTroca("toque", voz, [voz])).toBeUndefined()
        expect(alvoDaTroca("voz", voz, atalhos)).toBe(voz)
        // O antigo, sem gatilho, sai quando é ele o de baixar de novo, em qualquer modo.
        expect(alvoDaTroca("voz", antigo, atalhos)).toBe(antigo)
        expect(lerFonte("src/components/account/guia-do-atalho.tsx")).toContain('"Substitui o atalho antigo."')
    })
    it("sem nome de aparelho: o passo 2 escolhe a carteira, e o código leva o modo", () => {
        const g = lerFonte("src/components/account/guia-do-atalho.tsx")
        expect(g).toContain("p_gatilho")
        expect(g).toContain("p_name: atual.nome")
        expect(g).toContain("<DialogTitle>Adicionar atalho</DialogTitle>")
        expect(g).toContain("Escolha a carteira")
        expect(g).toContain("Substitui o seu atalho de")
        expect(g).toContain("O atalho se chama")
        expect(g).toContain("Os gastos caem em {nomeDaCarteira}.")
        expect(g).not.toContain('label="Nome do aparelho"')
        expect(g).not.toContain("Conectar o iPhone")
        expect(existsSync("src/components/account/nome-livre.ts") ? lerFonte("src/components/account/nome-livre.ts") : "").not.toMatch(
            /nomeSugerido|nomeComModo/,
        )
    })
    it("o Voltar dos passos seguintes é o FormCancel, e no telefone sobe ao ‹ do canto", () => {
        const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
        expect(g).toContain("<FormCancel onClick={() => irPara(passo - 1)}>Voltar</FormCancel>")
        expect(g).not.toContain('<Button type="button" variant="tertiary" onClick={() => irPara(')
        expect(g).toContain('aria-label="Voltar"')
        expect(g).toContain("top-2.5 left-2.5")
        expect(g).toMatch(/celular && passo > 0 \?/)
        expect(g).toContain("<ChevronLeftIcon />")
    })
})

describe("o Voltar dos guias sobe ao ‹ do canto no telefone", () => {
    for (const arq of ["guia-do-apple-pay", "conectar-ia-dialog"]) {
        it(arq, () => {
            const g = semComentarios(lerFonte(`src/components/account/${arq}.tsx`))
            expect(g).toContain('aria-label="Voltar"')
            expect(g).toContain("top-2.5 left-2.5")
            expect(g).toMatch(/celular && passo > 0 \?/)
            expect(g).toContain("<ChevronLeftIcon />")
            expect(g).toMatch(/<FormCancel[\s\S]*?>\s*Voltar\s*<\/FormCancel>/)
            expect(g).not.toContain('className={passo === 0 ? "invisible"')
        })
    }
})

it("os seletores de carteira do atalho mostram o ladrilho de cada carteira", () => {
    for (const arquivo of ["guia-do-atalho.tsx", "mudar-carteira-do-atalho.tsx"]) {
        const f = lerFonte(`src/components/account/${arquivo}`)
        expect(f).toMatch(/<SelectItem key=\{w\.id\} value=\{w\.id\}>\s*<WorkspaceBrandMark iconKey=\{w\.icon\} backgroundColor=\{w\.icon_background_color\}/)
    }
})

it("o guia não tem descrição sob o título, e o ladrilho do Select guarda a tinta no foco", () => {
    const g = semComentarios(lerFonte("src/components/account/guia-do-atalho.tsx"))
    expect(g).not.toContain("<DialogDescription")
    expect(g).toContain("<DialogContent aria-describedby={undefined}>")
    expect(lerFonte("src/components/ui/select.tsx")).toContain("not-data-[variant=none]:focus:[&_[data-slot=color-tile]]:text-(--tile-ink)")
})
