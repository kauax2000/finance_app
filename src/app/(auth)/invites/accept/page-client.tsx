"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/16/solid"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { invokeEdgeJson } from "@/lib/edge-invoke"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Muted } from "@/components/ui/typography"
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
    /** Convite por e-mail aberto pelo menu de carteiras: o id basta, quem decide é o e-mail. */
    const inviteId = useMemo(() => params.get("invite")?.trim() ?? "", [params])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [authGate, setAuthGate] = useState(false)
    const [acceptedWorkspaceName, setAcceptedWorkspaceName] = useState<string | null>(null)

    const refreshWorkspacesRef = useRef(refreshWorkspaces)
    const setCurrentWorkspaceIdRef = useRef(setCurrentWorkspaceId)
    refreshWorkspacesRef.current = refreshWorkspaces
    setCurrentWorkspaceIdRef.current = setCurrentWorkspaceId

    const returnPath = token
        ? `/invites/accept?token=${encodeURIComponent(token)}`
        : `/invites/accept?invite=${encodeURIComponent(inviteId)}`
    const loginHref = `${ROUTES.LOGIN}?next=${encodeURIComponent(returnPath)}`
    const signupHref = `${ROUTES.REGISTER}?next=${encodeURIComponent(returnPath)}`

    useEffect(() => {
        const run = async () => {
            if (authLoading) return

            if (!token && !inviteId) {
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
                    body: token ? { token } : { invite_id: inviteId },
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
                if (/invite not found/i.test(msg)) {
                    msg = "Convite não encontrado. Peça um novo a quem convidou você."
                }
                setError(msg)
            } finally {
                setLoading(false)
            }
        }

        void run()
    }, [token, inviteId, user, authLoading])

    const showSuccess = !loading && !error && !authGate && Boolean(user) && Boolean(token || inviteId)

    const busy = authLoading || (loading && !authGate)

    if (busy) {
        return (
            <AuthShell title="Aceitar convite">
                <div role="status" aria-live="polite" aria-busy="true">
                    <span className="sr-only">Processando o convite…</span>
                    <AuthFormSkeleton fields={1} />
                </div>
            </AuthShell>
        )
    }

    // Quem ainda não entrou. A rota vive em `(auth)` justamente para esta tela
    // não aparecer cercada pela lateral e pelo topo de um app em que a pessoa
    // ainda não está (lacuna 5 de `docs/JORNADAS.md`).
    if (authGate) {
        return (
            <AuthShell
                title="Você foi convidado"
                description="Entre ou crie uma conta para participar da carteira. Use o mesmo e-mail do convite, se ele foi enviado para um endereço específico."
            >
                <div className="flex flex-col gap-(--space-block)">
                    {/* Era uma caixa montada à mão — `rounded-lg border
                        border-primary/20 bg-primary/5` com um ícone ao lado.
                        É um `Alert`, e o sistema já tem um. */}
                    <Alert tone="info" variant="plain">
                        <AlertTitle>
                            Depois de entrar, você volta para cá sozinho.
                        </AlertTitle>
                        <AlertDescription>
                            Guarde este link até ver a confirmação. Se fechar a
                            aba, use o mesmo link do e-mail.
                        </AlertDescription>
                    </Alert>
                    {/* Par de ações: a que a tela veio propor preenche, a que a
                        acompanha não. `secondary` ao lado de `primary` são dois
                        sólidos disputando. */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild size="xl" className="sm:flex-1">
                            <Link href={loginHref}>Entrar</Link>
                        </Button>
                        <Button
                            asChild
                            variant="tertiary"
                            size="xl"
                            className="sm:flex-1"
                        >
                            <Link href={signupHref}>Criar conta</Link>
                        </Button>
                    </div>
                </div>
            </AuthShell>
        )
    }

    if (error) {
        return (
            <AuthShell title="Convite indisponível">
                <div className="flex flex-col gap-(--space-block)">
                    <Alert tone="destructive" variant="plain">
                        <ExclamationCircleIcon />
                        <AlertTitle>{error}</AlertTitle>
                    </Alert>
                    <Button asChild variant="tertiary" size="xl" className="w-full">
                        <Link href={loginHref}>Tentar depois de entrar</Link>
                    </Button>
                </div>
            </AuthShell>
        )
    }

    if (showSuccess) {
        return (
            <AuthShell
                title="Convite aceito"
                description={
                    acceptedWorkspaceName ? (
                        <>
                            Você agora faz parte da carteira{" "}
                            <strong className="font-medium text-foreground">
                                {acceptedWorkspaceName}
                            </strong>
                            .
                        </>
                    ) : (
                        "A carteira compartilhada já está disponível na sua conta."
                    )
                }
            >
                <div className="flex flex-col gap-(--space-block)">
                    <Alert tone="success" variant="plain">
                        <CheckCircleIcon />
                        <AlertTitle>
                            Use o seletor de carteiras no topo da lateral para
                            alternar entre Pessoal e esta carteira.
                        </AlertTitle>
                    </Alert>
                    <Button asChild size="xl" className="w-full">
                        <Link href={ROUTES.DASHBOARD}>Ir para o Painel</Link>
                    </Button>
                </div>
            </AuthShell>
        )
    }

    return (
        <AuthShell title="Aceitar convite">
            <Muted>Nada para fazer aqui. Confira o link do convite.</Muted>
        </AuthShell>
    )
}
