"use client"

import Link from "next/link"
import { useState } from "react"

import { DeleteAccountDialog } from "@/components/security/DeleteAccountDialog"
import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { ROUTES } from "@/config/navigation"
import { exportarTudo } from "@/lib/cofre/exportar"
import { localYmdFromDate } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const celula = "border border-muted-foreground/40 px-2 py-1 text-left align-top"

/** O que o app guarda: o dado, onde fica, quem vê e por que pedimos. Mesma lista da /privacidade. */
const GUARDADO: ReadonlyArray<readonly [dado: string, onde: string, quem: string, porque: string]> = [
    ["Conta: nome, e-mail e foto", "Supabase (região a confirmar)", "Você", "Entrar e identificar você nas carteiras."],
    [
        "Lançamentos, categorias, orçamentos, contas a pagar e assinaturas",
        "Supabase (região a confirmar)",
        "Quem é dono ou membro da carteira",
        "É o que o app existe para mostrar.",
    ],
    [
        "Cartões: apelido, 4 últimos dígitos, validade, limite e dias de fechamento e vencimento",
        "Supabase (região a confirmar)",
        "Quem é dono ou membro da carteira",
        "Calcular a fatura. O número inteiro nunca é guardado.",
    ],
    [
        "Anexos (foto ou PDF)",
        "Armazenamento privado do Supabase (região a confirmar)",
        "Quem é dono ou membro da carteira, por um link que vale uma hora",
        "Guardar o recibo junto do lançamento.",
    ],
    [
        "Convites: o e-mail de quem foi convidado",
        "Supabase (região a confirmar)",
        "Dono da carteira",
        "Conferir o convite quando ele é aberto.",
    ],
    [
        "Sessões, aparelhos e registro de atividade da conta (com IP)",
        "Supabase (região a confirmar)",
        "Você",
        "Segurança: mostrar onde a conta está aberta.",
    ],
]

/**
 * O Cofre aberto (Bloco 4): o que guardamos, exportar tudo e apagar a conta.
 * A exportação só lê, então funciona também em "só leitura".
 */
export function CofreAbertoWireframe() {
    const { workspaces } = useWorkspace()
    const [exportando, setExportando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [apagando, setApagando] = useState(false)

    async function exportar() {
        setExportando(true)
        setErro(null)
        try {
            const blob = await exportarTudo(workspaces.map((w) => w.id))
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `finance-app-${localYmdFromDate(new Date())}.zip`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            setErro("Não foi possível exportar agora. Tente novamente.")
        } finally {
            setExportando(false)
        }
    }

    return (
        <WireframeBox bloco={4} titulo="Cofre aberto">
            <h1 className="text-base font-bold text-foreground">Cofre aberto</h1>

            <h2 className="font-bold text-foreground">O que guardamos e onde</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className={celula}>Dado</th>
                            <th className={celula}>Onde fica</th>
                            <th className={celula}>Quem vê</th>
                            <th className={celula}>Por que pedimos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {GUARDADO.map(([dado, onde, quem, porque]) => (
                            <tr key={dado}>
                                <td className={celula}>{dado}</td>
                                <td className={celula}>{onde}</td>
                                <td className={celula}>{quem}</td>
                                <td className={celula}>{porque}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="font-bold text-foreground">Não pedimos senha de banco</h2>
            <p>Não conectamos o seu banco. Os lançamentos entram por você, por um extrato que você envia ou pela captura que você liga.</p>

            <h2 className="font-bold text-foreground">Exportar tudo</h2>
            <p>Um ZIP com um CSV por tabela, de todas as carteiras de que você faz parte. Gerado no seu aparelho.</p>
            <button type="button" className={botao} disabled={exportando || workspaces.length === 0} onClick={() => void exportar()}>
                {exportando ? "Exportando…" : "Exportar tudo"}
            </button>
            {erro ? <p role="alert" className="text-destructive">{erro}</p> : null}

            <h2 className="font-bold text-foreground">Apagar a conta</h2>
            <p>Apaga a conta, as carteiras que você criou (também para os outros membros), os lançamentos e o perfil. Pede a sua senha e não tem volta.</p>
            <button type="button" className={botao} onClick={() => setApagando(true)}>
                Apagar a conta
            </button>
            <DeleteAccountDialog open={apagando} onOpenChange={setApagando} />

            <p>
                <Link href={ROUTES.PILOTO} className="text-foreground underline">
                    Ver o que o app lançou sozinho (Piloto Automático)
                </Link>
            </p>
        </WireframeBox>
    )
}
