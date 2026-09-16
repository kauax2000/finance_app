"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type CreditCardsPageView = "cards" | "history"

const TABS: { value: CreditCardsPageView; label: string }[] = [
    { value: "cards", label: "Cartões" },
    { value: "history", label: "Histórico" },
]

/**
 * A aba da página de cartões — ela troca a grade pelo gráfico de 12 meses, que
 * é o que faz dela aba e não filtro.
 *
 * Ela desenhava o trilho à mão: uma `<div role="tablist">` com a chapa de
 * `transaction-type-segment` e `<Button role="tab">` dentro, sem foco
 * itinerante e sem painel. `Tabs variant="solid"` é o mesmo desenho — bandeja
 * 32 com gatilho 28, 40/36 no dedo — com o marcador que viaja, as setas do
 * teclado e o ARIA do Radix.
 */
export function CreditCardsViewSegment({
    value,
    onChange,
    className,
}: {
    value: CreditCardsPageView
    onChange: (next: CreditCardsPageView) => void
    className?: string
}) {
    return (
        <Tabs
            value={value}
            onValueChange={(next) => onChange(next as CreditCardsPageView)}
            className={cn("w-full md:w-auto", className)}
        >
            <TabsList aria-label="Visão da página de cartões" className="w-full md:w-auto">
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    )
}
