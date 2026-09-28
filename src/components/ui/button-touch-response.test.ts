import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"
import { cn } from "@/lib/utils"

/**
 * Todo peso preenchível do `Button` responde ao **toque**, e não só ao cursor.
 *
 * Este teste existe por causa de um item de backlog nomeado no `AGENTS.md`:
 * *"`Button variant="tertiary"` não tem par `active:` — vale para o app inteiro:
 * todo botão terciário fica sem resposta ao toque."*
 *
 * A razão é mecânica e vale para o Tailwind v4 inteiro: `hover:` compila dentro
 * de **`@media (hover: hover)`**, então num telefone ele não existe. Um controle
 * cujo único realce é `hover:` fica inerte no dedo — a pessoa toca e a interface
 * não responde. O resto do sistema já resolvia isso escrevendo o par à mão em
 * `toggle.tsx`, `tabs.tsx`, `menubar.tsx`, `item.tsx` e `calendar.tsx`; o
 * conserto passou a morar na origem.
 *
 * E o par escuro entra junto pela aritmética que o `ThemeToggle` já pagou:
 * `&:active` e `&:is(.dark *)` empatam em especificidade, e o `dark:` é emitido
 * depois — sem `dark:active:`, o realce de toque perderia para o de tema, calado
 * e só num tema.
 *
 * `link` fica de fora de propósito: ele não preenche nada, e o realce dele é o
 * sublinhado. `destructive`, `primary`, `secondary`, `tertiary` e `outline`
 * pintam fundo, e por isso todos precisam do par.
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
  it("1. `tertiary` responde ao toque como ao cursor — hoje pelo disco, não pela cor", () => {
    // Era o item de backlog da rodada 29b: `hover:` compila dentro de
    // `@media (hover: hover)`, e sem o par `active:` o terciário não devolvia
    // nada ao toque. Desde a rodada 99 o hover dos pesos que preenchem não é
    // `hover:bg-*` — é o raio do disco (`--button-fill`) subindo a 100% —, e
    // a regra continua a mesma: o que o cursor liga, o toque liga.
    const classes = buttonVariants({ variant: "tertiary" })
    expect(classes).toContain("hover:[--button-fill:100%]")
    expect(classes).toContain("active:[--button-fill:100%]")
    expect(classes).not.toMatch(/\bhover:bg-/)
    expect(classes).not.toMatch(/\bactive:bg-/)
  })

  /**
   * As que ainda **não** têm o par: nenhuma. A lista chegou a ter quatro
   * nomes (a rodada 29b consertou `tertiary`, a 78 o `primary`, o plano 3 os
   * outros três). Ela fica, vazia, porque a asserção 3 é o que impede uma
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

  // **Por que o traço não é `text-decoration`.** Esta asserção exigia
  // `" underline "` até a rodada 92, quando a emenda foi medida: o
  // `::first-letter` da base — a maiúscula inicial do CTA — cria caixa
  // separada para a primeira letra, e a decoração propagada sai partida em
  // dois segmentos. Sublinhar também o `::first-letter`,
  // `text-decoration-skip-ink: none` e mover a decoração para o `<span>`
  // **mantêm** a emenda; só a camada de `background` a elimina. Se alguém
  // devolver `underline` aqui, a emenda volta junto.
  //
  // **E o traço voltou a andar.** As rodadas 91–93 varreram e recuaram, e a 94
  // encerrou pedindo a troca seca; o dono trouxe depois o `link-button` do
  // 21st como referência, e com ele a mecânica que faltava — `scaleX` com a
  // origem trocando de lado. A diferença para as rodadas antigas é que agora
  // **não há traço em repouso**: ele nasce da esquerda no cursor e recolhe
  // para a direita na saída.
  it("5. os cinco pesos que preenchem vestem o disco, e só eles", () => {
    // O hover é um disco da cor do hover que nasce sob o ponteiro
    // (`@utility button-fill`, rodada 99). Cada peso declara a cor e liga o
    // raio; a transição resolvida pelo `tailwind-merge` tem de carregar
    // `--button-fill` **e** manter `translate`, porque a variante restata a
    // lista da base em vez de acrescentar a ela.
    // O primário entrou na rodada 148, quando ficou cru.
    for (const variant of ["primary", "secondary", "tertiary", "outline", "destructive"] as const) {
      const cru = buttonVariants({ variant })
      expect(cru, variant).toContain("button-fill")
      expect(cru, variant).toMatch(/\[--button-fill-color:/)
      const resolvido = cn(cru)
      expect(resolvido, variant).toMatch(/transition-\[[^\]]*--button-fill\]/)
      expect(resolvido, variant).toMatch(/transition-\[[^\]]*\btranslate\b[^\]]*\]/)
    }
    // Quem tinha par `dark:` no hover antigo tem par `dark:` na cor do disco —
    // e os alfas são compostos, não copiados (o disco pinta sobre o repouso).
    expect(buttonVariants({ variant: "tertiary" })).toMatch(/dark:\[--button-fill-color:color-mix\(/)
    expect(buttonVariants({ variant: "outline" })).toMatch(/dark:\[--button-fill-color:color-mix\(/)
    expect(buttonVariants({ variant: "destructive" })).toMatch(/dark:\[--button-fill-color:color-mix\(/)
    // `brand`, `brandOutline` e `link` têm hover próprio e não preenchem — decisão do dono.
    for (const variant of ["brand", "brandOutline", "link"] as const) {
      expect(buttonVariants({ variant }), variant).not.toContain("button-fill")
    }
    const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    expect(CSS).toMatch(/@property --button-fill \{\s*syntax: "<length-percentage>"/)
    expect(CSS).toMatch(/@utility button-fill \{[\s\S]*radial-gradient\(\s*circle at var\(--button-mx\) var\(--button-my\)/)
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

    const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    const corpo = CSS.slice(CSS.indexOf("@utility link-sweep {"))
    const utility = corpo.slice(0, corpo.indexOf("\n}"))
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
