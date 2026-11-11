import { ROTULO_DA_ORIGEM } from "@/lib/piloto/piloto"
import type { Transaction } from "@/lib/supabase"

/** As regras puras do detalhe (spec §8), fora do componente para o teste em node. */

export type VizinhosDoDetalhe = { anterior?: Transaction | null; seguinte?: Transaction | null }

/** As setas só andam fora da edição e quando há vizinho na página (a linha que saiu da lista não tem). */
export function podeNavegar(
    vizinhos: VizinhosDoDetalhe | null | undefined,
    editando: boolean,
): { anterior: boolean; seguinte: boolean } {
    if (editando || !vizinhos) return { anterior: false, seguinte: false }
    return { anterior: Boolean(vizinhos.anterior), seguinte: Boolean(vizinhos.seguinte) }
}

/** ↑/K vão à anterior, ↓/J à seguinte; o resto não é das setas. */
export function direcaoDaTecla(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">): "anterior" | "seguinte" | null {
    if (e.metaKey || e.ctrlKey || e.altKey) return null
    if (e.key === "ArrowUp" || e.key === "k" || e.key === "K") return "anterior"
    if (e.key === "ArrowDown" || e.key === "j" || e.key === "J") return "seguinte"
    return null
}

type Alvo = { tagName?: string; isContentEditable?: boolean; closest?: (s: string) => unknown } | null

/** O alvo é campo de texto: lá a seta move o cursor (duck typing, sem `instanceof`). */
export function ehCampoDeTexto(evento: EventTarget | Alvo | null): boolean {
    const alvo = evento as Alvo
    if (!alvo) return false
    const tag = alvo.tagName?.toLowerCase()
    if (tag === "input" || tag === "textarea" || tag === "select") return true
    if (alvo.isContentEditable) return true
    return Boolean(alvo.closest?.('[contenteditable]:not([contenteditable="false"])'))
}

const FEMININAS = new Set(["quick_text", "import_pdf", "import_sheet", "recurring"])

/** A nota no fim do detalhe: "Lançado pelo app", "Lançado pela Planilha". */
export function notaDaOrigem(source: Transaction["source"]): string {
    const origem = ROTULO_DA_ORIGEM[source]
    if (!origem) return "Lançado pelo app"
    return `Lançado ${FEMININAS.has(source) ? "pela" : "pelo"} ${origem}`
}

/** "Kauã lançou e pagou", "Renata pagou · Kauã lançou"; sem quem pagou, só quem lançou. */
export function linhaDeQuem(autor: string | null, pagou: string | null, mesmaPessoa: boolean): string | null {
    if (!autor) return pagou ? `${pagou} pagou` : null
    if (!pagou) return `${autor} lançou`
    return mesmaPessoa ? `${autor} lançou e pagou` : `${pagou} pagou · ${autor} lançou`
}

const RECORRENCIA: Record<"daily" | "weekly" | "monthly", string> = {
    daily: "Todo dia",
    weekly: "Toda semana",
    monthly: "Todo mês",
}

export function rotuloDaRecorrencia(intervalo: Transaction["recurring_interval"]): string {
    return intervalo ? RECORRENCIA[intervalo] : "Recorrente"
}
