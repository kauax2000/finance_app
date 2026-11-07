"use client"

import {
    EmptyState,
    EmptyStateDescription,
    EmptyStateIcon,
    EmptyStateTitle,
} from "@/components/ui/empty-state"
import { useCallback, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UserPlusIcon } from "@heroicons/react/16/solid"
import {
    EnvelopeIcon as EnvelopeOutlineIcon,
    UserGroupIcon,
    WalletIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"
import { useConfirmDialog } from "@/components/use-confirm-dialog"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { ConvitesPendentesSecao } from "@/components/members/convites-pendentes-secao"
import { LimitesSecao } from "@/components/members/limites-secao"
import { memberDisplayName, PessoasSecao, type MemberWithProfile } from "@/components/members/pessoas-secao"
import { fetchMembersPageBundle } from "@/lib/queries/fetch-members-page-bundle"
import { fetchInviteLinks, INVITE_LINKS_STALE_MS } from "@/lib/queries/fetch-invite-links"
import { inviteLinksKeys, membersPageBundleKeys } from "@/lib/queries/keys"
import { WorkspaceInviteDialog } from "@/components/members/workspace-invite-dialog"
import { rotuloDoPapel } from "@/lib/papeis/papeis"
import {
    dismissPageFetchError,
    toastError,
    toastPageFetchError,
    toastSuccess,
} from "@/lib/toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader, PageHeaderActions, PageHeaderTitle, PageHeaderTitleRow } from "@/components/ui/page-header"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    dispatchFinanceMembersMutated,
    FINANCE_MEMBERS_MUTATED_EVENT,
} from "@/lib/workspace-data-events"
import Loading from "./loading"

