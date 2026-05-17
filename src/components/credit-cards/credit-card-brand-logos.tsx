/**
 * Card network marks (inline SVG).
 * Trademarks are property of their owners.
 */
import type { ComponentType } from "react"
import type React from "react"
import { cn } from "@/lib/utils"

export const brandLogoFrameClass =
    "relative flex h-7 w-[3.35rem] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-white p-1 shadow-sm ring-1 ring-black/[0.06] dark:border-border/60 dark:bg-zinc-900 dark:ring-white/10"

export type BrandLogoVariant = "chip" | "mark"

function NetworkMark({
    children,
    className,
    variant = "chip",
}: {
    children: React.ReactNode
    className?: string
    variant?: BrandLogoVariant
}) {
    if (variant === "mark") {
        return (
            <span className={cn("inline-flex shrink-0", className)} aria-hidden>
                {children}
            </span>
        )
    }
    return (
        <span className={cn(brandLogoFrameClass, className)} aria-hidden>
            {children}
        </span>
    )
}

function makeNetworkLogo(Mark: ComponentType<{ className?: string }>): ComponentType<{
    className?: string
    variant?: BrandLogoVariant
}> {
    function Logo({
        className,
        variant = "chip",
    }: {
        className?: string
        variant?: BrandLogoVariant
    }) {
        return (
            <NetworkMark className={className} variant={variant}>
                <Mark
                    className={cn(
                        variant === "mark"
                            ? "h-7 w-[3.9rem] drop-shadow-sm"
                            : "h-6 w-full max-w-[3.05rem]",
                        "shrink-0"
                    )}
                />
            </NetworkMark>
        )
    }
    return Logo
}

function VisaSvg({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <path
                fill="#1A1F71"
                d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
            />
        </svg>
    )
}

function MastercardSvg({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 780 500"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <path
                d="M305 250c0-58.5 26.8-110.7 68.7-145.1C343 81.5 303.2 67 260 67 158.8 67 77 148.8 77 250s81.8 183 183 183c43.2 0 83-14.5 113.7-37.9C331.8 360.7 305 308.5 305 250z"
                fill="#EB001B"
            />
            <path
                d="M703 250c0 101.2-81.8 183-183 183-43.2 0-83-14.5-113.7-37.9C448.2 360.7 475 308.5 475 250s-26.8-110.7-68.7-145.1C437 81.5 476.8 67 520 67c101.2 0 183 81.8 183 183z"
                fill="#F79E1B"
            />
            <path
                d="M406.3 104.9C448.2 139.3 475 191.5 475 250s-26.8 110.7-68.7 145.1C364.4 360.7 337.6 308.5 337.6 250s26.8-110.7 68.7-145.1z"
                fill="#FF5F00"
            />
        </svg>
    )
}

function AmexSvg({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 780 500"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <rect width="780" height="500" rx="40" fill="#2E77BC" />
            <path
                fill="#fff"
                d="M132 131h168v44H182v28h112v42H182v29h120v44H132V131zm188 0h53l60 101 60-101h53v232h-50V238l-56 93h-14l-56-93v125h-50V131zm262 0h174v44H632v28h110v42H632v29h124v44H582V131z"
                opacity="0.95"
            />
        </svg>
    )
}

function DiscoverSvg({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 780 250"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <path
                d="M62 65h210c68 0 123 54 123 125s-55 125-123 125H62V65z"
                fill="#111"
            />
            <path
                d="M265 105c34 0 62 28 62 63s-28 63-62 63h-78V105h78z"
                fill="#fff"
            />
            <path
                d="M360 65h358v44H468c-42 0-73 23-73 56s31 56 73 56h250v44H360V65z"
                fill="#111"
            />
            <path
                d="M420 165c0-36 42-65 94-65h108l-55 50c-26 24-26 56 0 80l55 50H514c-52 0-94-29-94-65z"
                fill="#F76B1C"
                opacity="0.95"
            />
        </svg>
    )
}

function DinersSvg({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 780 250"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <rect width="780" height="250" rx="28" fill="#0B4B8A" />
            <circle cx="390" cy="125" r="76" fill="#fff" opacity="0.96" />
            <path
                d="M390 49a76 76 0 0 0 0 152 76 76 0 0 0 0-152zm0 18c-32 0-58 26-58 58s26 58 58 58V67z"
                fill="#0B4B8A"
                opacity="0.92"
            />
            <path
                d="M166 90h126v20H240v22h52v20h-52v24h52v20H166V90zm336 0h116c30 0 54 23 54 52 0 28-24 50-54 50h-64v-20h64c18 0 33-13 33-30 0-18-15-32-33-32h-65V90z"
                fill="#fff"
                opacity="0.92"
            />
        </svg>
    )
}

export const LogoVisa = makeNetworkLogo(VisaSvg)
export const LogoMastercard = makeNetworkLogo(MastercardSvg)
export const LogoAmericanExpress = makeNetworkLogo(AmexSvg)
export const LogoDiscover = makeNetworkLogo(DiscoverSvg)
export const LogoDinersClub = makeNetworkLogo(DinersSvg)

export function LogoElo({
    className,
    variant = "chip",
}: {
    className?: string
    variant?: BrandLogoVariant
}) {
    const svg = (
        <svg
            className={
                variant === "mark"
                    ? "h-7 w-[3.9rem] drop-shadow-sm"
                    : "h-6 w-full max-w-[3.05rem]"
            }
            viewBox="0 0 64 40"
            preserveAspectRatio="xMidYMid meet"
        >
            {variant === "chip" ? (
                <rect width="64" height="40" rx="3" fill="#1A1A1A" />
            ) : (
                <rect width="64" height="40" rx="4" fill="oklch(0.2 0.02 260 / 0.5)" />
            )}
            <path
                fill="#FFCB05"
                d="M14 10h18v20H14z"
                transform="rotate(-14 23 20)"
            />
            <path
                fill="#00A4E0"
                d="M32 10h18v20H32z"
                transform="rotate(14 41 20)"
            />
        </svg>
    )
    if (variant === "mark") {
        return (
            <span className={cn("inline-flex shrink-0", className)} aria-hidden>
                {svg}
            </span>
        )
    }
    return (
        <span className={cn(brandLogoFrameClass, className)} aria-hidden>
            {svg}
        </span>
    )
}

export function LogoHipercard({
    className,
    variant = "chip",
}: {
    className?: string
    variant?: BrandLogoVariant
}) {
    const svg = (
        <svg
            className={
                variant === "mark"
                    ? "h-7 w-[3.9rem] drop-shadow-sm"
                    : "h-6 w-full max-w-[3.05rem]"
            }
            viewBox="0 0 64 28"
            preserveAspectRatio="xMidYMid meet"
        >
            <rect
                width="64"
                height="28"
                rx="3"
                fill={variant === "mark" ? "oklch(0.45 0.18 15 / 0.85)" : "#B61F2B"}
            />
            <text
                x="32"
                y="18"
                textAnchor="middle"
                fill="#fff"
                fontSize="11"
                fontWeight="800"
                fontFamily="system-ui, sans-serif"
                letterSpacing="-0.02em"
            >
                hiper
            </text>
        </svg>
    )
    if (variant === "mark") {
        return (
            <span className={cn("inline-flex shrink-0", className)} aria-hidden>
                {svg}
            </span>
        )
    }
    return (
        <span className={cn(brandLogoFrameClass, className)} aria-hidden>
            {svg}
        </span>
    )
}
