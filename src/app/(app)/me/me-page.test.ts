import { describe, expect, it } from "vitest"
import { getVoceGroups } from "@/config/mobile-navigation"
import { lerFonte, semComentarios } from "@/test/fonte"

const PAGINA = semComentarios(lerFonte("src/app/(app)/me/page-client.tsx"))
const ROTA = semComentarios(lerFonte("src/app/(app)/me/page.tsx"))

describe("a página Você", () => {
    it("adia a montagem com o esqueleto da rota", () => {
        expect(ROTA).toContain("<AdiarMontagem fallback={<Loading />}>")
    })
    it("os grupos vêm da regra e das abas que saíram", () => {
        expect(PAGINA).toContain("getVoceGroups(useAbasFora(), useWorkspace().papel)")
        expect(PAGINA).toContain('<VoceAvatar size="xl" />')
    })
    it("o grupo do telefone fica entre Carteira e Conta, só abaixo do md, e a âncora do QR rola até ele", () => {
        expect(PAGINA).toContain("rolarAteAncora(window.location.hash, document)")
        const grupo = semComentarios(lerFonte("src/components/settings/neste-celular-grupo.tsx"))
        for (const texto of ['id="no-celular"', ">Neste celular<", "useLancamentoInteligente", "SyncStatusChip", "InstallPwaSheet", "Digite uma frase no +"]) expect(grupo).toContain(texto)
        // O ladrilho ficou só no ícone do app: Lançamento inteligente leva o ícone solto, como o Tema.
        expect(grupo).not.toContain("SettingsTile")
        // Com o app instalado a linha some, e a fila pendente segue alcançável.
        expect(grupo).toMatch(/instalado \? \(\s+shell && shell\.pendingSyncCount > 0/)
        expect(grupo).toContain(">Sincronização<")
        expect(grupo).not.toContain("instalado neste aparelho")
        expect(grupo).toMatch(/variant="primary"\s+className="w-full"/)
    })
    it("os grupos têm nome, e Sair é a última linha de Conta, com confirmação", () => {
        expect(PAGINA).toContain("<PageSectionTitle>{grupo.label}</PageSectionTitle>")
        expect(PAGINA).toContain("<AlertDialog")
        expect(PAGINA).toContain("Sair da conta?")
        // Última linha do grupo Conta, com ícone e sem chevron.
        expect(PAGINA).toContain('grupo.id === "conta" ?')
        expect(PAGINA).toContain("<ArrowRightStartOnRectangleIcon")
        expect(PAGINA).toContain('{grupo.id === "carteira" && isMobile ? <NesteCelularGrupo /> : null}')
        // Sem rede o sair falha: o diálogo fica aberto, pendente, e mostra o erro.
        expect(PAGINA).toContain("pending={saindo}")
        expect(PAGINA).toContain("<AlertDialogTrigger asChild>")
        expect(PAGINA).toContain("e.preventDefault()")
        expect(PAGINA).toContain("<AlertDialogError>{erro}</AlertDialogError>")
        expect(PAGINA).toContain("const { error } = await signOut()")
        expect(PAGINA).toContain("grupo.items.length === 0")
        expect(PAGINA).toContain('<VoceAvatar size="xl" />')
    })
    it("Cofre aberto diz o que é, e Cartões abre a carteira", () => {
        expect(PAGINA).toContain("item.description")
        const grupos = getVoceGroups([], "owner")
        expect(grupos[0].items.map((i) => i.name)).toEqual(["Cartões", "Contas a pagar", "Assinaturas", "Projetos", "Membros e convidados"])
        expect(grupos[1].items.find((i) => i.name === "Cofre aberto")?.description).toBe("Seus dados: exportar e apagar")
    })
    it("Neste celular: título, e o ladrilho só no ícone do app", () => {
        const grupo = semComentarios(lerFonte("src/components/settings/neste-celular-grupo.tsx"))
        expect(grupo).toContain(">Neste celular<")
        expect(grupo).toContain('aria-label="Lançamento inteligente"')
        expect(grupo).toContain("<label>")
        expect(grupo).toContain('titulo="Instalar o app"')
        expect(grupo).toContain("flex size-9 shrink-0 items-center justify-center rounded-row bg-black ring-1 ring-foreground/10")
    })
    it("cada linha é um link com ícone mini, nome e chevron", () => {
        expect(PAGINA).toContain("<ItemChevron")
        expect(PAGINA).toContain("miniIconFor(")
        // Nenhum componente declarado na tela (invariante 1): só o default export.
        expect(PAGINA.match(/function \w+\(/g)).toHaveLength(1)
    })
})

describe("os cartões e as linhas de Você", () => {
    const GRUPO = semComentarios(lerFonte("src/components/settings/neste-celular-grupo.tsx"))
    it("a IA em Conta: o cartão até a primeira, e então a linha com os nomes", () => {
        expect(PAGINA).toContain('{grupo.id === "conta" && ia === "cartao" ? <CartaoDaIa /> : null}')
        expect(PAGINA).toContain('!(ia === "cartao" && item.href === ROUTES.SETTINGS_IAS)')
        expect(PAGINA).toContain('descricaoDaLista((ias.data ?? []).map((g) => g.client.name), "IAs")')
        // O cartão fica entre o cabeçalho e a lista do grupo.
        const cabecalho = PAGINA.indexOf("</PageSectionHeader>")
        expect(cabecalho).toBeLessThan(PAGINA.indexOf("<CartaoDaIa />"))
        expect(PAGINA.indexOf("<CartaoDaIa />")).toBeLessThan(PAGINA.indexOf('<Card padding="none">'))
    })
    it("Lançar pelo iPhone em Neste celular: cartão, convite ou a linha depois do Tema", () => {
        expect(GRUPO.indexOf('{lancar === "cartao" ? <CartaoDeLancar onConectar={() => setGuiaAberto(true)} /> : null}')).toBeGreaterThan(-1)
        expect(GRUPO.indexOf('{lancar === "cartao" ? <CartaoDeLancar onConectar={() => setGuiaAberto(true)} /> : null}')).toBeGreaterThan(GRUPO.indexOf("</Card>"))
        expect(GRUPO.indexOf('{lancar === "convite" ? <ConviteDeInstalarCartao /> : null}')).toBeGreaterThan(-1)
        expect(GRUPO.indexOf('{lancar === "convite" ? <ConviteDeInstalarCartao /> : null}')).toBeGreaterThan(GRUPO.indexOf("</Card>"))
        // O convite entra solto, sem a seção "Instale o app" de Configurações dentro do grupo.
        expect(GRUPO).not.toContain("<ConviteDeInstalar />")
        const convite = semComentarios(lerFonte("src/components/settings/convite-de-instalar.tsx"))
        const cartao = convite.slice(convite.indexOf("export function ConviteDeInstalarCartao"), convite.indexOf("export function ConviteDeInstalar()"))
        expect(cartao).not.toContain("SettingsSection")
        expect(convite).toMatch(/<SettingsSection titulo="Instale o app">\s+<ConviteDeInstalarCartao \/>/)
        // O guia mora fora do ramo do cartão: o primeiro aparelho troca o cartão pela linha, e o guia não pode sumir no meio.
        expect(GRUPO).toContain("<GuiaDoAtalho")
        expect(GRUPO).not.toMatch(/lancar === "cartao" \?[^:]*GuiaDoAtalho/)
        expect(semComentarios(lerFonte("src/components/me/cartao-de-lancar.tsx"))).not.toMatch(/GuiaDoAtalho|refetch/)
        expect(GRUPO).toContain("href={ROUTES.SETTINGS_LANCAR}")
        expect(GRUPO.indexOf(">Tema<")).toBeLessThan(GRUPO.indexOf("href={ROUTES.SETTINGS_LANCAR}"))
        expect(GRUPO).toContain('descricaoDaLista(aparelhos.ativos.map((t) => t.name), "aparelhos")')
        // Com o convite, a linha e o botão de instalar saem: o convite já instala.
        expect(GRUPO).toMatch(/lancar === "convite" \? null : \(\s+<>\s+<SettingsRow\s+titulo="Instalar o app"/)
        expect(GRUPO).toContain('instalarNoIphone && lancar !== "convite"')
    })
    it("nenhum título nomeia a função só como Siri", () => {
        for (const f of [
            "src/components/me/cartao-da-ia.tsx",
            "src/components/me/cartao-de-lancar.tsx",
            "src/components/account/lancar-pelo-iphone-vazio.tsx",
            "src/components/settings/neste-celular-grupo.tsx",
        ]) {
            const fonte = semComentarios(lerFonte(f))
            expect(fonte).not.toMatch(/<(ItemTitle|EmptyStateTitle)[^>]*>[^<]*Siri/)
        }
    })
})

describe("signOut do provedor", () => {
    it("só limpa fila e caches depois de o Supabase sair de verdade", () => {
        const fonte = semComentarios(lerFonte("src/components/providers.tsx"))
        const corpo = fonte.slice(fonte.indexOf("const signOut = useCallback"), fonte.indexOf("const updateProfile"))
        expect(corpo).toContain("Não foi possível sair. Confira a conexão e tente de novo.")
        expect(corpo.indexOf("supabase.auth.signOut()")).toBeGreaterThan(-1)
        expect(corpo.indexOf("supabase.auth.signOut()")).toBeLessThan(corpo.indexOf("clearClientCaches()"))
        expect(fonte).toContain("signOut: () => Promise<{ error: string | null }>")
    })
    it("quem chama mostra o erro", () => {
        for (const f of ["src/app/(app)/account/page-client.tsx", "src/components/layout/user-menu.tsx"]) {
            const fonte = semComentarios(lerFonte(f))
            expect(fonte).toContain("toastError(error)")
        }
    })
})
