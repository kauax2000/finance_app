import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

import {
    finalFrame,
    frameAt,
    planScript,
    reduceScript,
    SCRIPT_IDLE,
    TYPING_DELAYS,
    type SceneScriptId,
    type ScriptFrame,
    type ScriptState,
} from "./scene-script"

const IDS: SceneScriptId[] = ["palette-login", "palette-session", "palette-security", "masked-password"]

const digitados = (plan: ScriptFrame[]) => plan.filter((f) => f.beat === "type").map((f) => f.text)
const quando = (plan: ScriptFrame[], beat: ScriptFrame["beat"]) => plan.find((f) => f.beat === beat)?.at

describe("o roteiro das cenas", () => {
    it.each(IDS)("%s termina em até 5s, com os instantes em ordem e o último quadro 'done'", (id) => {
        const plan = planScript(id)
        expect(plan.at(-1)!.beat).toBe("done")
        expect(plan.at(-1)!.at).toBeLessThanOrEqual(5000)
        for (let i = 1; i < plan.length; i++) expect(plan[i].at).toBeGreaterThan(plan[i - 1].at)
    })

    it.each(IDS)("%s é determinístico", (id) => {
        expect(planScript(id)).toEqual(planScript(id))
        expect(planScript(id)).not.toBe(planScript(id))
    })

    it("o login digita 'fatura' até 1.915, fecha em 2.400 e faz a ida e volta ao celular (D8)", () => {
        const plan = planScript("palette-login")
        expect(digitados(plan)).toEqual(["f", "fa", "fat", "fatu", "fatur", "fatura"])
        expect(plan.filter((f) => f.beat === "type").at(-1)!.at).toBe(1915)
        expect(quando(plan, "cursor")).toBe(500)
        expect(quando(plan, "press")).toBe(900)
        expect(quando(plan, "open")).toBe(1000)
        expect(quando(plan, "close")).toBe(2400)
        expect(quando(plan, "swap")).toBe(2650)
        expect(quando(plan, "morph")).toBe(3050)
        expect(quando(plan, "morph-back")).toBe(4000)
    })

    it("a sessão digita 'painel' e a segurança 'segurança', em cerca de 3s e sem D8", () => {
        for (const [id, consulta, escolhida] of [
            ["palette-session", "painel", "Continuar de onde parou"],
            ["palette-security", "segurança", "Senha alterada"],
        ] as const) {
            const plan = planScript(id)
            expect(digitados(plan).at(-1)).toBe(consulta)
            expect(finalFrame(plan)).toMatchObject({ text: consulta, selected: escolhida })
            expect(plan.some((f) => f.beat === "morph" || f.beat === "swap")).toBe(false)
            expect(plan.at(-1)!.at).toBeGreaterThanOrEqual(2500)
            expect(plan.at(-1)!.at).toBeLessThanOrEqual(3200)
        }
    })

    it("a senha mascarada digita os 14 caracteres a partir de +300ms em cerca de 1,4s", () => {
        const plan = planScript("masked-password")
        const teclas = plan.filter((f) => f.beat === "type")
        expect(teclas).toHaveLength(14)
        expect(Array.from(teclas.at(-1)!.text!)).toHaveLength(14)
        expect(teclas.at(-1)!.text).toBe("Casa*2026verão")
        expect(teclas[0].at).toBeGreaterThan(300)
        expect(teclas.at(-1)!.at - 300).toBeGreaterThanOrEqual(1200)
        expect(teclas.at(-1)!.at - 300).toBeLessThanOrEqual(1500)
    })

    it("os intervalos entre teclas saem da tabela fixa", () => {
        const teclas = planScript("masked-password").filter((f) => f.beat === "type")
        teclas.forEach((t, i) => expect(t.at - (i ? teclas[i - 1].at : 300)).toBe(TYPING_DELAYS[i]))
    })
})

