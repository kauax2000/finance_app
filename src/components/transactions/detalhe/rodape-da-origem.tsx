"use client"

import type { ComponentType, SVGProps } from "react"
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
import { linhaDaEdicao, momentoDoRegistro, notaDaOrigem } from "@/components/transactions/detalhe-regras"
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

/** O fim da folha do detalhe: de onde o lançamento veio, quando entrou e, se mudou, quando. */
export function RodapeDaOrigem({ transaction: t }: { transaction: Pick<Transaction, "source" | "created_at" | "updated_at"> }) {
    const Icone = ICONE_DA_ORIGEM[t.source] ?? DevicePhoneMobileIcon
    const momento = momentoDoRegistro(t.created_at)
    const edicao = linhaDaEdicao(t.created_at, t.updated_at)
    return (
        <footer data-slot="rodape-da-origem" className="grid justify-items-center text-center">
            <Caption className="inline-flex items-center gap-1.5">
                <Icone aria-hidden className="size-3.5 shrink-0" />
                {momento ? `${notaDaOrigem(t.source)} · ${momento}` : notaDaOrigem(t.source)}
            </Caption>
            {edicao ? <Caption>{edicao}</Caption> : null}
        </footer>
    )
}
