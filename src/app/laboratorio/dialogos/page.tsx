"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { isDesignSystemEnabled } from "@/app/designsystem/enabled"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H1, Muted, Small } from "@/components/ui/typography"

/**
 * As versões da entrada, por extenso (classe montada não chega ao CSS). Cada
 * uma reescreve, com `!`, as variáveis do `tw-animate` que a placa de hoje usa
 * (`--tw-enter-*`, `--tw-exit-*`, a duração e a curva): o gesto é o mesmo
 * `enter`/`exit`, só os números mudam. "Hoje" não reescreve nada.
 */
const VERSOES = {
    hoje: {
        nome: "Hoje",
        desc: "Esmaece e cresce de 95% a 100% na mola (500ms), subindo 4px; fecha em 150ms.",
        classe: "",
    },
    desfoque: {
        nome: "A · Desfoque curto",
        desc: "Sai de um desfoque leve (6px) e de 98%, em 220ms de curva de saída, sem mola; fecha em 150ms, desfocando 4px.",
        classe:
            "data-open:[--tw-enter-blur:6px]! data-open:[--tw-enter-scale:0.98]! data-open:[--tw-enter-translate-y:0px]! data-open:animation-duration-(--duration-base)! data-open:ease-(--ease-out)! data-closed:[--tw-exit-blur:4px]! data-closed:[--tw-exit-scale:0.98]!",
    },
    subida: {
        nome: "B · Subida curta",
        desc: "Como as folhas do macOS: sobe 8px esmaecendo, em 240ms de curva de saída, sem crescer; fecha descendo 4px em 150ms.",
        classe:
            "data-open:[--tw-enter-scale:1]! data-open:[--tw-enter-translate-y:0.5rem]! data-open:animation-duration-[240ms]! data-open:ease-(--ease-out)! data-closed:[--tw-exit-scale:1]! data-closed:[--tw-exit-translate-y:0.25rem]!",
    },
    escala: {
        nome: "C · Escala mínima",
        desc: "Cresce de 97% a 100% esmaecendo, em 200ms de curva de saída, sem mola e sem subir; fecha igual, em 150ms.",
        classe:
            "data-open:[--tw-enter-scale:0.97]! data-open:[--tw-enter-translate-y:0px]! data-open:animation-duration-(--duration-base)! data-open:ease-(--ease-out)! data-closed:[--tw-exit-scale:0.97]!",
    },
    assenta: {
        nome: "D · Assenta (alerta do iOS, contido)",
        desc: "Chega 4% maior e assenta encolhendo, em 240ms de curva de saída; fecha esmaecendo de 100% a 98%.",
        classe:
            "data-open:[--tw-enter-scale:1.04]! data-open:[--tw-enter-translate-y:0px]! data-open:animation-duration-[240ms]! data-open:ease-(--ease-out)! data-closed:[--tw-exit-scale:0.98]!",
    },
    esmaece: {
        nome: "E · Só esmaecer",
        desc: "Só a opacidade, em 160ms; fecha em 120ms. O mais quieto.",
        classe:
            "data-open:[--tw-enter-scale:1]! data-open:[--tw-enter-translate-y:0px]! data-open:animation-duration-[160ms]! data-open:ease-(--ease-out)! data-closed:[--tw-exit-scale:1]! data-closed:animation-duration-[120ms]!",
    },
} as const
type Versao = keyof typeof VERSOES

const CONTEUDOS = ["confirmar", "formulario"] as const
type Conteudo = (typeof CONTEUDOS)[number]
const NOMES_CONTEUDO: Record<Conteudo, string> = { confirmar: "Confirmação", formulario: "Formulário" }

/** O tempo aberto e fechado do "Repetir": a entrada assenta e o olho descansa. */
const PARADA_MS = 1400

/**
 * O laboratório da entrada do `Dialog` no desktop: diálogos de verdade (o
 * texto, os campos e os botões do app), um por versão, para o dono escolher
 * vendo o conteúdo — o protótipo em formas cinzas escondeu que o gesto dos
 * menus ficava infantil num modal. Só em desenvolvimento (a mesma guarda do
 * catálogo). Temporário: sai quando uma versão vencer.
 */
export default function Page() {
    if (!isDesignSystemEnabled()) notFound()

    const [aberta, setAberta] = useState<Versao | null>(null)
    const [conteudo, setConteudo] = useState<Conteudo>("confirmar")
    const [repetir, setRepetir] = useState<Versao | null>(null)

    useEffect(() => {
        if (!repetir) return
        const id = window.setInterval(() => setAberta((a) => (a ? null : repetir)), PARADA_MS)
        return () => window.clearInterval(id)
    }, [repetir])

    return (
        <div className="flex min-h-dvh flex-col gap-6 bg-background p-4">
            <div>
                <H1>Laboratório dos diálogos</H1>
                <Muted>A entrada e a saída do diálogo no desktop, em versões contidas. Abra cada uma e feche com Esc, no véu ou nos botões.</Muted>
            </div>
            <Tabs value={conteudo} onValueChange={(v) => setConteudo(v as Conteudo)}>
                <TabsList>
                    {CONTEUDOS.map((c) => (
                        <TabsTrigger key={c} value={c}>
                            {NOMES_CONTEUDO[c]}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(Object.keys(VERSOES) as Versao[]).map((v) => (
                    <Card key={v} className="flex flex-col gap-3">
                        <div>
                            <Small>{VERSOES[v].nome}</Small>
                            <Muted>{VERSOES[v].desc}</Muted>
                        </div>
                        <div className="mt-auto flex flex-wrap items-center gap-3">
                            <Button variant="secondary" onClick={() => setAberta(v)}>
                                abrir
                            </Button>
                            <Label className="flex items-center gap-2">
                                <Switch
                                    checked={repetir === v}
                                    onCheckedChange={(ligado) => setRepetir(ligado ? v : null)}
                                />
                                Repetir
                            </Label>
                        </div>
                    </Card>
                ))}
            </div>

            {(Object.keys(VERSOES) as Versao[]).map((v) => (
                <Dialog key={v} open={aberta === v} onOpenChange={(o) => setAberta(o ? v : null)}>
                    <DialogContent className={VERSOES[v].classe}>
                        {conteudo === "confirmar" ? (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Excluir lançamento?</DialogTitle>
                                    <DialogDescription>
                                        Mercado · R$ 182,40 em 14 de outubro. Isso não pode ser desfeito.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="tertiary">
                                            cancelar
                                        </Button>
                                    </DialogClose>
                                    <Button type="button" variant="destructive" onClick={() => setAberta(null)}>
                                        excluir
                                    </Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Nova categoria</DialogTitle>
                                    <DialogDescription>Ela aparece nos lançamentos e no orçamento do mês.</DialogDescription>
                                </DialogHeader>
                                <DialogBody className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={`nome-${v}`}>Nome</Label>
                                        <Input id={`nome-${v}`} placeholder="Mercado" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor={`limite-${v}`}>Limite do mês</Label>
                                        <Input id={`limite-${v}`} placeholder="R$ 800,00" />
                                    </div>
                                </DialogBody>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="tertiary">
                                            cancelar
                                        </Button>
                                    </DialogClose>
                                    <Button type="button" onClick={() => setAberta(null)}>
                                        salvar
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    )
}
