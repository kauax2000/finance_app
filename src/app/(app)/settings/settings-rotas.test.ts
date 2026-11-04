import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const base = "src/app/(app)/settings"
const fonte = (c: string) => semComentarios(lerFonte(`${base}/${c}`))

const ROTAS = [
    ["lancar-pelo-iphone", "<AtalhoSecao />", "Lançar pelo iPhone"],
    ["ias", "<IasSecao />", "IAs conectadas"],
    ["notificacoes", "<NotificationPreferences />", "Notificações"],
    ["privacidade", "<PrivacidadeWireframe />", "Política de privacidade"],
] as const

/** As que são uma seção de Configurações sozinha (a política é o wireframe, sem a seção). */
const SECOES = ROTAS.filter(([pasta]) => pasta !== "privacidade")

describe("rotas das seções de Configurações", () => {
    it.each(ROTAS)("%s: page adia a montagem", (pasta) => {
        expect(fonte(`${pasta}/page.tsx`)).toContain("<AdiarMontagem fallback={<Loading />}>")
    })

    it.each(ROTAS)("%s: o cliente monta a seção e o título só fora do celular", (pasta, secao, titulo) => {
        const f = fonte(`${pasta}/page-client.tsx`)
        expect(f).toContain(secao)
        expect(f).toContain("<PageHeader collapse>")
        expect(f).toContain("{isMobile ? null : (")
        expect(f).toContain(`>${titulo}</p>`)
    })

    it.each(SECOES)("%s: a seção é a página, sem o título dela à vista", (pasta) => {
        expect(fonte(`${pasta}/page-client.tsx`)).toContain("<SecaoSozinha>")
    })

    it("no telefone o nome já nasce na barra", () => {
        const titulo = semComentarios(lerFonte("src/components/layout/titulo-da-tela.tsx"))
        expect(titulo).toContain("ROTAS_DE_VOCE_EM_SETTINGS.includes(pathname)")
        expect(titulo).toContain("docked: fixo ||")
        const secao = semComentarios(lerFonte("src/components/settings/settings-section.tsx"))
        expect(secao).toContain('className={sozinha ? "sr-only" : undefined}')
    })

    it("(raiz) manda o celular para /me sem montar as seções", () => {
        const f = fonte("(raiz)/page-client.tsx")
        expect(f).toContain("router.replace(ROUTES.ME)")
        expect(f).toContain("if (isMobile) return null")
    })

    it("privacidade tem o esqueleto das Configurações", () => {
        expect(fonte("privacidade/loading.tsx")).toContain("<SettingsPageSkeleton />")
    })

    it("IasSecao lê pelo hook compartilhado", () => {
        const f = semComentarios(lerFonte("src/components/account/ias-secao.tsx"))
        expect(f).toContain("useIasConectadas()")
        expect(f).not.toContain("listGrants")
    })
})
