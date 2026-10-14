"use client"

import * as React from "react"

import { animate, motion, useMotionValue, useReducedMotion, type Transition } from "motion/react"

import { MOLA } from "@/lib/spring"
import { cn } from "@/lib/utils"

/**
 * # PresenceCursor — o ponteiro de outra pessoa
 *
 * Uma seta desenhada com a pílula do nome ao lado, pousada num ponto do pai posicionado (`at`, em px a partir
 * do canto superior esquerdo). É decorativo (`aria-hidden`, sem ponteiro): mostra que alguém está na mesma
 * tela, e quem lê a tela não perde nada sem ele.
 *
 * **A cor é da pessoa, e o par é do sistema.** `tone` escolhe a família de identidade (`identity-N`, a mesma do
 * `Avatar`): a pílula pinta `--identity-surface` com a tinta `--identity-foreground`, o par viva medido por
 * `scripts/identity-contrast.mjs`. A seta usa a mesma superfície com o contorno na tinta. Nenhuma cor crua.
 *
 * **Sobre o campo de marca** (D2 do plano do painel): a pílula pode pousar no `brand-field` porque é uma
 * superfície opaca com a tinta própria — o contraste do nome não depende do arco-íris embaixo. A borda dela é
 * um anel na própria tinta a 15% (`ring-identity-foreground/15`, o mesmo traço que contorna a seta): no ponto
 * claro do campo a superfície viva quase empata com ele (1,0–1,3:1) e sem o anel só a sombra desenharia a
 * forma. Não é `ring-foreground/10`: no escuro o `--foreground` é claro e o anel some no ponto claro do campo
 * (1,01–1,05:1, contra 1,38–1,45:1 da tinta); a tinta é a mesma nos dois temas, como a pílula. O nome trunca
 * em `max-w-40`.
 *
 * **O movimento.** Mudar `at` anda pela projeção de layout do `motion` (`layout="position"`) na `MOLA`; `from`
 * faz o cursor entrar da borda do pai ao montar, na mesma mola; `pressed` é o clique: encolhe e volta, na mola.
 * Com movimento reduzido ele aparece já pousado e anda sem deslocamento.
 *
 * **`from` é da montagem.** Trocar `from` com o cursor montado refaz a entrada, da nova borda (o efeito roda
 * de novo); para só mudar de ponto, mude `at`. `end` e `start` são **físicos** — direita e esquerda —, porque
 * a posição é `left`/`top`, e não lógicos como o resto do DS.
 */

type PresenceCursorTone = 1 | 2 | 3 | 4 | 5 | 6
type PresenceCursorFrom = "end" | "bottom" | "top" | "start"

/** A família de identidade, por extenso (classe montada não chega ao CSS). */
const TONE: Record<PresenceCursorTone, string> = {
  1: "identity-1",
  2: "identity-2",
  3: "identity-3",
  4: "identity-4",
  5: "identity-5",
  6: "identity-6",
}

const INSTANTE: Transition = { duration: 0 }

type PresenceCursorProps = {
  /** O nome na pílula ("Você", "Ana"). */
  name: string
  /** A família de identidade, de 1 (ember) a 6 (bloom). */
  tone: PresenceCursorTone
  /** A ponta da seta, em px a partir do canto superior esquerdo do pai posicionado. */
  at: { x: number; y: number }
  /**
   * A borda do pai de onde o cursor entra ao montar. Sem ela, aparece já pousado. Trocá-la com o cursor montado
   * refaz a entrada; `end`/`start` são físicos (direita/esquerda), não seguem a direção do texto.
   */
  from?: PresenceCursorFrom
  /** O clique: encolhe enquanto verdadeiro e volta na mola. */
  pressed?: boolean
  className?: string
}

function PresenceCursor({ name, tone, at, from, pressed = false, className }: PresenceCursorProps) {
  const reduzido = useReducedMotion() ?? false
  const ref = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // A entrada: o cursor começa fora da borda `from` do pai e anda até `at`. A posição de partida sai do
  // próprio nó (offsetLeft/Top é o `at` já aplicado), e não de um `instanceof`, que falha no iframe do catálogo.
  React.useLayoutEffect(() => {
    const el = ref.current
    const pai = el?.offsetParent
    if (!el || !pai || !from || reduzido) return
    const eixo = from === "end" || from === "start" ? x : y
    const partida = {
      end: pai.clientWidth - el.offsetLeft,
      start: -(el.offsetLeft + el.offsetWidth),
      bottom: pai.clientHeight - el.offsetTop,
      top: -(el.offsetTop + el.offsetHeight),
    }[from]
    eixo.set(partida)
    const voo = animate(eixo, 0, MOLA)
    return () => {
      voo.stop()
      eixo.set(0)
    }
  }, [from, reduzido, x, y])

  return (
    <motion.div
      ref={ref}
      aria-hidden
      layout="position"
      transition={{ layout: reduzido ? INSTANTE : MOLA }}
      data-slot="presence-cursor"
      data-tone={tone}
      data-pressed={pressed || undefined}
      className={cn("pointer-events-none absolute select-none", TONE[tone], className)}
      style={{ left: at.x, top: at.y, x, y }}
    >
      <motion.div
        initial={false}
        animate={{ scale: pressed ? 0.85 : 1 }}
        transition={reduzido ? INSTANTE : MOLA}
        className="flex origin-top-left flex-col items-start"
      >
        {/* A seta desenhada (exceção de `DRAWN_SVG_FILES`): a ponta em (2,2), compensada pela margem negativa. */}
        <svg
          viewBox="0 0 20 20"
          data-slot="presence-cursor-arrow"
          className="-ms-0.5 -mt-0.5 size-5 fill-(--identity-surface) stroke-identity-foreground"
        >
          <path d="M2 2 L2 16.5 L6.25 12.75 L9.1 18.4 L11.6 17.2 L8.85 11.6 L14.5 11.6 Z" strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
        <span
          data-slot="presence-cursor-name"
          className="ms-3 -mt-1 max-w-40 truncate rounded-full rounded-tl-xs bg-(--identity-surface) px-2 py-0.5 text-xs font-medium text-identity-foreground shadow-lg ring-1 ring-identity-foreground/15"
        >
          {name}
        </span>
      </motion.div>
    </motion.div>
  )
}

export { PresenceCursor }
export type { PresenceCursorFrom, PresenceCursorProps, PresenceCursorTone }
