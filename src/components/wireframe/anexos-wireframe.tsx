"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import {
    apagarAnexo,
    descricaoDoAnexo as descricao,
    enviarAnexo,
    listarAnexos,
    podeApagarAnexo,
    type UrlsDoAnexo,
    urlsDoAnexo,
    type VinculoAnexo,
} from "@/lib/anexos"
import { supabase, type Attachment } from "@/lib/supabase"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/**
 * Nota, recibo, boleto ou fatura: privados, abertos por URL assinada (Bloco 2).
 * `somenteLeitura` só lista e abre (o boleto da parcela já paga), e some sem anexo.
 */
export function AnexosWireframe({
    workspaceId,
    vinculo,
    titulo = "Anexos",
    somenteLeitura = false,
    listar,
}: {
    workspaceId: string
    vinculo: VinculoAnexo
    titulo?: string
    somenteLeitura?: boolean
    /** Troca a busca do `vinculo` (o lançamento pago também lista o boleto da conta). */
    listar?: () => Promise<Attachment[]>
}) {
    const lista = useQuery({
        queryKey: ["attachments", workspaceId, vinculo, listar ? "custom" : null],
        queryFn: () => (listar ? listar() : listarAnexos(supabase, vinculo)),
    })
    const [pendente, setPendente] = useState<string | null>(null)
    const [erro, setErro] = useState<string | null>(null)
    const [aberto, setAberto] = useState<{ id: string; urls: UrlsDoAnexo } | null>(null)

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

    async function abrir(anexo: Attachment) {
        setErro(null)
        if (aberto?.id === anexo.id) {
            setAberto(null)
            return
        }
        const urls = await urlsDoAnexo(supabase, anexo.path)
        if (!urls) {
            setErro("Não foi possível abrir o anexo.")
            return
        }
        setAberto({ id: anexo.id, urls })
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
    if (somenteLeitura && (lista.isPending || (lista.isSuccess && anexos.length === 0))) return null

    return (
        <WireframeBox bloco={2} titulo={titulo}>
            {lista.isPending ? <p role="status">Carregando anexos…</p> : null}
            {lista.isError ? <p role="alert">Não foi possível listar os anexos.</p> : null}
            {lista.isSuccess && anexos.length === 0 ? <p>Nenhum anexo.</p> : null}
            {anexos.length > 0 ? (
                <ul className="space-y-1">
                    {anexos.map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-foreground">{descricao(a)}</span>
                            <button type="button" className={botao} onClick={() => void abrir(a)}>
                                {aberto?.id === a.id ? "Fechar" : "Abrir"}
                            </button>
                            {somenteLeitura || !podeApagarAnexo(a, vinculo) ? null : (
                                <button
                                    type="button"
                                    className={botao}
                                    disabled={pendente != null}
                                    onClick={() => void apagar(a.id, a.path)}
                                >
                                    {pendente === a.id ? "Apagando…" : "Apagar"}
                                </button>
                            )}
                            {aberto?.id === a.id ? (
                                <div className="w-full space-y-1">
                                    {a.mime === "application/pdf" ? (
                                        <iframe
                                            title={descricao(a)}
                                            src={aberto.urls.ver}
                                            className="h-96 w-full border border-muted-foreground/60"
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária
                                        <img alt={descricao(a)} src={aberto.urls.ver} className="max-h-96 max-w-full object-contain" />
                                    )}
                                    <a href={aberto.urls.ver} target="_blank" rel="noopener" className={botao}>
                                        Abrir em nova aba
                                    </a>
                                </div>
                            ) : null}
                        </li>
                    ))}
                </ul>
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
