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

/** O nome do atalho na lista: o da Siri e o de toque são os dos arquivos; sem gatilho informado, o nome guardado. */
export function tituloDoAtalho(t: Pick<CaptureToken, "name" | "atalho_gatilho">): string {
    if (t.atalho_gatilho == null) return t.name
    return MODOS_DO_ATALHO.find((m) => m.valor === modoDoGatilho(t.atalho_gatilho))!.nome
}

/**
 * O atalho que o novo desconecta: um de cada modo. O de `substituir` (Baixar de novo) sai se for do modo escolhido ou
 * antigo, sem gatilho; trocado o modo, sai o ativo do novo modo, e o de `substituir` fica. Sem gatilho, um ativo nunca é o alvo.
 */
export function alvoDaTroca(modo: Modo, substituir: CaptureToken | undefined, atalhos: CaptureToken[]): CaptureToken | undefined {
    if (substituir && (substituir.atalho_gatilho == null || modoDoGatilho(substituir.atalho_gatilho) === modo)) return substituir
    return atalhos.find((t) => t.atalho_gatilho != null && modoDoGatilho(t.atalho_gatilho) === modo)
}

/** O erro do banco (o `raise` das RPCs) na frase da tela. */
export function mensagemDoErroDeToken(erro: { code?: string; message?: string }): string {
    if (erro.message?.includes("nao_membro")) return "Você não é membro dessa carteira."
    if (erro.message?.includes("nao_encontrado")) return "Este atalho não existe mais."
    if (erro.message?.includes("limite_tokens")) return "Limite de 10 atalhos. Desconecte um para criar outro."
    return "Não foi possível concluir. Tente de novo."
}
