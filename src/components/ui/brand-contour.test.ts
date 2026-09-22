import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { badgeVariants } from "./badge"
import { buttonVariants } from "./button"
import { checkboxVariants } from "./checkbox"
import { radioVariants } from "./radio"
import { radioGroupItemVariants } from "./radio-group"

/**
 * O contorno de marca, e o que ele não pode virar.
 *
 * Cinco peças desenham o arco-íris da marca por **contorno**: os dois pesos do
 * `Button`, o `Badge`, e agora o `Checkbox`, o `Radio` e o cartão do
 * `RadioGroup`. A receita é uma só — 1px de `border-box` sobre um núcleo
 * chapado em `padding-box` — e ela tem três jeitos conhecidos de quebrar
 * calada:
 *
 * 1. alguém declara `bg-*` no próprio elemento e o núcleo some, porque numa
 *    raiz de empilhamento o fundo pinta **antes** dos filhos de `z` negativo;
 * 2. alguém apaga `brand-rainbow-image` por parecer decoração, e `--brand-rainbow`
 *    deixa de ser declarado no elemento (rodada 88);
 * 3. alguém acrescenta o halo do botão ao `Checkbox` ou ao `Radio`, onde o
 *    `::after` **já é o alvo de toque de 44px**.
 *
 * Nenhum dos três derruba tipo nem lint.
 */

const RAIZ = join(process.cwd(), "src/components/ui")
const fonte = (nome: string) =>
  readFileSync(join(RAIZ, `${nome}.tsx`), "utf8").replace(
    /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    " "
  )

/** As classes de cada peça que veste a marca. */
const PORTADORES = {
  "button/brand": buttonVariants({ variant: "brand" }),
  "button/brandOutline": buttonVariants({ variant: "brandOutline" }),
  "badge/brand": badgeVariants({ variant: "brand" }),
  "checkbox/brand": checkboxVariants({ variant: "brand" }),
  "radio/brand": radioVariants({ variant: "brand" }),
  "radio-group/brandCard": radioGroupItemVariants({ variant: "brandCard" }),
} as const

