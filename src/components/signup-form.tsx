"use client"

import {
    Field,
    FieldControl,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { CustomForm, FormInput } from "@/components/ui/form"
import { GoogleIcon } from "@/components/icons/google-icon"
import { Button } from "@/components/ui/button"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import { CheckIcon, EyeIcon, EyeSlashIcon, MinusIcon } from "@heroicons/react/16/solid"

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
        hasMinLength: password.length >= MIN_PASSWORD_LENGTH,
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
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextPath = useMemo(
        () => getSafeInternalNextPath(searchParams.get("next")),
        [searchParams]
    )
    const loginHref = useMemo(
        () =>
            nextPath
                ? `/login?next=${encodeURIComponent(nextPath)}`
                : "/login",
        [nextPath]
    )
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
        } else if (password.length < MIN_PASSWORD_LENGTH) {
            errors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
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

        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const emailRedirectTo = nextPath ? `${origin}${nextPath}` : `${origin}/dashboard`

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone,
                },
                emailRedirectTo,
            },
        })

        if (error) {
            setError(formatAuthErrorMessagePt(error.message))
            setLoading(false)
        } else if (data.session && nextPath) {
            setLoading(false)
            router.push(nextPath)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        const path = nextPath ?? "/dashboard"
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}${path}`,
            },
        })
        if (error) {
            setError(formatAuthErrorMessagePt(error.message))
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
                        {nextPath ? (
                            <p className="text-xs text-muted-foreground text-pretty">
                                Depois de confirmar o e-mail, você será encaminhado para concluir o convite. Se isso não
                                acontecer, use &quot;Ir para login&quot; abaixo e entre com o mesmo e-mail — você voltará ao
                                convite automaticamente.
                            </p>
                        ) : null}
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={loginHref}>Ir para login</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-6 p-6">
                <CustomForm onSubmit={handleSignup} className="flex flex-col gap-4" noValidate>
                    {error && (
                        <Alert tone="destructive" variant="plain">
                            <AlertTitle>{error}</AlertTitle>
                        </Alert>
                    )}
                    <FormInput
                        label="Nome completo"
                        type="text"
                        placeholder="João Silva"
                        value={fullName}
                        onChange={(e) => {
                            setFullName(e.target.value)
                            if (fieldErrors.fullName) {
                                setFieldErrors(prev => ({ ...prev, fullName: undefined }))
                            }
                        }}
                        error={fieldErrors.fullName}
                    />
                    <FormInput
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
                    <FormInput
                        label="Telefone celular"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={handlePhoneChange}
                        maxLength={15}
                        error={fieldErrors.phone}
                    />
                    <Field>
                        <FieldLabel>Senha</FieldLabel>
                        <InputGroup>
                            <FieldControl>
    <InputGroupInput
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Digite sua senha"
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

                        {/* Password Requirements Visual Indicator */}
                        {password.length > 0 && (
                            <div className="space-y-1 mt-2">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Requisitos da senha:
                                </p>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasMinLength ? "text-success" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasMinLength ? (
                                            <CheckIcon className="size-3 shrink-0" />
                                        ) : (
                                            <MinusIcon className="size-3 shrink-0" />
                                        )}
                                        8+ caracteres
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasLowercase ? "text-success" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasLowercase ? (
                                            <CheckIcon className="size-3 shrink-0" />
                                        ) : (
                                            <MinusIcon className="size-3 shrink-0" />
                                        )}
                                        minúscula
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasUppercase ? "text-success" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasUppercase ? (
                                            <CheckIcon className="size-3 shrink-0" />
                                        ) : (
                                            <MinusIcon className="size-3 shrink-0" />
                                        )}
                                        maiúscula
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasDigit ? "text-success" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasDigit ? (
                                            <CheckIcon className="size-3 shrink-0" />
                                        ) : (
                                            <MinusIcon className="size-3 shrink-0" />
                                        )}
                                        número
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordRequirements.hasSymbol ? "text-success" : "text-muted-foreground"}`}>
                                        {passwordRequirements.hasSymbol ? (
                                            <CheckIcon className="size-3 shrink-0" />
                                        ) : (
                                            <MinusIcon className="size-3 shrink-0" />
                                        )}
                                        símbolo
                                    </div>
                                    <div className={`flex items-center gap-1 ${passwordIsValid ? "text-success" : "text-muted-foreground"}`}>
                                        {passwordIsValid ? (
                                            <CheckIcon className="size-3 shrink-0" />
                                        ) : (
                                            <MinusIcon className="size-3 shrink-0" />
                                        )}
                                        senha forte
                                    </div>
                                </div>
                            </div>
                        )}
                    </Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Criando conta..." : "Criar conta"}
                    </Button>
                </CustomForm>

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
                    <GoogleIcon />
                    Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{" "}
                    <Link
                        href={loginHref}
                        className="text-primary-accent font-medium underline-offset-4 hover:underline"
                    >
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}