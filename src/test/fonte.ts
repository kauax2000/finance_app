/**
 * Ler o repositório como texto, para os testes que trancam o design system
 * pelo fonte: o `.tsx` de um componente, o `globals.css`, as telas.
 *
 * Cada teste escrevia a própria leitura, o próprio corte de comentário e a
 * própria fatia do CSS. Elas moram aqui, e cada uma faz exatamente o que as
 * cópias faziam — inclusive onde as cópias divergiam entre si (os cortes de
 * comentário abaixo).
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"

/** O texto de um arquivo, pelo caminho a partir da raiz do repositório (ou absoluto). */
export function lerFonte(caminho: string): string {
  return readFileSync(resolve(process.cwd(), caminho), "utf8")
}

/** Todo `.tsx` debaixo de `dir`, recursivo, pulando as pastas cujo nome está em `foraDe`. */
export function arquivosTsx(dir: string, foraDe: readonly string[] = []): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return foraDe.includes(nome) ? [] : arquivosTsx(caminho, foraDe)
    return nome.endsWith(".tsx") ? [caminho] : []
  })
}

/**
 * Os cortes de comentário. A prosa dos arquivos cita de propósito o que eles
 * deixaram de fazer, e uma asserção de ausência que lê comentário se acusaria
 * sozinha. **Eles não são intercambiáveis**: cada teste escolheu o seu, e
 * trocar um pelo outro muda o que ele lê.
 *
 * - `tudo`: tira `/* … *\/` e todo `// …` até o fim da linha — inclusive o
 *   `//` de uma URL dentro de uma string.
 * - `linha-inteira`: tira `/* … *\/` e só a linha que é inteira um `// …`; o
 *   `//` depois de código fica.
 * - `fora-de-url`: troca `/* … *\/` por um espaço e tira o `// …` que não vem
 *   logo depois de `:` — o `https://` fica.
 * - `numa-passada`: uma regex só para os dois, trocando cada comentário por um
 *   espaço; um `/*` dentro de um `// …` não abre bloco.
 * - `bloco`: troca só `/* … *\/` por um espaço — o corte do CSS.
 */
export type CorteDeComentario = "tudo" | "linha-inteira" | "fora-de-url" | "numa-passada" | "bloco"

const BLOCO = /\/\*[\s\S]*?\*\//g

export function semComentarios(texto: string, corte: CorteDeComentario = "tudo"): string {
  switch (corte) {
    case "tudo":
      return texto.replace(BLOCO, "").replace(/\/\/.*$/gm, "")
    case "linha-inteira":
      return texto.replace(BLOCO, "").replace(/^\s*\/\/.*$/gm, "")
    case "fora-de-url":
      return texto.replace(BLOCO, " ").replace(/(^|[^:])\/\/.*$/gm, "$1")
    case "numa-passada":
      return texto.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, " ")
    case "bloco":
      return texto.replace(BLOCO, " ")
  }
}

/**
 * O trecho do CSS que começa em `abre` e para antes do primeiro `fecha` depois
 * dele. O padrão, `"\n}\n"`, é a chave que fecha um bloco de topo — uma
 * `@utility`, um tema.
 */
export function blocoCss(css: string, abre: string, fecha = "\n}\n"): string {
  const i = css.indexOf(abre)
  return css.slice(i, css.indexOf(fecha, i + 1))
}
