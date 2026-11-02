import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"
import { alertDispensadoKey, alertVariants } from "./alert"

const ALERT = semComentarios(lerFonte("src/components/ui/alert.tsx"))

describe("o redesenho do alerta", () => {
    it("os dois degraus vestem o raio do cartão", () => {
        for (const size of ["sm", "md"] as const) {
            const classes = alertVariants({ size })
            expect(classes).toContain("rounded-surface")
            expect(classes).not.toContain("rounded-row")
        }
    })

    it("o poço é do componente, na cor do texto, e mede 24 e 32", () => {
        expect(ALERT).toContain('data-slot="alert-icon"')
        expect(ALERT).toContain("rounded-full bg-current/15")
        expect(alertVariants({ size: "sm" })).toContain("[--alert-well:--spacing(6)]")
        expect(alertVariants({ size: "md" })).toContain("[--alert-well:--spacing(8)]")
    })

    it("a grade pergunta pelo poço, não pelo svg", () => {
        expect(ALERT).not.toContain("has-[>svg]")
        expect(ALERT).toContain("has-[>[data-slot=alert-icon]]:grid-cols-[var(--alert-well)_1fr]")
    })

    it("título sozinho centra, e com descrição o texto começa no topo", () => {
        expect(ALERT).toContain("items-center has-[>[data-slot=alert-description]]:items-start")
    })

    it("a ação inline sobe a partir de 20rem", () => {
        expect(ALERT).toContain("@xs/alert:data-[placement=inline]:col-[-2/-1]")
        expect(ALERT).not.toContain("@md/alert")
    })

    it("dispensar guarda no aparelho, sem quebrar sem localStorage", () => {
        expect(alertDispensadoKey("push")).toBe("alert-dispensado:push")
        expect(ALERT).toContain("React.useSyncExternalStore(")
        expect(ALERT).toContain("if (dispensado) return null")
        expect(ALERT).toMatch(/try \{[\s\S]+localStorage[\s\S]+\} catch/)
    })

    it("quem chama não muda: a tinta inteira segue nos cinco tons", () => {
        expect(alertVariants({ tone: "warning" })).toContain("bg-warning-muted")
        expect(alertVariants({ tone: "destructive" })).toContain("bg-destructive-muted")
    })

    it("no dedo a ação e o dispensar dividem a linha 50/50", () => {
        expect(ALERT).toContain('dismissText = "Agora não"')
        expect(ALERT).toContain("dismissText?: string")
        // Os pés, por extenso: a ação com dispensar, o dispensar com ação, e os dois sozinhos.
        expect(ALERT).toContain("pointer-coarse:group-has-[>[data-slot=alert-dismiss]]/alert:col-[1/-2]!")
        expect(ALERT).toContain("pointer-coarse:group-has-[>[data-slot=alert-actions]]/alert:col-[-2/-1]")
        expect(ALERT).toContain("pointer-coarse:col-[1/-1]!")
        expect(ALERT).toContain("pointer-coarse:col-[1/-1] ")
        // As duas grades do dedo, com e sem poço.
        expect(ALERT).toContain("pointer-coarse:grid-cols-[1fr_calc(50%_-_var(--spacing))]!")
        expect(ALERT).toContain(
            "pointer-coarse:has-[>[data-slot=alert-icon]]:grid-cols-[var(--alert-well)_1fr_calc(50%_-_var(--spacing))]!"
        )
        // Sem contêiner no dedo, a ação inline nunca sobe.
        expect(ALERT).toContain("[container-type:normal]!")
        // O alvo é o próprio botão: o pseudo-elemento ampliado saiu.
        expect(ALERT).not.toContain("pointer-coarse:after")
    })

    it("o nome do dispensar contém o texto visível", () => {
        expect(ALERT).not.toContain("aria-label={dismissLabel}")
        expect(ALERT).toContain("sr-only pointer-coarse:hidden")
        expect(ALERT).toContain("hidden pointer-coarse:inline")
    })

    it("o × sem poço sobe à linha do texto", () => {
        expect(ALERT).toContain("top-(--alert-dismiss-top)")
        for (const v of ["--spacing(1)", "--spacing(2)", "--spacing(2.5)", "--spacing(4)"]) {
            expect(ALERT).toContain(`[--alert-dismiss-top:${v}]`)
        }
    })
})
