"use client"

import { currencyBRL } from "@/lib/formatters"
import { FatosDoMes, ReguaDoMes, type FaixaDoMesProps } from "./regua-do-mes"

/** A faixa do mês no desktop: o valor com os fatos ao lado, a régua da média e o veredito. */
export function FaixaDoMes(props: FaixaDoMesProps) {
    const { lancado, quantidade } = props
    return (
        <ReguaDoMes
            {...props}
            fatosNaLinha={<FatosDoMes {...props} />}
            sufixo={quantidade > 0 ? `média por lançamento ${currencyBRL(lancado / quantidade)}` : null}
        />
    )
}
