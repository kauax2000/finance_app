"use client"

/* Heroicons são redesenhos, não escalas: o glifo de 24 tem traço fino e detalhe
   que somem quando espremido em 16. O ladrilho renderiza a 16 (`ColorTile` sm e
   md) ou a 20 (`lg`), então os dois conjuntos sólidos entram e o de contorno
   sai — era ele que estava aqui, desenhado para 24 e encolhido nas duas.

   Os dois vêm com nome, e não por `import *`: indexar um namespace derrota o
   tree-shaking e traria as ~300 peças de cada conjunto para o pacote. */
import {
    AcademicCapIcon as MicroAcademicCapIcon,
    ArrowTrendingUpIcon as MicroArrowTrendingUpIcon,
    BeakerIcon as MicroBeakerIcon,
    BoltIcon as MicroBoltIcon,
    BriefcaseIcon as MicroBriefcaseIcon,
    CakeIcon as MicroCakeIcon,
    ComputerDesktopIcon as MicroComputerDesktopIcon,
    EllipsisHorizontalIcon as MicroEllipsisHorizontalIcon,
    FaceSmileIcon as MicroFaceSmileIcon,
    GiftIcon as MicroGiftIcon,
    HeartIcon as MicroHeartIcon,
    HomeIcon as MicroHomeIcon,
    PaperAirplaneIcon as MicroPaperAirplaneIcon,
    PhoneIcon as MicroPhoneIcon,
    PuzzlePieceIcon as MicroPuzzlePieceIcon,
    ReceiptPercentIcon as MicroReceiptPercentIcon,
    ShoppingBagIcon as MicroShoppingBagIcon,
    ShoppingCartIcon as MicroShoppingCartIcon,
    TruckIcon as MicroTruckIcon,
    UserGroupIcon as MicroUserGroupIcon,
} from "@heroicons/react/16/solid"
import {
    AcademicCapIcon as MiniAcademicCapIcon,
    ArrowTrendingUpIcon as MiniArrowTrendingUpIcon,
    BeakerIcon as MiniBeakerIcon,
    BoltIcon as MiniBoltIcon,
    BriefcaseIcon as MiniBriefcaseIcon,
    CakeIcon as MiniCakeIcon,
    ComputerDesktopIcon as MiniComputerDesktopIcon,
    EllipsisHorizontalIcon as MiniEllipsisHorizontalIcon,
    FaceSmileIcon as MiniFaceSmileIcon,
    GiftIcon as MiniGiftIcon,
    HeartIcon as MiniHeartIcon,
    HomeIcon as MiniHomeIcon,
    PaperAirplaneIcon as MiniPaperAirplaneIcon,
    PhoneIcon as MiniPhoneIcon,
    PuzzlePieceIcon as MiniPuzzlePieceIcon,
    ReceiptPercentIcon as MiniReceiptPercentIcon,
    ShoppingBagIcon as MiniShoppingBagIcon,
    ShoppingCartIcon as MiniShoppingCartIcon,
    TruckIcon as MiniTruckIcon,
    UserGroupIcon as MiniUserGroupIcon,
} from "@heroicons/react/20/solid"
import type { HeroIcon } from "@/types/navigation"
import {
    FieldTitle,
} from "@/components/ui/field"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"

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

/** Nome do ícone para leitor de tela: a chave ("utensils") vazava em inglês. */
export const CATEGORY_ICON_LABELS: Record<CategoryIconId, string> = {
    utensils: "Alimentação",
    car: "Carro",
    home: "Casa",
    "gamepad-2": "Lazer",
    heart: "Saúde",
    "graduation-cap": "Educação",
    laptop: "Computador",
    briefcase: "Trabalho",
    "trending-up": "Investimentos",
    gift: "Presente",
    "shopping-cart": "Mercado",
    coffee: "Café",
    plane: "Viagem",
    phone: "Telefone",
    zap: "Energia",
    "more-horizontal": "Outros",
    "paw-print": "Pet",
    dog: "Cachorro",
    cat: "Gato",
    "users-round": "Família",
    "shopping-bag": "Compras",
    receipt: "Contas",
    bus: "Transporte público",
    bike: "Bicicleta",
    pill: "Remédios",
    stethoscope: "Médico",
}

/** O corpo do ícone acompanha a caixa em que ele é desenhado. */
type CategoryIconSet = { micro: HeroIcon; mini: HeroIcon }

