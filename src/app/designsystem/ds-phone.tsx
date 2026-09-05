"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { mobileFormSheetContentClassName } from "@/components/ui/mobile-sheet-form-chrome"
import { cn } from "@/lib/utils"

/**
 * # A moldura de telefone do catálogo
 *
 * ## Por que ela é um `<iframe>`
 *
 * A demonstração "Em folha no telefone" enquadrava o chrome numa `<div>` de
 * 384px e o chamava de telefone. **Nenhuma medida de telefone estava ativa**:
 * os componentes usam breakpoints de *viewport* (`sm:`, `md:`), não container
 * queries, e o viewport do catálogo é o da janela. Medido a 1443px, as seis
 * declarações do chrome resolviam todas no ramo desktop:
 *
 * | | telefone | o que saía |
 * | --- | --- | --- |
 * | corpo, recuo lateral | `px-4` = 16px | **20px** (`sm:px-5`) |
 * | cabeçalho, topo | `pt-2` = 8px | **12px** (`md:pt-3`) |
 * | rodapé | `flex-col-reverse` | **`row` + `justify-end`** |
 *
 * Era por isso que o botão saía `justify-end` **e** `w-full` ao mesmo tempo —
 * duas coisas que nunca acontecem juntas num telefone. Um catálogo que
 * demonstra o contrário do que ensina é o defeito que esta base já achou
 * várias vezes.
 *
 * Um `<iframe>` tem viewport próprio, então `@media (min-width: 40rem)` volta a
 * significar o que diz. E **não** é um `scale()`: escalar mentiria sobre o
 * pixel de CSS, que é exatamente o defeito que esta peça existe para não
 * repetir.
 *
 * ## O que ela não conserta
 *
 * Ela troca o viewport do **CSS**, e nada mais. `useIsMobile` lê
 * `window.matchMedia` da janela de fora; os portais do Radix (`Dialog`,
 * `Popover`, `Select`) vão para o `document.body` do pai e escapam do
 * telefone; e `env(safe-area-inset-bottom)` vale zero aqui, porque não há
 * aparelho. As duas demonstrações que ela serve não dependem de nenhum dos
 * três — quem depender precisa saber disso antes.
 *
 * ## Ela mora aqui, e não em `components/ui/`
 *
 * Lá ela cobraria entrada no `registry`, página própria e o `taxonomy.test.ts`,
 * para um primitivo que só a documentação usa. É o mesmo argumento que o
 * `ds-doc.tsx` escreve sobre si — e é por isso que o nome segue o `ds-*` dos
 * vizinhos.
 */

/**
 * A largura, escrita uma vez. 375 é o iPhone SE/13 mini em pixels de CSS — o
 * telefone corrente mais estreito, e o número que põe `sm:` (640) fora de
 * alcance com folga, mesmo se uma barra de rolagem clássica comer 15px.
 */
export const PHONE_FRAME_WIDTH = 375

/** 667 é o par de 375 no iPhone SE/8: o telefone corrente mais curto. */
export const PHONE_FRAME_HEIGHT = 667

/**
 * O que a tela reserva acima da folha, e o número não é escolhido: é o
 * `max(0.5rem, env(safe-area-inset-top))` de `--sheet-drawer-h`
 * (`sheet.tsx:175`), que é o que uma folha `fillMobileViewport` deixa de fora.
 *
 * A primeira versão desta peça reservava 96px, para "deixar ver a tela atrás".
 * Era ficção: **oito arquivos do app abrem a folha de formulário com
 * `fillMobileViewport`**, e ela ocupa quase o viewport inteiro. E a ficção
 * cobrava caro — com o véu sobre uma tela vazia, a folha `bg-background` media
 * **1,04:1** contra o fundo velado no tema escuro. Invisível.
 */
const PHONE_FRAME_INSET = "pt-2"

/** A tela: o fundo do app, com a folha ancorada na base. */
const PHONE_FRAME_SCREEN =
  "relative flex h-full w-full flex-col justify-end overflow-hidden bg-background"

