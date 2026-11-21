"use client"

import { ReguaDoMes, type FaixaDoMesProps } from "./regua-do-mes"

/** A faixa do mês no desktop: o valor e a régua da média com a legenda nas pontas. */
export function FaixaDoMes(props: FaixaDoMesProps) {
    return <ReguaDoMes {...props} />
}
