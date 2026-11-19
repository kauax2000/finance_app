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
    FilmIcon as MicroFilmIcon,
    MusicalNoteIcon as MicroMusicalNoteIcon,
    BookOpenIcon as MicroBookOpenIcon,
    WrenchScrewdriverIcon as MicroWrenchScrewdriverIcon,
    BanknotesIcon as MicroBanknotesIcon,
    CreditCardIcon as MicroCreditCardIcon,
    TvIcon as MicroTvIcon,
    WifiIcon as MicroWifiIcon,
    FireIcon as MicroFireIcon,
    GlobeAmericasIcon as MicroGlobeAmericasIcon,
    ScissorsIcon as MicroScissorsIcon,
    SparklesIcon as MicroSparklesIcon,
    DevicePhoneMobileIcon as MicroDevicePhoneMobileIcon,
    TrophyIcon as MicroTrophyIcon,
    KeyIcon as MicroKeyIcon,
    ShieldCheckIcon as MicroShieldCheckIcon,
    LightBulbIcon as MicroLightBulbIcon,
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
    FilmIcon as MiniFilmIcon,
    MusicalNoteIcon as MiniMusicalNoteIcon,
    BookOpenIcon as MiniBookOpenIcon,
    WrenchScrewdriverIcon as MiniWrenchScrewdriverIcon,
    BanknotesIcon as MiniBanknotesIcon,
    CreditCardIcon as MiniCreditCardIcon,
    TvIcon as MiniTvIcon,
    WifiIcon as MiniWifiIcon,
    FireIcon as MiniFireIcon,
    GlobeAmericasIcon as MiniGlobeAmericasIcon,
    ScissorsIcon as MiniScissorsIcon,
    SparklesIcon as MiniSparklesIcon,
    DevicePhoneMobileIcon as MiniDevicePhoneMobileIcon,
    TrophyIcon as MiniTrophyIcon,
    KeyIcon as MiniKeyIcon,
    ShieldCheckIcon as MiniShieldCheckIcon,
    LightBulbIcon as MiniLightBulbIcon,
    UserGroupIcon as MiniUserGroupIcon,
} from "@heroicons/react/20/solid"
import { CheckIcon, EyeDropperIcon } from "@heroicons/react/16/solid"
import type { HeroIcon } from "@/types/navigation"
import { Label } from "@/components/ui/label"
import { toggleStyle, toggleVariants } from "@/components/ui/toggle"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
    TILE_COLORS,
    TILE_PALETTE,
    TILE_WORKSPACE_DEFAULT,
    tileColorFor,
} from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

/**
 * As amostras de cor da categoria: **as oito paradas do arco-íris da marca**,
 * reexportadas de `lib/tile-palette` para não haver duas listas.
 *
 * Eram dez hexadecimais crus do Tailwind 500 — e um deles, `#6366F6`, era o
 * indigo-500 com um dígito trocado (`#6366F1`) que ninguém viu, porque o
 * ladrilho normaliza a claridade e o erro some. O que já está gravado no banco
 * é dobrado na leitura por `tileColorFor`; nada foi reescrito.
 */
export const CATEGORY_COLORS = TILE_COLORS

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
    "film",
    "music",
    "book-open",
    "wrench",
    "banknotes",
    "credit-card",
    "tv",
    "wifi",
    "fire",
    "globe",
    "scissors",
    "sparkles",
    "smartphone",
    "trophy",
    "key",
    "shield",
    "light-bulb",
] as const

export type CategoryIconId = (typeof CATEGORY_ICONS)[number]

/** O que a grade oferece: um desenho por id. Os ids que o Heroicons não separa
    de outro (pet, cachorro, gato, ônibus, bicicleta, remédio, médico) seguem em
    `CATEGORY_ICONS` para as categorias já gravadas, mas não são escolha nova. */
export const CATEGORY_GRID_ICONS: readonly CategoryIconId[] = [
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
    "users-round",
    "shopping-bag",
    "receipt",
    "film",
    "music",
    "book-open",
    "wrench",
    "banknotes",
    "credit-card",
    "tv",
    "wifi",
    "fire",
    "globe",
    "scissors",
    "sparkles",
    "smartphone",
    "trophy",
    "key",
    "shield",
    "light-bulb",
]

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
    "film": "Cinema e streaming",
    "music": "Música",
    "book-open": "Livros",
    "wrench": "Manutenção",
    "banknotes": "Dinheiro",
    "credit-card": "Cartão",
    "tv": "TV",
    "wifi": "Internet",
    "fire": "Gás",
    "globe": "Viagem internacional",
    "scissors": "Beleza",
    "sparkles": "Limpeza",
    "smartphone": "Celular",
    "trophy": "Esportes",
    "key": "Aluguel",
    "shield": "Seguros",
    "light-bulb": "Luz",
}

