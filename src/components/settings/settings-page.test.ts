import { describe, expect, it, vi } from "vitest"
import { NOTIFICATION_PREFERENCES_HREF } from "@/components/layout/notifications-panel-empty"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { desfazerPatch, type WorkspaceMemberNotificationPrefs } from "@/lib/workspace-notification-prefs"
import { lerFonte } from "@/test/fonte"

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
    it("Carteira vem primeiro", () => {
        const fonte = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        const ordem = ["<WorkspaceAppearanceSettings", "<ThemeSettings", "<NotificationPreferences", "<IaPrivacidadeSettings"].map((peca) => fonte.indexOf(peca))
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

    it("Carteira: as ações moram no ⋯, e cada uma respeita o papel", () => {
        const fonte = lerFonte("src/components/settings/workspace-appearance-settings.tsx")
        expect(fonte).toContain("<EllipsisVerticalIcon aria-hidden />")
        expect(fonte).toContain("<DropdownMenuContent")
        for (const texto of ["Editar", "Sair da carteira", "Excluir carteira"]) expect(fonte).toContain(texto)
        // Editar só sob `owner`; depois dele: excluir com canDeleteProject, sair com !owner, senão nada.
        expect(fonte).toMatch(/owner \? \(\s*<DropdownMenuItem onSelect=\{openEdit\}/)
        expect(fonte.match(/openEdit/g)).toHaveLength(2) // a definição e o único uso
        // Excluir só com canDeleteProject; sair só com !owner; dono pessoal: nada.
        expect(fonte).toMatch(/canDeleteProject\s*\?/)
        expect(fonte).toMatch(/!owner\s*\?/)
        expect(fonte).toMatch(/: null/)
    })

    it("Este aparelho e IA e privacidade ficam em linhas, sem os três arquivos antigos", () => {
        const pagina = lerFonte("src/app/(app)/settings/(raiz)/page-client.tsx")
        for (const fora of ["LancamentoSettings", "PwaSettingsSection", "IaConfiguracoesWireframe"]) expect(pagina).not.toContain(fora)
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
            "Abra o Finance no telefone",
            "@container/no-celular",
            "@max-xl/no-celular:hidden",
            "onCopied",
        ]) expect(cartao).toContain(texto)
        expect(aparelho).toContain("NoCelularCartao")
        expect(aparelho).toMatch(/<NoCelularCartao value=\{noTelefone\} \/>[\s\S]*<Card padding="none">/)
        expect(aparelho).not.toContain("Só tem efeito no telefone.")
        expect(aparelho.match(/Vale só neste aparelho/g)).toHaveLength(1)
        // No telefone nada daqui aparece: o grupo mora em Você.
        expect(aparelho).toContain("if (isMobile) return null")
        expect(aparelho).not.toContain('id="no-celular"')
        const ia = lerFonte("src/components/settings/ia-privacidade-settings.tsx")
        for (const texto of ["ROUTES.PRIVACY", "Groq e Cloudflare", "30 chamadas"]) expect(ia).toContain(texto)
    })

    it("Notificações: duas linhas de resumo que abrem os ajustes, com saída para o push bloqueado", () => {
        const f = lerFonte("src/components/settings/notification-preferences.tsx")
        for (const texto of ['id="notificacoes"', "Ver histórico", "Onde chega", "Sobre o quê", "resumoDosCanais(prefs)", "resumoDosTemas(prefs)", "href={ROUTES.SETTINGS_NOTIFICACOES_CANAIS}", "href={ROUTES.SETTINGS_NOTIFICACOES_TEMAS}", "Este aparelho bloqueou os avisos.", "Como liberar", "Nenhum canal ligado. Os avisos da carteira não vão chegar.", "Escolher canais"]) expect(f).toContain(texto)
        for (const fora of ["FormSwitch", "subscribeToPush", "CardToolbar", "Dialog"]) expect(f).not.toContain(fora)
        expect(f).toMatch(/semCanal\(prefs\) \?[\s\S]+: getPushSupportState\(\) === "denied"/)
    })
})
