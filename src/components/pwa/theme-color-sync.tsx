"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"
import { PWA_THEME_COLORS } from "@/lib/pwa/constants"

const META_NAME = "theme-color"

export function ThemeColorSync() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const color =
            resolvedTheme === "dark" ? PWA_THEME_COLORS.dark : PWA_THEME_COLORS.light

        let meta = document.querySelector(`meta[name="${META_NAME}"]`)
        if (!meta) {
            meta = document.createElement("meta")
            meta.setAttribute("name", META_NAME)
            document.head.appendChild(meta)
        }
        meta.setAttribute("content", color)
    }, [resolvedTheme])

    return null
}
