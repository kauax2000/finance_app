import { describe, expect, it } from "vitest"
import { lerFonte, semComentarios } from "@/test/fonte"

const fonte = (caminho: string) => semComentarios(lerFonte(caminho))
const DIARIO = "supabase/functions/billing-daily/index.ts"

describe("Edge billing-daily", () => {
    it("só o cron chama, pelo x-cron-secret", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("secretMatches(Deno.env.get('CRON_SECRET'), req.headers.get('x-cron-secret'))")
        expect(f).toContain("return json(401")
    })

    it("lê o enforced_since antes de pedir os avisos, e desligado pula", () => {
        const f = fonte(DIARIO)
        const config = f.indexOf(".from('billing_settings')")
        expect(config).toBeGreaterThan(-1)
        expect(f.indexOf("avisos_de_teste_pendentes")).toBeGreaterThan(config)
        expect(f).toContain("pulado: 'desligado'")
    })

    it("o aviso é essencial, do tipo system, com o link para os planos", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("essencial: true")
        expect(f).toContain("type: 'system'")
        expect(f).toContain("metadata: { href: '/plans' }")
        expect(f).toContain("avisoDoTeste(")
    })

    it("o dedupe 'teste' é liberado quando a entrega falha", () => {
        const f = fonte(DIARIO)
        expect(f).toContain("tipo: 'teste'")
        expect(f).toContain(".from('billing_avisos')")
        expect(f).toContain("claimDedupe(")
        expect(f).toContain("releaseDedupe(")
        expect(f).toContain("forEachLimit(")
        expect(f).toContain("FAN_OUT_CONCURRENCY")
        // a falha de entrega e a exceção liberam o dedupe
        expect(f.split("await releaseDedupe(admin, dedupe)").length - 1).toBe(2)
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-daily\]\s*\nverify_jwt = false/)
    })
})

describe("entrega essencial", () => {
    it("deliverNotification pula o interruptor do tipo e usa canaisDoAviso", () => {
        const f = fonte("supabase/functions/_shared/deliver-notification.ts")
        expect(f).toContain("essencial?: boolean")
        expect(f).toContain("canaisDoAviso(prefs, essencial)")
        expect(f).toMatch(/!skipTypePref && !essencial && !isTypeAllowedForPrefs/)
    })
})

const CHECKOUT = "supabase/functions/billing-checkout/index.ts"

