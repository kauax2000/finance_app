"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react"

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

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setError(null)

        // Validate passwords
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
            // First verify current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email || "",
                password: currentPassword,
            })

            if (signInError) {
                setError("Senha atual incorreta")
                setLoading(false)
                return
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (updateError) {
                setError(updateError.message)
                setLoading(false)
                return
            }

            setSuccess(true)
            setTimeout(() => {
                resetForm()
                onOpenChange(false)
            }, 2000)
        } catch (err) {
            setError("Ocorreu um erro inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                        Atualize sua senha para manter sua conta segura
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Senha atual */}
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

                    {/* Nova senha */}
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

                        {/* Password Requirements Visual Indicator */}
                        {newPassword.length > 0 && (
                            <div className="space-y-1 mt-2">
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasMinLength ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasMinLength ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        )}
                                        8+ caracteres
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasLowercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasLowercase ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        )}
                                        minúscula
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasUppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasUppercase ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        )}
                                        maiúscula
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasDigit ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasDigit ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        )}
                                        número
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasSymbol ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasSymbol ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        )}
                                        símbolo
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordIsValid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {passwordIsValid ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                <circle cx="12" cy="12" r="10"></circle>
                                            </svg>
                                        )}
                                        senha forte
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirmar senha */}
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

                    {/* Mensagens */}
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-500 text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                            Senha alterada com sucesso!
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm()
                                onOpenChange(false)
                            }}
                            disabled={loading}
                        >
                            {success ? "Fechar" : "Cancelar"}
                        </Button>
                        {!success && (
                            <Button type="submit" disabled={loading}>
                                {loading ? "Alterando..." : "Alterar Senha"}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
