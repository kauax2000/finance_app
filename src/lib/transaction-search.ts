import { ROUTES } from "@/config/navigation"

export type BuscaTransacoes = {
    /** O que sobra depois de tirar valor e data, aparado e com espaços simples. */
    texto: string
    /** Faixa de valor; `max` exclusivo. 150 → {min:150, max:151}; 150,50 → {min:150.5, max:150.5, exato:true} */
    valor: { min: number; max: number; exato: boolean } | null
    /** Datas locais `yyyy-mm-dd`, as duas inclusivas. */
    periodo: { de: string; ate: string } | null
}

const MESES = [
    ["janeiro", "jan"],
    ["fevereiro", "fev"],
    ["marco", "mar"],
    ["abril", "abr"],
    ["maio", "mai"],
    ["junho", "jun"],
    ["julho", "jul"],
    ["agosto", "ago"],
    ["setembro", "set"],
    ["outubro", "out"],
    ["novembro", "nov"],
    ["dezembro", "dez"],
]

/** Minúsculo e sem acento: "Março" → "marco". */
function semAcento(s: string): string {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/** 1–12 para o nome ou a abreviação do mês; 0 se não for mês. */
function mesDe(token: string): number {
    return MESES.findIndex((nomes) => nomes.includes(token)) + 1
}

const dois = (n: number) => String(n).padStart(2, "0")
/** Data local `yyyy-mm-dd` (nada de toISOString: ele desloca pelo fuso). */
const ymd = (a: number, m: number, d: number) => `${a}-${dois(m)}-${dois(d)}`
const ultimoDia = (a: number, m: number) => new Date(a, m, 0).getDate()
const ehAno = (s: string) => /^(19|20)\d{2}$/.test(s)

function mesInteiro(a: number, m: number) {
    return { de: ymd(a, m, 1), ate: ymd(a, m, ultimoDia(a, m)) }
}

/** O mês sem ano: o mais recente que não passa de `hoje` (dezembro em outubro é o do ano passado). */
function anoDoMes(m: number, hoje: Date): number {
    return m > hoje.getMonth() + 1 ? hoje.getFullYear() - 1 : hoje.getFullYear()
}

function periodoDoToken(
    token: string,
    hoje: Date,
): { de: string; ate: string } | null {
    let r: RegExpMatchArray | null

    // 15/03, 15/03/2025
    if ((r = token.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/))) {
        const d = Number(r[1])
        const m = Number(r[2])
        if (m < 1 || m > 12 || d < 1 || d > ultimoDia(2000, m)) return null
        let a = r[3] ? Number(r[3]) : hoje.getFullYear()
        // sem ano, uma data que ainda não chegou é a do ano passado
        if (!r[3] && new Date(a, m - 1, d) > hoje) a -= 1
        if (d > ultimoDia(a, m)) return null
        return { de: ymd(a, m, d), ate: ymd(a, m, d) }
    }
    // 03/2025
    if ((r = token.match(/^(\d{1,2})\/(\d{4})$/))) {
        const m = Number(r[1])
        return m >= 1 && m <= 12 ? mesInteiro(Number(r[2]), m) : null
    }
    // mar/26, mar/2026
    if ((r = token.match(/^([a-z]+)\/(\d{2}|\d{4})$/))) {
        const m = mesDe(r[1])
        if (!m) return null
        return mesInteiro(r[2].length === 2 ? 2000 + Number(r[2]) : Number(r[2]), m)
    }
    // março
    const m = mesDe(token)
    return m ? mesInteiro(anoDoMes(m, hoje), m) : null
}

/** "150" → faixa de 150 a 150,99; "150,50" ou "1.234,56" → o valor exato. */
function valorDoToken(token: string): BuscaTransacoes["valor"] {
    const t = token.replace(/^r\$/, "")
    if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(t)) return null
    const n = Number(t.replace(/\./g, "").replace(",", "."))
    return t.includes(",")
        ? { min: n, max: n, exato: true }
        : { min: n, max: n + 1, exato: false }
}

export function parseBuscaTransacoes(termo: string, hoje: Date): BuscaTransacoes {
    const tokens = semAcento(termo).split(/\s+/).filter(Boolean)
    const originais = termo.split(/\s+/).filter(Boolean)
    const texto: string[] = []
    let valor: BuscaTransacoes["valor"] = null
    let periodo: BuscaTransacoes["periodo"] = null

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i]
        if (t === "r$") continue

        if (!periodo) {
            // "fev 2024": o ano solto logo depois do mês é dele
            const m = mesDe(t)
            if (m && ehAno(tokens[i + 1] ?? "")) {
                periodo = mesInteiro(Number(tokens[i + 1]), m)
                i++
                continue
            }
            const p = periodoDoToken(t, hoje)
            if (p) {
                periodo = p
                continue
            }
        }
        if (!valor) {
            const v = valorDoToken(t)
            if (v) {
                valor = v
                continue
            }
        }
        texto.push(originais[i])
    }
    return { texto: texto.join(" "), valor, periodo }
}

/** Pronta para consultar: texto com 2+ caracteres, ou valor, ou período. */
export function buscaPronta(b: BuscaTransacoes): boolean {
    return b.texto.length >= 2 || b.valor !== null || b.periodo !== null
}

/** Valor no formato pt-BR que a lista lê: "150" ou "150,99". */
function ptBr(n: number): string {
    return (Number.isInteger(n) ? String(n) : n.toFixed(2)).replace(".", ",")
}

/** `/transactions?q=…&from=…&to=…&min=…&max=…` (só o que existe). */
export function verTodasHref(b: BuscaTransacoes): string {
    const p = new URLSearchParams()
    if (b.texto) p.set("q", b.texto)
    if (b.periodo) {
        p.set("from", b.periodo.de)
        p.set("to", b.periodo.ate)
    }
    if (b.valor) {
        p.set("min", ptBr(b.valor.min))
        // `max` da faixa é exclusivo; a lista lê inclusivo (150 → 150,99)
        p.set("max", ptBr(b.valor.exato ? b.valor.max : Math.round((b.valor.max - 0.01) * 100) / 100))
    }
    const qs = p.toString()
    return qs ? `${ROUTES.TRANSACTIONS}?${qs}` : ROUTES.TRANSACTIONS
}
