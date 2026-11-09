"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { MOLA, SAIDA } from "@/lib/spring"

const SUMIDO = { opacity: 0, scale: 0.4, filter: "blur(3px)" }
const PRESENTE = { opacity: 1, scale: 1, filter: "blur(0px)" }

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
  children,
}: {
  chave: string
  className?: string
  /** Segundos de espera só na chegada (a saída é imediata): a escada de uma lista. */
  atraso?: number
  children: ReactNode
}) {
  const reduzido = useReducedMotion()
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={chave}
        className={className}
        initial={reduzido ? false : SUMIDO}
        animate={PRESENTE}
        exit={reduzido ? { opacity: 0, transition: { duration: 0 } } : { ...SUMIDO, transition: SAIDA }}
        transition={reduzido || !atraso ? MOLA : { ...MOLA, delay: atraso }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  )
}

export { TrocaSuave }
