"use client"

import { Separator } from "@/components/ui/separator"
import { FatosDoMes, ReguaDoMes, type FaixaDoMesProps } from "./regua-do-mes"

/** 1A — a régua da média e, embaixo, os fatos em quatro colunas. */
export function Faixa1A(props: FaixaDoMesProps) {
    return (
        <ReguaDoMes {...props}>
            <Separator />
            <FatosDoMes {...props} layout="colunas" />
        </ReguaDoMes>
    )
}
