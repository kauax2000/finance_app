"use client"

import type { ComponentProps } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
    const { resolvedTheme } = useTheme()

    return (
        <Sonner
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            position="top-right"
            richColors
            closeButton
            className="toaster group z-[100]"
            offset="1rem"
            mobileOffset={{
                top: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
            }}
            toastOptions={{
                duration: 4000,
                classNames: {
                    toast: "group toast",
                },
            }}
            {...props}
        />
    )
}
