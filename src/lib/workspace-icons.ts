import type { HeroIcon } from "@/types/navigation"
import { TILE_COLORS } from "@/lib/tile-palette"
/* Sólidos, como os de categoria: o ícone da carteira mora num \`ColorTile\`, que o
   desenha a 14 ou 16 (micro, \`16/solid\`), e o seletor de ícone o mostra a 20
   (mini, \`20/solid\`). O de contorno de 24, encolhido nos dois, perdia o traço.
   Com nome, e não por \`import *\`, para o tree-shaking ficar de pé. */
import {
    AcademicCapIcon as MicroAcademicCapIcon,
    ArrowTrendingUpIcon as MicroArrowTrendingUpIcon,
    BanknotesIcon as MicroBanknotesIcon,
    BeakerIcon as MicroBeakerIcon,
    BoltIcon as MicroBoltIcon,
    BookOpenIcon as MicroBookOpenIcon,
    BriefcaseIcon as MicroBriefcaseIcon,
    BuildingOffice2Icon as MicroBuildingOffice2Icon,
    BuildingStorefrontIcon as MicroBuildingStorefrontIcon,
    CakeIcon as MicroCakeIcon,
    CalculatorIcon as MicroCalculatorIcon,
    CameraIcon as MicroCameraIcon,
    ChartPieIcon as MicroChartPieIcon,
    ComputerDesktopIcon as MicroComputerDesktopIcon,
    CreditCardIcon as MicroCreditCardIcon,
    FilmIcon as MicroFilmIcon,
    FlagIcon as MicroFlagIcon,
    GiftIcon as MicroGiftIcon,
    GlobeAltIcon as MicroGlobeAltIcon,
    HeartIcon as MicroHeartIcon,
    HomeIcon as MicroHomeIcon,
    HomeModernIcon as MicroHomeModernIcon,
    LightBulbIcon as MicroLightBulbIcon,
    MusicalNoteIcon as MicroMusicalNoteIcon,
    PaperAirplaneIcon as MicroPaperAirplaneIcon,
    RocketLaunchIcon as MicroRocketLaunchIcon,
    ShoppingBagIcon as MicroShoppingBagIcon,
    ShoppingCartIcon as MicroShoppingCartIcon,
    SparklesIcon as MicroSparklesIcon,
    StarIcon as MicroStarIcon,
    SunIcon as MicroSunIcon,
    TrophyIcon as MicroTrophyIcon,
    TruckIcon as MicroTruckIcon,
    UserGroupIcon as MicroUserGroupIcon,
    WalletIcon as MicroWalletIcon,
    WrenchScrewdriverIcon as MicroWrenchScrewdriverIcon,
} from "@heroicons/react/16/solid"
import {
    AcademicCapIcon as MiniAcademicCapIcon,
    ArrowTrendingUpIcon as MiniArrowTrendingUpIcon,
    BanknotesIcon as MiniBanknotesIcon,
    BeakerIcon as MiniBeakerIcon,
    BoltIcon as MiniBoltIcon,
    BookOpenIcon as MiniBookOpenIcon,
    BriefcaseIcon as MiniBriefcaseIcon,
    BuildingOffice2Icon as MiniBuildingOffice2Icon,
    BuildingStorefrontIcon as MiniBuildingStorefrontIcon,
    CakeIcon as MiniCakeIcon,
    CalculatorIcon as MiniCalculatorIcon,
    CameraIcon as MiniCameraIcon,
    ChartPieIcon as MiniChartPieIcon,
    ComputerDesktopIcon as MiniComputerDesktopIcon,
    CreditCardIcon as MiniCreditCardIcon,
    FilmIcon as MiniFilmIcon,
    FlagIcon as MiniFlagIcon,
    GiftIcon as MiniGiftIcon,
    GlobeAltIcon as MiniGlobeAltIcon,
    HeartIcon as MiniHeartIcon,
    HomeIcon as MiniHomeIcon,
    HomeModernIcon as MiniHomeModernIcon,
    LightBulbIcon as MiniLightBulbIcon,
    MusicalNoteIcon as MiniMusicalNoteIcon,
    PaperAirplaneIcon as MiniPaperAirplaneIcon,
    RocketLaunchIcon as MiniRocketLaunchIcon,
    ShoppingBagIcon as MiniShoppingBagIcon,
    ShoppingCartIcon as MiniShoppingCartIcon,
    SparklesIcon as MiniSparklesIcon,
    StarIcon as MiniStarIcon,
    SunIcon as MiniSunIcon,
    TrophyIcon as MiniTrophyIcon,
    TruckIcon as MiniTruckIcon,
    UserGroupIcon as MiniUserGroupIcon,
    WalletIcon as MiniWalletIcon,
    WrenchScrewdriverIcon as MiniWrenchScrewdriverIcon,
} from "@heroicons/react/20/solid"

