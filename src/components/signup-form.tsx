"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone validation regex (Brazilian format)
const phoneRegex = /^\(?\d{2}\)?\s?\d{5}-?\d{4}$/

// Password validation regex - requires lowercase, uppercase, digit, and symbol
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/

interface PasswordRequirements {
    hasMinLength: boolean
    hasLowercase: boolean
    hasUppercase: boolean
    hasDigit: boolean
    hasSymbol: boolean
}

// Helper function to check all password requirements
function checkPasswordRequirements(password: string): PasswordRequirements {
    return {
        hasMinLength: password.length >= 8,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasDigit: /\d/.test(password),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
}

// Helper to check if all requirements are met
function isPasswordValid(requirements: PasswordRequirements): boolean {
    return Object.values(requirements).every(Boolean)
}

// Format phone number as user types
function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, "")

    if (digits.length <= 2) {
        return `(${digits}`
    }
    if (digits.length <= 7) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    }
    if (digits.length <= 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    // Limit to 11 digits
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

interface FieldErrors {
    fullName?: string
    email?: string
    phone?: string
    password?: string
}

export function SignupForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    // Password requirements check
    const passwordRequirements = checkPasswordRequirements(password)
    const passwordIsValid = isPasswordValid(passwordRequirements)

    // Phone handler with formatting
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setPhone(formatted)
        if (fieldErrors.phone) {
            setFieldErrors(prev => ({ ...prev, phone: undefined }))
        }
    }

    const validateFields = (): boolean => {
        const errors: FieldErrors = {}

        if (!fullName.trim()) {
            errors.fullName = "Nome completo é obrigatório"
        }

        if (!email.trim()) {
            errors.email = "Email é obrigatório"
        } else if (!emailRegex.test(email)) {
            errors.email = "Digite um email válido"
        }

        if (!phone.trim()) {
            errors.phone = "Telefone celular é obrigatório"
        } else if (!phoneRegex.test(phone)) {
            errors.phone = "Digite um telefone válido"
        }

        if (!password) {
            errors.password = "Senha é obrigatória"
        } else if (password.length < 8) {
            errors.password = "A senha deve ter pelo menos 8 caracteres"
        } else if (!passwordRegex.test(password)) {
            errors.password = "Use letras maiúsculas, minúsculas, números e símbolos"
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setFieldErrors({})

        if (!validateFields()) {
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone,
                },
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
        }
    }

    const handleGoogleSignup = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        })
        if (error) {
            setError(error.message)
        }
    }

    if (success) {
        return (
            <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex flex-col gap-2 text-center">
                        <h3 className="text-2xl font-bold">Confirme seu email</h3>
                        <p className="text-sm text-muted-foreground">
                            Enviamos um link de confirmação para <strong>{email}</strong>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Clique no link para ativar sua conta.
                        </p>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Voltar para login
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-6 p-6">
                <form onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="João Silva"
                            value={fullName}
                            onChange={(e) => {
                                setFullName(e.target.value)
                                if (fieldErrors.fullName) {
                                    setFieldErrors(prev => ({ ...prev, fullName: undefined }))
                                }
                            }}
                            aria-invalid={!!fieldErrors.fullName}
                            className={fieldErrors.fullName ? "border-destructive" : ""}
                        />
                        {fieldErrors.fullName && (
                            <p className="text-[0.8rem] font-medium text-destructive">
                                {fieldErrors.fullName}
                            </p>
                        )}
                    </div>
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
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="phone">Telefone celular</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={phone}
                            onChange={handlePhoneChange}
                            aria-invalid={!!fieldErrors.phone}
                            className={fieldErrors.phone ? "border-destructive" : ""}
                            maxLength={15}
                        />
                        {fieldErrors.phone && (
                            <p className="text-[0.8rem] font-medium text-destructive">
                                {fieldErrors.phone}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Digite sua senha"
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

                        {/* Password Requirements Visual Indicator */}
                        {password.length > 0 && (
                            <div className="space-y-1 mt-2">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Requisitos da senha:
                                </p>
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
                    <Button type="submit" className="w-full hover:bg-primary/90" disabled={loading}>
                        {loading ? "Criando conta..." : "Criar conta"}
                    </Button>
                </form>

                <div className="relative flex items-center gap-3 text-sm">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-muted-foreground">ou continue com</span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignup}
                    type="button"
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="text-[oklch(0.45_0.14_166)] font-medium underline-offset-4 hover:underline">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}