import { AppLogo } from "@/components/layout/app-logo"
import { Seal } from "@/components/ui/seal"
import { formatMonthShortPtBr, formatTransactionMonthYearPtBr } from "@/lib/transaction-date"

/** O selo de "Membro desde": Minha conta e a página Você o compartilham. */
export function SeloDeMembro({ desde }: { desde: string }) {
    return (
        <Seal
            label={`Membro desde ${formatTransactionMonthYearPtBr(desde)}`}
            ring={`MEMBRO DESDE · ${formatMonthShortPtBr(new Date(desde)).toUpperCase()} ${new Date(desde).getFullYear()} · FINANCE APP · `}
            icon={<AppLogo />}
        />
    )
}