/** Stable keys stored in `workspaces.icon` (kebab-case, matches DB CHECK `workspaces_icon_allowed`). */
export const WORKSPACE_ICON_KEYS = [
    "briefcase",
    "home",
    "users",
    "plane",
    "heart",
    "shopping-cart",
    "wallet",
    "building-2",
    "laptop",
    "trending-up",
    "gift",
    "sparkles",
    "target",
    "zap",
    "coffee",
    "music",
    "camera",
    "dumbbell",
    "book-open",
    "globe",
    "banknotes",
    "credit-card",
    "calculator",
    "chart-pie",
    "building-storefront",
    "home-modern",
    "shopping-bag",
    "truck",
    "academic-cap",
    "trophy",
    "rocket-launch",
    "light-bulb",
    "cake",
    "sun",
    "film",
    "wrench-screwdriver",
    "star",
] as const

export type WorkspaceIconKey = (typeof WORKSPACE_ICON_KEYS)[number]

/**
 * O que o seletor oferece. `dumbbell` fica de fora: o Heroicons não tem haltere,
 * e ele desenhava o mesmo raio de `zap`. A chave continua válida — a carteira
 * que já a usa segue com o raio.
 */
export const WORKSPACE_ICON_PICKER_KEYS = WORKSPACE_ICON_KEYS.filter(
    (key) => key !== "dumbbell"
)

/** Nome do ícone para leitor de tela: a chave ("building-2") vazava em inglês. */
export const WORKSPACE_ICON_LABELS: Record<WorkspaceIconKey, string> = {
    briefcase: "Trabalho",
    home: "Casa",
    users: "Família",
    plane: "Viagem",
    heart: "Coração",
    "shopping-cart": "Mercado",
    wallet: "Carteira",
    "building-2": "Empresa",
    laptop: "Computador",
    "trending-up": "Investimentos",
    gift: "Presentes",
    sparkles: "Especial",
    target: "Meta",
    zap: "Energia",
    coffee: "Café",
    music: "Música",
    camera: "Fotografia",
    dumbbell: "Academia",
    "book-open": "Estudos",
    globe: "Mundo",
    banknotes: "Dinheiro",
    "credit-card": "Cartão",
    calculator: "Contas",
    "chart-pie": "Orçamento",
    "building-storefront": "Loja",
    "home-modern": "Imóvel",
    "shopping-bag": "Compras",
    truck: "Transporte",
    "academic-cap": "Educação",
    trophy: "Conquista",
    "rocket-launch": "Projeto",
    "light-bulb": "Ideias",
    cake: "Festa",
    sun: "Férias",
    film: "Lazer",
    "wrench-screwdriver": "Reforma",
    star: "Favorita",
}

export function isWorkspaceIconKey(value: string): value is WorkspaceIconKey {
    return (WORKSPACE_ICON_KEYS as readonly string[]).includes(value)
}

