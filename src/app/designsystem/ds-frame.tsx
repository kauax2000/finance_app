"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import Image from "next/image"

import { ViewportWindowProvider } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import iphoneClay from "./assets/iphone-17-pro-clay.png"
import iphoneClayAro from "./assets/iphone-17-pro-clay-aro.png"

/**
 * # A moldura de viewport do catálogo
 *
 * É um `<iframe>` porque os componentes usam breakpoints de *viewport* (`sm:`, `md:`), e só um documento com
 * viewport próprio faz `@media (min-width: 40rem)` significar o que diz. Nada de `scale()`: escalar mentiria
 * sobre o pixel de CSS. `ViewportFrame` é a primitiva; o telefone é o `IphoneFrame`; `width="fluid"` dá a
 * moldura de desktop que a `Sidebar` precisa.
 *
 * - `useIsMobile` lê a janela de dentro (`ViewportWindowProvider`), e os portais do `Sheet` caem na moldura.
 * - O que abre aqui dentro nasce `modal={false}` (`useViewportModal()`): o `react-remove-scroll` travaria o
 *   `document` da página de fora, porque o React roda na janela de fora. Por isso o véu não aparece, e
 *   `env(safe-area-inset-*)` vale zero (não há aparelho).
 *
 * Mora aqui e não em `components/ui/` porque só a documentação a usa.
 */

/** A largura, escrita uma vez: 375 é o telefone corrente mais estreito e põe `sm:` (640) fora de alcance com folga. */
export const PHONE_FRAME_WIDTH = 375

/** O documento de um iframe não herda nada; o `overflow:hidden` tira a barra de rolagem da conta dos 375. */
const PHONE_FRAME_RESET = "html,body{height:100%;margin:0;overflow:hidden}"

/**
 * Clona o CSS do documento pai e mantém a cópia em dia, com os mesmos nós do `<head>` dele. A sincronia é
 * incremental: refazer o `<head>` a cada mutação derrubava o CSS do iframe por um quadro a cada troca de tema
 * (o `next-themes` injeta e remove uma `<style>`), e o `useScrollFade` media a folha sem transbordo.
 */
function criarVestidor(alvo: Document, aoVestir: () => void) {
  const clones = new Map<Node, HTMLElement>()

  // `<base>` primeiro: um `about:blank` não tem URL de base, e o `url(...)` relativo das `@font-face` não resolveria.
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
      // `instanceof HTMLLinkElement` seria contra a classe da janela de fora.
      if (clone.tagName === "LINK") novos.push(clone as HTMLLinkElement)
    }
    for (const [no, clone] of clones) {
      if (no.isConnected) continue
      clone.remove()
      clones.delete(no)
    }

    // Um `<link>` já em cache pode nunca disparar `load`: o caminho síncrono (`.sheet` preenchido) tem que existir.
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
  // A classe carrega as variáveis de fonte do `next/font` e o tema; o `style`, o `color-scheme` (campo nativo e barra de rolagem).
  alvo.documentElement.className = raiz.className
  alvo.documentElement.setAttribute("style", raiz.getAttribute("style") ?? "")
}

type ViewportFrameProps = Omit<React.ComponentProps<"div">, "title" | "width"> & {
  /** `"fluid"` toma a largura de quem contém (moldura de desktop); um número é largura fixa em pixels de CSS. */
  width?: number | "fluid"
  height: number
  /** O nome acessível do iframe. Sem ele, o leitor anuncia só "frame". */
  title: string
  /** Classes da tela, dentro do documento da moldura. */
  screenClassName?: string
}

