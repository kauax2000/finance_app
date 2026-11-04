"use client"

import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/16/solid"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TopBarAction } from "@/components/ui/top-bar"
import { Muted } from "@/components/ui/typography"
import { TrocaSuave } from "@/lib/troca-suave"

/**
 * Um valor para copiar: o campo de um lado e o botão redondo do outro, que troca
 * o ícone pelo tique ao copiar; a recusa não some em silêncio. `multilinha`
 * mostra o texto inteiro (uma frase para colar), com o botão no alto, ao lado.
 */
export function CampoDeCopiar({ rotulo, valor, multilinha = false }: { rotulo: string; valor: string; multilinha?: boolean }) {
    const [estado, setEstado] = useState<"copiado" | "recusado" | null>(null)

    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    useEffect(() => () => clearTimeout(timer.current), [])

    async function copiar() {
        clearTimeout(timer.current)
        try {
            await navigator.clipboard.writeText(valor)
            setEstado("copiado")
            timer.current = setTimeout(() => setEstado(null), 2000)
        } catch {
            // O valor continua à vista e selecionável.
            setEstado("recusado")
        }
    }

    const copiado = estado === "copiado"

    return (
        <div className="flex min-w-0 flex-col gap-1">
            <div className={multilinha ? "flex min-w-0 items-start gap-2" : "flex min-w-0 items-center gap-2"}>
                {multilinha ? (
                    <Textarea
                        readOnly
                        aria-label={rotulo}
                        value={valor}
                        minRows={2}
                        className="min-w-0 flex-1"
                        onFocus={(e) => e.currentTarget.select()}
                    />
                ) : (
                    <Input
                        readOnly
                        aria-label={rotulo}
                        value={valor}
                        className="min-w-0 flex-1"
                        onFocus={(e) => e.currentTarget.select()}
                    />
                )}
                {/* O botão de vidro do cabeçalho (o sino, a lupa), o mesmo desenho aqui. */}
                <TopBarAction plate label={`Copiar ${rotulo}`} className="shrink-0" onClick={() => void copiar()}>
                    {/* O ícone dá lugar ao tique na mola, e volta depois de 2s. */}
                    <TrocaSuave chave={copiado ? "copiado" : "copiar"} className="flex">
                        {copiado ? <CheckIcon aria-hidden /> : <DocumentDuplicateIcon aria-hidden />}
                    </TrocaSuave>
                </TopBarAction>
            </div>
            <Muted aria-live="polite" className="break-all">
                {estado === "recusado" ? "Não foi possível copiar. Selecione o texto e copie." : null}
                {/* O botão só tem ícone: quem confirma ao leitor de tela é aqui. */}
                {copiado ? <span className="sr-only">{rotulo} copiado.</span> : null}
            </Muted>
        </div>
    )
}
