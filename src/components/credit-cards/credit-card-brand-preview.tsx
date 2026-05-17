"use client"

import type { ComponentType, ReactNode } from "react"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import {
    LogoAmericanExpress,
    LogoDinersClub,
    LogoDiscover,
    LogoElo,
    LogoHipercard,
    LogoMastercard,
    LogoVisa,
} from "@/components/credit-cards/credit-card-brand-logos"
import {
    CREDIT_CARD_BRAND_UNIDENTIFIED,
    detectCreditCardBrand,
    normalizeCardDigits,
} from "@/lib/credit-card-number"
import { cn } from "@/lib/utils"

const BRAND_DISPLAY: Record<
    string,
    { label: string; Logo: ComponentType<{ className?: string }> }
> = {
    "American Express": { label: "Amex", Logo: LogoAmericanExpress },
    Elo: { label: "Elo", Logo: LogoElo },
    Mastercard: { label: "Mastercard", Logo: LogoMastercard },
    Visa: { label: "Visa", Logo: LogoVisa },
    Hipercard: { label: "Hipercard", Logo: LogoHipercard },
    "Diners Club": { label: "Diners Club", Logo: LogoDinersClub },
    Discover: { label: "Discover", Logo: LogoDiscover },
}

export type CreditCardBrandPreviewProps = {
    cardNumber: string
    className?: string
}

function GenericLogo({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "flex h-7 w-[3.35rem] shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/15 text-muted-foreground dark:bg-input/25",
                className
            )}
            aria-hidden
        >
            <CreditCardIcon className="size-[18px] shrink-0" />
        </span>
    )
}

function BrandPreviewRow({
    Logo,
    label,
    className,
}: {
    Logo: ComponentType<{ className?: string }>
    label: string
    className?: string
}) {
    return (
        <PreviewShell className={className}>
            <Logo />
            <span className="min-w-0 flex-1 truncate text-sm leading-tight text-foreground">
                {label}
            </span>
        </PreviewShell>
    )
}

function PreviewShell({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                "flex min-w-0 items-center gap-2 rounded-md border border-border/50 bg-muted/10 px-2.5 py-1.5",
                className
            )}
        >
            {children}
        </div>
    )
}

export function CreditCardBrandPreview({
    cardNumber,
    className,
}: CreditCardBrandPreviewProps) {
    const digits = normalizeCardDigits(cardNumber)
    if (digits.length < 6) return null

    const detected = detectCreditCardBrand(digits)
    const row = detected ? BRAND_DISPLAY[detected] : null

    if (row) {
        return (
            <BrandPreviewRow
                Logo={row.Logo}
                label={row.label}
                className={className}
            />
        )
    }

    return (
        <BrandPreviewRow
            Logo={GenericLogo}
            label={CREDIT_CARD_BRAND_UNIDENTIFIED}
            className={className}
        />
    )
}
