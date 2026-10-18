"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { CheckIcon, Cog6ToothIcon, EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/16/solid"

import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { Alert, AlertAction, AlertActions, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogBody, DialogHeader, DialogHeaderRow, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    EmptyState,
    EmptyStateActions,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { ItemGroup, ItemGroupLabel } from "@/components/ui/item"
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Caption } from "@/components/ui/typography"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { NotificationRow } from "@/components/layout/notification-row"
import {
    NOTIFICATION_PREFERENCES_HREF,
    NotificationsPanelEmpty,
} from "@/components/layout/notifications-panel-empty"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import {
    clearAllNotifications,
    deleteNotification,
    listNotifications,
    markAllRead,
    markRead,
    markUnread,
    type AppNotification,
} from "@/lib/notifications"
import { toastError } from "@/lib/toast"
import { formatDayHeadingPtBr, groupByLocalDay } from "@/lib/transaction-date"

/** O teto de `listNotifications`: com ele cheio, há mais no banco do que na lista. */
const LIMITE_DA_LISTA = 100

type Filtro = "todas" | "nao-lidas"

type NotificationsPanelProps = {
    isActive: boolean
}

export function NotificationsPanel({ isActive }: NotificationsPanelProps) {
    const { user, loading: authLoading } = useAuth()
    const { currentWorkspaceId, loading: workspaceLoading } = useWorkspace()
    const { unreadCount, adjustUnreadCount, setUnreadCount, invalidateUnreadBadge, badgeNonce } =
        useNotificationsUi()
    // `null` é "ainda não chegou": o esqueleto só aparece na primeira carga, e
    // a recarga (o sino mudou) troca a lista no lugar.
    const [notifications, setNotifications] = useState<AppNotification[] | null>(null)
    const [error, setError] = useState(false)
    const [filtro, setFiltro] = useState<Filtro>("todas")
    // O "Tentar de novo" em voo: o botão espera (a falha nova volta ao Alert).
    const [tentando, setTentando] = useState(false)
    const userId = user?.id

    // Trocar de carteira no meio de uma busca, ou marcar/limpar enquanto ela
    // corre, não pode deixar a resposta velha sobrescrever a nova.
    const fetchSeq = useRef(0)
    // Escritas em voo: o sino (e com ele a lista) só é refeito quando a última volta.
    const escritasEmVoo = useRef(0)
    const fetchNotifications = useCallback(async () => {
        if (!userId || !currentWorkspaceId) return
        const seq = ++fetchSeq.current
        try {
            // O sino não é tocado aqui: a lista para em 100, e o número dele é o do servidor.
            const rows = await listNotifications(userId, currentWorkspaceId)
            // Com escrita em voo a resposta pode ser de antes dela; a última escrita a voltar recarrega.
            if (seq !== fetchSeq.current || escritasEmVoo.current > 0) return
            setNotifications(rows)
            setError(false)
        } catch {
            if (seq !== fetchSeq.current || escritasEmVoo.current > 0) return
            setError(true)
        }
    }, [userId, currentWorkspaceId])

    const tentarDeNovo = async () => {
        setTentando(true)
        try {
            await fetchNotifications()
        } finally {
            setTentando(false)
        }
    }

    // Outra carteira é outra lista: volta ao esqueleto em vez de mostrar a anterior.
    useEffect(() => {
        setNotifications(null)
        setError(false)
    }, [userId, currentWorkspaceId])

    useEffect(() => {
        if (!isActive || authLoading || workspaceLoading) return
        void fetchNotifications()
        // `badgeNonce`: o sino foi invalidado (inclusive pelas ações daqui), e a lista acompanha.
    }, [isActive, authLoading, workspaceLoading, fetchNotifications, badgeNonce])

    // Cada escrita é otimista, e o sino é refeito quando a última em voo volta:
    // refazer depois da primeira de duas escritas rápidas mostraria a segunda
    // ainda não lida, e o sino com +1. Falhou, o refazer corrige o sino e a
    // lista (o `badgeNonce` recarrega o painel aberto).
    const escrever = async (acao: () => Promise<void>, falha: string) => {
        fetchSeq.current++
        escritasEmVoo.current++
        try {
            await acao()
        } catch (e) {
            toastError(e instanceof Error ? e.message : falha)
        } finally {
            escritasEmVoo.current--
            if (escritasEmVoo.current === 0) invalidateUnreadBadge()
        }
    }

    const onToggleRead = (n: AppNotification) => {
        if (!userId || !currentWorkspaceId) return
        const unread = !n.read_at
        adjustUnreadCount(unread ? -1 : 1)
        const readAt = unread ? new Date().toISOString() : null
        setNotifications((cur) => cur?.map((x) => (x.id === n.id ? { ...x, read_at: readAt } : x)) ?? cur)
        void escrever(
            () => (unread ? markRead : markUnread)(userId, currentWorkspaceId, n.id),
            unread ? "Não foi possível marcar como lida." : "Não foi possível marcar como não lida."
        )
    }

    const onDelete = (n: AppNotification) => {
        if (!userId || !currentWorkspaceId) return
        if (!n.read_at) adjustUnreadCount(-1)
        setNotifications((cur) => cur?.filter((x) => x.id !== n.id) ?? cur)
        void escrever(
            () => deleteNotification(userId, currentWorkspaceId, n.id),
            "Não foi possível excluir a notificação."
        )
    }

    const onMarkAllRead = () => {
        if (!userId || !currentWorkspaceId) return
        setUnreadCount(0)
        const agora = new Date().toISOString()
        setNotifications((cur) => cur?.map((x) => (x.read_at ? x : { ...x, read_at: agora })) ?? cur)
        void escrever(
            () => markAllRead(userId, currentWorkspaceId),
            "Não foi possível marcar todas como lidas."
        )
    }

    const { confirm: confirmAction, dialog: confirmDialog } = useConfirmDialog()
    const onClearAll = async () => {
        const ok = await confirmAction({
            title: "Limpar todas as notificações?",
            description: "As notificações desta carteira são apagadas.",
            actionLabel: "Limpar",
        })
        if (!ok || !userId || !currentWorkspaceId) return
        setUnreadCount(0)
        setNotifications([])
        void escrever(
            () => clearAllNotifications(userId, currentWorkspaceId),
            "Não foi possível limpar as notificações."
        )
    }

    const lista = notifications ?? []
    const naoLidas = lista.filter((n) => !n.read_at).length
    const visiveis = filtro === "nao-lidas" ? lista.filter((n) => !n.read_at) : lista
    const semConta = !authLoading && !workspaceLoading && (!user || !currentWorkspaceId)
    const carregando = !semConta && !error && notifications === null

    return (
        <>
            {confirmDialog}
            <DialogHeader>
                <DialogHeaderRow
                    endAdornment={
                        <DropdownMenu mobile="sheet">
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="tertiary" size="icon-sm" aria-label="Mais ações">
                                    <EllipsisHorizontalIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    disabled={semConta || (unreadCount === 0 && naoLidas === 0)}
                                    onSelect={onMarkAllRead}
                                >
                                    <CheckIcon />
                                    Marcar todas como lidas
                                </DropdownMenuItem>
                                {/* Link de dentro da folha: ela fecha e só então a tela abre. */}
                                <DropdownMenuItem asChild>
                                    <Link href={NOTIFICATION_PREFERENCES_HREF}>
                                        <Cog6ToothIcon />
                                        Preferências de notificação
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    disabled={lista.length === 0}
                                    onSelect={() => void onClearAll()}
                                >
                                    <TrashIcon />
                                    Limpar todas…
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    }
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <DialogTitle>Notificações</DialogTitle>
                        {unreadCount > 0 ? (
                            <Badge variant="soft" size="xs">
                                {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
                            </Badge>
                        ) : null}
                    </div>
                </DialogHeaderRow>
                {lista.length > 0 ? (
                    <ToggleGroup
                        type="single"
                        aria-label="Filtrar notificações"
                        className="mt-3"
                        value={filtro}
                        onValueChange={(v) => setFiltro(v as Filtro)}
                    >
                        <ToggleGroupItem value="todas">Todas</ToggleGroupItem>
                        <ToggleGroupItem value="nao-lidas" count={naoLidas}>
                            Não lidas
                        </ToggleGroupItem>
                    </ToggleGroup>
                ) : null}
            </DialogHeader>

            {/* `px-1`: o recuo de 12 da linha mais este dá os 16 do cabeçalho, e o
                título da linha alinha com o do painel. */}
            <DialogBody className="px-1 pt-0">
                {semConta ? (
                    <NotificationsPanelEmpty variant={!user ? "no-auth" : "no-workspace"} />
                ) : carregando ? (
                    <SkeletonGroup label="Carregando notificações…">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5">
                                <Skeleton shape="circle" size="sm" />
                                <SkeletonText lines={2} className="text-sm" />
                            </div>
                        ))}
                    </SkeletonGroup>
                ) : error && lista.length === 0 ? (
                    // Erro com a lista vazia é erro, nunca o vazio: o "Limpar todas"
                    // otimista que falhou deixaria "Nenhuma notificação" com as linhas no banco.
                    <Alert tone="destructive" size="sm" className="mx-3">
                        <AlertTitle>Não deu para carregar as notificações.</AlertTitle>
                        <AlertActions>
                            <AlertAction disabled={tentando} aria-busy={tentando} onClick={() => void tentarDeNovo()}>
                                {tentando ? <Spinner /> : null}
                                Tentar de novo
                            </AlertAction>
                        </AlertActions>
                    </Alert>
                ) : !error && lista.length === 0 ? (
                    <NotificationsPanelEmpty variant="inbox-empty" />
                ) : visiveis.length === 0 ? (
                    <EmptyState variant="plain" size="sm" role="status">
                        <EmptyStateIcon variant="done" />
                        <EmptyStateTitle>Tudo lido</EmptyStateTitle>
                        <EmptyStateActions>
                            <Button type="button" variant="tertiary" onClick={() => setFiltro("todas")}>
                                Ver todas
                            </Button>
                        </EmptyStateActions>
                    </EmptyState>
                ) : (
                    <>
                        {groupByLocalDay(visiveis, (n) => n.created_at).map((grupo) => (
                            <div key={grupo.chave}>
                                <ItemGroupLabel sticky>
                                    {formatDayHeadingPtBr(grupo.data)}
                                </ItemGroupLabel>
                                <ItemGroup variant="divided">
                                    {grupo.itens.map((n) => (
                                        <NotificationRow
                                            key={n.id}
                                            notification={n}
                                            onToggleRead={onToggleRead}
                                            onDelete={onDelete}
                                        />
                                    ))}
                                </ItemGroup>
                            </div>
                        ))}
                        {lista.length >= LIMITE_DA_LISTA ? (
                            <Caption className="px-3 pt-3 text-center">
                                Mostrando as 100 mais recentes.
                            </Caption>
                        ) : null}
                    </>
                )}
            </DialogBody>
        </>
    )
}
