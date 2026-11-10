"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react"

import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { MOLA_PALCO, SAIDA } from "@/lib/spring"
import { cn } from "@/lib/utils"

/** Pura: o que o Esc faz com a pílula. Com texto, limpa; vazia, fecha. */
export function efeitoDoEsc(valor: string): "limpar" | "fechar" {
    return valor === "" ? "fechar" : "limpar"
}

/**
 * A busca da tela cheia: fechada, o círculo da lupa; aberta, o `SearchInput` a
 * `min(18rem, 100%)`, crescendo para a esquerda (o pai a alinha à direita). É uma
 * pílula só, e a largura anda no `motion` a partir da medida atual, para a
 * interrupção não saltar. O texto acende quando a largura passa da metade.
 */
export function BuscaQueAbre({
    value,
    onChange,
    label,
    disabled = false,
}: {
    value: string
    onChange: (v: string) => void
    /** Placeholder e nome acessível da lupa fechada. */
    label: string
    disabled?: boolean
}) {
    const casca = React.useRef<HTMLDivElement>(null)
    const campo = React.useRef<HTMLInputElement>(null)
    const lupa = React.useRef<HTMLButtonElement>(null)
    const anim = React.useRef<AnimationPlaybackControls | null>(null)
    const ultima = React.useRef<number | null>(null)
    const [foco, setFoco] = React.useState(false)
    const reduzir = useReducedMotion()
    const aberta = foco || value !== ""

    React.useLayoutEffect(() => {
        const el = casca.current
        if (!el) return
        // Em voo o estilo inline é a largura de agora; em repouso, a última medida.
        const de = anim.current ? el.getBoundingClientRect().width : ultima.current
        anim.current?.stop()
        anim.current = null
        el.style.width = ""
        const para = el.getBoundingClientRect().width
        ultima.current = para
        if (reduzir || de == null || de === para) {
            el.toggleAttribute("data-texto", aberta)
            return
        }
        el.style.width = `${de}px`
        const meio = (de + para) / 2
        const controle = animate(el, { width: `${para}px` }, {
            ...(aberta ? MOLA_PALCO : SAIDA),
            onUpdate: (v) => el.toggleAttribute("data-texto", parseFloat(String(v)) >= meio),
        })
        anim.current = controle
        controle.then(() => {
            if (anim.current !== controle) return
            anim.current = null
            el.style.width = ""
            el.toggleAttribute("data-texto", aberta)
        })
    }, [aberta, reduzir])

    React.useEffect(() => () => anim.current?.stop(), [])

    // Captura na janela: o Esc do diálogo (Radix) escuta o `document` na captura,
    // e chegaria antes do `onKeyDown` do campo, perguntando "Descartar alterações?".
    React.useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || e.target !== campo.current) return
            e.stopPropagation()
            e.preventDefault()
            if (efeitoDoEsc(campo.current?.value ?? "") === "limpar") {
                onChange("")
                return
            }
            flushSync(() => setFoco(false))
            lupa.current?.focus()
        }
        window.addEventListener("keydown", aoTeclar, { capture: true })
        return () => window.removeEventListener("keydown", aoTeclar, { capture: true })
    }, [onChange])

    return (
        <div
            ref={casca}
            data-slot="busca-que-abre"
            className={cn(
                "group/busca relative shrink-0",
                aberta ? "w-[min(18rem,100%)]" : "w-9 pointer-coarse:w-11"
            )}
        >
            <SearchInput
                ref={campo}
                size="lg"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onClear={() => onChange("")}
                clearLabel="Limpar busca"
                placeholder={label}
                aria-label={label}
                shortcut="/"
                disabled={disabled}
                tabIndex={aberta ? undefined : -1}
                aria-hidden={aberta ? undefined : true}
                onFocus={() => setFoco(true)}
                onBlur={() => setFoco(false)}
                // O recuo fica igual aberto e fechado, para a lupa não saltar ao abrir.
                className="overflow-hidden ps-2.5 pointer-coarse:ps-3.5"
                inputClassName="opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-out) group-data-[texto]/busca:opacity-100"
            />
            {aberta ? null : (
                // Uma parada de Tab só: o campo fechado sai da ordem, e a lupa de baixo é a do campo.
                <Button
                    ref={lupa}
                    type="button"
                    variant="tertiary"
                    size="icon-lg"
                    aria-label={label}
                    aria-expanded={false}
                    disabled={disabled}
                    className="absolute inset-0 size-full"
                    onClick={() => campo.current?.focus()}
                />
            )}
        </div>
    )
}
