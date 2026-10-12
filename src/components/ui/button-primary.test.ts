import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { arquivosTsx, blocoCss, lerFonte } from "@/test/fonte"

import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * O primário é a tecla chapada: preta no claro, branca no escuro, indo a `--primary-hover` no
 * cursor (clareia no claro, escurece no escuro). O degradê de cinco paradas é o
 * `brandColorful`; cada asserção tranca um pedaço do desenho de hoje ou um pedaço dos antigos
 * que não pode voltar.
 */

const RAIZ = resolve(process.cwd(), "src")
const CSS = lerFonte(join(RAIZ, "app/globals.css"))
const PRIMARIO = buttonVariants({ variant: "primary" }).split(/\s+/)
const COLORIDO = buttonVariants({ variant: "brandColorful" }).split(/\s+/)

function bloco(inicio: string) {
  expect(CSS.indexOf(inicio), `bloco ${inicio} não achado`).toBeGreaterThan(-1)
  return blocoCss(CSS, inicio)
}
const CLARO = bloco(":root,\n.light {")
const ESCURO = bloco("\n.dark {")

/** A claridade de um `oklch(L …)` — ou de um número puro — declarado no bloco. */
function claridade(trecho: string, token: string) {
  const m = trecho.match(new RegExp(`\\n\\s*${token}:\\s*(?:oklch\\()?([\\d.]+)`))
  expect(m, `${token} sem valor`).not.toBeNull()
  return Number(m![1])
}