function ViewportFrame({
  width = "fluid",
  height,
  title,
  className,
  screenClassName,
  style,
  children,
  ...props
}: ViewportFrameProps) {
  const [documento, setDocumento] = React.useState<Document | null>(null)
  const [vestido, setVestido] = React.useState(false)
  const moldura = React.useRef<HTMLDivElement>(null)
  const [raio, setRaio] = React.useState<string>()

  // O raio da moldura desce como `--top-bar-r`: o borrão do `backdrop-filter` ignora o recorte de todo ancestral e só respeita o raio do próprio elemento.
  // Vai na tela e não no `<html>`, que o `espelharRaiz` reescreve a cada troca de tema.
  React.useEffect(() => {
    if (moldura.current) setRaio(getComputedStyle(moldura.current).borderRadius)
  }, [className])

  const montar = React.useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return
    const d = iframe.contentDocument
    if (!d) return

    // `about:blank` de mesma origem: escrevê-lo garante `<head>` e `<body>` limpos.
    d.open()
    d.write("<!doctype html><html><head></head><body></body></html>")
    d.close()

    espelharRaiz(d)
    const sincronizarCss = criarVestidor(d, () => setVestido(true))
    sincronizarCss()
    setDocumento(d)

    // Observador e não `useTheme()` (`resolvedTheme` é `undefined` até montar; as fontes vêm no `className`);
    // o do `<head>` mantém o HMR vivo lá dentro.
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
      ref={moldura}
      data-slot="viewport-frame"
      // O `ring` é a aresta do aparelho (no escuro a tela mede 1,1:1 contra o `Preview`); `ring` e não `border`, para o raio continuar aparando a folha.
      // Sem corpo, entalhe nem sombra: cartão dentro de cartão é sempre errado.
      className={cn(
        "overflow-hidden ring-1 ring-border",
        width === "fluid" ? "w-full" : "shrink-0",
        className
      )}
      style={{ width: width === "fluid" ? undefined : width, height, ...style }}
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
            // O provedor faz `useIsMobile` e os portais do `Sheet` enxergarem esta janela.
            <ViewportWindowProvider window={documento.defaultView}>
              <div
                data-slot="viewport-frame-screen"
                className={cn("relative flex size-full flex-col", screenClassName)}
                style={
                  raio ? ({ "--top-bar-r": raio } as React.CSSProperties) : undefined
                }
              >
                {children}
              </div>
            </ViewportWindowProvider>,
            documento.body
          )
        : null}
    </div>
  )
}

/**
 * # O iPhone 17 Pro Clay
 *
 * A moldura do iPhone 17 Pro Clay da Asylab (asylab.com/resources/freebies), com a tela vazada, extraída do PSD.
 * `IPHONE_TELA` é a caixa da tela em porcentagem da imagem (camada "MASK SCREEN", 1634 × 3549 num aparelho de
 * 1773 × 3666); as faixas seguras são porcentagem da tela (62 e 34 pontos de 874; a de cima cobre a Dynamic
 * Island). O canto é o círculo pelo ponto a 45° da máscara, senão o retângulo escapa pela curva do aparelho.
 */
export const IPHONE_TELA = {
  left: 3.95,
  top: 1.58,
  width: 92.16,
  height: 96.81,
  safeTop: 7.1,
  safeBottom: 3.9,
  radiusX: 15.9,
  radiusY: 7.3,
}

/** O degradê do aparelho, as paradas da marca descendo do coral ao teal. */
const tintaClayClassName =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--brand-coral),var(--brand-magenta)_35%,var(--brand-violet)_60%,var(--brand-blue)_82%,var(--brand-teal))] mix-blend-multiply"

/**
 * O corpo do aparelho: a tela é quem chama (o primeiro filho, na caixa de `IPHONE_TELA`), e por cima vão a
 * moldura e a tinta, sem eventos. A tinta é `multiply` sobre o Clay branco: a face leva o degradê a meia
 * força; o aro, os botões e a ilha o levam cheio.
 */
function IphoneBody({ className, style, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative isolate", className)}
      style={{ aspectRatio: `${iphoneClay.width} / ${iphoneClay.height}`, ...style }}
      {...props}
    >
      {children}
      <Image
        src={iphoneClay}
        alt=""
        sizes="28rem"
        className="pointer-events-none relative h-auto w-full select-none"
      />
      <div
        className={cn(tintaClayClassName, "opacity-55")}
        style={{ maskImage: `url(${iphoneClay.src})`, maskSize: "100% 100%" }}
      />
      <div
        className={tintaClayClassName}
        style={{ maskImage: `url(${iphoneClayAro.src})`, maskSize: "100% 100%" }}
      />
    </div>
  )
}

