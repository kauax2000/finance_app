import type { MetadataRoute } from "next"
import { pwaIconSrc } from "@/lib/pwa/icon-url"

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
        // O compartilhar do Android: o texto vira a frase rápida (Bloco 3A, Decisão 4), e a
        // foto ou o PDF vai ao service worker, que guarda o arquivo e redireciona com 303
        // (Bloco 3B, Decisão 12; `src/lib/captura/compartilhado.ts`).
        share_target: {
            action: "/transactions/compartilhar",
            method: "POST",
            enctype: "multipart/form-data",
            params: {
                title: "frase_titulo",
                text: "frase",
                url: "frase_url",
                files: [{ name: "files", accept: ["image/*", "application/pdf"] }],
            },
        },
        icons: [
            {
                src: pwaIconSrc("icon-192.png"),
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: pwaIconSrc("icon-512.png"),
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: pwaIconSrc("icon-512-maskable.png"),
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
        ],
        shortcuts: [
            {
                name: "Nova despesa",
                short_name: "Despesa",
                url: "/transactions?new=1",
                icons: [{ src: pwaIconSrc("icon-192.png"), sizes: "192x192", type: "image/png" }],
            },
            {
                name: "A conferir",
                short_name: "Conferir",
                url: "/transactions?conferir=1",
                icons: [{ src: pwaIconSrc("icon-192.png"), sizes: "192x192", type: "image/png" }],
            },
            {
                name: "Painel",
                short_name: "Painel",
                url: "/dashboard",
                icons: [{ src: pwaIconSrc("icon-192.png"), sizes: "192x192", type: "image/png" }],
            },
        ],
    }
}
