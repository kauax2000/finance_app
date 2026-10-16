"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    PageSection,
    PageSectionHeader,
    PageSectionTitle,
} from "@/components/ui/page-section"
import { formatDateLongPtBr } from "@/lib/transaction-date"
import { ROUTES } from "@/config/navigation"
import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers"
import { Card, CardContent, CardNote } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuHeader,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRightIcon, ArrowRightStartOnRectangleIcon, CalendarIcon, SparklesIcon, ChartBarIcon, CheckBadgeIcon, EllipsisVerticalIcon, LockClosedIcon, PencilIcon, TrashIcon } from "@heroicons/react/16/solid"
import { cn, getInitials } from "@/lib/utils"
import { ChangePasswordDialog, DeleteAccountDialog } from "@/components/security"
import { AccountPageSkeleton } from "@/components/account/account-page-skeleton"
import { EditProfileDialog } from "@/components/account/edit-profile-dialog"
import { identityToneFor } from "@/lib/avatar"

export default function AccountPage() {
    const { user, profile, loading, profileReady, signOut } = useAuth()
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarTone = identityToneFor(
        profile?.avatar_color,
        user?.email || userName
    )
    const createdAt = user?.created_at
        ? formatDateLongPtBr(user.created_at)
        : "N/A"

    const currentAvatarUrl = user?.user_metadata?.avatar_url

    if (loading || (user && !profileReady)) {
        return <AccountPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            <PageSection>
                <PageSectionHeader>
                    <PageSectionTitle>Perfil</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <CardContent className="flex flex-col">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Avatar size="lg" className="shrink-0">
                                    {currentAvatarUrl ? (
                                        <AvatarImage src={currentAvatarUrl} alt={userName} />
                                    ) : null}
                                    <AvatarFallback
                                        className={cn(
                                            "font-semibold",
                                            avatarTone.surface,
                                            avatarTone.ink
                                        )}
                                    >
                                        {getInitials(userName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{userName}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {userEmail}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <DropdownMenu mobile="sheet">
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="tertiary"
                                            size="icon-lg"
                                            className="size-9 shrink-0 text-muted-foreground hover:text-foreground active:text-foreground"
                                            aria-label="Mais opções da conta"
                                        >
                                            <EllipsisVerticalIcon className="size-4" aria-hidden />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        size="md"
                                        header={
                                            <DropdownMenuHeader
                                                title={userName}
                                                description={userEmail}
                                            />
                                        }
                                    >
                                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                            <PencilIcon aria-hidden />
                                            Editar perfil
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setChangePasswordOpen(true)}
                                        >
                                            <LockClosedIcon aria-hidden />
                                            Alterar senha
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() => signOut()}
                                        >
                                            <ArrowRightStartOnRectangleIcon aria-hidden />
                                            Sair
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() => setDeleteAccountOpen(true)}
                                        >
                                            <TrashIcon aria-hidden />
                                            Excluir conta
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <CardNote className="items-center justify-center">
                            <CalendarIcon className="size-3.5 shrink-0" aria-hidden />
                            <p className="min-w-0 break-words">Membro desde {createdAt}</p>
                        </CardNote>
                    </CardContent>
                </Card>
            </PageSection>

            <PageSection>
                <PageSectionHeader>
                    <PageSectionTitle>Segurança</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <CardContent className="flex flex-col">
                        <Link
                            href={ROUTES.ACCOUNT_SESSIONS}
                            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/30 active:bg-muted/30 sm:py-3.5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                    <CheckBadgeIcon className="h-4 w-4 text-muted-foreground" />
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
                            href={ROUTES.ACCOUNT_ACTIVITY}
                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30 active:bg-muted/30 sm:py-3.5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                    <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
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
            </PageSection>

            {/* No telefone o plano mora aqui, e não no menu da conta da barra de baixo;
                no desktop ele segue no menu do usuário. */}
            <PageSection className="md:hidden">
                <PageSectionHeader>
                    <PageSectionTitle>Plano</PageSectionTitle>
                </PageSectionHeader>
                <Card padding="none">
                    <CardContent className="flex flex-col">
                        <Link
                            href={ROUTES.PLANS}
                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30 active:bg-muted/30 sm:py-3.5"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                                    <SparklesIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">Planos e pagamentos</p>
                                    <p className="text-xs text-muted-foreground">
                                        Seu plano e as cobranças
                                    </p>
                                </div>
                            </div>
                            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            </PageSection>

            <EditProfileDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} />
            <ChangePasswordDialog
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />
            <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />
        </div>
    )
}
