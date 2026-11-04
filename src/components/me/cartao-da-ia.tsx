"use client"

import { useState } from "react"

import { ConectarIaDialog } from "@/components/account/conectar-ia-dialog"
import { IasVazio } from "@/components/account/ias-vazio"
import { Card } from "@/components/ui/card"

/** Na página Você, até a primeira IA: o convite de IAs conectadas, com o guia de conectar. */
export function CartaoDaIa() {
    const [aberto, setAberto] = useState(false)
    return (
        <>
            <Card padding="none">
                <IasVazio onConectar={() => setAberto(true)} />
            </Card>
            <ConectarIaDialog open={aberto} onOpenChange={setAberto} />
        </>
    )
}
