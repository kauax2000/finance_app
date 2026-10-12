/**
 * O teclado da tabela, puro, para o `DataTable` e para o teste.
 *
 * **Linhas** (a tabela de leitura, semântica de `table`): ↑ ↓ andam uma, Home
 * e End vão às pontas, PageUp e PageDown andam dez. **Células** (a versão
 * editável, `role="grid"`): as quatro setas, Home e End na linha, Ctrl+Home e
 * Ctrl+End na grade — o modelo de teclado do padrão de grade do W3C APG.
 * `null` é "esta tecla não é de navegação".
 */

const PAGINA = 10

export function nextRowIndex(key: string, index: number, count: number): number | null {
  if (count === 0) return null
  const ultimo = count - 1
  switch (key) {
    case "ArrowDown":
      return Math.min(index + 1, ultimo)
    case "ArrowUp":
      return Math.max(index - 1, 0)
    case "Home":
      return 0
    case "End":
      return ultimo
    case "PageDown":
      return Math.min(index + PAGINA, ultimo)
    case "PageUp":
      return Math.max(index - PAGINA, 0)
    default:
      return null
  }
}

export type GridPosition = { row: number; col: number }

export function nextCell(
  key: string,
  { row, col }: GridPosition,
  { rows, cols }: { rows: number; cols: number },
  ctrl = false
): GridPosition | null {
  if (rows === 0 || cols === 0) return null
  switch (key) {
    case "ArrowRight":
      return { row, col: Math.min(col + 1, cols - 1) }
    case "ArrowLeft":
      return { row, col: Math.max(col - 1, 0) }
    case "ArrowDown":
      return { row: Math.min(row + 1, rows - 1), col }
    case "ArrowUp":
      return { row: Math.max(row - 1, 0), col }
    case "Home":
      return ctrl ? { row: 0, col: 0 } : { row, col: 0 }
    case "End":
      return ctrl ? { row: rows - 1, col: cols - 1 } : { row, col: cols - 1 }
    case "PageDown":
      return { row: Math.min(row + PAGINA, rows - 1), col }
    case "PageUp":
      return { row: Math.max(row - PAGINA, 0), col }
    default:
      return null
  }
}
