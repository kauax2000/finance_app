"use client"

import { useAuth } from "@/components/providers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
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
    Calendar,
    Trash2,
    LogOut,
    BadgeCheck,
    AlertTriangle,
    Pencil,
    Lock,
    Loader2,
    ImagePlus,
    RefreshCw,
    Trash,
    Activity,
    MoreVertical,
    ArrowRight
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { getInitials } from "@/lib/utils"
import Link from "next/link"
import {
    ChangePasswordDialog,
    DeleteAccountDialog,
} from "@/components/security"
import { AccountSkeleton } from "@/components/skeletons"
import { useSkeletonLoading } from "@/hooks/useSkeletonLoading"

const avatarColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
]

function getAvatarColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % avatarColors.length
    return avatarColors[index]
}

export default function AccountPage() {
    const { user, loading, updateProfile, updateEmail, signOut } = useAuth()
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    // Use skeleton loading hook to ensure skeleton is visible for at least 300ms
    const showSkeleton = useSkeletonLoading(loading, { minDuration: 300 })

    // Security dialogs states
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

    // Edit form states
    const [editName, setEditName] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editPassword, setEditPassword] = useState("")
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarColor = getAvatarColor(userName)
    const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }) : "N/A"

    const currentAvatarUrl = user?.user_metadata?.avatar_url

    // Reset form when dialog opens
    useEffect(() => {
        if (editDialogOpen && user) {
            setEditName(user.user_metadata?.full_name || userName)
            setEditEmail(user.email || "")
            setEditPassword("")
            setAvatarPreview(null)
            setSelectedFile(null)
            setRemoveCurrentPhoto(false)
            setSuccessMessage(null)
            setErrorMessage(null)
        }
    }, [editDialogOpen, user, userName])

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
                        const blob = dataURLtoBlob(compressedBase64)
                        const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
                        setSelectedFile(compressedFile)
                        setErrorMessage(null)
                    }
                }
                img.src = reader.result as string
            }
            reader.readAsDataURL(file)
        }
    }

    function dataURLtoBlob(dataURL: string): Blob {
        const parts = dataURL.split(",")
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg"
        const bstr = atob(parts[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        return new Blob([u8arr], { type: mime })
    }

    const handleRemovePhoto = () => {
        setSelectedFile(null)
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
                    avatar_url: newAvatarUrl
                })
                if (profileError) {
                    setErrorMessage(`Erro ao atualizar perfil: ${profileError}`)
                    setSaving(false)
                    return
                }
            }

            if (editEmail !== userEmail) {
                if (!editPassword) {
                    setErrorMessage("Para alterar o email, digite sua senha atual.")
                    setSaving(false)
                    return
                }
                const { error: emailError, needsConfirmation } = await updateEmail(editEmail, editPassword)
                if (emailError) {
                    setErrorMessage(emailError)
                    setSaving(false)
                    return
                }
                if (needsConfirmation) {
                    setSuccessMessage("Um link de confirmação foi enviado para o novo email. Clique no link para confirmar a alteração.")
                }
            } else {
                setSuccessMessage("Perfil atualizado com sucesso!")
            }
        } catch (err) {
            setErrorMessage("Ocorreu um erro inesperado.")
        } finally {
            setSaving(false)
        }
    }

    // Show skeleton while loading
    if (showSkeleton) {
        return <AccountSkeleton />
    }

    return (
        <div className="space-y-8 max-w-xl mx-auto">
            {/* Card de Perfil Redesenhado */}
            <Card className="border-border/50 py-0">
                <CardContent className="pb-6 pt-6">
                    {/* Mobile: Layout em coluna */}
                    <div className="flex flex-col items-center gap-4 sm:hidden">
                        {/* Avatar principal */}
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-muted shadow-xl overflow-hidden shrink-0">
                            {currentAvatarUrl || avatarPreview ? (
                                <img
                                    src={avatarPreview || currentAvatarUrl || ""}
                                    alt={userName}
                                    className="aspect-square size-full object-cover"
                                />
                            ) : (
                                <div className={`flex size-full items-center justify-center text-white text-2xl font-semibold ${avatarColor}`}>
                                    {getInitials(userName)}
                                </div>
                            )}
                        </div>

                        {/* Badge acima do nome */}
                        <Badge className="gap-1 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <BadgeCheck className="h-3 w-3" />
                            Verificado
                        </Badge>

                        {/* Informações do usuário */}
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-semibold tracking-tight">{userName}</h2>
                            <span className="text-sm text-muted-foreground block">{userEmail}</span>
                        </div>

                        {/* Botões visíveis no mobile */}
                        <div className="flex flex-col gap-2 w-full pt-2">
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => setEditDialogOpen(true)}
                            >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar perfil
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => setChangePasswordOpen(true)}
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Alterar senha
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => signOut()}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sair
                            </Button>
                        </div>
                    </div>

                    {/* Desktop: Layout em linha com dropdown */}
                    <div className="hidden sm:flex flex-row items-center gap-6">
                        {/* Avatar principal */}
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-muted shadow-xl overflow-hidden">
                            {currentAvatarUrl || avatarPreview ? (
                                <img
                                    src={avatarPreview || currentAvatarUrl || ""}
                                    alt={userName}
                                    className="aspect-square size-full object-cover"
                                />
                            ) : (
                                <div className={`flex size-full items-center justify-center text-white text-2xl font-semibold ${avatarColor}`}>
                                    {getInitials(userName)}
                                </div>
                            )}
                        </div>

                        {/* Informações do usuário */}
                        <div className="flex-1 text-left space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold tracking-tight">{userName}</h2>
                                <Badge className="gap-1 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                    <BadgeCheck className="h-3 w-3" />
                                    Verificado
                                </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">{userEmail}</span>
                        </div>

                        {/* Ações do perfil - dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Alterar senha
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => signOut()}
                                    className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog de Editar Perfil */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                        <DialogDescription>
                            Atualize suas informações pessoais
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-24 w-24 rounded-full bg-muted overflow-hidden flex items-center justify-center ring-4 ring-background">
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
                                ) : (
                                    <div className={`flex size-full items-center justify-center text-white text-3xl font-semibold ${avatarColor}`}>
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
                                const hasPhoto = avatarPreview || (currentAvatarUrl && !removeCurrentPhoto)
                                if (hasPhoto) {
                                    return (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Trocar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImagePlus className="h-4 w-4" />
                                        Adicionar Foto
                                    </Button>
                                )
                            })()}

                            <p className="text-xs text-muted-foreground text-center">
                                {avatarPreview || (currentAvatarUrl && !removeCurrentPhoto)
                                    ? "JPEG, PNG ou WEBP até 5MB"
                                    : "Adicione uma foto ao seu perfil"}
                            </p>
                        </div>

                        {/* Nome */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="seu@email.com"
                            />
                            {editEmail !== userEmail && (
                                <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Você receberá um link de confirmação no novo email
                                </p>
                            )}
                        </div>

                        {/* Campo de senha */}
                        {editEmail !== userEmail && (
                            <div className="space-y-2">
                                <Label htmlFor="edit-password">Senha atual</Label>
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

                        {/* Mensagens de feedback */}
                        {errorMessage && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                {errorMessage}
                            </div>
                        )}
                        {successMessage && (
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-500 text-sm flex items-start gap-2">
                                <BadgeCheck className="h-4 w-4 mt-0.5 shrink-0" />
                                {successMessage}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={saving}
                        >
                            {successMessage ? "Fechar" : "Cancelar"}
                        </Button>
                        {!successMessage && (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    "Salvar Alterações"
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Card de Segurança */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Segurança
                    </CardTitle>
                    <CardDescription>
                        Gerencie a segurança da sua conta
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Sessões */}
                    <Link href="/account/sessions" className="block">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-background">
                                    <LogOut className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Sessões ativas</p>
                                    <p className="text-xs text-muted-foreground">Gerencie suas sessões em diferentes dispositivos</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </Link>

                    {/* Atividade */}
                    <Link href="/account/activity" className="block">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-background">
                                    <Activity className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Atividade</p>
                                    <p className="text-xs text-muted-foreground">Histórico de ações na sua conta</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </Link>

                    {/* Excluir Conta - Card Melhorado */}
                    <div className="relative overflow-hidden rounded-lg border border-destructive/30 bg-destructive/5 p-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-destructive">Excluir conta</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Remova permanentemente todos os dados da sua conta. Esta ação não pode ser desfeita.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteAccountOpen(true)}
                            >
                                Excluir
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs de Segurança */}
            <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
            <DeleteAccountDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />

            {/* Footer com Membro desde */}
            <div className="flex justify-center items-center py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Membro desde {createdAt}</span>
                </div>
            </div>
        </div>
    )
}
