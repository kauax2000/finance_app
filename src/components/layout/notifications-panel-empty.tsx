"use client"

import Link from "next/link"
import type { HeroIcon } from "@/types/navigation"
import {
    Bars3BottomLeftIcon,
    BellIcon,
    BellSlashIcon,
    ChartPieIcon,
    LockClosedIcon,
    UserCircleIcon,
    UserPlusIcon,
    WalletIcon,
} from "@heroicons/react/24/outline"
import { ROUTES } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"

/** A seção "Notificações desta carteira" das Configurações (o `id` dela). */
export const NOTIFICATION_PREFERENCES_HREF = `${ROUTES.SETTINGS}#notificacoes`

export type NotificationsPanelEmptyVariant = "no-auth" | "no-workspace" | "inbox-empty"

type NotificationsPanelEmptyProps = {
    variant: NotificationsPanelEmptyVariant
}

const VARIANT_META: Record<
    NotificationsPanelEmptyVariant,
    { icons: readonly [HeroIcon, HeroIcon, HeroIcon]; title: string; description: string }
> = {
    "no-auth": {
        icons: [UserCircleIcon, BellIcon, LockClosedIcon],
        title: "Entre para ver suas notificações",
        description:
            "Faça login para receber alertas de orçamento, convites e outros avisos da sua carteira.",
    },
    "no-workspace": {
        icons: [WalletIcon, Bars3BottomLeftIcon, BellIcon],
        title: "Selecione uma carteira",
        description:
            "Escolha uma carteira na barra lateral para ver as notificações deste espaço.",
    },
    "inbox-empty": {
        icons: [ChartPieIcon, BellSlashIcon, UserPlusIcon],
        title: "Nenhuma notificação",
        description:
            "Alertas de orçamento, cartões, contas e convites desta carteira aparecem aqui.",
    },
}

export function NotificationsPanelEmpty({ variant }: NotificationsPanelEmptyProps) {
    const meta = VARIANT_META[variant]

    return (
        <EmptyState
            variant="plain"
            role="status"
            className="min-h-[min(320px,50dvh)] flex-1"
        >
            <EmptyStateIcon variant="stack">
                {meta.icons.map((Icon, i) => (
                    <Icon key={i} aria-hidden />
                ))}
            </EmptyStateIcon>
            <EmptyStateTitle>{meta.title}</EmptyStateTitle>
            <EmptyStateDescription className="max-w-xs text-xs leading-relaxed">
                {meta.description}
            </EmptyStateDescription>
            {variant === "inbox-empty" ? (
                <EmptyStateActions>
                    {/* Link de dentro da folha: ela fecha e só então a tela abre. */}
                    <Button asChild variant="tertiary">
                        <Link href={NOTIFICATION_PREFERENCES_HREF}>Preferências de notificação</Link>
                    </Button>
                </EmptyStateActions>
            ) : null}
        </EmptyState>
    )
}
