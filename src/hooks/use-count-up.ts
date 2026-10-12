"use client"

import * as React from "react"
import { animate, useReducedMotion } from "motion/react"

/**
 * O motor do número que conta — o do `ChartNumber` e o do `StatCardValue`.
 *
 * **Escreve por `ref`, e não por estado**: um re-render por quadro, em cada
 * número de uma página, é trabalho que ninguém vê. Com movimento reduzido, ou
 * sem distância a andar, salta.
 *
 * Quem chama diz o resto: de onde a primeira contagem parte (`inicio`), se a
 * caixa ainda espera (`pendente`: escreve o final e esquece o que mostrou) e
 * quando a contagem é a longa (`entrando`; sem ele, só a primeira). `chave` é o
 * formato: o efeito recomeça quando ela muda, e `formatar` é lido junto.
 */
export function useCountUp(
  value: number,
  formatar: (v: number) => string,
  {
    chave,
    inicio = 0,
    pendente = false,
    entrando,
    entrada,
    troca,
    ease,
  }: {
    chave: string
    inicio?: number
    pendente?: boolean
    entrando?: boolean
    /** Segundos. */
    entrada: number
    /** Segundos. */
    troca: number
    ease: readonly [number, number, number, number]
  }
) {
  const reduzido = useReducedMotion()
  const ref = React.useRef<HTMLSpanElement>(null)
  const mostrado = React.useRef<number | null>(null)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const escrever = (v: number) => {
      el.textContent = formatar(v)
    }
    if (pendente) {
      mostrado.current = null
      escrever(value)
      return
    }
    const de = mostrado.current ?? inicio
    if (reduzido || de === value) {
      mostrado.current = value
      escrever(value)
      return
    }
    const controles = animate(de, value, {
      duration: (entrando ?? mostrado.current === null) ? entrada : troca,
      ease,
      onUpdate: (v) => {
        mostrado.current = v
        escrever(v)
      },
    })
    return () => controles.stop()
    // `formatar` é derivado de `chave`: listá-lo recomeçaria a contagem a
    // cada render, porque quem chama o cria inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, entrando, inicio, pendente, reduzido, value])

  return ref
}
