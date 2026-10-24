import { describe, expect, it } from "vitest"
import { reprogramacao } from "./reprogramar"

const antes = {
    frequency: "monthly",
    due_day_of_month: 10,
    start_date: "2026-01-01",
    end_date: null,
    is_active: true,
} as const

const hojeYmd = "2026-11-15"

describe("reprogramacao (editar a agenda move a pendente futura)", () => {
    it("mudar o dia de 10 para 20, com hoje em 15/11, leva a pendente de 10/12 para 20/11", () => {
        expect(
            reprogramacao({
                antes,
                depois: { ...antes, due_day_of_month: 20 },
                pendentes: [{ id: "i1", due_date: "2026-12-10" }],
                hojeYmd,
            })
        ).toEqual({ tipo: "mover", id: "i1", due_date: "2026-11-20" })
    })

    it("a pendente vencida não muda", () => {
        expect(
            reprogramacao({
                antes,
                depois: { ...antes, due_day_of_month: 20 },
                pendentes: [{ id: "i1", due_date: "2026-11-10" }],
                hojeYmd,
            })
        ).toEqual({ tipo: "nada" })
    })

    it("só a futura se move quando há uma vencida e uma futura", () => {
        expect(
            reprogramacao({
                antes,
                depois: { ...antes, due_day_of_month: 20 },
                pendentes: [
                    { id: "vencida", due_date: "2026-10-10" },
                    { id: "futura", due_date: "2026-12-10" },
                ],
                hojeYmd,
            })
        ).toEqual({ tipo: "mover", id: "futura", due_date: "2026-11-20" })
    })

    it("a nova data depois do end_date apaga a pendente", () => {
        expect(
            reprogramacao({
                antes,
                depois: { ...antes, due_day_of_month: 20, end_date: "2026-11-18" },
                pendentes: [{ id: "i1", due_date: "2026-12-10" }],
                hojeYmd,
            })
        ).toEqual({ tipo: "apagar", id: "i1" })
    })

    it("o início no futuro conta a partir dele", () => {
        expect(
            reprogramacao({
                antes,
                depois: { ...antes, start_date: "2027-02-01" },
                pendentes: [{ id: "i1", due_date: "2026-12-10" }],
                hojeYmd,
            })
        ).toEqual({ tipo: "mover", id: "i1", due_date: "2027-02-10" })
    })

    it("mudar só o nome não reprograma", () => {
        expect(
            reprogramacao({ antes, depois: antes, pendentes: [{ id: "i1", due_date: "2027-01-10" }], hojeYmd })
        ).toEqual({ tipo: "nada" })
    })

    it("reativar uma conta sem pendente cria a próxima", () => {
        expect(
            reprogramacao({ antes: { ...antes, is_active: false }, depois: antes, pendentes: [], hojeYmd })
        ).toEqual({ tipo: "criar", due_date: "2026-12-10" })
    })

    it("reativar não cria depois do fim, nem para a única", () => {
        const inativa = { ...antes, is_active: false }
        expect(
            reprogramacao({ antes: inativa, depois: { ...antes, end_date: "2026-12-01" }, pendentes: [], hojeYmd })
        ).toEqual({ tipo: "nada" })
        expect(
            reprogramacao({
                antes: { ...inativa, frequency: "one_time" },
                depois: { ...antes, frequency: "one_time" },
                pendentes: [],
                hojeYmd,
            })
        ).toEqual({ tipo: "nada" })
    })

    it("desativar não cria", () => {
        expect(
            reprogramacao({ antes, depois: { ...antes, is_active: false, due_day_of_month: 20 }, pendentes: [], hojeYmd })
        ).toEqual({ tipo: "nada" })
    })
})
