"use client"

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
    type MouseEvent,
} from "react"
import { cn } from "@/lib/utils"

const MAX_DEG = 11
/** Scales normalized tilt for gradient/glare motion (does not change physical rotation). */
const GLARE_GAIN = 1.85
const GLARE_CLAMP = 1.2
/** Lerp toward desired tilt. */
const SMOOTHING_ALPHA = 0.32
const MIN_FRAME_MS = 16

export type CreditCardFaceTiltProps = {
    children: ReactNode
    className?: string
    disabled?: boolean
}

/**
 * 3D tilt from pointer position (edge under cursor recedes). Disabled when
 * `prefers-reduced-motion: reduce`.
 *
 * Só anima sob o cursor. Havia uma oscilação ociosa num requestAnimationFrame
 * sem fim, com setState a cada quadro em cada cartão da tela — uma lista de
 * cartões re-renderizava 60 vezes por segundo parada. Ao sair, a transição CSS
 * leva o cartão ao neutro e o loop para.
 */
export function CreditCardFaceTilt({
    children,
    className,
    disabled = false,
}: CreditCardFaceTiltProps) {
    const rootRef = useRef<HTMLDivElement>(null)
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
    const [reduceMotion, setReduceMotion] = useState(false)
    const [hovered, setHovered] = useState(false)
    const rafRef = useRef<number | null>(null)
    const lastFrameRef = useRef(0)
    const desiredRef = useRef({ rx: 0, ry: 0 })
    const currentRef = useRef({ rx: 0, ry: 0 })

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduceMotion(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    const stopRaf = useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    useEffect(() => {
        const active = !disabled && !reduceMotion && hovered
        if (!active) {
            stopRaf()
            return
        }

        const loop = (ts: number) => {
            rafRef.current = requestAnimationFrame(loop)
            if (document.visibilityState === "hidden") return

            if (ts - lastFrameRef.current < MIN_FRAME_MS) return
            lastFrameRef.current = ts

            const d = desiredRef.current
            const c = currentRef.current
            const next = {
                rx: c.rx + (d.rx - c.rx) * SMOOTHING_ALPHA,
                ry: c.ry + (d.ry - c.ry) * SMOOTHING_ALPHA,
            }
            currentRef.current = next
            setTilt(next)
        }

        rafRef.current = requestAnimationFrame(loop)
        return () => {
            stopRaf()
        }
    }, [disabled, reduceMotion, hovered, stopRaf])

    const onMove = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            if (disabled || reduceMotion) return
            const el = rootRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const x = (e.clientX - r.left) / r.width - 0.5
            const y = (e.clientY - r.top) / r.height - 0.5
            desiredRef.current = {
                ry: x * MAX_DEG * 2,
                rx: -y * MAX_DEG * 2,
            }
        },
        [disabled, reduceMotion]
    )

    const onLeave = useCallback(() => {
        setHovered(false)
        desiredRef.current = { rx: 0, ry: 0 }
        currentRef.current = { rx: 0, ry: 0 }
        setTilt({ rx: 0, ry: 0 })
    }, [])

    const onEnter = useCallback(() => {
        setHovered(true)
    }, [])

    const active = !disabled && !reduceMotion

    return (
        <div
            ref={rootRef}
            className={cn("[perspective:1200px]", className)}
            onMouseEnter={onEnter}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
        >
            <div
                className={cn(
                    "origin-center will-change-transform [transform-style:preserve-3d]",
                    active && "transition-[transform] duration-200 ease-out"
                )}
                style={
                    active
                        ? (() => {
                              const nx = tilt.ry / (MAX_DEG * 2)
                              const ny = tilt.rx / (MAX_DEG * 2)
                              const tx = Math.max(-1, Math.min(1, nx))
                              const ty = Math.max(-1, Math.min(1, ny))
                              const gx = Math.max(
                                  -GLARE_CLAMP,
                                  Math.min(GLARE_CLAMP, nx * GLARE_GAIN)
                              )
                              const gy = Math.max(
                                  -GLARE_CLAMP,
                                  Math.min(GLARE_CLAMP, ny * GLARE_GAIN)
                              )
                              return {
                                  transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0)`,
                                  ["--cc-tilt-x" as never]: String(tx),
                                  ["--cc-tilt-y" as never]: String(ty),
                                  ["--cc-glare-x" as never]: String(gx),
                                  ["--cc-glare-y" as never]: String(gy),
                              }
                          })()
                        : undefined
                }
            >
                {children}
            </div>
        </div>
    )
}
