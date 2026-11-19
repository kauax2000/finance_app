import type { CaptureToken } from "@/lib/supabase"

/** Como a pessoa abre o atalho: cada gatilho tem o próprio arquivo assinado em `public/atalho/<gatilho>/`. */
export type Gatilho = NonNullable<CaptureToken["atalho_gatilho"]>

export const GATILHOS: { valor: Gatilho; rotulo: string; descricao: string }[] = [
    { valor: "siri", rotulo: "Siri", descricao: "Fale o gasto, sem tocar no iPhone" },
    { valor: "acao", rotulo: "Botão de Ação", descricao: "Aperte o botão da lateral" },
    { valor: "toque", rotulo: "Toque atrás", descricao: "Três toques nas costas do iPhone" },
    { valor: "bloqueio", rotulo: "Tela bloqueada", descricao: "Um botão na Tela Bloqueada" },
    { valor: "inicio", rotulo: "Ícone", descricao: "Um ícone na Tela de Início" },
]

/** Todo arquivo importa com o nome "Lançar gasto"; muda só a pasta do gatilho. */
export function arquivoDoAtalho(g: Gatilho): string {
    return `/atalho/${g}/Lan%C3%A7ar%20gasto.shortcut`
}
