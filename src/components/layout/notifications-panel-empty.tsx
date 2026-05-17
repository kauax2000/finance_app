"use client"

import type { HeroIcon } from "@/types/navigation"
import { BellIcon, BellSlashIcon, Bars3BottomLeftIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"

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
    { icon: HeroIcon; title: string; description: string }
> = {
    "no-auth": {
        icon: BellIcon,
        title: "Entre para ver suas notificações",
        description:
            "Faça login para receber alertas de orçamento, convites e outros avisos da sua carteira.",
    },
    "no-workspace": {
        icon: Bars3BottomLeftIcon,
        title: "Selecione uma carteira",
        description:
            "Escolha uma carteira na barra lateral para ver as notificações deste espaço.",
    },
    "inbox-empty": {
        icon: BellSlashIcon,
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
    const Icon = meta.icon

    return (
        <div
            role="status"
            className="flex min-h-[min(320px,50dvh)] flex-1 flex-col items-center justify-center px-4 py-10 text-center"
        >
            <div
                className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted shadow-sm ring-1 ring-border/60"
                aria-hidden
            >
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{meta.title}</p>
            <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-muted-foreground sm:max-w-xs">
                {meta.description}
            </p>
            {variant === "inbox-empty" ? (
                <ul
                    className="mt-4 max-w-[260px] list-outside list-disc pl-4 text-left text-xs leading-relaxed text-muted-foreground sm:max-w-xs"
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
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-5"
                    onClick={onOpenPreferences}
                >
                    Preferências de notificação
                </Button>
            ) : null}
        </div>
    )
}
