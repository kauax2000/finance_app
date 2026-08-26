"use client"

import { Button } from "@/components/ui/button"
import {
    transactionSegmentContainerClassName,
    transactionSegmentTabClassName,
} from "@/components/transactions/transaction-type-segment"
import { cn } from "@/lib/utils"

export type CreditCardsPageView = "cards" | "history"

const TABS: { value: CreditCardsPageView; label: string }[] = [
    { value: "cards", label: "Cartões" },
    { value: "history", label: "Histórico" },
]

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
        <div
            className={cn(transactionSegmentContainerClassName, className)}
            role="tablist"
            aria-label="Visão da página de cartões"
        >
            {TABS.map((tab) => {
                const selected = value === tab.value
                return (
                    <Button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        size="sm"
                        variant="tertiary"
                        className={transactionSegmentTabClassName(selected)}
                        onClick={() => onChange(tab.value)}
                    >
                        {tab.label}
                    </Button>
                )
            })}
        </div>
    )
}
