import { useId } from "react"

/**
 * O orbe da Siri na legenda do passo 1 do atalho: um desenho (não o logo da Apple),
 * três brilhos radiais nas cores da marca sobre um fundo escuro. Pictograma pedido pelo
 * dono; mora em `DRAWN_SVG_FILES` do auditor.
 */
export function OrbeDaSiri({ className }: { className?: string }) {
    // Cada orbe tem os próprios ids: o fantasma da caixa do passo desenha outro na mesma página.
    const id = useId().replace(/[^a-zA-Z0-9]/g, "")
    const brilhos = [
        { cor: "var(--brand-magenta)", cx: "30%", cy: "30%" },
        { cor: "var(--brand-blue)", cx: "72%", cy: "40%" },
        { cor: "var(--brand-violet)", cx: "45%", cy: "75%" },
    ]
    return (
        <svg aria-hidden viewBox="0 0 40 40" className={className}>
            <defs>
                {brilhos.map((b, i) => (
                    <radialGradient key={i} id={`${id}-${i}`} cx={b.cx} cy={b.cy}>
                        <stop offset="0" style={{ stopColor: b.cor }} />
                        <stop offset="1" style={{ stopColor: b.cor, stopOpacity: 0 }} />
                    </radialGradient>
                ))}
            </defs>
            <circle cx="20" cy="20" r="19" className="fill-(--device-bezel)" />
            {brilhos.map((_, i) => (
                <circle key={i} cx="20" cy="20" r="17" fill={`url(#${id}-${i})`} />
            ))}
            <circle cx="20" cy="20" r="18.5" fill="none" strokeWidth="1" className="stroke-scrim-foreground/35" />
        </svg>
    )
}
