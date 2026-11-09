import type { ConferenciaNoCiclo } from "@/lib/fatura/ciclo"
import type { LancamentoParaConferir } from "@/lib/fatura/conferir"
import type { ItemParaAlinhar, ParAlinhado } from "@/lib/ia/ler"
import type { ItemImportavel } from "@/lib/import/importar"
import { daysBetweenYmd } from "@/lib/transaction-date"

const cents = (n: number) => Math.round(n * 100)

/** Só índice, data, descrição e valor vão à IA: nunca id, categoria nem autor. */
export function paraAlinhar(conf: ConferenciaNoCiclo<ItemImportavel>): { banco: ItemParaAlinhar[]; app: ItemParaAlinhar[] } {
    const corta = (s: string | null) => (s ?? "").slice(0, 200)
    return {
        banco: conf.faltaNoApp.map((b, i) => ({ i, data: b.data, descricao: corta(b.descricao), valor: Math.abs(b.valor), estorno: b.estorno })),
        app: conf.soNoApp.map((a, i) => ({ i, data: a.date, descricao: corta(a.description), valor: Math.abs(a.amount), estorno: a.type === "income" })),
    }
}

/** Espelha `validarPares` de `supabase/functions/_shared/ia.ts`: a IA só sugere, o código valida. */
export function validarParesAlinhados(pares: ParAlinhado[], banco: ItemParaAlinhar[], app: ItemParaAlinhar[]): ParAlinhado[] {
    const doBanco = new Map(banco.map((x) => [x.i, x]))
    const doApp = new Map(app.map((x) => [x.i, x]))
    const usadosBanco = new Set<number>()
    const usadosApp = new Set<number>()
    const ok: ParAlinhado[] = []
    for (const p of pares ?? []) {
        const b = Number.isInteger(p?.banco) ? doBanco.get(p.banco) : undefined
        const a = Number.isInteger(p?.app) ? doApp.get(p.app) : undefined
        if (!b || !a || usadosBanco.has(b.i) || usadosApp.has(a.i)) continue
        if (b.estorno !== a.estorno) continue
        const dias = daysBetweenYmd(b.data, a.data)
        if (dias == null || Math.abs(dias) > 7) continue
        if (Math.abs(cents(b.valor) - cents(a.valor)) > Math.max(1000, Math.round(b.valor * 25))) continue
        usadosBanco.add(b.i)
        usadosApp.add(a.i)
        ok.push({ banco: b.i, app: a.i })
    }
    return ok
}

/** Tira os pares válidos de "falta no app" e "só no app"; as somas não mudam. `daIA`: ids de app casados pela IA. */
export function aplicarAlinhamento<T extends ItemImportavel>(
    conf: ConferenciaNoCiclo<T>,
    pares: ParAlinhado[],
): ConferenciaNoCiclo<T> & { daIA: Set<string> } {
    const { banco, app } = paraAlinhar(conf as ConferenciaNoCiclo<ItemImportavel>)
    const validos = validarParesAlinhados(pares, banco, app)
    const bate = [...conf.bate]
    const valorDiferente = [...conf.valorDiferente]
    const daIA = new Set<string>()
    const bancoUsado = new Set<number>()
    const appUsado = new Set<number>()
    for (const p of validos) {
        const par: { banco: T; app: LancamentoParaConferir } = { banco: conf.faltaNoApp[p.banco], app: conf.soNoApp[p.app] }
        ;(cents(par.banco.valor) === cents(par.app.amount) ? bate : valorDiferente).push(par)
        bancoUsado.add(p.banco)
        appUsado.add(p.app)
        daIA.add(par.app.id)
    }
    return {
        ...conf,
        bate,
        valorDiferente,
        faltaNoApp: conf.faltaNoApp.filter((_, i) => !bancoUsado.has(i)),
        soNoApp: conf.soNoApp.filter((_, i) => !appUsado.has(i)),
        daIA,
    }
}

/**
 * Qual chamada à IA a conferência faz agora, uma de cada vez. O PDF incompleto e ainda
 * sem IA é relido antes; o alinhamento só começa depois que a releitura daquela leitura
 * terminou, e não começa se ela acabou sem cota. Cada uma vale uma vez por leitura.
 */
export function proximaChamadaDaIA(e: {
    origem: string
    completa: boolean | null
    ia: boolean
    leituraId: string
    relidaIniciada: string | null
    relidaTerminou: string | null
    cotaEsgotada: boolean
    sobraDosDoisLados: boolean
    alinhadaIniciada: string | null
    pendente: string | null
}): "reler" | "alinhar" | null {
    if (e.pendente != null || !e.leituraId) return null
    if (e.origem === "pdf" && e.completa === false && !e.ia) {
        if (e.relidaIniciada !== e.leituraId) return "reler"
        if (e.relidaTerminou !== e.leituraId || e.cotaEsgotada) return null
    }
    if (!e.sobraDosDoisLados || e.alinhadaIniciada === e.leituraId) return null
    return "alinhar"
}
