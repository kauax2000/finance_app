import { describe, expect, it } from "vitest"

import {
  containerGutters,
  containerSizes,
  containerStacks,
  containerVariants,
  DEFAULT_CONTAINER_SIZE,
} from "./container"

/**
 * A escada do `Container`, trancada.
 *
 * O Tailwind varre o código como texto: uma classe que só existe depois de uma
 * interpolação nunca chega ao CSS. Por isso `containerSizes` e o `cva` são dois
 * lugares, e este teste é o que impede que eles divirjam. Os degraus distintos
 * estão em `escadas.test.ts`.
 */
describe("Container", () => {
  /**
   * As tabelas existem para as páginas que desenham a régua poderem iterá-las;
   * o `cva` existe porque só literal chega ao CSS. Divergir é o defeito.
   */
  it("as tabelas e o cva não divergem", () => {
    for (const [size, esperado] of Object.entries(containerSizes)) {
      const cls = containerVariants({
        size: size as keyof typeof containerSizes,
      })
      expect(cls.split(" ")).toContain(esperado)
    }
    for (const [gutter, esperado] of Object.entries(containerGutters)) {
      if (!esperado) continue
      const cls = containerVariants({
        gutter: gutter as keyof typeof containerGutters,
      })
      for (const parte of esperado.split(" ")) {
        expect(cls.split(" ")).toContain(parte)
      }
    }
    // O ritmo também: a página do `Container` itera esta tabela para desenhar
    // os exemplos, e ela ficava de fora da guarda (rodada 158).
    for (const [stack, esperado] of Object.entries(containerStacks)) {
      if (!esperado) continue
      const cls = containerVariants({
        stack: stack as keyof typeof containerStacks,
      })
      for (const parte of esperado.split(" ")) {
        expect(cls.split(" ")).toContain(parte)
      }
    }
  })

  /**
   * `default` dizia *o padrão* em vez de dizer a medida — o nome que já saiu
   * de `Button`, `Input`, `SelectTrigger` e `NativeSelect`.
   */
  it("não existe um degrau chamado default", () => {
    expect(Object.keys(containerSizes)).not.toContain("default")
  })

  /**
   * O padrão é declarado uma vez, no `cva`. `DEFAULT_CONTAINER_SIZE` existe
   * para o `data-size` não o adivinhar, e este teste é o que impede os dois de
   * se separarem.
   */
  it("o padrão é md, e a constante concorda com o cva", () => {
    expect(DEFAULT_CONTAINER_SIZE).toBe("md")
    expect(containerVariants({})).toBe(
      containerVariants({ size: DEFAULT_CONTAINER_SIZE, gutter: "none" })
    )
  })

  /**
   * 1024 tinha zero usos no repositório e era o padrão. Ele saiu, e esta
   * asserção é o que impede que volte pela porta dos fundos — como o
   * `in-data-[variant=dialog]` do `Command`, que sobreviveu à remoção da
   * variante e passou a não casar com nada.
   */
  it("max-w-5xl não voltou para a escada", () => {
    expect(Object.values(containerSizes)).not.toContain("max-w-5xl")
  })

  /**
   * A calha é o que tornava o componente inadotável: a casca do app já é dona
   * dela, e somar a do `Container` derrubava o conteúdo de 343 para 311px a
   * 375. `none` de padrão é o que faz as nove cascas do app poderem adotá-lo.
   */
  it("a calha é opt-in, e o padrão não desenha recuo nenhum", () => {
    expect(containerGutters.none).toBe("")
    expect(containerVariants({})).not.toMatch(/(?:^|\s)px-\d/)
    expect(containerVariants({ gutter: "page" })).toMatch(/(?:^|\s)px-4(?:\s|$)/)
  })

  /**
   * A gramática é a que o app renderiza — um degrau, quebrando em 768 —, e não
   * a que este arquivo inventava, com dois degraus em 640 e 1024.
   */
  it("a calha quebra em md, e em mais nenhum ponto", () => {
    const page = containerGutters.page
    expect(page).toMatch(/(?:^|\s)md:px-\d/)
    expect(page).not.toMatch(/(?:^|\s)(?:sm|lg|xl):px-/)
  })
})
