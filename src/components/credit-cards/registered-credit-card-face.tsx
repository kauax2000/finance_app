"use client"

import type { ComponentType } from "react"
import type React from "react"
import { CreditCardIcon } from "@heroicons/react/24/outline"
import {
    LogoAmericanExpress,
    LogoDinersClub,
    LogoDiscover,
    LogoElo,
    LogoHipercard,
    LogoMastercard,
    LogoVisa,
    type BrandLogoVariant,
} from "@/components/credit-cards/credit-card-brand-logos"
import {
    brandToPalette,
    matchPresetBrand,
} from "@/components/credit-cards/credit-card-brand-theme"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type RegisteredCreditCardFaceCard = {
    id: string
    name: string
    last_four: string
    brand: string | null
    expiry_month?: number | null
    expiry_year?: number | null
    is_active: boolean
}

const LOGO_BY_PRESET: Record<
    string,
    ComponentType<{ className?: string; variant?: BrandLogoVariant }>
> = {
    "American Express": LogoAmericanExpress,
    Elo: LogoElo,
    Mastercard: LogoMastercard,
    Visa: LogoVisa,
    Hipercard: LogoHipercard,
    "Diners Club": LogoDinersClub,
    Discover: LogoDiscover,
}

function BrandMark({
    brand,
    className,
}: {
    brand: string | null
    className?: string
}) {
    const preset = matchPresetBrand(brand)
    if (preset && LOGO_BY_PRESET[preset]) {
        const Logo = LOGO_BY_PRESET[preset]!
        return (
            <Logo
                className={cn("origin-top-right scale-[1.06]", className)}
                variant="mark"
            />
        )
    }
    const custom = brand?.trim()
    if (custom) {
        const parts = custom.split(/\s+/).filter(Boolean)
        let initials = parts
            .slice(0, 2)
            .map((w) => w[0]!.toUpperCase())
            .join("")
        if (initials.length < 2 && custom.length >= 2) {
            initials = custom.slice(0, 2).toUpperCase()
        }
        return (
            <span
                className={cn(
                    "flex h-6 min-w-[2.5rem] items-center justify-center rounded-md border border-border/50 bg-muted/40 px-1.5 text-[9px] font-bold tracking-wide text-foreground backdrop-blur-sm @3xs:h-7 @3xs:min-w-[2.85rem] @3xs:px-2 @3xs:text-[10px] @2xs:text-[11px]",
                    className
                )}
                aria-hidden
            >
                {initials || "?"}
            </span>
        )
    }
    return (
        <span
            className={cn(
                "flex h-6 w-9 items-center justify-center rounded-md border border-border/50 bg-muted/35 text-muted-foreground backdrop-blur-sm @3xs:h-7 @3xs:w-10",
                className
            )}
            aria-hidden
        >
            <CreditCardIcon
                className="size-4 @3xs:size-[18px] @xs:size-5"
            />
        </span>
    )
}

function formatExpiryShort(
    month: number | null | undefined,
    year: number | null | undefined
): string | null {
    if (month == null || year == null) return null
    const yy = year >= 100 ? year % 100 : year
    return `${String(month).padStart(2, "0")}/${String(yy).padStart(2, "0")}`
}

function formatPanLine(lastFour: string): string {
    const tail = (lastFour || "••••").slice(-4).padStart(4, "•")
    return `•••• •••• •••• ${tail}`
}

function FinanceAppMark({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <path
                d="M27.8004 6.52056C27.9105 7.06413 27.5571 7.59341 27.0129 7.70023L20.6453 8.95007C18.9288 9.2876 17.5787 10.5992 17.2119 12.2821L16.103 17.363H26.6451C27.1974 17.363 27.6451 17.8107 27.6451 18.363V19.9393C27.6451 20.4916 27.1974 20.9393 26.6451 20.9393H15.3222L14.7012 23.7959C13.4842 29.3797 5.39049 29.4098 4.1305 23.8352C3.3812 20.5144 5.9536 17.363 9.41364 17.363H12.3857L13.6588 11.532C14.3292 8.45614 16.7938 6.06486 19.9311 5.44795L26.3144 4.19201C26.8542 4.0858 27.3784 4.43558 27.4876 4.97481L27.8004 6.52056ZM9.41364 20.9393C8.27769 20.9393 7.43279 21.973 7.67921 23.0632C8.09367 24.8914 10.7479 24.8815 11.1481 23.0501L11.6094 20.9393H9.41364Z"
                fill="currentColor"
            />
        </svg>
    )
}

export type RegisteredCreditCardFaceProps = {
    card: RegisteredCreditCardFaceCard
    className?: string
    size?: "sm" | "md"
    showInactiveBadge?: boolean
}

