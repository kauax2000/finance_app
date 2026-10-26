import { describe, expect, it, vi } from "vitest"

// `concluirJornada` fala com o banco; o cliente exige variáveis que o teste não tem.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { canaisPara, plataformaDe, proximosAvisos } from "./jornada"

describe("plataformaDe", () => {
    it("reconhece iPhone, Android e macOS", () => {
        expect(
            plataformaDe(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
            ),
        ).toBe("iphone")
        expect(
            plataformaDe(
                "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
            ),
        ).toBe("android")
        expect(
            plataformaDe(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
            ),
        ).toBe("computador")
    })
})

describe("canaisPara", () => {
    it.each(["iphone", "android", "computador"] as const)("%s: sempre a frase rápida e o PDF da fatura", (p) => {
        const canais = canaisPara(p, [])
        expect(canais.some((c) => c.href === "/transactions?new=1")).toBe(true)
        expect(canais.some((c) => c.href === "/credit-cards" && c.titulo.includes("PDF da última fatura"))).toBe(true)
    })

    it("cada plataforma traz o seu canal próprio", () => {
        expect(canaisPara("iphone", []).some((c) => c.href === "/account" && c.titulo.includes("Atalho"))).toBe(true)
        expect(canaisPara("android", []).some((c) => c.texto.includes("Adicionar à tela inicial") && c.texto.includes("Compartilhar → Finance App"))).toBe(true)
        expect(canaisPara("computador", []).some((c) => c.titulo === "Importar extrato" && c.href === "/transactions?importar=1")).toBe(true)
    })

    it("o PDF vai ao detalhe com um cartão ativo só; com zero ou dois, à lista", () => {
        const pdf = (ids: string[]) => canaisPara("computador", ids).find((c) => c.titulo.includes("PDF"))!.href
        expect(pdf(["c1"])).toBe("/credit-cards/c1")
        expect(pdf([])).toBe("/credit-cards")
        expect(pdf(["c1", "c2"])).toBe("/credit-cards")
    })
})

describe("proximosAvisos", () => {
    const hoje = new Date(2026, 9, 23) // 23/10/2026
    const prefs = {}
    const linha = (r: ReturnType<typeof proximosAvisos>, aviso: string) => r.find((l) => l.aviso === aviso)!

    it("com dois cartões pega o fechamento e o vencimento mais próximos", () => {
        const r = proximosAvisos({
            prefs,
            cartoes: [
                { nome: "A", closingDay: 5, dueDay: 12 },
                { nome: "B", closingDay: 25, dueDay: 2 },
            ],
            proximaConta: null,
            hoje,
        })
        expect(linha(r, "Fatura fechando").proximo).toBe("25/10/2026")
        // B fechou em 25/09 e venceu em 02/10 (passou), então vale 02/11; A vence só em 12/11.
        expect(linha(r, "Fatura vencendo").proximo).toBe("02/11/2026")
    })

    it("o vencimento cai no mês do fechamento quando vence depois dele, e nunca no passado", () => {
        const vence = (closingDay: number, dueDay: number, dia: Date) =>
            linha(proximosAvisos({ prefs, cartoes: [{ nome: "A", closingDay, dueDay }], proximaConta: null, hoje: dia }), "Fatura vencendo").proximo
        // Fecha 5, vence 25: em 20/10 vence 25/10 (da fatura de 05/10); em 26/10, 25/11.
        expect(vence(5, 25, new Date(2026, 9, 20))).toBe("25/10/2026")
        expect(vence(5, 25, new Date(2026, 9, 26))).toBe("25/11/2026")
        // Fecha 28, vence 10: em 01/11 vence 10/11 (da fatura de 28/10).
        expect(vence(28, 10, new Date(2026, 10, 1))).toBe("10/11/2026")
        // Fecha 30, vence 29: em 28/02 vence hoje a fatura de 30/01, com o
        // fechamento de fevereiro grampeado no mesmo dia.
        expect(vence(30, 29, new Date(2026, 1, 28))).toBe("28/02/2026")
    })

    it("sem cartão, as datas de cartão saem null", () => {
        const r = proximosAvisos({ prefs, cartoes: [], proximaConta: null, hoje })
        expect(linha(r, "Fatura fechando").proximo).toBeNull()
        expect(linha(r, "Fatura vencendo").proximo).toBeNull()
        expect(linha(r, "Conta vencendo").proximo).toBeNull()
        expect(linha(r, "Orçamento estourando").proximo).toBeNull()
        expect(linha(r, "A conferir").proximo).toBe("às 20h")
    })

    it("a preferência desligada marca ligado false; ausente vale ligado", () => {
        const r = proximosAvisos({
            prefs: { notify_bills: false, notify_budget: true },
            cartoes: [],
            proximaConta: { nome: "Luz", data: "2026-11-05" },
            hoje,
        })
        expect(linha(r, "Conta vencendo")).toEqual({ aviso: "Conta vencendo", ligado: false, proximo: "Luz · 05/11/2026" })
        expect(linha(r, "Orçamento estourando").ligado).toBe(true)
        expect(linha(r, "A conferir").ligado).toBe(true)
    })
})
