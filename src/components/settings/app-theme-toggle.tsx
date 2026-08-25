"use client"

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Switch as SwitchPrimitive } from "radix-ui"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Alternador de tema: um switch com as duas faces visíveis.
 *
 * Era um par de botões com `aria-pressed` e um indicador deslizante por baixo.
 * O desenho estava certo; a semântica é que pedia duas paradas de tabulação e
 * dois nomes acessíveis para uma decisão binária. Sobre o `Switch` do Radix ele
 * vira um controle só, com `role="switch"`, `aria-checked` e Espaço/Enter de
 * graça.
 *
 * A lua e o sol continuam **os dois** desenhados, e é isso que separa este
 * switch de um liga/desliga: num switch nu, "marcado" não diz qual tema é. Aqui
 * o polegar desliza por baixo dos dois ícones e acende o que está valendo, então
 * o controle continua respondendo "qual dos dois" e não "ligado ou não".
 */
export function AppThemeToggle({
    className,
}: {
    /** Classes para o contentor do switch. */
    className?: string
}) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- client-only mounted gate for next-themes */
        setMounted(true)
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [])

    const effective =
        theme === "light" || theme === "dark" ? theme : resolvedTheme
    const isLight = mounted && effective === "light"

    // next-themes roda com `disableTransitionOnChange`, que injeta
    // `* { transition: none !important }` enquanto troca a classe do tema.
    // Aplicar a posição dois quadros depois deixa o deslize acontecer já sem esse
    // estilo, senão o polegar salta de um lado ao outro sem animar.
    //
    // Só a *aparência* é adiada. O `checked` do Radix acompanha o estado real na
    // hora, então o leitor de tela nunca anuncia o valor antigo.
    const [visualIsLight, setVisualIsLight] = useState(isLight)

    useEffect(() => {
        let raf2: number | null = null
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setVisualIsLight(isLight))
        })
        return () => {
            cancelAnimationFrame(raf1)
            if (raf2 !== null) cancelAnimationFrame(raf2)
        }
    }, [isLight])

    if (!mounted) {
        return (
            <Skeleton
                className={cn("h-8 w-18 shrink-0 rounded-full", className)}
            />
        )
    }

    return (
        <SwitchPrimitive.Root
            checked={isLight}
            onCheckedChange={(next) => setTheme(next ? "light" : "dark")}
            aria-label="Tema claro"
            data-slot="app-theme-toggle"
            data-visual={visualIsLight ? "light" : "dark"}
            className={cn(
                "group/theme relative inline-flex h-8 w-18 shrink-0 items-center rounded-full bg-muted/60 p-0.5 outline-none ring-1 ring-border/60 transition-colors",
                // O alvo de toque real: a pílula tem 32px de altura, e o
                // pseudo-elemento a leva aos 44px que um dedo pede sem mexer no
                // layout de quem a posiciona.
                "after:absolute after:-inset-x-1 after:-inset-y-1.5 after:content-['']",
                "hover:bg-muted active:bg-muted",
                "focus-visible:ring-3 focus-visible:ring-ring/70",
                "dark:bg-muted/40",
                className,
            )}
            // Ele vive dentro de menus suspensos (conta e menu mobile): sem isto,
            // o pointer down fecha o menu antes do clique chegar.
            onPointerDown={(e) => e.stopPropagation()}
        >
            <SwitchPrimitive.Thumb
                data-slot="app-theme-toggle-thumb"
                className={cn(
                    "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-full border border-border/80 bg-background shadow-sm",
                    "transform-gpu will-change-transform transition-transform duration-(--duration-slow) ease-(--ease-emphasized)",
                    "group-data-[visual=light]/theme:translate-x-full",
                    "dark:bg-card",
                )}
            />
            <ThemeFace icon="dark" />
            <ThemeFace icon="light" />
        </SwitchPrimitive.Root>
    )
}

/**
 * Uma das duas faces. Vem depois do polegar no DOM de propósito: assim ela pinta
 * por cima dele sem precisar de `z-index`, e o ícone que está valendo aparece
 * *sobre* a pastilha em vez de sumir debaixo dela.
 *
 * O que não está valendo encolhe um pouco além de esmaecer. Só a cor bastaria no
 * tema claro, mas no escuro a diferença entre `foreground` e `muted-foreground`
 * fica sutil demais num ícone de 16px.
 */
function ThemeFace({ icon }: { icon: "light" | "dark" }) {
    const Icon = icon === "light" ? SunIcon : MoonIcon
    const ativo =
        icon === "light"
            ? "group-data-[visual=light]/theme:scale-100 group-data-[visual=light]/theme:text-foreground"
            : "group-data-[visual=dark]/theme:scale-100 group-data-[visual=dark]/theme:text-foreground"

    return (
        <span className="pointer-events-none relative flex w-1/2 items-center justify-center">
            <Icon
                aria-hidden
                className={cn(
                    "size-4 scale-90 text-muted-foreground transition-[transform,color] duration-(--duration-slow) ease-(--ease-emphasized)",
                    ativo,
                )}
            />
        </span>
    )
}
