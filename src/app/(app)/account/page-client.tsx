"use client"

import { useState } from "react"
import { AccountPageSkeleton } from "@/components/account/account-page-skeleton"
import { AtalhoSecao } from "@/components/account/atalho-secao"
import { EditProfileDialog } from "@/components/account/edit-profile-dialog"
import { IasSecao } from "@/components/account/ias-secao"
import { useAuth } from "@/components/providers"
import { ChangePasswordDialog, DeleteAccountDialog } from "@/components/security"
import { SettingsLink, SettingsSection } from "@/components/settings/settings-section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ItemGroup } from "@/components/ui/item"
import { PageHeader, PageHeaderTitle } from "@/components/ui/page-header"
import { Muted } from "@/components/ui/typography"
import { ROUTES } from "@/config/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { identityToneFor } from "@/lib/avatar"
import { resumoDoPlano, usePlano } from "@/lib/planos/plano"
import { toastError } from "@/lib/toast"
import { formatDateLongPtBr } from "@/lib/transaction-date"
import { cn, getInitials } from "@/lib/utils"

export default function AccountPage() {
    const { user, profile, loading, profileReady, signOut } = useAuth()
    const { plano } = usePlano()
    const isMobile = useIsMobile()
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
    const currentAvatarUrl = user?.user_metadata?.avatar_url

    if (loading || (user && !profileReady)) {
        return <AccountPageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-8">
            {/* No telefone a rota é subpágina: o nome é o da casca, ao rolar. */}
            {isMobile ? null : (
                <PageHeader collapse>
                    <PageHeaderTitle asChild>
                        {/* O `<h1>` da página é o da barra do topo. */}
                        <p aria-hidden="true">Minha conta</p>
                    </PageHeaderTitle>
                </PageHeader>
            )}

            <div className="min-w-0 space-y-5">
                <div className="flex min-w-0 items-center gap-3">
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
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium">{userName}</p>
                        <Muted className="truncate">{userEmail}</Muted>
                        {user?.created_at ? (
                            <Muted>Membro desde {formatDateLongPtBr(user.created_at)}</Muted>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        className="shrink-0"
                        onClick={() => setEditDialogOpen(true)}
                    >
                        Editar perfil
                    </Button>
                </div>

                <SettingsSection titulo="Acesso e plano">
                    <Card padding="none">
                        <ItemGroup variant="divided">
                            <SettingsLink
                                titulo="Senha"
                                valor="Alterar"
                                onClick={() => setChangePasswordOpen(true)}
                            />
                            <SettingsLink
                                titulo="Plano"
                                valor={plano ? resumoDoPlano(plano, new Date(), null).titulo : undefined}
                                href={ROUTES.PLANS}
                            />
                        </ItemGroup>
                    </Card>
                </SettingsSection>

                <AtalhoSecao />
                <IasSecao />

                <SettingsSection titulo="Privacidade">
                    <Card padding="none">
                        <SettingsLink titulo="Política de privacidade" href={ROUTES.PRIVACY} />
                    </Card>
                </SettingsSection>
            </div>

            <div className="flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="tertiary"
                    onClick={async () => {
                        const { error } = await signOut()
                        if (error) toastError(error)
                    }}
                >
                    Sair
                </Button>
                <Button
                    type="button"
                    variant="tertiary"
                    className="text-destructive hover:text-destructive active:text-destructive"
                    onClick={() => setDeleteAccountOpen(true)}
                >
                    Excluir conta
                </Button>
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
