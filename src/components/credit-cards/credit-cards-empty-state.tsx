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
    /** Sem ele (o convidado, Bloco 7A), o vazio só informa. */
    onAddCard?: () => void
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
                    <EmptyStateTitle>
                        {onAddCard ? "Cadastre seus cartões de crédito" : "Nenhum cartão ainda"}
                    </EmptyStateTitle>
                    <EmptyStateDescription>
                        {onAddCard
                            ? CREDIT_CARDS_EMPTY_BILLING_HINT
                            : "Quem administra a carteira cadastra os cartões. Eles aparecem aqui."}
                    </EmptyStateDescription>
                    {onAddCard ? (
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
                    ) : null}
                </EmptyState>
            </CardContent>
        </Card>
    )
}
