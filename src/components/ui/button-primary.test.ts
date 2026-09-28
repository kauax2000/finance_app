import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * O primário é **cru** (rodada 148): o preenchimento e o hover dos outros
 * pesos — o disco de `button-fill` na cor de `--primary-hover` —, sem cor e sem
 * arco-íris. Da rodada 98 à 147 ele acendeu a marca no cursor, e o dono pediu
 * tudo fora.
 * Ele foi tecla da rodada 78 à 97, e cada asserção aqui tranca ou um pedaço
 * do desenho novo, ou um pedaço da tecla que não pode voltar por engano.
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

describe("o primário é cru", () => {
  it("1. o hover é o disco dos outros pesos, na cor do hover do primário", () => {
    // Nenhum `hover:bg-*`: o disco de `button-fill` pinta por cima, como no
    // `secondary`. Um alfa sobre a superfície (`bg-primary/90`) clareava num
    // tema e escurecia no outro, e é o defeito que esta asserção sempre guardou.
    expect(PRIMARIO.filter((c) => /^(hover|active):bg-/.test(c))).toStrictEqual([])
    expect(PRIMARIO.join(" ")).not.toMatch(/bg-primary\/\d/)
    expect(PRIMARIO).toContain("bg-primary")
    expect(PRIMARIO).toContain("button-fill")
    expect(PRIMARIO).toContain("[--button-fill-color:var(--primary-hover)]")
  })

  it("2. nenhuma cor literal — a cor vem de token", () => {
    expect(PRIMARIO.join(" ")).not.toMatch(/oklch\(|rgba?\(|#[0-9a-f]{3}|\bwhite\b|\bblack\b/i)
  })

  it("3. cru: nem contorno, nem sombra, nem véu, nem arco-íris", () => {
    // O `border-transparent` é da **base** — a borda de 1px existe para a
    // geometria de todo peso ficar igual à do `outline`, e não pinta.
    expect(PRIMARIO.filter((c) => /^border-/.test(c) && c !== "border-transparent")).toStrictEqual([])
    expect(PRIMARIO.filter((c) => /shadow-/.test(c))).toStrictEqual([])
    expect(PRIMARIO.filter((c) => /^bg-\(image:/.test(c))).toStrictEqual([])
    expect(PRIMARIO.join(" ")).not.toMatch(/brand|rainbow|primary-wash|--button-wash/)
  })

  it("4. o disco enche no cursor, no toque e com o popover aberto", () => {
    // Regra H: o toque pinta o mesmo que o cursor. E `aria-expanded` é o
    // realce de quem abriu um menu, como nos outros pesos.
    for (const c of [
      "hover:[--button-fill:100%]",
      "active:[--button-fill:100%]",
      "aria-expanded:[--button-fill:100%]",
    ]) {
      expect(PRIMARIO, c).toContain(c)
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
    // Quem foge do ritmo da casa entra aqui, com a razão escrita. Está vazio
    // desde a rodada 94: o `link` era a única exceção, por causa da varredura
    // do sublinhado, e ela saiu a pedido do dono — a troca de tinta é
    // instantânea e não precisa de ritmo nenhum.
    //
    // **Os quatro pesos que preenchem entraram na rodada 99**: o disco de
    // `button-fill` com `--ease-out` chegava a 95% do raio em 60ms dos 150
    // (medido) e lia como um piscar; o dono pediu visível. É o ritmo mais
    // lento da casa com a curva enfática — tokens existentes, nada novo.
    const LENTO = { duracao: "duration-(--duration-slow)", curva: "ease-(--ease-emphasized)" }
    const RITMO_PROPRIO: Partial<Record<string, { duracao: string; curva: string }>> = {
      primary: LENTO,
      secondary: LENTO,
      tertiary: LENTO,
      outline: LENTO,
      destructive: LENTO,
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
    // O primário restata a lista inteira com `--button-fill` no fim, como os
    // outros: o `tailwind-merge` troca a classe de transição, não acrescenta —
    // e sem a variável na lista o disco entra de estalo.
    const primario = cn(buttonVariants({ variant: "primary" }))
    expect(primario).toMatch(/transition-\[[^\]]*--button-fill\]/)
    expect(primario).toMatch(/transition-\[[^\]]*\btranslate\b[^\]]*\]/)
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
    // O primário veste o arco-íris **pela utility**, atrás do vidro — e não o
    // do `brand`. As duas peças continuam sendo coisas diferentes: o `brand`
    // é um CTA de marca por tela, o primário é o peso de toda ação principal.
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

  it("10. nada é pseudo-elemento, e a razão é o `ButtonGroup`", () => {
    // `[&>[data-variant=primary]]:before:hidden` esconderia um `::before`;
    // um `::after` em `z` negativo fica atrás do `background` do elemento.
    expect(PRIMARIO.filter((c) => /^(before|after):/.test(c))).toStrictEqual([])
    const grupo = readFileSync(join(RAIZ, "components/ui/button-group.tsx"), "utf8")
    expect(grupo).toContain("[&>[data-variant=primary]]:before:hidden")
    // O vão de 1px do primário é a **sobreposição**, e não o `ml-px` do
    // `secondary`: o fundo dele é recortado no `padding-box`, então a borda
    // transparente de cada lado já é vão, e somada à margem a emenda media 3px.
    expect(grupo).not.toContain("[&>[data-variant=primary]:not(:first-child)]:ml-px")
  })
})
