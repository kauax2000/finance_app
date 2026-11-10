"use client"

import * as React from "react"
import { ExclamationTriangleIcon, SparklesIcon } from "@heroicons/react/16/solid"

import { LadrilhoDaCategoria } from "./ladrilho-da-categoria"
import { porCategoriaDaIa, type ImportarExtrato } from "./use-importar-extrato"
import { Button } from "@/components/ui/button"
import { Item } from "@/components/ui/item"
import { Popover, PopoverContent, PopoverDescription, PopoverFooter, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { numberBR } from "@/lib/formatters"
import { toastUndo } from "@/lib/toast"
import { cn } from "@/lib/utils"

/** Quantas categorias o resumo mostra; o resto vira "+ N categorias". */
const NO_RESUMO = 5

/** O rótulo da IA ao lado das abas: lendo, quantas sugeriu (com o resumo por categoria) ou a falha. */
export function RotuloDaIa({ imp, travado }: { imp: ImportarExtrato; travado: boolean }) {
    const [aberto, setAberto] = React.useState(false)
    const { ia } = imp
    if (ia.estado === "ocioso" || ia.estado === "indisponivel") return null
    if (ia.estado === "lendo") {
        return (
            <span role="status" className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                <Spinner />
                IA lendo…
            </span>
        )
    }

    const n = imp.contagens.ia
    const falhou = ia.estado === "falhou"
    const gatilho = (
        <PopoverTrigger asChild>
            <Button
                type="button"
                variant="link"
                size="sm"
                disabled={travado}
                className={cn("shrink-0", falhou && "text-warning-muted-foreground")}
            >
                {falhou ? <ExclamationTriangleIcon data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
                {falhou ? "A IA falhou" : n > 0 ? `${numberBR(n)} pela IA` : "IA sem sugestões"}
            </Button>
        </PopoverTrigger>
    )

    let conteudo: React.ReactNode
    if (falhou) {
        conteudo = (
            <>
                <PopoverHeader>
                    <PopoverTitle>A IA falhou</PopoverTitle>
                    <PopoverDescription>{ia.mensagem}</PopoverDescription>
                </PopoverHeader>
                <PopoverFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            imp.tentarIaDeNovo()
                            setAberto(false)
                        }}
                    >
                        Tentar de novo
                    </Button>
                </PopoverFooter>
            </>
        )
    } else if (n === 0) {
        conteudo = (
            <PopoverHeader>
                <PopoverTitle>IA sem sugestões</PopoverTitle>
                <PopoverDescription>
                    A IA não achou categoria para estas linhas.
                    {ia.ficaram > 0 ? ` ${numberBR(ia.ficaram)} ficaram sem categoria.` : ""}
                </PopoverDescription>
            </PopoverHeader>
        )
    } else {
        const itens = imp.previa?.itens ?? []
        const nome = (id: string) => imp.previa?.nomeDaCategoria.get(id) ?? ""
        // O empate da contagem vai pelo nome, que é o que a pessoa lê.
        const usadas = porCategoriaDaIa(itens, imp.origemDe, imp.categoriaDe).sort(
            (a, b) => b.n - a.n || nome(a.categoryId).localeCompare(nome(b.categoryId), "pt-BR")
        )
        const semCategoria = imp.contagens["sem-categoria"]
        const irPara = (categoryId: string) => {
            imp.setFiltro("ia")
            setAberto(false)
            requestAnimationFrame(() =>
                document.querySelector(`[data-grupo-ia="${CSS.escape(categoryId)}"]`)?.scrollIntoView({ block: "nearest" })
            )
        }
        const desfazer = () => {
            const devolver = imp.desfazerIa(itens.filter((i) => imp.origemDe(i.clientId) === "ia").map((i) => i.clientId))
            setAberto(false)
            toastUndo("Sugestões da IA desfeitas", { onUndo: devolver })
        }
        conteudo = (
            <>
                <PopoverHeader>
                    <PopoverTitle>{`A IA categorizou ${numberBR(n)}`}</PopoverTitle>
                    <PopoverDescription>
                        Confira antes de importar.
                        {semCategoria > 0 ? ` ${numberBR(semCategoria)} ficaram sem categoria.` : ""}
                    </PopoverDescription>
                </PopoverHeader>
                <ul className="flex flex-col">
                    {usadas.slice(0, NO_RESUMO).map(({ categoryId, n: k }) => {
                        const categoria = imp.previa?.categorias.find((c) => c.id === categoryId)
                        return (
                            <li key={categoryId}>
                                <Item asChild interactive size="sm">
                                    <button type="button" onClick={() => irPara(categoryId)}>
                                        {categoria ? <LadrilhoDaCategoria categoria={categoria} /> : null}
                                        <span className="min-w-0 flex-1 truncate">{nome(categoryId)}</span>
                                        <span className="nums text-muted-foreground">{numberBR(k)}</span>
                                    </button>
                                </Item>
                            </li>
                        )
                    })}
                    {usadas.length > NO_RESUMO ? (
                        <li className="px-2.5 py-2 text-sm text-muted-foreground">
                            {`+ ${numberBR(usadas.length - NO_RESUMO)} ${usadas.length - NO_RESUMO === 1 ? "categoria" : "categorias"}`}
                        </li>
                    ) : null}
                </ul>
                <PopoverFooter>
                    <Button type="button" variant="tertiary" size="sm" onClick={desfazer}>
                        {"Desfazer as " + numberBR(n)}
                    </Button>
                </PopoverFooter>
            </>
        )
    }

    return (
        <Popover open={aberto} onOpenChange={setAberto}>
            {gatilho}
            <PopoverContent size="md" align="start">
                {conteudo}
            </PopoverContent>
        </Popover>
    )
}