/**
 * O documento de um iframe não herda nada. Estas três linhas são tudo o que
 * precisa ser CSS cru. O `overflow:hidden` também tira a barra de rolagem da
 * conta dos 375 — quem rola é a folha, por dentro.
 */
const PHONE_FRAME_RESET = "html,body{height:100%;margin:0;overflow:hidden}"

/**
 * Clona o CSS do documento pai, e mantém a cópia em dia.
 *
 * Não lê o disco nem reescreve nada: são os **mesmos nós** que a página já tem
 * no `<head>` — o `<link>` do chunk e as `<style>` que o dev do Next injeta.
 *
 * **A sincronia é incremental, e isso não é otimização.** A primeira versão
 * refazia o `<head>` inteiro a cada mutação, e o `next-themes` roda com
 * `disableTransitionOnChange`: ele injeta e remove uma `<style>` a **cada troca
 * de tema**. O resultado era medível — trocar o tema derrubava todo o CSS do
 * iframe por um quadro, o conteúdo colapsava sem estilo, e o `useScrollFade`
 * media a folha sem transbordo e desligava a dissolução. Ela ficava `off` com
 * 50px de rolagem.
 */
function criarVestidor(alvo: Document, aoVestir: () => void) {
  const clones = new Map<Node, HTMLElement>()

  // `<base>` primeiro: um `about:blank` não tem URL de base, e sem ela um
  // `url(...)` relativo dentro de uma `<style>` clonada — as `@font-face` do
  // `next/font` — não resolveria.
  const base = alvo.createElement("base")
  base.href = document.baseURI
  const reset = alvo.createElement("style")
  reset.textContent = PHONE_FRAME_RESET
  alvo.head.replaceChildren(base, reset)

  return function sincronizar() {
    const novos: HTMLLinkElement[] = []
    for (const no of document.head.querySelectorAll<HTMLElement>(
      "link[rel=stylesheet], style"
    )) {
      if (clones.has(no)) continue
      const clone = alvo.importNode(no, true) as HTMLElement
      clones.set(no, clone)
      alvo.head.append(clone)
      // `instanceof HTMLLinkElement` seria contra a classe da janela de fora, e
      // o clone pertence ao documento de dentro.
      if (clone.tagName === "LINK") novos.push(clone as HTMLLinkElement)
    }
    for (const [no, clone] of clones) {
      if (no.isConnected) continue
      clone.remove()
      clones.delete(no)
    }

    // Pintar antes de a folha chegar é FOUC garantido. Um `<link>` que já está
    // no cache pode nunca disparar `load`, então o caminho síncrono (`.sheet`
    // já preenchido) tem que existir, e o `error` fecha o resto.
    const pendentes = novos.filter((l) => !l.sheet)
    if (pendentes.length === 0) {
      aoVestir()
      return
    }
    let falta = pendentes.length
    const pronto = () => {
      if (--falta === 0) aoVestir()
    }
    for (const l of pendentes) {
      l.addEventListener("load", pronto, { once: true })
      l.addEventListener("error", pronto, { once: true })
    }
  }
}

/** Espelha a identidade visual do `<html>` de fora para o de dentro. */
function espelharRaiz(alvo: Document) {
  const raiz = document.documentElement
  // A classe carrega as três variáveis de fonte do `next/font` **e** o tema —
  // verificado: sem ela a fonte cai no fallback do sistema. O `style` carrega
  // o `color-scheme`, que é o que pinta campo nativo e barra de rolagem.
  alvo.documentElement.className = raiz.className
  alvo.documentElement.setAttribute("style", raiz.getAttribute("style") ?? "")
}