export function RegisteredCreditCardFace({
    card,
    className,
    size = "sm",
    showInactiveBadge = true,
}: RegisteredCreditCardFaceProps) {
    const expiry = formatExpiryShort(card.expiry_month, card.expiry_year)
    const palette = brandToPalette(card.brand)
    const isSmall = size === "sm"

    return (
        <div
            className={cn(
                "@container relative isolate w-full overflow-hidden rounded-2xl border border-white/18 bg-background/35 shadow-xl shadow-black/15 ring-1 ring-white/18 backdrop-blur-2xl dark:border-white/12 dark:bg-background/25 dark:ring-white/[0.06]",
                "aspect-[1.586]",
                className
            )}
            style={
                {
                    ["--cc-accent-a" as never]: palette.accentA,
                    ["--cc-accent-b" as never]: palette.accentB,
                } as React.CSSProperties
            }
            aria-hidden
        >
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.98]"
                style={{
                    backgroundImage:
                        "linear-gradient(145deg, oklch(0.08 0.02 255) 0%, oklch(0.12 0.025 255) 48%, oklch(0.18 0.03 255) 100%)",
                }}
                aria-hidden
            />

            <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.72]"
                style={{
                    backgroundImage:
                        "radial-gradient(110% 88% at 8% 0%, color-mix(in oklch, var(--cc-accent-a) 68%, transparent) 0%, transparent 58%), radial-gradient(95% 86% at 100% 100%, color-mix(in oklch, var(--cc-accent-b) 62%, transparent) 0%, transparent 66%)",
                }}
                aria-hidden
            />

            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.22]"
                style={{
                    backgroundImage:
                        "linear-gradient(115deg, transparent 0 18%, oklch(1 0 0 / 0.28) 19%, transparent 20% 48%, oklch(1 0 0 / 0.18) 49%, transparent 50% 100%)",
                    mixBlendMode: "soft-light",
                }}
                aria-hidden
            />

            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.58]"
                style={{
                    backgroundImage:
                        "radial-gradient(ellipse 92% 72% at calc(48% + (var(--cc-glare-x, var(--cc-tilt-x, 0)) * 42%)) calc(36% + (var(--cc-glare-y, var(--cc-tilt-y, 0)) * -36%)), oklch(1 0 0 / 0.4), transparent 56%)," +
                        "radial-gradient(ellipse 78% 60% at calc(68% + (var(--cc-glare-x, var(--cc-tilt-x, 0)) * -34%)) calc(72% + (var(--cc-glare-y, var(--cc-tilt-y, 0)) * 28%)), oklch(1 0 0 / 0.18), transparent 62%)," +
                        "radial-gradient(ellipse 55% 45% at calc(30% + (var(--cc-glare-x, var(--cc-tilt-x, 0)) * 20%)) calc(62% + (var(--cc-glare-y, var(--cc-tilt-y, 0)) * 18%)), oklch(1 0 0 / 0.1), transparent 65%)",
                    mixBlendMode: "soft-light",
                }}
                aria-hidden
            />

            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-white/18 via-white/5 to-transparent dark:from-white/[0.07] dark:via-transparent dark:to-black/35"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-[radial-gradient(100%_70%_at_15%_0%,oklch(1_0_0/0.22),transparent_50%)] dark:bg-[radial-gradient(100%_70%_at_15%_0%,oklch(1_0_0/0.06),transparent_45%)]"
                aria-hidden
            />

            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.55]"
                style={{
                    padding: "1px",
                    background:
                        "linear-gradient(180deg, oklch(0 0 0 / 0.5), transparent 38%, oklch(0 0 0 / 0.4) 100%)",
                    WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    mixBlendMode: "multiply",
                }}
                aria-hidden
            />

            <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.5]"
                style={{
                    padding: "1px",
                    background:
                        "radial-gradient(120% 90% at calc(52% + (var(--cc-glare-x, var(--cc-tilt-x, 0)) * 32%)) calc(8% + (var(--cc-glare-y, var(--cc-tilt-y, 0)) * -20%)), oklch(1 0 0 / 0.62), transparent 50%)," +
                        "radial-gradient(95% 78% at calc(58% + (var(--cc-glare-x, var(--cc-tilt-x, 0)) * -24%)) calc(102% + (var(--cc-glare-y, var(--cc-tilt-y, 0)) * 14%)), oklch(1 0 0 / 0.22), transparent 55%)",
                    WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    mixBlendMode: "soft-light",
                }}
                aria-hidden
            />

            {showInactiveBadge && !card.is_active ? (
                <div className="pointer-events-none absolute left-3 top-2.5 z-10 @3xs:left-3.5 @3xs:top-3">
                    <Badge
                        variant="secondary"
                        className="text-[10px] @3xs:text-[11px] @xs:text-xs"
                    >
                        Inativo
                    </Badge>
                </div>
            ) : null}

            <div
                className={cn(
                    "pointer-events-none absolute z-[1] text-white/95 drop-shadow-md dark:text-white/90",
                    isSmall
                        ? "bottom-2.5 right-2.5 opacity-[0.34] @3xs:bottom-3 @3xs:right-3 @xs:bottom-3.5 @xs:right-3.5"
                        : "bottom-3 right-3 opacity-[0.38]"
                )}
                aria-hidden
            >
                <FinanceAppMark
                    className={cn(
                        isSmall
                            ? "h-5 w-5 @3xs:h-6 @3xs:w-6 @xs:h-7 @xs:w-7"
                            : "h-7 w-7"
                    )}
                />
            </div>

            <div
                className={cn(
                    "relative flex h-full flex-col justify-between text-white drop-shadow-[0_1px_1px_oklch(0_0_0/0.35)]",
                    isSmall
                        ? cn(
                              "gap-1.5 p-2.5 @3xs:gap-2 @3xs:p-3 @2xs:p-3.5 @xs:p-4",
                              showInactiveBadge && !card.is_active
                                  ? "pt-8 @3xs:pt-8 @xs:pt-9"
                                  : "pt-2.5 @3xs:pt-3 @xs:pt-3.5"
                          )
                        : cn(
                              "gap-3 p-5",
                              showInactiveBadge && !card.is_active ? "pt-6" : "pt-5"
                          )
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <div
                        className={cn(
                            "rounded-md border border-white/35 bg-gradient-to-br from-white/85 via-white/45 to-white/18 shadow-inner shadow-black/20 backdrop-blur-sm",
                            isSmall
                                ? "h-5 w-7 @3xs:h-6 @3xs:w-8 @2xs:h-7 @2xs:w-9 @xs:h-8 @xs:w-11"
                                : "h-9 w-11"
                        )}
                        aria-hidden
                    />
                    <BrandMark
                        brand={card.brand}
                        className={cn(
                            "items-center justify-center overflow-hidden rounded-md border border-white/25 bg-white/16 text-white shadow-sm shadow-black/15 backdrop-blur-md",
                            isSmall
                                ? "h-5 min-w-8 px-1.5 text-[9px] @3xs:h-6 @3xs:min-w-9 @3xs:text-[10px] @2xs:text-[11px] @xs:h-7 @xs:min-w-[2.85rem] [&>svg]:h-5 [&>svg]:w-11 @3xs:[&>svg]:h-6 @3xs:[&>svg]:w-12 @xs:[&>svg]:h-7 @xs:[&>svg]:w-[3.9rem]"
                                : "h-7 min-w-[2.85rem] [&>svg]:h-7 [&>svg]:w-[3.9rem]"
                        )}
                    />
                </div>

                <div
                    className={cn(
                        "min-w-0",
                        isSmall
                            ? "space-y-1.5 @3xs:space-y-2 @xs:space-y-2.5"
                            : "space-y-2.5"
                    )}
                >
                    <p
                        className={cn(
                            "truncate font-mono font-semibold tracking-[0.08em] text-white/95",
                            isSmall
                                ? "text-[10px] leading-none @3xs:text-[11px] @2xs:text-xs @xs:text-sm"
                                : "text-sm sm:text-base"
                        )}
                    >
                        {formatPanLine(card.last_four)}
                    </p>
                    <div className="flex min-w-0 items-end justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p
                                className={cn(
                                    "truncate font-semibold uppercase tracking-[0.14em] text-white/90",
                                    isSmall
                                        ? "text-[8px] leading-tight @3xs:text-[9px] @2xs:text-[10px] @xs:text-xs @xs:leading-snug"
                                        : "text-xs sm:text-sm"
                                )}
                            >
                                {card.name}
                            </p>
                        </div>
                        {expiry ? (
                            <div className="shrink-0 text-right">
                                <p
                                    className={cn(
                                        "font-medium uppercase tracking-wider text-white/55",
                                        isSmall
                                            ? "text-[7px] leading-none @3xs:text-[8px] @2xs:text-[9px] @xs:text-[10px]"
                                            : "text-[8px]"
                                    )}
                                >
                                    Validade
                                </p>
                                <p
                                    className={cn(
                                        "tabular-nums font-semibold text-white/90",
                                        isSmall
                                            ? "text-[9px] leading-tight @3xs:text-[10px] @2xs:text-[11px] @xs:text-xs"
                                            : "text-xs"
                                    )}
                                >
                                    {expiry}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
