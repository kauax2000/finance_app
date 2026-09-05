import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"

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
 * E o par escuro entra junto pela aritmética que o `AppThemeToggle` já pagou:
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
  it("1. `tertiary` tem par `active:` — era o item de backlog", () => {
    const classes = buttonVariants({ variant: "tertiary" })
    expect(classes).toContain("hover:bg-muted")
    expect(classes).toContain("active:bg-muted")
    // O par escuro, pela aritmética de especificidade acima.
    expect(classes).toContain("dark:hover:bg-muted/50")
    expect(classes).toContain("dark:active:bg-muted/50")
  })

  /**
   * As que ainda **não** têm o par, medidas.
   *
   * A rodada que criou este teste foi autorizada a consertar `tertiary`, que é
   * o que a seta do carrossel veste. Medindo as outras, o defeito é maior do que
   * o backlog dizia: **quatro das cinco** variantes que pintam fundo ficam
   * inertes no dedo, e não uma.
   *
   * A lista fica escrita em vez de o teste ser afrouxado, e a asserção 3 é o que
   * impede que ela **cresça**: uma variante nova nasce com o par, ou o teste cai.
   * Cada nome sai daqui quando o conserto dele for autorizado.
   */
  const PENDENTES = ["primary", "secondary", "outline", "destructive"] as const

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

  it("4. `link` não é cobrado — ele não preenche, sublinha", () => {
    const classes = buttonVariants({ variant: "link" })
    expect(classes).toContain("hover:underline")
    expect(classes).not.toMatch(/hover:bg-/)
  })
})
