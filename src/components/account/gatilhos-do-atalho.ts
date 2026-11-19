import type { CaptureToken } from "@/lib/supabase"

/** O que um atalho antigo mandou em `X-Atalho-Gatilho` (`siri`, `toque`…); o arquivo de hoje não manda, e o gatilho fica nulo. */
export type Gatilho = NonNullable<CaptureToken["atalho_gatilho"]>

export type Modo = "voz" | "toque"

/** O atalho é um arquivo só, o original, para a Siri e para todo jeito de tocar. */
export const NOME_DO_ATALHO = "Lançar gasto"
export const ARQUIVO_DO_ATALHO = "/atalho/Lan%C3%A7ar%20gasto.shortcut"

export function modoDoGatilho(g: CaptureToken["atalho_gatilho"]): Modo {
    return g === "siri" ? "voz" : "toque"
}

/** O nome do atalho na lista: com gatilho, o do arquivo; sem gatilho informado, o nome guardado. */
export function tituloDoAtalho(t: Pick<CaptureToken, "name" | "atalho_gatilho">): string {
    return t.atalho_gatilho == null ? t.name : NOME_DO_ATALHO
}

/** O erro do banco (o `raise` das RPCs) na frase da tela. */
export function mensagemDoErroDeToken(erro: { code?: string; message?: string }): string {
    if (erro.message?.includes("nao_membro")) return "Você não é membro dessa carteira."
    if (erro.message?.includes("nao_encontrado")) return "Este atalho não existe mais."
    if (erro.message?.includes("limite_tokens")) return "Limite de 10 atalhos. Desconecte um para criar outro."
    return "Não foi possível concluir. Tente de novo."
}
