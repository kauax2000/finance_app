import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"
import {
    CACHE_COMPARTILHADO,
    CAMPOS_DE_TEXTO,
    escolherArquivoCompartilhado,
    lerArquivoCompartilhado,
    receberCompartilhar,
} from "@/lib/captura/compartilhado"
import {
    consumirParametroCompartilhado,
    PARAMETROS_DA_FRASE,
} from "@/lib/transactions-list-search-params"
import { POST as postSemServiceWorker } from "@/app/(app)/transactions/compartilhar/route"

const ORIGEM = "https://app.test"
const CHAVE = "0b9c2f4e-8a1d-4c3b-9e7f-1a2b3c4d5e6f"
const HORA = 60 * 60 * 1000

/** O Cache Storage do navegador, em memória: a chave é o caminho da URL. */
function cachesFalsos() {
    const lojas = new Map<string, Map<string, Response>>()
    const caminho = (k: RequestInfo | URL) =>
        new URL(typeof k === "string" ? k : k instanceof URL ? k.href : k.url, ORIGEM).pathname
    return {
        lojas,
        async open(nome: string) {
            const loja = lojas.get(nome) ?? new Map<string, Response>()
            lojas.set(nome, loja)
            return {
                async put(k: RequestInfo | URL, r: Response) {
                    loja.set(caminho(k), r)
                },
                async match(k: RequestInfo | URL) {
                    return loja.get(caminho(k))?.clone()
                },
                async delete(k: RequestInfo | URL) {
                    return loja.delete(caminho(k))
                },
                async keys() {
                    return [...loja.keys()].map((p) => new Request(ORIGEM + p))
                },
            }
        },
    }
}

const global = globalThis as { caches?: unknown }
let falsos: ReturnType<typeof cachesFalsos>
let original: unknown
beforeEach(() => {
    original = global.caches
    falsos = cachesFalsos()
    global.caches = falsos
})
afterEach(() => {
    global.caches = original
})

function postDoCompartilhar(campos: Record<string, string | File>) {
    const form = new FormData()
    for (const [k, v] of Object.entries(campos)) form.append(k, v)
    return new Request(`${ORIGEM}/transactions/compartilhar`, { method: "POST", body: form })
}

const foto = () => new File(["bytes da foto"], "recibo mercado.jpg", { type: "image/jpeg" })
const pdf = () => new File(["%PDF-1.7"], "fatura.pdf", { type: "application/pdf" })

describe("consumirParametroCompartilhado", () => {
    it("lê a chave e o tipo", () => {
        expect(consumirParametroCompartilhado(new URLSearchParams(`compartilhado=${CHAVE}`))).toEqual({
            chave: CHAVE,
            tipo: "imagem",
        })
        expect(
            consumirParametroCompartilhado(new URLSearchParams(`compartilhado=${CHAVE}&tipo=pdf`))
        ).toEqual({ chave: CHAVE, tipo: "pdf" })
    })

    it("chave que não é UUID, ausente ou sem parâmetros: null", () => {
        expect(consumirParametroCompartilhado(new URLSearchParams("compartilhado=../x"))).toBeNull()
        expect(consumirParametroCompartilhado(new URLSearchParams("tipo=pdf"))).toBeNull()
        expect(consumirParametroCompartilhado(null)).toBeNull()
    })
})