/** O corpo do ícone acompanha a caixa em que ele é desenhado. */
type CategoryIconSet = { micro: HeroIcon; mini: HeroIcon }

export const categoryIconComponents: Record<CategoryIconId, CategoryIconSet> = {
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
    "film": { micro: MicroFilmIcon, mini: MiniFilmIcon },
    "music": { micro: MicroMusicalNoteIcon, mini: MiniMusicalNoteIcon },
    "book-open": { micro: MicroBookOpenIcon, mini: MiniBookOpenIcon },
    "wrench": { micro: MicroWrenchScrewdriverIcon, mini: MiniWrenchScrewdriverIcon },
    "banknotes": { micro: MicroBanknotesIcon, mini: MiniBanknotesIcon },
    "credit-card": { micro: MicroCreditCardIcon, mini: MiniCreditCardIcon },
    "tv": { micro: MicroTvIcon, mini: MiniTvIcon },
    "wifi": { micro: MicroWifiIcon, mini: MiniWifiIcon },
    "fire": { micro: MicroFireIcon, mini: MiniFireIcon },
    "globe": { micro: MicroGlobeAmericasIcon, mini: MiniGlobeAmericasIcon },
    "scissors": { micro: MicroScissorsIcon, mini: MiniScissorsIcon },
    "sparkles": { micro: MicroSparklesIcon, mini: MiniSparklesIcon },
    "smartphone": { micro: MicroDevicePhoneMobileIcon, mini: MiniDevicePhoneMobileIcon },
    "trophy": { micro: MicroTrophyIcon, mini: MiniTrophyIcon },
    "key": { micro: MicroKeyIcon, mini: MiniKeyIcon },
    "shield": { micro: MicroShieldCheckIcon, mini: MiniShieldCheckIcon },
    "light-bulb": { micro: MicroLightBulbIcon, mini: MiniLightBulbIcon },
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
    const cor = tileColorFor(value) ?? ""
    const daPaleta =
        TILE_PALETTE.find(({ hex }) => hex.toLowerCase() === cor.toLowerCase())?.hex ?? ""

    return (
        // Escolha única: `ToggleGroup`, com setas e sem desmarcar tudo. A
        // amostra é a do sistema (`variant="swatch"`): a cor na claridade do
        // `ColorTile`, e a escolhida com contorno e tique.
        <ToggleGroup
            type="single"
            variant="swatch"
            size="icon-md"
            value={daPaleta}
            onValueChange={(next) => {
                if (next) onChange(next)
            }}
            aria-label="Cor da categoria"
            className="flex-wrap justify-start gap-2"
        >
            {TILE_PALETTE.map(({ hex, nome }, i) => (
                <ToggleGroupItem
                    key={hex}
                    id={`${idPrefix}-${i}`}
                    value={hex}
                    color={hex}
                    /* A paleta passou a ter nome, então a amostra para de
                       soletrar um hexadecimal no leitor de tela. */
                    aria-label={`Cor ${nome}`}
                />
            ))}
            {/* A cor livre é a nona amostra, como na carteira: o seletor
                nativo mora escondido num `Label` que veste a amostra. */}
            <Label
                data-state={daPaleta ? "off" : "on"}
                className={cn(
                    toggleVariants({ variant: "swatch", size: "icon-md" }),
                    "relative cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-ring/45"
                )}
                style={toggleStyle(daPaleta ? null : cor)}
            >
                {daPaleta ? <EyeDropperIcon className="size-4" aria-hidden /> : <CheckIcon className="size-4" aria-hidden />}
                <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(cor) ? cor : TILE_WORKSPACE_DEFAULT}
                    onChange={(e) => onChange(e.target.value)}
                    className="sr-only"
                    aria-label="Outra cor"
                />
            </Label>
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
    // Ícone antigo fora da grade: aparece primeiro e marcado, para não se perder ao editar.
    const ids = CATEGORY_GRID_ICONS.includes(normalized)
        ? CATEGORY_GRID_ICONS
        : [normalized, ...CATEGORY_GRID_ICONS]

    return (
        <ToggleGroup
            type="single"
            variant="outline"
            size="icon-lg"
            value={normalized}
            onValueChange={(next) => {
                if (next) onChange(next as CategoryIconId)
            }}
            aria-label="Ícone da categoria"
            className="flex-wrap justify-start gap-1.5"
        >
            {ids.map((key) => (
                <ToggleGroupItem
                    key={key}
                    value={key}
                    title={CATEGORY_ICON_LABELS[key]}
                    aria-label={`Ícone ${CATEGORY_ICON_LABELS[key]}`}
                >
                    <CategoryIconPreview name={key} className="size-4" />
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    )
}
