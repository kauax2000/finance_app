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
 * ## Ela deixou de ser só de telefone
 *
 * `ViewportFrame` é a primitiva, e o telefone é o `IphoneFrame`: o aparelho com
 * uma viewport de 375 dentro (o `PhoneFrame`, um retângulo de 375×667, saiu
 * quando todas as páginas passaram ao iPhone). A largura fluida (`width="fluid"`) dá a moldura de desktop que a
 * `Sidebar` precisa: dentro dela `position: fixed` é fixo **na moldura**, e o
 * palco do catálogo — medido em **810px** — está acima do `md` (768), então é o
 * ramo de desktop que aparece, com os 16rem da barra ocupando 31,6% dele.
 *
 * ## Duas das três limitações fecharam
 *
 * Ela dizia trocar "o viewport do **CSS**, e nada mais". Hoje:
 *
 * - **`useIsMobile` lê a janela de dentro**, pelo `ViewportWindowProvider` que
 *   embrulha o portal. Sem isso, todo componente que bifurca em JS pela largura
 *   — `Sidebar`, `Sheet`, `Toolbar` — renderizava o ramo errado aqui dentro.
 * - **Os portais do `Sheet` caem dentro da moldura**, porque ele lê a mesma
 *   janela e entrega `container` ao `Portal` do Radix. É o que torna o ramo de
 *   telefone da `Sidebar` demonstrável.
 *
 * **E o que abre aqui dentro não é modal para a página de fora.** `Sheet`,
 * `Sheet` e `Drawer` leem `useViewportModal()` e nascem `modal={false}`
 * aqui: o Radix monta um `RemoveScroll` dentro do `DialogOverlay` sempre que
 * `modal`, e o `react-remove-scroll` trava o `document` **global** — o desta
 * página —, porque o React roda na janela de fora ainda que o DOM viva no
 * `<iframe>`. Medido com a folha do `Form` aberta: `data-scroll-locked` no
 * `<body>` do catálogo, `overflow` `hidden`, e um `wheel` sobre o `<h1>`
 * saindo `defaultPrevented`; a página inteira congelava porque um espécime de
 * 375px abriu uma gaveta.
 *
 * As que ficam: **`env(safe-area-inset-*)` vale zero**, porque não há aparelho
 * — o recuo que se vê é a base, sem os 34px do iPhone —, e **o véu não aparece
 * aqui dentro**, porque tanto o `Overlay` do vaul quanto o do Radix devolvem
 * `null` fora do modo modal: é lá que o `RemoveScroll` mora.
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

