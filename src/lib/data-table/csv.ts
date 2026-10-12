/**
 * A exportação em CSV do `DataTable`, escrita para o Excel em
 * português, que é onde a pessoa abre o arquivo:
 *
 * - **`;` separa**, porque a vírgula é a casa decimal — com vírgula como
 *   separador, "128,40" viraria duas colunas;
 * - **BOM** no começo, senão o Excel lê o UTF-8 como Latin-1 e "Alimentação"
 *   sai "AlimentaÃ§Ã£o";
 * - **o número vai cru**, com a vírgula decimal e sem "R$" nem ponto de milhar
 *   — uma célula de texto "R$ 1.284,60" não soma; "-1284,6" soma.
 */

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | boolean | Date | null | undefined
}

const SEPARADOR = ";"

function celula(v: string | number | boolean | Date | null | undefined): string {
  if (v == null) return ""
  let texto: string
  if (typeof v === "number") texto = Number.isFinite(v) ? String(v).replace(".", ",") : ""
  else if (v instanceof Date) texto = v.toISOString().slice(0, 10)
  else texto = String(v)
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const linhas = [
    columns.map((c) => celula(c.header)).join(SEPARADOR),
    ...rows.map((r) => columns.map((c) => celula(c.value(r))).join(SEPARADOR)),
  ]
  return `﻿${linhas.join("\r\n")}`
}

/** Baixa o texto como arquivo. Só no navegador. */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