describe("o primário é a tecla chapada, e o colorido é de marca", () => {
  it("0. o primário vai a --primary-hover no cursor, no toque e no menu aberto, sem cor nenhuma", () => {
    expect(PRIMARIO).toContain("bg-primary")
    for (const estado of ["hover", "active", "aria-expanded"]) {
      expect(PRIMARIO, estado).toContain(`${estado}:bg-primary-hover`)
    }
    expect(PRIMARIO.filter((c) => /^(button-colorful|button-hover|brand-)|--button-(bloom|hover):/.test(c))).toStrictEqual([])
    expect(PRIMARIO.join(" ")).not.toMatch(/bg-primary\/\d/)
  })

  it("1. `brandColorful` em repouso é a tecla chapada; no cursor, no toque e no menu aberto as cores florescem", () => {
    expect(COLORIDO).toContain("bg-primary")
    expect(COLORIDO).toContain("button-colorful")
    for (const c of ["hover:[--button-bloom:1]", "active:[--button-bloom:1]", "aria-expanded:[--button-bloom:1]"]) {
      expect(COLORIDO, c).toContain(c)
    }
    // O fundo não troca — quem responde ao cursor é a camada. E a camada nunca
    // vem por classe `before:`/`after:` na variante: mora na utility.
    expect(COLORIDO.filter((c) => /^(hover|active):bg-/.test(c))).toStrictEqual([])
    expect(COLORIDO.filter((c) => /(^|:)(before|after):/.test(c))).toStrictEqual([])
  })

  it("1a. a utility: a camada é o `::after`, cinco paradas da marca, e um número só anima tudo", () => {
    const util = bloco("@utility button-colorful {")
    for (const c of ["isolation: isolate", "overflow: hidden", "&::after", "z-index: -10"]) {
      expect(util, c).toContain(c)
    }
    // Cinco paradas do arco-íris da marca; o roxo de três paradas da referência lia como
    // template.
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
    expect([...PRIMARIO, ...COLORIDO].join(" ")).not.toMatch(/oklch\(|rgba?\(|#[0-9a-f]{3}|\bwhite\b|\bblack\b/i)
  })

  it("3. nem contorno, nem sombra, nem o arco-íris inteiro", () => {
    // O `border-transparent` é da **base** — a borda de 1px existe para a
    // geometria de todo peso ficar igual à do `outline`, e não pinta.
    for (const classes of [PRIMARIO, COLORIDO]) {
      expect(classes.filter((c) => /^border-/.test(c) && c !== "border-transparent")).toStrictEqual([])
      expect(classes.filter((c) => /shadow-/.test(c))).toStrictEqual([])
      expect(classes.join(" ")).not.toMatch(/brand-rainbow|primary-wash|--button-wash|button-fill/)
    }
  })

  it("4. o colorido entra na mola, sai sem ela, e a variável está na lista de transição", () => {
    const resolvido = cn(buttonVariants({ variant: "brandColorful" }))
    expect(resolvido).toMatch(/transition-\[[^\]]*\btranslate\b[^\]]*--button-bloom\]/)
    for (const estado of ["hover", "active", "aria-expanded"]) {
      expect(COLORIDO, estado).toContain(`${estado}:duration-(--duration-spring)`)
      expect(COLORIDO, estado).toContain(`${estado}:ease-(--ease-spring)`)
    }
  })

  it("5. a lava e o brilho não voltam", () => {
    // A lava e o brilho do Shiny Button não voltam: repô-los é repor cor num botão que o dono
    // pediu cru.
    expect(CSS).not.toMatch(/@utility primary-wash\b/)
    for (const t of ["--button-wash", "--button-breathe", "--button-lava", "--button-glow-strength", "--button-glass-min", "--button-lava-l"]) {
      expect(CSS, t).not.toContain(`${t}:`)
      expect(CSS, t).not.toContain(`@property ${t} `)
    }
    const botao = lerFonte(join(RAIZ, "components/ui/button.tsx"))
    expect(botao).not.toMatch(/girarLava|LAVA_STOPS/)
  })

  // A duração é afirmada sobre a string resolvida pelo `tailwind-merge`, e não sobre a saída
  // crua do `cva`, onde a classe da base sobrevive mesmo quando a variante a vence.
  it("6. a transição é enumerada e usa a curva da casa, em todo peso", () => {
    // Quem foge do ritmo da casa entra aqui, com a razão escrita. O florescer é só do
    // `brandColorful`: a saída recolhe em `--duration-slow` com `--ease-out` (a 150ms a flor se
    // fechava num piscar) e a entrada é a mola da casa (asserção 4).
    const FLOR = { duracao: "duration-(--duration-slow)", curva: "ease-(--ease-out)" }
    const RITMO_PROPRIO: Partial<Record<string, { duracao: string; curva: string }>> = {
      brandColorful: FLOR,
    }
    for (const variant of ["primary", "brandColorful", "secondary", "tertiary", "outline", "floating", "destructive", "link"] as const) {
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
    // O relevo da tecla antiga não volta: repô-lo é repor relevo num botão que o dono pediu
    // chapado.
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
    // Fica `--primary-hover` (e o `--brand-fill` do `brandOutline`): opaco e longe o bastante
    // do repouso para se ver, clareando no claro e escurecendo no escuro (ao menos 0,1 de
    // claridade nos dois).
    expect(CSS).toContain("--color-primary-hover: var(--primary-hover)")
    expect(claridade(CLARO, "--primary-hover"), "claro: hover clareia").toBeGreaterThan(claridade(CLARO, "--primary"))
    expect(claridade(ESCURO, "--primary-hover"), "escuro: hover escurece").toBeLessThan(claridade(ESCURO, "--primary"))
    for (const [nome, b] of [["claro", CLARO], ["escuro", ESCURO]] as const) {
      expect(Math.abs(claridade(b, "--primary-hover") - claridade(b, "--primary")), nome).toBeGreaterThanOrEqual(0.1)
    }
  })

  it("8. nenhuma tela remenda o hover do primário à mão", () => {
    const culpados = arquivosTsx(RAIZ)
      .filter((f) => !f.includes(`${join("components", "ui")}`))
      .filter((f) => lerFonte(f).includes("hover:bg-primary/90"))
    expect(culpados).toStrictEqual([])
  })

  it("9. `brand` é o CTA neutro com o brilho na borda, e o fundo não muda no cursor", () => {
    const BRAND = buttonVariants({ variant: "brand" }).split(/\s+/)
    // A família do brilho: a mesma utility e o mesmo `isolate` do `Alert`, do `Card` e do
    // `Badge`.
    for (const c of ["brand-rainbow-image", "brand-glow", "relative", "isolate", "bg-secondary"]) {
      expect(BRAND, c).toContain(c)
    }
    // Sem núcleo: a máscara recorta o anel e o meio do botão nunca é pintado.
    expect(BRAND.join(" ")).not.toMatch(/--brand-glow-(core|overlay)/)
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

  it("9b. todo botão é cápsula, com o recuo da antiga pílula", () => {
    // O controle do iOS 26 é cápsula em todos os degraus, e o eixo `shape` não volta ao tipo.
    expect(buttonVariants({})).toContain("rounded-full")
    expect(buttonVariants({})).not.toContain("rounded-lg")
    const RECUO = { xs: "px-2.5", sm: "px-3", md: "px-3.5", lg: "px-4", xl: "px-4.5" } as const
    for (const [size, px] of Object.entries(RECUO)) {
      const classes = cn(buttonVariants({ size: size as keyof typeof RECUO })).split(/\s+/)
      expect(classes.filter((c) => /^px-/.test(c)), size).toStrictEqual([px])
    }
  })

  it("9d. `floating` é a placa flutuante: --popover, anel de 1px, sombra, e o realce chapado", () => {
    const FLOAT = buttonVariants({ variant: "floating" }).split(/\s+/)
    for (const c of ["bg-popover", "bg-clip-border", "ring-1", "ring-foreground/10", "shadow-sm", "button-hover", "rounded-full"]) {
      expect(FLOAT, c).toContain(c)
    }
    expect(FLOAT).toContain("active:text-foreground")
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
    const util = bloco("@utility brand-rainbow-button {")
    for (const c of ["isolation: isolate", "&::before", "&::after", "animation: brand-rainbow-slide 2s linear infinite", "background-clip: padding-box, border-box, border-box", "bottom: -20%", "filter: blur(0.8rem)"]) {
      expect(util, c).toContain(c)
    }
    // A lista mora na `brand-rainbow-slide` (o `Checkbox` a lê também), e o laço fecha na cor
    // em que abre.
    expect(OUTLINE).toContain("brand-rainbow-slide")
    const lista = bloco("@utility brand-rainbow-slide {")
    const cores = [...lista.matchAll(/var\((--brand-[a-z]+)\)/g)].map((m) => m[1])
    expect(cores.length).toBe(6)
    expect(cores[0]).toBe(cores.at(-1))
    expect(CSS).toMatch(/@keyframes brand-rainbow-slide \{\s*from \{\s*background-position: 0% center;\s*\}\s*to \{\s*background-position: 200% center;/)
  })

  it("10. a camada colorida é o `::after`, e o `::before` fica para o divisor do grupo", () => {
    // O `ButtonGroup` usa e esconde o `::before` (o divisor). Um `::after` em
    // `z` negativo só fica **acima** do fundo do botão dentro da raiz de
    // empilhamento dele — sem `isolate`, cairia atrás do `background`. As duas
    // coisas moram na `@utility button-colorful` (asserção 1a).
    expect(COLORIDO.filter((c) => /(^|:)before:/.test(c))).toStrictEqual([])
    // A emenda do primário, que não tem divisor: o vão de 1px da borda.
    const grupo = lerFonte(join(RAIZ, "components/ui/button-group.tsx"))
    expect(grupo).toContain("[&>[data-variant=primary]]:before:hidden")
    // O vão de 1px do primário é a **sobreposição**, e não o `ml-px` do
    // `secondary`: o fundo dele é recortado no `padding-box`, então a borda
    // transparente de cada lado já é vão, e somada à margem a emenda media 3px.
    expect(grupo).not.toContain("[&>[data-variant=primary]:not(:first-child)]:ml-px")
  })
})