function PhoneFrame({
  height = PHONE_FRAME_HEIGHT,
  title = "Prévia numa tela de telefone",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  height?: number
  /** O nome acessível do iframe. Sem ele, o leitor anuncia só "frame". */
  title?: string
}) {
  const [documento, setDocumento] = React.useState<Document | null>(null)
  const [vestido, setVestido] = React.useState(false)

  const montar = React.useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return
    const d = iframe.contentDocument
    if (!d) return

    // `about:blank` de mesma origem: o documento existe de forma síncrona, mas
    // escrevê-lo garante `<head>` e `<body>` limpos em todos os navegadores.
    d.open()
    d.write("<!doctype html><html><head></head><body></body></html>")
    d.close()

    espelharRaiz(d)
    const sincronizarCss = criarVestidor(d, () => setVestido(true))
    sincronizarCss()
    setDocumento(d)

    // O tema é espelhado por observador, e não por `useTheme()`: o
    // `resolvedTheme` é `undefined` até o `next-themes` montar, e o que
    // interessa aqui é a string inteira do `className` — as fontes vêm nela.
    // O observador do `<head>` é o que mantém o HMR vivo lá dentro: sem ele o
    // iframe congela no CSS de quando montou, justo na peça que existe para se
    // iterar cromagem de telefone.
    const observadorRaiz = new MutationObserver(() => espelharRaiz(d))
    observadorRaiz.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    const observadorCss = new MutationObserver(sincronizarCss)
    observadorCss.observe(document.head, { childList: true })

    return () => {
      observadorRaiz.disconnect()
      observadorCss.disconnect()
      setDocumento(null)
      setVestido(false)
    }
  }, [])

  return (
    <div
      data-slot="phone-frame"
      // O `ring` é a aresta do aparelho, e ele entrou por medição: a tela é
      // `bg-background` dentro de um `Preview` `bg-card`, e no tema escuro isso
      // dá **1,1:1** — sem aresta, o telefone não lê como objeto, lê como um
      // buraco. É `ring` e não `border` porque box-shadow não entra no recorte,
      // então o raio continua aparando a folha por dentro.
      //
      // E é só isso: sem corpo de aparelho, sem entalhe, sem barra de status,
      // sem sombra externa. O `Preview` já é a superfície com moldura, e cartão
      // dentro de cartão é sempre errado.
      className={cn(
        "shrink-0 overflow-hidden rounded-3xl ring-1 ring-border",
        className
      )}
      style={{ width: PHONE_FRAME_WIDTH, height }}
      {...props}
    >
      <iframe
        ref={montar}
        title={title}
        className={cn(
          "block size-full border-0 transition-opacity duration-(--duration-fast) ease-(--ease-out)",
          vestido ? "opacity-100" : "opacity-0"
        )}
      />
      {documento
        ? createPortal(
            <div
              data-slot="phone-frame-screen"
              className={cn(PHONE_FRAME_SCREEN, PHONE_FRAME_INSET)}
            >
              {children}
            </div>,
            documento.body
          )
        : null}
    </div>
  )
}

/**
 * A folha subindo da base da tela.
 *
 * **Ela é `bg-background` com `border-t`, e não `bg-card`** — é o que
 * `EdgePanel` de fato pinta (`edge-panel.tsx:31,50`). As duas demonstrações
 * usavam `bg-card` porque o `Preview` também é `bg-card`, e ali uma folha
 * `bg-background` não se separava de nada. Dentro do telefone ela se separa do
 * `Preview`, não do que está atrás dela — e o que está atrás é uma faixa de
 * 8px, porque a folha preenche a tela.
 */
function PhoneFrameSheet({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <>
      <div aria-hidden className="absolute inset-0 bg-overlay" />
      <div
        data-slot="phone-frame-sheet"
        className={cn(
          // O mesmo casco que um `SheetContent` real veste. É dele que vem o
          // recuo de baixo — a moldura à mão não o tinha, e o botão de salvar
          // ficava colado na borda: `padding-bottom: 0`, medido. Copiar a
          // string aqui seria a segunda cópia da área segura.
          mobileFormSheetContentClassName,
          // O que o `EdgePanel` acrescenta, e que ali vem da superfície.
          "border-t border-border bg-background",
          // `h-full`, e não `max-h-full`: `fillMobileViewport` é altura fixa
          // (`h-(--sheet-drawer-h)`), não teto. É o que faz o corpo rolar de
          // forma determinística em vez de depender do tanto de conteúdo.
          "relative h-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

export { PhoneFrame, PhoneFrameSheet }
