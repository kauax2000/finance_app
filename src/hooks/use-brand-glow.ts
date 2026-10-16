"use client"

import * as React from "react"
import { animate } from "motion/react"
import { deDedo } from "@/lib/pointer"

/**
 * O ponteiro do brilho de marca (`Alert`, `Card` e as outras peças
 * `variant="brand"`): a pintura é a `@utility brand-glow`, e este hook só
 * escreve `--brand-glow-active` e `--brand-glow-start` no elemento.
 */

/** A zona morta no centro, e a folga em volta da caixa. Números do dono. */
const GLOW_ZONA_MORTA = 0.01
/** A folga em volta da caixa em que o brilho acende; o alvo grande acendia o aviso antes de haver intenção de chegar nele. */
const GLOW_PROXIMIDADE = 24

/** O movimento, com os números da referência; quem interpola é o tween, e não o CSS. */
const GLOW_DURACAO = 2
const GLOW_EASE = [0.16, 1, 0.3, 1] as const

/**
 * Único `pointermove` em `document` que fica montado com a peça em repouso: o
 * aviso acende com o mouse perto, não em cima, e um handler local não vê o que
 * acontece fora da caixa. Só monta com `variant="brand"` e sob `(hover: hover)`
 * (no toque o efeito não existe, por isso não há par `active:`).
 *
 * A rolagem recalcula o estado, não só a geometria: rolar move a caixa sem mover
 * o ponteiro, e sem refazer a conta a partir da última posição o aviso fica
 * aceso apontando para onde o mouse não está.
 *
 * O trabalho é coalescido num `requestAnimationFrame` (um quadro por rajada,
 * cancelado no unmount), o que torna barato ler `getBoundingClientRect()` a
 * cada quadro em vez de cachear. O ângulo é envolvido em [-180, 180) com módulo
 * duplo, porque o `%` do JavaScript preserva o sinal e o arco daria a volta
 * pelo lado errado. Nada de estado React: a posição vai para o CSS por
 * `setProperty`, sem re-render.
 */
export function useBrandGlow<T extends HTMLElement = HTMLDivElement>(ativo: boolean) {
  const ref = React.useRef<T | null>(null)

  React.useEffect(() => {
    if (!ativo) return
    const el = ref.current
    if (!el) return
    // O documento e a janela do elemento: na moldura do catálogo (um iframe) o
    // ponteiro se move no documento de dentro.
    const doc = el.ownerDocument
    const win = doc.defaultView ?? window
    // Nem na moldura do iPhone, que é dedo emulado num iframe do desktop.
    if (!win.matchMedia("(hover: hover)").matches || deDedo(el)) return
    // O quadro também é o da janela do elemento (o iframe pinta no dele).
    const requestAnimationFrame = win.requestAnimationFrame.bind(win)
    const cancelAnimationFrame = win.cancelAnimationFrame.bind(win)

    // Movimento reduzido é perguntado à mão: um tween de JS escapa do bloco
    // global que só encurta transição. Seguir o ponteiro não é animação e continua.
    const semMovimento = win.matchMedia("(prefers-reduced-motion: reduce)")
      .matches

    // A última posição do ponteiro: é o que faz a rolagem recalcular o estado.
    let ultimaX = 0
    let ultimaY = 0
    let temPosicao = false
    let quadro = 0
    let tween: { stop: () => void } | null = null

    const calcular = () => {
      quadro = 0
      if (!temPosicao) return

      // A caixa é lida a cada quadro, e não cacheada: reflow, acordeão e imagem
      // também a movem.
      const { left, top, width, height } = el.getBoundingClientRect()
      const cx = left + width / 2
      const cy = top + height / 2

      // A zona morta do centro evita o arco girando louco quando o ponteiro cruza o centro.
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

      // O ângulo atual sai do DOM (o que o tween escreveu no último quadro), não
      // de um acumulador, que guardaria o alvo e não onde a animação está.
      const atual =
        parseFloat(el.style.getPropertyValue("--brand-glow-start")) || 0
      const alvo = (180 * Math.atan2(ultimaY - cy, ultimaX - cx)) / Math.PI + 90

      // O caminho curto; o módulo duplo é a divergência da referência, que
      // devolve valores abaixo de −180.
      const delta = ((((alvo - atual + 180) % 360) + 360) % 360) - 180

      // Quem anima é o `animate` do `motion`, como na referência; o tween anterior
      // é parado antes do novo (a referência deixa ~120 vivos escrevendo a mesma variável).
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

    // Agenda no máximo um quadro por rajada de eventos; não é o `rAF` em laço que esta casa proíbe.
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

    // `capture: true` pega a rolagem dentro de container (`scroll` não borbulha, mas captura).
    const aoRolar = () => agendar()

    // O ponteiro que sai da janela não manda mais `pointermove`, e a última posição
    // ficaria valendo: com a peça no topo (a busca da barra), sair pela barra de
    // endereço deixava o arco aceso. Sair (`pointerout` sem destino) ou perder o foco
    // esquece a posição e apaga; o próximo movimento dentro da página recalcula.
    const esquecer = () => {
      temPosicao = false
      if (quadro) cancelAnimationFrame(quadro)
      quadro = 0
      el.style.setProperty("--brand-glow-active", "0")
    }
    const aoSair = (e: PointerEvent) => {
      if (!e.relatedTarget) esquecer()
    }

    doc.addEventListener("pointermove", aoMover, { passive: true })
    win.addEventListener("scroll", aoRolar, { capture: true, passive: true })
    win.addEventListener("resize", aoRolar)
    doc.addEventListener("pointerout", aoSair, { passive: true })
    win.addEventListener("blur", esquecer)
    return () => {
      tween?.stop()
      if (quadro) cancelAnimationFrame(quadro)
      doc.removeEventListener("pointermove", aoMover)
      win.removeEventListener("scroll", aoRolar, { capture: true })
      win.removeEventListener("resize", aoRolar)
      doc.removeEventListener("pointerout", aoSair)
      win.removeEventListener("blur", esquecer)
    }
  }, [ativo])

  return ref
}
