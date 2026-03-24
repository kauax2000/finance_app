"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ResetPasswordFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [invalidToken, setInvalidToken] = useState(false)
    const [checkingToken, setCheckingToken] = useState(true)

    useEffect(() => {
        // Check for tokens in URL - support both hash and query params
        const checkToken = () => {
            // Try hash first (Supabase standard)
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get("access_token")
            const refreshToken = hashParams.get("refresh_token")

            // Also check query params
            const queryToken = searchParams.get("access_token")
            const queryRefreshToken = searchParams.get("refresh_token")

            // Check for error in hash (like otp_expired)
            const hashError = hashParams.get("error")
            const hashErrorCode = hashParams.get("error_code")

            if (hashError || hashErrorCode) {
                setError("Link expirado ou inválido. Por favor, solicite um novo link de recuperação.")
                setInvalidToken(true)
                setCheckingToken(false)
                return
            }

            if (!accessToken && !queryToken && !refreshToken && !queryRefreshToken) {
                // Also check if there's a token in the query string differently formatted
                const urlParams = new URLSearchParams(window.location.search)
                const newAccessToken = urlParams.get("access_token")
                const newRefreshToken = urlParams.get("refresh_token")

                if (!newAccessToken) {
                    setInvalidToken(true)
                }
            }
            setCheckingToken(false)
        }

        // Small delay to ensure the URL is fully loaded
        setTimeout(checkToken, 100)
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError("As senhas não coincidem")
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres")
            setLoading(false)
            return
        }

        try {
            // Get tokens from either hash or query params
            let accessToken: string | null = null
            let refreshToken: string | null = null

            // Try hash first
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            accessToken = hashParams.get("access_token")
            refreshToken = hashParams.get("refresh_token")

            // If not in hash, try query params
            if (!accessToken) {
                const queryParams = new URLSearchParams(window.location.search)
                accessToken = queryParams.get("access_token")
                refreshToken = queryParams.get("refresh_token")
            }

            if (!accessToken) {
                setError("Token não encontrado. Por favor, solicite um novo link de recuperação.")
                setLoading(false)
                return
            }

            // Set session with the token
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
            })

            if (sessionError) {
                setError(sessionError.message)
                setLoading(false)
                return
            }

            // Update password
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

    if (checkingToken) {
        return (
            <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col gap-6 p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (invalidToken) {
        return (
            <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col gap-6 p-6">
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                        <p className="font-medium">Link expirado ou inválido</p>
                        <p className="text-muted-foreground mt-1">
                            O link de recuperação expirou. Por favor, solicite um novo link.
                        </p>
                    </div>
                    <Button asChild className="w-full">
                        <Link href="/forgot-password">Solicitar novo link</Link>
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
                            Voltar ao login
                        </Link>
                    </p>
                </div>
            </div>
        )
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
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full hover:bg-primary/90" disabled={loading}>
                            {loading ? "Atualizando..." : "Atualizar Senha"}
                        </Button>
                    </form>
                )}

                <p className="text-center text-sm text-muted-foreground">
                    <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
                        Voltar ao login
                    </Link>
                </p>
            </div>
        </div>
    )
}

export function ResetPasswordForm() {
    return (
        <Suspense fallback={
            <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col gap-6 p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                        <div className="h-10 bg-muted rounded"></div>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordFormContent />
        </Suspense>
    )
}