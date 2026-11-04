"use client"

import { JanelaDoAparelho, TELA_DA_NOTIFICACAO } from "@/components/account/passo-a-passo"
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"

/** O vazio de Lançar pelo iPhone: em Configurações e no cartão da página Você. */
export function LancarPeloIphoneVazio({ onConectar }: { onConectar: () => void }) {
    return (
        <EmptyState variant="plain" size="sm">
            <JanelaDoAparelho tela={TELA_DA_NOTIFICACAO} tamanho="compacta" />
            <EmptyStateTitle>Lance gastos sem abrir o app</EmptyStateTitle>
            <EmptyStateDescription>
                Conecte o iPhone uma vez. Depois, pela Siri, pelo Botão de Ação ou com um toque, o gasto entra em segundos.
            </EmptyStateDescription>
            <EmptyStateActions>
                <Button type="button" variant="primary" onClick={onConectar}>
                    Conectar o iPhone
                </Button>
            </EmptyStateActions>
        </EmptyState>
    )
}
