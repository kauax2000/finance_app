import {
    conferirFatura,
    type LancamentoParaConferir,
    type ResultadoConferencia,
    similaridade,
} from "@/lib/fatura/conferir"
import type { ItemBanco } from "@/lib/import/tipos"
import { roundCents } from "@/lib/money-brl"
import { addDaysYmd, daysBetweenYmd } from "@/lib/transaction-date"

/** Um ciclo da fatura, em `YYYY-MM-DD`, com as duas pontas inclusas. */
export type CicloFatura = { inicio: string; fechamento: string }

const JANELA_DIAS = 3

export type ConferenciaNoCiclo<T extends ItemBanco> = ReturnType<typeof conferirNoCiclo<T>>

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
 * A conferência de um ciclo. O item sem parcela:
 * 1. pela data original contra o app desde a data mais antiga do arquivo (−3
 *    dias) até o fechamento — o extrato que atravessa ciclos casa com o que já
 *    está lançado na data certa;
 * 2. o que sobrou, ajustado ao ciclo, contra o que sobrou do app.
 * A parcela só casa **dentro do ciclo**: a fatura a imprime com a data da compra,
 * e antes do ciclo moram a parcela 1 do plano e as parcelas importadas em
 * faturas velhas, que a roubariam. Ela vai:
 * 2. ajustada ao ciclo, contra o que sobrou do app no ciclo — a parcela que a
 *    importação trouxe para dentro do ciclo volta a casar (Foco 3);
 * 3. pelo valor, sem janela de dias, contra o que ainda sobrou no ciclo — a
 *    linha do plano tem a data da cobrança (`casarParcelas`).
 * "Só no app" e a soma do app ficam no ciclo; os itens do banco voltam originais.
 */
export function conferirNoCiclo<T extends ItemBanco>(
    banco: T[],
    app: LancamentoParaConferir[],
    ciclo: CicloFatura,
): Omit<ResultadoConferencia, "faltaNoApp"> & { faltaNoApp: T[] } {
    const dentro = (a: LancamentoParaConferir) => a.date >= ciclo.inicio && a.date <= ciclo.fechamento
    const semParcela = banco.filter((b) => !b.parcela)
    const comParcela = banco.filter((b) => b.parcela)

    const maisAntiga = semParcela.reduce((min, b) => (b.data < min ? b.data : min), ciclo.inicio)
    const desde = addDaysYmd(maisAntiga, -JANELA_DIAS)
    const r1 = conferirFatura(semParcela, app.filter((a) => a.date >= desde && a.date <= ciclo.fechamento))

    const original = new Map<ItemBanco, T>()
    const ajustar = (itens: T[]) => {
        const ajustados = ajustarAoCiclo(itens, ciclo)
        ajustados.forEach((a, i) => original.set(a, itens[i]))
        return ajustados
    }
    const volta = (p: { banco: ItemBanco; app: LancamentoParaConferir }) => ({ banco: original.get(p.banco)!, app: p.app })

    const r2 = conferirFatura(ajustar(r1.faltaNoApp as T[]), r1.soNoApp)
    const r2p = conferirFatura(ajustar(comParcela), r2.soNoApp.filter(dentro))
    const r3 = casarParcelas(
        r2p.faltaNoApp.map((b) => ({ ajustado: b, original: original.get(b)! })),
        r2p.soNoApp,
    )

    const faltam = new Set<T>([...r2.faltaNoApp.map((b) => original.get(b)!), ...r3.faltaNoApp])
    const somaBanco = roundCents(banco.reduce((s, b) => s + (b.estorno ? -b.valor : b.valor), 0))
    const somaApp = roundCents(app.filter(dentro).reduce((s, a) => s + (a.type === "income" ? -a.amount : a.amount), 0))
    return {
        bate: [...r1.bate, ...r2.bate.map(volta), ...r2p.bate.map(volta), ...r3.bate],
        // Na ordem do arquivo.
        faltaNoApp: banco.filter((b) => faltam.has(b)),
        soNoApp: r3.soNoApp,
        valorDiferente: [...r1.valorDiferente, ...r2.valorDiferente.map(volta), ...r2p.valorDiferente.map(volta)],
        parcelaForaDeSequencia: [
            ...r1.parcelaForaDeSequencia,
            ...r2.parcelaForaDeSequencia.map(volta),
            ...r2p.parcelaForaDeSequencia.map(volta),
            ...r3.parcelaForaDeSequencia,
        ],
        somaBanco,
        somaApp,
        diferenca: roundCents(somaBanco - somaApp),
    }
}

type Par<T> = { banco: T; app: LancamentoParaConferir }

/**
 * Só item com `parcela`: mesmo tipo e mesmo valor, sem janela de dias, e a sequência
 * igual ou alguma palavra em comum na descrição. Prefere a
 * linha cuja sequência é a da parcela, depois a descrição mais parecida, depois a
 * data mais perto (a ajustada ao ciclo). Nenhuma linha é usada duas vezes; sequência
 * diferente (as duas conhecidas) vai a "parcela fora de sequência".
 */
function casarParcelas<T extends ItemBanco>(
    banco: Array<{ ajustado: ItemBanco; original: T }>,
    app: LancamentoParaConferir[],
): { bate: Par<T>[]; parcelaForaDeSequencia: Par<T>[]; faltaNoApp: T[]; soNoApp: LancamentoParaConferir[] } {
    const candidatos: Array<{ i: number; j: number; seq: number; sim: number; dias: number }> = []
    banco.forEach(({ ajustado, original }, i) => {
        const k = original.parcela?.k
        if (k == null) return
        app.forEach((a, j) => {
            if ((original.estorno ? "income" : "expense") !== a.type) return
            if (Math.abs(original.valor - a.amount) >= 0.005) return
            const seq = a.installment_sequence === k ? 1 : 0
            const sim = similaridade(original.descricao, a.description ?? "")
            // Só o valor esconderia a parcela que falta atrás de outra despesa qualquer.
            if (!seq && sim === 0) return
            candidatos.push({ i, j, seq, sim, dias: Math.abs(daysBetweenYmd(ajustado.data, a.date) ?? Infinity) })
        })
    })
    candidatos.sort((x, y) => y.seq - x.seq || y.sim - x.sim || x.dias - y.dias)

    const usadosBanco = new Set<number>()
    const usadosApp = new Set<number>()
    const r = { bate: [] as Par<T>[], parcelaForaDeSequencia: [] as Par<T>[] }
    for (const c of candidatos) {
        if (usadosBanco.has(c.i) || usadosApp.has(c.j)) continue
        usadosBanco.add(c.i)
        usadosApp.add(c.j)
        const par = { banco: banco[c.i].original, app: app[c.j] }
        const seq = app[c.j].installment_sequence
        if (seq != null && seq !== par.banco.parcela!.k) r.parcelaForaDeSequencia.push(par)
        else r.bate.push(par)
    }
    return {
        ...r,
        faltaNoApp: banco.filter((_, i) => !usadosBanco.has(i)).map((b) => b.original),
        soNoApp: app.filter((_, j) => !usadosApp.has(j)),
    }
}
