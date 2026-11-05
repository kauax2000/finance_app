// Compara as contagens de linhas do banco antigo e do novo. Puro; também é CLI:
//   node scripts/lib/contagens.mjs antigo.json novo.json
// imprime cada diferença e sai com 1 se houver alguma.
import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

/** As tabelas cuja contagem difere ou que faltam de um lado (`-`), em ordem alfabética. */
export function compararContagens(antigo, novo) {
  const tabelas = [...new Set([...Object.keys(antigo), ...Object.keys(novo)])].sort()
  return tabelas
    .filter((t) => antigo[t] !== novo[t])
    .map((t) => `${t}: antigo=${antigo[t] ?? "-"} novo=${novo[t] ?? "-"}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, "utf8")))
  const diferencas = compararContagens(a, b)
  for (const d of diferencas) console.log(d)
  process.exit(diferencas.length ? 1 : 0)
}
