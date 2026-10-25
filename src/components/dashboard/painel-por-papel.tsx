"use client"

import type { ReactNode } from "react"
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton"
import { useWorkspace } from "@/components/workspace-provider"
import { ConvidadoPainelWireframe } from "@/components/wireframe/convidado-painel-wireframe"

/**
 * O Painel pelo papel (Bloco 7A): o convidado tem o dele, em wireframe (o
 * limite, o total do mês e as transações dele). Com o papel a caminho, o
 * esqueleto da rota espera, para o Painel da casa (`children`) nunca montar —
 * nem pedir o que é da casa — para quem é convidado. Só o adulto o recebe.
 */
export function PainelPorPapel({ children }: { children: ReactNode }) {
    const { papel, loading } = useWorkspace()
    if (papel === "guest") return <ConvidadoPainelWireframe />
    if (papel === null && loading) return <DashboardPageSkeleton />
    // O adulto, ou ninguém sem carteira (o Painel da casa diz o que fazer).
    return children
}
