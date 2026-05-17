"use client"

import type { ComponentType } from "react"
import { useMemo, useState } from "react"
import { NoSymbolIcon, CreditCardIcon } from "@heroicons/react/24/outline"
import {
    LogoAmericanExpress,
    LogoDinersClub,
    LogoDiscover,
    LogoElo,
    LogoHipercard,
    LogoMastercard,
    LogoVisa,
} from "@/components/credit-cards/credit-card-brand-logos"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

/** Values persisted in `credit_cards.brand` (existing free-text rows may differ). */
export const CREDIT_CARD_BRAND_PRESETS = [
    "",
    "American Express",
    "Elo",
    "Mastercard",
    "Visa",
    "Hipercard",
    "Diners Club",
    "Discover",
] as const

const SELECT_NONE = "__none__"
const SELECT_OTHER = "__other__"

const PRESET_SET = new Set(
    CREDIT_CARD_BRAND_PRESETS.filter((v) => v !== "") as string[]
)

function matchesPreset(brand: string): boolean {
    return PRESET_SET.has(brand.trim())
}

function LogoNone({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "flex h-7 w-[3.35rem] shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/45 bg-muted/20 text-muted-foreground",
                className
            )}
            aria-hidden
        >
            <NoSymbolIcon className="size-[18px] shrink-0 opacity-70" />
        </span>
    )
}

const PRESET_ROWS: {
    value: string
    label: string
    Logo: ComponentType<{ className?: string }>
}[] = [
    { value: "", label: "Nenhuma", Logo: LogoNone },
    {
        value: "American Express",
        label: "Amex",
        Logo: LogoAmericanExpress,
    },
    { value: "Elo", label: "Elo", Logo: LogoElo },
    { value: "Mastercard", label: "Mastercard", Logo: LogoMastercard },
    { value: "Visa", label: "Visa", Logo: LogoVisa },
    { value: "Hipercard", label: "Hipercard", Logo: LogoHipercard },
    { value: "Diners Club", label: "Diners Club", Logo: LogoDinersClub },
    { value: "Discover", label: "Discover", Logo: LogoDiscover },
]

function BrandRow({
    Logo,
    label,
    className,
}: {
    Logo: ComponentType<{ className?: string }>
    label: string
    className?: string
}) {
    return (
        <span
            className={cn(
                "flex min-w-0 items-center gap-2 text-left text-sm",
                className
            )}
        >
            <Logo />
            <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
        </span>
    )
}

function OtherRow({ label }: { label: string }) {
    return (
        <span className="flex min-w-0 items-center gap-2 text-left text-sm">
            <span className="flex h-7 w-[3.35rem] shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/15 text-muted-foreground dark:bg-input/25">
                <CreditCardIcon className="size-[18px] shrink-0" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
        </span>
    )
}

export type CreditCardBrandPickerProps = {
    id: string
    value: string
    onChange: (next: string) => void
    disabled?: boolean
}

export function CreditCardBrandPicker({
    id,
    value,
    onChange,
    disabled,
}: CreditCardBrandPickerProps) {
    const isCustom = useMemo(
        () => value.trim() !== "" && !matchesPreset(value),
        [value]
    )
    const [otherEmpty, setOtherEmpty] = useState(false)

    const selectValue = useMemo(() => {
        if (isCustom) return SELECT_OTHER
        if (value.trim() === "") {
            return otherEmpty ? SELECT_OTHER : SELECT_NONE
        }
        return value.trim()
    }, [value, isCustom, otherEmpty])

    const triggerPreview = useMemo(() => {
        if (selectValue === SELECT_NONE) {
            const row = PRESET_ROWS[0]!
            return <BrandRow Logo={row.Logo} label={row.label} />
        }
        if (selectValue === SELECT_OTHER) {
            const t = value.trim()
            return <OtherRow label={t || "Outra bandeira"} />
        }
        const row = PRESET_ROWS.find((r) => r.value === selectValue)
        if (!row) {
            return <OtherRow label={value.trim() || "Bandeira"} />
        }
        return <BrandRow Logo={row.Logo} label={row.label} />
    }, [selectValue, value])

    return (
        <div className="space-y-2">
            <Select
                value={selectValue}
                onValueChange={(v) => {
                    if (v === SELECT_NONE) {
                        setOtherEmpty(false)
                        onChange("")
                        return
                    }
                    if (v === SELECT_OTHER) {
                        setOtherEmpty(true)
                        if (!isCustom) {
                            onChange("")
                        }
                        return
                    }
                    setOtherEmpty(false)
                    onChange(v)
                }}
                disabled={disabled}
            >
                <SelectTrigger
                    id={id}
                    aria-labelledby={`${id}-label`}
                    className="w-full min-w-0 justify-between gap-2 px-3 py-0 text-sm font-normal shadow-none [&>svg]:size-4 [&_[data-slot=select-value]]:!line-clamp-none [&_[data-slot=select-value]]:!overflow-visible [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:flex-1"
                >
                    <SelectValue placeholder="Selecione a bandeira">
                        {triggerPreview}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent
                    position="popper"
                    align="start"
                    className="z-[100] min-w-[var(--radix-select-trigger-width)] p-1"
                    sideOffset={6}
                    collisionPadding={12}
                >
                    <SelectItem
                        value={SELECT_NONE}
                        className="cursor-pointer py-2 pl-2 pr-8"
                    >
                        <BrandRow
                            Logo={PRESET_ROWS[0]!.Logo}
                            label={PRESET_ROWS[0]!.label}
                        />
                    </SelectItem>
                    {PRESET_ROWS.slice(1).map((row) => (
                        <SelectItem
                            key={row.value}
                            value={row.value}
                            className="cursor-pointer py-2 pl-2 pr-8"
                        >
                            <BrandRow Logo={row.Logo} label={row.label} />
                        </SelectItem>
                    ))}
                    <SelectItem
                        value={SELECT_OTHER}
                        className="cursor-pointer py-2 pl-2 pr-8"
                    >
                        <OtherRow label="Outra bandeira" />
                    </SelectItem>
                </SelectContent>
            </Select>
            {selectValue === SELECT_OTHER ? (
                <Input
                    id={`${id}-other`}
                    value={value}
                    onChange={(e) => {
                        const v = e.target.value
                        onChange(v)
                        if (!v.trim()) {
                            setOtherEmpty(true)
                        }
                    }}
                    placeholder="Ex.: Nubank, Caixa…"
                    className="text-sm"
                    disabled={disabled}
                    aria-label="Nome da bandeira"
                />
            ) : null}
        </div>
    )
}
