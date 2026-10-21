"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { apagarAnexo, enviarAnexo, listarAnexos, urlAssinada, type VinculoAnexo } from "@/lib/anexos"
import { supabase } from "@/lib/supabase"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

const tamanho = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Nota, recibo, boleto ou fatura: privados, abertos por URL assinada (Bloco 2).
 * `somenteLeitura` só lista e abre (o boleto da parcela já paga), e some sem anexo.
 */
export function AnexosWireframe({
    workspaceId,
    vinculo,
    titulo = "Anexos",
    somenteLeitura = false,
}: {
    workspaceId: string
    vinculo: VinculoAnexo
    titulo?: string
    somenteLeitura?: boolean
}) {
    const lista = useQuery({
        queryKey: ["attachments", workspaceId, vinculo],
        queryFn: () => listarAnexos(supabase, vinculo),
    })
    const [pendente, setPendente] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    /** A URL assinada que o popup bloqueado não abriu: vira um link para tocar. */
    const [link, setLink] = useState<string | null>(null)

    async function enviar(arquivo: File | undefined) {
        if (!arquivo) return
        setPendente("enviar")
        setErro(null)
        const r = await enviarAnexo(supabase, { workspaceId }, arquivo, vinculo)
        setPendente(null)
        if (!r.ok) {
            setErro(r.erro)
            return
        }
        await lista.refetch()
    }

    async function abrir(path: string) {
        setErro(null)
        setLink(null)
        // A aba nasce no clique: depois do `await`, o Safari a bloquearia.
        const aba = window.open("about:blank", "_blank")
        const url = await urlAssinada(supabase, path)
        if (!url) {
            aba?.close()
            setErro("Não foi possível abrir o anexo.")
            return
        }
        if (aba) {
            aba.opener = null
            aba.location.href = url
        } else {
            // Popup bloqueado: abrir na mesma janela tiraria a pessoa do app.
            setLink(url)
        }
    }

    async function apagar(id: string, path: string) {
        if (!window.confirm("Apagar este anexo?")) return
        setPendente(id)
        setErro(null)
        const r = await apagarAnexo(supabase, { id, path })
        setPendente(null)
        if (!r.ok) {
            setErro(r.erro)
            return
        }
        await lista.refetch()
    }

    const anexos = lista.data ?? []
    if (somenteLeitura && lista.isSuccess && anexos.length === 0) return null

    return (
        <WireframeBox bloco={2} titulo={titulo}>
            {lista.isPending ? <p role="status">Carregando anexos…</p> : null}
            {lista.isError ? <p role="alert">Não foi possível listar os anexos.</p> : null}
            {lista.isSuccess && anexos.length === 0 ? <p>Nenhum anexo.</p> : null}
            {anexos.length > 0 ? (
                <ul className="space-y-1">
                    {anexos.map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground">
                                {a.mime === "application/pdf" ? "PDF" : "Foto"} · {tamanho(a.size_bytes)} ·{" "}
                                {new Date(a.created_at).toLocaleDateString("pt-BR")}
                            </span>
                            <button type="button" className={botao} onClick={() => void abrir(a.path)}>
                                Abrir
                            </button>
                            {somenteLeitura ? null : (
                                <button
                                    type="button"
                                    className={botao}
                                    disabled={pendente != null}
                                    onClick={() => void apagar(a.id, a.path)}
                                >
                                    {pendente === a.id ? "Apagando…" : "Apagar"}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : null}
            {link ? (
                <a href={link} target="_blank" rel="noopener" className={botao} onClick={() => setLink(null)}>
                    Abrir anexo
                </a>
            ) : null}
            {somenteLeitura ? null : (
                <label className="flex flex-wrap items-center gap-2">
                    Anexar foto ou PDF (até 10 MB)
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={pendente != null}
                        onChange={(e) => {
                            const arquivo = e.target.files?.[0]
                            e.target.value = ""
                            void enviar(arquivo)
                        }}
                    />
                </label>
            )}
            {pendente === "enviar" ? <p role="status">Enviando…</p> : null}
            {erro ? (
                <p role="alert" className="text-destructive">
                    {erro}
                </p>
            ) : null}
        </WireframeBox>
    )
}
