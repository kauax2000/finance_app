import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * O primário é o **Button Colorful** da Kokonut UI (rodadas 149 a 151): a
 * tecla preta (branca no escuro) chapada em repouso, com um degradê borrado de
 * cinco paradas da marca florescendo do centro no cursor. Ele foi tecla da rodada 78 à 97,
 * lava e brilho da 98 à 147 e cru na 148; cada asserção aqui tranca ou um
 * pedaço do desenho novo, ou um pedaço dos antigos que não pode voltar.
 */

const RAIZ = resolve(process.cwd(), "src")
const CSS = readFileSync(join(RAIZ, "app/globals.css"), "utf8")
const PRIMARIO = buttonVariants({ variant: "primary" }).split(/\s+/)

function bloco(inicio: string) {
  const i = CSS.indexOf(inicio)
  expect(i, `bloco ${inicio} não achado`).toBeGreaterThan(-1)
  return CSS.slice(i, CSS.indexOf("\n}\n", i))
}
const CLARO = bloco(":root,\n.light {")
const ESCURO = bloco("\n.dark {")

/** A claridade de um `oklch(L …)` — ou de um número puro — declarado no bloco. */
function claridade(blocoCss: string, token: string) {
  const m = blocoCss.match(new RegExp(`\\n\\s*${token}:\\s*(?:oklch\\()?([\\d.]+)`))
  expect(m, `${token} sem valor`).not.toBeNull()
  return Number(m![1])
}

function arquivosTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivosTsx(caminho)
    return caminho.endsWith(".tsx") ? [caminho] : []
  })
}

