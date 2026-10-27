"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { supabase } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-background px-2 py-1 font-mono text-foreground"

/** O endereço do MCP no projeto Supabase, com ou sem barra no fim. */
export function urlDoMcp(supabaseUrl: string): string {
    return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/mcp`
}

/** As IAs (Claude, ChatGPT) que a pessoa autorizou no MCP, e como conectar outra. */
export function IasConectadasWireframe() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const chave = ["oauth_grants", user?.id]
    const lista = useQuery({
        queryKey: chave,
        enabled: Boolean(user),
        retry: false,
        queryFn: async () => {
            const { data, error } = await supabase.auth.oauth.listGrants()
            if (error) throw error
            return data ?? []
        },
    })
    const [copiado, setCopiado] = useState(false)
    const [pendente, setPendente] = useState<string | null>(null)
    const [erro, setErro] = useState(false)

    const url = urlDoMcp(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")

    async function copiar() {
        try {
            await navigator.clipboard.writeText(url)
        } catch {
            return // A URL continua selecionável no campo.
        }
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
    }

    async function revogar(id: string, nome: string) {
        if (!window.confirm(`Desconectar ${nome}? Ela perde o acesso na hora.`)) return
        setPendente(id)
        setErro(false)
        const { error } = await supabase.auth.oauth.revokeGrant({ clientId: id })
        setPendente(null)
        if (error) {
            setErro(true)
            return
        }
        await queryClient.invalidateQueries({ queryKey: chave })
    }

    const grants = lista.data ?? []

    return (
        <WireframeBox bloco="MCP" titulo="IAs conectadas">
            <p className="text-foreground">Conectar</p>
            <div className="flex flex-wrap gap-2">
                <input
                    readOnly
                    aria-label="Endereço do MCP"
                    value={url}
                    className={`${campo} min-w-0 flex-1`}
                    onFocus={(e) => e.currentTarget.select()}
                />
                <button type="button" className={botao} onClick={() => void copiar()}>
                    {copiado ? "Copiado" : "Copiar"}
                </button>
            </div>
            <p>Claude: Configurações › Conectores › Adicionar conector personalizado, cole a URL.</p>
            <p>ChatGPT: Configurações › Conectores (modo desenvolvedor ligado), cole a URL.</p>
            <p className="break-all">
                Claude Code: <code>claude mcp add --transport http finance-app {url}</code>
            </p>

            <p className="text-foreground">Conectadas</p>
            {lista.isPending && user ? <p role="status">Carregando conexões…</p> : null}
            {lista.isError ? <p role="alert">Não foi possível carregar as conexões.</p> : null}
            {lista.isSuccess && grants.length === 0 ? <p>Nenhuma IA conectada.</p> : null}
            {grants.length > 0 ? (
                <ul className="space-y-1">
                    {grants.map((g) => (
                        <li key={g.client.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground">{g.client.name}</span>
                            <span>· desde {formatDatePtBr(g.granted_at)}</span>
                            <button
                                type="button"
                                className={botao}
                                disabled={pendente === g.client.id}
                                onClick={() => void revogar(g.client.id, g.client.name)}
                            >
                                Revogar
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            {erro ? <p role="alert">Não foi possível desconectar. Tente de novo.</p> : null}
        </WireframeBox>
    )
}
