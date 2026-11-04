"use client"

import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/16/solid"
import { useEffect, useRef, useState } from "react"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import { Muted } from "@/components/ui/typography"

/**
 * Um valor para copiar: o botão confirma no lugar, e a recusa não some em silêncio.
 * `multilinha` mostra o texto inteiro (uma frase para colar), com o botão embaixo.
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

    return (
        <div className="flex min-w-0 flex-col gap-1">
            <InputGroup>
                {multilinha ? (
                    <InputGroupTextarea
                        readOnly
                        aria-label={rotulo}
                        value={valor}
                        minRows={2}
                        onFocus={(e) => e.currentTarget.select()}
                    />
                ) : (
                    <InputGroupInput
                        readOnly
                        aria-label={rotulo}
                        value={valor}
                        onFocus={(e) => e.currentTarget.select()}
                    />
                )}
                {multilinha ? (
                    // A frase longa: o botão de copiar com ícone, à direita, embaixo do texto.
                    <InputGroupAddon align="block-end" className="justify-end text-foreground">
                        <InputGroupButton
                            variant="outline"
                            aria-label={`Copiar ${rotulo}`}
                            onClick={() => void copiar()}
                        >
                            {estado === "copiado" ? (
                                <CheckIcon aria-hidden data-icon="inline-start" />
                            ) : (
                                <DocumentDuplicateIcon aria-hidden data-icon="inline-start" />
                            )}
                            {estado === "copiado" ? "Copiado" : "Copiar texto"}
                        </InputGroupButton>
                    </InputGroupAddon>
                ) : (
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton aria-label={`Copiar ${rotulo}`} onClick={() => void copiar()}>
                            {estado === "copiado" ? "Copiado" : "Copiar"}
                        </InputGroupButton>
                    </InputGroupAddon>
                )}
            </InputGroup>
            <Muted aria-live="polite" className="break-all">
                {estado === "recusado" ? "Não foi possível copiar. Selecione o texto e copie." : null}
                {/* O `aria-label` fixo esconde o "Copiado" do botão: quem confirma ao leitor é aqui. */}
                {estado === "copiado" ? <span className="sr-only">{rotulo} copiado.</span> : null}
            </Muted>
        </div>
    )
}
