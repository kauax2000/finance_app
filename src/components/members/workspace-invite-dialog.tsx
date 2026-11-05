"use client"

import { useTimeout } from "@/hooks/use-timeout"
import {
    Card,
} from "@/components/ui/card"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
} from "@/components/ui/item"
import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, DocumentDuplicateIcon, EnvelopeIcon, LinkIcon, PaperAirplaneIcon, TrashIcon } from "@heroicons/react/16/solid"
import type { User } from "@supabase/supabase-js"
import { Form, FormInput, FormSubmit } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { supabase, type WorkspaceInvite } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { fetchInviteLinks, INVITE_LINKS_STALE_MS, type LinksDeConvite } from "@/lib/queries/fetch-invite-links"
import { inviteLinksKeys } from "@/lib/queries/keys"
import { PAPEL_DO_CONVITE_INICIAL, PapelDoConvite } from "@/components/members/papel-do-convite"
import { ERRO_DO_CONVITE, montarConvite, rotuloDoPapel } from "@/lib/papeis/papeis"
import { toastError, toastSuccess } from "@/lib/toast"
import { TrocaSuave } from "@/lib/troca-suave"
import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { formatDateTimeShortPtBr } from "@/lib/transaction-date"
import {
    dispatchFinanceMembersMutated,
} from "@/lib/workspace-data-events"