export default function MembersPage() {
    const { user, loading: authLoading } = useAuth()
    const {
        currentWorkspaceId,
        isWorkspaceOwner,
        isAdulto,
        loading: workspaceLoading,
    } = useWorkspace()
    const isMobile = useIsMobile()
    const [convidarAberto, setConvidarAberto] = useState(false)
    const [busyInviteId, setBusyInviteId] = useState<string | null>(null)
    const [busyResendInviteId, setBusyResendInviteId] = useState<string | null>(
        null,
    )
    const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<{
        userId: string
        name: string
        email: string
    } | null>(null)

    const canManageMembers = Boolean(currentWorkspaceId && isWorkspaceOwner(currentWorkspaceId))

    // Tudo numa rodada só e com cache: a volta a Membros não mostra esqueleto.
    const queryClient = useQueryClient()
    const bundleQuery = useQuery({
        queryKey: membersPageBundleKeys.bundle(currentWorkspaceId ?? "__none__"),
        queryFn: () => fetchMembersPageBundle(currentWorkspaceId!, user),
        enabled: !authLoading && !workspaceLoading && Boolean(user) && Boolean(currentWorkspaceId),
        staleTime: 60_000,
    })
    // Só aquece o cache: o diálogo de convite lê os links dele ao abrir.
    useQuery({
        queryKey: inviteLinksKeys.links(currentWorkspaceId ?? "__none__"),
        queryFn: () => fetchInviteLinks(currentWorkspaceId!),
        enabled: canManageMembers,
        staleTime: INVITE_LINKS_STALE_MS,
    })
    const bundle = bundleQuery.data
    const members: MemberWithProfile[] = bundle?.members ?? []
    const invites = bundle?.invites ?? []
    // O link de convite mora no diálogo: aqui só os convites por e-mail.
    const convitesPorEmail = invites.filter((i) => i.invited_email != null)

    const recarregar = useCallback(
        () =>
            queryClient.invalidateQueries({
                queryKey: membersPageBundleKeys.bundle(currentWorkspaceId ?? "__none__"),
            }),
        [queryClient, currentWorkspaceId],
    )

    // Os avisos de cada leitura do pacote, como antes a cada busca.
    const { dataUpdatedAt, isError: bundleFalhou } = bundleQuery
    useEffect(() => {
        if (bundleFalhou) {
            toastPageFetchError("members", "Não foi possível carregar membros e convites.")
            return
        }
        if (!bundle) return
        if (bundle.avisos.carga) toastPageFetchError("members", bundle.avisos.carga)
        else dismissPageFetchError("members")
        if (bundle.avisos.diretorio) toastPageFetchError("members-directory", bundle.avisos.diretorio)
        else if (bundle.avisos.diretorio === null) dismissPageFetchError("members-directory")
        // `dataUpdatedAt`: o mesmo aviso de novo, numa nova leitura, volta a aparecer.
    }, [bundle, dataUpdatedAt, bundleFalhou])

    useEffect(() => {
        const onMutated = () => {
            void recarregar()
        }
        window.addEventListener(FINANCE_MEMBERS_MUTATED_EVENT, onMutated)
        return () =>
            window.removeEventListener(FINANCE_MEMBERS_MUTATED_EVENT, onMutated)
    }, [recarregar])

    const handleTrocarPapel = async (pessoa: MemberWithProfile, papel: "member" | "guest") => {
        if (!currentWorkspaceId || !canManageMembers) return
        const userId = pessoa.user_id
        const id = `trocar-papel:${userId}`
        setBusyMemberId(userId)
        const { error } = await supabase.rpc("trocar_papel", {
            p_workspace_id: currentWorkspaceId,
            p_user_id: userId,
            p_role: papel,
        })
        if (error) {
            toastError(formatSupabasePostgrestError(error) ?? "Não foi possível trocar o papel.", { id })
        } else {
            toastSuccess(`${memberDisplayName(pessoa)} agora é ${rotuloDoPapel(papel).toLowerCase()}.`, { id })
            dispatchFinanceMembersMutated()
        }
        await recarregar()
        setBusyMemberId(null)
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
            dispatchFinanceMembersMutated()
        }
        await recarregar()
        setBusyInviteId(null)
    }

    const handleRemoveMember = async (memberUserId: string) => {
        if (!currentWorkspaceId) return
        if (!canManageMembers) {
            toastError("Só o owner pode remover membros")
            return
        }

        setBusyMemberId(memberUserId)
        const { error } = await supabase
            .from("workspace_members")
            .delete()
            .eq("workspace_id", currentWorkspaceId)
            .eq("user_id", memberUserId)

        if (error) {
            toastError("Não foi possível remover o membro", { id: `remover-membro:${memberUserId}` })
        } else {
            toastSuccess("Membro removido", { id: `remover-membro:${memberUserId}` })
        }
        await recarregar()
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
        return <Loading />
    }

    if (!user) {
        return null
    }

    if (!currentWorkspaceId) {
        return (
            <Card padding="none">
                <CardContent
                    className="px-4 py-12 md:py-14"
                    role="status"
                    aria-live="polite"
                >
                    <EmptyState variant="plain" size="lg">
                        <EmptyStateIcon variant="stack">
                            <WalletIcon aria-hidden />
                            <UserGroupIcon aria-hidden />
                            <EnvelopeOutlineIcon aria-hidden />
                        </EmptyStateIcon>
                        <EmptyStateTitle>Nenhuma carteira selecionada</EmptyStateTitle>
                        <EmptyStateDescription>
                            Selecione uma carteira no menu lateral para gerenciar membros e convites.
                        </EmptyStateDescription>
                    </EmptyState>
                </CardContent>
            </Card>
        )
    }

    if (bundleQuery.isPending) {
        return <Loading />
    }

    // Convidar é só do dono.
    const botaoConvidar = (className?: string) =>
        canManageMembers ? (
            <Button type="button" variant="primary" className={className} onClick={() => setConvidarAberto(true)}>
                <UserPlusIcon aria-hidden />
                Convidar pessoa
            </Button>
        ) : null

    return (
        <div className="min-w-0 max-w-full space-y-5">
            {revokeConfirmDialog}
            <AlertDialog
                pending={Boolean(removeTarget && busyMemberId === removeTarget.userId)}
                open={removeDialogOpen}
                onOpenChange={(open) => {
                    setRemoveDialogOpen(open)
                    if (!open) setRemoveTarget(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover membro</AlertDialogTitle>
                        <AlertDialogDescription>
                            {removeTarget ? (
                                <>
                                    Tem certeza que deseja remover{" "}
                                    <span className="font-medium">
                                        {removeTarget.name}
                                    </span>{" "}
                                    ({removeTarget.email || "e-mail indisponível"}) desta
                                    carteira?
                                </>
                            ) : (
                                "Tem certeza que deseja remover este membro?"
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            pendingLabel="Removendo…"
                            onClick={(e) => {
                                // Fica aberto enquanto remove; fecha quando termina.
                                e.preventDefault()
                                if (!removeTarget) return
                                void handleRemoveMember(removeTarget.userId).then(() => {
                                    setRemoveDialogOpen(false)
                                })
                            }}
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isMobile ? (
                // No telefone o título é o da casca (`TituloDaTela`); o convite vem logo abaixo.
                botaoConvidar("w-full")
            ) : (
                <PageHeader collapse>
                    <PageHeaderTitleRow>
                        <PageHeaderTitle asChild>
                            {/* O `<h1>` da página é o da barra do topo. */}
                            <p aria-hidden="true">Membros e convidados</p>
                        </PageHeaderTitle>
                    </PageHeaderTitleRow>
                    {canManageMembers ? <PageHeaderActions>{botaoConvidar()}</PageHeaderActions> : null}
                </PageHeader>
            )}

            <WorkspaceInviteDialog
                open={convidarAberto}
                onOpenChange={(aberto) => {
                    setConvidarAberto(aberto)
                    if (!aberto) void recarregar()
                }}
                user={user}
                workspaceId={currentWorkspaceId}
                canManageMembers={canManageMembers}
            />

            <PessoasSecao
                pessoas={members}
                meuUserId={user.id}
                podeGerenciar={canManageMembers}
                onTrocarPapel={(pessoa, papel) => void handleTrocarPapel(pessoa, papel)}
                onRemover={(pessoa) =>
                    openRemoveMemberDialog({
                        userId: pessoa.user_id,
                        name: memberDisplayName(pessoa),
                        email: pessoa.profile?.email || "",
                    })
                }
                ocupadoId={busyMemberId}
            />

            {convitesPorEmail.length > 0 ? (
                <div
                    id="workspace-invites"
                    className="min-w-0 scroll-mt-[calc(var(--mobile-header-offset)+0.5rem)] md:scroll-mt-6"
                >
                    <ConvitesPendentesSecao
                        convites={convitesPorEmail}
                        podeGerenciar={canManageMembers}
                        onReenviar={(convite) => void handleResendInvite(convite.id)}
                        onCancelar={(convite) => void handleRevokeInvite(convite.id)}
                        // O link não fica salvo (só o hash do token): gerar outro, no diálogo, revoga o pendente.
                        ocupadoId={busyInviteId ?? busyResendInviteId}
                    />
                </div>
            ) : null}

            {isAdulto ? (
                <div
                    id="limites"
                    className="min-w-0 scroll-mt-[calc(var(--mobile-header-offset)+0.5rem)] md:scroll-mt-6"
                >
                    <LimitesSecao
                        workspaceId={currentWorkspaceId}
                        pessoas={members}
                        podeEditar={canManageMembers}
                        ym={bundle?.ym ?? ""}
                        limites={bundle?.limites ?? []}
                        lancamentos={bundle?.lancamentos ?? []}
                        indisponivel={bundle?.limitesIndisponivel ?? true}
                        onMudou={recarregar}
                    />
                </div>
            ) : null}
        </div>
    )
}
