import { readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"

import {
    AuthMiniApp,
    MINI_APP_PEOPLE,
    MINI_APP_URL,
    type MiniAppScreen,
} from "@/components/auth/showcase/mini-app"
import { AuthShowcase, focoPulaORoteiro } from "@/components/auth/showcase/auth-showcase"
import { sceneFamily, type AuthSceneId } from "@/components/auth/showcase/scene-context"
import { FAMILY_CAPTION, FAMILY_ORDER, SCENES, SCRIPT_STAGE_REST, scriptStage } from "@/components/auth/showcase/scenes"
import { finalFrame, planScript } from "@/lib/scene-script"
import { ShowcaseHero, ShowcaseStage } from "@/components/ui/showcase"
import { IDENTITY_TONES, identityToneFor } from "@/lib/avatar"
import { getInitials } from "@/lib/utils"

import {
    AuthTestimonialCard,
    TESTIMONIALS,
    TESTIMONIAL_SLOTS,
    testimonialsFor,
} from "@/components/auth/showcase/testimonials"
import { lerFonte, semComentarios } from "@/test/fonte"

describe("depoimentos ilustrativos (8a)", () => {
    it("são 14 frases curtas, sem dígito nem dinheiro", () => {
        expect(TESTIMONIALS).toHaveLength(14)
        expect(new Set(TESTIMONIALS.map((t) => t.id)).size).toBe(14)
        for (const { quote } of TESTIMONIALS) {
            expect(quote.length, quote).toBeLessThanOrEqual(90)
            expect(quote, quote).not.toMatch(/\d/)
            expect(quote, quote).not.toContain("R$")
        }
    })

    it('o nome é só "Primeiro I."', () => {
        for (const { name } of TESTIMONIALS) expect(name).toMatch(/^\p{Lu}\p{Ll}+ \p{Lu}\.$/u)
    })

    it("cada família põe 12 frases distintas nos 12 lugares", () => {
        for (const family of ["login", "register", "recovery", "invite"] as const) {
            const ids = TESTIMONIAL_SLOTS[family]
            expect(ids).toHaveLength(12)
            expect(new Set(ids).size, family).toBe(12)
            expect(testimonialsFor(family).every(Boolean)).toBe(true)
        }
    })

    it("vindo do login, só trocam os lugares da tabela", () => {
        const trocam = (family: "register" | "recovery" | "invite") =>
            TESTIMONIAL_SLOTS[family].flatMap((id, slot) => (id === TESTIMONIAL_SLOTS.login[slot] ? [] : [slot]))
        expect(trocam("register")).toEqual([1, 4, 7, 8, 10])
        expect(trocam("recovery")).toEqual([0, 4, 11])
        expect(trocam("invite")).toEqual([1, 3, 9])
    })

    it('o cartão diz "exemplo" e põe o selo pelos quatro data-edge', () => {
        const html = renderToStaticMarkup(createElement(AuthTestimonialCard, { testimonial: TESTIMONIALS[0] }))
        expect(html).toContain(">exemplo<")
        expect(html).toContain("“Quitei o cartão")

        const fonte = semComentarios(lerFonte("src/components/auth/showcase/testimonials.tsx"))
        // `bottom` e `start` ficam no padrão (topo, à direita); `end` e `top` mudam o lugar.
        expect(fonte).toContain('"ms-auto"')
        expect(fonte).toContain("group-data-[edge=end]/showcase-item:order-first")
        expect(fonte).toContain("group-data-[edge=end]/showcase-item:me-auto")
        expect(fonte).toContain("group-data-[edge=top]/showcase-item:hidden")
        expect(fonte).toContain("group-data-[edge=top]/showcase-item:inline-flex")
        expect(fonte).toContain("line-clamp-3")
        const prosa = lerFonte("src/components/auth/showcase/testimonials.tsx")
        for (const edge of ["end", "start", "bottom", "top"]) expect(prosa).toContain(` * - \`${edge}\``)
    })
})

describe("o mundo comum (8b)", () => {
    const pasta = "src/components/auth/showcase"
    const fontes = readdirSync(pasta)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => [f, semComentarios(lerFonte(`${pasta}/${f}`))] as const)

    it("o dinheiro grande nunca cai no mono, e a busca nunca escuta o teclado", () => {
        for (const [f, fonte] of fontes) {
            for (const tag of fonte.match(/<MoneyDisplay\b[^>]*>/g) ?? []) {
                if (/size="(xl|2xl)"/.test(tag)) expect(tag, f).toContain("mono={false}")
            }
            for (const tag of fonte.match(/<TopBarSearch\b[^>]*>/g) ?? []) expect(tag, f).toContain("listen={false}")
        }
    })

    it("o palco não tem nada que colida com o formulário de verdade", () => {
        for (const [f, fonte] of fontes) {
            for (const proibido of ["<input", "<form", 'type="password"', " id=", " name=", "<Alert", "InputOTP"]) {
                expect(fonte, `${f}: ${proibido}`).not.toContain(proibido)
            }
        }
    })

    it("as pessoas da casa caem na identidade do cursor de cada uma", () => {
        expect(identityToneFor(MINI_APP_PEOPLE.ana.color, MINI_APP_PEOPLE.ana.name)).toBe(IDENTITY_TONES[0])
        expect(identityToneFor(MINI_APP_PEOPLE.rafael.color, MINI_APP_PEOPLE.rafael.name)).toBe(IDENTITY_TONES[4])
        expect(identityToneFor(MINI_APP_PEOPLE.voce.color, MINI_APP_PEOPLE.voce.name)).toBe(IDENTITY_TONES[2])
        expect(getInitials(MINI_APP_PEOPLE.voce.name)).toBe("VC")
    })

    const tela = (form: "browser" | "tablet" | "phone", screen: MiniAppScreen, member = false) =>
        renderToStaticMarkup(
            createElement(
                ShowcaseStage,
                null,
                createElement(
                    ShowcaseHero,
                    { form, url: MINI_APP_URL[screen] },
                    createElement(AuthMiniApp, { screen, member })
                )
            )
        ).replace(/\u00a0/g, " ") // o `currencyBRL` escreve "R$" com espaço que não quebra

    it("o painel diz que é exemplo nas três formas, e as contas fecham", () => {
        for (const form of ["browser", "tablet", "phone"] as const) {
            const html = tela(form, "dashboard")
            expect(html, form).toContain(">dados de exemplo<")
            expect(html, form).toContain("R$ 4.182,60")
            expect(html, form).toContain("+7,8% vs setembro")
        }
        // Entradas menos saídas é o saldo; o saldo sobre setembro é o +7,8%.
        expect(7850 - 3667.4).toBeCloseTo(4182.6, 2)
        expect(Math.round((4182.6 / 3880 - 1) * 1000) / 10).toBe(7.8)
    })

    it("as âncoras dos cursores existem onde as cenas as procuram", () => {
        expect(tela("browser", "dashboard")).toContain('data-showcase-anchor="search"')
        expect(tela("phone", "dashboard")).not.toContain('data-showcase-anchor="search"')
        expect(tela("phone", "budget")).toContain('data-showcase-anchor="budget"')
        for (const member of [false, true]) {
            const html = tela("tablet", "wallet", member)
            expect(html).toContain('data-showcase-anchor="avatar-add"')
            expect(html).toContain('data-showcase-anchor="row-internet"')
        }
        expect(tela("browser", "invoice")).toContain("R$ 1.284,60")
        expect(tela("tablet", "wallet-loading")).toContain('data-slot="skeleton"')
    })

    it("a carteira fecha: a sua parte é um terço nos dois lados do convite, e quem pagou só no tablet", () => {
        for (const member of [false, true]) {
            const html = tela("tablet", "wallet", member)
            expect(html).toContain(">Sua parte<")
            expect(html).not.toContain("Por pessoa")
            expect(html).toContain("R$ 828,27")
            expect(html).toContain("Quem pagou em outubro")
        }
        expect(tela("phone", "wallet")).not.toContain("Quem pagou em outubro")
        expect(tela("browser", "wallet")).not.toContain("Quem pagou em outubro")
        expect(Math.round((2150 + 119.9 + 214.9) / 3 * 100) / 100).toBe(828.27)
        // Já pago: o aluguel (Rafael) e a feira (Ana); falta a internet.
        expect(Math.round(((2150 + 214.9) / 2484.8) * 100)).toBe(95)
    })
})

