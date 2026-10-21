import { beforeEach, describe, expect, it, vi } from "vitest"

const getDocument = vi.fn()
const destroy = vi.fn(async () => {})

vi.mock("pdfjs-dist", () => ({
    GlobalWorkerOptions: {},
    PasswordResponses: { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 },
    getDocument: (...args: unknown[]) => getDocument(...args),
}))

import { pdfParaTexto } from "./pdf-texto"

const arquivo = () => new File([new Uint8Array([1, 2, 3])], "fatura.pdf", { type: "application/pdf" })

function senhaErro(code: number) {
    return Object.assign(new Error("senha"), { name: "PasswordException", code })
}

const item = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y] })

beforeEach(() => {
    getDocument.mockReset()
    destroy.mockClear()
})

/** O `loadingTask` do pdfjs: a promessa do documento e o `destroy` do worker. */
const tarefa = (promise: Promise<unknown>) => ({ promise, destroy })

describe("pdfParaTexto", () => {
    it("junta os pedaços por linha (y arredondado), em ordem de x, de cima para baixo", async () => {
        const pagina = {
            getTextContent: async () => ({
                items: [item("12,90", 300, 700.2), item("05/09", 10, 700), item("PADARIA", 60, 699.8), item("TOTAL", 10, 650)],
            }),
        }
        getDocument.mockReturnValue(tarefa(Promise.resolve({ numPages: 1, getPage: async () => pagina })))
        expect(await pdfParaTexto(arquivo())).toEqual({ ok: true, texto: "05/09 PADARIA 12,90\nTOTAL" })
    })

    it("sem senha, pede a senha (Foco 1)", async () => {
        getDocument.mockReturnValue(tarefa(Promise.reject(senhaErro(1))))
        expect(await pdfParaTexto(arquivo())).toEqual({ ok: false, precisaSenha: true, senhaIncorreta: false })
    })

    it("senha errada diz que está incorreta e passa a senha ao pdfjs (Foco 1)", async () => {
        getDocument.mockReturnValue(tarefa(Promise.reject(senhaErro(2))))
        expect(await pdfParaTexto(arquivo(), "errada")).toEqual({ ok: false, precisaSenha: true, senhaIncorreta: true })
        expect(getDocument.mock.calls[0][0]).toMatchObject({ password: "errada" })
    })

    it("outro erro vira mensagem, nunca falha calado", async () => {
        getDocument.mockReturnValue(tarefa(Promise.reject(new Error("Invalid PDF structure"))))
        const r = await pdfParaTexto(arquivo())
        expect(r.ok).toBe(false)
        expect("erro" in r && r.erro).toBeTruthy()
    })

    it("destrói a tarefa (documento e worker) no sucesso e nas duas senhas", async () => {
        const pagina = { getTextContent: async () => ({ items: [] }) }
        getDocument.mockReturnValue(tarefa(Promise.resolve({ numPages: 1, getPage: async () => pagina })))
        await pdfParaTexto(arquivo())
        getDocument.mockReturnValue(tarefa(Promise.reject(senhaErro(1))))
        await pdfParaTexto(arquivo())
        getDocument.mockReturnValue(tarefa(Promise.reject(senhaErro(2))))
        await pdfParaTexto(arquivo(), "errada")
        expect(destroy).toHaveBeenCalledTimes(3)
    })
})
