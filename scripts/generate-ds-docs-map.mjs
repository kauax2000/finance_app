#!/usr/bin/env node
/**
 * Gera `src/app/designsystem/docs-map.ts` a partir dos arquivos em `docs/`.
 *
 * O mapa é estático de propósito. Um `import()` com template literal também
 * funcionaria, mas aí um documento removido só falharia em produção, na hora em
 * que alguém abrisse a página. Com o import estático, um arquivo de `docs/`
 * apagado sem regenerar o mapa quebra o `tsc` no build. Quem confere que toda
 * entrada do registry tem página é o `doc-pages.test.ts`; um slug que falte no
 * mapa cai no `notFound()` da rota `[slug]`.
 */
import { readdirSync, writeFileSync } from "node:fs"
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

const out = `// GERADO POR scripts/generate-ds-docs-map.mjs — não edite à mão.
// Rode \`npm run ds:docs-map\` depois de adicionar ou remover uma página.
import type { ComponentType } from "react"

${slugs.map((s) => `import ${ident(s)} from "./docs/${s}"`).join("\n")}

export const DOCS: Record<string, ComponentType> = {
${slugs.map((s) => `  "${s}": ${ident(s)},`).join("\n")}
}
`

writeFileSync(join(root, "src/app/designsystem/docs-map.ts"), out)
console.log(`docs-map.ts: ${slugs.length} páginas`)
