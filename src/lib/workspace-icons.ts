import type { HeroIcon } from "@/types/navigation"
import {
    BookOpenIcon,
    BriefcaseIcon,
    BuildingOffice2Icon,
    CameraIcon,
    GiftIcon,
    HeartIcon,
    HomeIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    MusicalNoteIcon,
    PaperAirplaneIcon,
    ShoppingCartIcon,
    SparklesIcon,
    ArrowTrendingUpIcon,
    UserGroupIcon,
    WalletIcon,
    BoltIcon,
} from "@heroicons/react/24/outline"
import { Coffee, Dumbbell, Target } from "lucide-react"

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
    target: Target,
    zap: BoltIcon,
    coffee: Coffee,
    music: MusicalNoteIcon,
    camera: CameraIcon,
    dumbbell: Dumbbell,
    "book-open": BookOpenIcon,
    globe: GlobeAltIcon,
}

/** Saturated backgrounds; white glyphs read clearly on top. */
export const WORKSPACE_ACCENT_PALETTE = [
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#DC2626",
    "#EA580C",
    "#CA8A04",
    "#16A34A",
    "#0D9488",
    "#0891B2",
    "#4F46E5",
    "#9333EA",
    "#C026D3",
] as const

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
