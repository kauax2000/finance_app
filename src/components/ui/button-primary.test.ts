import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * O primário é **chapado** (rodada 98) e acende em lava sob o cursor: sem
 * contorno, plinto, luz, véu ou sombra — só o preenchimento —, e no hover o
 * arco-íris da marca atrás de um vidro da cor do botão, focado no ponteiro.
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
const LAVA = bloco("@utility primary-wash {")

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

describe("o primário é chapado, e acende em lava", () => {
  it("1. o cursor não troca o fundo — acende o vidro", () => {
    // Nenhum `hover:bg-*`: o realce do primário não é cor, é `--button-wash`
    // subindo a 1. Um alfa sobre a superfície (`bg-primary/90`) clareava num
    // tema e escurecia no outro, e é o defeito que esta asserção sempre
    // guardou; agora ela guarda também que o fundo simplesmente não muda.
    expect(PRIMARIO.filter((c) => /^(hover|active):bg-/.test(c))).toStrictEqual([])
    expect(PRIMARIO.join(" ")).not.toMatch(/bg-primary\/\d/)
    expect(PRIMARIO).toContain("bg-primary")
  })

  it("2. nenhuma cor literal — a cor vem de token", () => {
    expect(PRIMARIO.join(" ")).not.toMatch(/oklch\(|rgba?\(|#[0-9a-f]{3}|\bwhite\b|\bblack\b/i)
  })

  it("3. chapado: nem contorno, nem sombra, nem véu na variante", () => {
    // A tecla era `border-primary-edge` + dois `shadow-(…)` + um
    // `bg-(image:…)`. Nada disso volta: o único desenho é a utility. O
    // `border-transparent` é da **base** — a borda de 1px existe para a
    // geometria de todo peso ficar igual à do `outline`, e não pinta.
    expect(PRIMARIO.filter((c) => /^border-/.test(c) && c !== "border-transparent")).toStrictEqual([])
    expect(PRIMARIO.filter((c) => /shadow-/.test(c))).toStrictEqual([])
    expect(PRIMARIO.filter((c) => /^bg-\(image:/.test(c))).toStrictEqual([])
    expect(PRIMARIO).toContain("primary-wash")
  })

  it("4. o vidro afina no cursor, no toque e com o popover aberto", () => {
    // Regra H: o toque pinta o mesmo que o cursor. E `aria-expanded` é o
    // realce de quem abriu um menu, como nos outros pesos.
    for (const c of [
      "hover:[--button-wash:1]",
      "active:[--button-wash:1]",
      "aria-expanded:[--button-wash:1]",
    ]) {
      expect(PRIMARIO, c).toContain(c)
    }
  })

  it("5. a órbita pausa em vez de desligar", () => {
    // Ligar a animação só dentro do `hover:` faria a lava saltar ao ponto
    // zero a cada entrada — a mesma medição que o `brand` fez com o giro.
    expect(PRIMARIO).toContain("[animation-play-state:paused]")
    expect(PRIMARIO).toContain("hover:[animation-play-state:running]")
    expect(PRIMARIO).toContain("active:[animation-play-state:running]")
    expect(LAVA).toMatch(/animation:\s*button-lava\s+\d+s\s+linear\s+infinite/)
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
    const RITMO_PROPRIO: Partial<Record<string, { duracao: string; curva: string }>> = {}
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
    // O primário restata a lista inteira com `--button-wash` no fim: o
    // `tailwind-merge` troca a classe de transição, não acrescenta a ela —
    // e sem a variável na lista o vidro entra de estalo.
    const primario = cn(buttonVariants({ variant: "primary" }))
    expect(primario).toMatch(/transition-\[[^\]]*--button-wash\]/)
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

  it("9. `brand` continua sendo contorno e halo, e não pinta o próprio fundo", () => {
    const BRAND = buttonVariants({ variant: "brand" }).split(/\s+/)
    // Numa raiz de empilhamento o fundo do elemento pinta antes dos filhos de
    // z negativo: um `bg-primary` aqui ficaria **na frente** do contorno.
    expect(BRAND).toContain("isolate")
    expect(BRAND.filter((c) => /^bg-(?!clip-)/.test(c))).toStrictEqual([])
    // O contorno e o preenchimento vivem no `::before`; o halo, no `::after`.
    expect(BRAND.some((c) => c.startsWith("before:[background:") && c.includes("--brand-rainbow"))).toBe(true)
    expect(BRAND).toContain("after:bg-(image:--brand-rainbow)")
    expect(BRAND).toContain("after:blur-md")
    // O hover troca a variável que o pseudo lê, e o toque acompanha (regra H).
    expect(BRAND).toContain("hover:[--brand-fill:var(--primary-hover)]")
    expect(BRAND).toContain("active:[--brand-fill:var(--primary-hover)]")
    expect(BRAND).toContain("hover:after:opacity-80")
    expect(BRAND).toContain("active:after:opacity-80")
    // O primário veste o arco-íris **pela utility**, atrás do vidro — e não o
    // degradê do `brand`, que é contorno e halo. As duas peças continuam
    // sendo coisas diferentes: o `brand` é um CTA de marca por tela, o
    // primário é o peso de toda ação principal.
    expect(PRIMARIO.join(" ")).not.toContain("brand-rainbow")
  })

  it("10. nada é pseudo-elemento, e a razão é o `ButtonGroup`", () => {
    // `[&>[data-variant=primary]]:before:hidden` esconderia um `::before`;
    // um `::after` em `z` negativo fica atrás do `background` do elemento.
    // As cinco camadas da lava são `background-image` do próprio botão.
    expect(PRIMARIO.filter((c) => /^(before|after):/.test(c))).toStrictEqual([])
    expect(LAVA).not.toMatch(/::(before|after)/)
    const grupo = readFileSync(join(RAIZ, "components/ui/button-group.tsx"), "utf8")
    expect(grupo).toContain("[&>[data-variant=primary]]:before:hidden")
    // Chapado e sem borda, o primário cai na emenda do `secondary`: o vão
    // transparente de 1px, e não a sobreposição.
    expect(grupo).toContain("[&>[data-variant=primary]:not(:first-child)]:ml-px")
  })

  it("11. a lava é um vidro sobre as oito paradas da marca, e o vidro é da cor do botão", () => {
    // A camada de cima é o vidro: `--primary` em `color-mix`, centrado no
    // ponteiro, e é o `--button-wash` que o afina. Se o vidro não lê
    // `--button-wash`, a variável liga nada.
    const camadas = LAVA.split("radial-gradient(").length - 1
    expect(camadas).toBe(9)
    const vidro = LAVA.slice(LAVA.indexOf("radial-gradient("), LAVA.indexOf("radial-gradient(", LAVA.indexOf("radial-gradient(") + 1))
    expect(vidro).toContain("var(--primary)")
    expect(vidro).toContain("var(--button-wash)")
    expect(vidro).toContain("at var(--button-mx) var(--button-my)")
    // Os blobs orbitam o ponteiro: cada um lê `--button-mx` e `--button-lava`,
    // e há um por parada da marca — o arco-íris inteiro, a pedido do dono.
    const blobs = LAVA.slice(LAVA.indexOf("radial-gradient(", vidro.length))
    // três leituras por blob: x e y da órbita, e o alfa que respira.
    expect(blobs.match(/var\(--button-lava\)/g)?.length).toBe(24)
    for (const parada of ["teal", "blue", "indigo", "violet", "magenta", "coral", "amber", "green"]) {
      expect(LAVA, parada).toContain(`var(--brand-${parada})`)
    }
    // A névoa das bordas é `box-shadow` **interno** ligado pelo wash — em
    // repouso é transparente, então o botão continua chapado. Ela mora na
    // utility e nunca numa classe `shadow-*` da variante (asserção 3).
    expect(LAVA).toMatch(/box-shadow:\s*\n?\s*inset[\s\S]*var\(--button-wash\)/)
    // Os blobs sobem o croma das paradas e **igualam a claridade** por tema
    // (`--button-lava-l`): no claro o vidro é preto e o rótulo branco, então
    // os blobs ficam escuros; no escuro, o contrário. Claridade fixa e única
    // reprovou (3,95) — o token existe nos dois temas por isso.
    expect(blobs.match(/oklch\(from var\(--button-blob-[1-8]\) var\(--button-lava-l\) calc\(c \* [\d.]+\) h \/ calc\([^)]*sin\(/g)?.length).toBe(8)
    // …e cada um **respira** (o `/ calc(… sin(…))`): sem a opacidade pulsando,
    // o blob do topo cobre o ponteiro o tempo todo e a cor sob o cursor não
    // muda — a órbita sozinha só o desloca 24–38px num raio de ~200.
    // A cor de cada camada é variável com padrão na utility, e o `Button` gira
    // a atribuição a cada entrada — senão a lava começaria sempre pela camada
    // de cima, que cobre o ponteiro.
    for (let k = 1; k <= 8; k++) expect(LAVA).toMatch(new RegExp(`--button-blob-${k}: var\\(--brand-\\w+\\)`))
    const botao = readFileSync(join(RAIZ, "components/ui/button.tsx"), "utf8")
    expect(botao).toContain("onPointerEnter")
    expect(botao).toMatch(/setProperty\(`--button-blob-\$\{k \+ 1\}`/)
    expect(CLARO).toContain("--button-lava-l:")
    expect(ESCURO).toContain("--button-lava-l:")
    expect(claridade(CLARO, "--button-lava-l") < claridade(ESCURO, "--button-lava-l")).toBe(true)
    // As duas variáveis são tipadas: só variável tipada interpola.
    expect(CSS).toMatch(/@property --button-wash \{\s*syntax: "<number>"/)
    expect(CSS).toMatch(/@property --button-lava \{\s*syntax: "<number>"/)
  })
})
