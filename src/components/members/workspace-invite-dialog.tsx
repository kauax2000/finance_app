"use client"

import * as React from "react"
import {
    CheckIcon,
    DocumentDuplicateIcon,
    LinkIcon,
    ArrowPathIcon,
    EnvelopeIcon,
    PaperAirplaneIcon,
} from "@heroicons/react/24/outline"
import type { User } from "@supabase/supabase-js"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase, type WorkspaceInvite } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { toastError, toastSuccess } from "@/lib/toast"
import {
    dispatchFinanceMembersMutated,
} from "@/lib/workspace-data-events"

function buildAcceptInviteUrl(tokenRaw: string): string {
    if (typeof window === "undefined") return ""
    const base = window.location.origin.replace(/\/$/, "")
    return `${base}/invites/accept?token=${encodeURIComponent(tokenRaw)}`
}

function formatLinkInviteExpiresAt(iso: string | null | undefined): string | null {
    if (!iso) return null
    const end = new Date(iso).getTime()
    if (Number.isNaN(end)) return null
    const ms = end - Date.now()
    if (ms <= 0) return "Este link já expirou."
    const days = Math.ceil(ms / 86_400_000)
    if (days > 1)
        return `Expira em cerca de ${days} dias (${new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}).`
    if (days === 1)
        return `Expira em cerca de 1 dia (${new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}).`
    const hours = Math.max(1, Math.ceil(ms / 3_600_000))
    return `Expira em cerca de ${hours} h (${new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}).`
}

export type WorkspaceInviteDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    workspaceId: string | null
    canManageMembers: boolean
}

