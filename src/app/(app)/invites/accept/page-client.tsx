"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/navigation"
import { supabase } from "@/lib/supabase"

type AcceptResponse = {
    ok?: boolean
    workspace_id?: string
}

export default function AcceptInvitePageClient() {
    const { user, loading: authLoading } = useAuth()
    const { refreshWorkspaces, setCurrentWorkspaceId } = useWorkspace()
    const params = useSearchParams()
    const token = useMemo(() => params.get("token")?.trim() ?? "", [params])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [authGate, setAuthGate] = useState(false)
    const [acceptedWorkspaceName, setAcceptedWorkspaceName] = useState<string | null>(null)

    const refreshWorkspacesRef = useRef(refreshWorkspaces)
    const setCurrentWorkspaceIdRef = useRef(setCurrentWorkspaceId)
    refreshWorkspacesRef.current = refreshWorkspaces
    setCurrentWorkspaceIdRef.current = setCurrentWorkspaceId

    const loginHref = `${ROUTES.LOGIN}?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`
    const signupHref = `/register?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`

    useEffect(() => {
        const run = async () => {
            if (authLoading) return

            if (!token) {
                setAuthGate(false)
                setError("Convite inválido (token ausente).")
                setLoading(false)
                return
            }

            if (!user) {
                setAuthGate(true)
                setError(null)
                setLoading(false)
                return
            }

            setAuthGate(false)
            setLoading(true)
            setError(null)

            try {
                const res = await invokeEdgeJson<AcceptResponse>("workspace-invites-accept", {
                    body: { token },
                })

                setError(null)
                await refreshWorkspacesRef.current()
                if (res.workspace_id) {
                    await setCurrentWorkspaceIdRef.current(res.workspace_id)
                    const { data: ws } = await supabase
                        .from("workspaces")
                        .select("name")
                        .eq("id", res.workspace_id)
                        .maybeSingle()
                    if (ws?.name && typeof ws.name === "string") {
                        setAcceptedWorkspaceName(ws.name)
                    }
                }
            } catch (e) {
                let msg = e instanceof Error ? e.message : "Não foi possível aceitar o convite."
                if (/not pending|invite is not pending/i.test(msg)) {
                    msg = "Este convite já foi utilizado ou não está mais pendente."
                }
                setError(msg)
            } finally {
                setLoading(false)
            }
        }

        void run()
    }, [token, user, authLoading])

    const showSuccess = !loading && !error && !authGate && Boolean(user) && Boolean(token)

    return (
        <div className="mx-auto w-full max-w-xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Aceitar convite</CardTitle>
                    <CardDescription>
                        Entre ou crie uma conta para participar da carteira. Use o mesmo e-mail do convite, se o convite
                        foi enviado para um endereço específico.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {authLoading || (loading && !authGate) ? (
                        <p className="text-sm text-muted-foreground">Processando convite...</p>
                    ) : authGate ? (
                        <>
                            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                                <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <div className="space-y-2">
                                    <p>
                                        Para aceitar, entre na sua conta ou cadastre-se. Depois você voltará automaticamente
                                        a esta página para concluir.
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Guarde este link até ver a mensagem de sucesso. Se fechar a aba, use o mesmo link
                                        do e-mail ou do convite.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button asChild className="sm:flex-1">
                                    <Link href={loginHref}>Entrar</Link>
                                </Button>
                                <Button asChild variant="secondary" className="sm:flex-1">
                                    <Link href={signupHref}>Criar conta</Link>
                                </Button>
                            </div>
                        </>
                    ) : error ? (
                        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
                            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : showSuccess ? (
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
                                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-medium">Convite aceito com sucesso.</p>
                                    {acceptedWorkspaceName ? (
                                        <p>
                                            Você agora faz parte da carteira <strong>{acceptedWorkspaceName}</strong>.
                                        </p>
                                    ) : (
                                        <p>A carteira compartilhada já está disponível na sua conta.</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Use o seletor de carteiras no menu lateral (topo) para alternar entre{" "}
                                        <strong>Pessoal</strong> e esta carteira.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {!authLoading && !loading && error ? (
                        <Button asChild variant="outline">
                            <Link href={loginHref}>Tentar após entrar</Link>
                        </Button>
                    ) : null}

                    {showSuccess ? (
                        <Button asChild>
                            <Link href={ROUTES.DASHBOARD}>Ir para o Dashboard</Link>
                        </Button>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
