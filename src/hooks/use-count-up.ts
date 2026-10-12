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
 * A primeira contagem parte de 0, ao montar, no tempo de `entrada`; as
 * seguintes partem do valor anterior, no de `troca`. `chave` é o formato: o
 * efeito recomeça quando ela muda, e `formatar` é lido junto.
 */
export function useCountUp(
  value: number,
  formatar: (v: number) => string,
  {
    chave,
    entrada,
    troca,
    ease,
  }: {
    chave: string
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
    const de = mostrado.current ?? 0
    if (reduzido || de === value) {
      mostrado.current = value
      escrever(value)
      return
    }
    const controles = animate(de, value, {
      duration: mostrado.current === null ? entrada : troca,
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
  }, [chave, reduzido, value])

  return ref
}
