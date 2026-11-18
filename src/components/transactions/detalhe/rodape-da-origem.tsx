"use client"

import type { ComponentType, ReactNode, SVGProps } from "react"
import {
    ArrowDownTrayIcon,
    ArrowPathRoundedSquareIcon,
    BoltIcon,
    ChatBubbleLeftIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    ShareIcon,
    SparklesIcon,
} from "@heroicons/react/16/solid"
import { Caption } from "@/components/ui/typography"
import { linhaDoQuando, notaComAutor, notaDaOrigem } from "@/components/transactions/detalhe-regras"
import type { Transaction, TransactionSource } from "@/lib/supabase"

const ICONE_DA_ORIGEM: Record<TransactionSource, ComponentType<SVGProps<SVGSVGElement>>> = {
    app: DevicePhoneMobileIcon,
    quick_text: SparklesIcon,
    shortcut: BoltIcon,
    apple_pay: CreditCardIcon,
    whatsapp: ChatBubbleLeftIcon,
    share: ShareIcon,
    import_pdf: ArrowDownTrayIcon,
    import_sheet: ArrowDownTrayIcon,
    import_statement: ArrowDownTrayIcon,
    recurring: ArrowPathRoundedSquareIcon,
}

/** O fim da folha do detalhe: quem pagou, quem lançou e por onde, e quando entrou (e quando mudou), em frases curtas. */
export function RodapeDaOrigem({
    transaction: t,
    autor,
    pagou,
    mesmaPessoa = false,
}: {
    transaction: Pick<Transaction, "source" | "created_at" | "updated_at">
    /** Quem lançou: a frase o nomeia e a foto vai no lugar do ícone da origem. */
    autor?: { nome: string; foto: ReactNode } | null
    /** Quem pagou (despesa de carteira com 2+ pessoas): repete o avatar do topo, a pedido do dono. */
    pagou?: { nome: string; foto: ReactNode } | null
    /** Quem pagou é quem lançou: decidido pela identidade (ids), nunca pelo nome, que dois membros podem repetir. */
    mesmaPessoa?: boolean
}) {
    const Icone = ICONE_DA_ORIGEM[t.source] ?? DevicePhoneMobileIcon
    const quando = linhaDoQuando(t.created_at, t.updated_at)
    // "lançou pelo app", "lançou pela Planilha": a mesma tabela de notaComAutor, sem o nome.
    const lancou = notaComAutor(t.source, "").trim()
    const juntas = Boolean(autor && pagou && mesmaPessoa)
    return (
        <footer data-slot="rodape-da-origem" className="grid justify-items-center gap-0.5 text-center">
            {autor ? (
                <>
                    {pagou && !juntas ? <Frase foto={pagou.foto} nome={pagou.nome} resto="pagou" /> : null}
                    <Frase
                        foto={autor.foto}
                        nome={autor.nome}
                        resto={juntas ? `pagou e ${lancou}` : lancou}
                    />
                </>
            ) : (
                <Caption className="inline-flex items-center justify-center gap-1.5">
                    <Icone aria-hidden className="size-3.5 shrink-0" />
                    {notaDaOrigem(t.source)}
                </Caption>
            )}
            {quando ? <Caption>{quando}</Caption> : null}
        </footer>
    )
}

/** Uma linha do rodapé: a foto e o nome em destaque, o resto em cinza; quebra centralizada, sem soltar a foto. */
function Frase({ foto, nome, resto }: { foto: ReactNode; nome: string; resto: string }) {
    return (
        <Caption className="inline-flex items-center justify-center gap-1.5">
            {foto}
            <span>
                <span className="font-medium text-foreground">{nome}</span> {resto}
            </span>
        </Caption>
    )
}
