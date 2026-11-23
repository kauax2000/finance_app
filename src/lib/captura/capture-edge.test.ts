import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const CAPTURE = "supabase/functions/capture/index.ts"

describe("Edge capture", () => {
    it("o retry com o mesmo id não duplica (Foco 1)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("ignoreDuplicates: true")
        expect(f).toContain("onConflict: 'workspace_id,client_id'")
        expect(f).toContain("clientIdDoPedido(")
    })

    it("o retry acha o lançamento anterior em qualquer carteira da pessoa, e relê no conflito", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("pedido.id ? await clientIdDoPedido(tokenId, pedido.id) : null")
        const antes = f.indexOf(".in('workspace_id', carteirasDaPessoa)\n      .eq('client_id', clientId)")
        expect(antes).toBeGreaterThan(-1)
        expect(f.indexOf(".upsert(")).toBeGreaterThan(antes)
        const releitura = f.indexOf(".eq('client_id', clientId)", f.indexOf(".upsert("))
        expect(releitura).toBeGreaterThan(-1)
    })

    it("um retry não roda os avaliadores de novo; eles vão com o Bearer da service role", () => {
        const f = fonte(CAPTURE)
        const gate = f.indexOf("if (novo && linha.type === 'expense')")
        expect(gate).toBeGreaterThan(-1)
        expect(f.indexOf("'evaluate-budgets'")).toBeGreaterThan(gate)
        expect(f.indexOf("'evaluate-credit-card-alerts'")).toBeGreaterThan(gate)
        expect(f).toContain("Authorization: `Bearer ${serviceKey}`")
        expect(f).not.toContain("x-cron-secret")
    })

    it("cartões e histórico só das carteiras da pessoa (Foco 3)", () => {
        const f = fonte(CAPTURE)
        const cartoes = f.indexOf(".from('credit_cards')")
        expect(f.indexOf(".in('workspace_id', carteirasDaPessoa)", cartoes)).toBeGreaterThan(cartoes)
        expect(f).toContain("carteirasDaPessoa.map((w: string) =>")
        expect(f).toContain("admin.rpc('historico_da_frase', { p_workspace_id: w, p_user_id: convidadoEm.has(w) ? userId : null })")
    })

    it("o corpo é lido aos pedaços, com o teto de 16 KB, depois do formato do token", () => {
        const f = fonte(CAPTURE)
        expect(f).not.toContain("req.text()")
        expect(f).not.toContain("req.json()")
        const leitor = fonte("supabase/functions/_shared/http.ts")
        expect(leitor).toContain("getReader()")
        expect(leitor).toMatch(/total > teto/)
        expect(f).toContain("lerCorpo } from '../_shared/http.ts'")
        expect(f).toContain("MAX_CORPO = 16 * 1024")
        const formato = f.indexOf("fac_[0-9a-f]{64}")
        expect(formato).toBeGreaterThan(-1)
        expect(f.indexOf("await lerCorpo(req, teto)")).toBeGreaterThan(formato)
    })

    it("multipart: teto de 10 MB, lido aos pedaços, conferido no Content-Length (Foco 5)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("MAX_FOTO = 10 * 1024 * 1024")
        expect(f).toContain("multipart ? MAX_FOTO : MAX_CORPO")
        expect(f).toContain("await lerCorpo(req, teto)")
        expect(f).toContain(".formData()")
        expect(f).toContain("Number(req.headers.get('content-length') ?? 0) > teto")
    })

    it("PDF e tipo fora da lista voltam 422 com a mensagem exata (Foco 5)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("'PDF de fatura: use Conferir fatura no app.'")
        expect(f).toContain("'Envie uma foto (JPG, PNG ou WebP).'")
        expect(f).toContain("'Não entendi a foto. Mande o valor no texto.'")
        expect(f).toContain("tipoDoArquivo(")
    })

    it("a IA da frase só entra depois do parser (Foco 5); a da foto é lerImagem", () => {
        const f = fonte(CAPTURE)
        const parser = f.indexOf("precisaDeIA(pedido")
        expect(parser).toBeGreaterThan(-1)
        expect(f.indexOf("await interpretar(")).toBeGreaterThan(parser)
        expect(f).toContain("await lerImagem(")
    })

    it("parcelas > 1 viram plano pela RPC interna, com a 1ª parcela como resposta (Decisão 10)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("rpc('criar_plano_parcelado'")
        expect(f).toContain("p_needs_review: true")
        expect(f).toContain(".eq('installment_plan_id', planoId)")
    })

    it("o anexo grava created_by, e o objeto sai quando a linha falha", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("created_by: userId")
        expect(f).toContain("upsert: false")
        const insert = f.search(/\.from\('attachments'\)\s*\.insert\(/)
        expect(insert).toBeGreaterThan(-1)
        expect(f.indexOf(".remove([path])", insert)).toBeGreaterThan(insert)
    })

    it("I1: o corpo só é lido depois do token, do plano e do membro; o Content-Length antes", () => {
        const f = fonte(CAPTURE)
        const leitura = f.indexOf("await lerCorpo(req, teto)")
        for (const etapa of [".from('capture_tokens')", "rpc('workspace_plan'", ".from('workspace_members')"]) {
            const i = f.indexOf(etapa)
            expect(i).toBeGreaterThan(-1)
            expect(leitura).toBeGreaterThan(i)
        }
        const precheck = f.indexOf("Number(req.headers.get('content-length') ?? 0) > teto")
        expect(precheck).toBeGreaterThan(-1)
        expect(precheck).toBeLessThan(f.indexOf(".from('capture_tokens')"))
    })

    it("I3: a foto grande não vai à IA; o corpo cru é solto depois do formData", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("MAX_FOTO_IA = 4 * 1024 * 1024")
        expect(f).toContain("foto.bytes.byteLength <= MAX_FOTO_IA")
        // Sem texto, a foto que não foi à IA diz o motivo certo.
        expect(f).toContain("'Foto grande demais para a IA. Reduza a foto ou mande o valor no texto.'")
        expect(f).toContain("foto.bytes.byteLength > MAX_FOTO_IA ? ERRO_FOTO_GRANDE : ERRO_FOTO")
        expect(f).toMatch(/\.formData\(\)\s*\n\s*bruto = null/)
    })

    it("sem os nomes dos membros a frase não vai à IA (Decisão 6)", () => {
        const f = fonte(CAPTURE)
        // Uma busca por pedido, para a frase e para a categoria.
        expect(f).toContain("nomesLidos ??= nomesDosMembros(admin, carteirasDaPessoa)")
        const nomes = f.indexOf("await nomesDaPessoa(")
        expect(nomes).toBeGreaterThan(-1)
        expect(f.indexOf("if (nomes)", nomes)).toBeGreaterThan(nomes)
        expect(f.indexOf("await interpretar(", nomes)).toBeGreaterThan(f.indexOf("if (nomes)", nomes))
    })

    it("a categoria pela IA só sem categoria, com os nomes, e a falha só loga", () => {
        const f = fonte(CAPTURE)
        const sem = f.indexOf("if (montado.semCategoria")
        expect(sem).toBeGreaterThan(-1)
        const nomes = f.indexOf("await nomesDaPessoa(", sem)
        expect(f.indexOf("if (nomes)", nomes)).toBeGreaterThan(nomes)
        expect(f.indexOf("await categorizar(", nomes)).toBeGreaterThan(f.indexOf("if (nomes)", nomes))
        expect(f).toContain("console.error('capture: ia categoria', r.motivo)")
    })

    it("a categoria pela IA respeita os tetos da ia-ler e não insiste depois de uma leitura que falhou", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("k.name.length <= MAX_NOME_CATEGORIA")
        expect(f).toContain(".slice(0, MAX_NOMES_POR_TIPO)")
        // Qualquer falha da leitura (cota, sem chave, prazo, provedor fora) pula a categoria.
        expect(f).toContain("const iaFora = lido?.ok === false")
        expect(f).not.toContain("lido.motivo === 'cota' || lido.motivo === 'sem_chave'")
        expect(f).toContain("if (montado.semCategoria && !iaFora)")
    })

    it("a categoria pela IA tem prazo curto, para não atrasar o Atalho", () => {
        const f = fonte(CAPTURE)
        const chamada = f.slice(f.indexOf("await categorizar("))
        expect(chamada.slice(0, chamada.indexOf("\n"))).toContain("prazoMs: 4000")
    })

    it("consulta o plano da carteira padrão", () => {
        expect(fonte(CAPTURE)).toContain("rpc('workspace_plan'")
        // A mesma regra do ia-ler.
        expect(fonte(CAPTURE)).toContain("if (plano !== 'familia') return json(402")
    })

    it("token revogado, desconhecido ou mal formado dão a mesma resposta (Foco 2)", () => {
        const f = fonte(CAPTURE)
        expect(f).toContain("'Token inválido.'")
        expect(f).toContain(".is('revoked_at', null)")
        // Procura pelo hash; o token em texto nunca vai ao banco.
        const hash = f.indexOf("sha256Hex(")
        const busca = f.indexOf(".from('capture_tokens')")
        expect(hash).toBeGreaterThan(-1)
        expect(busca).toBeGreaterThan(hash)
        expect(f).toContain(".eq('token_hash', ")
    })

    it("não avisa os membros por conta própria (o trigger avisa)", () => {
        expect(fonte(CAPTURE)).not.toContain("notify-transaction-created")
    })
})

describe("avaliadores pelo servidor (Decisão 9)", () => {
    for (const nome of ["evaluate-budgets", "evaluate-credit-card-alerts"]) {
        it(`${nome}: o caminho de serviço vem antes do JWT`, () => {
            const f = fonte(`supabase/functions/${nome}/index.ts`)
            const servico = f.indexOf("isServiceAuthorized(req)")
            expect(servico).toBeGreaterThan(-1)
            expect(f.indexOf("bearerJwt(")).toBeGreaterThan(servico)
            expect(f).toContain("from '../_shared/service-auth.ts'")
        })
    }

    it("notify-transaction-created usa o isServiceAuthorized compartilhado", () => {
        const f = fonte("supabase/functions/notify-transaction-created/index.ts")
        expect(f).toContain("from '../_shared/service-auth.ts'")
        expect(f).not.toContain("function isServiceAuthorized")
    })

    it("capture está no deploy e sem verificação de JWT no gateway", () => {
        expect(lerFonte("package.json")).toMatch(/"supabase:deploy:functions": "[^"]*\bcapture\b/)
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.capture\]\s*\nverify_jwt = false/)
    })
})
