import { describe, expect, it, vi } from "vitest"
import {
    buscarDetalhesPrivados,
    comDetalhesPrivados,
    juntarDetalhesPrivados,
    MASCARA_PRIVADA,
    rotuloDaTransacao,
} from "./detalhes"

const minha = { id: "t1", user_id: "eu", is_private: true, description: MASCARA_PRIVADA, category_id: null }
const daAna = { id: "t2", user_id: "ana", is_private: true, description: MASCARA_PRIVADA, category_id: null }
const daCasa = { id: "t3", user_id: "ana", is_private: false, description: "Mercado", category_id: "c9" }

describe("comDetalhesPrivados", () => {
    it("troca a privada do autor e deixa a de outra pessoa e a da casa como vieram", () => {
        const detalhes = [
            { transaction_id: "t1", description: "Farmácia", category_id: "c1" },
            // Mesmo que um detalhe alheio chegasse, a de outra pessoa não troca.
            { transaction_id: "t2", description: "Segredo da Ana", category_id: "c2" },
        ]
        const [a, b, c] = comDetalhesPrivados([minha, daAna, daCasa], detalhes, "eu")
        expect(a).toMatchObject({ id: "t1", description: "Farmácia", category_id: "c1" })
        expect(b).toBe(daAna)
        expect(c).toBe(daCasa)
    })

    it("sem detalhe da privada, ela fica mascarada", () => {
        expect(comDetalhesPrivados([minha], [], "eu")).toEqual([minha])
    })

    it("traz o embed da categoria e o capture_meta quando o detalhe os tem", () => {
        const [a] = comDetalhesPrivados(
            [minha],
            [{ transaction_id: "t1", description: "X", category_id: "c1", capture_meta: { texto: "x 10" }, category: { id: "c1" } }],
            "eu",
        )
        expect(a).toMatchObject({ capture_meta: { texto: "x 10" }, category: { id: "c1" } })
    })
})

describe("rotuloDaTransacao", () => {
    it('dá "Gasto pessoal de Ana" para outra pessoa e a descrição original para o autor', () => {
        expect(rotuloDaTransacao(daAna, "Ana", "eu")).toBe("Gasto pessoal de Ana")
        expect(rotuloDaTransacao({ ...minha, description: "Farmácia" }, "Eu", "eu")).toBe("Farmácia")
        expect(rotuloDaTransacao(daCasa, "Ana", "eu")).toBe("Mercado")
        expect(rotuloDaTransacao({ ...daCasa, description: null }, "Ana", "eu")).toBe("")
    })
})

function clienteFalso(detalhes: unknown[], userId: string | null) {
    const inn = vi.fn(async () => ({ data: detalhes, error: null }))
    const from = vi.fn(() => ({ select: () => ({ in: inn }) }))
    const getSession = vi.fn(async () => ({ data: { session: userId ? { user: { id: userId } } : null } }))
    return { cliente: { from, auth: { getSession } } as never, from, inn, getSession }
}

describe("buscarDetalhesPrivados e juntarDetalhesPrivados", () => {
    it("uma consulta só, por in, em transacoes_privadas", async () => {
        const f = clienteFalso([{ transaction_id: "t1", description: "Farmácia", category_id: "c1" }], "eu")
        await buscarDetalhesPrivados(f.cliente, ["t1", "t4"])
        expect(f.from).toHaveBeenCalledWith("transacoes_privadas")
        expect(f.inn).toHaveBeenCalledWith("transaction_id", ["t1", "t4"])
        expect(f.from).toHaveBeenCalledTimes(1)
    })

    it("sem privada do próprio autor na página, nem consulta", async () => {
        const f = clienteFalso([], "eu")
        expect(await juntarDetalhesPrivados(f.cliente, [daCasa])).toEqual([daCasa])
        expect(f.getSession).not.toHaveBeenCalled()
        expect(await juntarDetalhesPrivados(f.cliente, [daAna, daCasa])).toEqual([daAna, daCasa])
        expect(f.from).not.toHaveBeenCalled()
    })

    it("com privada do autor, pede só a dela e junta", async () => {
        const f = clienteFalso([{ transaction_id: "t1", description: "Farmácia", category_id: "c1" }], "eu")
        const [a, b] = await juntarDetalhesPrivados(f.cliente, [minha, daAna])
        expect(f.inn).toHaveBeenCalledWith("transaction_id", ["t1"])
        expect(a.description).toBe("Farmácia")
        expect(b).toBe(daAna)
    })

    it("se a leitura dos detalhes falhar, as linhas voltam mascaradas, sem derrubar a página", async () => {
        const f = clienteFalso([], "eu")
        f.inn.mockResolvedValueOnce({ data: null, error: { message: "fora do ar" } } as never)
        const erro = vi.spyOn(console, "error").mockImplementation(() => {})
        expect(await juntarDetalhesPrivados(f.cliente, [minha, daCasa])).toEqual([minha, daCasa])
        expect(erro).toHaveBeenCalled()
        erro.mockRestore()
    })
})
