"use client"

import { useTimeout } from "@/hooks/use-timeout"
import {
    Field,
    FieldControl,
    FieldLabel,
} from "@/components/ui/field"
import { isPasswordValid } from "@/lib/password-policy"
import { PasswordRequirements } from "@/components/auth/password-requirements"
import { useState } from "react"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { createActivity } from "@/lib/activity"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import {
    InputGroup,
    InputGroupInput,
    InputGroupPasswordToggle,
} from "@/components/ui/input-group"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const { user } = useAuth()
    const later = useTimeout()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const passwordIsValid = isPasswordValid(newPassword)

    const resetForm = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setError(null)
        setSuccess(false)
    }

    // Enquanto altera, o `pending` do `Dialog` já segura todo pedido de fechar.
    const handleOpenChange = (next: boolean) => {
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
            <Field>
                <FieldLabel>Senha atual</FieldLabel>
                <InputGroup>
                    <FieldControl>
                    <InputGroupInput
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Digite sua senha atual"
                        required
                        disabled={loading}
                    />
                    </FieldControl>
                    <InputGroupPasswordToggle />
                </InputGroup>
            </Field>

            <Field>
                <FieldLabel>Nova senha</FieldLabel>
                <InputGroup>
                    <FieldControl>
                    <InputGroupInput
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        required
                        disabled={loading}
                    />
                    </FieldControl>
                    <InputGroupPasswordToggle />
                </InputGroup>

                {/* A lista do cadastro e da redefinição: a mesma política, a
                    mesma peça. Havia aqui um `ReqRow` próprio, com um sexto
                    item ("senha forte") que só repetia os outros cinco. */}
                <PasswordRequirements password={newPassword} />
            </Field>

            <Field>
                <FieldLabel>Confirmar nova senha</FieldLabel>
                <InputGroup>
                    <FieldControl>
                    <InputGroupInput
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                        disabled={loading}
                    />
                    </FieldControl>
                    <InputGroupPasswordToggle />
                </InputGroup>
            </Field>

            {error ? (
                <Alert tone="destructive" size="sm">
                    <AlertTitle>{error}</AlertTitle>
                </Alert>
            ) : null}
            {success ? (
                <Alert tone="success" size="sm">
                    <AlertTitle>Senha alterada com sucesso!</AlertTitle>
                </Alert>
            ) : null}
        </div>
    )

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
    return (
        <Dialog
            surface="auto"
            pending={loading}
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent layout="fixed">
                <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                </DialogHeader>
                <CustomForm
                    pending={loading}
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody>
                        {passwordFieldsBody}
                    </DialogBody>

                    <DialogFooter>
                        <DialogClose asChild>
                            <FormCancel size="sm">
                                {success ? "Fechar" : "Cancelar"}
                            </FormCancel>
                        </DialogClose>
                        {!success ? (
                            <FormSubmit size="sm">
                                Alterar senha
                            </FormSubmit>
                        ) : null}
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
