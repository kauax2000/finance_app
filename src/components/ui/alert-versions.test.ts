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
})
