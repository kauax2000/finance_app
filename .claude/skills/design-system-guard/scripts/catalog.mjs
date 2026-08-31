#!/usr/bin/env node
/**
 * catalog.mjs — inventário do design system do Finance App.
 *
 * Responde a uma pergunta só, sem opinião: o que existe hoje em
 * `src/components/ui/` e em `src/app/globals.css`?
 *
 * Tudo é lido em tempo de execução. Não há uma segunda cópia da verdade aqui
 * para divergir: se alguém adicionar um token ou uma variant, o catálogo
 * acompanha sozinho.
 *
 * Uso:
 *   node catalog.mjs                    # markdown
 *   node catalog.mjs --json             # para consumo por script
 *   node catalog.mjs --project /caminho # aponta o projeto explicitamente
 */

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Remove comentários // e block sem estragar o conteúdo de strings. */
function stripComments(src) {
  let out = ""
  let quote = null
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    const n = src[i + 1]
    if (quote) {
      out += c
      if (c === "\\") {
        out += n ?? ""
        i++
      } else if (c === quote) {
        quote = null
      }
      continue
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c
      out += c
      continue
    }
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i++
      out += "\n"
      continue
    }
    if (c === "/" && n === "*") {
      i += 2
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") out += "\n"
        i++
      }
      i++
      continue
    }
    out += c
  }
  return out
}