export function WorkspaceInviteDialog({
    open,
    onOpenChange,
    user,
    workspaceId,
    canManageMembers,
}: WorkspaceInviteDialogProps) {
    const isMobile = useIsMobile()
    const [invites, setInvites] = React.useState<WorkspaceInvite[]>([])
    const [inviteEmail, setInviteEmail] = React.useState("")
    const [loadingInvites, setLoadingInvites] = React.useState(false)
    const [savingInvite, setSavingInvite] = React.useState(false)
    const [savingLink, setSavingLink] = React.useState(false)
    const [busyInviteId, setBusyInviteId] = React.useState<string | null>(null)
    const [busyResendInviteId, setBusyResendInviteId] = React.useState<string | null>(
        null,
    )
    const [generatedLinkUrl, setGeneratedLinkUrl] = React.useState<string | null>(null)
    const [generatedLinkExpiresAt, setGeneratedLinkExpiresAt] = React.useState<
        string | null
    >(null)
    const [linkCopied, setLinkCopied] = React.useState(false)

    const pendingLinkInvite = React.useMemo(
        () => invites.find((i) => i.invited_email == null),
        [invites],
    )
    const persistedLinkUrl = React.useMemo(() => {
        const raw = pendingLinkInvite?.token_raw?.trim()
        if (!raw) return null
        return buildAcceptInviteUrl(raw)
    }, [pendingLinkInvite?.token_raw])

    const effectiveLinkUrl = persistedLinkUrl ?? generatedLinkUrl
    const linkInviteExpiresAt =
        pendingLinkInvite?.expires_at ?? generatedLinkExpiresAt

    const fetchInvites = React.useCallback(async () => {
        if (!workspaceId) return
        setLoadingInvites(true)
        const { data, error } = await supabase
            .from("workspace_invites")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
        setLoadingInvites(false)
        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível carregar convites.",
            )
            return
        }
        setInvites((data as WorkspaceInvite[]) ?? [])
    }, [workspaceId])

    React.useEffect(() => {
        if (!open || !workspaceId) return
        void fetchInvites()
        setInviteEmail("")
        setGeneratedLinkUrl(null)
        setGeneratedLinkExpiresAt(null)
        setLinkCopied(false)
    }, [open, workspaceId, fetchInvites])

    const handleInvite = async () => {
        if (!workspaceId || !inviteEmail.trim() || !canManageMembers) return

        const emailLower = inviteEmail.trim().toLowerCase()
        setSavingInvite(true)
        try {
            const res = await invokeEdgeJson<{
                invite_id?: string
                expires_at?: string
            }>("workspace-invites-create", {
                body: {
                    workspace_id: workspaceId,
                    invited_email: emailLower,
                },
            })
            setInviteEmail("")
            if (res.invite_id && res.expires_at && user?.id) {
                setInvites((prev) => {
                    if (prev.some((i) => i.id === res.invite_id)) return prev
                    const row: WorkspaceInvite = {
                        id: res.invite_id!,
                        workspace_id: workspaceId,
                        invited_email: emailLower,
                        role: "member",
                        token_hash: "",
                        status: "pending",
                        expires_at: res.expires_at!,
                        created_by: user.id,
                        created_at: new Date().toISOString(),
                        accepted_at: null,
                        usage_count: 0,
                        max_uses: 1,
                    }
                    return [row, ...prev]
                })
            }
            toastSuccess("Convite enviado com sucesso.")
            await fetchInvites()
            dispatchFinanceMembersMutated()
        } catch (error) {
            console.error("Error creating invite:", error)
            toastError(error instanceof Error ? error.message : "Falha ao enviar convite.")
        } finally {
            setSavingInvite(false)
        }
    }

    const handleCreateLinkInvite = async () => {
        if (!workspaceId || !canManageMembers) return

        setSavingLink(true)
        setGeneratedLinkUrl(null)
        setGeneratedLinkExpiresAt(null)
        setLinkCopied(false)
        try {
            const res = await invokeEdgeJson<{
                invite_url?: string
                expires_at?: string
            }>("workspace-invites-create", {
                body: {
                    workspace_id: workspaceId,
                    invite_kind: "link",
                },
            })
            const url = res.invite_url?.trim() || null
            if (url) setGeneratedLinkUrl(url)
            const exp =
                typeof res.expires_at === "string" ? res.expires_at.trim() : ""
            if (exp) setGeneratedLinkExpiresAt(exp)
            toastSuccess(
                "Link gerado. Ele fica salvo aqui até você revogar ou expirar.",
            )
            await fetchInvites()
            dispatchFinanceMembersMutated()
        } catch (error) {
            console.error("Error creating link invite:", error)
            toastError(
                error instanceof Error ? error.message : "Falha ao gerar link de convite.",
            )
        } finally {
            setSavingLink(false)
        }
    }

    const copyPersistedLink = async () => {
        if (!effectiveLinkUrl) return
        try {
            await navigator.clipboard.writeText(effectiveLinkUrl)
            setLinkCopied(true)
            window.setTimeout(() => setLinkCopied(false), 2000)
        } catch {
            toastError("Não foi possível copiar o link.")
        }
    }

    const handleResendInvite = async (inviteId: string) => {
        if (!workspaceId || !canManageMembers) return
        setBusyResendInviteId(inviteId)
        try {
            await invokeEdgeJson("workspace-invites-resend", {
                body: {
                    workspace_id: workspaceId,
                    invite_id: inviteId,
                },
            })
            toastSuccess("Convite reenviado por e-mail.")
        } catch (error) {
            console.error("Error resending invite:", error)
            toastError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível reenviar o convite.",
            )
        } finally {
            setBusyResendInviteId(null)
        }
    }

    const handleRevokeInvite = async (inviteId: string) => {
        if (!canManageMembers) {
            toastError("Apenas owner pode revogar convites.")
            return
        }
        setBusyInviteId(inviteId)
        const { error } = await supabase
            .from("workspace_invites")
            .update({ status: "revoked" })
            .eq("id", inviteId)

        if (error) {
            toastError("Não foi possível revogar o convite.")
        } else {
            toastSuccess("Convite revogado.")
            setLinkCopied(false)
            setGeneratedLinkUrl(null)
            setGeneratedLinkExpiresAt(null)
        }
        await fetchInvites()
        dispatchFinanceMembersMutated()
        setBusyInviteId(null)
    }

    return (
        <>
            {isMobile ? (
                <Sheet open={open} onOpenChange={onOpenChange}>
                    <SheetContent
                        side="bottom"
                        fillMobileViewport
                        showCloseButton
                        className={mobileFormSheetContentClassName}
                    >
                        <MobileSheetFormDragStrip />
                        <MobileSheetFormStickyHeader
                            title="Novo membro"
                            description="Convide por e-mail ou gere um link de convite para esta carteira."
                        />
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-2">
                                {!canManageMembers ? (
                                    <p className="text-sm text-muted-foreground">
                                        Apenas o proprietário da carteira pode enviar convites.
                                    </p>
                                ) : (
                                    <>
                                        <CustomForm
                                            className="space-y-2"
                                            onSubmit={(e) => {
                                                e.preventDefault()
                                                void handleInvite()
                                            }}
                                        >
                                            <Label htmlFor="global-invite-email">E-mail</Label>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <Input
                                                    id="global-invite-email"
                                                    value={inviteEmail}
                                                    onChange={(e) =>
                                                        setInviteEmail(e.target.value)
                                                    }
                                                    placeholder="email@exemplo.com"
                                                    disabled={savingInvite}
                                                    className="sm:flex-1"
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        savingInvite || !inviteEmail.trim()
                                                    }
                                                    className="sm:shrink-0"
                                                >
                                                    {savingInvite ? (
                                                        <>
                                                            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                                                            Enviando...
                                                        </>
                                                    ) : (
                                                        "Convidar"
                                                    )}
                                                </Button>
                                            </div>
                                        </CustomForm>

                                        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <p className="text-sm font-medium">Link de convite</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Qualquer pessoa com conta no app pode aceitar enquanto o convite
                                                estiver pendente.
                                            </p>
                                            {loadingInvites ? (
                                                <p className="text-xs text-muted-foreground">Carregando…</p>
                                            ) : effectiveLinkUrl ? (
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex min-w-0 flex-row items-center gap-2">
                                                        <Input
                                                            readOnly
                                                            value={effectiveLinkUrl}
                                                            className="min-w-0 flex-1 font-mono text-xs"
                                                        />
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="shrink-0"
                                                                        aria-label={
                                                                            linkCopied
                                                                                ? "Link copiado"
                                                                                : "Copiar link"
                                                                        }
                                                                        onClick={() =>
                                                                            void copyPersistedLink()
                                                                        }
                                                                    >
                                                                        {linkCopied ? (
                                                                            <CheckIcon className="h-4 w-4 text-green-600" />
                                                                        ) : (
                                                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    {linkCopied ? "Copiado" : "Copiar"}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            {pendingLinkInvite && canManageMembers ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                    disabled={
                                                                        busyInviteId === pendingLinkInvite.id
                                                                    }
                                                                    onClick={() =>
                                                                        void handleRevokeInvite(
                                                                            pendingLinkInvite.id,
                                                                        )
                                                                    }
                                                                >
                                                                    {busyInviteId === pendingLinkInvite.id ? (
                                                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        "Excluir link"
                                                                    )}
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    {linkInviteExpiresAt ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatLinkInviteExpiresAt(linkInviteExpiresAt)}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    disabled={savingLink}
                                                    onClick={() => void handleCreateLinkInvite()}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {savingLink ? (
                                                        <>
                                                            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                                                            Gerando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <LinkIcon className="mr-2 h-4 w-4" />
                                                            Gerar link de convite
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>

                                        {invites.filter((i) => i.invited_email != null).length > 0 ? (
                                            <div className="grid gap-2">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Convites por e-mail
                                                </p>
                                                {invites
                                                    .filter((invite) => invite.invited_email != null)
                                                    .map((invite) => (
                                                        <div
                                                            key={invite.id}
                                                            className="rounded-lg border bg-muted/20 p-2"
                                                        >
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    <EnvelopeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                    <span className="truncate text-sm">
                                                                        {invite.invited_email}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={
                                                                            busyResendInviteId === invite.id ||
                                                                            busyInviteId === invite.id
                                                                        }
                                                                        onClick={() =>
                                                                            void handleResendInvite(invite.id)
                                                                        }
                                                                    >
                                                                        {busyResendInviteId === invite.id ? (
                                                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <PaperAirplaneIcon className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-destructive"
                                                                        disabled={busyInviteId === invite.id}
                                                                        onClick={() =>
                                                                            void handleRevokeInvite(invite.id)
                                                                        }
                                                                    >
                                                                        Revogar
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={onOpenChange}>
                    <DialogContent className="flex max-h-[min(90dvh,32rem)] flex-col gap-0 overflow-hidden sm:max-w-md">
                        <DialogHeader className="shrink-0">
                            <DialogTitle>Novo membro</DialogTitle>
                            <DialogDescription>
                                Convide por e-mail ou gere um link de convite para esta carteira.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
                            {!canManageMembers ? (
                                <p className="text-sm text-muted-foreground">
                                    Apenas o proprietário da carteira pode enviar convites.
                                </p>
                            ) : (
                                <>
                                    <CustomForm
                                        className="space-y-2"
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            void handleInvite()
                                        }}
                                    >
                                        <Label htmlFor="global-invite-email">E-mail</Label>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <Input
                                                id="global-invite-email"
                                                value={inviteEmail}
                                                onChange={(e) =>
                                                    setInviteEmail(e.target.value)
                                                }
                                                placeholder="email@exemplo.com"
                                                disabled={savingInvite}
                                                className="sm:flex-1"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={
                                                    savingInvite || !inviteEmail.trim()
                                                }
                                                className="sm:shrink-0"
                                            >
                                                {savingInvite ? (
                                                    <>
                                                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                                                        Enviando...
                                                    </>
                                                ) : (
                                                    "Convidar"
                                                )}
                                            </Button>
                                        </div>
                                    </CustomForm>

                                    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                                        <div className="flex items-center gap-2">
                                            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <p className="text-sm font-medium">Link de convite</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Qualquer pessoa com conta no app pode aceitar enquanto o
                                            convite estiver pendente.
                                        </p>
                                        {loadingInvites ? (
                                            <p className="text-xs text-muted-foreground">
                                                Carregando…
                                            </p>
                                        ) : effectiveLinkUrl ? (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex min-w-0 flex-row items-center gap-2">
                                                    <Input
                                                        readOnly
                                                        value={effectiveLinkUrl}
                                                        className="min-w-0 flex-1 font-mono text-xs"
                                                    />
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="shrink-0"
                                                                    aria-label={
                                                                        linkCopied
                                                                            ? "Link copiado"
                                                                            : "Copiar link"
                                                                    }
                                                                    onClick={() =>
                                                                        void copyPersistedLink()
                                                                    }
                                                                >
                                                                    {linkCopied ? (
                                                                        <CheckIcon className="h-4 w-4 text-green-600" />
                                                                    ) : (
                                                                        <DocumentDuplicateIcon className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                {linkCopied ? "Copiado" : "Copiar"}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        {pendingLinkInvite && canManageMembers ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                                                                disabled={
                                                                    busyInviteId === pendingLinkInvite.id
                                                                }
                                                                onClick={() =>
                                                                    void handleRevokeInvite(
                                                                        pendingLinkInvite.id,
                                                                    )
                                                                }
                                                            >
                                                                {busyInviteId ===
                                                                pendingLinkInvite.id ? (
                                                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    "Excluir link"
                                                                )}
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                {linkInviteExpiresAt ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatLinkInviteExpiresAt(
                                                            linkInviteExpiresAt,
                                                        )}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={savingLink}
                                                onClick={() => void handleCreateLinkInvite()}
                                                className="w-full sm:w-auto"
                                            >
                                                {savingLink ? (
                                                    <>
                                                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                                                        Gerando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <LinkIcon className="h-4 w-4 mr-2" />
                                                        Gerar link de convite
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    {invites.filter((i) => i.invited_email != null).length > 0 ? (
                                        <div className="grid gap-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Convites por e-mail
                                            </p>
                                            {invites
                                                .filter((invite) => invite.invited_email != null)
                                                .map((invite) => (
                                                    <div
                                                        key={invite.id}
                                                        className="rounded-lg border bg-muted/20 p-2"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <EnvelopeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                <span className="truncate text-sm">
                                                                    {invite.invited_email}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={
                                                                        busyResendInviteId ===
                                                                            invite.id ||
                                                                        busyInviteId === invite.id
                                                                    }
                                                                    onClick={() =>
                                                                        void handleResendInvite(
                                                                            invite.id,
                                                                        )
                                                                    }
                                                                >
                                                                    {busyResendInviteId ===
                                                                    invite.id ? (
                                                                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <PaperAirplaneIcon className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-destructive"
                                                                    disabled={
                                                                        busyInviteId === invite.id
                                                                    }
                                                                    onClick={() =>
                                                                        void handleRevokeInvite(
                                                                            invite.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Revogar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
