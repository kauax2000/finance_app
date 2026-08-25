#!/usr/bin/env node
/**
 * Gera `src/app/designsystem/docs-map.ts` a partir dos arquivos em `docs/`.
 *
 * O mapa é estático de propósito. Um `import()` com template literal também
 * funcionaria, mas aí um slug sem documento só falharia em produção, na hora em
 * que alguém abrisse a página. Assim o TypeScript reclama no build.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const docsDir = join(root, "src/app/designsystem/docs")
const slugs = readdirSync(docsDir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort()

const ident = (slug) =>
  slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase()) + "Doc"

/**
 * Índice de busca: o texto que cada página realmente ensina.
 *
 * A busca da casca só casava contra nome, slug e descrição do registry — então
 * "excluir", "confirmar", "contraste" e "tabular" devolviam zero resultados,
 * embora as páginas falem exatamente disso. Num catálogo de 87 itens, buscar é
 * a forma de navegar; quem não acha escreve o componente à mão.
 *
 * O índice sai do próprio fonte das páginas (o texto do `<Usage>` mais os
 * títulos de seção e de nota), então ele não envelhece separado do conteúdo.
 */
function extrairTextoDeBusca(src) {
  const pedacos = []

  const usage = src.match(/<Usage>([\s\S]*?)<\/Usage>/)
  if (usage) pedacos.push(usage[1])

  // O corpo dos `DocNote` carrega boa parte do que a página ensina — o porquê
  // de um token, a armadilha que já custou caro. Sem eles, buscar "contraste"
  // não achava a página de Cores.
  for (const m of src.matchAll(/<DocNote[^>]*>([\s\S]*?)<\/DocNote>/g)) {
    pedacos.push(m[1])
  }

  // Títulos de DocSection, DocNote, Group e Spec
  for (const m of src.matchAll(/\btitle="([^"]+)"/g)) pedacos.push(m[1])
  for (const m of src.matchAll(/\bdescription="([^"]+)"/g)) pedacos.push(m[1])

  const prosa = pedacos
    .join(" ")
    // fora tags, expressões JSX e entidades
    .replace(/<[^>]*>/g, " ")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()

  return [prosa, ...nomesDeToken(src, prosa)].join(" ").trim()
}

/**
 * Os nomes que a página **lista** em vez de narrar.
 *
 * A prosa acima cobre o que a página argumenta, mas as escalas moram em arrays
 * — `["rounded-2xl", "1,8 × raio", "folha, diálogo"]` — e nada disso entrava no
 * índice. Medido antes desta função: `raio` e `sombra` achavam a página de
 * Forma e elevação; `rounded-2xl` e `shadow-md` devolviam zero. E nome de
 * classe é a primeira coisa que se digita.
 *
 * Uma string sem espaço e com hífen é um nome; com espaço é `className` de
 * layout, que só faria a busca casar com tudo. Os blocos `code={}` ficam de
 * fora por tamanho: são 122, e dobrariam um índice que já tem 67 KB e viaja
 * para o cliente.
 */
function nomesDeToken(src, prosa) {
  const vistos = new Set()
  const jaNaProsa = prosa.toLowerCase()

  for (const m of src.matchAll(/"([^"\s]+)"/g)) {
    const valor = m[1]
    const ehNome =
      valor.length <= 40 &&
      (valor.startsWith("--") || /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(valor))
    if (!ehNome) continue
    if (jaNaProsa.includes(valor.toLowerCase())) continue
    vistos.add(valor)
  }

  return [...vistos]
}

const indice = slugs.map((s) => {
  const src = readFileSync(join(docsDir, `${s}.tsx`), "utf-8")
  return [s, extrairTextoDeBusca(src)]
})

writeFileSync(
  join(root, "src/app/designsystem/search-index.ts"),
  `// GERADO POR scripts/generate-ds-docs-map.mjs — não edite à mão.
// O texto que cada página ensina, para a busca da casca alcançar o conteúdo e
// não só o nome do componente.
export const SEARCH_INDEX: Record<string, string> = {
${indice.map(([s, t]) => `  ${JSON.stringify(s)}: ${JSON.stringify(t)},`).join("\n")}
}
`
)

const out = `// GERADO POR scripts/generate-ds-docs-map.mjs — não edite à mão.
// Rode \`npm run ds:docs-map\` depois de adicionar ou remover uma página.
import type { ComponentType } from "react"

${slugs.map((s) => `import ${ident(s)} from "./docs/${s}"`).join("\n")}

export const DOCS: Record<string, ComponentType> = {
${slugs.map((s) => `  "${s}": ${ident(s)},`).join("\n")}
}
`

writeFileSync(join(root, "src/app/designsystem/docs-map.ts"), out)
console.log(`docs-map.ts + search-index.ts: ${slugs.length} páginas`)
