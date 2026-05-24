/** Theme colors aligned with :root / .dark --background in globals.css */
export const PWA_THEME_COLORS = {
    light: "#fafafa",
    dark: "#252525",
} as const

export const PWA_INSTALL_VISITS_KEY = "finance-pwa-install-visits"
export const PWA_INSTALL_DISMISSED_KEY = "finance-pwa-install-dismissed"

/** Bump when home-screen / favicon PNGs change so iOS Safari refetches instead of reusing a cached bitmap. */
export const PWA_ICON_VERSION = "3"