/** Dado o índice de um `{`, devolve o índice do `}` que o fecha. */
function matchBrace(src, openIdx) {
  let depth = 0
  let quote = null
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === "\\") i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c
      continue
    }
    if (c === "{") depth++
    else if (c === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/**
 * Extrai os grupos de variant de um `cva(...)`.
 *
 * Lê as chaves do objeto `variants` com contagem de chaves balanceadas, e não
 * por regex de linha: as classes de um variant do Tailwind v4 têm `[`, `{` e
 * aspas dentro, e qualquer regex ingênua para no lugar errado.
 */
function extractVariants(src) {
  const clean = stripComments(src)
  const out = {}
  const variantsIdx = clean.indexOf("variants:")
  if (variantsIdx === -1) return out
  const openIdx = clean.indexOf("{", variantsIdx)
  if (openIdx === -1) return out
  const closeIdx = matchBrace(clean, openIdx)
  if (closeIdx === -1) return out
  const body = clean.slice(openIdx + 1, closeIdx)

  let i = 0
  while (i < body.length) {
    const m = /(\w+)\s*:\s*\{/g
    m.lastIndex = i
    const found = m.exec(body)
    if (!found) break
    const groupName = found[1]
    const groupOpen = found.index + found[0].length - 1
    const groupClose = matchBrace(body, groupOpen)
    if (groupClose === -1) break
    const groupBody = body.slice(groupOpen + 1, groupClose)
    const keys = []
    // Uma chave é `nome:` ou `"nome":` no primeiro nível deste objeto. As entre
    // aspas importam: os tamanhos de ícone do Button são `"icon-sm"` e afins, e
    // uma varredura que descarta o conteúdo das aspas os perde silenciosamente.
    let depth = 0
    let quote = null
    let token = ""
    for (let j = 0; j < groupBody.length; j++) {
      const c = groupBody[j]
      if (quote) {
        if (c === "\\") {
          j++
        } else if (c === quote) {
          quote = null
        } else if (depth === 0) {
          token += c
        }
        continue
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c
        if (depth === 0) token = ""
        continue
      }
      if (c === "{" || c === "[" || c === "(") depth++
      else if (c === "}" || c === "]" || c === ")") depth--
      else if (depth === 0 && c === ":") {
        const key = token.trim()
        if (/^[\w-]+$/.test(key)) keys.push(key)
        token = ""
      } else if (depth === 0 && c === ",") token = ""
      else if (depth === 0) token += c
    }
    out[groupName] = keys
    i = groupClose + 1
  }
  return out
}

/** Os nomes exportados por um arquivo de componente. */
function extractExports(src) {
  const clean = stripComments(src)
  const names = new Set()
  const blockMatch = clean.match(/export\s*\{([^}]*)\}/)
  if (blockMatch) {
    for (const raw of blockMatch[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/).pop()?.trim()
      if (name && !name.startsWith("type ")) names.add(name)
    }
  }
  for (const m of clean.matchAll(
    /export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g
  )) {
    names.add(m[1])
  }
  return [...names].sort()
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

/**
 * Lê os tokens do globals.css. Separa o que vale nos dois temas do que só é
 * declarado em `.dark`, porque um token sem par no escuro é um bug esperando.
 */
function readTokens(cssPath) {
  const css = readFileSync(cssPath, "utf8")

  /**
   * Acha o bloco de um seletor. Precisa do `{` colado ao seletor, no começo de
   * uma linha: um `indexOf(".dark")` casa primeiro com o `.dark` que aparece
   * dentro de `@custom-variant dark (&:is(.dark *))`, no topo do arquivo, e daí
   * em diante lê o bloco errado inteiro sem reclamar de nada.
   */
  const blockAt = (selector) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // O seletor precisa começar uma linha, e pode fazer parte de uma lista
    // (`:root,\n.light {`). Sem a âncora, um `indexOf(".dark")` casa primeiro com
    // o `.dark` dentro de `@custom-variant dark (&:is(.dark *))`, no topo do
    // arquivo, e daí em diante lê o bloco errado inteiro sem reclamar de nada.
    const re = new RegExp(`^${escaped}\\s*(?:,[^{]*)?\\{`, "m")
    const found = re.exec(css)
    if (!found) return ""
    const open = css.indexOf("{", found.index)
    const close = matchBrace(css, open)
    return close === -1 ? "" : css.slice(open + 1, close)
  }

  const parse = (block) => {
    const out = {}
    for (const m of block.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)) {
      out[m[1]] = m[2].trim().replace(/\s+/g, " ")
    }
    return out
  }

  const root = parse(blockAt(":root"))
  const dark = parse(blockAt(".dark"))
  const theme = parse(blockAt("@theme inline"))

  const group = (predicate) =>
    Object.fromEntries(Object.entries(root).filter(([k]) => predicate(k)))

  return {
    root,
    dark,
    theme,
    grupos: {
      superficie: group(
        (k) =>
          /^--(background|foreground|card|popover|muted|accent|secondary|primary|border|input|ring|skeleton|overlay)/.test(
            k
          ) && !k.includes("sidebar")
      ),
      status: group((k) =>
        /^--(success|warning|info|destructive)/.test(k)
      ),
      dinheiro: group((k) => /^--(income|expense)/.test(k)),
      grafico: group((k) => /^--chart-/.test(k)),
      identidade: group((k) => /^--identity-/.test(k)),
      sidebar: group((k) => /^--sidebar/.test(k)),
      camada: group((k) => /^--z-/.test(k)),
      movimento: group((k) => /^--(duration|ease)-/.test(k)),
      forma: group((k) => /^--(radius|shadow)/.test(k)),
      mobile: group((k) => /^--mobile-/.test(k)),
    },
    texto: Object.fromEntries(
      Object.entries(theme).filter(([k]) => /^--text-/.test(k))
    ),
    semPar: Object.keys(dark).filter((k) => !(k in root)),
    soNoClaro: Object.keys(root).filter(
      (k) =>
        !(k in dark) &&
        !/^--(radius|z-|duration|ease|mobile-|text-)/.test(k) &&
        !k.endsWith("-surface")
    ),
  }
}

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

function readComponents(uiDir) {
  if (!existsSync(uiDir)) return []
  return readdirSync(uiDir)
    .filter((f) => f.endsWith(".tsx"))
    .sort()
    .map((file) => {
      const src = readFileSync(join(uiDir, file), "utf8")
      return {
        arquivo: `src/components/ui/${file}`,
        nome: file.replace(/\.tsx$/, ""),
        exports: extractExports(src),
        variants: extractVariants(src),
        primitivo: src.includes('from "radix-ui"')
          ? "radix-ui"
          : src.includes("@base-ui")
            ? "base-ui"
            : src.includes("cmdk")
              ? "cmdk"
              : src.includes("vaul")
                ? "vaul"
                : src.includes("recharts")
                  ? "recharts"
                  : "autoral",
      }
    })
}

