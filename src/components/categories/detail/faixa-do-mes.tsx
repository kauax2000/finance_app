"use client"

import { FatosDoMes, ReguaDoMes, type FaixaDoMesProps } from "./regua-do-mes"

/** A faixa do mês no desktop: o valor com os fatos ao lado e a régua da média com a legenda nas pontas. */
export function FaixaDoMes(props: FaixaDoMesProps) {
    return <ReguaDoMes {...props} fatosNaLinha={<FatosDoMes {...props} />} />
}
