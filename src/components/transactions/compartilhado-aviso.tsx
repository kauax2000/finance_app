"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import type { PedidoCompartilhado } from "@/components/transactions/use-transacoes-da-tela"
import { Alert, AlertAction, AlertActions, AlertDescription } from "@/components/ui/alert"
import { ROUTES } from "@/config/navigation"
import { lerArquivoCompartilhado } from "@/lib/captura/compartilhado"

/**
 * O que o compartilhar do Android não leva ao formulário: o PDF (a fatura se
 * confere no cartão), o arquivo que já saiu do cache (lido ou vencido) e o
 * recusado pelo service worker (grande, vazio ou de outro tipo).
 */
const TEXTO = {
    pdf: "Para conferir a fatura, abra o cartão e use Conferir fatura.",
    indisponivel: "O arquivo compartilhado não está mais disponível.",
    recusado: "Não foi possível receber o arquivo (até 10 MB, foto ou PDF).",
} as const

type Aviso = keyof typeof TEXTO

/**
 * Lê o arquivo do Cache Storage (ler apaga): a foto abre a criação com a "Foto
 * do recibo" lendo e o aviso some; o resto vira aviso. PDF ou foto pelo arquivo
 * lido, não pelo `tipo` da URL.
 */
export function CompartilhadoAviso({
    pedido,
    onDismiss,
}: {
    pedido: PedidoCompartilhado | undefined
    onDismiss: () => void
}) {
    const shell = useGlobalShellDialogsOptional()
    const [lido, setLido] = useState<{ chave: string; aviso: Aviso | null } | null>(null)
    // Ler apaga o arquivo: o ref segura o segundo efeito do modo estrito.
    const lendo = useRef<string | null>(null)
    const chave = pedido && "chave" in pedido ? pedido.chave : null

    const onDismissRef = useRef(onDismiss)
    useEffect(() => {
        onDismissRef.current = onDismiss
    })

    useEffect(() => {
        if (!chave || !shell || lendo.current === chave) return
        lendo.current = chave
        void lerArquivoCompartilhado(chave).then((arquivo) => {
            if (!arquivo) {
                setLido({ chave, aviso: "indisponivel" })
            } else if (arquivo.type === "application/pdf") {
                setLido({ chave, aviso: "pdf" })
            } else {
                setLido({ chave, aviso: null })
                onDismissRef.current()
                shell.openTransactionCreate("expense", { fotoInicial: arquivo })
            }
        })
    }, [chave, shell])

    const aviso: Aviso | null = !pedido
        ? null
        : "erro" in pedido
          ? pedido.motivo
          : lido?.chave === pedido.chave
            ? lido.aviso
            : null
    if (!aviso) return null

    return (
        <Alert tone="warning" onDismiss={onDismiss}>
            <AlertDescription>{TEXTO[aviso]}</AlertDescription>
            {aviso === "pdf" ? (
                <AlertActions placement="inline">
                    <AlertAction asChild>
                        <Link href={ROUTES.CREDIT_CARDS}>Abrir cartões</Link>
                    </AlertAction>
                </AlertActions>
            ) : null}
        </Alert>
    )
}
