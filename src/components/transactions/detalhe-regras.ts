import { ROTULO_DA_ORIGEM } from "@/lib/piloto/piloto"
import type { Transaction } from "@/lib/supabase"
import { formatMonthShortPtBr } from "@/lib/transaction-date"

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

/** "Kauã lançou pelo app", "Kauã lançou pela Planilha": a nota de origem com quem lançou. */
export function notaComAutor(source: Transaction["source"], autor: string): string {
    const origem = ROTULO_DA_ORIGEM[source] ?? "app"
    return `${autor} lançou ${FEMININAS.has(source) ? "pela" : "pelo"} ${origem}`
}

const RECORRENCIA: Record<"daily" | "weekly" | "monthly", string> = {
    daily: "Todo dia",
    weekly: "Toda semana",
    monthly: "Todo mês",
}

export function rotuloDaRecorrencia(intervalo: Transaction["recurring_interval"]): string {
    return intervalo ? RECORRENCIA[intervalo] : "Recorrente"
}

const hora = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

/** "hoje", "ontem", "11 nov" ou "11 nov 2025": o dia de um instante no fuso local. */
function diaDoInstante(d: Date, agora: Date): string {
    const zero = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
    const dias = Math.round((zero(agora) - zero(d)) / 86_400_000)
    if (dias === 0) return "hoje"
    if (dias === 1) return "ontem"
    const dia = `${d.getDate()} ${formatMonthShortPtBr(d)}`
    return d.getFullYear() === agora.getFullYear() ? dia : `${dia} ${d.getFullYear()}`
}

/** O rodapé do detalhe: quando o lançamento entrou ("11 nov, 14:32", "hoje, 09:10"). */
export function momentoDoRegistro(iso: string, agora: Date = new Date()): string | null {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return `${diaDoInstante(d, agora)}, ${hora(d)}`
}

/** "Editado hoje às 09:10", só quando a última mudança veio mais de um minuto depois de criar. */
export function linhaDaEdicao(criado: string, editado: string | null | undefined, agora: Date = new Date()): string | null {
    if (!editado) return null
    const c = new Date(criado)
    const e = new Date(editado)
    if (Number.isNaN(c.getTime()) || Number.isNaN(e.getTime()) || e.getTime() - c.getTime() < 60_000) return null
    const dia = diaDoInstante(e, agora)
    return `Editado ${dia === "hoje" || dia === "ontem" ? dia : `em ${dia}`} às ${hora(e)}`
}
