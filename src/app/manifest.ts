import type { MetadataRoute } from "next"

const ICONS_BASE = "/icons"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Finance App - Controle de Finanças",
        short_name: "Finance",
        description: "Aplicativo para controle de finanças pessoais",
        start_url: "/dashboard",
        scope: "/",
        id: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        background_color: "#fafafa",
        theme_color: "#fafafa",
        orientation: "portrait-primary",
        lang: "pt-BR",
        dir: "ltr",
        categories: ["finance", "productivity"],
        icons: [
            {
                src: `${ICONS_BASE}/icon-192.png`,
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: `${ICONS_BASE}/icon-512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: `${ICONS_BASE}/icon-512-maskable.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        shortcuts: [
            {
                name: "Nova transação",
                short_name: "Transação",
                url: "/transactions?new=1",
                icons: [{ src: `${ICONS_BASE}/icon-192.png`, sizes: "192x192", type: "image/png" }],
            },
            {
                name: "Dashboard",
                short_name: "Início",
                url: "/dashboard",
                icons: [{ src: `${ICONS_BASE}/icon-192.png`, sizes: "192x192", type: "image/png" }],
            },
        ],
    }
}
