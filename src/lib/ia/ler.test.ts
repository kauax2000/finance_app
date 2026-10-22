import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const { invokeEdgeJson, getSession } = vi.hoisted(() => ({ invokeEdgeJson: vi.fn(), getSession: vi.fn() }))
vi.mock("@/lib/edge-invoke", () => ({ invokeEdgeJson }))
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession } } }))

const { lerFaturaComIA, lerFraseComIA, lerImagemComIA } = await import("./ler")

const CARTEIRA = "00000000-0000-4000-8000-000000000001"
const CAMPOS = { valor: 42.9, data: "2026-10-22", descricao: "Mercado", tipo: "expense", parcelas: null, forma: null, cartao: null }
const MENSAGENS = {
    cota: "Você usou a IA 30 vezes hoje. Amanhã volta.",
    sem_ia: "A IA não respondeu agora. Confira à mão.",
    fatura_grande: "Fatura grande demais para a IA. Use o CSV do banco.",
} as const

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
})

describe("lerFraseComIA e lerFaturaComIA", () => {
    it("pedem à ia-ler com o corpo da operação e devolvem os campos", async () => {
        invokeEdgeJson.mockResolvedValueOnce({ ok: true, campos: CAMPOS, provedor: "groq", modelo: "m" })
        expect(await lerFraseComIA(CARTEIRA, "mercado 42,90")).toEqual({
            ok: true,
            campos: CAMPOS,
            provedor: "groq",
            modelo: "m",
        })
        expect(invokeEdgeJson).toHaveBeenCalledWith("ia-ler", {
            body: { op: "frase", workspaceId: CARTEIRA, texto: "mercado 42,90" },
        })

        invokeEdgeJson.mockResolvedValueOnce({ ok: true, itens: [], provedor: "cloudflare", modelo: "m" })
        expect(await lerFaturaComIA(CARTEIRA, "texto", "2026-10-05")).toMatchObject({ ok: true, itens: [] })
        expect(invokeEdgeJson).toHaveBeenLastCalledWith("ia-ler", {
            body: { op: "fatura", workspaceId: CARTEIRA, texto: "texto", fechamento: "2026-10-05" },
        })
    })

    for (const [motivo, mensagem] of Object.entries(MENSAGENS)) {
        it(`motivo ${motivo} vira a mensagem exata`, async () => {
            invokeEdgeJson.mockResolvedValue({ ok: false, motivo })
            expect(await lerFraseComIA(CARTEIRA, "x")).toEqual({ ok: false, mensagem })
            expect(await lerFaturaComIA(CARTEIRA, "x", "2026-10-05")).toEqual({ ok: false, mensagem })
        })
    }

    it("motivo desconhecido cai em sem_ia", async () => {
        invokeEdgeJson.mockResolvedValue({ ok: false, motivo: "sem_chave" })
        expect(await lerFraseComIA(CARTEIRA, "x")).toEqual({ ok: false, mensagem: MENSAGENS.sem_ia })
    })

    it("erro de rede vira 'Sem conexão com a IA.'; erro da Edge passa como veio", async () => {
        invokeEdgeJson.mockRejectedValueOnce(new Error("Failed to fetch"))
        expect(await lerFraseComIA(CARTEIRA, "x")).toEqual({ ok: false, mensagem: "Sem conexão com a IA." })
        invokeEdgeJson.mockRejectedValueOnce(new Error("Sem plano ativo nesta carteira."))
        expect(await lerFaturaComIA(CARTEIRA, "x", "2026-10-05")).toEqual({
            ok: false,
            mensagem: "Sem plano ativo nesta carteira.",
        })
    })
})

