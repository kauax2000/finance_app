"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { createActivity } from "@/lib/activity"
import {
    Dialog,
    DialogContent,
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
    CheckCircle2,
    Circle,
    Eye,
    EyeOff,
} from "lucide-react"
import { ExclamationTriangleIcon, CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

const dialogFooterClass =
    "!mx-0 !mb-0 mt-0 shrink-0 flex flex-row flex-wrap justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row"

const sheetFooterMobileClass =
    "mt-0 shrink-0 flex-col gap-2 border-t border-border bg-background px-4 py-4"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface PasswordRequirements {
    hasMinLength: boolean
    hasLowercase: boolean
    hasUppercase: boolean
    hasDigit: boolean
    hasSymbol: boolean
}

function checkPasswordRequirements(password: string): PasswordRequirements {
    return {
        hasMinLength: password.length >= 8,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasDigit: /\d/.test(password),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
}

function isPasswordValid(requirements: PasswordRequirements): boolean {
    return Object.values(requirements).every(Boolean)
}

function ReqRow({
    met,
    label,
}: {
    met: boolean
    label: string
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-1.5 text-xs",
                met ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
            )}
        >
            {met ? (
                <CheckIcon className="size-3 shrink-0" aria-hidden />
            ) : (
                <Circle className="size-3 shrink-0" aria-hidden />
            )}
            {label}
        </div>
    )
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const isMobile = useIsMobile()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const passwordRequirements = checkPasswordRequirements(newPassword)
    const passwordIsValid = isPasswordValid(passwordRequirements)

    const resetForm = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setError(null)
        setSuccess(false)
    }

    const handleOpenChange = (next: boolean) => {
        if (!next && loading) return
        if (!next) {
            resetForm()
        }
        onOpenChange(next)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setError(null)

        if (!passwordIsValid) {
            setError("A senha não atende todos os requisitos")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem")
            return
        }

        setLoading(true)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email || "",
                password: currentPassword,
            })

            if (signInError) {
                setError("Senha atual incorreta")
                setLoading(false)
                return
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (updateError) {
                setError(updateError.message)
                setLoading(false)
                return
            }

            try {
                await createActivity({
                    type: "password_change",
                    description: "Senha alterada",
                    status: "success",
                })
            } catch {
                /* log opcional */
            }

            setSuccess(true)
            setTimeout(() => {
                handleOpenChange(false)
            }, 2000)
        } catch {
            setError("Ocorreu um erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    const passwordFieldsBody = (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <div className="relative">
                    <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                        disabled={loading}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                        {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                    <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        required
                        disabled={loading}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                        {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {newPassword.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg border border-border/80 bg-muted/20 p-3">
                        <ReqRow met={passwordRequirements.hasMinLength} label="8+ caracteres" />
                        <ReqRow met={passwordRequirements.hasLowercase} label="minúscula" />
                        <ReqRow met={passwordRequirements.hasUppercase} label="maiúscula" />
                        <ReqRow met={passwordRequirements.hasDigit} label="número" />
                        <ReqRow met={passwordRequirements.hasSymbol} label="símbolo" />
                        <ReqRow met={passwordIsValid} label="senha forte" />
                    </div>
                ) : null}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                    <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                        disabled={loading}
                        className="pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-words">{error}</span>
                </div>
            ) : null}
            {success ? (
                <div className="flex items-start gap-2 rounded-lg border border-green-600/30 bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:border-green-500/30 dark:text-green-400">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Senha alterada com sucesso!</span>
                </div>
            ) : null}
        </div>
    )

    const passwordForm = (
        <CustomForm onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div
                className={cn(
                    "min-h-0 flex-1 overflow-y-auto py-4",
                    isMobile ? "px-4" : "px-6",
                )}
            >
                {passwordFieldsBody}
            </div>

            {isMobile ? (
                <SheetFooter className={sheetFooterMobileClass}>
                    {!success ? (
                        <Button type="submit" disabled={loading} className="h-10 w-full">
                            {loading ? "Alterando..." : "Alterar senha"}
                        </Button>
                    ) : null}
                </SheetFooter>
            ) : (
                <DialogFooter className={dialogFooterClass}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        {success ? "Fechar" : "Cancelar"}
                    </Button>
                    {!success ? (
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Alterando..." : "Alterar senha"}
                        </Button>
                    ) : null}
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
                        title="Alterar senha"
                        endAdornment={
                            <MobileSheetFormHeaderCloseButton disabled={loading} />
                        }
                    />
                    {passwordForm}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[min(90dvh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="shrink-0 px-6 py-4 text-left">
                    <DialogTitle>Alterar senha</DialogTitle>
                </DialogHeader>
                {passwordForm}
            </DialogContent>
        </Dialog>
    )
}
