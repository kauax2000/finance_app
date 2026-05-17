"use client"
/* eslint-disable @next/next/no-img-element -- member avatars from arbitrary URLs */

import { useCallback, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import {
    UserGroupIcon,
    EnvelopeIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    LinkIcon,
    DocumentDuplicateIcon,
    CheckIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, WorkspaceInvite, WorkspaceMember } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { isPostgrestTransientNetworkError } from "@/lib/transient-network-retry"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import {
    dismissPageFetchError,
    toastError,
    toastPageFetchError,
    toastSuccess,
} from "@/lib/toast"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm } from "@/components/ui/form"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { tagChipInfo, tagChipSuccess } from "@/lib/tag-chip-classes"
import { useHideMobileFab } from "@/components/layout/mobile-fab-provider"
import { cn, getInitials } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar"
import {
    dispatchFinanceMembersMutated,
    FINANCE_MEMBERS_MUTATED_EVENT,
} from "@/lib/workspace-data-events"

type MemberWithProfile = WorkspaceMember & {
    profile?: {
        id: string
        email: string
        full_name: string | null
        avatar_url?: string | null
        avatar_color?: string | null
    } | null
}

function memberDisplayName(member: MemberWithProfile) {
    return member.profile?.full_name || member.profile?.email || "Membro"
}

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
    if (days > 1) return `Expira em cerca de ${days} dias (${new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}).`
    if (days === 1) return `Expira em cerca de 1 dia (${new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}).`
    const hours = Math.max(1, Math.ceil(ms / 3_600_000))
    return `Expira em cerca de ${hours} h (${new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}).`
}

/**
 * Fallback when `workspace_member_directory` RPC is unavailable. Fills profile only for the current user (RLS on `profiles`).
 */
function mergeMemberRowsForDisplay(
    rows: Pick<WorkspaceMember, "workspace_id" | "user_id" | "role" | "joined_at">[],
    currentUser: User | null
): MemberWithProfile[] {
    return rows.map((m) => {
        if (currentUser?.id === m.user_id) {
            const meta = currentUser.user_metadata as Record<string, unknown> | undefined
            const fullName =
                (typeof meta?.full_name === "string" && meta.full_name) ||
                (typeof meta?.name === "string" && meta.name) ||
                null
            const avatarUrl =
                (typeof meta?.avatar_url === "string" && meta.avatar_url) || null
            return {
                ...m,
                profile: {
                    id: currentUser.id,
                    email: currentUser.email ?? "",
                    full_name: fullName,
                    avatar_url: avatarUrl,
                },
            }
        }
        return { ...m, profile: null }
    })
}

