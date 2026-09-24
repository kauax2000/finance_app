"use client"

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
import { Button } from "@/components/ui/button"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"

const INBOX_HINTS = [
    "Alertas de orçamento ao se aproximar do limite",
    "Convites e mudanças na equipe da carteira",
    "Avisos do sistema relevantes para este espaço",
] as const

export type NotificationsPanelEmptyVariant = "no-auth" | "no-workspace" | "inbox-empty"

type NotificationsPanelEmptyProps = {
    variant: NotificationsPanelEmptyVariant
    onOpenPreferences?: () => void
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
            "Quando algo importante acontecer nesta carteira, avisamos por aqui. Exemplos do que pode aparecer:",
    },
}

export function NotificationsPanelEmpty({
    variant,
    onOpenPreferences,
}: NotificationsPanelEmptyProps) {
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
                <ul
                    className="max-w-xs list-outside list-disc pl-4 text-left text-xs leading-relaxed text-muted-foreground"
                    aria-label="Tipos de notificação que podem aparecer"
                >
                    {INBOX_HINTS.map((line) => (
                        <li key={line} className="pl-1 marker:text-muted-foreground/80">
                            {line}
                        </li>
                    ))}
                </ul>
            ) : null}
            {variant === "inbox-empty" && onOpenPreferences ? (
                <EmptyStateActions>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onOpenPreferences}
                    >
                        Preferências de notificação
                    </Button>
                </EmptyStateActions>
            ) : null}
        </EmptyState>
    )
}
