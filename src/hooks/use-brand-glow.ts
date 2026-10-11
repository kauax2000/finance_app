"use client"

import * as React from "react"
import { animate } from "motion/react"
import { deDedo } from "@/lib/pointer"

/**
 * O ponteiro do **brilho de marca** — o arco de arco-íris que acende na borda
 * conforme o ponteiro se aproxima. Serve o `Alert variant="brand"` e o
 * `Card variant="brand"`; a pintura é a `@utility brand-glow`, no
 * `globals.css`, e este hook só escreve `--brand-glow-active` e
 * `--brand-glow-start` no elemento.
 *
 * Nasceu dentro do `alert.tsx` como `useAlertGlow` e saiu para cá na rodada
 * 133, **sem mudança de comportamento**, quando a segunda peça quis a mesma
 * borda. As medições que o desenharam estão nos comentários abaixo.
 */

/** A zona morta no centro, e a folga em volta da caixa. Números do dono. */
const GLOW_ZONA_MORTA = 0.01
/**
 * A folga em volta da caixa em que o brilho acende. A referência usa 64 e o
 * dono pediu 50 na primeira passada; depois de ver funcionando, pediu **mais
 * perto** — o alvo grande acendia o aviso antes de o ponteiro ter intenção de
 * chegar nele. 24 é menos da metade, e ainda dá o gesto de aproximação.
 */
const GLOW_PROXIMIDADE = 24

/**
 * O movimento, com os números da referência: `movementDuration` 2 e a ease
 * `[0.16, 1, 0.3, 1]` — que por acaso é o `--ease-out` desta casa, mas fica
 * escrita aqui porque quem interpola é o tween e não o CSS.
 */
const GLOW_DURACAO = 2
const GLOW_EASE = [0.16, 1, 0.3, 1] as const

/** Junta o ref da medição com o que o consumidor passou. */
export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

/**
 * O ponteiro do brilho de marca.
 *
 * **Este é o único listener em `document` do design system, e a razão é o
 * `proximity`.** O `Button` segue o ponteiro com handlers no próprio elemento
 * (`onPointerMove`), porque a lava dele só existe sob o cursor. Aqui o aviso
 * tem de acender com o mouse **perto, não em cima** — 24px de folga —, e um
 * handler local nunca vê o que acontece fora da caixa. O custo é contido: o
 * listener só monta com `variant="brand"`, e "uma por tela" o mantém em um.
 *
 * **Sem ponteiro fino, não monta nada.** A pergunta é `(hover: hover)`, a
 * mesma que o Tailwind faz nos `hover:` — num telefone o efeito não existe e
 * também não custa. É por isso que não há par `active:`: não há o que mostrar
 * no toque, ao contrário de um realce de botão.
 *
 * **A rolagem recalcula o estado, e não só a geometria.** Rolar move a caixa
 * sem mover o ponteiro: sem guardar a última posição e refazer a conta, o
 * aviso fica aceso apontando para onde o mouse não está mais. Medido antes do
 * conserto — 260px de rolagem com o ponteiro parado, a caixa saindo de
 * `top 255` para `-5`, e `--brand-glow-active` teimando em `1`. É a mecânica
 * da referência (`handleScroll = () => handleMove()`), com `capture: true` a
 * mais, para pegar rolagem dentro de container.
 *
 * **O trabalho é coalescido num `requestAnimationFrame`**, cancelado no
 * unmount. Isso não é o `rAF` em laço que esta casa proíbe — aquele se
 * re-agenda para fazer polling; este agenda um quadro por rajada. E é o que
 * torna barato ler `getBoundingClientRect()` a cada quadro em vez de cachear:
 * o cache só se invalidava em `scroll` e `resize`, e a caixa também se move
 * por reflow, por acordeão abrindo, por imagem carregando.
 *
 * **O ângulo acumula em vez de saltar.** Ao cruzar 180° o valor cru pula de
 * 179 para -179, e uma transição interpolaria o caminho longo — o arco daria a
 * volta pelo lado errado. A conta envolve a diferença em [-180, 180) com o
 * módulo duplo, porque o `%` do JavaScript preserva o sinal (a referência erra
 * isto: `((alvo - atual + 180) % 360) - 180` devolve valores abaixo de -180
 * quando a diferença é bem negativa).
 *
 * Nada de estado React: a posição vai para o CSS por `setProperty`, sem
 * re-render, como o `Button` e o marcador do `Tabs` já fazem.
 */