describe("lerImagemComIA", () => {
    const foto = new File([new Uint8Array([0xff, 0xd8, 0xff])], "recibo.jpg", { type: "image/jpeg" })
    const resposta = (status: number, corpo: unknown) =>
        new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } })

    beforeEach(() => {
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co")
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-de-teste")
        getSession.mockResolvedValue({ data: { session: { access_token: "jwt-de-teste" } } })
    })

    it("sem sessão não chama a rede", async () => {
        getSession.mockResolvedValueOnce({ data: { session: null } })
        const fetch = vi.fn()
        vi.stubGlobal("fetch", fetch)
        expect(await lerImagemComIA(CARTEIRA, foto)).toEqual({ ok: false, mensagem: "Entre de novo para usar a IA." })
        expect(fetch).not.toHaveBeenCalled()
    })

    it("vai em multipart com o token da sessão e devolve os campos", async () => {
        const fetch = vi.fn().mockResolvedValue(resposta(200, { ok: true, campos: CAMPOS, provedor: "groq", modelo: "m" }))
        vi.stubGlobal("fetch", fetch)
        expect(await lerImagemComIA(CARTEIRA, foto)).toEqual({ ok: true, campos: CAMPOS, provedor: "groq", modelo: "m" })
        const [url, init] = fetch.mock.calls[0]
        expect(url).toBe("https://exemplo.supabase.co/functions/v1/ia-ler")
        expect(init.method).toBe("POST")
        expect(init.headers).toEqual({ Authorization: "Bearer jwt-de-teste", apikey: "anon-de-teste" })
        const form = init.body as FormData
        expect(form.get("op")).toBe("imagem")
        expect(form.get("workspaceId")).toBe(CARTEIRA)
        expect(form.get("file")).toBeInstanceOf(File)
    })

    it("motivo vira a mensagem exata", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(200, { ok: false, motivo: "cota" })))
        expect(await lerImagemComIA(CARTEIRA, foto)).toEqual({ ok: false, mensagem: MENSAGENS.cota })
    })

    it("erro da Edge passa como veio; sem corpo, sem_ia", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(413, { error: "Foto grande demais." })))
        expect(await lerImagemComIA(CARTEIRA, foto)).toEqual({ ok: false, mensagem: "Foto grande demais." })
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad Gateway", { status: 502 })))
        expect(await lerImagemComIA(CARTEIRA, foto)).toEqual({ ok: false, mensagem: MENSAGENS.sem_ia })
    })

    it("erro de rede vira 'Sem conexão com a IA.'", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
        expect(await lerImagemComIA(CARTEIRA, foto)).toEqual({ ok: false, mensagem: "Sem conexão com a IA." })
    })
})

describe("Edge ia-ler (fonte)", () => {
    const f = () => semComentarios(lerFonte("supabase/functions/ia-ler/index.ts"))

    it("autentica o JWT antes de qualquer consulta, e lê o corpo depois", () => {
        const fonte = f()
        const auth = fonte.indexOf("await getAuthUserFromJwt(")
        expect(auth).toBeGreaterThan(-1)
        expect(fonte.indexOf("bearerJwt(")).toBeLessThan(auth)
        expect(fonte.indexOf(".from(")).toBeGreaterThan(auth)
        expect(fonte.indexOf(".rpc(")).toBeGreaterThan(auth)
        const precheck = fonte.indexOf("Number(req.headers.get('content-length') ?? 0) > teto")
        expect(precheck).toBeGreaterThan(auth)
        expect(fonte.indexOf("await lerCorpo(req, teto)")).toBeGreaterThan(precheck)
        expect(fonte).not.toContain("req.json()")
        expect(fonte).not.toContain("req.formData()")
    })

    it("confere o membro, depois o plano, depois a IA", () => {
        const fonte = f()
        const membro = fonte.indexOf(".from('workspace_members')")
        const plano = fonte.indexOf("rpc('workspace_plan'")
        expect(membro).toBeGreaterThan(-1)
        expect(plano).toBeGreaterThan(membro)
        for (const ia of ["await interpretar(", "await lerImagem(", "await lerFatura("]) {
            expect(fonte.indexOf(ia)).toBeGreaterThan(plano)
        }
        expect(fonte).toContain("'Você não é membro dessa carteira.'")
        expect(fonte).toContain("'Sem plano ativo nesta carteira.'")
        expect(fonte).toContain("!== 'familia'")
    })

    it("tetos: foto de 4 MB, JSON de 100 KB, frase de 500 e fatura de 80.000", () => {
        const fonte = f()
        expect(fonte).toContain("MAX_FOTO = 4 * 1024 * 1024")
        expect(fonte).toContain("MAX_JSON = 100 * 1024")
        expect(fonte).toContain("'Foto grande demais.'")
        expect(fonte).toContain("'Envie uma foto (JPG, PNG ou WebP).'")
        expect(fonte).toContain("tipoDoArquivo(")
        expect(fonte).toContain("frase: 500")
        expect(fonte).toContain("fatura: 80_000")
    })

    it("sem os nomes dos membros, frase e fatura não vão à IA", () => {
        const fonte = f()
        const nomes = fonte.indexOf("await nomesDosMembros(")
        expect(nomes).toBeGreaterThan(-1)
        const sem = fonte.indexOf("if (!nomes)", nomes)
        expect(sem).toBeGreaterThan(nomes)
        expect(fonte.indexOf("await interpretar(")).toBeGreaterThan(sem)
        expect(fonte.indexOf("await lerFatura(")).toBeGreaterThan(sem)
    })

    it("está no deploy e sem verificação de JWT no gateway", () => {
        expect(lerFonte("package.json")).toMatch(/"supabase:deploy:functions": "[^"]*\bia-ler\b/)
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.ia-ler\]\s*\nverify_jwt = false/)
    })
})
