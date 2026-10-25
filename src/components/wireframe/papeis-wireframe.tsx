"use client"

import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { rotuloDoPapel } from "@/lib/papeis/papeis"
import { supabase, type WorkspaceRole } from "@/lib/supabase"
import { formatSupabasePostgrestError } from "@/lib/supabase-errors"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-transparent px-1 text-foreground"

export type PapelDoConvite = { role: "member" | "guest"; menor: boolean; consentimento: boolean }

export const PAPEL_DO_CONVITE_INICIAL: PapelDoConvite = { role: "member", menor: false, consentimento: false }

/**
 * O papel do convite por e-mail: membro ou convidado, e o menor de idade com o
 * consentimento do responsável (LGPD, art. 14). O link não passa por aqui: ele
 * é sempre de membro.
 */
export function PapelDoConviteWireframe({
    valor,
    onChange,
    disabled,
}: {
    valor: PapelDoConvite
    onChange: (v: PapelDoConvite) => void
    disabled?: boolean
}) {
    return (
        <WireframeBox bloco={7} titulo="Papel do convite">
            <fieldset className="flex flex-wrap gap-3 text-foreground" disabled={disabled}>
                <legend className="text-muted-foreground">Entra como</legend>
                <label>
                    <input
                        type="radio"
                        name="papel-do-convite"
                        checked={valor.role === "member"}
                        onChange={() => onChange(PAPEL_DO_CONVITE_INICIAL)}
                    />{" "}
                    Membro (vê e lança tudo da casa)
                </label>
                <label>
                    <input
                        type="radio"
                        name="papel-do-convite"
                        checked={valor.role === "guest"}
                        onChange={() => onChange({ ...valor, role: "guest" })}
                    />{" "}
                    Convidado (lança e vê só o que é dele)
                </label>
            </fieldset>
            {valor.role === "guest" ? (
                <div className="space-y-1 text-foreground">
                    <label className="block">
                        <input
                            type="checkbox"
                            disabled={disabled}
                            checked={valor.menor}
                            onChange={(e) => onChange({ ...valor, menor: e.target.checked, consentimento: false })}
                        />{" "}
                        É menor de idade
                    </label>
                    {valor.menor ? (
                        <label className="block">
                            <input
                                type="checkbox"
                                disabled={disabled}
                                checked={valor.consentimento}
                                onChange={(e) => onChange({ ...valor, consentimento: e.target.checked })}
                            />{" "}
                            Sou o responsável legal e autorizo o uso do app (LGPD, art. 14).
                        </label>
                    ) : null}
                </div>
            ) : null}
            <p>O link de convite é sempre de membro.</p>
        </WireframeBox>
    )
}

/** A troca de papel numa linha de membro: só o dono a vê, e ela chama `trocar_papel`. */
export function TrocarPapelWireframe({
    workspaceId,
    userId,
    nome,
    papel,
    onTrocado,
}: {
    workspaceId: string
    userId: string
    nome: string
    papel: WorkspaceRole
    onTrocado: () => void
}) {
    const [novo, setNovo] = useState<"member" | "guest">(papel === "guest" ? "guest" : "member")
    const [salvando, setSalvando] = useState(false)
    const [msg, setMsg] = useState<{ erro: boolean; texto: string } | null>(null)

    async function trocar() {
        setSalvando(true)
        setMsg(null)
        const { error } = await supabase.rpc("trocar_papel", {
            p_workspace_id: workspaceId,
            p_user_id: userId,
            p_role: novo,
        })
        setSalvando(false)
        if (error) {
            setMsg({ erro: true, texto: formatSupabasePostgrestError(error) ?? "Não foi possível trocar o papel." })
            return
        }
        setMsg({ erro: false, texto: `${nome} agora é ${rotuloDoPapel(novo).toLowerCase()}.` })
        onTrocado()
    }

    return (
        <WireframeBox bloco={7} titulo="Trocar papel">
            <div className="flex flex-wrap items-center gap-2 text-foreground">
                <label>
                    Papel de {nome}{" "}
                    <select
                        value={novo}
                        disabled={salvando}
                        onChange={(e) => setNovo(e.target.value === "guest" ? "guest" : "member")}
                        className={campo}
                    >
                        <option value="member">{rotuloDoPapel("member")}</option>
                        <option value="guest">{rotuloDoPapel("guest")}</option>
                    </select>
                </label>
                <button type="button" className={botao} disabled={salvando || novo === papel} onClick={() => void trocar()}>
                    {salvando ? "Trocando…" : "Trocar papel"}
                </button>
            </div>
            {msg ? <p role={msg.erro ? "alert" : "status"}>{msg.texto}</p> : null}
        </WireframeBox>
    )
}
