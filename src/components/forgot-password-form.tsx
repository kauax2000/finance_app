"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
        } else if (password.length < 6) {
            errors.password = "A senha deve ter pelo menos 6 caracteres"
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

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: undefined,
        })

        if (error) {
            setError(error.message)
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
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            }
        } catch (err) {
            setError("Ocorreu um erro ao redefinir a senha")
            setLoading(false)
        }
    }

    return (
        <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-6 p-6">
                {success ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm p-3 rounded-md">
                            <p className="font-medium">Senha atualizada!</p>
                            <p className="text-muted-foreground mt-1">
                                Você será redirecionado para o login em breve.
                            </p>
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/login">Voltar ao login</Link>
                        </Button>
                    </div>
                ) : step === "email" ? (
                    <form onSubmit={handleSendEmail} className="flex flex-col gap-4" noValidate>
                        <div className="text-center mb-2">
                            <p className="text-sm text-muted-foreground">
                                Digite seu email para receber o token de recuperação.
                            </p>
                        </div>
                        {successMessage && (
                            <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm p-3 rounded-md">
                                {successMessage}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (fieldErrors.email) {
                                        setFieldErrors(prev => ({ ...prev, email: undefined }))
                                    }
                                }}
                                aria-invalid={!!fieldErrors.email}
                                className={fieldErrors.email ? "border-destructive" : ""}
                            />
                            {fieldErrors.email && (
                                <p className="text-[0.8rem] font-medium text-destructive">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>
                        <Button type="submit" className="w-full hover:bg-primary/90" disabled={loading}>
                            {loading ? "Enviando..." : "Enviar token"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4" noValidate>
                        <div className="text-center mb-2">
                            <p className="text-sm text-muted-foreground">
                                Digite o token enviado para seu email e defina sua nova senha.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="token">Token de recuperação</Label>
                            <Input
                                id="token"
                                type="text"
                                placeholder="Cole o token do email aqui"
                                value={token}
                                onChange={(e) => {
                                    setToken(e.target.value)
                                    if (fieldErrors.token) {
                                        setFieldErrors(prev => ({ ...prev, token: undefined }))
                                    }
                                }}
                                aria-invalid={!!fieldErrors.token}
                                className={fieldErrors.token ? "border-destructive" : ""}
                            />
                            {fieldErrors.token && (
                                <p className="text-[0.8rem] font-medium text-destructive">
                                    {fieldErrors.token}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="relative">
                                <Input
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
                                    aria-invalid={!!fieldErrors.password}
                                    className={fieldErrors.password ? "border-destructive pr-10" : "pr-10"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" x2="23" y1="1" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-[0.8rem] font-medium text-destructive">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <div className="relative">
                                <Input
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
                                    aria-invalid={!!fieldErrors.confirmPassword}
                                    className={fieldErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" x2="23" y1="1" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-[0.8rem] font-medium text-destructive">
                                    {fieldErrors.confirmPassword}
                                </p>
                            )}
                        </div>
                        <Button type="submit" className="w-full hover:bg-primary/90" disabled={loading}>
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
                    </form>
                )}

                {step === "email" && (
                    <p className="text-center text-sm text-muted-foreground">
                        Lembrou a senha?{" "}
                        <Link href="/login" className="text-[oklch(0.45_0.14_166)] font-medium underline-offset-4 hover:underline">
                            Fazer login
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
}