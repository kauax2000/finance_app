import type { HeroIcon } from "@/types/navigation"
import { TILE_COLORS } from "@/lib/tile-palette"
import {
    ArrowTrendingUpIcon,
    BeakerIcon,
    BoltIcon,
    BookOpenIcon,
    BriefcaseIcon,
    BuildingOffice2Icon,
    CameraIcon,
    ComputerDesktopIcon,
    FlagIcon,
    GiftIcon,
    GlobeAltIcon,
    HeartIcon,
    HomeIcon,
    MusicalNoteIcon,
    PaperAirplaneIcon,
    ShoppingCartIcon,
    SparklesIcon,
    UserGroupIcon,
    WalletIcon,
} from "@heroicons/react/24/outline"

/** Stable keys stored in `workspaces.icon` (kebab-case, matches DB CHECK). */
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
] as const

export type WorkspaceIconKey = (typeof WORKSPACE_ICON_KEYS)[number]

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
}

export function isWorkspaceIconKey(value: string): value is WorkspaceIconKey {
    return (WORKSPACE_ICON_KEYS as readonly string[]).includes(value)
}

export const WORKSPACE_ICON_MAP: Record<WorkspaceIconKey, HeroIcon> = {
    briefcase: BriefcaseIcon,
    home: HomeIcon,
    users: UserGroupIcon,
    plane: PaperAirplaneIcon,
    heart: HeartIcon,
    "shopping-cart": ShoppingCartIcon,
    wallet: WalletIcon,
    "building-2": BuildingOffice2Icon,
    laptop: ComputerDesktopIcon,
    "trending-up": ArrowTrendingUpIcon,
    gift: GiftIcon,
    sparkles: SparklesIcon,
    target: FlagIcon,
    zap: BoltIcon,
    coffee: BeakerIcon,
    music: MusicalNoteIcon,
    camera: CameraIcon,
    dumbbell: BoltIcon,
    "book-open": BookOpenIcon,
    globe: GlobeAltIcon,
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
