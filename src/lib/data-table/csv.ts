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
  // Anexada e revogada um minuto depois: o Safari do iOS cancela o download de um
  // link solto e o de uma URL revogada na hora (o mesmo de `lib/cofre/baixar.ts`).
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

type SaveFilePicker = (opts: {
  suggestedName: string
  types: { description: string; accept: Record<string, string[]> }[]
}) => Promise<FileSystemFileHandle>

/**
 * O destino do CSV, pedido no clique (o seletor exige um gesto recente): o "Salvar como"
 * do navegador quando ele existe (Chrome, Edge), e `"download"` quando não existe
 * (Safari, Firefox), para o link de download de sempre. `null` é a pessoa que cancelou.
 */
export async function pedirDestinoDoCsv(filename: string): Promise<FileSystemFileHandle | "download" | null> {
  const picker = (globalThis as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker
  if (!picker) return "download"
  try {
    return await picker({
      suggestedName: filename.endsWith(".csv") ? filename : `${filename}.csv`,
      types: [{ description: "Planilha CSV", accept: { "text/csv": [".csv"] } }],
    })
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") return null
    return "download"
  }
}

/** Grava o CSV no destino; resolve só quando o arquivo está salvo (ou o download começou). */
export async function salvarCsv(destino: FileSystemFileHandle | "download", filename: string, csv: string) {
  if (destino === "download") return downloadCsv(filename, csv)
  try {
    const escrita = await destino.createWritable()
    await escrita.write(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    await escrita.close()
  } catch (e) {
    // Há navegador que oferece o seletor e recusa a escrita (o painel do app, em Electron):
    // o download de sempre assume, e o arquivo sai do mesmo jeito.
    console.error("Falha ao gravar no destino escolhido; baixando pelo link.", e)
    downloadCsv(filename, csv)
  }
}
