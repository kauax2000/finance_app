"use client"

import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateGhost,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { PlusIcon } from "@heroicons/react/16/solid"
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
                
                role="status"
                aria-live="polite"
            >
                <EmptyState variant="plain" size="lg">
                    <EmptyStateGhost leading="card" trailing="amount" />
                    <EmptyStateTitle>Cadastre seus cartões de crédito</EmptyStateTitle>
                    <EmptyStateDescription>
                        {CREDIT_CARDS_EMPTY_BILLING_HINT}
                    </EmptyStateDescription>
                    <EmptyStateActions>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={onAddCard}
                        >
                            <PlusIcon aria-hidden />
                            Novo cartão
                        </Button>
                    </EmptyStateActions>
                </EmptyState>
            </CardContent>
        </Card>
    )
}