/**
 * A camada de casca do app. Ela não está em `components/ui/`, e de propósito:
 * é a navegação e o layout deste produto, não peças reutilizáveis. Aparece no
 * catálogo para ninguém reescrever um user-menu que já existe.
 */
function readChrome(layoutDir) {
  if (!existsSync(layoutDir)) return []
  return readdirSync(layoutDir)
    .filter((f) => f.endsWith(".tsx"))
    .sort()
    .map((f) => `src/components/layout/${f}`)
}

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

function renderMarkdown({ componentes, chrome, tokens, docs }) {
  const L = []
  L.push("# Catálogo do design system — Finance App", "")
  L.push(
    `**${componentes.length} componentes** em \`src/components/ui/\` · ` +
      `**${docs.length} páginas** em \`/designsystem\` · ` +
      `**${Object.keys(tokens.root).length} tokens** em \`:root\``,
    ""
  )

  L.push("## Componentes", "")
  L.push("| Componente | Primitivo | Variants | Exports |")
  L.push("| --- | --- | --- | --- |")
  for (const c of componentes) {
    const variants = Object.entries(c.variants)
      .map(([g, keys]) => `${g}: ${keys.join(" \\| ")}`)
      .join("<br>")
    L.push(
      `| \`${c.nome}\` | ${c.primitivo} | ${variants || "—"} | ${c.exports.slice(0, 6).join(", ")}${c.exports.length > 6 ? ` +${c.exports.length - 6}` : ""} |`
    )
  }
  L.push("")

  L.push("## Tokens", "")
  for (const [grupo, valores] of Object.entries(tokens.grupos)) {
    const chaves = Object.keys(valores)
    if (!chaves.length) continue
    L.push(`### ${grupo}`, "")
    for (const k of chaves) L.push(`- \`${k}\`: \`${valores[k]}\``)
    L.push("")
  }

  if (Object.keys(tokens.texto).length) {
    L.push("### escala de texto (@theme inline)", "")
    for (const [k, v] of Object.entries(tokens.texto)) L.push(`- \`${k}\`: \`${v}\``)
    L.push("")
  }

  if (tokens.soNoClaro.length) {
    L.push("### ⚠️ declarados em `:root` e ausentes em `.dark`", "")
    L.push(tokens.soNoClaro.map((k) => `\`${k}\``).join(", "), "")
  }
  if (tokens.semPar.length) {
    L.push("### ⚠️ declarados em `.dark` e ausentes em `:root`", "")
    L.push(tokens.semPar.map((k) => `\`${k}\``).join(", "), "")
  }

  L.push("## Casca do app (não é `components/ui/`)", "")
  L.push(
    "Navegação e layout deste produto. Não reescreva: componha.",
    ""
  )
  L.push(chrome.map((f) => `\`${f.split("/").pop()}\``).join(", "), "")

  return L.join("\n")
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const projectIdx = args.indexOf("--project")
  const here = dirname(fileURLToPath(import.meta.url))
  const project =
    projectIdx !== -1
      ? resolve(args[projectIdx + 1])
      : existsSync(join(process.cwd(), "src/components/ui"))
        ? process.cwd()
        : resolve(here, "../../../..")

  const uiDir = join(project, "src/components/ui")
  const cssPath = join(project, "src/app/globals.css")
  const docsDir = join(project, "src/app/designsystem/docs")

  if (!existsSync(uiDir) || !existsSync(cssPath)) {
    console.error(
      `Não achei o design system em ${project}.\n` +
        `Rode a partir da raiz do projeto, ou passe --project <caminho>.`
    )
    process.exit(1)
  }

  const payload = {
    componentes: readComponents(uiDir),
    chrome: readChrome(join(project, "src/components/layout")),
    tokens: readTokens(cssPath),
    docs: existsSync(docsDir)
      ? readdirSync(docsDir).filter((f) => f.endsWith(".tsx"))
      : [],
  }

  if (args.includes("--json")) {
    console.log(JSON.stringify(payload, null, 2))
  } else {
    console.log(renderMarkdown(payload))
  }
}

main()