function MembersSectionSkeleton() {
    return (
        <div className="min-w-0 space-y-2">
            <div className="flex h-8 min-w-0 items-end">
                <Skeleton className="h-3 w-24" />
            </div>
            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="flex flex-col p-0">
                    <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
                        <Skeleton className="h-4 w-32 max-w-[55%]" />
                        <Skeleton className="h-4 w-20 shrink-0" />
                    </div>
                    <ul
                        className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                        role="list"
                    >
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="min-w-0">
                                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-3.5">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Skeleton className="h-4 w-28 max-w-full" />
                                                <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                                            </div>
                                            <Skeleton className="h-3 w-40 max-w-full" />
                                        </div>
                                        <Skeleton className="size-8 shrink-0 rounded-md" />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 dark:bg-muted/25">
                        <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                        <Skeleton className="h-3 w-full max-w-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const membersPageSkeleton = (
    <div className="min-w-0 max-w-full space-y-5" role="status" aria-busy="true" aria-label="Carregando membros">
        <MembersSectionSkeleton />
        <div className="min-w-0 space-y-2">
            <div className="flex h-8 min-w-0 items-end">
                <Skeleton className="h-3 w-28" />
            </div>
            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="flex flex-col gap-0 p-0">
                    <div className="space-y-2 px-4 py-4">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="border-t border-border px-4 py-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Skeleton className="size-4 shrink-0 rounded" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-3 w-full max-w-sm" />
                        <Skeleton className="mt-3 h-9 w-full max-w-[14rem] rounded-md" />
                    </div>
                    <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 dark:bg-muted/25">
                        <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
                        <Skeleton className="h-3 w-full max-w-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 items-end justify-between gap-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24 shrink-0" />
            </div>
            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent className="flex flex-col p-0">
                    <ul className="divide-y divide-border" role="list">
                        {[1, 2].map((i) => (
                            <li key={i} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                    <Skeleton className="size-9 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48 max-w-full" />
                                        <Skeleton className="h-3 w-36 max-w-full" />
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    <Skeleton className="h-8 w-28 rounded-md" />
                                    <Skeleton className="h-8 w-32 rounded-md" />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex shrink-0 items-center gap-1.5 border-t border-border bg-muted/15 px-4 py-2.5 text-xs dark:bg-muted/25">
                        <Skeleton className="size-3 shrink-0 rounded" />
                        <Skeleton className="h-3 w-36" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
)

export default function MembersPage() {
    const { user, loading: authLoading } = useAuth()
    const {
        currentWorkspaceId,
        isWorkspaceOwner,
        loading: workspaceLoading,
    } = useWorkspace()
    const [members, setMembers] = useState<MemberWithProfile[]>([])
    const [invites, setInvites] = useState<WorkspaceInvite[]>([])
    const [inviteEmail, setInviteEmail] = useState("")
    const [loading, setLoading] = useState(true)
    const [savingInvite, setSavingInvite] = useState(false)
    const [busyInviteId, setBusyInviteId] = useState<string | null>(null)
    const [busyResendInviteId, setBusyResendInviteId] = useState<string | null>(
        null,
    )
    const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
    const [savingLink, setSavingLink] = useState(false)
    const [generatedLinkUrl, setGeneratedLinkUrl] = useState<string | null>(null)
    const [generatedLinkExpiresAt, setGeneratedLinkExpiresAt] = useState<string | null>(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<{
        userId: string
        name: string
        email: string
    } | null>(null)

    const canManageMembers = Boolean(currentWorkspaceId && isWorkspaceOwner(currentWorkspaceId))

    const pendingLinkInvite = useMemo(
        () => invites.find((i) => i.invited_email == null),
        [invites],
    )
    const persistedLinkUrl = useMemo(() => {
        const raw = pendingLinkInvite?.token_raw?.trim()
        if (!raw) return null
        return buildAcceptInviteUrl(raw)
    }, [pendingLinkInvite?.token_raw])

    const effectiveLinkUrl = persistedLinkUrl ?? generatedLinkUrl
    const linkInviteExpiresAt =
        pendingLinkInvite?.expires_at ?? generatedLinkExpiresAt

    const pendingEmailInvites = useMemo(
        () => invites.filter((invite) => invite.invited_email != null),
        [invites],
    )

    const fetchMembersAndInvites = useCallback(async () => {
        if (!currentWorkspaceId) return

        const loadPair = () =>
            Promise.all([
                supabase
                    .from("workspace_members")
                    .select("workspace_id,user_id,role,joined_at")
                    .eq("workspace_id", currentWorkspaceId),
                supabase
                    .from("workspace_invites")
                    .select("*")
                    .eq("workspace_id", currentWorkspaceId)
                    .eq("status", "pending")
                    .order("created_at", { ascending: false }),
            ])

        let [membersRes, invitesRes] = await loadPair()
        const transient =
            (membersRes.error && isPostgrestTransientNetworkError(membersRes.error)) ||
            (invitesRes.error && isPostgrestTransientNetworkError(invitesRes.error))
        if (transient) {
            ;[membersRes, invitesRes] = await loadPair()
        }

        if (membersRes.error) {
            const msg = formatSupabasePostgrestError(membersRes.error)
            if (msg) console.error("Members fetch error:", msg)
        }
        if (invitesRes.error) {
            const msg = formatSupabasePostgrestError(invitesRes.error)
            if (msg) console.error("Invites fetch error:", msg)
        }

        const errParts: string[] = []
        const membersMsg = formatSupabasePostgrestError(membersRes.error)
        const invitesMsg = formatSupabasePostgrestError(invitesRes.error)
        if (membersMsg) errParts.push(`Membros: ${membersMsg}`)
        if (invitesMsg) errParts.push(`Convites: ${invitesMsg}`)
        if (errParts.length > 0) {
            toastPageFetchError("members", errParts.join(" · "))
        } else {
            dismissPageFetchError("members")
        }

        if (membersRes.data) {
            const dirRes = await supabase.rpc("workspace_member_directory", {
                p_workspace_id: currentWorkspaceId,
            })

            if (dirRes.error) {
                toastPageFetchError(
                    "members-directory",
                    "Não foi possível carregar nome/e-mail dos membros. Aplique `supabase/workspace-member-directory.sql` (e `profiles-avatar-color.sql`) no Supabase e recarregue o schema.",
                )
                // Show at least the current user (metadata) so the screen isn't empty.
                setMembers(mergeMemberRowsForDisplay(membersRes.data, user))
            } else if (!Array.isArray(dirRes.data) || dirRes.data.length === 0) {
                toastPageFetchError(
                    "members-directory",
                    "Diretório de membros retornou vazio. Verifique se você executou `workspace-member-directory.sql` e se as políticas/RPC estão ativas.",
                )
                setMembers(mergeMemberRowsForDisplay(membersRes.data, user))
            } else {
                dismissPageFetchError("members-directory")
                type DirRow = {
                    user_id: string
                    email: string
                    full_name: string | null
                    avatar_url?: string | null
                    avatar_color?: string | null
                }
                const rows = dirRes.data as DirRow[]
                const byUser = new Map(rows.map((row) => [row.user_id, row]))
                const merged = membersRes.data.map((m) => {
                    const row = byUser.get(m.user_id)
                    if (row) {
                        return {
                            ...m,
                            profile: {
                                id: m.user_id,
                                email: row.email ?? "",
                                full_name: row.full_name || null,
                                avatar_url: row.avatar_url ?? null,
                                avatar_color: row.avatar_color ?? null,
                            },
                        }
                    }
                    return mergeMemberRowsForDisplay([m], user)[0]
                })
                setMembers(merged)
            }
        }
        if (invitesRes.data) {
            setInvites(invitesRes.data as WorkspaceInvite[])
        }

        setLoading(false)
    }, [currentWorkspaceId, user])

    useEffect(() => {
        if (authLoading || workspaceLoading) return
        if (!currentWorkspaceId) {
            setLoading(false)
            return
        }
        void fetchMembersAndInvites()
    }, [authLoading, workspaceLoading, currentWorkspaceId, fetchMembersAndInvites])

    useEffect(() => {
        const onMutated = () => {
            void fetchMembersAndInvites()
        }
        window.addEventListener(FINANCE_MEMBERS_MUTATED_EVENT, onMutated)
        return () =>
            window.removeEventListener(FINANCE_MEMBERS_MUTATED_EVENT, onMutated)
    }, [fetchMembersAndInvites])

    /** One delayed refetch if link invite row exists but token_raw not yet readable (legacy race). */
    useEffect(() => {
        if (!currentWorkspaceId || loading) return
        if (pendingLinkInvite?.invited_email != null) return
        const raw = pendingLinkInvite?.token_raw?.trim()
        if (raw || !pendingLinkInvite?.id) return
        const t = window.setTimeout(() => {
            void fetchMembersAndInvites()
        }, 450)
        return () => window.clearTimeout(t)
    }, [
        currentWorkspaceId,
        loading,
        pendingLinkInvite?.id,
        pendingLinkInvite?.invited_email,
        pendingLinkInvite?.token_raw,
        fetchMembersAndInvites,
    ])

    useHideMobileFab()

    const handleInvite = async () => {
        if (!currentWorkspaceId || !inviteEmail.trim() || !canManageMembers) return

        const emailLower = inviteEmail.trim().toLowerCase()
        setSavingInvite(true)
        try {
            const res = await invokeEdgeJson<{
                invite_id?: string
                expires_at?: string
            }>("workspace-invites-create", {
                body: {
                    workspace_id: currentWorkspaceId,
                    invited_email: emailLower,
                },
            })
            const resBody = res as { error?: unknown }
            if (typeof resBody.error === "string" && resBody.error.trim()) {
                throw new Error(resBody.error.trim())
            }
            setInviteEmail("")
            if (res.invite_id && user?.id) {
                const expiresAt =
                    typeof res.expires_at === "string" && res.expires_at.trim()
                        ? res.expires_at.trim()
                        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                setInvites((prev) => {
                    if (prev.some((i) => i.id === res.invite_id)) return prev
                    const row: WorkspaceInvite = {
                        id: res.invite_id!,
                        workspace_id: currentWorkspaceId,
                        invited_email: emailLower,
                        role: "member",
                        token_hash: "",
                        status: "pending",
                        expires_at: expiresAt,
                        created_by: user.id,
                        created_at: new Date().toISOString(),
                        accepted_at: null,
                        usage_count: 0,
                        max_uses: 1,
                    }
                    return [row, ...prev]
                })
            }
            await fetchMembersAndInvites()
            dispatchFinanceMembersMutated()
            toastSuccess("Convite enviado com sucesso.")
        } catch (error) {
            console.error("Error creating invite:", error)
            toastError(error instanceof Error ? error.message : "Falha ao enviar convite.")
        } finally {
            setSavingInvite(false)
        }
    }

    const handleCreateLinkInvite = async () => {
        if (!currentWorkspaceId || !canManageMembers) return

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
                    workspace_id: currentWorkspaceId,
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
            await fetchMembersAndInvites()
        } catch (error) {
            console.error("Error creating link invite:", error)
            toastError(error instanceof Error ? error.message : "Falha ao gerar link de convite.")
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
        if (!currentWorkspaceId || !canManageMembers) return
        setBusyResendInviteId(inviteId)
        try {
            await invokeEdgeJson("workspace-invites-resend", {
                body: {
                    workspace_id: currentWorkspaceId,
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
            dispatchFinanceMembersMutated()
        }
        await fetchMembersAndInvites()
        setBusyInviteId(null)
    }

    const handleRemoveMember = async (memberUserId: string) => {
        if (!currentWorkspaceId) return
        if (!canManageMembers) {
            toastError("Apenas owner pode remover membros.")
            return
        }

        setBusyMemberId(memberUserId)
        const { error } = await supabase
            .from("workspace_members")
            .delete()
            .eq("workspace_id", currentWorkspaceId)
            .eq("user_id", memberUserId)

        if (error) {
            toastError("Não foi possível remover o membro.")
        } else {
            toastSuccess("Membro removido com sucesso.")
        }
        await fetchMembersAndInvites()
        setBusyMemberId(null)
    }

    const openRemoveMemberDialog = (args: {
        userId: string
        name: string
        email: string
    }) => {
        setRemoveTarget(args)
        setRemoveDialogOpen(true)
    }

    if (authLoading || workspaceLoading) {
        return membersPageSkeleton
    }

    if (!user) {
        return null
    }

    if (!currentWorkspaceId) {
        return (
            <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                <CardContent
                    className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                    role="status"
                    aria-live="polite"
                >
                    <div
                        className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                        aria-hidden
                    >
                        <UserGroupIcon className="size-7 text-muted-foreground" />
                    </div>
                    <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                        Nenhuma carteira selecionada
                    </h2>
                    <p className="max-w-md text-center text-sm text-muted-foreground">
                        Selecione uma carteira no menu lateral para gerenciar membros e convites.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return membersPageSkeleton
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <Dialog
                open={removeDialogOpen}
                onOpenChange={(open) => {
                    setRemoveDialogOpen(open)
                    if (!open) setRemoveTarget(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover membro</DialogTitle>
                        <DialogDescription>
                            {removeTarget ? (
                                <>
                                    Tem certeza que deseja remover{" "}
                                    <span className="font-medium">
                                        {removeTarget.name}
                                    </span>{" "}
                                    ({removeTarget.email || "e-mail indisponível"}) deste
                                    carteira?
                                </>
                            ) : (
                                "Tem certeza que deseja remover este membro?"
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRemoveDialogOpen(false)}
                            disabled={Boolean(removeTarget && busyMemberId === removeTarget.userId)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={Boolean(removeTarget && busyMemberId === removeTarget.userId)}
                            onClick={() => {
                                if (!removeTarget) return
                                void handleRemoveMember(removeTarget.userId).then(() => {
                                    setRemoveDialogOpen(false)
                                })
                            }}
                        >
                            {removeTarget && busyMemberId === removeTarget.userId ? (
                                <>
                                    <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                                    Removendo...
                                </>
                            ) : (
                                "Remover"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Membros
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {members.length} membro{members.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <ul
                            className="flex list-none flex-col gap-2.5 px-3 py-3 sm:px-4 sm:py-4"
                            role="list"
                        >
                            {members.map((member) => {
                                const name = memberDisplayName(member)
                                const email = member.profile?.email || ""
                                const labelForAvatar =
                                    name === "Membro" ? (email || "Membro") : name
                                const avatarColor =
                                    member.profile?.avatar_color?.trim() ||
                                    getAvatarColor(labelForAvatar)
                                const displayAvatarUrl =
                                    member.profile?.avatar_url?.trim() || null
                                const isOwner = member.role === "owner"
                                const isMe = Boolean(user?.id === member.user_id)
                                return (
                                    <li key={member.user_id} className="min-w-0">
                                        <Card
                                            className={cn(
                                                "gap-0 overflow-hidden rounded-lg border border-border/80 bg-muted/20 py-0 shadow-none ring-0 transition-colors hover:bg-muted/30",
                                                isMe && "border-primary/30 bg-primary/5 hover:bg-primary/10"
                                            )}
                                        >
                                            <CardContent className="flex items-center gap-3 p-3 sm:p-3.5">
                                                <div className="relative flex size-9 shrink-0 select-none overflow-hidden rounded-lg bg-muted">
                                                    {displayAvatarUrl ? (
                                                        <img
                                                            src={displayAvatarUrl}
                                                            alt={name}
                                                            className="aspect-square size-full object-cover"
                                                        />
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                "flex h-full w-full items-center justify-center text-xs font-semibold text-white",
                                                                avatarColor
                                                            )}
                                                        >
                                                            {getInitials(labelForAvatar)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="truncate text-sm font-medium leading-snug">
                                                            {name}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "shrink-0 px-1.5 py-0 text-[0.6rem]",
                                                                isOwner ? tagChipInfo : tagChipSuccess
                                                            )}
                                                        >
                                                            {isOwner ? "Owner" : "Membro"}
                                                        </Badge>
                                                    </div>
                                                    <p
                                                        className="mt-0.5 truncate text-xs text-muted-foreground"
                                                        title={email}
                                                    >
                                                        {email || "E-mail indisponível"}
                                                    </p>
                                                </div>
                                                {canManageMembers && !isOwner && !isMe ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        disabled={busyMemberId === member.user_id}
                                                        aria-label="Remover membro"
                                                        title="Remover membro"
                                                        onClick={() =>
                                                            openRemoveMemberDialog({
                                                                userId: member.user_id,
                                                                name,
                                                                email,
                                                            })
                                                        }
                                                    >
                                                        {busyMemberId === member.user_id ? (
                                                            <ArrowPathIcon className="size-4 animate-spin" />
                                                        ) : (
                                                            <TrashIcon className="size-4" />
                                                        )}
                                                    </Button>
                                                ) : null}
                                            </CardContent>
                                        </Card>
                                    </li>
                                )
                            })}
                        </ul>
                        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/15 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/25">
                            <InformationCircleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">
                                Apenas o owner pode remover membros. Você não pode remover a si mesmo nem o owner do
                                carteira.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div
                id="workspace-invites"
                className="min-w-0 space-y-5 scroll-mt-[calc(var(--mobile-header-offset)+0.5rem)] md:scroll-mt-6"
            >
                <div className="min-w-0 space-y-2">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex h-8 min-w-0 items-end">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Convidar
                            </p>
                        </div>
                    </div>
                    {!canManageMembers ? (
                        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            Apenas o proprietário da carteira pode enviar convites.
                        </div>
                    ) : null}
                    <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                        <CardContent className="flex flex-col p-0">
                            <div className="border-b border-border bg-muted/20 px-4 py-2.5">
                                <p className="text-xs leading-snug text-muted-foreground">Por e-mail ou link</p>
                            </div>
                            <div className="flex flex-col gap-2 px-4 py-3">
                                <CustomForm
                                    className="space-y-2"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        void handleInvite()
                                    }}
                                >
                                    <Label htmlFor="invite-email">E-mail</Label>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Input
                                            id="invite-email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="email@exemplo.com"
                                            disabled={!canManageMembers || savingInvite}
                                            className="sm:flex-1"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={
                                                !canManageMembers ||
                                                savingInvite ||
                                                !inviteEmail.trim()
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
                            </div>
                            <Separator />
                            <div className="flex flex-col gap-2 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                                    <p className="text-sm font-medium leading-snug text-foreground">
                                        Link de convite
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Qualquer pessoa com conta no app pode aceitar enquanto o convite estiver pendente.
                                </p>
                                {effectiveLinkUrl ? (
                                    <div className="space-y-1.5 pt-0.5">
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
                                                                linkCopied ? "Link copiado" : "Copiar link"
                                                            }
                                                            onClick={() => void copyPersistedLink()}
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
                                                        disabled={busyInviteId === pendingLinkInvite.id}
                                                        onClick={() =>
                                                            void handleRevokeInvite(pendingLinkInvite.id)
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
                                        disabled={!canManageMembers || savingLink}
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
                        </CardContent>
                    </Card>
                </div>

                <div className="min-w-0 space-y-2">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex h-8 min-w-0 items-end">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Convites pendentes
                            </p>
                        </div>
                    </div>
                    <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                        <CardContent className="flex flex-col p-0">
                            <div className="flex min-h-10 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-4 py-2.5">
                                <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {pendingEmailInvites.length} pendente
                                    {pendingEmailInvites.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            {pendingEmailInvites.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center px-4 py-12 md:py-14"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <div
                                        className="mb-5 flex size-14 items-center justify-center rounded-full bg-muted/60"
                                        aria-hidden
                                    >
                                        <EnvelopeIcon className="size-7 text-muted-foreground" />
                                    </div>
                                    <h2 className="mb-2 text-center text-base font-semibold tracking-tight">
                                        Nenhum convite pendente
                                    </h2>
                                    <p className="max-w-md text-center text-sm text-muted-foreground">
                                        Os convites enviados aparecem aqui até serem aceitos ou expirarem.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-border" role="list">
                                    {pendingEmailInvites.map((invite) => (
                                        <li key={invite.id}>
                                            <div className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/60">
                                                        <EnvelopeIcon className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium leading-snug">
                                                            {invite.invited_email ?? "Link compartilhável"}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {invite.invited_email == null ? (
                                                                <>
                                                                    {invite.max_uses == null
                                                                        ? "Aceites ilimitados até revogar ou expirar"
                                                                        : `${invite.usage_count ?? 0} / ${invite.max_uses} usos`}
                                                                    {" · "}Expira:{" "}
                                                                    {new Date(
                                                                        invite.expires_at
                                                                    ).toLocaleDateString("pt-BR")}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Expira:{" "}
                                                                    {new Date(
                                                                        invite.expires_at
                                                                    ).toLocaleDateString("pt-BR")}
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                {canManageMembers ? (
                                                    <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                busyResendInviteId === invite.id ||
                                                                busyInviteId === invite.id
                                                            }
                                                            onClick={() => void handleResendInvite(invite.id)}
                                                            className={cn(
                                                                "min-w-0 flex-1 sm:flex-none sm:shrink-0",
                                                                busyResendInviteId === invite.id &&
                                                                    "sm:w-9 sm:px-0",
                                                            )}
                                                            aria-label={
                                                                busyResendInviteId === invite.id
                                                                    ? "Reenviando convite"
                                                                    : "Reenviar convite por e-mail"
                                                            }
                                                            title={
                                                                busyResendInviteId === invite.id
                                                                    ? "Reenviando convite"
                                                                    : "Reenviar convite por e-mail"
                                                            }
                                                        >
                                                            {busyResendInviteId === invite.id ? (
                                                                <ArrowPathIcon
                                                                    className="size-4 animate-spin"
                                                                    aria-hidden
                                                                />
                                                            ) : (
                                                                "Reenviar"
                                                            )}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={
                                                                busyInviteId === invite.id ||
                                                                busyResendInviteId === invite.id
                                                            }
                                                            onClick={() => void handleRevokeInvite(invite.id)}
                                                            className="min-w-0 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none sm:shrink-0"
                                                            aria-label={
                                                                busyInviteId === invite.id
                                                                    ? "Revogando convite"
                                                                    : "Revogar convite"
                                                            }
                                                            title={
                                                                busyInviteId === invite.id
                                                                    ? "Revogando convite"
                                                                    : "Revogar convite"
                                                            }
                                                        >
                                                            {busyInviteId === invite.id ? (
                                                                <>
                                                                    <ArrowPathIcon className="mr-1.5 h-4 w-4 animate-spin" />
                                                                    Revogando...
                                                                </>
                                                            ) : (
                                                                "Revogar"
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div
                                className="shrink-0 border-t border-border bg-muted/15 py-3 dark:bg-muted/25"
                                aria-hidden
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