describe("o primário é o colorido", () => {
  it("1. em repouso é a tecla chapada; no cursor, no toque e no menu aberto as cores florescem", () => {
    expect(PRIMARIO).toContain("bg-primary")
    expect(PRIMARIO).toContain("button-colorful")
    for (const c of ["hover:[--button-bloom:1]", "active:[--button-bloom:1]", "aria-expanded:[--button-bloom:1]"]) {
      expect(PRIMARIO, c).toContain(c)
    }
    // O fundo não troca — quem responde ao cursor é a camada. E a camada nunca
    // vem por classe `before:`/`after:` na variante: mora na utility.
    expect(PRIMARIO.filter((c) => /^(hover|active):bg-/.test(c))).toStrictEqual([])
    expect(PRIMARIO.filter((c) => /(^|:)(before|after):/.test(c))).toStrictEqual([])
    expect(PRIMARIO.join(" ")).not.toMatch(/bg-primary\/\d/)
  })

  it("1a. a utility: a camada é o `::after`, cinco paradas da marca, e um número só anima tudo", () => {
    const i = CSS.indexOf("@utility button-colorful {")
    expect(i).toBeGreaterThan(-1)
    const util = CSS.slice(i, CSS.indexOf("\n}\n", i))
    for (const c of ["isolation: isolate", "overflow: hidden", "&::after", "z-index: -10"]) {
      expect(util, c).toContain(c)
    }
    // Cinco paradas do arco-íris da marca (rodada 150); o roxo de três
    // paradas da referência lia como template, não como a nossa marca.
    for (const t of ["--brand-teal", "--brand-blue", "--brand-violet", "--brand-magenta", "--brand-coral"]) {
      expect(util, t).toContain(`var(${t})`)
    }
    // Escala, borrão e opacidade derivam da mesma variável, e em repouso (0)
    // a camada está apagada.
    expect(util).toMatch(/opacity: calc\(var\(--button-bloom\) \* var\(--button-colorful-opacity\)\)/)
    expect(util).toMatch(/scale: calc\([^;]*var\(--button-bloom\)/)
    expect(util).toMatch(/filter: blur\(calc\([^;]*var\(--button-bloom\)/)
    // `inherits: true`: quem lê é o pseudo, e pseudo não herda `false`.
    expect(CSS).toMatch(/@property --button-bloom \{\s*syntax: "<number>";\s*inherits: true;\s*initial-value: 0;/)
  })

  it("1b. a força do hover é por tema, e o claro fica abaixo da referência", () => {
    // No claro o rótulo é branco e o teal e o azul são claros: a 0,80 da
    // referência o `salvar` media 4,26. O valor mora no token, nunca na classe.
    const claro = Number(CLARO.match(/--button-colorful-opacity:\s*([\d.]+)/)?.[1])
    const escuro = Number(ESCURO.match(/--button-colorful-opacity:\s*([\d.]+)/)?.[1])
    expect(claro).toBeLessThanOrEqual(0.7)
    expect(escuro).toBeGreaterThan(0)
    expect(escuro).toBeLessThanOrEqual(0.8)
  })

  it("2. nenhuma cor literal — a cor vem de token", () => {
    expect(PRIMARIO.join(" ")).not.toMatch(/oklch\(|rgba?\(|#[0-9a-f]{3}|\bwhite\b|\bblack\b/i)
  })

  it("3. nem contorno, nem sombra, nem o arco-íris inteiro", () => {
    // O `border-transparent` é da **base** — a borda de 1px existe para a
    // geometria de todo peso ficar igual à do `outline`, e não pinta.
    expect(PRIMARIO.filter((c) => /^border-/.test(c) && c !== "border-transparent")).toStrictEqual([])
    expect(PRIMARIO.filter((c) => /shadow-/.test(c))).toStrictEqual([])
    expect(PRIMARIO.join(" ")).not.toMatch(/brand-rainbow|primary-wash|--button-wash|button-fill/)
  })

  it("4. entra na mola, sai sem ela, e a variável está na lista de transição", () => {
    const resolvido = cn(buttonVariants({ variant: "primary" }))
    expect(resolvido).toMatch(/transition-\[[^\]]*\btranslate\b[^\]]*--button-bloom\]/)
    for (const estado of ["hover", "active", "aria-expanded"]) {
      expect(PRIMARIO, estado).toContain(`${estado}:duration-(--duration-spring)`)
      expect(PRIMARIO, estado).toContain(`${estado}:ease-(--ease-spring)`)
    }
  })

  it("5. a lava e o brilho não voltam", () => {
    // Rodadas 98 a 147: a lava (vidro e blobos seguindo o ponteiro) e depois o
    // brilho do Shiny Button. Quem repuser um destes está repondo cor num
    // botão que o dono pediu cru.
    expect(CSS).not.toMatch(/@utility primary-wash\b/)
    for (const t of ["--button-wash", "--button-breathe", "--button-lava", "--button-glow-strength", "--button-glass-min", "--button-lava-l"]) {
      expect(CSS, t).not.toContain(`${t}:`)
      expect(CSS, t).not.toContain(`@property ${t} `)
    }
    const botao = readFileSync(join(RAIZ, "components/ui/button.tsx"), "utf8")
    expect(botao).not.toMatch(/girarLava|LAVA_STOPS/)
  })

  // A duração é afirmada sobre a string **resolvida** pelo `tailwind-merge`, e
  // não sobre a saída crua do `cva`. A versão anterior lia a crua, onde a
  // classe da base sobrevive mesmo quando a variante a vence — então
  // `duration-(--duration-fast)` aparecia sempre e a asserção não podia
  // falhar. Foi essa brecha que deixou o `link` mudar de ritmo em silêncio na
  // rodada 91.
  it("6. a transição é enumerada e usa a curva da casa, em todo peso", () => {
    // Quem foge do ritmo da casa entra aqui, com a razão escrita. Os quatro
    // pesos que preenchiam entraram na rodada 99, pelo disco de `button-fill`,
    // e saíram com ele na 149.
    //
    // **O florescer entrou na 151 (primário) e na 152 (os outros pesos com
    // fundo no hover)**: a saída recolhe em `--duration-slow` com `--ease-out`
    // — a 150ms a flor se fechava num piscar — e a entrada é a mola da casa
    // (asserção 4 e `button-touch-response.test.ts`).
    const FLOR = { duracao: "duration-(--duration-slow)", curva: "ease-(--ease-out)" }
    const RITMO_PROPRIO: Partial<Record<string, { duracao: string; curva: string }>> = {
      primary: FLOR,
      secondary: FLOR,
      tertiary: FLOR,
      outline: FLOR,
      destructive: FLOR,
    }
    for (const variant of ["primary", "secondary", "tertiary", "outline", "destructive", "link"] as const) {
      const classes = cn(buttonVariants({ variant }))
      const proprio = RITMO_PROPRIO[variant]
      expect(classes, variant).not.toContain("transition-all")
      expect(classes, variant).toContain(proprio?.duracao ?? "duration-(--duration-fast)")
      expect(classes, variant).toContain(proprio?.curva ?? "ease-(--ease-out)")
      // E quem não é exceção não pode carregar outro ritmo.
      if (!proprio) {
        expect(classes, variant).not.toMatch(/duration-\(--duration-(base|slow|instant)\)/)
        expect(classes, variant).not.toMatch(/\bease-(linear|in|in-out)\b/)
      }
    }
  })

  it("7. a tecla não volta: os seis tokens dela não existem em tema nenhum", () => {
    // Rodadas 78 a 97. Quem for repor um destes está repondo relevo num botão
    // que o dono pediu chapado — e a rodada 98 explica por quê.
    for (const t of [
      "--primary-edge",
      "--primary-highlight",
      "--primary-sheen",
      "--primary-shadow-drop",
      "--primary-shadow-value",
      "--primary-shadow-pressed-value",
    ]) {
      expect(CLARO, `${t} no :root`).not.toContain(`${t}:`)
      expect(ESCURO, `${t} no .dark`).not.toContain(`${t}:`)
    }
    expect(CSS).not.toContain("--color-primary-edge")
    // O que fica: `--primary-hover`, porque o `brand` o lê como `--brand-fill`.
    // Opaco e escurecendo nos dois temas — o alfa clareava num e escurecia
    // no outro.
    expect(CSS).toContain("--color-primary-hover: var(--primary-hover)")
    for (const [nome, b] of [["claro", CLARO], ["escuro", ESCURO]] as const) {
      expect(claridade(b, "--primary-hover"), `${nome}: hover escurece`).toBeLessThan(
        claridade(b, "--primary")
      )
    }
  })

  it("8. nenhuma tela remenda o hover do primário à mão", () => {
    const culpados = arquivosTsx(RAIZ)
      .filter((f) => !f.includes(`${join("components", "ui")}`))
      .filter((f) => readFileSync(f, "utf8").includes("hover:bg-primary/90"))
    expect(culpados).toStrictEqual([])
  })

  it("9. `brand` é o CTA neutro com o brilho na borda, e o fundo não muda no cursor", () => {
    const BRAND = buttonVariants({ variant: "brand" }).split(/\s+/)
    // A família do brilho (rodada 145): a mesma utility e o mesmo `isolate`
    // do `Alert`, do `Card` e do `Badge`.
    for (const c of ["brand-rainbow-image", "brand-glow", "relative", "isolate", "bg-secondary"]) {
      expect(BRAND, c).toContain(c)
    }
    // O núcleo do anel é a cor atrás dele — senão a região que a máscara
    // apaga leria como outra superfície dentro do botão.
    expect(BRAND).toContain("[--brand-glow-core:var(--secondary)]")
    // O halo e a tecla preta do desenho anterior não podem sobreviver ao lado
    // do brilho: seriam dois arco-íris na mesma caixa.
    expect(BRAND.join(" ")).not.toMatch(/after:blur|--brand-fill|after:bg-\(image/)
    // Nenhum hover de fundo: o anel pinta por cima do fundo do elemento, e a
    // troca sumiria na fatia virada para o ponteiro.
    expect(BRAND.filter((c) => /^(hover|active):(bg-|\[--button-fill)/.test(c))).toStrictEqual([])
    // O primário veste três paradas da marca num degradê próprio, e não o
    // arco-íris do `brand`: o `brand` é um CTA de marca por tela, o primário é
    // o peso de toda ação principal.
    expect(PRIMARIO.join(" ")).not.toContain("brand-rainbow")
  })

  it("9b. `shape=\"pill\"` arredonda 100% e sobe meio degrau de recuo", () => {
    // O padrão continua o canto do sistema, sem classe nenhuma a mais.
    expect(buttonVariants({})).not.toContain("rounded-full")
    expect(buttonVariants({ shape: "pill" })).toContain("rounded-full")
    // A curva come o canto: o recuo lateral da pílula é meio degrau maior, e
    // o `twMerge` tem de deixar só ele (o do degrau sai).
    const RECUO = { xs: "px-2.5", sm: "px-3", md: "px-3.5", lg: "px-4", xl: "px-4.5" } as const
    for (const [size, px] of Object.entries(RECUO)) {
      const classes = cn(buttonVariants({ shape: "pill", size: size as keyof typeof RECUO })).split(/\s+/)
      expect(classes, size).toContain(px)
      expect(classes.filter((c) => /^px-/.test(c)), size).toStrictEqual([px])
    }
  })

  it("9c. `brandOutline` é o Rainbow Button: arco-íris na borda de baixo e brilho embaixo, deslizando", () => {
    const OUTLINE = buttonVariants({ variant: "brandOutline" }).split(/\s+/)
    expect(OUTLINE).toContain("brand-rainbow-button")
    expect(OUTLINE).toContain("[--brand-fill:var(--primary)]")
    for (const estado of ["hover", "active", "aria-expanded"]) {
      expect(OUTLINE, estado).toContain(`${estado}:[--brand-fill:var(--primary-hover)]`)
    }
    // A pintura mora nos pseudos da utility, e não no fundo do botão: a base
    // declara `bg-clip-padding`, que disputaria com o recorte de três camadas.
    expect(OUTLINE.filter((c) => /(^|:)bg-(?!clip)/.test(c))).toStrictEqual([])
    const i = CSS.indexOf("@utility brand-rainbow-button {")
    expect(i).toBeGreaterThan(-1)
    const util = CSS.slice(i, CSS.indexOf("\n}\n", i))
    for (const c of ["isolation: isolate", "&::before", "&::after", "animation: brand-rainbow-slide 2s linear infinite", "background-clip: padding-box, border-box, border-box", "bottom: -20%", "filter: blur(0.8rem)"]) {
      expect(util, c).toContain(c)
    }
    // O laço fecha na cor em que abre — sem a emenda da referência.
    const lista = util.slice(util.indexOf("--brand-rainbow-slide:"), util.indexOf(");", util.indexOf("--brand-rainbow-slide:")))
    const cores = [...lista.matchAll(/var\((--brand-[a-z]+)\)/g)].map((m) => m[1])
    expect(cores[0]).toBe(cores.at(-1))
    expect(CSS).toMatch(/@keyframes brand-rainbow-slide \{\s*from \{\s*background-position: 0% center;\s*\}\s*to \{\s*background-position: 200% center;/)
  })

  it("10. a camada é o `::after`, e a razão é o `ButtonGroup`", () => {
    // `[&>[data-variant=primary]]:before:hidden` esconderia um `::before`. Um
    // `::after` em `z` negativo só fica **acima** do fundo do botão dentro da
    // raiz de empilhamento dele — sem `isolate`, cairia atrás do `background`.
    // As duas coisas moram na `@utility button-colorful` (asserção 1a).
    expect(PRIMARIO.filter((c) => /(^|:)before:/.test(c))).toStrictEqual([])
    const grupo = readFileSync(join(RAIZ, "components/ui/button-group.tsx"), "utf8")
    expect(grupo).toContain("[&>[data-variant=primary]]:before:hidden")
    // O vão de 1px do primário é a **sobreposição**, e não o `ml-px` do
    // `secondary`: o fundo dele é recortado no `padding-box`, então a borda
    // transparente de cada lado já é vão, e somada à margem a emenda media 3px.
    expect(grupo).not.toContain("[&>[data-variant=primary]:not(:first-child)]:ml-px")
  })
})
