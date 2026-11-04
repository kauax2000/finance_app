import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

const base = "src/app/(app)/settings"
const fonte = (c: string) => semComentarios(lerFonte(`${base}/${c}`))

const ROTAS = [
    ["lancar-pelo-iphone", "<AtalhoSecao />", "Lançar pelo iPhone"],
    ["ias", "<IasSecao />", "IAs conectadas"],
    ["notificacoes", "<NotificationPreferences />", "Notificações"],
] as const

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

    it("(raiz) manda o celular para /me sem montar as seções", () => {
        const f = fonte("(raiz)/page-client.tsx")
        expect(f).toContain("router.replace(ROUTES.ME)")
        expect(f).toContain("if (isMobile) return null")
    })

    it("IasSecao lê pelo hook compartilhado", () => {
        const f = semComentarios(lerFonte("src/components/account/ias-secao.tsx"))
        expect(f).toContain("useIasConectadas()")
        expect(f).not.toContain("listGrants")
    })
})
