import type { SidebarTogglePlacement } from "@/components/ui/sidebar"

/**
 * A versão do botão de recolher em avaliação no `/laboratorio/barra`. Cada
 * quadro do laboratório é um iframe com `name="barra:<versão>"`, e o
 * `window.name` sobrevive à navegação dentro do quadro. Fora do laboratório o
 * nome é vazio e vale a de hoje (`topbar`). Temporário: sai quando uma versão
 * vencer.
 */
export const SIDEBAR_LAB_VERSIONS = [
    "edge",
    "footer",
    "footerBar",
] as const satisfies readonly SidebarTogglePlacement[]

export function sidebarLabVersion(nome: string): SidebarTogglePlacement {
    const versao = nome.startsWith("barra:") ? nome.slice("barra:".length) : ""
    return (SIDEBAR_LAB_VERSIONS as readonly string[]).includes(versao)
        ? (versao as SidebarTogglePlacement)
        : "edge"
}
