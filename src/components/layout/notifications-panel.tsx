"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react"
import { CheckIcon, Cog6ToothIcon, EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/16/solid"

import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { Alert, AlertAction, AlertActions, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MOLA, SAIDA } from "@/lib/spring"
import { Button } from "@/components/ui/button"
import {
    DialogBody,
    DialogCloseButton,
    DialogHeader,
    DialogHeaderRow,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

/** A altura do `ItemGroupLabel` (12px de recuo + a linha de 16): o lugar do dia preso. */
const ROTULO_DO_DIA_PX = 28

// A troca do dia preso é um empurrão: o rótulo da lista chega à base do lugar
// e o preso o assume. Descendo (`sentido` 1), o novo sobe dos 28px onde estava o
// rótulo da lista, na mola, e o velho sai 8px para cima, curto; voltando (-1), o
// novo desce 8px e o velho volta 28px para a lista. Desfoque de 2px na troca,
// como a legenda do calendário ao trocar de mês.
const TROCA_DO_DIA: Variants = {
    entra: (sentido: number) => ({ opacity: 0, y: sentido > 0 ? ROTULO_DO_DIA_PX : -8, filter: "blur(2px)" }),
    parado: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { y: MOLA, opacity: { duration: 0.2, ease: "easeOut" }, filter: { duration: 0.2, ease: "easeOut" } },
    },
    sai: (sentido: number) => ({
        opacity: 0,
        y: sentido > 0 ? -8 : ROTULO_DO_DIA_PX,
        filter: "blur(2px)",
        transition: SAIDA,
    }),
}

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
    const [filtro, setFiltro] = useState<Filtro>("nao-lidas")
    const [diaAtual, setDiaAtual] = useState<string | null>(null)
    const [sentido, setSentido] = useState(1)
    const movimentoReduzido = useReducedMotion()
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
    // Com as abas, a lista sobe por trás do trilho e se dissolve ali, como o
    // formulário de despesa: o trilho é a faixa da dissolução (36 no mouse, 40
    // no dedo), e o respiro de cima cresce na mesma medida.
    const comTrilho = lista.length > 0
    // O dia fica preso logo abaixo das abas, fora da lista: preso dentro dela, a
    // dissolução o apagaria. O rótulo do dia na lista sobe e se dissolve por trás
    // dele, e o de cima troca para o dia que acabou de passar. A dissolução
    // começa nas abas e atravessa o dia (ver o corpo, abaixo).
    const grupos = groupByLocalDay(visiveis, (n) => n.created_at)
    const comDia = comTrilho && grupos.length > 0
    const indiceDoDia = Math.max(0, grupos.findIndex((g) => g.chave === diaAtual))
    const diaPreso = grupos[indiceDoDia]
    // O dia preso é o do último grupo cujo rótulo já chegou à base do lugar dele;
    // o rótulo desse grupo na lista some (foi entregue ao preso), e nunca há dois
    // dias iguais à vista nem um lugar vazio.
    const acompanharDia = (e: React.UIEvent<HTMLDivElement>) => {
        const corpo = e.currentTarget
        const base = corpo.getBoundingClientRect().top + parseFloat(getComputedStyle(corpo).paddingTop) + 1
        let atual: string | null = null
        for (const g of corpo.querySelectorAll<HTMLElement>("[data-dia]")) {
            if (g.getBoundingClientRect().top > base) break
            atual = g.dataset.dia ?? null
        }
        if (atual === diaAtual) return
        const de = grupos.findIndex((g) => g.chave === (diaAtual ?? grupos[0]?.chave))
        const para = grupos.findIndex((g) => g.chave === atual)
        setSentido(para >= de ? 1 : -1)
        setDiaAtual(atual)
    }

    const cabecalho = (
        <>
                <DialogHeaderRow
                    endAdornment={
                        <>
                        <DropdownMenu mobile="sheet">
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="tertiary" size="icon-md" className="-my-0.5" aria-label="Mais ações">
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
                                        Configurar notificações
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    disabled={lista.length === 0}
                                    onSelect={() => void onClearAll()}
                                >
                                    <TrashIcon />
                                    Limpar notificações
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* O × mora na linha do título, ao lado do ⋯, e não no canto da folha. */}
                        <DialogCloseButton placement="inline" size="icon-md" className="-my-0.5" label="Fechar notificações" />
                        </>
                    }
                >
                    <DialogTitle>Notificações</DialogTitle>
                </DialogHeaderRow>
                {lista.length > 0 ? (
                    <Tabs
                        value={filtro}
                        onValueChange={(v) => setFiltro(v as Filtro)}
                        className="relative z-10 mt-3"
                    >
                        <TabsList aria-label="Filtrar notificações">
                            {/* A contagem é a pastilha da aba, na forma e na cor do número do sino (o círculo de 16), e some no zero. */}
                            <TabsTrigger
                                value="nao-lidas"
                                count={
                                    naoLidas > 0 ? (
                                        <Badge
                                            size="xs"
                                            className={cn(
                                                "relative isolate h-4 min-w-4 border-0 bg-transparent px-1 font-semibold",
                                                // A bolha é um `::before` com a tinta do `tagChipUnreadCount`, e
                                                // anda com o marcador líquido da aba: ao entrar, espera ele chegar
                                                // (220ms do trajeto de 400) e enche na mola; ao sair, toma impulso
                                                // (a curva recua antes) e esvazia enquanto ele parte, e o azul
                                                // some por último, deixando só o número em azul.
                                                "text-info-foreground delay-220 duration-(--duration-spring) ease-(--ease-spring)",
                                                "before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-info",
                                                "before:transition-[scale,opacity] before:delay-220 before:duration-(--duration-spring) before:ease-(--ease-spring)",
                                                "group-data-[state=inactive]/tab:text-info group-data-[state=inactive]/tab:delay-100 group-data-[state=inactive]/tab:duration-(--duration-base) group-data-[state=inactive]/tab:ease-(--ease-in-out)",
                                                "group-data-[state=inactive]/tab:before:scale-30 group-data-[state=inactive]/tab:before:opacity-0",
                                                "group-data-[state=inactive]/tab:before:[transition:scale_320ms_cubic-bezier(0.5,-0.45,0.75,0.2),opacity_160ms_var(--ease-in-out)_160ms]"
                                            )}
                                        >
                                            {naoLidas}
                                        </Badge>
                                    ) : undefined
                                }
                            >
                                Não lidas
                            </TabsTrigger>
                            <TabsTrigger value="todas">Todas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                ) : null}
                {comDia ? (
                    // Altura fixa (8 + 28): o que sai vira absoluto, e o cabeçalho não muda.
                    <div aria-hidden className="relative h-9 pt-2">
                        {/* `popLayout`: o que sai vira absoluto e os dois se cruzam no mesmo lugar. */}
                        <AnimatePresence initial={false} mode="popLayout" custom={sentido}>
                            <motion.div
                                key={diaPreso.chave}
                                custom={sentido}
                                variants={movimentoReduzido ? undefined : TROCA_DO_DIA}
                                initial="entra"
                                animate="parado"
                                exit="sai"
                            >
                                <ItemGroupLabel className="px-0">{formatDayHeadingPtBr(diaPreso.data)}</ItemGroupLabel>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : null}
        </>
    )
    const conteudo = (
        <>
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
                    // Erro com a lista vazia é erro, nunca o vazio: o "Limpar notificações"
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
                        {grupos.map((grupo, i) => (
                            <div key={grupo.chave} data-dia={grupo.chave}>
                                {/* O primeiro dia já está preso no cabeçalho; aqui fica para o leitor de tela. */}
                                {/* Entregue ao preso, o rótulo some da lista; volta quando o grupo desce. */}
                                <ItemGroupLabel
                                    className={cn(
                                        "transition-opacity duration-(--duration-fast) ease-(--ease-out)",
                                        i === 0 ? "sr-only" : i <= indiceDoDia && "opacity-0"
                                    )}
                                >
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
        </>
    )

    return (
        <>
            {confirmDialog}
            {/* Com a lista subindo por trás das abas, o cabeçalho inteiro fica por cima
                dela: a entrada em cascata o faz contexto de empilhamento, e o `z-10` só das
                abas não saía dele — o clique em "Todas" caía no link da linha embaixo. */}
            <DialogHeader
                className={cn(comTrilho && "relative z-10 group-data-[layout=fixed]/dialog-content:pb-0")}
            >
                {cabecalho}
            </DialogHeader>
            {/* `px-1`: o recuo de 12 da linha mais este dá os 16 do cabeçalho, e o
                título da linha alinha com o do painel. */}
            <DialogBody
                onScroll={comDia ? acompanharDia : undefined}
                className={cn(
                    "px-1",
                    comDia
                        ? // A dissolução nasce na base das abas, não do dia: a faixa é só o
                          // trilho, e a rampa (80px) atravessa o dia preso (8 + 28) antes de
                          // abrir; o corpo sobe por trás das abas e do dia, e o respiro devolve os
                          // dois: a primeira linha não se move.
                          "-mt-[calc(var(--scroll-fade-band-h)+--spacing(9))] pt-[calc(var(--scroll-fade-band-h)+--spacing(9))] [--scroll-fade-band-h:--spacing(9)] pointer-coarse:[--scroll-fade-band-h:--spacing(10)] [--dialog-body-fade-h:--spacing(20)]"
                        : comTrilho
                          ? "-mt-(--scroll-fade-band-h) pt-[calc(var(--scroll-fade-band-h)+--spacing(4))] [--scroll-fade-band-h:--spacing(9)] pointer-coarse:[--scroll-fade-band-h:--spacing(10)]"
                          : "pt-0"
                )}
            >
                {conteudo}
            </DialogBody>
        </>
    )
}
