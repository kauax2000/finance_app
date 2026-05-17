"use client"
/* eslint-disable @next/next/no-img-element -- profile avatars use data URLs / external metadata URLs */

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/providers"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    MobileSheetFormDragStrip,
    MobileSheetFormHeaderCloseButton,
    MobileSheetFormStickyHeader,
    mobileFormSheetContentClassName,
} from "@/components/ui/mobile-sheet-form-chrome"
import { useIsMobile } from "@/hooks/use-mobile"
import { CustomForm } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline"
import { ImagePlus, RefreshCw, Trash } from "lucide-react"
import { getInitials, cn } from "@/lib/utils"
import { createActivity } from "@/lib/activity"
import { getAvatarColor } from "@/lib/avatar"

const dialogFooterClass =
    "!mx-0 !mb-0 mt-0 shrink-0 flex flex-row flex-wrap justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row"

const sheetFooterMobileClass =
    "mt-0 shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-4"

type EditProfileDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const isMobile = useIsMobile()
    const { user, profile, profileReady, updateProfile, updateEmail } = useAuth()

    const [editName, setEditName] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editPassword, setEditPassword] = useState("")
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarColor =
        profile?.avatar_color?.trim() ||
        (user?.email ? getAvatarColor(user.email) : getAvatarColor(userName))
    const currentAvatarUrl = user?.user_metadata?.avatar_url

    useEffect(() => {
        if (open && user) {
            setEditName(user.user_metadata?.full_name || userName)
            setEditEmail(user.email || "")
            setEditPassword("")
            setAvatarPreview(null)
            setRemoveCurrentPhoto(false)
            setSuccessMessage(null)
            setErrorMessage(null)
        }
    }, [open, user, userName])

    const handleOpenChange = (next: boolean) => {
        if (!next && saving) return
        if (!next) {
            setSuccessMessage(null)
            setErrorMessage(null)
        }
        onOpenChange(next)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith("image/")) {
                setErrorMessage("Por favor, selecione uma imagem.")
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement("canvas")
                    const maxSize = 200
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width)
                            width = maxSize
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height)
                            height = maxSize
                        }
                    }

                    canvas.width = width
                    canvas.height = height

                    const ctx = canvas.getContext("2d")
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height)
                        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
                        setAvatarPreview(compressedBase64)
                        setErrorMessage(null)
                    }
                }
                img.src = reader.result as string
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemovePhoto = () => {
        setAvatarPreview(null)
        setRemoveCurrentPhoto(true)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSave = async () => {
        if (!user) return

        setSaving(true)
        setSuccessMessage(null)
        setErrorMessage(null)

        try {
            const currentName = user.user_metadata?.full_name || userName
            const hasNameChanged = editName !== currentName
            const isRemovingPhoto = removeCurrentPhoto && currentAvatarUrl
            const isAddingNewPhoto = !!avatarPreview

            if (hasNameChanged || isRemovingPhoto || isAddingNewPhoto) {
                const newAvatarUrl = isRemovingPhoto ? "" : (avatarPreview || undefined)
                const { error: profileError } = await updateProfile({
                    full_name: editName,
                    avatar_url: newAvatarUrl,
                })
                if (profileError) {
                    setErrorMessage(`Erro ao atualizar perfil: ${profileError}`)
                    setSaving(false)
                    return
                }
                void createActivity({
                    type: "profile_update",
                    description: "Dados do perfil atualizados",
                    status: "success",
                    metadata: {
                        full_name: editName,
                        avatar_action: isRemovingPhoto
                            ? "remove"
                            : isAddingNewPhoto
                              ? "add"
                              : "none",
                    },
                }).catch(() => {
                    /* opcional */
                })
            }

            if (editEmail !== userEmail) {
                if (!editPassword) {
                    setErrorMessage("Para alterar o email, digite sua senha atual.")
                    setSaving(false)
                    return
                }
                const { error: emailError, needsConfirmation } = await updateEmail(
                    editEmail,
                    editPassword,
                )
                if (emailError) {
                    setErrorMessage(emailError)
                    setSaving(false)
                    return
                }
                if (needsConfirmation) {
                    setSuccessMessage(
                        "Um link de confirmação foi enviado para o novo email. Clique no link para confirmar a alteração.",
                    )
                }
                void createActivity({
                    type: "profile_update",
                    description: needsConfirmation
                        ? "Solicitação de alteração de email enviada"
                        : "Email atualizado",
                    status: needsConfirmation ? "pending" : "success",
                    metadata: {
                        email_change: true,
                        target_email: editEmail,
                        pending_confirmation: needsConfirmation,
                    },
                }).catch(() => {
                    /* opcional */
                })
            } else {
                setSuccessMessage("Perfil atualizado com sucesso!")
            }
        } catch {
            setErrorMessage("Ocorreu um erro inesperado.")
        } finally {
            setSaving(false)
        }
    }

    const handleProfileFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        void handleSave()
    }

    const profileFormFields = (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-4 ring-background">
                    {avatarPreview ? (
                        <img
                            src={avatarPreview}
                            alt="Preview"
                            className="aspect-square size-full object-cover"
                        />
                    ) : currentAvatarUrl && !removeCurrentPhoto ? (
                        <img
                            src={currentAvatarUrl}
                            alt={userName}
                            className="aspect-square size-full object-cover"
                        />
                    ) : !profileReady ? (
                        <div className="size-full animate-pulse bg-muted" aria-hidden />
                    ) : (
                        <div
                            className={`flex size-full items-center justify-center text-2xl font-semibold text-white ${avatarColor}`}
                        >
                            {getInitials(editName || userName)}
                        </div>
                    )}
                </div>

                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {(() => {
                    const hasPhoto =
                        avatarPreview || (currentAvatarUrl && !removeCurrentPhoto)
                    if (hasPhoto) {
                        return (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Trocar
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={handleRemovePhoto}
                                >
                                    <Trash className="h-3.5 w-3.5" />
                                    Remover
                                </Button>
                            </div>
                        )
                    }
                    return (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-4 w-4" />
                            Adicionar foto
                        </Button>
                    )
                })()}

                <p className="text-center text-xs text-muted-foreground">
                    {avatarPreview || (currentAvatarUrl && !removeCurrentPhoto)
                        ? "JPEG, PNG ou WEBP até 5MB"
                        : "Adicione uma foto ao seu perfil"}
                </p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs">
                    Nome
                </Label>
                <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Seu nome"
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs">
                    Email
                </Label>
                <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="seu@email.com"
                />
                {editEmail !== userEmail && (
                    <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                        <ExclamationTriangleIcon className="h-3 w-3 shrink-0" />
                        Você receberá um link de confirmação no novo email
                    </p>
                )}
            </div>

            {editEmail !== userEmail && (
                <div className="space-y-1.5">
                    <Label htmlFor="edit-password" className="text-xs">
                        Senha atual
                    </Label>
                    <Input
                        id="edit-password"
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Digite sua senha para confirmar"
                    />
                    <p className="text-xs text-muted-foreground">
                        Necessário confirmar sua identidade para alterar o email
                    </p>
                </div>
            )}

            {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-words">{errorMessage}</span>
                </div>
            )}
            {successMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-green-600/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:border-green-500/30 dark:text-green-400">
                    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-words">{successMessage}</span>
                </div>
            )}
        </div>
    )

    const profileForm = (
        <CustomForm
            onSubmit={handleProfileFormSubmit}
            className="flex min-h-0 flex-1 flex-col"
        >
            <div
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto py-4",
                    isMobile ? "px-4" : "px-6",
                )}
            >
                {profileFormFields}
            </div>

            {isMobile ? (
                <SheetFooter className={sheetFooterMobileClass}>
                    {!successMessage && (
                        <Button type="submit" disabled={saving} className="h-10 w-full">
                            {saving ? (
                                <>
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar"
                            )}
                        </Button>
                    )}
                </SheetFooter>
            ) : (
                <DialogFooter className={dialogFooterClass}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                        disabled={saving}
                    >
                        {successMessage ? "Fechar" : "Cancelar"}
                    </Button>
                    {!successMessage && (
                        <Button type="submit" size="sm" disabled={saving}>
                            {saving ? (
                                <>
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            )}
        </CustomForm>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent
                    side="bottom"
                    fillMobileViewport
                    showCloseButton={false}
                    className={mobileFormSheetContentClassName}
                >
                    <MobileSheetFormDragStrip />
                    <MobileSheetFormStickyHeader
                        title="Editar perfil"
                        description="Atualize suas informações pessoais"
                        endAdornment={
                            <MobileSheetFormHeaderCloseButton disabled={saving} />
                        }
                    />
                    {profileForm}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="shrink-0 px-6 py-4 text-left">
                    <DialogTitle>Editar perfil</DialogTitle>
                    <DialogDescription className="text-xs leading-snug">
                        Atualize suas informações pessoais
                    </DialogDescription>
                </DialogHeader>
                {profileForm}
            </DialogContent>
        </Dialog>
    )
}