describe("a orquestração (8c)", () => {
    const IDS = Object.keys(SCENES) as AuthSceneId[]
    const FONTE = semComentarios(lerFonte("src/components/auth/showcase/auth-showcase.tsx"))

    it("as 17 cenas têm uma linha cada, na família do próprio id", () => {
        expect(IDS).toHaveLength(17)
        for (const id of IDS) expect(SCENES[id].family, id).toBe(sceneFamily(id))
    })

    it("a forma é da família: login no navegador, convite no tablet, cadastro e recuperação no celular", () => {
        const forma = { login: "browser", invite: "tablet", register: "phone", recovery: "phone" } as const
        for (const id of IDS) {
            const esperada = id === "recovery.done" ? "browser" : forma[SCENES[id].family]
            expect(SCENES[id].form, id).toBe(esperada)
        }
    })

    it("a legenda é da família, sem dígito nem promessa de número", () => {
        for (const id of IDS) {
            const { caption, family } = SCENES[id]
            expect(caption, id).toBe(FAMILY_CAPTION[family])
            expect(caption.title + caption.description, id).not.toMatch(/\d/)
        }
    })

    it("os roteiros e a celebração moram onde o plano diz", () => {
        const comRoteiro = IDS.filter((id) => SCENES[id].script).map((id) => [id, SCENES[id].script])
        expect(comRoteiro).toEqual([
            ["login", "palette-login"],
            ["login.session-expired", "palette-session"],
            ["login.password-updated", "palette-security"],
            ["recovery.password", "masked-password"],
        ])
        expect(IDS.filter((id) => SCENES[id].celebrate)).toEqual(["recovery.done"])
    })

    it("cada pessoa tem o tom do próprio cursor, uma vez por cena", () => {
        const tom = { Você: 3, Ana: 1, Rafael: 5 } as const
        for (const id of IDS) {
            const nomes = SCENES[id].cursors.map((c) => c.name)
            expect(new Set(nomes).size, id).toBe(nomes.length)
            for (const c of SCENES[id].cursors) expect(c.tone, `${id} ${c.name}`).toBe(tom[c.name])
        }
    })

    it("o giro segue a ordem das famílias", () => {
        expect(FAMILY_ORDER).toEqual({ login: 0, invite: 1, register: 2, recovery: 3 })
    })

    it("o foco que pula o roteiro é o de quem foi trabalhar na coluna, e não o do título", () => {
        // Sem DOM no vitest: um elemento de mentira com `matches` e `closest`.
        const el = (seletores: string[], naColuna = true) =>
            ({
                matches: (s: string) => s.split(",").some((p) => seletores.includes(p.trim())),
                closest: (s: string) => (naColuna && s === "[data-slot=split-shell-main]" ? {} : null),
            }) as unknown as EventTarget
        expect(focoPulaORoteiro(el(["input"]))).toBe(true)
        expect(focoPulaORoteiro(el(["a"]))).toBe(true)
        expect(focoPulaORoteiro(el(["button"]))).toBe(true)
        expect(focoPulaORoteiro(el(["h1", '[tabindex="-1"]']))).toBe(false)
        expect(focoPulaORoteiro(el(["a", '[tabindex="-1"]']))).toBe(false)
        expect(focoPulaORoteiro(el(["input"], false))).toBe(false)
        expect(focoPulaORoteiro(null)).toBe(false)
    })

    it("o painel anda 80ms depois da coluna, num commit só dele, e a paleta só vem com o palco à vista", () => {
        expect(FONTE).toContain("RESPOSTA_DO_PAINEL_MS = 80")
        expect(FONTE).toMatch(/const Palco = React\.memo\(/)
        expect(FONTE).toMatch(/export const AuthShowcase = React\.memo\(/)
        expect(FONTE).toMatch(/dynamic\(\s*\(\) => import\("@\/components\/auth\/showcase\/palette-demo"\)/)
        expect(FONTE).toContain("{ ssr: false }")
        expect(FONTE).toContain("<ShowcaseStage parallax")
        expect(FONTE).not.toMatch(/from ["']motion/)
        expect(FONTE).not.toContain("requestAnimationFrame")
        expect(FONTE).not.toMatch(/addEventListener\("pointermove"/)
    })

    it("cada cena desenha o palco na forma dela, com a legenda e os capítulos", () => {
        for (const id of IDS) {
            const html = renderToStaticMarkup(createElement(AuthShowcase, { scene: id }))
            expect(html, id).toContain('data-slot="showcase-stage"')
            expect(html, id).toContain(`data-form="${SCENES[id].form}"`)
            expect(html, id).toContain(SCENES[id].caption.title)
            expect(html, id).toContain('data-slot="showcase-dots"')
            // O chip do celular e do tablet toma o lugar de um cartão (s3 e s0): a colagem fica com onze.
            const vaga = SCENES[id].chip !== "none" && SCENES[id].form !== "browser" ? 1 : 0
            expect(html.match(/data-slot="auth-testimonial"/g)?.length, id).toBe(12 - vaga)
        }
    })
})

describe("o cadastro (8e)", () => {
    const FONTE = semComentarios(lerFonte("src/components/auth/showcase/auth-showcase.tsx"))
    const MINI = semComentarios(lerFonte("src/components/auth/showcase/mini-app.tsx"))
    const palco = (scene: AuthSceneId) =>
        renderToStaticMarkup(createElement(AuthShowcase, { scene })).replace(/ /g, " ")

    it("o cadastro: o orçamento, você pousando no Mercado sem clique e o chip do mesmo painel", () => {
        const { cursors, chip, screen, overlay } = SCENES.register
        expect(screen).toBe("budget")
        expect(overlay).toBe("none")
        expect(chip).toBe("synced")
        expect(cursors).toEqual([{ name: "Você", tone: 3, anchor: "budget", from: "bottom", delay: 450 }])
        // A âncora é a barra do Mercado, não a pilha de quem divide.
        expect(MINI).not.toMatch(/<AvatarGroup[^>]*data-showcase-anchor/)
        const html = palco("register")
        expect(html.indexOf('data-showcase-anchor="budget"')).toBeGreaterThan(html.indexOf("Quem divide a casa"))
        expect(html.indexOf('data-showcase-anchor="budget"')).toBeLessThan(html.indexOf(">Mercado<"))
        expect(html).toContain("R$ 612,00")
        // O chip só pousa no navegador (precisa da caixa do herói): a fonte é que o garante.
        expect(FONTE).toMatch(/title="Mesmo painel no computador"[\s\S]*?sincronizado/)
    })

    it("o confirme: a ilha vira o aviso com o véu, e o chip e o cursor saem", () => {
        for (const id of ["register.confirm", "register.confirm-invite"] as const) {
            expect(SCENES[id].cursors, id).toEqual([])
            expect(SCENES[id].chip, id).toBe("none")
            expect(SCENES[id].dots, id).toEqual({ chapter: 1, fill: 1 })
        }
        const confirme = palco("register.confirm")
        expect(confirme).toContain('data-slot="device-frame-notification"')
        expect(confirme).toContain("Confirme seu e-mail")
        expect(confirme).not.toContain('aria-label="Quem está na Casa"')
        // O véu da área de conteúdo e o das abas (o aviso, na ilha, fica aceso).
        expect(FONTE).toContain("[&_[data-slot=device-frame-nav]]:brightness-60")
        expect(confirme).toContain("[&amp;_[data-slot=device-frame-nav]]:brightness-60")
        expect(palco("register")).not.toContain("[&amp;_[data-slot=device-frame-nav]]:brightness-60")
    })

    it("com convite, o aviso chama para a Casa e mostra quem já está lá", () => {
        const html = palco("register.confirm-invite")
        expect(html).toContain("Confirme e entre na Casa")
        expect(html).toContain("Convite da Ana C.")
        expect(html).toMatch(/data-slot="avatar-group" data-size="xs"[^>]*aria-label="Quem está na Casa"/)
        // Na linha da frase, e não numa linha abaixo: o aviso não cresce e não corta o saldo (8e, rodada 1).
        expect(html).toMatch(/Convite da Ana C\.<\/p><div[^>]*data-slot="avatar-group"/)
    })

    it("o orçamento entra 250ms depois da troca e sai na hora", () => {
        expect(FONTE).toContain("ENTRADA_DO_ORCAMENTO_MS = 250")
        expect(FONTE).toMatch(/if \(!ligado && mostrado\) setMostrado\(false\)/)
        // O cursor abre com o orçamento: aberto antes, mediria um alvo que ainda não existe.
        expect(FONTE).toContain('spec.screen === "budget" && !orcamento ? SEM_CURSORES : spec.cursors')
    })
})

describe("o login e a paleta (8d)", () => {
    const PALETA = semComentarios(lerFonte("src/components/auth/showcase/palette-demo.tsx"))
    const MINI = semComentarios(lerFonte("src/components/auth/showcase/mini-app.tsx"))

    it("o roteiro do login muda o palco na ordem do plano: clique, paleta, fatura, celular e volta", () => {
        const fases = planScript("palette-login").map(({ beat }) => scriptStage("palette-login", beat, false))
        const passos = fases.filter((f, i) => i === 0 || JSON.stringify(f) !== JSON.stringify(fases[i - 1]))
        expect(passos).toEqual([
            SCRIPT_STAGE_REST,
            { search: "pressed", screen: "dashboard", phone: false },
            { search: "palette", screen: "dashboard", phone: false },
            SCRIPT_STAGE_REST,
            { search: "rest", screen: "invoice", phone: false },
            { search: "rest", screen: "invoice", phone: true },
            { search: "rest", screen: "invoice", phone: false },
        ])
        // O repouso é a fatura no navegador; as outras paletas fecham e ficam no painel, sem celular.
        expect(scriptStage("palette-login", finalFrame(planScript("palette-login")).beat, false)).toEqual({
            search: "rest",
            screen: "invoice",
            phone: false,
        })
        for (const script of ["palette-session", "palette-security"] as const) {
            const fim = planScript(script)
            expect(fim.some(({ beat }) => scriptStage(script, beat, false).phone), script).toBe(false)
            expect(scriptStage(script, finalFrame(fim).beat, false), script).toEqual(SCRIPT_STAGE_REST)
        }
    })

    it("com movimento reduzido o quadro é um só: a paleta aberta sobre o painel", () => {
        for (const script of ["palette-login", "palette-session", "palette-security"] as const) {
            expect(scriptStage(script, finalFrame(planScript(script)).beat, true)).toEqual({
                search: "palette",
                screen: "dashboard",
                phone: false,
            })
        }
        expect(scriptStage("masked-password", "type", false)).toBe(SCRIPT_STAGE_REST)
        expect(scriptStage(null, "idle", true)).toBe(SCRIPT_STAGE_REST)
    })

    it("a paleta é a Command de verdade, digitada por valor, sem ouvir o teclado", () => {
        expect(PALETA).toMatch(/<Command\s+variant="panel"\s+shouldFilter=\{false\}/)
        expect(PALETA).toContain('<CommandInput caret value={texto} placeholder="" />')
        expect(PALETA).toContain("<CommandHighlight>")
        expect(PALETA).toContain("<CommandShortcut>")
        expect(PALETA).not.toContain("shortcut=")
        expect(PALETA).not.toContain("autoFocus")
        expect(PALETA).not.toMatch(/shadow-/)
        expect(PALETA).not.toMatch(/from ["']motion/)
        expect(PALETA).not.toContain("requestAnimationFrame")
        // O voo: os dois pontos da pílula dividem o layoutId.
        expect(PALETA).toContain('layoutId="auth-search"')
        expect(MINI).toContain('layoutId="auth-search"')
    })
})
