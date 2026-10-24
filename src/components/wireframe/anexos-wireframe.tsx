"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { apagarAnexo, enviarAnexo, listarAnexos, podeApagarAnexo, urlAssinada, type VinculoAnexo } from "@/lib/anexos"
import { supabase, type Attachment } from "@/lib/supabase"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

const tamanho = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

/** O anexo não guarda nome: o tipo, o tamanho e o dia o distinguem na lista e no link. */
const descricao = (a: Pick<Attachment, "mime" | "size_bytes" | "created_at">) =>
    `${a.mime === "application/pdf" ? "PDF" : "Foto"} · ${tamanho(a.size_bytes)} · ${new Date(a.created_at).toLocaleDateString("pt-BR")}`

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
    /** A URL assinada que o popup bloqueado não abriu: vira um link para tocar. */
    const [link, setLink] = useState<{ url: string; rotulo: string } | null>(null)

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
        setLink(null)
        // A aba nasce no clique: depois do `await`, o Safari a bloquearia.
        const aba = window.open("about:blank", "_blank")
        const url = await urlAssinada(supabase, anexo.path)
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
            setLink({ url, rotulo: descricao(anexo) })
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
                                Abrir
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
                        </li>
                    ))}
                </ul>
            ) : null}
            {/* A região existe antes do link, para o leitor de tela anunciar quando ele chega. */}
            <p aria-live="polite">
                {link ? (
                    <a href={link.url} target="_blank" rel="noopener" className={botao} onClick={() => setLink(null)}>
                        Abrir anexo ({link.rotulo})
                    </a>
                ) : null}
            </p>
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
