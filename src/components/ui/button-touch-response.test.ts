import { describe, expect, it } from "vitest"
import { blocoCss, lerFonte } from "@/test/fonte"

import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * Todo peso preenchível do `Button` responde ao toque, e não só ao cursor: `hover:` compila
 * dentro de `@media (hover: hover)` e um controle só com `hover:` fica inerte no dedo. O par
 * escuro entra junto, porque `&:active` e `&:is(.dark *)` empatam em especificidade e o `dark:`
 * é emitido depois. `link` fica de fora: não preenche nada e o realce é o sublinhado.
 */
const PESOS_QUE_PREENCHEM = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "destructive",
] as const

/** Os alvos de `hover:bg-*` e de `active:bg-*` numa string de variante. */
function fundos(classes: string) {
  const pegar = (prefixo: string) =>
    classes
      .split(/\s+/)
      .filter((c) => c.startsWith(prefixo))
      .map((c) => c.slice(prefixo.length))
      .sort()
  return {
    hover: pegar("hover:bg-"),
    active: pegar("active:bg-"),
    darkHover: pegar("dark:hover:bg-"),
    darkActive: pegar("dark:active:bg-"),
  }
}

describe("resposta ao toque do Button", () => {
  it("1. `tertiary` responde ao toque como ao cursor — hoje pelo realce chapado", () => {
    // O que o cursor liga, o toque liga: sem o par `active:` o terciário não devolvia nada ao
    // toque. O hover dos pesos com fundo é a camada chapada (`--button-hover` de 0 a 1).
    const classes = buttonVariants({ variant: "tertiary" })
    expect(classes).toContain("hover:[--button-hover:1]")
    expect(classes).toContain("active:[--button-hover:1]")
    expect(classes).not.toMatch(/(^|\s)(hover|active):bg-/)
  })

  /**
   * As que ainda não têm o par: nenhuma. A lista fica vazia porque a asserção 3 impede uma
   * variante nova de nascer sem o par.
   */
  const PENDENTES = [] as const

  it("2. quem já foi consertado pinta no toque o mesmo que pinta no cursor", () => {
    for (const variant of PESOS_QUE_PREENCHEM) {
      if ((PENDENTES as readonly string[]).includes(variant)) continue
      const { hover, active, darkHover, darkActive } = fundos(
        buttonVariants({ variant })
      )
      expect(active, `${variant}: hover sem par active`).toStrictEqual(hover)
      expect(darkActive, `${variant}: dark hover sem par`).toStrictEqual(darkHover)
    }
  })

  it("3. a lista de pendentes não cresce — variante nova nasce com o par", () => {
    const semPar = PESOS_QUE_PREENCHEM.filter((variant) => {
      const { hover, active } = fundos(buttonVariants({ variant }))
      return hover.length > 0 && active.length === 0
    })
    // Se isto falhar com um nome a mais, alguém acrescentou um realce de cursor
    // sem o de toque. Se falhar com um nome a menos, o conserto chegou e o nome
    // sai da lista acima.
    expect([...semPar].sort()).toStrictEqual([...PENDENTES].sort())
  })

  // O traço do `link` não é `text-decoration`: o `::first-letter` da base cria caixa separada
  // para a primeira letra e a decoração sai partida em dois segmentos; só a camada de
  // `background` elimina a emenda. Não há traço em repouso: ele nasce da esquerda no cursor
  // (`scaleX` com a origem trocando de lado) e recolhe para a direita na saída.
  it("5. os pesos com fundo no hover realçam chapado, sem florescer, e o disco do ponteiro não volta", () => {
    // A cor do peso pinta por cima do repouso e esmaece no ritmo da casa (`@utility button-
    // hover`); a transição da base carrega a variável e mantém `translate`.
    for (const variant of ["secondary", "tertiary", "outline", "floating", "destructive"] as const) {
      const cru = buttonVariants({ variant })
      expect(cru, variant).toContain("button-hover")
      expect(cru, variant).toMatch(/\[--button-hover-fill:/)
      expect(cru, variant).not.toMatch(/button-bloom|--duration-spring|--ease-spring/)
      const resolvido = cn(cru)
      expect(resolvido, variant).toMatch(/transition-\[[^\]]*\btranslate\b[^\]]*--button-hover\]/)
    }
    // Os pesos sem cor realçam com `--accent` a 50%, o realce das linhas da barra lateral
    // (`bg-sidebar-accent/50`). O `destructive` tem par `dark:`.
    for (const variant of ["tertiary", "outline", "floating"] as const) {
      expect(buttonVariants({ variant }), variant).toContain(
        "[--button-hover-fill:color-mix(in_oklab,var(--accent)_50%,transparent)]"
      )
    }
    expect(buttonVariants({ variant: "destructive" })).toMatch(/dark:\[--button-hover-fill:color-mix\(/)
    // `brand`, `brandOutline` e `link` têm o hover próprio; só o
    // `brandColorful` floresce.
    for (const variant of ["primary", "brand", "brandOutline", "link"] as const) {
      expect(buttonVariants({ variant }), variant).not.toMatch(/button-bloom|button-colorful/)
    }
    // O disco que crescia a partir do ponteiro não volta.
    for (const variant of ["primary", "secondary", "tertiary", "outline", "destructive"] as const) {
      expect(buttonVariants({ variant }), variant).not.toMatch(/button-fill/)
    }
    const CSS = lerFonte("src/app/globals.css")
    expect(CSS).toMatch(/@utility button-hover \{\s*background-image: linear-gradient\(/)
    expect(CSS).toMatch(/@property --button-hover \{\s*syntax: "<number>";/)
    expect(CSS).not.toMatch(/@property --button-fill\b/)
    expect(CSS).not.toMatch(/@utility button-fill\b/)
    const botao = lerFonte("src/components/ui/button.tsx")
    expect(botao).not.toMatch(/--button-mx|PESOS_COM_PONTEIRO/)
  })

  it("4. `link` não tem traço em repouso, e ele entra pela esquerda", () => {
    const classes = buttonVariants({ variant: "link" })
    // A pintura mora em `@utility link-sweep`; a variante só a veste, junto de
    // `brand-rainbow-image`, que é quem declara `--brand-rainbow` no elemento.
    expect(classes.split(/\s+/)).toContain("link-sweep")
    expect(classes.split(/\s+/)).toContain("brand-rainbow-image")
    // A emenda do `::first-letter` continua proibida — ver o comentário acima.
    expect(classes).not.toContain(" underline ")
    expect(classes).not.toContain("text-decoration")
    // E o traço sumiu do `background` do botão: ele é `::after` do rótulo.
    expect(classes).not.toContain("bg-[image:")
    expect(classes).not.toContain("bg-[length:")

    const CSS = lerFonte("src/app/globals.css")
    const utility = blocoCss(CSS, "@utility link-sweep {", "\n}")
    // Em repouso, colapsado à direita; no cursor, cheio a partir da esquerda.
    // A troca de origem é o truque: sem ela o traço voltaria por onde veio.
    expect(utility).toContain("transform: scaleX(0)")
    expect(utility).toContain("transform-origin: right")
    expect(utility).toContain("transform: scaleX(1)")
    expect(utility).toContain("transform-origin: left")
    // O toque e o teclado acompanham o cursor — regra H, e foco também.
    for (const gatilho of ["&:hover", "&:active", "&:focus-visible"]) {
      expect(utility, gatilho).toContain(gatilho)
    }
    // O traço tem a largura do **texto**: ele mora no rótulo, não no botão.
    expect(utility).toContain('[data-slot="button-label"]::after')
    expect(utility).toContain("top: calc(50% + 0.5lh)")
    // `prefers-reduced-motion` não pode apagar o traço — a referência põe o
    // `motion-safe:` no próprio `scaleX` e deixa quem pede menos movimento sem
    // sublinhado nenhum. Aqui só a transição encurta, pelo bloco global.
    expect(utility).not.toContain("prefers-reduced-motion")
  })
})

describe("o gatilho de menu também afunda, só no clique", () => {
  it("o afundar é uma animação de duração fixa no pointerdown, sem estado preso", () => {
    const fonte = lerFonte("src/components/ui/button.tsx")
    expect(fonte).toContain("el.animate(AFUNDAR")
    expect(fonte).toContain("afundar(e)")
    expect(fonte).not.toContain("aria-expanded:translate-y-px")
    expect(fonte).not.toContain("data-pressed:translate-y-px")
  })
})

describe("o degrau padrão e o piso do dedo", () => {
  it("sem `size` o botão é `lg` (36); no dedo `md` e `lg` sobem a 40, `xs` e `sm` ficam", () => {
    expect(buttonVariants({})).toContain("[--button-h:--spacing(9)]")
    for (const size of ["md", "lg", "icon-md", "icon-lg"] as const) {
      expect(buttonVariants({ size }), size).toContain("pointer-coarse:[--button-h:--spacing(11)]")
    }
    for (const size of ["xs", "sm", "icon-xs", "icon-sm"] as const) {
      expect(buttonVariants({ size }), size).not.toContain("pointer-coarse:")
    }
  })

  it("um `h-*` ou `size-*` de quem chama vence também no dedo", () => {
    // O piso mora numa variável: o `twMerge` troca a altura inteira, e um
    // `pointer-coarse:h-11` solto sobreviveria ao `h-auto` da linha do seletor.
    const classes = cn(buttonVariants({ size: "md" }), "h-auto").split(/\s+/)
    expect(classes).toContain("h-auto")
    expect(classes).not.toContain("h-(--button-h)")
    expect(classes.some((c) => /^pointer-coarse:h-/.test(c))).toBe(false)
  })
})