export function useBrandGlow<T extends HTMLElement = HTMLDivElement>(ativo: boolean) {
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    if (!ativo) return
    const el = ref.current
    if (!el) return
    // O documento e a janela **do elemento**: dentro da moldura do catálogo (um
    // iframe) o ponteiro se move no documento de dentro, e o de fora nunca o
    // via — o brilho não acendia. No app os dois são o `document` de sempre.
    const doc = el.ownerDocument
    const win = doc.defaultView ?? window
    // Nem na moldura do iPhone, que é dedo emulado num iframe do desktop.
    if (!win.matchMedia("(hover: hover)").matches || deDedo(el)) return
    // O quadro também é o da janela do elemento (o iframe pinta no dele).
    const requestAnimationFrame = win.requestAnimationFrame.bind(win)
    const cancelAnimationFrame = win.cancelAnimationFrame.bind(win)

    // **Movimento reduzido tem de ser perguntado à mão aqui.** O bloco global
    // de `prefers-reduced-motion` encurta *transição* de CSS, e um tween de JS
    // escapa dele — é o precedente que a rodada do `ThemeToggle` registrou ao
    // trocar transição por WAAPI. Com a preferência ligada o arco vai direto
    // para o ângulo, sem percurso: seguir o ponteiro não é animação e continua.
    const semMovimento = win.matchMedia("(prefers-reduced-motion: reduce)")
      .matches

    // A última posição conhecida do ponteiro. **Ela é o que faz a rolagem
    // funcionar**: quando a página rola, o mouse não se mexeu, mas a caixa sim
    // — e o estado do brilho tem de ser recalculado a partir daqui. Sem isso o
    // aviso fica aceso apontando para onde o ponteiro não está mais. Medido
    // antes do conserto: rolando 260px com o ponteiro parado, a caixa ia de
    // `top 255` para `-5` e `--brand-glow-active` continuava em `1`.
    let ultimaX = 0
    let ultimaY = 0
    let temPosicao = false
    let quadro = 0
    let tween: { stop: () => void } | null = null

    const calcular = () => {
      quadro = 0
      if (!temPosicao) return

      // **A caixa é lida aqui dentro, a cada quadro, e não cacheada.** O cache
      // só se invalidava em `scroll` e `resize`; ler no quadro mata a
      // obsolescência de qualquer origem — um acordeão abrindo, uma imagem
      // carregando, um reflow. Com o `rAF` coalescendo, é uma leitura por
      // quadro no máximo.
      const { left, top, width, height } = el.getBoundingClientRect()
      const cx = left + width / 2
      const cy = top + height / 2

      // A zona morta do centro. Com 0,01 ela é quase nada — fica porque é um
      // número do dono, e porque é ela que evita o arco girando louco quando o
      // ponteiro cruza exatamente o centro.
      if (
        Math.hypot(ultimaX - cx, ultimaY - cy) <
        0.5 * Math.min(width, height) * GLOW_ZONA_MORTA
      ) {
        el.style.setProperty("--brand-glow-active", "0")
        return
      }

      const perto =
        ultimaX > left - GLOW_PROXIMIDADE &&
        ultimaX < left + width + GLOW_PROXIMIDADE &&
        ultimaY > top - GLOW_PROXIMIDADE &&
        ultimaY < top + height + GLOW_PROXIMIDADE

      el.style.setProperty("--brand-glow-active", perto ? "1" : "0")
      if (!perto) return

      // **O ângulo atual sai do DOM, não de um acumulador**, e isso é a
      // mecânica da referência: ela lê `--start` do `element.style`, que é o
      // valor que o **tween** escreveu no último quadro. Um acumulador guarda
      // o *alvo*, não onde a animação está — e era isso que o meu fazia.
      const atual =
        parseFloat(el.style.getPropertyValue("--brand-glow-start")) || 0
      const alvo = (180 * Math.atan2(ultimaY - cy, ultimaX - cx)) / Math.PI + 90

      // O caminho curto. A referência escreve
      // `((alvo - atual + 180) % 360) - 180`, que devolve valores abaixo de
      // −180 quando a diferença é bem negativa, porque o `%` do JavaScript
      // preserva o sinal — e aí o arco dá a volta pelo lado errado. O módulo
      // duplo conserta, e é a única divergência do fonte dela.
      const delta = ((((alvo - atual + 180) % 360) + 360) % 360) - 180

      // **Quem anima é o `animate` do `motion`, como na referência.** Havia
      // aqui uma transição de CSS sobre uma `@property` registrada, e eu
      // defendi por três rodadas que era equivalente. Era dedução minha, não
      // medição — e o dono disse três vezes que a animação não era a dela.
      // Agora ela **é**, por construção.
      //
      // O tween anterior é parado antes do novo: a referência não para, e
      // deixa até ~120 tweens vivos escrevendo a mesma variável. A trajetória
      // é a mesma (cada tween novo parte do valor atual do DOM), e parar evita
      // o vazamento.
      tween?.stop()
      if (semMovimento) {
        el.style.setProperty("--brand-glow-start", String(atual + delta))
        return
      }
      tween = animate(atual, atual + delta, {
        duration: GLOW_DURACAO,
        ease: [...GLOW_EASE],
        onUpdate: (v) => {
          el.style.setProperty("--brand-glow-start", String(v))
        },
      })
    }

    // **`requestAnimationFrame` aqui coalesce, não faz laço.** O precedente
    // proibido nesta casa é o `rAF` que se **re-agenda** — o polling contínuo
    // que o marcador do `Tabs` recusou. Este agenda no máximo um quadro por
    // rajada de eventos e o cancela no unmount; `pointermove` pode disparar
    // mais de uma vez por quadro, e sem isto o trabalho inteiro rodava em cada
    // um. É o que a referência faz.
    const agendar = () => {
      if (quadro) cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(calcular)
    }

    const aoMover = (e: PointerEvent) => {
      // O brilho segue o cursor; num aparelho híbrido o dedo também move.
      if (e.pointerType !== "mouse") return
      ultimaX = e.clientX
      ultimaY = e.clientY
      temPosicao = true
      agendar()
    }

    // Rolar e redimensionar movem a caixa sem mover o ponteiro, então os dois
    // recalculam **tudo** a partir da última posição — não só a geometria.
    //
    // **`capture: true` é a única divergência deliberada da referência**, e ela
    // corrige um caso que a referência erra: `scroll` não borbulha, mas
    // captura, então sem isto a rolagem **dentro de um container** passa
    // despercebida e só a da janela conta. É a mesma solução que
    // `use-close-on-scroll` já usa nesta casa.
    const aoRolar = () => agendar()

    doc.addEventListener("pointermove", aoMover, { passive: true })
    win.addEventListener("scroll", aoRolar, { capture: true, passive: true })
    win.addEventListener("resize", aoRolar)
    return () => {
      tween?.stop()
      if (quadro) cancelAnimationFrame(quadro)
      doc.removeEventListener("pointermove", aoMover)
      win.removeEventListener("scroll", aoRolar, { capture: true })
      win.removeEventListener("resize", aoRolar)
    }
  }, [ativo])

  return ref
}
