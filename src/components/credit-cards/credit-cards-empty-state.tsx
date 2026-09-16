"use client"

import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { PlusIcon } from "@heroicons/react/16/solid"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import { CREDIT_CARDS_EMPTY_BILLING_HINT } from "@/lib/credit-card-billing-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export type CreditCardsEmptyStateProps = {
    onAddCard: () => void
}

export function CreditCardsEmptyState({ onAddCard }: CreditCardsEmptyStateProps) {
    return (
        <Card padding="none">
            <CardContent
                className="px-4 py-12 md:py-14"
                role="status"
                aria-live="polite"
            >
                <EmptyState variant="plain" size="lg">
                    <EmptyStateIcon><CreditCardIcon aria-hidden /></EmptyStateIcon>
                    <EmptyStateTitle>Cadastre seus cartões de crédito</EmptyStateTitle>
                    <EmptyStateDescription>
                        {CREDIT_CARDS_EMPTY_BILLING_HINT}
                    </EmptyStateDescription>
                    <EmptyStateActions>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="h-8 gap-2 text-xs"
                            onClick={onAddCard}
                        >
                            <PlusIcon className="size-4 shrink-0" />
                            Novo cartão
                        </Button>
                    </EmptyStateActions>
                </EmptyState>
            </CardContent>
        </Card>
    )
}
