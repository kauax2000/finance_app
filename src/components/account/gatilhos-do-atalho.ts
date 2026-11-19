import type { CaptureToken } from "@/lib/supabase"

/** O que o atalho mandou em `X-Atalho-Gatilho`: o de voz manda `siri`, o de toque manda `toque` (os outros são de arquivos antigos). */
export type Gatilho = NonNullable<CaptureToken["atalho_gatilho"]>

/** Dois arquivos assinados em `public/atalho/`: um para a Siri, outro para todo jeito de tocar. */
export type Modo = "voz" | "toque"

export const MODOS_DO_ATALHO: { valor: Modo; rotulo: string; descricao: string; arquivo: string; nome: string }[] = [
    {
        valor: "voz",
        rotulo: "Voz",
        descricao: "A Siri pergunta o gasto e responde falando.",
        arquivo: "/atalho/Lan%C3%A7ar%20gasto.shortcut",
        nome: "Lançar gasto",
    },
    {
        valor: "toque",
        rotulo: "Toque",
        descricao: "Um toque abre o atalho e você digita o gasto.",
        arquivo: "/atalho/Lan%C3%A7ar%20gasto%20r%C3%A1pido.shortcut",
        nome: "Lançar gasto rápido",
    },
]

export function modoDoGatilho(g: CaptureToken["atalho_gatilho"]): Modo {
    return g === "siri" ? "voz" : "toque"
}

/** O rótulo na lista de aparelhos; nulo = o atalho nunca informou. */
export function rotuloDoGatilho(g: CaptureToken["atalho_gatilho"]): string | null {
    if (g == null) return null
    return g === "siri" ? "Siri" : "Toque"
}
