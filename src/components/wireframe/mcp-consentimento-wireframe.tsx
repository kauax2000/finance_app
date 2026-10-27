"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { supabase } from "@/lib/supabase"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

const FALHA = "Não foi possível concluir. Tente conectar de novo pela IA."

export type Destino =
    | { tipo: "redirecionar"; url: string }
    | { tipo: "perguntar"; cliente: string; redirect: string }
    | { tipo: "erro" }

/** A resposta de `getAuthorizationDetails`: já consentido (redirect) ou a pergunta (detalhes). */
export function destinoDosDetalhes(d: unknown): Destino {
    if (typeof d !== "object" || d === null) return { tipo: "erro" }
    const o = d as Record<string, unknown>
    if (typeof o.redirect_url === "string") return { tipo: "redirecionar", url: o.redirect_url }
    const nome = (o.client as { name?: unknown } | null | undefined)?.name
    if (typeof o.authorization_id === "string" && typeof nome === "string" && typeof o.redirect_uri === "string") {
        return { tipo: "perguntar", cliente: nome, redirect: o.redirect_uri }
    }
    return { tipo: "erro" }
}

/** O consentimento de uma IA (Claude, ChatGPT) para o MCP: o Supabase Auth redireciona para cá. */
export function McpConsentimentoWireframe({ authorizationId }: { authorizationId: string | null }) {
    const { user } = useAuth()
    const [destino, setDestino] = useState<Destino | null>(null)
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState(false)

    useEffect(() => {
        if (!authorizationId) return
        let ativo = true
        void supabase.auth.oauth.getAuthorizationDetails(authorizationId).then(({ data, error }) => {
            if (!ativo) return
            const d: Destino = error ? { tipo: "erro" } : destinoDosDetalhes(data)
            if (d.tipo === "redirecionar") window.location.assign(d.url)
            setDestino(d)
        }).catch(() => {
            if (ativo) setDestino({ tipo: "erro" })
        })
        return () => {
            ativo = false
        }
    }, [authorizationId])

    async function decidir(permitir: boolean) {
        if (!authorizationId) return
        setPendente(true)
        setErro(false)
        const api = supabase.auth.oauth
        const { data, error } = permitir
            ? await api.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
            : await api.denyAuthorization(authorizationId, { skipBrowserRedirect: true })
        if (error || !data?.redirect_url) {
            setPendente(false)
            setErro(true)
            return
        }
        // Fica pendente: a página sai daqui.
        window.location.assign(data.redirect_url)
    }

    let corpo
    if (!authorizationId) corpo = <p role="alert">Link de autorização inválido.</p>
    else if (!destino) corpo = <p role="status">Carregando…</p>
    else if (destino.tipo === "erro") corpo = <p role="alert">{FALHA}</p>
    else if (destino.tipo === "redirecionar") corpo = <p role="status">Redirecionando…</p>
    else
        corpo = (
            <>
                <p className="text-sm text-foreground">
                    <strong>{destino.cliente}</strong> quer acessar sua conta do Finance App
                </p>
                {user?.email ? <p>Conta: {user.email}</p> : null}
                <p>
                    Poderá ler seus lançamentos, cartões, contas e orçamentos de todas as carteiras em que você
                    participa, e registrar lançamentos que ficam para você conferir.
                </p>
                <p className="break-all text-2xs">Destino: {destino.redirect}</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={botao} disabled={pendente} onClick={() => void decidir(true)}>
                        Permitir
                    </button>
                    <button type="button" className={botao} disabled={pendente} onClick={() => void decidir(false)}>
                        Recusar
                    </button>
                </div>
                {erro ? <p role="alert">{FALHA}</p> : null}
            </>
        )

    return (
        <WireframeBox bloco="MCP" titulo="Conectar uma IA">
            {corpo}
        </WireframeBox>
    )
}