const categoryIconComponents: Record<CategoryIconId, CategoryIconSet> = {
    utensils: { micro: MicroCakeIcon, mini: MiniCakeIcon },
    car: { micro: MicroTruckIcon, mini: MiniTruckIcon },
    home: { micro: MicroHomeIcon, mini: MiniHomeIcon },
    "gamepad-2": { micro: MicroPuzzlePieceIcon, mini: MiniPuzzlePieceIcon },
    heart: { micro: MicroHeartIcon, mini: MiniHeartIcon },
    "graduation-cap": { micro: MicroAcademicCapIcon, mini: MiniAcademicCapIcon },
    laptop: { micro: MicroComputerDesktopIcon, mini: MiniComputerDesktopIcon },
    briefcase: { micro: MicroBriefcaseIcon, mini: MiniBriefcaseIcon },
    "trending-up": { micro: MicroArrowTrendingUpIcon, mini: MiniArrowTrendingUpIcon },
    gift: { micro: MicroGiftIcon, mini: MiniGiftIcon },
    "shopping-cart": { micro: MicroShoppingCartIcon, mini: MiniShoppingCartIcon },
    coffee: { micro: MicroBeakerIcon, mini: MiniBeakerIcon },
    plane: { micro: MicroPaperAirplaneIcon, mini: MiniPaperAirplaneIcon },
    phone: { micro: MicroPhoneIcon, mini: MiniPhoneIcon },
    zap: { micro: MicroBoltIcon, mini: MiniBoltIcon },
    "more-horizontal": { micro: MicroEllipsisHorizontalIcon, mini: MiniEllipsisHorizontalIcon },
    "paw-print": { micro: MicroHeartIcon, mini: MiniHeartIcon },
    dog: { micro: MicroFaceSmileIcon, mini: MiniFaceSmileIcon },
    cat: { micro: MicroFaceSmileIcon, mini: MiniFaceSmileIcon },
    "users-round": { micro: MicroUserGroupIcon, mini: MiniUserGroupIcon },
    "shopping-bag": { micro: MicroShoppingBagIcon, mini: MiniShoppingBagIcon },
    receipt: { micro: MicroReceiptPercentIcon, mini: MiniReceiptPercentIcon },
    bus: { micro: MicroTruckIcon, mini: MiniTruckIcon },
    bike: { micro: MicroTruckIcon, mini: MiniTruckIcon },
    pill: { micro: MicroBeakerIcon, mini: MiniBeakerIcon },
    stethoscope: { micro: MicroHeartIcon, mini: MiniHeartIcon },
}

export function isKnownCategoryIcon(id: string | null | undefined): id is CategoryIconId {
    return Boolean(id && (CATEGORY_ICONS as readonly string[]).includes(id))
}

export function normalizeCategoryIcon(id: string | null | undefined): CategoryIconId {
    return isKnownCategoryIcon(id) ? id : CATEGORY_ICONS[0]
}

export function CategoryIconPreview({
    name,
    className,
    size = "micro",
}: {
    name: string
    className?: string
    /** `micro` para caixa de 16px, `mini` para 20px — a régua de Iconografia. */
    size?: "micro" | "mini"
}) {
    const set =
        categoryIconComponents[normalizeCategoryIcon(name)] ??
        categoryIconComponents["more-horizontal"]
    const Cmp = set[size]
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
        // Escolha única: `ToggleGroup`, com setas e sem desmarcar tudo. A cor
        // vem por `style`, que vence a tinta do estado ligado; o que marca a
        // escolhida é a borda.
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(next) => onChange(next)}
            aria-label="Cor da categoria"
            className="flex-wrap gap-2"
        >
            {CATEGORY_COLORS.map((c, i) => (
                <ToggleGroupItem
                    key={c}
                    id={`${idPrefix}-${i}`}
                    value={c}
                    className="size-8 min-w-0 rounded-full border-2 border-transparent p-0 data-[state=on]:border-foreground"
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                />
            ))}
        </ToggleGroup>
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
        <ToggleGroup
            type="single"
            variant="outline"
            size="lg"
            value={normalized}
            onValueChange={(next) => onChange(next as CategoryIconId)}
            aria-label="Ícone da categoria"
            className="flex-wrap gap-1.5"
        >
            {CATEGORY_ICONS.map((key) => (
                <ToggleGroupItem
                    key={key}
                    value={key}
                    title={CATEGORY_ICON_LABELS[key]}
                    className="size-9 text-muted-foreground"
                    aria-label={`Ícone ${CATEGORY_ICON_LABELS[key]}`}
                >
                    <CategoryIconPreview name={key} className="size-4" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
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
            {/* Títulos, e não `label`: as grades são grupos com o próprio
                `aria-label`, e um `label` sem alvo não rotula nada. */}
            <div className="space-y-2">
                <FieldTitle id={colorLabelId}>Cor</FieldTitle>
                <CategoryColorSwatches value={color} onChange={onColorChange} />
            </div>
            <div className="space-y-2">
                <FieldTitle id={iconLabelId}>Ícone</FieldTitle>
                <CategoryIconGrid value={icon} onChange={onIconChange} />
            </div>
        </>
    )
}
