"use client"
/* eslint-disable @next/next/no-img-element -- profile avatars use data URLs / external metadata URLs */

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/providers"
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { CustomForm } from "@/components/ui/form"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, PhotoIcon, TrashIcon } from "@heroicons/react/16/solid"
import { getInitials, cn } from "@/lib/utils"
import { createActivity } from "@/lib/activity"
import { identityToneFor } from "@/lib/avatar"

type EditProfileDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
    const isMobile = useIsMobile()
    const { user, profile, profileReady, updateProfile, updateEmail, uploadAvatar } = useAuth()

    const [editName, setEditName] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editPassword, setEditPassword] = useState("")
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    /** A imagem comprimida como arquivo: é ela que sobe para o Storage. */
    const avatarFileRef = useRef<File | null>(null)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarTone = identityToneFor(
        profile?.avatar_color,
        user?.email || userName
    )
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
                        canvas.toBlob(
                            (blob) => {
                                avatarFileRef.current = blob
                                    ? new File([blob], "avatar.jpg", { type: "image/jpeg" })
                                    : null
                            },
                            "image/jpeg",
                            0.7,
                        )
                    }
                }
                img.src = reader.result as string
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemovePhoto = () => {
        setAvatarPreview(null)
        avatarFileRef.current = null
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
            let profileSaved = false

            // Valida antes de gravar qualquer coisa: esta checagem vinha depois do
            // perfil, e o nome era salvo enquanto a tela dizia só "erro".
            if (editEmail !== userEmail && !editPassword) {
                setErrorMessage("Para alterar o email, digite sua senha atual.")
                return
            }

            if (hasNameChanged || isRemovingPhoto || isAddingNewPhoto) {
                // A foto vai para o Storage e o perfil guarda só a URL. Antes o
                // base64 ia para o user_metadata, e com ele para dentro de todo JWT.
                let newAvatarUrl: string | undefined = isRemovingPhoto ? "" : undefined
                if (isAddingNewPhoto) {
                    const file = avatarFileRef.current
                    if (!file) {
                        setErrorMessage("A imagem ainda está sendo preparada. Tente de novo.")
                        setSaving(false)
                        return
                    }
                    const uploaded = await uploadAvatar(file)
                    if (uploaded.error || !uploaded.avatarUrl) {
                        setErrorMessage(uploaded.error ?? "Erro ao enviar a foto.")
                        setSaving(false)
                        return
                    }
                    // Mesmo nome de arquivo a cada troca: a versão fura o cache da imagem.
                    newAvatarUrl = `${uploaded.avatarUrl}?v=${Date.now()}`
                }
                const { error: profileError } = await updateProfile({
                    full_name: editName,
                    avatar_url: newAvatarUrl,
                })
                if (profileError) {
                    setErrorMessage(`Erro ao atualizar perfil: ${profileError}`)
                    setSaving(false)
                    return
                }
                profileSaved = true
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
                const { error: emailError, needsConfirmation } = await updateEmail(
                    editEmail,
                    editPassword,
                )
                if (emailError) {
                    setErrorMessage(
                        profileSaved
                            ? `Nome e foto foram salvos, mas o email não mudou: ${emailError}`
                            : emailError,
                    )
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
                {/* Cru de propósito: 80px está acima do `xl` do `Avatar` (56), e este
                    é o retrato do formulário — ele mostra o preview do arquivo
                    escolhido antes de existir usuário nenhum para o componente. */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-4 ring-background">
                    {avatarPreview ? (
                        <img
                            src={avatarPreview}
                            alt="Preview"
                            className="aspect-square size-full object-cover"
                            decoding="async"
                        />
                    ) : currentAvatarUrl && !removeCurrentPhoto ? (
                        <img
                            src={currentAvatarUrl}
                            alt={userName}
                            className="aspect-square size-full object-cover"
                            decoding="async"
                        />
                    ) : !profileReady ? (
                        <div className="size-full animate-pulse bg-muted" aria-hidden />
                    ) : (
                        <div
                            className={cn(
                                "flex size-full items-center justify-center text-2xl font-semibold",
                                avatarTone.surface,
                                avatarTone.ink
                            )}
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
                                    <ArrowPathIcon className="h-3.5 w-3.5" />
                                    Trocar
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={handleRemovePhoto}
                                >
                                    <TrashIcon className="h-3.5 w-3.5" />
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
                            <PhotoIcon className="h-4 w-4" />
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
                    <p className="flex items-center gap-1 text-xs text-warning-muted-foreground">
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
                <Alert tone="destructive" size="sm">
                    <ExclamationTriangleIcon />
                    <AlertTitle className="break-words">{errorMessage}</AlertTitle>
                </Alert>
            )}
            {successMessage && (
                <Alert tone="success" size="sm">
                    <CheckCircleIcon />
                    <AlertTitle className="break-words">{successMessage}</AlertTitle>
                </Alert>
            )}
        </div>
    )

    const profileForm = (
        <CustomForm
            onSubmit={handleProfileFormSubmit}
            className="flex min-h-0 flex-1 flex-col"
        >
            <DialogBody>
                {profileFormFields}
            </DialogBody>

            {isMobile ? (
                <DialogFooter className="flex-col">
                    {!successMessage && (
                        <Button type="submit" disabled={saving} size="xl" className="w-full">
                            {saving ? (
                                <>
                                    <Spinner />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            ) : (
                <DialogFooter>
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
                                    <Spinner />
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
                >
                    <DialogHeader>
                        <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" disabled={saving} />}>
                            <DialogTitle>Editar perfil</DialogTitle>
                            <DialogDescription>Atualize suas informações pessoais</DialogDescription>
                        </DialogHeaderRow>
                    </DialogHeader>
                    {profileForm}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent layout="fixed">
                <DialogHeader>
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
