"use client"

import { useState } from "react"
import {
    Bus,
    Car,
    Cat,
    Coffee,
    Dog,
    Gamepad2,
    PawPrint,
    Pill,
    Stethoscope,
    Utensils,
    Bike,
} from "lucide-react"
import {
    BriefcaseIcon,
    GiftIcon,
    AcademicCapIcon,
    HeartIcon,
    HomeIcon,
    ComputerDesktopIcon,
    EllipsisHorizontalIcon,
    PhoneIcon,
    PaperAirplaneIcon,
    ReceiptPercentIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon,
    BoltIcon,
} from "@heroicons/react/24/outline"
import type { HeroIcon } from "@/types/navigation"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export const CATEGORY_COLORS = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#6366F6",
    "#14B8A6",
    "#F97316",
    "#6B7280",
] as const

export const CATEGORY_ICONS = [
    "utensils",
    "car",
    "home",
    "gamepad-2",
    "heart",
    "graduation-cap",
    "laptop",
    "briefcase",
    "trending-up",
    "gift",
    "shopping-cart",
    "coffee",
    "plane",
    "phone",
    "zap",
    "more-horizontal",
    "paw-print",
    "dog",
    "cat",
    "users-round",
    "shopping-bag",
    "receipt",
    "bus",
    "bike",
    "pill",
    "stethoscope",
] as const

export type CategoryIconId = (typeof CATEGORY_ICONS)[number]

const categoryIconComponents: Record<CategoryIconId, HeroIcon> = {
    utensils: Utensils,
    car: Car,
    home: HomeIcon,
    "gamepad-2": Gamepad2,
    heart: HeartIcon,
    "graduation-cap": AcademicCapIcon,
    laptop: ComputerDesktopIcon,
    briefcase: BriefcaseIcon,
    "trending-up": ArrowTrendingUpIcon,
    gift: GiftIcon,
    "shopping-cart": ShoppingCartIcon,
    coffee: Coffee,
    plane: PaperAirplaneIcon,
    phone: PhoneIcon,
    zap: BoltIcon,
    "more-horizontal": EllipsisHorizontalIcon,
    "paw-print": PawPrint,
    dog: Dog,
    cat: Cat,
    "users-round": UserGroupIcon,
    "shopping-bag": ShoppingBagIcon,
    receipt: ReceiptPercentIcon,
    bus: Bus,
    bike: Bike,
    pill: Pill,
    stethoscope: Stethoscope,
}

export function isKnownCategoryIcon(id: string | null | undefined): id is CategoryIconId {
    return Boolean(id && (CATEGORY_ICONS as readonly string[]).includes(id))
}

export function normalizeCategoryIcon(id: string | null | undefined): CategoryIconId {
    return isKnownCategoryIcon(id) ? id : CATEGORY_ICONS[0]
}

export function CategoryIconPreview({ name, className }: { name: string; className?: string }) {
    const Cmp = categoryIconComponents[normalizeCategoryIcon(name)] ?? EllipsisHorizontalIcon
    return <Cmp className={className} aria-hidden />
}

export function CategoryColorSwatches({
    value,
    onChange,
    idPrefix = "cat-color",
}: {
    value: string
    onChange: (color: string) => void
    idPrefix?: string
}) {
    return (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cor da categoria">
            {CATEGORY_COLORS.map((c, i) => (
                <button
                    key={c}
                    id={`${idPrefix}-${i}`}
                    type="button"
                    onClick={() => onChange(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-shadow ${
                        value === c ? "border-gray-900 dark:border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                    aria-pressed={value === c}
                />
            ))}
        </div>
    )
}

export function CategoryIconGrid({
    value,
    onChange,
}: {
    value: string
    onChange: (icon: CategoryIconId) => void
}) {
    const normalized = normalizeCategoryIcon(value)

    return (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ícone da categoria">
            {CATEGORY_ICONS.map((key) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    title={key}
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        normalized === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/80 bg-background",
                    )}
                    aria-label={`Ícone ${key}`}
                    aria-pressed={normalized === key}
                >
                    <CategoryIconPreview name={key} className="h-4 w-4" />
                </button>
            ))}
        </div>
    )
}

/** Labels + Cor + Ícone blocks for dialogs and sheets (parent supplies name + tipo UI). */
export function CategoryAppearanceFields({
    color,
    onColorChange,
    icon,
    onIconChange,
    colorLabelId = "category-appearance-color",
    iconLabelId = "category-appearance-icon",
}: {
    color: string
    onColorChange: (c: string) => void
    icon: string
    onIconChange: (i: CategoryIconId) => void
    colorLabelId?: string
    iconLabelId?: string
}) {
    return (
        <>
            <div className="space-y-2">
                <Label id={colorLabelId}>Cor</Label>
                <CategoryColorSwatches value={color} onChange={onColorChange} />
            </div>
            <div className="space-y-2">
                <Label id={iconLabelId}>Ícone</Label>
                <CategoryIconGrid value={icon} onChange={onIconChange} />
            </div>
        </>
    )
}
