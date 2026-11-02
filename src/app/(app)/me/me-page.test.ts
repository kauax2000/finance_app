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
    it("o grupo do telefone fecha a página, só abaixo do md, e a âncora do QR rola até ele", () => {
        expect(PAGINA).toContain("{isMobile ? <NesteCelularGrupo /> : null}")
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
    it("os grupos têm nome, e Sair pede confirmação e fecha a página", () => {
        expect(PAGINA).toContain("<PageSectionTitle>{grupo.label}</PageSectionTitle>")
        expect(PAGINA).toContain("<AlertDialog")
        expect(PAGINA).toContain("Sair da conta?")
        expect(PAGINA.indexOf("<NesteCelularGrupo")).toBeLessThan(PAGINA.indexOf("<AlertDialogTrigger"))
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

describe("signOut do provedor", () => {
    it("só limpa fila e caches depois de o Supabase sair de verdade", () => {
        const fonte = semComentarios(lerFonte("src/components/providers.tsx"))
        const corpo = fonte.slice(fonte.indexOf("const signOut = useCallback"), fonte.indexOf("const updateProfile"))
        expect(corpo).toContain("Não foi possível sair. Confira a conexão e tente de novo.")
        expect(corpo.indexOf("supabase.auth.signOut()")).toBeGreaterThan(-1)
        expect(corpo.indexOf("supabase.auth.signOut()")).toBeLessThan(corpo.indexOf("clearClientCaches()"))
        expect(corpo.indexOf("supabase.auth.signOut()")).toBeLessThan(corpo.indexOf("clearCurrentSession()"))
        expect(fonte).toContain("signOut: () => Promise<{ error: string | null }>")
    })
    it("quem chama mostra o erro", () => {
        for (const f of ["src/app/(app)/account/page-client.tsx", "src/components/layout/user-menu.tsx"]) {
            const fonte = semComentarios(lerFonte(f))
            expect(fonte).toContain("toastError(error)")
        }
    })
})
