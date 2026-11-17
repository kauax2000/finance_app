"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { MOLA, MOLA_PALCO, SAIDA } from "@/lib/spring"

const SUMIDO = { opacity: 0, scale: 0.4, filter: "blur(3px)" }
const PRESENTE = { opacity: 1, scale: 1, filter: "blur(0px)" }

// O texto não encolhe: um número ou um título a 40% do tamanho lê como pancada. Ele rola — o novo
// sobe de um pouco abaixo e o velho sai por cima, num desfoque leve, na mola que não passa do alvo.
const TEXTO_ABAIXO = { opacity: 0, y: "0.35em", filter: "blur(2px)" }
const TEXTO_ACIMA = { opacity: 0, y: "-0.35em", filter: "blur(2px)" }
const TEXTO_PRESENTE = { opacity: 1, y: "0em", filter: "blur(0px)" }

// O título de tela gira como um tambor (dono, 17/11/2026): o de antes sobe e sai pelo alto da linha,
// tombando para trás, e o novo vem de baixo, de pé. Quem envolve recorta a linha (`overflow-hidden`).
const TITULO_ABAIXO = { opacity: 0, y: "100%", rotateX: -60, filter: "blur(2px)", transformPerspective: 400 }
const TITULO_ACIMA = { opacity: 0, y: "-100%", rotateX: 60, filter: "blur(2px)", transformPerspective: 400 }
const TITULO_PRESENTE = { opacity: 1, y: "0%", rotateX: 0, filter: "blur(0px)", transformPerspective: 400 }
const TROCA_DO_TITULO = { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const

/**
 * Troca um ícone ou um rótulo no lugar: o de antes sai no desfoque e o novo
 * chega na mola. Quem envolve precisa ser `relative`, porque o `popLayout` tira
 * o que sai do fluxo; é ele que deixa medir a largura nova logo depois da
 * troca. `chave` é o que muda.
 */
function TrocaSuave({
  chave,
  className,
  atraso = 0,
  forma = "icone",
  children,
}: {
  chave: string
  className?: string
  /**
   * `icone` (o padrão) encolhe e volta na mola; `texto` rola de leve, na mola, para número;
   * `titulo` gira como um tambor: sai pelo alto e o novo vem de baixo, em 300ms, os dois juntos.
   */
  forma?: "icone" | "texto" | "titulo"
  /** Segundos de espera só na chegada (a saída é imediata): a escada de uma lista. */
  atraso?: number
  children: ReactNode
}) {
  const reduzido = useReducedMotion()
  const texto = forma === "texto"
  const titulo = forma === "titulo"
  const mola = titulo ? TROCA_DO_TITULO : texto ? MOLA_PALCO : MOLA
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={chave}
        className={className}
        initial={reduzido ? false : titulo ? TITULO_ABAIXO : texto ? TEXTO_ABAIXO : SUMIDO}
        animate={titulo ? TITULO_PRESENTE : texto ? TEXTO_PRESENTE : PRESENTE}
        exit={
          reduzido
            ? { opacity: 0, transition: { duration: 0 } }
            : titulo
              ? { ...TITULO_ACIMA, transition: TROCA_DO_TITULO }
              : { ...(texto ? TEXTO_ACIMA : SUMIDO), transition: SAIDA }
        }
        transition={reduzido || !atraso ? mola : { ...mola, delay: atraso }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}

export { TrocaSuave }