/** O conjunto do ladrilho (14–16px). */
export const WORKSPACE_ICON_MAP: Record<WorkspaceIconKey, HeroIcon> = {
    briefcase: MicroBriefcaseIcon,
    home: MicroHomeIcon,
    users: MicroUserGroupIcon,
    plane: MicroPaperAirplaneIcon,
    heart: MicroHeartIcon,
    "shopping-cart": MicroShoppingCartIcon,
    wallet: MicroWalletIcon,
    "building-2": MicroBuildingOffice2Icon,
    laptop: MicroComputerDesktopIcon,
    "trending-up": MicroArrowTrendingUpIcon,
    gift: MicroGiftIcon,
    sparkles: MicroSparklesIcon,
    target: MicroFlagIcon,
    zap: MicroBoltIcon,
    coffee: MicroBeakerIcon,
    music: MicroMusicalNoteIcon,
    camera: MicroCameraIcon,
    dumbbell: MicroBoltIcon,
    "book-open": MicroBookOpenIcon,
    globe: MicroGlobeAltIcon,
    banknotes: MicroBanknotesIcon,
    "credit-card": MicroCreditCardIcon,
    calculator: MicroCalculatorIcon,
    "chart-pie": MicroChartPieIcon,
    "building-storefront": MicroBuildingStorefrontIcon,
    "home-modern": MicroHomeModernIcon,
    "shopping-bag": MicroShoppingBagIcon,
    truck: MicroTruckIcon,
    "academic-cap": MicroAcademicCapIcon,
    trophy: MicroTrophyIcon,
    "rocket-launch": MicroRocketLaunchIcon,
    "light-bulb": MicroLightBulbIcon,
    cake: MicroCakeIcon,
    sun: MicroSunIcon,
    film: MicroFilmIcon,
    "wrench-screwdriver": MicroWrenchScrewdriverIcon,
    star: MicroStarIcon,
}

/** O conjunto do seletor de ícone (20px). */
export const WORKSPACE_ICON_MAP_MINI: Record<WorkspaceIconKey, HeroIcon> = {
    briefcase: MiniBriefcaseIcon,
    home: MiniHomeIcon,
    users: MiniUserGroupIcon,
    plane: MiniPaperAirplaneIcon,
    heart: MiniHeartIcon,
    "shopping-cart": MiniShoppingCartIcon,
    wallet: MiniWalletIcon,
    "building-2": MiniBuildingOffice2Icon,
    laptop: MiniComputerDesktopIcon,
    "trending-up": MiniArrowTrendingUpIcon,
    gift: MiniGiftIcon,
    sparkles: MiniSparklesIcon,
    target: MiniFlagIcon,
    zap: MiniBoltIcon,
    coffee: MiniBeakerIcon,
    music: MiniMusicalNoteIcon,
    camera: MiniCameraIcon,
    dumbbell: MiniBoltIcon,
    "book-open": MiniBookOpenIcon,
    globe: MiniGlobeAltIcon,
    banknotes: MiniBanknotesIcon,
    "credit-card": MiniCreditCardIcon,
    calculator: MiniCalculatorIcon,
    "chart-pie": MiniChartPieIcon,
    "building-storefront": MiniBuildingStorefrontIcon,
    "home-modern": MiniHomeModernIcon,
    "shopping-bag": MiniShoppingBagIcon,
    truck: MiniTruckIcon,
    "academic-cap": MiniAcademicCapIcon,
    trophy: MiniTrophyIcon,
    "rocket-launch": MiniRocketLaunchIcon,
    "light-bulb": MiniLightBulbIcon,
    cake: MiniCakeIcon,
    sun: MiniSunIcon,
    film: MiniFilmIcon,
    "wrench-screwdriver": MiniWrenchScrewdriverIcon,
    star: MiniStarIcon,
}

/**
 * As amostras de cor da carteira: **as oito paradas do arco-íris da marca**,
 * reexportadas de `lib/tile-palette` para não haver duas listas.
 *
 * Eram doze hexadecimais crus do Tailwind 600, e a linha que descrevia esta
 * constante — *"saturated backgrounds; white glyphs read clearly on top"* — era
 * a prova de que ninguém a revisitara: glifo branco sobre preenchimento
 * saturado é exatamente o desenho que o `ColorTile` abandonou, por reprovar nos
 * 3:1 da WCAG 1.4.11 em 4 dos 10 presets. Hoje quem decide a tinta é o
 * ladrilho, pela claridade do sistema.
 *
 * O seletor livre da carteira continua de pé: o que a pessoa digitar à mão não
 * é dobrado.
 */
export const WORKSPACE_ACCENT_PALETTE = TILE_COLORS

export function randomWorkspaceAccentColor(): string {
    const i = Math.floor(Math.random() * WORKSPACE_ACCENT_PALETTE.length)
    return WORKSPACE_ACCENT_PALETTE[i]!
}

export function getWorkspaceIconComponent(
    key: string
): HeroIcon | undefined {
    if (!isWorkspaceIconKey(key)) return undefined
    return WORKSPACE_ICON_MAP[key]
}