describe("escolherArquivoCompartilhado", () => {
    it("o primeiro arquivo de foto ou PDF, com até 10 MB e não vazio", () => {
        const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.jpg", { type: "image/jpeg" })
        const vazio = new File([], "v.png", { type: "image/png" })
        const texto = new File(["oi"], "t.txt", { type: "text/plain" })
        const certo = pdf()
        expect(escolherArquivoCompartilhado(["texto", grande, vazio, texto, certo, foto()])).toBe(certo)
        expect(escolherArquivoCompartilhado([grande, vazio, texto])).toBeNull()
        const limite = new File([new Uint8Array(10 * 1024 * 1024)], "l.png", { type: "image/png" })
        expect(escolherArquivoCompartilhado([limite])).toBe(limite)
    })

    it("SVG e imagem que o canvas não abre ficam de fora; HEIC entra", () => {
        const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" })
        const gif = new File(["GIF"], "x.gif", { type: "image/gif" })
        expect(escolherArquivoCompartilhado([svg, gif])).toBeNull()
        for (const type of ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]) {
            const f = new File(["x"], "f", { type })
            expect(escolherArquivoCompartilhado([f])).toBe(f)
        }
    })

    it("os campos de texto são os do ?frase=", () => {
        expect([...CAMPOS_DE_TEXTO]).toEqual([...PARAMETROS_DA_FRASE])
    })
})

describe("receberCompartilhar (a rota do service worker)", () => {
    it("imagem: guarda no cache e redireciona com 303 para ?compartilhado=", async () => {
        const res = await receberCompartilhar(postDoCompartilhar({ frase: "ignorada", files: foto() }))
        expect(res.status).toBe(303)
        const destino = new URL(res.headers.get("location")!)
        expect(destino.origin).toBe(ORIGEM)
        expect(destino.pathname).toBe("/transactions")
        const chave = destino.searchParams.get("compartilhado")!
        expect([...destino.searchParams.keys()]).toEqual(["compartilhado"])
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)?.has(`/__compartilhado/${chave}`)).toBe(true)

        const lido = await lerArquivoCompartilhado(chave)
        expect(lido?.name).toBe("recibo mercado.jpg")
        expect(lido?.type).toBe("image/jpeg")
        expect(await lido?.text()).toBe("bytes da foto")
        // O arquivo sai do cache assim que é lido.
        expect(await lerArquivoCompartilhado(chave)).toBeNull()
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)?.size).toBe(0)
    })

    it("PDF: acrescenta &tipo=pdf", async () => {
        const res = await receberCompartilhar(postDoCompartilhar({ files: pdf() }))
        expect(res.status).toBe(303)
        const destino = new URL(res.headers.get("location")!)
        expect(destino.searchParams.get("tipo")).toBe("pdf")
        expect(consumirParametroCompartilhado(destino.searchParams)?.tipo).toBe("pdf")
    })

    it("só texto: volta ao ?frase= do 3A, com título e link", async () => {
        const res = await receberCompartilhar(
            postDoCompartilhar({ frase: "42 mercado", frase_titulo: "Pix", frase_url: "", outro: "x" })
        )
        expect(res.status).toBe(303)
        expect(res.headers.get("location")).toBe(`${ORIGEM}/transactions?frase=42+mercado&frase_titulo=Pix`)
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)).toBeUndefined()
    })

    it("arquivo recusado (outro tipo, grande ou vazio): ?compartilhado_erro=1, sem guardar", async () => {
        const recusados = [
            new File(["x"], "a.zip", { type: "application/zip" }),
            new File([new Uint8Array(10 * 1024 * 1024 + 1)], "g.jpg", { type: "image/jpeg" }),
            new File([], "vazio.jpg", { type: "image/jpeg" }),
        ]
        for (const files of recusados) {
            const res = await receberCompartilhar(postDoCompartilhar({ frase: "texto junto", files }))
            expect(res.status).toBe(303)
            expect(res.headers.get("location")).toBe(`${ORIGEM}/transactions?compartilhado_erro=1`)
        }
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)).toBeUndefined()
    })

    it("a parte files sem nome e vazia é ausência de arquivo: o texto segue", async () => {
        const res = await receberCompartilhar(
            postDoCompartilhar({ frase: "42 mercado", files: new File([], "", { type: "application/octet-stream" }) })
        )
        expect(res.headers.get("location")).toBe(`${ORIGEM}/transactions?frase=42+mercado`)
    })

    it("erro inesperado não derruba o fetch: 303 para a tela", async () => {
        const uuid = vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => {
            throw new Error("sem uuid")
        })
        const erro = vi.spyOn(console, "error").mockImplementation(() => {})
        try {
            const res = await receberCompartilhar(postDoCompartilhar({ files: foto() }))
            expect(res.status).toBe(303)
            expect(res.headers.get("location")).toBe(`${ORIGEM}/transactions`)
        } finally {
            uuid.mockRestore()
            erro.mockRestore()
        }
    })

    it("nada ou corpo que não é formulário: só a tela", async () => {
        const vazio = await receberCompartilhar(postDoCompartilhar({ outro: "x" }))
        expect(vazio.status).toBe(303)
        expect(vazio.headers.get("location")).toBe(`${ORIGEM}/transactions`)
        const quebrado = await receberCompartilhar(
            new Request(`${ORIGEM}/transactions/compartilhar`, { method: "POST", body: "{}" })
        )
        expect(quebrado.status).toBe(303)
        expect(quebrado.headers.get("location")).toBe(`${ORIGEM}/transactions`)
    })

    it("antes de guardar, apaga o que tem mais de 1 hora", async () => {
        const agora = Date.now()
        await receberCompartilhar(postDoCompartilhar({ files: foto() }), agora - 1.5 * HORA)
        await receberCompartilhar(postDoCompartilhar({ files: foto() }), agora - 0.75 * HORA)
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)?.size).toBe(2)
        await receberCompartilhar(postDoCompartilhar({ files: foto() }), agora)
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)?.size).toBe(2)
    })

    it("sem conseguir guardar, ainda redireciona (a tela avisa que o arquivo sumiu)", async () => {
        const erro = vi.spyOn(console, "error").mockImplementation(() => {})
        global.caches = {
            open: async () => {
                throw new Error("quota")
            },
        }
        try {
            const res = await receberCompartilhar(postDoCompartilhar({ files: foto() }))
            expect(res.status).toBe(303)
            expect(new URL(res.headers.get("location")!).searchParams.has("compartilhado")).toBe(true)
            expect(erro).toHaveBeenCalled()
        } finally {
            erro.mockRestore()
        }
    })
})