/** A largura da tela, em pixels de CSS (a de `PHONE_FRAME_WIDTH`, para `sm:` ficar fora de alcance); o aparelho cresce em volta, sem `scale()`. */
const IPHONE_W = PHONE_FRAME_WIDTH
const IPHONE_H = Math.round((IPHONE_W / IPHONE_TELA.width) * IPHONE_TELA.height * (3666 / 1773))

/**
 * A área segura do topo, que o iframe não tem (`env()` vale zero): CSS fora de `@layer` no documento da
 * moldura, para vencer as utilities que escrevem o `env()`. 58px nesta tela: a ilha termina a 46, e com 48
 * o painel lateral encostava nela.
 */
const IPHONE_SEGURA_TOPO = Math.round((IPHONE_H * IPHONE_TELA.safeTop) / 100)
const IPHONE_SEGURA_BASE = Math.round((IPHONE_H * IPHONE_TELA.safeBottom) / 100)
const IPHONE_AREA_SEGURA = `:root{--top-bar-safe-area:${IPHONE_SEGURA_TOPO}px}[data-slot=top-bar]{--top-bar-safe:${IPHONE_SEGURA_TOPO}px;--top-bar-safe-area:${IPHONE_SEGURA_TOPO}px}[role=dialog]{--sheet-gap-block-start:${IPHONE_SEGURA_TOPO}px}[data-vaul-drawer]{--drawer-h:calc(100dvh - ${IPHONE_SEGURA_TOPO}px)}[data-slot=split-shell]{--split-shell-safe-top:${IPHONE_SEGURA_TOPO}px;--split-shell-safe-bottom:${IPHONE_SEGURA_BASE}px}[data-slot=onboarding-tour]{--onboarding-safe-top:${IPHONE_SEGURA_TOPO}px;--onboarding-safe-bottom:${IPHONE_SEGURA_BASE}px}`

/**
 * O iPhone com uma viewport de 375 dentro da tela. `position: fixed` lá dentro é fixo na tela; o topo seguro
 * é emulado (`IPHONE_AREA_SEGURA`) e a base não tem a folga de 34.
 *
 * Desenhado a 85% (`zoom`) para caber no catálogo; a viewport de dentro continua com 375 pixels de CSS, ao
 * contrário de um `scale()`. A moldura marca o `<html>` de dentro com `data-pointer="coarse"`, e a variante
 * `pointer-coarse:` vale sob ele; o que pergunta ao toque por `matchMedia` continua lendo o mouse.
 */
/** Marca o documento da moldura como de dedo, no `<html>` de dentro (as gavetas vão para o `body` do iframe); o `espelharRaiz` só reescreve `class` e `style`. */
function ToqueEmulado() {
  const marcar = React.useCallback((el: HTMLSpanElement | null) => {
    const raiz = el?.ownerDocument.documentElement
    if (!raiz) return
    raiz.dataset.pointer = "coarse"
    return () => {
      delete raiz.dataset.pointer
    }
  }, [])
  return <span ref={marcar} hidden />
}

function IphoneFrame({
  title = "Prévia num iPhone",
  zoom = 0.85,
  screenClassName,
  className,
  children,
}: {
  title?: string
  /** O tamanho do desenho; a viewport de dentro é sempre 375. */
  zoom?: number
  screenClassName?: string
  className?: string
  children: React.ReactNode
}) {
  const largura = IPHONE_W / (IPHONE_TELA.width / 100)
  return (
    <IphoneBody className={cn("shrink-0", className)} style={{ width: largura, zoom }}>
      <ViewportFrame
        width={IPHONE_W}
        height={IPHONE_H}
        title={title}
        className="absolute ring-0"
        style={{
          left: `${IPHONE_TELA.left}%`,
          top: `${IPHONE_TELA.top}%`,
          borderRadius: `${(IPHONE_TELA.radiusX / 100) * IPHONE_W}px`,
        }}
        screenClassName={cn("bg-background", screenClassName)}
      >
        <style>{IPHONE_AREA_SEGURA}</style>
        <ToqueEmulado />
        {children}
      </ViewportFrame>
    </IphoneBody>
  )
}

export { IphoneBody, IphoneFrame, ViewportFrame }
