"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type FormaDaLista = "tabela" | "lista"

/**
 * O casco do detalhe da categoria, igual no telefone e no desktop: o resumo do
 * mês no topo e abas Resumo · Lançamentos. No desktop o conteúdo começa onde
 * começa o ladrilho do cabeçalho (38px depois da borda, com o voltar), e recua
 * o mesmo à direita.
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
    return (
        <div className="flex min-w-0 flex-col gap-6 md:px-9.5">
            {resumo}
            <Tabs defaultValue="resumo">
                <TabsList aria-label="Seções da categoria" className="w-full md:w-fit">
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
