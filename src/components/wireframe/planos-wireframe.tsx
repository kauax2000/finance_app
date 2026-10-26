"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"

import { useWorkspace } from "@/components/workspace-provider"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { ROUTES } from "@/config/navigation"
import {
    alterarAssinatura,
    assinar,
    buscarMeuPlano,
    doze,
    fundadoresAbertos,
    precoDoDia,
    resumoDoPlano,
    usePlano,
    type MeuPlano,
} from "@/lib/planos/plano"

const botao = "border border-dashed border-muted-foreground/60 px-3 py-1 text-foreground disabled:opacity-60"
const campo = "block w-full max-w-xs border border-muted-foreground/60 bg-transparent px-1 text-foreground"

const ROTULO = {
    cancelar: "Cancelar a renovação",
    desfazer: "Desfazer o cancelamento",
    reembolsar: "Pedir reembolso (7 dias)",
} as const

const AVISO_REEMBOLSO = "O valor volta para o cartão em até 10 dias úteis e a conta volta ao estado de antes da compra."

const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : "Não foi possível concluir. Tente de novo.")

/**
 * O plano da pessoa (Blocos 4 e 8): o que ela tem hoje, o preço do dia e as
 * ações — assinar ou trocar o cartão (o checkout do Asaas), cancelar, desfazer,
 * reembolsar e continuar um pagamento aberto. Na volta do pagamento (`?pago=1`)
 * a tela consulta o plano até ele sair de `pending`.
 */
export function PlanosWireframe() {
    const { plano: carregado, carregando } = usePlano()
    const { papel } = useWorkspace()
    const [atual, setAtual] = useState<MeuPlano | null>(null)
    const [ocupado, setOcupado] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [aviso, setAviso] = useState<string | null>(null)
    const [confirmando, setConfirmando] = useState(false)
    const [nome, setNome] = useState("")
    const [cpf, setCpf] = useState("")

    const plano = atual ?? carregado
    const agora = new Date()
    const resumo = plano ? resumoDoPlano(plano, agora, papel) : null
    const fundador = fundadoresAbertos(agora)
    const acoes = resumo?.acoes ?? []
    const checkoutUrl = acoes.includes("pagar_pendente") ? plano?.checkout_url : null
    const formulario = acoes.includes("assinar") ? "Assinar" : acoes.includes("atualizar_cartao") ? "Atualizar cartão" : null

    // A volta do checkout: a cada 5 s, por até 2 min, enquanto o webhook não confirma.
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("pago") !== "1") return
        setConfirmando(true)
        const inicio = Date.now()
        const parar = () => {
            window.clearInterval(id)
            setConfirmando(false)
        }
        const id = window.setInterval(() => {
            if (Date.now() - inicio >= 120_000) return parar()
            buscarMeuPlano().then(
                (p) => {
                    setAtual(p)
                    if (p.status !== "pending") parar()
                },
                () => undefined,
            )
        }, 5_000)
        return () => window.clearInterval(id)
    }, [])

    async function onAssinar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setErro(null)
        setAviso(null)
        setOcupado(true)
        try {
            window.location.assign(await assinar(nome, cpf))
        } catch (err) {
            setErro(mensagemDe(err))
            setOcupado(false)
        } finally {
            // O CPF não fica na tela nem no estado depois da chamada.
            setCpf("")
        }
    }

    async function onAlterar(acao: keyof typeof ROTULO) {
        if (acao === "reembolsar" && !window.confirm(AVISO_REEMBOLSO)) return
        setErro(null)
        setAviso(null)
        setOcupado(true)
        try {
            setAviso(await alterarAssinatura(acao))
        } catch (err) {
            setErro(mensagemDe(err))
        }
        // O plano novo; se a leitura falhar, o foco da janela busca de novo.
        await buscarMeuPlano().then(setAtual, () => undefined)
        setOcupado(false)
    }

    return (
        <WireframeBox bloco={4} titulo="Planos">
            {carregando && !plano ? <p>Carregando…</p> : null}
            {!carregando && !resumo ? <p>Não foi possível carregar o plano. Tente de novo.</p> : null}
            {resumo ? (
                <div className="space-y-1">
                    <h1 className="text-base font-bold text-foreground">{resumo.titulo}</h1>
                    {resumo.linhas.map((linha) => (
                        <p key={linha}>{linha}</p>
                    ))}
                </div>
            ) : null}
            {confirmando ? <p role="status">Confirmando o pagamento…</p> : null}

            <p>
                {`Preço de hoje: ${doze(precoDoDia(agora))}`}
                {fundador ? " (fundadores, congelado enquanto ativo)" : ""}
            </p>

            {checkoutUrl ? (
                <button type="button" className={botao} onClick={() => window.location.assign(checkoutUrl)}>
                    Continuar o pagamento
                </button>
            ) : null}

            {formulario ? (
                <form onSubmit={onAssinar} className="space-y-2">
                    <label className="block">
                        Nome como no cartão
                        <input
                            className={campo}
                            required
                            minLength={3}
                            maxLength={100}
                            autoComplete="cc-name"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </label>
                    <label className="block">
                        CPF
                        <input
                            className={campo}
                            required
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={14}
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                        />
                    </label>
                    <p>O pagamento abre no Asaas, em 12x no cartão. O CPF vai direto para ele; não o guardamos.</p>
                    <button type="submit" disabled={ocupado} className={botao}>
                        {ocupado ? "Abrindo…" : formulario}
                    </button>
                </form>
            ) : null}

            {(["cancelar", "desfazer", "reembolsar"] as const)
                .filter((a) => acoes.includes(a))
                .map((a) => (
                    <button type="button" key={a} disabled={ocupado} className={`${botao} mr-2`} onClick={() => void onAlterar(a)}>
                        {ROTULO[a]}
                    </button>
                ))}

            {aviso ? <p role="status">{aviso}</p> : null}
            {erro ? <p role="alert">{erro}</p> : null}

            <Link href={ROUTES.PRECOS} className="block text-foreground underline">
                Ver preços e garantias
            </Link>
        </WireframeBox>
    )
}