describe("Edge billing-checkout", () => {
    it("recusa o convidado antes de qualquer chamada ao Asaas", () => {
        const f = fonte(CHECKOUT)
        const guest = f.indexOf(".eq('role', 'guest')")
        expect(guest).toBeGreaterThan(-1)
        expect(f).toContain("Seu acesso vem de quem te convidou. Peça para essa pessoa cuidar do plano.")
        expect(f.indexOf("criarCliente(cfg")).toBeGreaterThan(guest)
        expect(f.indexOf("criarCobranca(cfg")).toBeGreaterThan(guest)
        expect(f.indexOf("planoDoCheckout(")).toBeGreaterThan(guest)
    })

    it("o CORS inclui x-app-session-id e o erro solto volta com CORS", () => {
        const f = fonte(CHECKOUT)
        expect(f).toMatch(/'Access-Control-Allow-Headers': '[^']*x-app-session-id[^']*'/)
        expect(f).toContain("return json(500, { error: internalError('billing-checkout', e) })")
        expect(f).toContain("bearerJwt(req.headers.get('Authorization'))")
        expect(f).toContain("getAuthUserFromJwt(")
    })

    it("o CPF não vai a log, a tabela nem a resposta", () => {
        const f = fonte(CHECKOUT)
        const linhas = f.split("\n")
        for (const l of linhas.filter((l) => /console\.|internalError\(/.test(l))) expect(l).not.toMatch(/cpf/i)
        for (const l of linhas.filter((l) => /json\(\d+/.test(l))) expect(l.slice(l.search(/json\(\d+/)).replace("CPF inválido.", "")).not.toMatch(/cpf/i)
        for (const l of linhas.filter((l) => /\.(update|upsert|insert)\(/.test(l))) expect(l).not.toMatch(/cpf/i)
        // o CPF só sai pelo criarCliente
        const usos = linhas.filter((l) => /\bcpf\b/.test(l))
        expect(usos.filter((l) => !/let cpf|\{ nome, cpf \}|cpfValido\(cpf\)|criarCliente\(/.test(l))).toEqual([])
    })

    it("reivindica a linha antes de chamar o Asaas, e nunca a grava sem condição", () => {
        const f = fonte(CHECKOUT)
        const reivindica = f.indexOf(".eq('status', linha.status)")
        expect(reivindica).toBeGreaterThan(-1)
        expect(f.indexOf("criarCliente(cfg")).toBeGreaterThan(reivindica)
        expect(f).toContain(".is('asaas_customer_id', null)")
        // a única gravação sem condição é a da linha que ainda não existe
        expect(f.match(/\.upsert\(/g)?.length).toBe(1)
        expect(f).toContain("ignoreDuplicates: true")
        // a gravação final só vale se a reivindicação ainda é desta chamada
        expect(f.split(".eq('checkout_criado_em', reivindicado)").length - 1).toBeGreaterThanOrEqual(2)
        expect(f).toContain("Seu plano mudou agora. Abra Planos de novo.")
        expect(f).toContain("Estamos tentando renovar com seu cartão. Tente de novo em alguns minutos.")
    })

    it("lista antes de criar: reusa, remove ou espera a confirmação (Ruling 7)", () => {
        const f = fonte(CHECKOUT)
        const lista = f.indexOf("listarCobrancasAbertas(cfg")
        const remove = f.indexOf("removerCobranca(cfg")
        const cria = f.indexOf("criarCobranca(cfg")
        expect(lista).toBeGreaterThan(-1)
        expect(remove).toBeGreaterThan(lista)
        expect(cria).toBeGreaterThan(remove)
        expect(f).toContain("buscarCobranca(cfg, linha.checkout_ref)")
        expect(f).toContain("Seu pagamento está sendo confirmado.")
        expect(f).toContain("triagemDasAbertas(")
    })

    it("a cobrança que falhou, incerta ou não, solta a linha e volta 502", () => {
        const f = fonte(CHECKOUT)
        const falha = f.slice(f.indexOf("if (!cobranca.ok)"), f.indexOf("if (!cobranca.ok)") + 200)
        expect(falha).toContain("await soltar()")
        expect(falha).toContain("SEM_RESPOSTA()")
    })

    it("não manda dado de cartão e nem token: o cartão é digitado na fatura", () => {
        const f = fonte(CHECKOUT)
        expect(f).not.toContain("creditCard")
        expect(f).not.toMatch(/token:/)
    })

    it("grava o IP do x-forwarded-for e o link da fatura", () => {
        const f = fonte(CHECKOUT)
        expect(f).toContain("req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 45)")
        expect(f).toContain("onConflict: 'user_id'")
        expect(f).toContain("...(ip ? { ultimo_ip: ip } : {})")
        expect(f).toContain("checkout_url: url")
        expect(f).toContain("referencia: linha.id")
        expect(f).toContain("retorno: `${appBase}/plans?pago=1`")
        expect(f).toContain("vencimento: formatYmd(appTodayYmd())")
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-checkout\]\s*\nverify_jwt = false/)
    })
})

const WEBHOOK = "supabase/functions/asaas-webhook/index.ts"

/** Cada chamada `console.…(…)` inteira, com os argumentos em várias linhas. */
function chamadasDeLog(f: string): string[] {
    const chamadas: string[] = []
    for (const m of f.matchAll(/console\.\w+\(|internalError\(/g)) {
        let fundo = 0
        let fim = m.index!
        for (; fim < f.length; fim++) {
            if (f[fim] === "(") fundo++
            else if (f[fim] === ")" && --fundo === 0) break
        }
        chamadas.push(f.slice(m.index!, fim + 1))
    }
    return chamadas
}

/** O corpo de uma função de topo do arquivo, até a próxima. */
function funcao(f: string, nome: string): string {
    const inicio = f.indexOf(`async function ${nome}(`)
    expect(inicio, nome).toBeGreaterThan(-1)
    const proxima = f.indexOf("\nasync function ", inicio + 1)
    return f.slice(inicio, proxima === -1 ? undefined : proxima)
}

describe("Edge asaas-webhook", () => {
    it("confere o token do Asaas antes de tocar no banco, e só o token errado volta 401", () => {
        const f = fonte(WEBHOOK)
        const token = f.indexOf("secretMatches(Deno.env.get('ASAAS_WEBHOOK_TOKEN'), req.headers.get('asaas-access-token'))")
        expect(token).toBeGreaterThan(-1)
        expect(f.indexOf("from(")).toBeGreaterThan(token)
        expect(f.indexOf("createClient(")).toBeGreaterThan(token)
        expect(f.match(/json\(401/g)?.length).toBe(1)
        expect(f).toContain("lerCorpo(req, 65536)")
        expect(f).not.toContain("Access-Control-Allow-Origin")
    })

    it("grava o evento antes de mudar a linha, e o repetido volta 200", () => {
        const f = fonte(WEBHOOK)
        const evento = f.indexOf(".from('billing_events').insert(")
        const linha = f.indexOf(".from('billing_subscriptions').update(")
        expect(evento).toBeGreaterThan(-1)
        expect(linha).toBeGreaterThan(evento)
        expect(f).toContain("'23505'")
        expect(f).toContain("repetido: true")
    })

    it("ignora com 200 o cliente diferente do da linha, e decide pelo efeitoDoEvento", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain("payment.customer !== linha.asaas_customer_id")
        expect(f).toContain("efeitoDoEvento(")
        expect(f).toContain("checkout_url: null")
    })

    it("a gravação da linha é condicional ao estado lido", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain(".eq('updated_at', linha.updated_at)")
        expect(f).toContain(".eq('status', linha.status)")
        expect(f).toContain("for (const col of ['provider_ref', 'current_period_end'] as const)")
        expect(f).toContain("q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])")
    })

    it("Ruling 9: decide pelo registro dos parcelamentos — desconhecido é ignorado, já ativado é mensal", () => {
        const f = fonte(WEBHOOK)
        const tratar = funcao(f, "tratar")
        const registro = tratar.indexOf(".from('billing_parcelamentos')")
        expect(registro).toBeGreaterThan(-1)
        expect(tratar.indexOf("efeitoDoEvento(")).toBeGreaterThan(registro)
        expect(tratar).toContain("console.error('asaas-webhook: parcelamento desconhecido'")
        expect(tratar).toContain("ignorado('parcelamento')")
        expect(tratar).toContain("if (registro.ativado_em)")
        // ativar marca o ativado_em, e o evento do provider_ref o conserta se faltou
        expect(f).toContain("marcarAtivado(")
        expect(f).toContain(".is('ativado_em', null)")
    })

    it("o erro de banco apaga o evento e volta 500, para o Asaas tentar de novo", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain(".from('billing_events').delete()")
        expect(f).toContain("await esquecer(id)")
        expect(f).toContain("json(500")
    })

    it("Ruling 8 e 10: estorna só depois do pagamentoEmDobro, lê o parcelamento antes, e nunca volta 500", () => {
        const f = fonte(WEBHOOK)
        const dobro = f.indexOf("pagamentoEmDobro(")
        expect(dobro).toBeGreaterThan(-1)
        expect(f.indexOf("estornarNoAsaas(cfg")).toBeGreaterThan(dobro)
        expect(f).toContain("payment.installment !== linha.provider_ref")
        const estornar = funcao(f, "estornar")
        // um problema no estorno fica pendente para o billing-daily, e a fila segue
        expect(estornar).not.toContain("json(500")
        expect(estornar).not.toContain("esquecer(")
        expect(estornar).toContain("estorno_status: 'pendente'")
        expect(estornar).toContain("estorno_status: 'feito'")
        expect(estornar).toContain(".is('estorno_status', null)")
        expect(estornar.indexOf("estorno_status: 'pendente'")).toBeLessThan(estornar.indexOf("estornarNoAsaas(cfg"))
        expect(estornar.indexOf("avisarDoEstorno(")).toBeGreaterThan(estornar.indexOf("estorno_status: 'feito'"))
    })

    it("o aviso do estorno é essencial, do tipo system, na carteira pessoal", () => {
        const f = fonte(WEBHOOK)
        expect(f).toContain("Cobrança em dobro devolvida")
        expect(f).toContain("Recebemos um pagamento a mais pelo plano e já pedimos o estorno ao Asaas. O valor volta para o cartão em até 10 dias úteis.")
        expect(f).toContain("type: 'system'")
        expect(f).toContain("essencial: true")
        expect(f).toContain("metadata: { href: '/plans' }")
        expect(f).toContain(".eq('type', 'personal')")
    })

    it("o CPF não vai a log", () => {
        const chamadas = chamadasDeLog(fonte(WEBHOOK))
        expect(chamadas.length).toBeGreaterThan(5)
        for (const c of chamadas) expect(c).not.toMatch(/cpf/i)
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.asaas-webhook\]\s*\nverify_jwt = false/)
    })
})

describe("Edge billing-checkout registra o parcelamento (Ruling 9)", () => {
    it("grava em billing_parcelamentos o que cria ou reusa, antes de entregar o link", () => {
        const f = fonte(CHECKOUT)
        const registro = f.indexOf(".from('billing_parcelamentos').insert(")
        expect(registro).toBeGreaterThan(f.indexOf("criarCobranca(cfg"))
        expect(registro).toBeLessThan(f.indexOf("checkout_url: url"))
        expect(f).toContain("subscription_id: linha.id")
        expect(f).toContain("reusar.installment")
        expect(f).toContain("cobranca.dados.installment")
    })
})

describe("estorno compartilhado (Ruling 10)", () => {
    it("estornarNoAsaas lê o parcelamento, confere o cliente e só então pede", () => {
        const f = fonte("supabase/functions/_shared/asaas.ts")
        const helper = f.slice(f.indexOf("export async function estornarNoAsaas("))
        const busca = helper.indexOf("buscarParcelamento(cfg")
        expect(busca).toBeGreaterThan(-1)
        expect(helper.indexOf("estado.dados.customer !== cliente")).toBeGreaterThan(busca)
        expect(helper.indexOf("jaEstornado(")).toBeGreaterThan(busca)
        expect(helper.indexOf("estornarParcelamento(cfg")).toBeGreaterThan(helper.indexOf("jaEstornado("))
    })
})

const CANCEL = "supabase/functions/billing-cancel/index.ts"

describe("Edge billing-cancel", () => {
    it("exige o JWT antes de ler o corpo e o banco, com o CORS do app", () => {
        const f = fonte(CANCEL)
        const jwt = f.indexOf("bearerJwt(req.headers.get('Authorization'))")
        expect(jwt).toBeGreaterThan(-1)
        expect(f.indexOf("getAuthUserFromJwt(")).toBeGreaterThan(jwt)
        expect(f.indexOf("lerCorpo(req")).toBeGreaterThan(f.indexOf("getAuthUserFromJwt("))
        expect(f.indexOf("createClient(")).toBeGreaterThan(f.indexOf("getAuthUserFromJwt("))
        expect(f.match(/json\(401/g)?.length).toBe(2)
        expect(f).toContain(".eq('user_id', auth.user.id)")
        expect(f).toMatch(/'Access-Control-Allow-Headers': '[^']*x-app-session-id[^']*'/)
        expect(f).toContain("return json(500, { error: internalError('billing-cancel', e) })")
        expect(f).toContain("Ação desconhecida.")
    })

    it("cancelar: active e past_due, recusa a renovação esperando confirmação (Ruling 11 e 12)", () => {
        const f = fonte(CANCEL)
        const c = funcao(f, "cancelar")
        expect(c).toContain("A renovação deste ano já foi cobrada e está sendo confirmada. Depois de confirmada, você pode cancelar a próxima.")
        expect(c).toContain("Não há assinatura para cancelar.")
        expect(c).toContain(".eq('status', linha.status)")
        expect(c).toContain("for (const col of ['grace_until', 'checkout_criado_em'] as const)")
        expect(c).toContain("q = linha[col] === null ? q.is(col, null) : q.eq(col, linha[col])")
        expect(c).toContain("podeCancelar(linha, agora)")
        expect(c).toContain("Estamos renovando seu plano agora. Tente cancelar daqui a alguns minutos.")
        expect(funcao(f, "desfazer")).toContain("podeDesfazer(linha, agora)")
    })

    it("reembolsar: podeReembolsar antes de qualquer chamada ao Asaas, e só o provider_ref da linha", () => {
        const r = funcao(fonte(CANCEL), "reembolsar")
        const pode = r.indexOf("podeReembolsar(linha, agora)")
        expect(pode).toBeGreaterThan(-1)
        expect(r.indexOf("configDoAsaas(")).toBeGreaterThan(pode)
        expect(r.indexOf("estornarNoAsaas(cfg, ref, linha.asaas_customer_id)")).toBeGreaterThan(pode)
        expect(r).toContain("const ref = linha?.provider_ref ?? null")
        expect(r).toContain("O prazo de 7 dias para reembolso terminou.")
    })

    it("reembolsar: reivindica o registro antes de pedir, e expira só depois do estorno confirmado", () => {
        const r = funcao(fonte(CANCEL), "reembolsar")
        const reivindica = r.indexOf("estorno_status: 'pendente'")
        const pede = r.indexOf("estornarNoAsaas(cfg")
        const falha = r.indexOf("if (!r.ok)")
        const feito = r.indexOf("estorno_status: 'feito'")
        const expira = r.indexOf("status: 'expired'")
        expect(r).toContain(".is('estorno_status', null)")
        expect(reivindica).toBeLessThan(pede)
        expect(falha).toBeGreaterThan(pede)
        expect(feito).toBeGreaterThan(falha)
        expect(expira).toBeGreaterThan(feito)
        expect(r.match(/status: 'expired'/g)?.length).toBe(1)
        expect(r).toContain(".eq('provider_ref', ref)")
    })

    it("reembolsar: o pedido estourado ou recusado fica pendente e volta 202, sem pedir de novo (Ruling 13)", () => {
        const f = fonte(CANCEL)
        expect(f).toContain("json(202, { ok: true, pendente: true, mensagem: 'Pedimos o reembolso ao Asaas. Avisamos quando ele for confirmado.' })")
        const r = funcao(f, "reembolsar")
        // o pendente responde antes de qualquer chamada ao Asaas
        expect(r.indexOf("registro?.estorno_status === 'pendente'")).toBeLessThan(r.indexOf("estornarNoAsaas(cfg"))
        expect(r.slice(r.indexOf("if (!r.ok)"), r.indexOf("estorno_status: 'feito'"))).not.toContain("status: 'expired'")
    })

    it("reembolsar: nenhuma falha solta a reivindicação, e o toque que perdeu só expira com 'feito' (I1)", () => {
        const r = funcao(fonte(CANCEL), "reembolsar")
        expect(r).not.toContain("estorno_status: null")
        expect(r).not.toContain("json(502")
        const falha = r.slice(r.indexOf("if (!r.ok)"), r.indexOf("estorno_status: 'feito'"))
        expect(falha).toContain("return REEMBOLSO_PEDIDO()")
        expect(falha).not.toContain("etapa ===")
        const perdeu = r.slice(r.indexOf("if (!meu?.length)"), r.indexOf("} else {", r.indexOf("if (!meu?.length)")))
        expect(perdeu).toContain("if (registro?.estorno_status !== 'feito') return REEMBOLSO_PEDIDO()")
        expect(r.indexOf("!== 'feito') return REEMBOLSO_PEDIDO()")).toBeLessThan(r.indexOf("status: 'expired'"))
    })

    it("a Edge está no config sem JWT", () => {
        expect(lerFonte("supabase/config.toml")).toMatch(/\[functions\.billing-cancel\]\s*\nverify_jwt = false/)
    })
})
