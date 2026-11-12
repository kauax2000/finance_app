/**
 * As setas do seletor com busca (`FormPickerPopover`): para onde vai o foco.
 * `atual` é o índice da linha em foco, ou -1 quando o foco está na busca (ou fora
 * das linhas). Devolve o índice da linha seguinte, ou -1 para voltar à busca, ou
 * `null` quando a tecla não é de navegação.
 */
export function proximaLinhaDoSeletor(atual: number, total: number, tecla: string): number | null {
    if (total <= 0) return tecla === "ArrowUp" || tecla === "ArrowDown" ? -1 : null
    switch (tecla) {
        case "ArrowDown":
            return atual < 0 ? 0 : Math.min(atual + 1, total - 1)
        case "ArrowUp":
            // Da primeira linha, a seta para cima volta à busca.
            return atual <= 0 ? -1 : atual - 1
        case "Home":
            return atual < 0 ? null : 0
        case "End":
            return atual < 0 ? null : total - 1
        default:
            return null
    }
}
