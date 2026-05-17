"use client"

import { useEffect } from "react"
import { ROUTES } from "@/config/navigation"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body
                style={{
                    margin: 0,
                    minHeight: "100dvh",
                    boxSizing: "border-box",
                    fontFamily:
                        "ui-sans-serif, system-ui, -apple-system, sans-serif",
                    background: "#0a0a0a",
                    color: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 16,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 448,
                        border: "1px solid #2a2a2a",
                        borderRadius: 12,
                        padding: 24,
                        background: "#141414",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                    }}
                >
                    <h1
                        style={{
                            margin: "0 0 12px",
                            fontSize: 20,
                            fontWeight: 600,
                            lineHeight: 1.3,
                        }}
                    >
                        Algo deu errado
                    </h1>
                    <p style={{ margin: "0 0 20px", fontSize: 14, color: "#a3a3a3" }}>
                        Ocorreu um erro crítico ao carregar a aplicação. Tente
                        novamente ou volte mais tarde.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <button
                            type="button"
                            onClick={reset}
                            style={{
                                cursor: "pointer",
                                height: 36,
                                padding: "0 14px",
                                borderRadius: 8,
                                border: "1px solid #2d6a4e",
                                background: "#2d6a4e",
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            Tentar novamente
                        </button>
                        <a
                            href={ROUTES.DASHBOARD}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                height: 36,
                                padding: "0 14px",
                                borderRadius: 8,
                                border: "1px solid #404040",
                                background: "transparent",
                                color: "#fafafa",
                                fontSize: 14,
                                fontWeight: 500,
                                textDecoration: "none",
                            }}
                        >
                            Ir para o painel
                        </a>
                    </div>
                    {error.message ? (
                        <p
                            style={{
                                marginTop: 16,
                                fontSize: 12,
                                color: "#737373",
                                wordBreak: "break-word",
                                fontFamily:
                                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                            }}
                        >
                            {error.message}
                        </p>
                    ) : null}
                </div>
            </body>
        </html>
    )
}
