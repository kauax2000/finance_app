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
    InputGroupInput,
    InputGroupPasswordToggle,
} from "@/components/ui/input-group"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const isMobile = useIsMobile()
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
