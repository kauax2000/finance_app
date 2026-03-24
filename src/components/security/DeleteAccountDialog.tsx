"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers"
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
import { AlertTriangle, Loader2, Trash2, CheckCircle2 } from "lucide-react"

interface DeleteAccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const { user, deleteAccount } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState<"warning" | "confirm">("warning")
    const [confirmEmail, setConfirmEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const userEmail = user?.email || ""
    const emailsMatch = confirmEmail.toLowerCase() === userEmail.toLowerCase()

    const handleClose = () => {
        // Reset state immediately before closing
        setStep("warning")
        setConfirmEmail("")
        setPassword("")
        setError(null)
        setSuccess(false)
        onOpenChange(false)
    }

    const handleContinue = () => {
        setError(null)
        setStep("confirm")
    }

    const handleDelete = async () => {
        if (!emailsMatch) {
            setError("O email não confere")
            return
        }

        if (!password) {
            setError("Digite sua senha")
            return
        }

        setLoading(true)
        setError(null)

        const { error: deleteError } = await deleteAccount(password)

        if (deleteError) {
            setError(deleteError)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)

        // Redirect to home after successful deletion
        setTimeout(() => {
            router.push("/")
            router.refresh()
        }, 2000)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        {success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                            <Trash2 className="h-5 w-5" />
                        )}
                        {success ? "Conta excluída" : step === "warning" ? "Excluir conta" : "Confirmar exclusão"}
                    </DialogTitle>
                    <DialogDescription>
                        {success
                            ? "Sua conta foi excluída com sucesso. Redirecionando..."
                            : step === "warning"
                                ? "Esta ação é irreversível"
                                : "Digite seu email e senha para confirmar a exclusão"
                        }
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="rounded-full bg-green-100 p-4 dark:bg-green-950">
                            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Todos os seus dados foram removidos permanentemente.
                        </p>
                    </div>
                ) : step === "warning" ? (
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-destructive/10 p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                                <div className="text-sm space-y-2">
                                    <p className="font-medium text-destructive">Atenção: esta ação não pode ser desfeita</p>
                                    <p className="text-muted-foreground">Ao excluir sua conta, os seguintes dados serão removidos permanentemente:</p>
                                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                        <li>Todas as transações</li>
                                        <li>Todas as carteiras</li>
                                        <li>Todas as categorias</li>
                                        <li>Suas preferências de notificação</li>
                                        <li>Seu perfil de usuário</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {/* Email confirmation */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-email">Confirme seu email</Label>
                            <Input
                                id="confirm-email"
                                type="email"
                                placeholder={userEmail}
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                className={emailsMatch && confirmEmail ? "border-green-500" : ""}
                            />
                            {confirmEmail && !emailsMatch && (
                                <p className="text-xs text-destructive">O email não confere</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="delete-password">Sua senha</Label>
                            <Input
                                id="delete-password"
                                type="password"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Necessário confirmar sua identidade para excluir a conta
                            </p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {success ? (
                        <Button variant="outline" onClick={handleClose} className="w-full">
                            Fechar
                        </Button>
                    ) : step === "warning" ? (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleContinue}
                            >
                                Continuar
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep("warning")
                                    setError(null)
                                }}
                                disabled={loading}
                            >
                                Voltar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading || !emailsMatch || !password}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Excluindo...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir conta
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
