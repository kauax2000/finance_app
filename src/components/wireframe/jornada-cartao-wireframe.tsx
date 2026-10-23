"use client"

import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { useAuth } from "@/components/providers"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { ROUTES } from "@/config/navigation"
import { concluirJornada } from "@/lib/jornada/jornada"
import { supabase } from "@/lib/supabase"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/**
 * O convite do Painel (Bloco 4) para a jornada de `/comecar`: some quando
 * `user_settings.jornada_concluida_em` está preenchido. "Agora não" conclui.
 */
export function JornadaCartaoWireframe() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState(false)
    const chave = ["jornada", "concluida", user?.id]

    const concluida = useQuery({
        queryKey: chave,
        enabled: Boolean(user?.id),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_settings")
                .select("jornada_concluida_em")
                .eq("user_id", user?.id as string)
                .maybeSingle()
            if (error) throw error
            return data?.jornada_concluida_em != null
        },
    })

    // Sem resposta (carregando ou erro de leitura) não aparece: o convite não pode piscar.
    if (concluida.data !== false) return null

    async function agoraNao() {
        setPendente(true)
        setErro(false)
        try {
            await concluirJornada()
            await queryClient.invalidateQueries({ queryKey: chave })
        } catch {
            setErro(true)
        } finally {
            setPendente(false)
        }
    }

    return (
        <WireframeBox bloco={4} titulo="Jornada">
            <Link href={ROUTES.COMECAR} className="text-foreground underline">
                Veja o que o app faz por você
            </Link>
            <div>
                <button type="button" className={botao} disabled={pendente} onClick={() => void agoraNao()}>
                    Agora não
                </button>
            </div>
            {erro ? (
                <p role="alert" className="text-destructive">
                    Não foi possível salvar. Tente de novo.
                </p>
            ) : null}
        </WireframeBox>
    )
}