describe("contorno de marca", () => {
  it("1. toda peça de marca declara `--brand-rainbow` no próprio elemento", () => {
    for (const [nome, classes] of Object.entries(PORTADORES)) {
      // É `brand-rainbow-image` quem declara a variável no elemento; os
      // pseudo-elementos herdam daqui o valor já substituído. Um `var()` dentro
      // de uma propriedade personalizada resolve onde ela é **declarada**.
      expect(classes.split(/\s+/), nome).toContain("brand-rainbow-image")
      expect(classes, nome).toContain("--brand-fill:")
      expect(classes, nome).toContain("_border-box]")
    }
  })

  it("2. o núcleo mora no pseudo, e nunca no elemento", () => {
    // Só conta `bg-` que **pinta**: os modificadores (`bg-clip-padding`,
    // `bg-origin-*`, posição, repetição) não põem cor nenhuma.
    const NAO_PINTA =
      /^bg-(clip|origin|blend|repeat|no-repeat|auto|cover|contain|fixed|local|scroll|top|bottom|left|right|center)/
    const pinta = (classe: string) =>
      /(^|:)bg-/.test(classe) &&
      !/before:|after:/.test(classe) &&
      !NAO_PINTA.test(classe.replace(/^.*:/, ""))

    for (const [nome, classes] of Object.entries(PORTADORES)) {
      expect(classes.split(/\s+/), nome).toContain("isolate")
    }

    // A armadilha de empilhamento: tinta no **próprio elemento** pinta antes do
    // `::before` a `-z-10` e o esconde. A régua é o estado em que o contorno
    // aparece.
    //
    // No `Button` e no `Badge` a marca está sempre acesa, então o elemento não
    // pinta em repouso — nenhum `bg-` sem pseudo.
    for (const nome of ["button/brand", "button/brandOutline", "badge/brand"] as const) {
      expect(PORTADORES[nome].split(/\s+/).filter(pinta), nome).toEqual([])
    }

    // Nos três controles de escolha ela só acende marcada, e desmarcado é a
    // superfície do sistema — `bg-background` na caixa é o que se **deve** ver
    // enquanto o pseudo está a zero. O que não pode existir é tinta sob o
    // contorno: nenhum `bg-` atrás de um variante de marcado.
    for (const nome of [
      "checkbox/brand",
      "radio/brand",
      "radio-group/brandCard",
    ] as const) {
      const sobMarcado = PORTADORES[nome]
        .split(/\s+/)
        .filter((c) => /checked/.test(c))
        .filter(pinta)
      expect(sobMarcado, nome).toEqual([])
    }
  })

  it("3. o alvo de toque de 44px dos dois átomos sobrevive à marca", () => {
    for (const nome of ["checkbox", "radio"]) {
      // Ele mora na **base** do `cva`, e por isso aparece nas duas variantes.
      const variantes =
        nome === "checkbox"
          ? [checkboxVariants({ variant: "default" }), PORTADORES["checkbox/brand"]]
          : [radioVariants({ variant: "default" }), PORTADORES["radio/brand"]]
      for (const classes of variantes) {
        expect(classes, nome).toContain("after:-inset-3.5")
      }
    }
  })

  it("4. nenhum dos dois átomos ganha halo — o `::after` já está ocupado", () => {
    for (const nome of ["checkbox", "radio"]) {
      const src = fonte(nome)
      expect(src, nome).not.toMatch(/after:blur|after:-inset-1\b|after:-inset-0\.5/)
      expect(src, nome).not.toContain("after:bg-(image:--brand-rainbow)")
    }
  })

  it("5. o arco-íris só aparece marcado, e ele esmaece", () => {
    expect(PORTADORES["checkbox/brand"]).toContain(
      "data-[state=checked]:before:opacity-100"
    )
    expect(PORTADORES["radio/brand"]).toContain(
      "data-[state=checked]:before:opacity-100"
    )
    expect(PORTADORES["radio-group/brandCard"]).toContain(
      "has-data-checked:before:opacity-100"
    )
    for (const nome of [
      "checkbox/brand",
      "radio/brand",
      "radio-group/brandCard",
    ] as const) {
      // Desmarcado é o fio do sistema, e a passagem é uma transição e não um
      // estalo: `background-image` não interpola entre um degradê e `none`, e é
      // por isso que quem liga e desliga é a opacidade.
      expect(PORTADORES[nome], nome).toContain("before:opacity-0")
      expect(PORTADORES[nome], nome).toContain("before:transition-opacity")
      expect(PORTADORES[nome], nome).toContain(
        "before:duration-(--duration-fast)"
      )
    }
  })

  it("6. o cartão de marca troca o realce, e não o soma", () => {
    const marca = PORTADORES["radio-group/brandCard"]
    const sistema = radioGroupItemVariants({ variant: "card" })
    // A lavagem de 5% e o contorno `primary-accent` são o realce do `card`.
    // Somá-los à marca daria dois sinais de seleção na mesma aresta.
    expect(sistema).toContain("has-data-checked:border-primary-accent/60")
    expect(marca).not.toContain("has-data-checked:border-primary-accent")
    expect(marca).not.toContain("has-data-checked:bg-primary")
    // E o que os dois cartões dividem continua dividido.
    for (const classe of [
      "min-h-11",
      "has-[:focus-visible]:ring-3",
      "has-[:disabled]:cursor-not-allowed",
    ]) {
      expect(marca, classe).toContain(classe)
    }
  })

  it("7. os oito controles de campo seguem sem marca", () => {
    // A régua de `field-control-ladder` não muda com esta rodada: a marca entra
    // nos controles de **escolha**, e o campo de texto continua fora — cinco
    // tentativas recusadas na tela, e `fieldFocusRingClassName` é o anel dele.
    for (const nome of [
      "input",
      "textarea",
      "native-select",
      "select",
      "combobox",
      "date-picker",
      "form-picker-popover",
      "input-group",
    ]) {
      expect(fonte(nome), nome).not.toMatch(/--brand-|brand-rainbow/)
    }
  })
})
