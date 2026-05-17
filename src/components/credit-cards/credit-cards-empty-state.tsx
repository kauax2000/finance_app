"use client"

import { CreditCard, Plus } from "lucide-react"
import { CREDIT_CARDS_EMPTY_BILLING_HINT } from "@/lib/credit-card-billing-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type CreditCardsEmptyStateProps = {
    onAddCard: () => void
}

export function CreditCardsEmptyState({ onAddCard }: CreditCardsEmptyStateProps) {
    return (
        <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
            <CardContent
                className="flex flex-col items-center justify-center px-4 py-12 text-center md:py-14"
                role="status"
                aria-live="polite"
            >
                <div
                    className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                    aria-hidden
                >
                    <CreditCard className="size-7 text-muted-foreground" />
                </div>
                <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                    Cadastre seus cartões de crédito
                </h2>
                <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
                    {CREDIT_CARDS_EMPTY_BILLING_HINT}
                </p>
                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={onAddCard}
                >
                    <Plus className="size-4 shrink-0" />
                    Novo cartão
                </Button>
            </CardContent>
        </Card>
    )
}