type ViewportFrameProps = Omit<React.ComponentProps<"div">, "title" | "width"> & {
  /**
   * `"fluid"` toma a largura de quem contém — é a moldura de desktop, e o palco
   * do catálogo mede 810px, acima do `md`. Um número é largura fixa em pixels
   * de CSS.
   */
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

  // O raio da moldura desce para a tela como `--top-bar-r`. O borrão do
  // `backdrop-filter` ignora o recorte de todo ancestral — `overflow-hidden`,
  // `clip-path` aqui fora, máscara, e `clip-path` ou `contain: paint` lá
  // dentro, os quatro medidos —, e só respeita o raio do próprio elemento: a
  // barra de vidro do `TopBar` rolado saía com os cantos de cima quadrados.
  // Lido do computado para servir o `rounded-lg` do desktop e o `rounded-3xl`
  // do telefone sem ninguém repetir o número. Vai na tela, e não no `<html>`
  // de dentro, porque `espelharRaiz` reescreve o `style` dele a cada troca de
  // tema.
  React.useEffect(() => {
    if (moldura.current) setRaio(getComputedStyle(moldura.current).borderRadius)
  }, [className])

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
      ref={moldura}
      data-slot="viewport-frame"
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
            // O provedor é o que faz `useIsMobile` e os portais do `Sheet`
            // enxergarem **esta** janela, e não a de fora.
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
 * O aparelho é o iPhone 17 Pro Clay da Asylab (asylab.com/resources/freebies):
 * só a moldura, com a tela vazada, extraída do PSD de frente. Ele nasceu na
 * página de Touch & safe area como esquema, e desde a rodada 230 é peça daqui,
 * porque as páginas das barras o usam com a tela **de verdade** dentro.
 *
 * `IPHONE_TELA` é a caixa da tela em porcentagem da imagem: a camada "MASK
 * SCREEN" do PSD (1634 × 3549 num aparelho de 1773 × 3666). As faixas seguras
 * são porcentagem da tela, na proporção do iPhone 17 Pro: 62 e 34 pontos de
 * 874; a de cima cobre a Dynamic Island, que termina em 5,6%. O canto é o
 * círculo que passa pelo ponto a 45° da máscara (259 px), em porcentagem de
 * cada eixo — sem ele o retângulo escapa pela curva externa do aparelho.
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
 * O corpo do aparelho: a tela é quem chama (o primeiro filho, posicionado na
 * caixa de `IPHONE_TELA`), e por cima vão a moldura e a tinta. A moldura não
 * recebe eventos, então a tela embaixo continua tocável.
 *
 * A tinta é em duas camadas, as duas em `multiply` sobre o Clay branco — o
 * branco vira a cor e o sombreado do molde continua. A face leva o degradê a
 * meia força; o aro, os botões e a Dynamic Island levam o degradê cheio, que é
 * o que desenha o contorno. Cada camada é mascarada pela própria peça.
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

/**
 * A largura da tela, em pixels de CSS: a de `PHONE_FRAME_WIDTH`, para `sm:`
 * continuar fora de alcance. O aparelho cresce em volta dela — **sem
 * `scale()`**, pela razão do topo do arquivo: a tela é uma viewport de
 * verdade, e escalar mentiria sobre o pixel. A altura sai da proporção da
 * máscara do PSD.
 */
const IPHONE_W = PHONE_FRAME_WIDTH
const IPHONE_H = Math.round((IPHONE_W / IPHONE_TELA.width) * IPHONE_TELA.height * (3666 / 1773))

/**
 * A área segura do topo, que o iframe não tem (`env()` vale zero nele): a
 * barra do topo, o painel solto, a gaveta alta e o campo do `SplitShell` descem da ilha, como num aparelho. É CSS fora
 * de `@layer` no documento da moldura, então vence as utilities que escrevem
 * o `env()` — e só ali dentro. O número é o do aparelho: os 62 pontos de 874
 * (`IPHONE_TELA.safeTop`), 58px nesta tela — a ilha termina a 46, e com 48 o
 * painel lateral encostava nela.
 */
const IPHONE_SEGURA_TOPO = Math.round((IPHONE_H * IPHONE_TELA.safeTop) / 100)
const IPHONE_SEGURA_BASE = Math.round((IPHONE_H * IPHONE_TELA.safeBottom) / 100)
const IPHONE_AREA_SEGURA = `[data-slot=top-bar]{--top-bar-safe:${IPHONE_SEGURA_TOPO}px}[role=dialog]{--sheet-gap-block-start:${IPHONE_SEGURA_TOPO}px}[data-vaul-drawer]{--sheet-drawer-h:calc(100dvh - ${IPHONE_SEGURA_TOPO}px)}[data-slot=split-shell]{--split-shell-safe-top:${IPHONE_SEGURA_TOPO}px;--split-shell-safe-bottom:${IPHONE_SEGURA_BASE}px}`

/**
 * O iPhone com uma viewport de telefone dentro da tela: um `ViewportFrame` de
 * 375 px, recortado no canto do aparelho. `position: fixed` lá dentro é fixo
 * **na tela**, e é o que as barras precisam. `env(safe-area-inset-*)` continua
 * valendo zero; o topo é emulado (`IPHONE_AREA_SEGURA`) para a barra, o painel e a
 * gaveta, e a base não tem a folga de 34. Conteúdo solto desce da ilha à mão
 * (`pt-16`).
 *
 * **Ele é desenhado a 85%** (`zoom`), porque em tamanho real o aparelho media
 * 407 × 841 e não cabia na tela do catálogo com os eixos em cima. O `zoom`
 * encolhe o desenho e a caixa que ele ocupa; **a viewport de dentro continua
 * com 375 pixels de CSS** — as media queries, o `useIsMobile` e o toque leem
 * o telefone, e não o desenho. É diferente do `scale()` que o topo do arquivo
 * recusa: lá a moldura era uma `div` sem viewport própria, e escalar mudava o
 * que `sm:` media.
 */
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
        {children}
      </ViewportFrame>
    </IphoneBody>
  )
}

export { IphoneBody, IphoneFrame, ViewportFrame }
