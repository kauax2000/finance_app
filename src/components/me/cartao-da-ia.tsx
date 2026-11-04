"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { ConectarIaDialog } from "@/components/account/conectar-ia-dialog"
import { IasVazio } from "@/components/account/ias-vazio"
import { useAuth } from "@/components/providers"
import { Card } from "@/components/ui/card"
import { chaveDasIas } from "@/hooks/use-ias-conectadas"

/** Na página Você, até a primeira IA: o convite de IAs conectadas, com o guia de conectar. */
export function CartaoDaIa() {
    const [aberto, setAberto] = useState(false)
    const queryClient = useQueryClient()
    const { user } = useAuth()
    return (
        <>
            <Card padding="none">
                <IasVazio onConectar={() => setAberto(true)} />
            </Card>
            <ConectarIaDialog
                open={aberto}
                onOpenChange={(o) => {
                    setAberto(o)
                    // Ao fechar, relê a lista: com a primeira IA conectada, o cartão vira a linha.
                    if (!o) void queryClient.invalidateQueries({ queryKey: chaveDasIas(user?.id) })
                }}
            />
        </>
    )
}
