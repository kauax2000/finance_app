import { describe, expect, it } from "vitest"

import { lerFonte, semComentarios } from "@/test/fonte"

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
 * O Tailwind varre o código como texto, então as tabelas são literais, e o
 * `cva` as lê em vez de repetir as classes. Os degraus distintos estão em
 * `escadas.test.ts`.
 */
describe("Container", () => {
  /**
   * O `cva` referencia as tabelas no fonte. Só o resultado não basta: literais
   * idênticos colados de volta no `cva` produziriam as mesmas classes.
   */
  it("o cva do fonte referencia as três tabelas", () => {
    const codigo = semComentarios(lerFonte("src/components/ui/container.tsx"), "tudo")
    const cva = codigo.slice(codigo.indexOf("const containerVariants = cva("))
    expect(cva).toMatch(/size:\s*containerSizes\b/)
    expect(cva).toMatch(/gutter:\s*containerGutters\b/)
    expect(cva).toMatch(/stack:\s*containerStacks\b/)
  })

  /**
   * Cada tabela alimenta o `cva`: o resultado de cada chave contém as classes
   * dela. Se alguém voltar a escrever literais no `cva`, a divergência aparece
   * aqui — e o catálogo (`ds:catalog`) lê as chaves das mesmas tabelas.
   */
  it("o cva lê as tabelas, e cada chave aplica as classes dela", () => {
    const tabelas = {
      size: containerSizes,
      gutter: containerGutters,
      stack: containerStacks,
    } as const
    for (const [eixo, tabela] of Object.entries(tabelas)) {
      for (const [chave, esperado] of Object.entries(tabela)) {
        if (!esperado) continue
        const cls = containerVariants({ [eixo]: chave }).split(" ")
        for (const parte of esperado.split(" ")) expect(cls).toContain(parte)
      }
    }
  })

  /** `default` dizia o padrão em vez de dizer a medida, como nos outros controles. */
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
   * O degrau de 1024 não tem uso e não volta pela porta dos fundos (uma classe `in-
   * data-[variant=dialog]` sobreviveu assim no `Command` e deixou de casar com algo).
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
