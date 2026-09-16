"use client"

import {
    Field,
    FieldControl,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { useTimeout } from "@/hooks/use-timeout"
import { ROUTES } from "@/config/navigation"
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CustomForm, FormInput } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid"

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
    email?: string
    token?: string
    password?: string
    confirmPassword?: string
}

export function ForgotPasswordForm() {
    const router = useRouter()
    const later = useTimeout()
    const [email, setEmail] = useState("")
    const [token, setToken] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [success, setSuccess] = useState(false)
    const [step, setStep] = useState<"email" | "reset">("email")
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const validateEmailField = (): boolean => {
        const errors: FieldErrors = {}

        if (!email.trim()) {
            errors.email = "Email é obrigatório"
        } else if (!emailRegex.test(email)) {
            errors.email = "Digite um email válido"
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const validateResetFields = (): boolean => {
        const errors: FieldErrors = {}

        if (!token.trim()) {
            errors.token = "Token é obrigatório"
        }

        if (!password) {
            errors.password = "Senha é obrigatória"
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            errors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
        }

        if (!confirmPassword) {
            errors.confirmPassword = "Confirme sua senha"
        } else if (password !== confirmPassword) {
            errors.confirmPassword = "As senhas não coincidem"
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccessMessage("")
        setFieldErrors({})

        if (!validateEmailField()) {
            return
        }

        setLoading(true)

        const { error: _resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: undefined,
        })

        if (_resetError) {
            setError(_resetError.message)
            setLoading(false)
        } else {
            setSuccessMessage("Token enviado! Verifique seu email.")
            setStep("reset")
            setLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setFieldErrors({})

        if (!validateResetFields()) {
            return
        }

        setLoading(true)

        try {
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: token.trim(),
                refresh_token: "",
            })

            if (sessionError) {
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    email,
                    token: token.trim(),
                    type: "recovery",
                })

                if (verifyError) {
                    setError(verifyError.message)
                    setLoading(false)
                    return
                }
            }

            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            })

            if (updateError) {
                setError(updateError.message)
                setLoading(false)
            } else {
                setSuccess(true)
                setLoading(false)
                later(() => {
                    router.push(ROUTES.LOGIN)
                }, 3000)
            }
        } catch {
            setError("Ocorreu um erro ao redefinir a senha")
            setLoading(false)
        }
    }

    return (
        <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-6 p-6">
                {success ? (
                    <div className="flex flex-col gap-4">
                        <Alert tone="success" variant="plain">
                            <AlertTitle>Senha atualizada!</AlertTitle>
                            <AlertDescription>
                                Você será redirecionado para o login em breve.
                            </AlertDescription>
                        </Alert>
                        <Button asChild className="w-full">
                            <Link href={ROUTES.LOGIN}>Voltar ao login</Link>
                        </Button>
                    </div>
                ) : step === "email" ? (
                    <CustomForm onSubmit={handleSendEmail} className="flex flex-col gap-4" noValidate>
                        <div className="text-center mb-2">
                            <p className="text-sm text-muted-foreground">
                                Digite seu email para receber o token de recuperação.
                            </p>
                        </div>
                        {successMessage && (
                            <Alert tone="success" variant="plain">
                                <AlertTitle>{successMessage}</AlertTitle>
                            </Alert>
                        )}
                        {error ? (
                            <Alert tone="destructive" variant="plain">
                                <AlertTitle>{error}</AlertTitle>
                            </Alert>
                        ) : null}
                        <FormInput
                            id="email"
                            label="Email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (fieldErrors.email) {
                                    setFieldErrors(prev => ({ ...prev, email: undefined }))
                                }
                            }}
                            error={fieldErrors.email}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Enviando..." : "Enviar token"}
                        </Button>
                    </CustomForm>
                ) : (
                    <CustomForm onSubmit={handleResetPassword} className="flex flex-col gap-4" noValidate>
                        <div className="text-center mb-2">
                            <p className="text-sm text-muted-foreground">
                                Digite o token enviado para seu email e defina sua nova senha.
                            </p>
                        </div>
                        {error ? (
                            <Alert tone="destructive" variant="plain">
                                <AlertTitle>{error}</AlertTitle>
                            </Alert>
                        ) : null}
                        <FormInput
                            id="token"
                            label="Token de recuperação"
                            type="text"
                            placeholder="Cole o token do email aqui"
                            value={token}
                            onChange={(e) => {
                                setToken(e.target.value)
                                if (fieldErrors.token) {
                                    setFieldErrors(prev => ({ ...prev, token: undefined }))
                                }
                            }}
                            error={fieldErrors.token}
                        />
                        <Field>
                            <FieldLabel>Nova Senha</FieldLabel>
                            <InputGroup>
                                <FieldControl>
    <InputGroupInput
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Digite sua nova senha"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value)
                                            if (fieldErrors.password) {
                                                setFieldErrors(prev => ({ ...prev, password: undefined }))
                                            }
                                        }}
    
                                    />
                                </FieldControl>
                                <InputGroupAddon align="inline-end">
                                    <InputGroupButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                        aria-pressed={showPassword}
                                    >
                                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                    </InputGroupButton>
                                </InputGroupAddon>
                            </InputGroup>
                            {fieldErrors.password ? (
                                <FieldError>{fieldErrors.password}</FieldError>
                            ) : null}
                        </Field>
                        <Field>
                            <FieldLabel>Confirmar Senha</FieldLabel>
                            <InputGroup>
                                <FieldControl>
    <InputGroupInput
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirme sua senha"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value)
                                            if (fieldErrors.confirmPassword) {
                                                setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }))
                                            }
                                        }}
    
                                    />
                                </FieldControl>
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
                            {fieldErrors.confirmPassword ? (
                                <FieldError>{fieldErrors.confirmPassword}</FieldError>
                            ) : null}
                        </Field>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Atualizando..." : "Atualizar Senha"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setStep("email"); setError(""); setSuccessMessage(""); setFieldErrors({}); }}
                            className="w-full"
                        >
                            Voltar
                        </Button>
                    </CustomForm>
                )}

                {step === "email" && (
                    <p className="text-center text-sm text-muted-foreground">
                        Lembrou a senha?{" "}
                        <Link href={ROUTES.LOGIN} className="text-primary-accent font-medium underline-offset-4 hover:underline">
                            Fazer login
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}