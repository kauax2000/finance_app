"use client"

import * as React from "react"
import { abrirRecuo } from "@/lib/recuo"

/**
 * Segura o recuo do app (`lib/recuo`) enquanto `aberto`. Em layout, para a
 * escala começar no mesmo quadro em que o modal aparece; montar fechado não
 * recua nada.
 */
export function useRecuoDoApp(aberto: boolean): void {
  React.useLayoutEffect(() => {
    if (!aberto) return
    return abrirRecuo()
  }, [aberto])
}