describe("frameAt e finalFrame", () => {
    it("antes do primeiro quadro, a cena parada", () => {
        expect(frameAt(planScript("palette-login"), -1)).toEqual({ at: 0, beat: "idle" })
        expect(finalFrame([])).toEqual({ at: 0, beat: "idle" })
    })

    it("acumula o texto e a escolha depois que a paleta fecha", () => {
        const plan = planScript("palette-login")
        const swap = plan.findIndex((f) => f.beat === "swap")
        expect(frameAt(plan, swap)).toEqual({ at: 2650, beat: "swap", text: "fatura", selected: "Fatura de outubro" })
        expect(frameAt(plan, plan.findIndex((f) => f.text === "fat"))).not.toHaveProperty("selected")
    })

    it("o final do login é 'fatura' com 'Fatura de outubro' escolhida", () => {
        expect(finalFrame(planScript("palette-login"))).toMatchObject({
            beat: "done",
            text: "fatura",
            selected: "Fatura de outubro",
        })
    })
})

describe("reduceScript", () => {
    const plan = planScript("palette-login")
    const fim: ScriptState = { status: "done", index: plan.length - 1 }

    it("start tira do repouso, e tick avança até o fim", () => {
        let s = reduceScript(SCRIPT_IDLE, { type: "start" }, plan)
        expect(s).toEqual({ status: "running", index: -1 })
        for (let i = 0; i < plan.length; i++) s = reduceScript(s, { type: "tick" }, plan)
        expect(s).toEqual(fim)
        expect(reduceScript(s, { type: "tick" }, plan)).toBe(s)
        expect(reduceScript(s, { type: "start" }, plan)).toBe(s)
    })

    it("tick fora de execução não anda", () => {
        expect(reduceScript(SCRIPT_IDLE, { type: "tick" }, plan)).toBe(SCRIPT_IDLE)
    })

    it.each(["skip", "hidden"] as const)("%s leva ao fim, rodando ou parado", (type) => {
        expect(reduceScript({ status: "running", index: 3 }, { type }, plan)).toEqual(fim)
        expect(reduceScript(SCRIPT_IDLE, { type }, plan)).toEqual(fim)
    })

    it("scene volta ao repouso", () => {
        expect(reduceScript(fim, { type: "scene" }, plan)).toEqual(SCRIPT_IDLE)
        expect(reduceScript({ status: "running", index: 5 }, { type: "scene" }, plan)).toEqual(SCRIPT_IDLE)
    })
})

describe("o fonte do motor", () => {
    it.each(["src/lib/scene-script.ts", "src/hooks/use-scene-script.ts"])(
        "%s não sorteia nem lê o relógio",
        (caminho) => {
            const fonte = semComentarios(lerFonte(caminho))
            expect(fonte).not.toMatch(/Math\.random/)
            expect(fonte).not.toMatch(/\bDate\b/)
            expect(fonte).not.toMatch(/performance\.now/)
            expect(fonte).not.toMatch(/requestAnimationFrame/)
        },
    )

    it("a lógica não importa React", () => {
        expect(lerFonte("src/lib/scene-script.ts")).not.toMatch(/from "react"/)
    })

    it("o executor só ouve visibilitychange no document", () => {
        const fonte = semComentarios(lerFonte("src/hooks/use-scene-script.ts"))
        expect(fonte.match(/document\.addEventListener\("([a-z]+)"/g)).toEqual([
            'document.addEventListener("visibilitychange"',
        ])
        expect(fonte).toMatch(/clearTimeout/)
    })

    it("os quadros que faltam são agendados juntos, do quadro em que a corrida começou (sem deriva acumulada)", () => {
        const fonte = semComentarios(lerFonte("src/hooks/use-scene-script.ts"))
        expect(fonte).toMatch(/plan\.slice\(de \+ 1\)\.map\(\(q\) => setTimeout\(\(\) => despachar\(\{ type: "tick" \}\), q\.at - antes\)\)/)
        expect(fonte).toMatch(/\[reduced, active, state\.status, plan, despachar\]/)
    })

    it("o quadro devolvido é memoizado por reduced, plano e índice", () => {
        const fonte = semComentarios(lerFonte("src/hooks/use-scene-script.ts"))
        expect(fonte).toMatch(
            /const frame = React\.useMemo\(\s*\(\) => \(reduced \? finalFrame\(plan\) : frameAt\(plan, state\.index\)\),\s*\[reduced, plan, state\.index\],?\s*\)/,
        )
    })
})
