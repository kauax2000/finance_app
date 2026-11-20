"use client"

import type { ReactNode } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

type FormaDaLista = "tabela" | "lista"

/**
 * O casco do detalhe da categoria. Desktop: análise à esquerda (3/5) e os
 * lançamentos presos sob a barra, rolando na própria coluna (2/5). Telefone: o
 * resumo do mês no topo e abas Resumo · Lançamentos. `useIsMobile` troca só o
 * arranjo (exceção consciente): uma instância da lista por vez.
 */
export function CategoryDetailLayout({
    resumo,
    analise,
    lancamentos,
    totalLancamentos,
}: {
    resumo: ReactNode
    analise: ReactNode
    lancamentos: (forma: FormaDaLista) => ReactNode
    totalLancamentos: number
}) {
    const isMobile = useIsMobile()

    if (isMobile) {
        return (
            <div className="flex min-w-0 flex-col gap-6">
                {resumo}
                <Tabs defaultValue="resumo">
                    <TabsList>
                        <TabsTrigger value="resumo">Resumo</TabsTrigger>
                        <TabsTrigger value="lancamentos" count={totalLancamentos}>
                            Lançamentos
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="resumo" className="flex flex-col gap-6">
                        {analise}
                    </TabsContent>
                    {/* Montada sempre: a folha do lançamento mora nela e abre também do Resumo. */}
                    <TabsContent value="lancamentos" forceMount>
                        {lancamentos("tabela")}
                    </TabsContent>
                </Tabs>
            </div>
        )
    }

    return (
        <div className="grid min-w-0 grid-cols-5 items-start gap-6">
            <div className="col-span-3 flex min-w-0 flex-col gap-6">
                {resumo}
                {analise}
            </div>
            {/* O `sticky` mora fora: a raiz do `ScrollArea` é `relative`. */}
            <div className="sticky top-(--top-bar-bottom) col-span-2 h-[calc(100dvh_-_var(--top-bar-bottom))]">
                <ScrollArea className="h-full">{lancamentos("lista")}</ScrollArea>
            </div>
        </div>
    )
}
