"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { isDesignSystemEnabled } from "@/app/designsystem/enabled"
import { AdjustmentsHorizontalIcon, CalendarIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBarAction, TopBarActionGroup } from "@/components/ui/top-bar"
import { H1, Muted } from "@/components/ui/typography"

const ESTADOS = ["lupa", "mes", "ajustes"] as const
type Estado = (typeof ESTADOS)[number]
const NOMES: Record<Estado, string> = { lupa: "Só a lupa", mes: "Lupa + mês", ajustes: "Lupa + ajustes" }
/** A volta que o "Repetir" dá: entra o mês, troca para os ajustes, sai. */
const VOLTA: Record<Estado, Estado> = { lupa: "mes", mes: "ajustes", ajustes: "lupa" }
/** O tempo de cada parada no "Repetir": a mola assenta e o olho descansa. */
const PARADA_MS = 1400

/**
 * O laboratório da cápsula do cabeçalho do telefone: a `TopBarActionGroup
 * morph` sozinha, para ver o filtro pingar da lupa, trocar de ícone e ser
 * reabsorvido. Só em desenvolvimento (a mesma guarda do catálogo).
 * Temporário: sai quando o gesto estiver aprovado no aparelho.
 *
 * "Ampliar" desenha a faixa a 3× por `zoom` (e não `scale`: um `transform`
 * no ancestral desligaria o borrão dos vidros). A ponta direita fica parada,
 * como na barra do app.
 */
export default function Page() {
    if (!isDesignSystemEnabled()) notFound()

    const [estado, setEstado] = useState<Estado>("lupa")
    const [repetir, setRepetir] = useState(false)
    const [ampliar, setAmpliar] = useState(true)

    useEffect(() => {
        if (!repetir) return
        const id = window.setInterval(() => setEstado((e) => VOLTA[e]), PARADA_MS)
        return () => window.clearInterval(id)
    }, [repetir])

    return (
        <div className="flex min-h-dvh flex-col gap-6 bg-background p-4">
            <div>
                <H1>Laboratório do cabeçalho</H1>
                <Muted>A cápsula da direita: o filtro pinga da lupa, troca de ícone e volta para dentro dela.</Muted>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Tabs value={estado} onValueChange={(v) => setEstado(v as Estado)}>
                    <TabsList>
                        {ESTADOS.map((e) => (
                            <TabsTrigger key={e} value={e}>
                                {NOMES[e]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <Label className="flex items-center gap-2">
                    <Switch checked={repetir} onCheckedChange={setRepetir} />
                    Repetir sozinho
                </Label>
                <Label className="flex items-center gap-2">
                    <Switch checked={ampliar} onCheckedChange={setAmpliar} />
                    Ampliar 3×
                </Label>
            </div>
            <Card padding="none" className="overflow-hidden">
                <div className="flex justify-end p-4" style={ampliar ? { zoom: 3 } : undefined}>
                    <TopBarActionGroup morph trailingKey={estado === "lupa" ? undefined : estado}>
                        <TopBarAction label="Buscar" plate tooltip={false}>
                            <MagnifyingGlassIcon className="size-4" />
                        </TopBarAction>
                        {estado === "mes" ? (
                            <TopBarAction label="Mês" plate tooltip={false}>
                                <CalendarIcon className="size-4" />
                            </TopBarAction>
                        ) : estado === "ajustes" ? (
                            <TopBarAction label="Filtros" plate tooltip={false}>
                                <AdjustmentsHorizontalIcon className="size-4" />
                            </TopBarAction>
                        ) : null}
                    </TopBarActionGroup>
                </div>
            </Card>
        </div>
    )
}
