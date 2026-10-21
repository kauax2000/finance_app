import type { ReactNode } from "react"

/**
 * A moldura de todo wireframe: de propósito fora do design system (AGENTS.md,
 * "Funcionalidade nova entra em wireframe"). Na revisão da tela ela some.
 */
export function WireframeBox({ bloco, titulo, children }: { bloco: number; titulo: string; children: ReactNode }) {
    const etiqueta = `WIREFRAME · Bloco ${bloco} · ${titulo}`
    return (
        <section
            aria-label={etiqueta}
            className="space-y-3 rounded-row border border-dashed border-muted-foreground/60 bg-muted/40 p-4 font-mono text-xs text-muted-foreground"
        >
            <p className="font-bold tracking-wide">{etiqueta}</p>
            {children}
        </section>
    )
}
