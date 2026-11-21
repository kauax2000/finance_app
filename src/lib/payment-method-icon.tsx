import type { ComponentType } from "react"
import { ArrowsRightLeftIcon, BanknotesIcon, CreditCardIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid"
import {
    ArrowsRightLeftIcon as ArrowsRightLeftOutline,
    BanknotesIcon as BanknotesOutline,
    CreditCardIcon as CreditCardOutline,
    EllipsisHorizontalIcon as EllipsisHorizontalOutline,
} from "@heroicons/react/24/outline"
import { PixIcon } from "@/components/icons/pix-icon"

type Icone = ComponentType<{ className?: string }>

/** O ícone de cada forma. `sm` é o corpo de 16 (`16/solid`, o ladrilho da lista); `lg`, o de 24 (`24/outline`, o miolo do anel). "Outro", sem forma e o que não se reconhece caem nas reticências. */
const ICONS: Record<"sm" | "lg", { mapa: Record<string, Icone>; padrao: Icone }> = {
    sm: {
        mapa: { pix: PixIcon, credit_card: CreditCardIcon, debit_card: CreditCardIcon, cash: BanknotesIcon, ted: ArrowsRightLeftIcon },
        padrao: EllipsisHorizontalIcon,
    },
    lg: {
        mapa: { pix: PixIcon, credit_card: CreditCardOutline, debit_card: CreditCardOutline, cash: BanknotesOutline, ted: ArrowsRightLeftOutline },
        padrao: EllipsisHorizontalOutline,
    },
}

export function paymentMethodIcon(method: string | null | undefined, size: "sm" | "lg" = "sm"): Icone {
    const { mapa, padrao } = ICONS[size]
    return (method && mapa[method]) || padrao
}
