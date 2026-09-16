"use client"

import { useTimeout } from "@/hooks/use-timeout"
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy"
import { useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { createActivity } from "@/lib/activity"
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
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
import { Button } from "@/components/ui/button"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { CheckCircleIcon, CheckIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid"
import { cn } from "@/lib/utils"

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
        hasMinLength: password.length >= MIN_PASSWORD_LENGTH,
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
                met ? "text-success" : "text-muted-foreground",
            )}
        >
            {met ? (
                <CheckIcon className="size-3 shrink-0" aria-hidden />
            ) : (
                <span className="size-3 shrink-0 rounded-full border border-current" aria-hidden />
            )}
            {label}
        </div>
    )
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const isMobile = useIsMobile()
    const { user } = useAuth()
    const later = useTimeout()
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
            later(() => {
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
                <InputGroup>
                    <InputGroupInput
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                        disabled={loading}
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
                            aria-pressed={showCurrentPassword}
                        >
                            {showCurrentPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            </div>

            <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <InputGroup>
                    <InputGroupInput
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        required
                        disabled={loading}
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                            aria-pressed={showNewPassword}
                        >
                            {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>

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
                <InputGroup>
                    <InputGroupInput
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                        disabled={loading}
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                            aria-pressed={showConfirmPassword}
                        >
                            {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            </div>

            {error ? (
                <Alert tone="destructive" size="sm">
                    <ExclamationTriangleIcon />
                    <AlertTitle className="break-words">{error}</AlertTitle>
                </Alert>
            ) : null}
            {success ? (
                <Alert tone="success" size="sm">
                    <CheckCircleIcon />
                    <AlertTitle>Senha alterada com sucesso!</AlertTitle>
                </Alert>
            ) : null}
        </div>
    )

    const passwordForm = (
        <CustomForm onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
                {passwordFieldsBody}
            </DialogBody>

            {isMobile ? (
                <DialogFooter className="flex-col">
                    {!success ? (
                        <Button type="submit" disabled={loading} size="xl" className="w-full">
                            {loading ? "Alterando..." : "Alterar senha"}
                        </Button>
                    ) : null}
                </DialogFooter>
            ) : (
                <DialogFooter>
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
                >
                    <DialogHeader>
                        <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" disabled={loading} />}>
                            <DialogTitle>Alterar senha</DialogTitle>
                        </DialogHeaderRow>
                    </DialogHeader>
                    {passwordForm}
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent layout="fixed">
                <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                </DialogHeader>
                {passwordForm}
            </DialogContent>
        </Dialog>
    )
}
