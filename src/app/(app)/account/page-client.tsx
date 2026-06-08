"use client"
/* eslint-disable @next/next/no-img-element -- profile avatars use data URLs / external metadata URLs */

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowRightIcon,
    CalendarIcon,
    LockClosedIcon,
    ArrowRightStartOnRectangleIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline"
import { Activity, UserCheck } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { ChangePasswordDialog, DeleteAccountDialog } from "@/components/security"
import { AccountPageSkeleton } from "@/components/account/account-page-skeleton"
import { EditProfileDialog } from "@/components/account/edit-profile-dialog"
import { getAvatarColor } from "@/lib/avatar"

export default function AccountPage() {
    const { user, profile, loading, profileReady, signOut } = useAuth()
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarColor =
        profile?.avatar_color?.trim() ||
        (user?.email ? getAvatarColor(user.email) : getAvatarColor(userName))
    const createdAt = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : "N/A"

    const currentAvatarUrl = user?.user_metadata?.avatar_url

    if (loading || (user && !profileReady)) {
        return <AccountPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Perfil
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="relative flex size-12 shrink-0 select-none overflow-hidden rounded-lg bg-muted">
                                    {currentAvatarUrl ? (
                                        <img
                                            src={currentAvatarUrl}
                                            alt={userName}
                                            className="aspect-square size-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className={`flex size-full items-center justify-center text-sm font-semibold text-white ${avatarColor}`}
                                        >
                                            {getInitials(userName)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{userName}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {userEmail}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                                            aria-label="Mais opções da conta"
                                        >
                                            <EllipsisVerticalIcon className="size-4" aria-hidden />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                            <PencilIcon className="mr-2 h-4 w-4" />
                                            Editar perfil
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setChangePasswordOpen(true)}
                                        >
                                            <LockClosedIcon className="mr-2 h-4 w-4" />
                                            Alterar senha
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => signOut()}
                                            className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        >
                                            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                                            Sair
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeleteAccountOpen(true)}
                                            className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Excluir conta
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border bg-muted/15 px-4 py-3 text-xs leading-relaxed text-muted-foreground dark:bg-muted/25">
                            <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">Membro desde {createdAt}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex h-8 min-w-0 items-end">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Segurança
                        </p>
                    </div>
                </div>
                <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
                    <CardContent className="flex flex-col p-0">
                        <Link
                            href="/account/sessions"
                            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/30 sm:py-3.5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">Sessões ativas</p>
                                    <p className="text-xs text-muted-foreground">
                                        Gerencie suas sessões
                                    </p>
                                </div>
                            </div>
                            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/account/activity"
                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:py-3.5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">Histórico de atividades</p>
                                    <p className="text-xs text-muted-foreground">
                                        Veja ações recentes na sua conta
                                    </p>
                                </div>
                            </div>
                            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
            <ChangePasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />
            <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
        </div>
    )
}
