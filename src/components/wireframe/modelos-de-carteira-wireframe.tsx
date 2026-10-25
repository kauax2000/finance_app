"use client"

import { useState } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { AINDA_NAO_DISPONIVEL, criarCarteiraDeModelo } from "@/lib/projetos/dados"
import { MODELOS_DE_CARTEIRA, REGRA_DA_ESCOLHA, type ModeloDeCarteira } from "@/lib/projetos/modelos"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"

/**
 * Os seis modelos ao criar uma carteira (Bloco 7C, Decisão 3), com a regra da
 * escolha. "Sem modelo" é o caminho de hoje. Controlado: quem cria é o
 * formulário de nova carteira, que tem o submit.
 */
export function ModelosDeCarteiraWireframe({
    modelo,
    onModeloChange,
}: {
    modelo: ModeloDeCarteira | null
    onModeloChange: (m: ModeloDeCarteira | null) => void
}) {
    return (
        <WireframeBox bloco={7} titulo="Modelos de carteira">
            <p className="text-foreground">{REGRA_DA_ESCOLHA}</p>
            <fieldset className="space-y-1">
                <legend>Modelo</legend>
                <label className="flex gap-2">
                    <input type="radio" name="modelo-de-carteira" checked={modelo === null} onChange={() => onModeloChange(null)} />
                    <span>Sem modelo (eu escolho tudo)</span>
                </label>
                {MODELOS_DE_CARTEIRA.map((m) => (
                    <label key={m.id} className="flex gap-2">
                        <input type="radio" name="modelo-de-carteira" checked={modelo === m.id} onChange={() => onModeloChange(m.id)} />
                        <span>
                            <span className="text-foreground">{m.rotulo}</span> · {m.descricao}
                            {m.purpose === "project" ? " · projeto" : ""}
                        </span>
                    </label>
                ))}
            </fieldset>
            {modelo === "pessoal" ? <p>A Pessoal não cria nada: abre a carteira pessoal que você já tem.</p> : null}
            {modelo && modelo !== "pessoal" ? <p>Com um modelo, as categorias, o ícone e a cor são os dele.</p> : null}
        </WireframeBox>
    )
}

/**
 * "O primeiro uso cria a Casa" (Decisão 3): na jornada `/comecar`, quem ainda
 * não é dono de nenhuma carteira compartilhada cria a Casa num toque.
 */
export function CriarACasaWireframe() {
    const { workspaces, workspaceRoleById, refreshWorkspaces, setCurrentWorkspaceId, loading } = useWorkspace()
    const [pendente, setPendente] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const donoDeCompartilhada = workspaces.some((w) => w.type === "shared" && workspaceRoleById[w.id] === "owner")

    if (loading || (donoDeCompartilhada && !aviso)) return null

    async function criar() {
        setPendente(true)
        setAviso(null)
        try {
            const r = await criarCarteiraDeModelo("casa", "Casa")
            if (!r.disponivel) {
                setAviso(AINDA_NAO_DISPONIVEL)
                return
            }
            await refreshWorkspaces()
            await setCurrentWorkspaceId(r.dados)
            setAviso("A Casa foi criada, e você já está nela.")
        } catch (e) {
            setAviso(e instanceof Error ? e.message : "Não foi possível criar a Casa.")
        } finally {
            setPendente(false)
        }
    }

    return (
        <WireframeBox bloco={7} titulo="Criar a Casa">
            <p>A Casa é a carteira do dia a dia, para dividir com quem mora com você.</p>
            {donoDeCompartilhada ? null : (
                <button type="button" className={botao} disabled={pendente} onClick={() => void criar()}>
                    {pendente ? "Criando…" : "Criar a Casa"}
                </button>
            )}
            {aviso ? <p role="status">{aviso}</p> : null}
        </WireframeBox>
    )
}
