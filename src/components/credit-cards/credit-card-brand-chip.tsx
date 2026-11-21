"use client"

import type { ComponentType } from "react"
import { CreditCardIcon } from "@heroicons/react/16/solid"
import {
    brandLogoFrameClass,
    LogoAmericanExpress,
    LogoDinersClub,
    LogoDiscover,
    LogoElo,
    LogoHipercard,
    LogoMastercard,
    LogoVisa,
} from "@/components/credit-cards/credit-card-brand-logos"
import { matchPresetBrand } from "@/components/credit-cards/credit-card-brand-theme"
import { cn } from "@/lib/utils"

const LOGO: Record<string, ComponentType<{ className?: string }>> = {
    "American Express": LogoAmericanExpress,
    Elo: LogoElo,
    Mastercard: LogoMastercard,
    Visa: LogoVisa,
    Hipercard: LogoHipercard,
    "Diners Club": LogoDinersClub,
    Discover: LogoDiscover,
}

/**
 * A bandeira do cartão numa ficha pequena, para linha de lista e gatilho de campo.
 * `size="xs"` é o selo do canto de um ladrilho (12 × 18): sem bandeira conhecida
 * ele não desenha nada, porque o ícone de cartão já está no ladrilho.
 */
export function CreditCardBrandChip({
    brand,
    size = "sm",
    className,
}: {
    brand: string | null
    size?: "sm" | "xs"
    className?: string
}) {
    const preset = matchPresetBrand(brand)
    const Logo = preset ? LOGO[preset] : undefined
    if (size === "xs" && !Logo) return null
    // A moldura dos logos mede 28 × 54; aqui ela desce a 20 × 32, o corpo de um
    // ícone de linha, e o logo de dentro encolhe junto (`[&>svg]`). No `xs`, a 12 × 18.
    const compacta =
        size === "xs"
            ? "h-3 w-4.5 rounded-xs border-0 p-px shadow-none [&>svg]:h-2.5"
            : "h-5 w-8 p-0.5 shadow-none [&>svg]:h-4"
    // Placa branca nos dois temas: as cores das bandeiras são da marca de cada
    // uma, desenhadas para o branco (o azul da Visa sumia no `zinc-900`).
    const placa = "dark:border-transparent dark:bg-white"
    if (Logo) return <Logo className={cn(compacta, placa, className)} />
    return (
        <span
            className={cn(brandLogoFrameClass, compacta, "text-muted-foreground", className)}
            aria-hidden
        >
            <CreditCardIcon className="size-3.5" />
        </span>
    )
}
