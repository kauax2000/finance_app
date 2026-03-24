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
    password?: string
}

export function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const validateFields = (): boolean => {
        const errors: FieldErrors = {}

        if (!email.trim()) {
            errors.email = "Email é obrigatório"
        } else if (!emailRegex.test(email)) {
            errors.email = "Digite um email válido"
        }

        if (!password) {
            errors.password = "Senha é obrigatória"
        } else if (password.length < 8) {
            errors.password = "A senha deve ter pelo menos 8 caracteres"
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/.test(password)) {
            errors.password = "Use letras maiúsculas, minúsculas, números e símbolos"
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setFieldErrors({})

        if (!validateFields()) {
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push("/dashboard")
        }
    }

    const handleGoogleLogin = async () => {
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

    return (
        <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-6 p-6">
                <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
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
                    </div>
                    <Button type="submit" className="w-full hover:bg-primary/90" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
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
                    onClick={handleGoogleLogin}
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
                    Não tem uma conta?{" "}
                    <Link href="/register" className="text-[oklch(0.45_0.14_166)] font-medium underline-offset-4 hover:underline">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}