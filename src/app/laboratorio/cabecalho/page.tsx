"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { frameData, MotionGlobalConfig } from "motion/react"
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
/** A câmera lenta: o relógio do `motion` anda a ¼ do real. */
const LENTIDAO = 0.25

/**
 * Liga o relógio manual do `motion` e o faz andar a `fator` do tempo real,
 * para toda animação dele na página. Devolve o desligamento.
 * ponytail: mexe na configuração global do `motion` (só esta página monta);
 * se a câmera lenta servir a outras telas, vira um controle do catálogo.
 */
function relogioLento(fator: number) {
    MotionGlobalConfig.useManualTiming = true
    let antes = performance.now()
    let id = 0
    const andar = (agora: number) => {
        const passo = (agora - antes) * fator
        antes = agora
        frameData.timestamp += passo
        frameData.delta = passo
        id = requestAnimationFrame(andar)
    }
    id = requestAnimationFrame(andar)
    return () => {
        cancelAnimationFrame(id)
        MotionGlobalConfig.useManualTiming = false
    }
}

/**
 * O laboratório da cápsula do cabeçalho do telefone: a `TopBarActionGroup
 * morph` sozinha, para ver o vidro esticar da lupa, o filtro trocar de ícone
 * e o vidro voltar a ser a lupa. Só em desenvolvimento (a mesma guarda do catálogo).
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
    const [lento, setLento] = useState(false)

    useEffect(() => (lento ? relogioLento(LENTIDAO) : undefined), [lento])

    useEffect(() => {
        if (!repetir) return
        const id = window.setInterval(() => setEstado((e) => VOLTA[e]), lento ? PARADA_MS / LENTIDAO : PARADA_MS)
        return () => window.clearInterval(id)
    }, [repetir, lento])

    return (
        <div className="flex min-h-dvh flex-col gap-6 bg-background p-4">
            <div>
                <H1>Laboratório do cabeçalho</H1>
                <Muted>A cápsula da direita: o vidro estica da lupa, o filtro troca de ícone e o vidro volta a ser a lupa.</Muted>
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
                    <Switch checked={lento} onCheckedChange={setLento} />
                    Câmera lenta (4×)
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