describe("a rota do Next, sem service worker ativo", () => {
    it("só o texto segue para o ?frase=, o arquivo fica de fora, sempre 303", async () => {
        const res = await postSemServiceWorker(
            postDoCompartilhar({ frase: "42 mercado", frase_url: "https://x.test/p", files: foto() })
        )
        expect(res.status).toBe(303)
        expect(res.headers.get("location")).toBe(
            `${ORIGEM}/transactions?frase=42+mercado&frase_url=https%3A%2F%2Fx.test%2Fp`
        )
        expect(falsos.lojas.size).toBe(0)
    })

    it("só arquivo ou corpo que não é formulário: a tela", async () => {
        const soArquivo = await postSemServiceWorker(postDoCompartilhar({ files: foto() }))
        expect(soArquivo.status).toBe(303)
        expect(soArquivo.headers.get("location")).toBe(`${ORIGEM}/transactions`)
        const quebrado = await postSemServiceWorker(
            new Request(`${ORIGEM}/transactions/compartilhar`, { method: "POST", body: "{}" })
        )
        expect(quebrado.headers.get("location")).toBe(`${ORIGEM}/transactions`)
    })
})

describe("lerArquivoCompartilhado", () => {
    it("chave inválida, ausente ou vencida: null, e a vencida sai do cache", async () => {
        expect(await lerArquivoCompartilhado("../../x")).toBeNull()
        expect(await lerArquivoCompartilhado(CHAVE)).toBeNull()
        const res = await receberCompartilhar(postDoCompartilhar({ files: foto() }), Date.now() - 2 * HORA)
        const chave = new URL(res.headers.get("location")!).searchParams.get("compartilhado")!
        expect(await lerArquivoCompartilhado(chave)).toBeNull()
        expect(falsos.lojas.get(CACHE_COMPARTILHADO)?.size).toBe(0)
    })

    it("sem Cache Storage (contexto inseguro): null", async () => {
        global.caches = undefined
        expect(await lerArquivoCompartilhado(CHAVE)).toBeNull()
    })
})