function formatLinkInviteExpiresAt(iso: string | null | undefined): string | null {
    if (!iso) return null
    const end = new Date(iso).getTime()
    if (Number.isNaN(end)) return null
    const ms = end - Date.now()
    if (ms <= 0) return "Este link já expirou."
    const days = Math.ceil(ms / 86_400_000)
    if (days > 1)
        return `Expira em cerca de ${days} dias (${formatDateTimeShortPtBr(iso)}).`
    if (days === 1)
        return `Expira em cerca de 1 dia (${formatDateTimeShortPtBr(iso)}).`
    const hours = Math.max(1, Math.ceil(ms / 3_600_000))
    return `Expira em cerca de ${hours} h (${formatDateTimeShortPtBr(iso)}).`
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
    const later = useTimeout()
    const [invites, setInvites] = React.useState<WorkspaceInvite[]>([])
    const [inviteEmail, setInviteEmail] = React.useState("")
    const [papelDoConvite, setPapelDoConvite] = React.useState(PAPEL_DO_CONVITE_INICIAL)
    const [savingInvite, setSavingInvite] = React.useState(false)
    const [savingLink, setSavingLink] = React.useState(false)
    const [busyInviteId, setBusyInviteId] = React.useState<string | null>(null)
    const [busyResendInviteId, setBusyResendInviteId] = React.useState<string | null>(
        null,
    )
    const [linkCopied, setLinkCopied] = React.useState(false)

    // Um link por papel, da consulta que a tela de Membros já aquece: o cartão abre pronto.
    const queryClient = useQueryClient()
    const linksKey = inviteLinksKeys.links(workspaceId ?? "__none__")
    const { data: links, isPending: linksPendentes } = useQuery({
        queryKey: linksKey,
        queryFn: () => fetchInviteLinks(workspaceId!),
        enabled: open && Boolean(workspaceId) && canManageMembers,
        staleTime: INVITE_LINKS_STALE_MS,
    })
    const linkDoPapel = links?.[papelDoConvite.role] ?? null
    const linkUrl = linkDoPapel?.invite_url ?? null
    const trocarPapel = (v: typeof papelDoConvite) => {
        setPapelDoConvite(v)
        setLinkCopied(false)
    }

    const fetchInvites = React.useCallback(async () => {
        if (!workspaceId) return
        const { data, error } = await supabase
            .from("workspace_invites")
            .select("accepted_at, created_at, created_by, expires_at, id, invited_email, max_uses, role, status, usage_count, workspace_id")
            .eq("workspace_id", workspaceId)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
        if (error) {
            toastError(
                formatSupabasePostgrestError(error) ??
                    "Não foi possível carregar os convites",
                { id: "carregar-convites" },
            )
            return
        }
        setInvites((data as WorkspaceInvite[]) ?? [])
    }, [workspaceId])

    React.useEffect(() => {
        if (!open || !workspaceId) return
        void fetchInvites()
        setInviteEmail("")
        setPapelDoConvite(PAPEL_DO_CONVITE_INICIAL)
        setLinkCopied(false)
    }, [open, workspaceId, fetchInvites])

    const handleInvite = async () => {
        if (!workspaceId || !inviteEmail.trim() || !canManageMembers) return

        const convite = montarConvite({ ...papelDoConvite, email: inviteEmail })
        if (!convite.ok) {
            toastError(ERRO_DO_CONVITE[convite.erro], { id: "convite-email" })
            return
        }
        const emailLower = inviteEmail.trim().toLowerCase()
        setSavingInvite(true)
        try {
            const res = await invokeEdgeJson<{
                invite_id?: string
                expires_at?: string
            }>("workspace-invites-create", {
                body: { workspace_id: workspaceId, ...convite.corpo },
            })
            setInviteEmail("")
            setPapelDoConvite(PAPEL_DO_CONVITE_INICIAL)
            if (res.invite_id && res.expires_at && user?.id) {
                setInvites((prev) => {
                    if (prev.some((i) => i.id === res.invite_id)) return prev
                    const row: WorkspaceInvite = {
                        id: res.invite_id!,
                        workspace_id: workspaceId,
                        invited_email: emailLower,
                        role: convite.corpo.role,
                        menor: convite.corpo.menor,
                        consentimento_em: convite.corpo.menor ? new Date().toISOString() : null,
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
            toastSuccess("Convite enviado", { id: "convite-email", description: emailLower })
            await fetchInvites()
            dispatchFinanceMembersMutated()
        } catch (error) {
            console.error("Error creating invite:", error)
            toastError(
                error instanceof Error ? error.message : "Não foi possível enviar o convite",
                { id: "convite-email" },
            )
        } finally {
            setSavingInvite(false)
        }
    }

    const handleCreateLinkInvite = async () => {
        if (!workspaceId || !canManageMembers) return

        const role = papelDoConvite.role
        setSavingLink(true)
        setLinkCopied(false)
        try {
            const res = await invokeEdgeJson<{
                invite_id?: string
                invite_url?: string
                expires_at?: string
            }>("workspace-invites-create", {
                body: {
                    workspace_id: workspaceId,
                    invite_kind: "link",
                    role: papelDoConvite.role,
                },
            })
            const url = res.invite_url?.trim() || null
            const exp = res.expires_at?.trim()
            if (res.invite_id && exp) {
                const novo = { invite_id: res.invite_id, expires_at: exp, invite_url: url }
                queryClient.setQueryData(inviteLinksKeys.links(workspaceId), (atual: LinksDeConvite | undefined) => ({
                    member: atual?.member ?? null,
                    guest: atual?.guest ?? null,
                    [role]: novo,
                }))
                void queryClient.invalidateQueries({ queryKey: inviteLinksKeys.links(workspaceId) })
            }
            toastSuccess("Link gerado", {
                id: "convite-link",
                description: "O link fica aqui enquanto valer.",
            })
            // A lista de convites não segura o botão: o link já está na tela.
            void fetchInvites()
            dispatchFinanceMembersMutated()
        } catch (error) {
            console.error("Error creating link invite:", error)
            toastError(
                error instanceof Error ? error.message : "Não foi possível gerar o link de convite",
                { id: "convite-link" },
            )
        } finally {
            setSavingLink(false)
        }
    }

    const copyPersistedLink = async () => {
        if (!linkUrl) return
        try {
            await navigator.clipboard.writeText(linkUrl)
            setLinkCopied(true)
            later(() => setLinkCopied(false), 2000)
        } catch {
            toastError("Não foi possível copiar o link")
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
            toastSuccess("Convite reenviado por e-mail", { id: `reenviar-convite:${inviteId}` })
        } catch (error) {
            console.error("Error resending invite:", error)
            toastError(
                error instanceof Error
                    ? error.message
                    : "Não foi possível reenviar o convite",
                { id: `reenviar-convite:${inviteId}` },
            )
        } finally {
            setBusyResendInviteId(null)
        }
    }

    const { confirm: confirmRevoke, dialog: revokeConfirmDialog } = useConfirmDialog()
    const handleRevokeInvite = async (inviteId: string) => {
        if (!canManageMembers) {
            toastError("Só o owner pode revogar convites")
            return
        }
        const ok = await confirmRevoke({
            title: "Revogar o convite?",
            description: "O link ou o e-mail enviado deixa de funcionar.",
            actionLabel: "Revogar",
        })
        if (!ok) return
        setBusyInviteId(inviteId)
        const { error } = await supabase
            .from("workspace_invites")
            .update({ status: "revoked" })
            .eq("id", inviteId)

        if (error) {
            toastError("Não foi possível revogar o convite", { id: `revogar-convite:${inviteId}` })
        } else {
            toastSuccess("Convite revogado", { id: `revogar-convite:${inviteId}` })
            setLinkCopied(false)
            if (workspaceId) {
                queryClient.setQueryData(inviteLinksKeys.links(workspaceId), (atual: LinksDeConvite | undefined) =>
                    atual && {
                        member: atual.member?.invite_id === inviteId ? null : atual.member,
                        guest: atual.guest?.invite_id === inviteId ? null : atual.guest,
                    },
                )
            }
        }
        await fetchInvites()
        dispatchFinanceMembersMutated()
        setBusyInviteId(null)
    }

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`). O corpo
    // rola entre o cabeçalho e a borda: é o `DialogBody` do `layout="fixed"`.
    return (
        <>
            {revokeConfirmDialog}
            <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
                <DialogContent layout="fixed">
                    <DialogHeader>
                        <DialogTitle>Novo membro</DialogTitle>
                        <DialogDescription>
                            Convide por e-mail ou gere um link de convite para esta carteira.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody className="space-y-4">
                        {!canManageMembers ? (
                            <p className="text-sm text-muted-foreground">
                                Apenas o proprietário da carteira pode enviar convites.
                            </p>
                        ) : (
                            <>
                                <PapelDoConvite
                                    valor={papelDoConvite}
                                    onChange={trocarPapel}
                                    disabled={savingInvite}
                                />
                                <Form
                                    layout="inline"
                                    pending={savingInvite}
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        void handleInvite()
                                    }}
                                >
                                    <FormInput
                                        label="E-mail"
                                        value={inviteEmail}
                                        onChange={(e) =>
                                            setInviteEmail(e.target.value)
                                        }
                                        placeholder="email@exemplo.com"
                                        disabled={savingInvite}
                                    />
                                    <FormSubmit disabled={!inviteEmail.trim()}>
                                        Convidar
                                    </FormSubmit>
                                </Form>

                                <Card variant="outline" padding="sm" className="gap-2 px-3">
                                    <div className="flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <p className="text-sm font-medium">Link de convite</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Qualquer pessoa com conta no app pode aceitar enquanto o
                                        convite estiver pendente, e entra como{" "}
                                        {papelDoConvite.role === "guest" ? "convidado" : "membro"}.
                                    </p>
                                    {linkDoPapel && !linkUrl ? (
                                        <p className="text-xs text-muted-foreground">
                                            Já existe um link ativo, de antes de o link poder ser mostrado de novo.
                                            Gere um novo para copiar (o anterior deixa de valer).
                                        </p>
                                    ) : null}
                                    {linksPendentes ? (
                                        <Skeleton shape="pill" className="h-9 w-full sm:w-48 pointer-coarse:h-11" />
                                    ) : linkDoPapel && linkUrl ? (
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex min-w-0 flex-row items-center gap-2">
                                                <Input
                                                    readOnly
                                                    value={linkUrl}
                                                    className="min-w-0 flex-1 font-mono text-xs"
                                                />
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Tooltip confirmation={linkCopied ? "Link copiado" : null}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon-lg"
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
                                                                <span className="relative size-4 pointer-coarse:size-5">
                                                                    <TrocaSuave
                                                                        chave={linkCopied ? "tique" : "copiar"}
                                                                        className="absolute inset-0 flex items-center justify-center"
                                                                    >
                                                                        {linkCopied ? (
                                                                            <CheckIcon className="text-success" />
                                                                        ) : (
                                                                            <DocumentDuplicateIcon />
                                                                        )}
                                                                    </TrocaSuave>
                                                                </span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            Copiar link
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {canManageMembers ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon-lg"
                                                                    className="shrink-0"
                                                                    aria-label="Excluir link"
                                                                    disabled={
                                                                        busyInviteId === linkDoPapel.invite_id
                                                                    }
                                                                    onClick={() =>
                                                                        void handleRevokeInvite(linkDoPapel.invite_id)
                                                                    }
                                                                >
                                                                    {busyInviteId ===
                                                                    linkDoPapel.invite_id ? (
                                                                        <Spinner />
                                                                    ) : (
                                                                        <TrashIcon />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                Excluir link
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : null}
                                                </div>
                                            </div>
                                            {linkDoPapel.expires_at ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatLinkInviteExpiresAt(
                                                        linkDoPapel.expires_at,
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
                                                    <Spinner />
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
                                </Card>

                                {invites.filter((i) => i.invited_email != null).length > 0 ? (
                                    <div className="grid gap-2">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Convites por e-mail
                                        </p>
                                        {invites
                                            .filter((invite) => invite.invited_email != null)
                                            .map((invite) => (
                                                <Item key={invite.id} variant="outline" size="sm">
                                                    <ItemMedia variant="icon">
                                                        <EnvelopeIcon className="text-muted-foreground" />
                                                    </ItemMedia>
                                                    <ItemContent className="min-w-0">
                                                        <span className="truncate">
                                                                {invite.invited_email} · {rotuloDoPapel(invite.role)}
                                                        </span>
                                                    </ItemContent>
                                                    <ItemActions className="gap-1">
                                                            <Button
aria-label={`Reenviar convite para ${invite.invited_email}`}
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
                                                                    <Spinner />
                                                                ) : (
                                                                    <PaperAirplaneIcon className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            <Button
aria-label={`Revogar convite para ${invite.invited_email}`}
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
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
                                                    </ItemActions>
                                                </Item>
                                            ))}
                                    </div>
                                ) : null}
                            </>
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    )
}
