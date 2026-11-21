import type { ComponentType } from "react"
import { ArrowsRightLeftIcon, BanknotesIcon, CreditCardIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid"
import { PixIcon } from "@/components/icons/pix-icon"

/** O ícone de cada forma, no corpo de 16 (`16/solid`). "Outro", sem forma e o que não se reconhece caem nas reticências. */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
    pix: PixIcon,
    credit_card: CreditCardIcon,
    debit_card: CreditCardIcon,
    cash: BanknotesIcon,
    ted: ArrowsRightLeftIcon,
}

export function paymentMethodIcon(method: string | null | undefined): ComponentType<{ className?: string }> {
    return (method && ICONS[method]) || EllipsisHorizontalIcon
}
