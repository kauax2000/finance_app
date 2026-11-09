import type { CicloFatura, ConferenciaNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import type { ItemImportavel } from "@/lib/import/importar"
import { roundCents } from "@/lib/money-brl"
import type { TransactionPaymentMethod } from "@/lib/supabase"

export type Motivo = "fora-do-periodo" | "falta-no-app" | "valor-diferente" | "parcela"
export type Correcao =
    | { id: string; motivo: "fora-do-periodo"; appId: string; descricao: string; de: string; para: string; novaDescricao: string; impacto: number }
    | { id: string; motivo: "falta-no-app"; item: ItemImportavel; impacto: number }
    | { id: string; motivo: "valor-diferente"; appId: string; descricao: string; de: number; para: number; assinaturaId: string | null; impacto: number }
    | { id: string; motivo: "parcela"; appId: string; descricao: string; de: number | null; para: number; impacto: 0 }
export type FormaForaDoCartao = Exclude<TransactionPaymentMethod, "credit_card">
export type DecisaoSoNoApp = "apagar" | "manter" | { forma: FormaForaDoCartao }

export const TITULO_DO_MOTIVO: Record<Motivo | "so-no-app", string> = {
    "fora-do-periodo": "Fora do período",
    "falta-no-app": "Falta no app",
    "valor-diferente": "Valor diferente",
    parcela: "Parcela fora de sequência",
    "so-no-app": "Só no app",
}

const ORDEM: Motivo[] = ["fora-do-periodo", "falta-no-app", "valor-diferente", "parcela"]

/** +1 despesa, −1 receita ou estorno. */
const sinal = (receita: boolean) => (receita ? -1 : 1)

export function sugerirCorrecoes(conf: ConferenciaNoCiclo<ItemImportavel>, ciclo: CicloFatura): Correcao[] {
    const r: Correcao[] = []
    for (const { app } of [...conf.bate, ...conf.valorDiferente, ...conf.parcelaForaDeSequencia]) {
        if (app.date >= ciclo.inicio && app.date <= ciclo.fechamento) continue
        const descricao = app.description ?? ""
        r.push({
            id: `fora-do-periodo:${app.id}`,
            motivo: "fora-do-periodo",
            appId: app.id,
            descricao,
            de: app.date,
            para: app.date < ciclo.inicio ? ciclo.inicio : ciclo.fechamento,
            novaDescricao: `${descricao} · compra em ${app.date.slice(8, 10)}/${app.date.slice(5, 7)}`,
            impacto: roundCents(sinal(app.type === "income") * app.amount),
        })
    }
    for (const item of conf.faltaNoApp) {
        r.push({ id: `falta-no-app:${item.clientId}`, motivo: "falta-no-app", item, impacto: roundCents(sinal(item.estorno) * item.valor) })
    }
    for (const { banco, app } of conf.valorDiferente) {
        r.push({
            id: `valor-diferente:${app.id}`,
            motivo: "valor-diferente",
            appId: app.id,
            descricao: app.description ?? "",
            de: app.amount,
            para: banco.valor,
            assinaturaId: app.subscription_id ?? null,
            impacto: roundCents(sinal(app.type === "income") * (banco.valor - app.amount)),
        })
    }
    for (const { banco, app } of conf.parcelaForaDeSequencia) {
        r.push({
            id: `parcela:${app.id}`,
            motivo: "parcela",
            appId: app.id,
            descricao: app.description ?? "",
            de: app.installment_sequence,
            para: banco.parcela!.k,
            impacto: 0,
        })
    }
    return r
}

export function impactoDaDecisao(a: LancamentoParaConferir, d: DecisaoSoNoApp | undefined): number {
    if (d == null || d === "manter") return 0
    return roundCents(-sinal(a.type === "income") * a.amount)
}

export function agruparPorMotivo(c: Correcao[]) {
    return ORDEM.map((motivo) => {
        const correcoes = c.filter((x) => x.motivo === motivo)
        return { motivo, titulo: TITULO_DO_MOTIVO[motivo], correcoes, impacto: roundCents(correcoes.reduce((s, x) => s + x.impacto, 0)) }
    }).filter((g) => g.correcoes.length)
}
