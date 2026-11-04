import { existsSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { NOTIFICATION_PREFERENCES_HREF } from "@/components/layout/notifications-panel-empty"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { desfazerPatch, type WorkspaceMemberNotificationPrefs } from "@/lib/workspace-notification-prefs"
import { lerFonte, semComentarios } from "@/test/fonte"

vi.mock("@/lib/supabase", () => ({ supabase: {} }))

describe("Notificações: cada chave por si", () => {
    it("salvar uma chave não trava as outras", () => {
        const fonte = lerFonte("src/components/settings/notification-preferences.tsx")
        expect(fonte).not.toContain("updating")
        expect(lerFonte("src/hooks/use-workspace-notification-prefs.ts")).not.toContain("setUpdating")
    })

    it("a falha desfaz só as chaves daquele pedido", () => {
        const antes = { notify_email: true, notify_bills: true } as WorkspaceMemberNotificationPrefs
        const agora = { notify_email: false, notify_bills: false } as WorkspaceMemberNotificationPrefs
        expect(desfazerPatch(agora, antes, { notify_email: false })).toMatchObject({ notify_email: true, notify_bills: false })
        expect(desfazerPatch(null, antes, { notify_email: false })).toBeNull()
    })
})

describe("Configurações: ordem", () => {
    it("a Carteira saiu para o seletor; Aparelho vem primeiro", () => {
        const fonte = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        expect(fonte).not.toContain("WorkspaceAppearanceSettings")
        expect(fonte).not.toContain("Carteira")
        const ordem = ["<ThemeSettings", "<NotificationPreferences"].map((peca) => fonte.indexOf(peca))
        expect(ordem).toEqual([...ordem].sort((a, b) => a - b))
        expect(ordem[0]).toBeGreaterThan(-1)
    })
})

describe("Configurações: cabeçalho", () => {
    it("mostra o título sem um segundo h1, e no telefone quem o mostra é a casca", () => {
        const fonte = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        expect(fonte).toMatch(/isMobile \? null : \(\s+<PageHeader collapse>/)
        expect(fonte).toContain("<PageHeaderTitle asChild>")
        expect(fonte).toContain('<p aria-hidden="true">Configurações</p>')
    })
})

describe("Configurações: página única", () => {
    it("a seção Carteira saiu: o componente antigo não existe mais", () => {
        expect(existsSync("src/components/settings/workspace-appearance-settings.tsx")).toBe(false)
    })

    it("a página não tem abas, nem lê a query, e rola até a âncora", () => {
        const fonte = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        for (const proibido of ["Tabs", "useSearchParams", "useTelaLarga"]) expect(fonte).not.toContain(proibido)
        expect(fonte).toContain("rolarAteAncora")
    })

    it("Configurar notificações aponta para a âncora", () => {
        expect(NOTIFICATION_PREFERENCES_HREF).toBe("/settings#notificacoes")
    })

    it("rolarAteAncora rola até o elemento do hash", () => {
        const scrollIntoView = vi.fn()
        const doc = { getElementById: (id: string) => (id === "x" ? { scrollIntoView } : null) } as unknown as Document
        rolarAteAncora("#x", doc)
        expect(scrollIntoView).toHaveBeenCalledOnce()
    })

    it("rolarAteAncora não lança sem elemento ou sem hash", () => {
        const doc = { getElementById: () => null } as unknown as Document
        expect(() => rolarAteAncora("#nao-existe", doc)).not.toThrow()
        expect(() => rolarAteAncora("", doc)).not.toThrow()
    })

    it("Carteira: ações dentro do Editar carteira, abertas pelo seletor", () => {
        const fonte = lerFonte("src/components/workspace/acoes-da-carteira.tsx")
        expect(fonte).not.toContain("DropdownMenu")
        expect(fonte).not.toContain("EllipsisVerticalIcon")
        expect(fonte).toContain("Excluir carteira")
        expect(fonte).toContain("editar: openEdit,")
        expect(fonte.match(/openEdit/g)).toHaveLength(2) // a definição e o único uso
        const ini = fonte.indexOf("acoes={")
        const acoes = fonte.slice(ini, fonte.indexOf("\n            />", ini))
        expect(acoes).toMatch(/canDeleteProject \?[\s\S]*Excluir carteira/)
        expect(fonte).toMatch(/sair: atual && !eDono\(atual\) \? \(\) => setLeaveOpen\(true\)/)
        expect(acoes).not.toContain("setLeaveOpen")
        for (const texto of ["Divisão", "Datas e orçamento", "{podeDatas ? ("]) expect(acoes).toContain(texto)
        const dialogo = lerFonte("src/components/settings/workspace-appearance-edit-dialog.tsx")
        expect(dialogo).toMatch(/acoes\?: (React\.)?ReactNode/)
        expect(dialogo).toMatch(/<DialogBody[^>]*>[\s\S]*<CamposDaDivisao[\s\S]*\{acoes\}[\s\S]*<\/DialogBody>/)
    })

    it("Este aparelho fica em linhas, sem os três arquivos antigos, e a IA saiu da página", () => {
        const pagina = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        for (const fora of ["LancamentoSettings", "PwaSettingsSection", "IaConfiguracoesWireframe", "IaPrivacidadeSettings"]) expect(pagina).not.toContain(fora)
        const aparelho = lerFonte("src/components/settings/theme-settings.tsx")
        for (const texto of [
            "SyncStatusChip", "InstallPwaSheet",
            "No celular", "ROUTES.ME", "#no-celular",
            "pendingSyncCount",
        ]) expect(aparelho).toContain(texto)
        const cartao = lerFonte("src/components/settings/no-celular-cartao.tsx")
        for (const texto of [
            "overflow-visible",
            "iphone-17-pro-prata.webp",
            'alt=""',
            "QrCodeCopy",
            "link={false}",
            "wave={onda}",
            "@container/no-celular",
            "@max-xl/no-celular:hidden",
            "onCopied",
        ]) expect(cartao).toContain(texto)
        expect(aparelho).toContain("NoCelularCartao")
        expect(aparelho).toMatch(/<NoCelularCartao value=\{noTelefone\} \/>[\s\S]*<Card padding="none">/)
        expect(aparelho).not.toContain("Só tem efeito no telefone.")
        expect(aparelho).not.toContain("Vale só neste aparelho")
        // No telefone nada daqui aparece: o grupo mora em Você.
        expect(aparelho).toContain("if (isMobile) return null")
        expect(aparelho).not.toContain('id="no-celular"')
    })

    it("Notificações: os avisos, depois Canais e O que receber, sem rota nem Ver histórico", () => {
        const f = lerFonte("src/components/settings/notification-preferences.tsx")
        for (const texto of ['id="notificacoes"', "<NotificacoesCanais", "<NotificacoesTemas", "Este aparelho bloqueou os avisos.", 'storageKey="push-bloqueado"', "NotificationPreferencesSkeleton"]) expect(f).toContain(texto)
        for (const fora of ["subscribeToPush", "CardToolbar", "Ver histórico", "AlertAction", "ROUTES", "next/link"]) expect(f).not.toContain(fora)
        expect(f).toContain('getPushSupportState() === "denied"')
    })
})

describe("Configurações: o lançamento mora no celular", () => {
    it("a seção do iPhone só no iPhone instalado, e o convite no navegador do celular", () => {
        const f = semComentarios(lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx"))
        expect(f).toContain("useAparelhoDeLancar()")
        expect(f).toMatch(/"iphone-instalado"[^]*<AtalhoSecao \/>/)
        expect(f).toMatch(/"navegador-iphone"[^]*<ConviteDeInstalar iphone \/>/)
        expect(f).toMatch(/"navegador-android"[^]*<ConviteDeInstalar iphone=\{false\} \/>/)
        const ordem = ["<ThemeSettings", "<IasSecao", "<NotificationPreferences"].map((p) => f.indexOf(p))
        expect(ordem).toEqual([...ordem].sort((a, b) => a - b))
    })
    it("o convite não diz PWA e só promete o iPhone a quem tem iPhone", () => {
        // O import e o nome InstallPwaSheet são código, não texto da tela.
        const c = semComentarios(lerFonte("src/components/settings/convite-de-instalar.tsx"))
        expect(c).not.toMatch(/(?<![/\w-])PWA(?![/\w-])|standalone/i)
        expect(c).toContain("Ponha o Finance na tela de início")
        expect(c).toContain("No menu do navegador, toque em Instalar app.")
        expect(c).toContain("InstallPwaSheet")
        expect(c).toMatch(/iphone \?/)
    })
    it("a propaganda vende o celular com as funcionalidades novas", () => {
        const n = semComentarios(lerFonte("src/components/settings/no-celular-cartao.tsx"))
        expect(n).toContain("O dia a dia é no celular")
        for (const v of ["Lance falando com a Siri ou com um toque", "Lance digitando uma frase, com o app na tela de início"])
            expect(n).toContain(v)
        // Denso demais no cartão (pedido do dono): o formulário e o Apple Pay ficam no convite do iPhone.
        expect(n).not.toContain("Um formulário rápido")
        expect(n).not.toContain("Pague com Apple Pay")
        expect(n).toMatch(/no iPhone/)
        expect(n).not.toContain("Abra o Finance no telefone")
        expect(n).not.toMatch(/PWA/)
        expect(semComentarios(lerFonte("src/components/settings/theme-settings.tsx"))).not.toContain(
            "Lance por frase e instale o app no telefone.",
        )
    })
})
