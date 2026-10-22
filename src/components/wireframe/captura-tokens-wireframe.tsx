"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"
import { formatDatePtBr, formatDateTimeShortPtBr } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-background px-2 py-1 font-mono text-foreground"

/** O authenticated só lê estas sete colunas: o hash nunca sai do banco, e `*` dá 42501. */
const COLUNAS = "id, user_id, workspace_id, name, created_at, last_used_at, revoked_at"

const NOME_INVALIDO = "Nome do aparelho: de 1 a 60 caracteres."

/** O erro do banco (check, not null ou o `raise` das RPCs) na frase da tela. */
export function mensagemDoErroDeToken(erro: { code?: string; message?: string }): string {
    if (erro.code === "23514" || erro.code === "23502") return NOME_INVALIDO
    if (erro.message?.includes("nao_membro")) return "Você não é membro dessa carteira."
    if (erro.message?.includes("limite_tokens")) return "Limite de 10 tokens ativos. Revogue um para criar outro."
    return "Não foi possível concluir. Tente de novo."
}

/**
 * Os tokens de captura da pessoa (Bloco 3A): o Atalho do iPhone, o Apple Pay e
 * o compartilhar lançam com eles, sem abrir o app. O token aparece uma vez só.
 */
export function CapturaTokensWireframe() {
    const { user } = useAuth()
    const { workspaces, currentWorkspaceId } = useWorkspace()
    const lista = useQuery({
        queryKey: ["capture_tokens", user?.id],
        enabled: Boolean(user),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("capture_tokens")
                .select(COLUNAS)
                .order("created_at", { ascending: false })
            if (error) throw error
            return data as CaptureToken[]
        },
    })
    const [nome, setNome] = useState("")
    const [carteira, setCarteira] = useState(currentWorkspaceId ?? "")
    const [pendente, setPendente] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    /** O texto do token recém-criado; "Já guardei" o tira do estado para sempre. */
    const [tokenNovo, setTokenNovo] = useState<string | null>(null)
    const [copiado, setCopiado] = useState<string | null>(null)

    const endereco = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/functions/v1/capture`
    const nomeDaCarteira = (id: string) => workspaces.find((w) => w.id === id)?.name ?? "Carteira"
    const carteiraEscolhida = carteira || currentWorkspaceId || ""

    async function criar() {
        const n = nome.trim()
        if (n.length < 1 || n.length > 60) {
            setErro(NOME_INVALIDO)
            return
        }
        if (!carteiraEscolhida) {
            setErro("Escolha a carteira padrão.")
            return
        }
        setPendente("criar")
        setErro(null)
        setCopiado(null)
        const { data, error } = await supabase.rpc("create_capture_token", {
            p_workspace_id: carteiraEscolhida,
            p_name: n,
        })
        setPendente(null)
        if (error) {
            setErro(mensagemDoErroDeToken(error))
            return
        }
        setTokenNovo(data)
        setNome("")
        await lista.refetch()
    }

    async function revogar(t: CaptureToken) {
        if (!window.confirm(`Revogar o token "${t.name}"? O aparelho para de lançar.`)) return
        setPendente(t.id)
        setErro(null)
        const { error } = await supabase.rpc("revoke_capture_token", { p_id: t.id })
        setPendente(null)
        if (error) {
            setErro(mensagemDoErroDeToken(error))
            return
        }
        await lista.refetch()
    }

    async function copiar(texto: string) {
        try {
            await navigator.clipboard.writeText(texto)
            setCopiado("Copiado.")
        } catch {
            // O token continua à vista e selecionável.
            setCopiado("Não foi possível copiar. Selecione o texto e copie.")
        }
    }

    const tokens = lista.data ?? []

    return (
        <WireframeBox bloco={3} titulo="Captura sem abrir o app">
            <p>
                Endereço: <code className="break-all text-foreground">{endereco}</code>
            </p>
            <p>Guia: docs/captura/atalho-iphone.md no repositório (Atalho do iPhone, Apple Pay e compartilhar).</p>

            {lista.isPending && user ? <p role="status">Carregando tokens…</p> : null}
            {lista.isError ? <p role="alert">Não foi possível listar os tokens.</p> : null}
            {lista.isSuccess && tokens.length === 0 ? <p>Nenhum token.</p> : null}
            {tokens.length > 0 ? (
                <ul className="space-y-1">
                    {tokens.map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground">{t.name}</span>
                            <span>
                                · {nomeDaCarteira(t.workspace_id)} · criado em {formatDatePtBr(t.created_at)} ·{" "}
                                {t.last_used_at ? `último uso ${formatDateTimeShortPtBr(t.last_used_at)}` : "nunca usado"}
                            </span>
                            {t.revoked_at ? (
                                <span>· revogado</span>
                            ) : (
                                <button
                                    type="button"
                                    className={botao}
                                    disabled={pendente != null}
                                    onClick={() => void revogar(t)}
                                >
                                    {pendente === t.id ? "Revogando…" : "Revogar"}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : null}

            {tokenNovo ? (
                <div className="space-y-2 border border-dashed border-muted-foreground/60 p-2">
                    <p className="font-bold text-foreground">Guarde agora: ele não aparece de novo.</p>
                    <code className="block select-all break-all text-foreground">{tokenNovo}</code>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={botao} onClick={() => void copiar(tokenNovo)}>
                            Copiar
                        </button>
                        <button
                            type="button"
                            className={botao}
                            onClick={() => {
                                setTokenNovo(null)
                                setCopiado(null)
                            }}
                        >
                            Já guardei
                        </button>
                        <span aria-live="polite">{copiado}</span>
                    </div>
                </div>
            ) : null}

            <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                    e.preventDefault()
                    void criar()
                }}
            >
                <label className="flex flex-col gap-1">
                    Nome do aparelho
                    <input
                        className={campo}
                        value={nome}
                        maxLength={60}
                        placeholder="iPhone da Ana"
                        onChange={(e) => setNome(e.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1">
                    Carteira padrão
                    <select className={campo} value={carteiraEscolhida} onChange={(e) => setCarteira(e.target.value)}>
                        {workspaces.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" className={botao} disabled={pendente != null}>
                    {pendente === "criar" ? "Criando…" : "Novo token"}
                </button>
            </form>

            {erro ? (
                <p role="alert" className="text-destructive">
                    {erro}
                </p>
            ) : null}
        </WireframeBox>
    )
}
