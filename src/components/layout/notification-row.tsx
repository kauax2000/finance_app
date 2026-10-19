"use client"

import Link from "next/link"
import { useRef } from "react"
import { CheckIcon, EllipsisHorizontalIcon, EnvelopeIcon, TrashIcon } from "@heroicons/react/16/solid"

import { BadgeDot } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Item,
    ItemActions,
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
import { cn } from "@/lib/utils"

type NotificationRowProps = {
    notification: AppNotification
    onToggleRead: (n: AppNotification) => void
    onDelete: (n: AppNotification) => void
}

// A linha não reserva coluna para as ações: a hora e o ponto moram na linha do
// título, e no cursor (ou no foco, que o Tab acende) o ✓ e o excluir tomam o
// lugar deles. No toque o ⋯ fica sempre, depois da hora, e abre os dois.
const ACOES_NO_LUGAR = [
    "absolute end-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-opacity duration-(--duration-fast)",
    "opacity-0 group-hover/item:opacity-100 [@media(hover:hover)]:group-focus-within/item:opacity-100 has-data-[state=open]:opacity-100",
    "pointer-coarse:static pointer-coarse:translate-y-0 pointer-coarse:opacity-100",
].join(" ")
// Os dois botões da linha: 32 com o ícone de 16, apagados em repouso e acesos no
// cursor, e o realce é a mesma tinta de vidro da linha, um degrau acima dela (o
// `accent` a 50% virava uma mancha escura sobre a linha acesa).
const BOTAO_DA_LINHA =
    "text-muted-foreground [--button-hover-fill:color-mix(in_oklab,var(--foreground)_9%,transparent)] [&_svg]:size-4"
// Os dois botões (66px) são mais largos que a hora e o ponto que eles cobrem
// (34 a 46): com eles à vista, o fim do título se dissolve por baixo, em vez de
// encostar neles. Em repouso nada muda, e o título não quebra antes da hora.
const TITULO_SOB_ACOES =
    "[@media(hover:hover)]:group-hover/item:[mask-image:linear-gradient(to_left,transparent_28px,#000_48px)] [@media(hover:hover)]:group-focus-within/item:[mask-image:linear-gradient(to_left,transparent_28px,#000_48px)]"
// O excluir acende como todo botão `destructive`: a tinta e o vermelho dele no
// cursor (22% no claro, 25% no escuro), e apagado em repouso, como o ✓.
const BOTAO_EXCLUIR = [
    "hover:text-destructive-muted-foreground active:text-destructive-muted-foreground",
    "[--button-hover-fill:color-mix(in_oklab,var(--destructive)_22%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,var(--destructive)_25%,transparent)]",
].join(" ")
const META_SOME = [
    "flex items-center gap-1.5 transition-opacity duration-(--duration-fast)",
    "group-hover/item:opacity-0 [@media(hover:hover)]:group-focus-within/item:opacity-0 group-has-data-[state=open]/item:opacity-0",
    "pointer-coarse:opacity-100",
].join(" ")

export function NotificationRow({ notification: n, onToggleRead, onDelete }: NotificationRowProps) {
    const unread = !n.read_at
    // Sem destino, marcar como lida desmonta o link: o foco vai ao botão que está à
    // vista (o ✓ no cursor, o ⋯ no toque), e não ao <body>.
    const lerRef = useRef<HTMLButtonElement>(null)
    const maisRef = useRef<HTMLButtonElement>(null)
    const focarAcao = () =>
        [lerRef.current, maisRef.current].find((b) => b && b.offsetParent !== null)?.focus()
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
        // `items-start`: o ladrilho acompanha o título, e não o meio de um texto de duas linhas.
        // Os tons da barra lateral, como o seletor de carteira: a passagem é o hover de
        // uma linha dela (`--sidebar-accent` a 50%, ainda translúcido sobre o vidro) e o
        // toque é o tom cheio dela, mais forte que a passagem.
        <Item
            size="md"
            interactive={action != null || unread}
            // `rounded-surface` (22): a 8px da borda da folha (28), o concêntrico seria 20, e
            // o degrau mais perto da escala é o da superfície; o `row-lg` (16) lia quadrado.
            // `px-2`: com o recuo de 8 da lista, o texto fica nos 16 do cabeçalho.
            className="items-start rounded-surface px-2 hover:bg-sidebar-accent/50 active:bg-sidebar-accent"
        >
            <ItemMedia variant="tile" tint="vivid" tone={notificationTone(n)}>
                {getNotificationIcon(n)}
            </ItemMedia>
            <ItemContent>
                <div className="flex min-h-6 items-center gap-2">
                    <ItemTitle
                        className={cn(
                            "w-auto min-w-0 flex-1",
                            TITULO_SOB_ACOES,
                            unread ? "font-semibold" : "font-medium text-muted-foreground"
                        )}
                    >
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
                                    focarAcao()
                                    onToggleRead(n)
                                }}
                            >
                                {titulo}
                            </ItemLink>
                        ) : (
                            titulo
                        )}
                    </ItemTitle>
                    <ItemActions className="relative shrink-0 gap-1">
                        <span className={META_SOME}>
                            <time dateTime={n.created_at} className="nums text-xs text-muted-foreground">
                                {hora}
                            </time>
                            {/* O azul da contagem de não lidas. */}
                            {unread ? <BadgeDot className="[--badge-dot:var(--info)]" /> : null}
                        </span>
                        {/* No cursor, as duas ações à mão (✓ e excluir, que tem 8s para desfazer);
                            no toque, sem hover, o ⋯ abre as mesmas duas. Nada repete a linha: nem
                            o título, nem a hora. */}
                        <span className={ACOES_NO_LUGAR}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="icon-md"
                                        ref={lerRef}
                                        aria-label={rotuloLer}
                                        className={cn(BOTAO_DA_LINHA, "pointer-coarse:hidden")}
                                        onClick={() => onToggleRead(n)}
                                    >
                                        <IconeLer />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{rotuloLer}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="icon-md"
                                        aria-label={`Excluir: ${n.title}`}
                                        className={cn(BOTAO_DA_LINHA, BOTAO_EXCLUIR, "pointer-coarse:hidden")}
                                        onClick={() => onDelete(n)}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="tertiary"
                                        size="icon-md"
                                        className={cn(BOTAO_DA_LINHA, "hidden pointer-coarse:inline-flex")}
                                        ref={maisRef}
                                        aria-label={`Mais opções: ${n.title}`}
                                    >
                                        <EllipsisHorizontalIcon />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" size="sm">
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
                        </span>
                    </ItemActions>
                </div>
                <ItemDescription>{n.body}</ItemDescription>
            </ItemContent>
        </Item>
    )
}
