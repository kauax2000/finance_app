"use client"

import type * as React from "react"
import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import {
    NotificationsEmptyIllustration,
    NotificationsLockedIllustration,
    NotificationsWalletsIllustration,
} from "@/components/layout/notifications-empty-illustration"

/** As preferências de notificação: tela própria no celular, âncora das Configurações no desktop. */
export function preferenciasDeNotificacaoHref(isMobile: boolean): string {
    return isMobile ? ROUTES.SETTINGS_NOTIFICACOES : `${ROUTES.SETTINGS}#notificacoes`
}

export type NotificationsPanelEmptyVariant = "no-auth" | "no-workspace" | "inbox-empty"

type NotificationsPanelEmptyProps = {
    variant: NotificationsPanelEmptyVariant
}

const VARIANT_META: Record<
    NotificationsPanelEmptyVariant,
    // Cada vazio tem a sua cena, na mesma língua: as notificações em miniatura.
    { Ilustracao: (props: { className?: string }) => React.ReactNode; title: string; description: string }
> = {
    "no-auth": {
        Ilustracao: NotificationsLockedIllustration,
        title: "Entre para ver suas notificações",
        description:
            "Faça login para receber alertas de orçamento, convites e outros avisos da sua carteira.",
    },
    "no-workspace": {
        Ilustracao: NotificationsWalletsIllustration,
        title: "Selecione uma carteira",
        description:
            "Escolha uma carteira na barra lateral para ver as notificações deste espaço.",
    },
    "inbox-empty": {
        Ilustracao: NotificationsEmptyIllustration,
        title: "Nenhuma notificação",
        description:
            "Alertas de orçamento, cartões, contas e convites desta carteira aparecem aqui.",
    },
}

export function NotificationsPanelEmpty({ variant }: NotificationsPanelEmptyProps) {
    const meta = VARIANT_META[variant]
    const isMobile = useIsMobile()

    return (
        // No alto do painel, 64px abaixo do cabeçalho, como o "Tudo lido".
        <EmptyState variant="plain" role="status" className="pt-16">
            {/* A cena de cada vazio (`notifications-empty-illustration`): a caixa que vai
                encher, os avisos trancados sem conta, a carteira a escolher. */}
            <meta.Ilustracao />
            <EmptyStateTitle>{meta.title}</EmptyStateTitle>
            <EmptyStateDescription className="max-w-xs text-xs leading-relaxed">
                {meta.description}
            </EmptyStateDescription>
            {variant === "inbox-empty" ? (
                <EmptyStateActions>
                    {/* Link de dentro da folha: ela fecha e só então a tela abre. */}
                    <Button asChild variant="tertiary">
                        <Link href={preferenciasDeNotificacaoHref(isMobile)}>Configurar notificações</Link>
                    </Button>
                </EmptyStateActions>
            ) : null}
        </EmptyState>
    )
}
