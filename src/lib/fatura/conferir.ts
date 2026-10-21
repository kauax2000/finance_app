import { normalizarDescricao } from "@/lib/import/normalizar"
import type { ItemBanco } from "@/lib/import/tipos"
import { daysBetweenYmd } from "@/lib/transaction-date"

export type LancamentoParaConferir = {
    id: string
    date: string // YYYY-MM-DD
    description: string | null
    amount: number
    type: "expense" | "income"
    installment_sequence: number | null
}

type Par = { banco: ItemBanco; app: LancamentoParaConferir }

export type ResultadoConferencia = {
    bate: Par[]
    faltaNoApp: ItemBanco[]
    soNoApp: LancamentoParaConferir[]
    valorDiferente: Par[]
    parcelaForaDeSequencia: Par[]
    somaBanco: number
    somaApp: number
    diferenca: number
}

const JANELA_DIAS = 3

function palavras(s: string): Set<string> {
    return new Set(normalizarDescricao(s).split(" ").filter((p) => p.length >= 3 && !/^\d+$/.test(p)))
}

/** Jaccard das palavras de 3+ letras, não numéricas; vazio dá 0. */
export function similaridade(a: string, b: string): number {
    const pa = palavras(a)
    const pb = palavras(b)
    const uniao = new Set([...pa, ...pb]).size
    if (!uniao) return 0
    let comum = 0
    for (const p of pa) if (pb.has(p)) comum++
    return comum / uniao
}

const centavos = (n: number) => Math.round(n * 100) / 100

/**
 * Casa os pares candidatos do melhor para o pior (maior similaridade, depois menor
 * distância em dias), sem reutilizar nenhum dos dois lados.
 */
function casar(
    banco: ItemBanco[],
    app: LancamentoParaConferir[],
    usadosBanco: Set<number>,
    usadosApp: Set<number>,
    aceita: (b: ItemBanco, a: LancamentoParaConferir, sim: number) => boolean,
): Array<[number, number]> {
    const candidatos: Array<{ i: number; j: number; sim: number; dias: number }> = []
    banco.forEach((b, i) => {
        if (usadosBanco.has(i)) return
        app.forEach((a, j) => {
            if (usadosApp.has(j)) return
            if ((b.estorno ? "income" : "expense") !== a.type) return
            const dias = daysBetweenYmd(b.data, a.date)
            if (dias == null || Math.abs(dias) > JANELA_DIAS) return
            const sim = similaridade(b.descricao, a.description ?? "")
            if (aceita(b, a, sim)) candidatos.push({ i, j, sim, dias: Math.abs(dias) })
        })
    })
    candidatos.sort((x, y) => y.sim - x.sim || x.dias - y.dias)
    const pares: Array<[number, number]> = []
    for (const c of candidatos) {
        if (usadosBanco.has(c.i) || usadosApp.has(c.j)) continue
        usadosBanco.add(c.i)
        usadosApp.add(c.j)
        pares.push([c.i, c.j])
    }
    return pares
}

export function conferirFatura(banco: ItemBanco[], app: LancamentoParaConferir[]): ResultadoConferencia {
    const usadosBanco = new Set<number>()
    const usadosApp = new Set<number>()
    const r: ResultadoConferencia = {
        bate: [],
        faltaNoApp: [],
        soNoApp: [],
        valorDiferente: [],
        parcelaForaDeSequencia: [],
        somaBanco: 0,
        somaApp: 0,
        diferenca: 0,
    }

    for (const [i, j] of casar(banco, app, usadosBanco, usadosApp, (b, a) => Math.abs(b.valor - a.amount) < 0.005)) {
        const par = { banco: banco[i], app: app[j] }
        // `null` é a parcela importada como despesa simples (Decisão 4): não conta como fora de sequência.
        const seq = app[j].installment_sequence
        const k = banco[i].parcela?.k
        if (k != null && seq != null && seq !== k) r.parcelaForaDeSequencia.push(par)
        else r.bate.push(par)
    }

    for (const [i, j] of casar(
        banco,
        app,
        usadosBanco,
        usadosApp,
        (b, a, sim) => sim >= 0.5 && Math.abs(b.valor - a.amount) >= 0.005,
    )) {
        r.valorDiferente.push({ banco: banco[i], app: app[j] })
    }

    r.faltaNoApp = banco.filter((_, i) => !usadosBanco.has(i))
    r.soNoApp = app.filter((_, j) => !usadosApp.has(j))
    r.somaBanco = centavos(banco.reduce((s, b) => s + (b.estorno ? -b.valor : b.valor), 0))
    r.somaApp = centavos(app.reduce((s, a) => s + (a.type === "income" ? -a.amount : a.amount), 0))
    r.diferenca = centavos(r.somaBanco - r.somaApp)
    return r
}