describe("fonte: o compartilhar ligado de ponta a ponta", () => {
    it("o manifest compartilha arquivo por POST multipart e mantém os atalhos", () => {
        const fonte = lerFonte("src/app/manifest.ts")
        expect(fonte).toContain('action: "/transactions/compartilhar"')
        expect(fonte).toContain('method: "POST"')
        expect(fonte).toContain('enctype: "multipart/form-data"')
        expect(fonte).toContain('files: [{ name: "files", accept: ["image/*", "application/pdf"] }]')
        for (const par of ['title: "frase_titulo"', 'text: "frase"', 'url: "frase_url"']) expect(fonte).toContain(par)
        expect(fonte).toContain("/transactions?conferir=1")
        expect(fonte).toContain('"Nova despesa"')
    })

    it("o service worker captura o POST da rota, só da mesma origem", () => {
        const sw = semComentarios(lerFonte("src/sw.ts"), "tudo")
        expect(sw).toMatch(/serwist\.registerCapture\([\s\S]*receberCompartilhar[\s\S]*"POST"\s*\)/)
        expect(sw).toContain("sameOrigin && url.pathname === ROTA_COMPARTILHAR")
        expect(sw.indexOf("registerCapture")).toBeLessThan(sw.indexOf("serwist.addEventListeners()"))
        const lib = semComentarios(lerFonte("src/lib/captura/compartilhado.ts"), "tudo")
        expect(lib).toContain('ROTA_COMPARTILHAR = "/transactions/compartilhar"')
        expect(lib).toContain('"captura-compartilhada"')
        expect(lib).toContain("303")
    })

    it("a tela lê o arquivo, abre a criação com a foto e limpa a URL", () => {
        const tela = semComentarios(lerFonte("src/app/(app)/transactions/page-client.tsx"), "tudo")
        expect(tela).toContain("consumirParametroCompartilhado(searchParams)")
        expect(tela).toContain("lerArquivoCompartilhado(")
        expect(tela).toContain('openTransactionCreate("expense", { fotoInicial: arquivo })')
        expect(tela).toContain("CompartilhadoAvisoWireframe")
        // PDF ou foto pelo arquivo lido, não pelo `tipo` da URL.
        expect(tela).toContain('arquivo.type === "application/pdf"')
        expect(tela).not.toContain("pedido.tipo")
        expect(tela).toContain('searchParams.has("compartilhado_erro")')
        const aviso = lerFonte("src/components/wireframe/compartilhado-aviso-wireframe.tsx")
        expect(aviso).toContain("Para conferir a fatura, abra o cartão e use Conferir fatura.")
        expect(aviso).toContain("O arquivo compartilhado não está mais disponível.")
        expect(aviso).toContain("Não foi possível receber o arquivo (até 10 MB, foto ou PDF).")
        expect(aviso).toContain("ROUTES.CREDIT_CARDS")
        expect(aviso).not.toContain("@/components/ui")
    })

    it("a foto inicial desce do shell até a Foto do recibo", () => {
        const shell = lerFonte("src/components/layout/global-shell-dialogs-provider.tsx")
        expect(shell).toContain("fotoInicial={createFoto}")
        expect(shell).toMatch(/if \(!open\) \{\s*setCreateFrase\(undefined\)\s*setCreateFoto\(undefined\)/)
        const dialogo = lerFonte("src/components/transactions/transaction-form-dialog.tsx")
        expect(dialogo).toContain("fotoInicial,")
        expect(dialogo).toMatch(/useLeituraDoLancamento\(\{[^}]*fotoInicial/)
        const leitura = semComentarios(lerFonte("src/components/transactions/use-leitura-do-lancamento.ts"), "tudo")
        expect(leitura).toContain("lerFoto(fotoInicial)")
    })
})
