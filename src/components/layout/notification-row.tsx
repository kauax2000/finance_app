"use client"

import Link from "next/link"
import { useRef } from "react"
import { CheckIcon, EllipsisHorizontalIcon, EnvelopeIcon, TrashIcon } from "@heroicons/react/16/solid"

import { BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Item,
    ItemActions,
    ItemChevron,
    ItemContent,
    ItemDescription,
    ItemLink,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getNotificationAction } from "@/lib/notification-actions"
import { getNotificationIcon, notificationTone } from "@/lib/notification-visuals"
import { horaLocal, type AppNotification } from "@/lib/notifications"

type NotificationRowProps = {
    notification: AppNotification
    onToggleRead: (n: AppNotification) => void
    onDelete: (n: AppNotification) => void
}

// No cursor as ações da linha aparecem no hover e no foco (o Tab chega a elas e
// as acende); o ⋯ aberto fica à vista. No toque o ⋯ fica sempre, e o marcar some.
const AO_PASSAR = "opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100"

export function NotificationRow({ notification: n, onToggleRead, onDelete }: NotificationRowProps) {
    const unread = !n.read_at
    // Sem destino, marcar como lida desmonta o link: o foco vai ao ⋯ da linha, e não ao <body>.
    const maisRef = useRef<HTMLButtonElement>(null)
    const action = getNotificationAction(n)
    const hora = horaLocal(n.created_at)
    const rotuloLer = unread ? "Marcar como lida" : "Marcar como não lida"
    const IconeLer = unread ? CheckIcon : EnvelopeIcon
    // O peso e o ponto são visuais; o leitor de tela ouve o estado no nome do link.
    const titulo = (
        <>
            {unread ? <span className="sr-only">Não lida: </span> : null}
            {n.title}
        </>
    )

    return (
        // Lida e sem destino, o clique não tem o que fazer: a linha não acende.
        <Item size="md" interactive={action != null || unread}>
            <ItemMedia variant="tile" tone={notificationTone(n)}>
                {getNotificationIcon(n)}
            </ItemMedia>
            <ItemContent>
                <ItemTitle className={unread ? "font-semibold" : "font-medium"}>
                    {action ? (
                        // A folha fecha e só então navega (o link de dentro dela);
                        // a leitura corre em segundo plano, sem segurar a tela.
                        <ItemLink asChild>
                            <Link href={action.href} onClick={() => unread && onToggleRead(n)}>
                                {titulo}
                            </Link>
                        </ItemLink>
                    ) : unread ? (
                        <ItemLink
                            onClick={() => {
                                maisRef.current?.focus()
                                onToggleRead(n)
                            }}
                        >
                            {titulo}
                        </ItemLink>
                    ) : (
                        titulo
                    )}
                </ItemTitle>
                <ItemDescription>{n.body}</ItemDescription>
            </ItemContent>
            <ItemActions>
                <time dateTime={n.created_at} className="nums text-xs text-muted-foreground">
                    {hora}
                </time>
                {unread ? <BadgeDot className="[--badge-dot:var(--primary-accent)]" /> : null}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="icon-xs"
                            aria-label={rotuloLer}
                            className={`${AO_PASSAR} pointer-coarse:hidden`}
                            onClick={() => onToggleRead(n)}
                        >
                            <IconeLer />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{rotuloLer}</TooltipContent>
                </Tooltip>
                <DropdownMenu mobile="sheet">
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="icon-sm"
                            ref={maisRef}
                            aria-label={`Mais opções: ${n.title}`}
                            className={`${AO_PASSAR} data-[state=open]:opacity-100 pointer-coarse:opacity-100`}
                        >
                            <EllipsisHorizontalIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        size="sm"
                        header={<DropdownMenuHeader title={n.title} description={hora} />}
                    >
                        <DropdownMenuItem onSelect={() => onToggleRead(n)}>
                            <IconeLer />
                            {rotuloLer}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(n)}>
                            <TrashIcon />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </ItemActions>
            {/* Só a linha que leva a algum lugar tem a seta. */}
            {action ? <ItemChevron /> : null}
        </Item>
    )
}
