import { readFileSync } from "node:fs"
import { readdirSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { PHONE_FRAME_WIDTH } from "./ds-frame"

/**
 * A moldura de telefone, trancada.
 *
 * Ela existe por um defeito medido: a demonstração "Em folha no telefone"
 * enquadrava o chrome numa `<div>` de 384px e o chamava de telefone. Como os
 * componentes usam breakpoints de **viewport**, e não container queries, a
 * 1443px tudo resolvia no ramo desktop — o corpo saía com 20px de recuo em vez
 * de 16, o cabeçalho com 12 em vez de 8, e o rodapé `flex-row justify-end` em
 * vez de empilhado. O botão saía `justify-end` **e** `w-full` ao mesmo tempo.
 */

const FONTE = readFileSync(new URL("./ds-frame.tsx", import.meta.url), "utf8")

/** O mesmo fonte sem comentários — eles citam de propósito o que ela conserta. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

const DOCS = new URL("./docs/", import.meta.url)
const PAGINAS = readdirSync(DOCS)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => ({ nome: f, texto: readFileSync(new URL(f, DOCS), "utf8") }))

describe("moldura de telefone do catálogo", () => {
  it("1. mede 375, e o número é a frase inteira do componente", () => {
    expect(PHONE_FRAME_WIDTH).toBe(375)
    // O degrau `sm` do Tailwind. É por ficar abaixo dele que `sm:px-5`,
    // `md:pt-3` e `sm:flex-row` param de valer lá dentro — não há mais nada
    // que esta peça faça.
    expect(PHONE_FRAME_WIDTH).toBeLessThan(640)
    // Escrito uma vez: o resto do arquivo lê a constante.
    expect((CODIGO.match(/\b375\b/g) ?? []).length).toBe(1)
  })

  it("2. não escala nada — escalar mentiria sobre o pixel de CSS", () => {
    // Um `transform: scale()` daria a aparência de um telefone com o viewport
    // do desktop, que é o defeito que a peça existe para não repetir.
    expect(CODIGO).not.toMatch(/scale\(|\bzoom\b|transform:/)
  })

  it("3. nenhuma página do catálogo volta a desenhar a moldura à mão", () => {
    // A exceção nominal que vivia aqui era `docs/sheet-drag-handle.tsx`, e ela
    // saiu com a página: a do `drag-handle` demonstra o gesto em gavetas de
    // verdade, então não tem moldura à mão para isentar.
    const aMao = PAGINAS.filter(
      (p) => p.texto.includes("rounded-t-2xl") && p.texto.includes("bg-card")
    )
    expect(aMao.map((p) => p.nome)).toEqual([])

    // E as duas que a usam, usam.
    for (const nome of ["form.tsx", "mobile-sheet-form-chrome.tsx"]) {
      const p = PAGINAS.find((x) => x.nome === nome)!
      expect(p.texto, nome).toContain("PhoneFrame")
      expect(p.texto, nome).not.toContain("h-80")
    }
  })

  it("4. a folha veste o casco real, e não uma cópia da área segura", () => {
    expect(CODIGO).toContain("mobileFormSheetContentClassName")
    // A string da área segura mora numa peça só. Copiá-la aqui seria a segunda.
    expect(CODIGO).not.toContain("safe-area-inset-bottom")
    // E `h-full`, não `max-h-full`: `fillMobileViewport` é altura fixa, e é o
    // que faz o corpo rolar em vez de a folha crescer até caber.
    expect(CODIGO).toContain('"relative h-full"')
  })

  it("5. o iframe tem nome, e o documento dele não rola", () => {
    // Sem `title`, o leitor de tela anuncia só "frame".
    expect(CODIGO).toMatch(/title\s*=\s*"Prévia numa tela de telefone"/)
    expect(CODIGO).toContain("title={title}")
    // `overflow:hidden` é o que impede uma barra de rolagem clássica de comer
    // ~15px dos 375. Quem rola é a folha, por dentro.
    expect(CODIGO).toMatch(/html,body\{[^}]*overflow:hidden/)
  })

  it("6. o tema é espelhado por observador, e não por `useTheme`", () => {
    // `resolvedTheme` é `undefined` até o next-themes montar, e o que interessa
    // é a string inteira do `className`: as três variáveis de fonte vêm nela.
    expect(CODIGO).not.toContain("useTheme")
    expect(CODIGO).toMatch(/attributeFilter:\s*\["class",\s*"style"\]/)
    // O `style` carrega o `color-scheme`, que pinta campo nativo e barra.
    expect(CODIGO).toContain('raiz.getAttribute("style")')
  })

  it("7. o CSS clonado cobre os dois tipos de nó, e tem base", () => {
    // O `<link>` do chunk e as `<style>` que o dev do Next injeta — as
    // `@font-face` do next/font estão numa delas.
    expect(CODIGO).toContain("link[rel=stylesheet], style")
    // Um `about:blank` não tem URL de base: sem isto, um `url(...)` relativo
    // dentro de uma `<style>` clonada não resolveria.
    expect(CODIGO).toContain("document.baseURI")
  })

  it("8. todo observador é desligado — o mesmo que o carrossel tranca", () => {
    const criados = (CODIGO.match(/new MutationObserver/g) ?? []).length
    const desligados = (CODIGO.match(/\.disconnect\(\)/g) ?? []).length
    expect(criados).toBeGreaterThan(0)
    expect(desligados).toBe(criados)
  })

  it("9. a moldura não vira um segundo cartão", () => {
    // O `Preview` já é a superfície com moldura. O que delimita a tela é o
    // anel — e ele entrou por medição: `bg-background` dentro de um `bg-card`
    // dá 1,1:1 no tema escuro, ou seja, aresta nenhuma.
    expect(CODIGO).toContain("ring-1 ring-border")
    expect(CODIGO).not.toMatch(/className=\{cn\("shrink-0[^"]*bg-card/)
    expect(CODIGO).not.toContain("shadow-")
  })
})
