import { conferirFatura, type LancamentoParaConferir, type ResultadoConferencia } from "@/lib/fatura/conferir"
import type { ItemBanco } from "@/lib/import/tipos"
import { roundCents } from "@/lib/money-brl"
import { addDaysYmd } from "@/lib/transaction-date"

/** Um ciclo da fatura, em `YYYY-MM-DD`, com as duas pontas inclusas. */
export type CicloFatura = { inicio: string; fechamento: string }

const JANELA_DIAS = 3

/**
 * Leva a data de cada item para dentro do ciclo. A fatura imprime a parcela com a
 * data da compra ("05/03 LOJA 07/10"): importada assim, ela cairia numa fatura
 * velha e o total nunca bateria. Quem muda de data ganha " · compra em dd/mm" na
 * descrição; o resto (o `clientId`, inclusive) fica igual.
 */
export function ajustarAoCiclo<T extends ItemBanco>(itens: T[], ciclo: CicloFatura): T[] {
    return itens.map((i) => {
        const data = i.data < ciclo.inicio ? ciclo.inicio : i.data > ciclo.fechamento ? ciclo.fechamento : i.data
        if (data === i.data) return i
        return { ...i, data, descricao: `${i.descricao} · compra em ${i.data.slice(8, 10)}/${i.data.slice(5, 7)}` }
    })
}

/**
 * A conferência de um ciclo. Duas passadas:
 * 1. a data original do banco contra o app desde a data mais antiga do arquivo
 *    (−3 dias) até o fechamento — o extrato que atravessa ciclos casa com o que
 *    já está lançado na data certa;
 * 2. o que sobrou do banco, ajustado ao ciclo, contra o que sobrou do app — a
 *    parcela que a importação trouxe para dentro do ciclo volta a casar (Foco 3).
 * "Só no app" e a soma do app ficam no ciclo; os itens do banco voltam originais.
 */
export function conferirNoCiclo<T extends ItemBanco>(
    banco: T[],
    app: LancamentoParaConferir[],
    ciclo: CicloFatura,
): Omit<ResultadoConferencia, "faltaNoApp"> & { faltaNoApp: T[] } {
    const maisAntiga = banco.reduce((min, b) => (b.data < min ? b.data : min), ciclo.inicio)
    const desde = addDaysYmd(maisAntiga, -JANELA_DIAS)
    const naJanela = app.filter((a) => a.date >= desde && a.date <= ciclo.fechamento)

    const r1 = conferirFatura(banco, naJanela)
    const sobra = r1.faltaNoApp as T[]
    const ajustados = ajustarAoCiclo(sobra, ciclo)
    const original = new Map<ItemBanco, T>(ajustados.map((a, i) => [a, sobra[i]]))
    const r2 = conferirFatura(ajustados, r1.soNoApp)
    const volta = (p: { banco: ItemBanco; app: LancamentoParaConferir }) => ({ banco: original.get(p.banco)!, app: p.app })

    const noCiclo = app.filter((a) => a.date >= ciclo.inicio && a.date <= ciclo.fechamento)
    const somaApp = roundCents(noCiclo.reduce((s, a) => s + (a.type === "income" ? -a.amount : a.amount), 0))
    return {
        bate: [...r1.bate, ...r2.bate.map(volta)],
        faltaNoApp: r2.faltaNoApp.map((b) => original.get(b)!),
        soNoApp: r2.soNoApp.filter((a) => a.date >= ciclo.inicio && a.date <= ciclo.fechamento),
        valorDiferente: [...r1.valorDiferente, ...r2.valorDiferente.map(volta)],
        parcelaForaDeSequencia: [...r1.parcelaForaDeSequencia, ...r2.parcelaForaDeSequencia.map(volta)],
        somaBanco: r1.somaBanco,
        somaApp,
        diferenca: roundCents(r1.somaBanco - somaApp),
    }
}
