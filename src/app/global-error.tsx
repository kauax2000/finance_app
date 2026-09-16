"use client"

import { useEffect } from "react"
import { ROUTES } from "@/config/navigation"

export default function GlobalError({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string }
    unstable_retry: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <title>Algo deu errado · Finance</title>
            </head>
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
                        {/* Cru de propósito, e com estilo em linha: esta página
                            substitui o layout raiz inteiro (tem o próprio <html>),
                            e é a que aparece quando o resto quebrou — o CSS do
                            sistema pode não ter carregado. */}
                        <button
                            type="button"
                            onClick={unstable_retry}
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
                    {/* A mensagem crua só em desenvolvimento; em produção ela
                        pode carregar detalhe interno e não ajuda quem usa. */}
                    {process.env.NODE_ENV === "development" && error.message ? (
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
