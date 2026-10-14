"use client"

import * as React from "react"

import {
    ArrowUturnLeftIcon,
    BanknotesIcon,
    ComputerDesktopIcon,
    CreditCardIcon,
    HomeIcon,
    KeyIcon,
} from "@heroicons/react/16/solid"

import { scriptStage, type ScriptStage } from "@/components/auth/showcase/scenes"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandDock,
    CommandDockItem,
    CommandGroup,
    CommandHighlight,
    CommandInput,
    CommandItem,
    CommandItemContent,
    CommandItemDescription,
    CommandItemIcon,
    CommandItemMeta,
    CommandItemTitle,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { MoneyDisplay } from "@/components/ui/money-display"
import { ShowcaseCursor, ShowcaseFlight, ShowcaseFloat, useShowcase } from "@/components/ui/showcase"
import { useSceneScript } from "@/hooks/use-scene-script"
import type { SceneScriptId } from "@/lib/scene-script"
import type { HeroIcon } from "@/types/navigation"

/**
 * # A paleta ⌘K digitada pelo roteiro
 *
 * O cursor "Você" chega à pílula de busca do cabeçalho e clica; a pílula voa
 * (`ShowcaseFlight` "auth-search") até o campo de uma `Command variant="panel"`
 * de verdade, que flutua à frente da janela, com o véu na tela; a consulta se
 * digita sozinha, as linhas entram com o trecho casado em negrito, uma é
 * escolhida, e a paleta fecha. O roteiro é o `useSceneScript`; este arquivo só
 * o desenha.
 *
 * - **Digitação só aqui.** Os ~14 quadros por segundo re-renderizam esta
 *   subárvore. O que muda fora — a pílula do cabeçalho, a fatura, a ida e volta
 *   ao celular — sobe pelo `onStage` (`scriptStage`), umas seis vezes por
 *   roteiro, e volta como `stage`: abrir a paleta e soltar a pílula do
 *   cabeçalho acontecem no mesmo commit, e o fantasma voa de um ponto ao outro.
 * - **Nada que escute o teclado.** Sem `shortcut=` (ele pendura um `keydown`
 *   no `document`), sem `autoFocus`; a tecla ↵ é desenhada. O palco é `inert`.
 * - **A placa é a do palco**: opaca pelo escopo `data-opaque` do `Showcase`, e
 *   sem sombra (a pilha do `Command` não tem).
 * - **Movimento reduzido**: um quadro só — a paleta aberta na consulta, com a
 *   linha escolhida e o cursor de texto aceso, sobre o painel.
 */

type PaletteScript = Exclude<SceneScriptId, "masked-password">

type Linha = {
    /** O `value` do cmdk, igual ao título: é o que o roteiro escolhe. */
    title: string
    /** A segunda linha; sem ela, a linha tem uma altura só (36). */
    description?: string
    icon: HeroIcon
    meta?: React.ReactNode
}

type Grupo = {
    heading: string
    linhas: Linha[]
    /** O grupo que só cabe no palco médio para cima (36rem): abaixo, a paleta passaria da janela. */
    largo?: boolean
}

/**
 * O selo da linha só a partir do palco médio (36rem, a janela de 1440): abaixo, a paleta tem ~390px e o selo
 * quebraria em duas linhas ao lado do valor.
 */
const SELO_DA_LINHA = "shrink-0 @max-xl/showcase:hidden"
const SO_NO_LARGO = "@max-xl/showcase:hidden"

/** A tecla desenhada: a ação que o Enter faria, sem ouvir tecla nenhuma. */
const ENTER = (
    <CommandShortcut>
        <Kbd>↵</Kbd>
    </CommandShortcut>
)

/** O que cada consulta acha. Dados de exemplo da mesma conta de outubro do `AuthMiniApp`. */
const RESULTADOS: Record<PaletteScript, Grupo[]> = {
    "palette-login": [
        {
            heading: "Faturas",
            linhas: [
                {
                    title: "Fatura de outubro",
                    description: "cartão final 4821 · vence dia 12",
                    icon: CreditCardIcon,
                    meta: (
                        <>
                            <Badge variant="soft" tone="warning" size="xs" className={SELO_DA_LINHA}>
                                em 3 dias
                            </Badge>
                            <MoneyDisplay value={1284.6} size="sm" />
                        </>
                    ),
                },
                {
                    title: "Fatura de setembro",
                    description: "cartão final 4821 · fechou 05/09",
                    icon: CreditCardIcon,
                    meta: (
                        <>
                            <Badge variant="soft" tone="success" size="xs" className={SELO_DA_LINHA}>
                                paga
                            </Badge>
                            <MoneyDisplay value={1102.35} size="sm" tone="muted" />
                        </>
                    ),
                },
            ],
        },
        {
            heading: "Ações",
            linhas: [{ title: "Pagar fatura", icon: BanknotesIcon, meta: ENTER }],
            largo: true,
        },
    ],
    "palette-session": [
        {
            heading: "Continuar",
            linhas: [{ title: "Continuar de onde parou", description: "Painel · outubro", icon: ArrowUturnLeftIcon, meta: ENTER }],
        },
        {
            heading: "Telas",
            linhas: [{ title: "Painel", description: "Saldo, contas e orçamento", icon: HomeIcon }],
        },
    ],
    "palette-security": [
        {
            heading: "Segurança",
            linhas: [
                {
                    title: "Senha alterada",
                    description: "Segurança · sessões antigas encerradas",
                    icon: KeyIcon,
                    meta: (
                        <Badge variant="soft" tone="success" size="xs">
                            agora
                        </Badge>
                    ),
                },
                {
                    title: "Sessões ativas",
                    description: "Segurança · este computador",
                    icon: ComputerDesktopIcon,
                    meta: (
                        <Badge variant="soft" tone="neutral" size="xs">
                            1 aparelho
                        </Badge>
                    ),
                },
            ],
        },
    ],
}

const VOCE = { name: "Você", tone: 3, anchor: "search", from: "bottom" } as const

/**
 * Onde a paleta pousa. O `ShowcaseFloat center` prende o topo a 58% do herói e
 * a placa cresce para baixo; aqui o campo sobe para a linha do cabeçalho (15%
 * da altura do navegador, onde estava a pílula), e a pílula se estica no lugar
 * até virar a paleta, com a placa descendo sobre a tela velada, dentro da
 * janela. A 58% a paleta descia ~120px para fora e cobria o chip pendurado e o
 * cartão de baixo à direita. A subida é 0,43 da altura do navegador, que a
 * `@utility showcase-stage` dá por extenso: `min(86cqw, 140cqh)` × 10/16
 * (`min(92cqw, …)` abaixo de 28rem).
 */
const POUSO_DA_PALETA = "-translate-y-[min(22.95cqw,37.4cqh)] @max-md/showcase:-translate-y-[min(24.55cqw,37.4cqh)]"

/**
 * Antes da escolha, nenhuma linha acesa: o cmdk acende a primeira ao registrar
 * os itens e a cada tecla, e com `value` controlado ele só volta ao valor da
 * prop quando ela muda — dois sentinelas que revezam (o mecanismo do
 * `useCommandIdleSelection`; o `\0` não colide com título nenhum).
 */
const NENHUMA = ["\0paleta-a", "\0paleta-b"] as const

const assinarMovimento = (avisar: () => void) => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)")
    consulta.addEventListener("change", avisar)
    return () => consulta.removeEventListener("change", avisar)
}

/** O movimento reduzido, sem `motion` (a camada do app não o importa). */
function useMovimentoReduzido(): boolean {
    return React.useSyncExternalStore(
        assinarMovimento,
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        () => false
    )
}

export type PaletteDemoProps = {
    /** O roteiro da cena (`null` nas cenas sem paleta). */
    script: SceneScriptId | null
    /**
     * Quantos focos de verdade a coluna já recebeu (`focoPulaORoteiro`): cada
     * aumento pula o roteiro em execução para o quadro final.
     */
    skip: number
    /** O que o palco já mostra (o que `onStage` subiu): abre e fecha a paleta no mesmo commit da pílula. */
    stage: ScriptStage
    /** Sobe o palco do quadro atual, com o roteiro de quem o calculou. */
    onStage: (script: SceneScriptId | null, stage: ScriptStage) => void
}

export function PaletteDemo({ script, skip, stage, onStage }: PaletteDemoProps) {
    const { active } = useShowcase()
    const reduced = useMovimentoReduzido()
    // A senha mascarada da recuperação é de outro desenho (o celular): aqui, só as três paletas.
    const roteiro: PaletteScript | null = script === "masked-password" ? null : script
    const { frame, skip: pular } = useSceneScript(roteiro, { active, reduced })

    // Cada foco novo na coluna pula o roteiro em execução (o reducer ignora o pulo de quem já acabou).
    const pulos = React.useRef(skip)
    React.useEffect(() => {
        if (skip === pulos.current) return
        pulos.current = skip
        pular()
    }, [skip, pular])

    const { search, screen, phone } = scriptStage(roteiro, frame.beat, reduced)
    React.useEffect(() => {
        onStage(script, { search, screen, phone })
    }, [onStage, script, search, screen, phone])

    const [nenhuma, setNenhuma] = React.useState(0)
    const escolhida = frame.selected
    const aoAcender = React.useCallback(() => {
        if (!escolhida) setNenhuma((n) => 1 - n)
    }, [escolhida])

    const grupos = roteiro ? RESULTADOS[roteiro] : null
    const aberta = grupos != null && stage.search === "palette"
    const texto = frame.text ?? ""
    const cursor = !reduced && (frame.beat === "cursor" || frame.beat === "press")

    return (
        <>
            {grupos ? <ShowcaseCursor key={roteiro} {...VOCE} click open={cursor} /> : null}
            <ShowcaseFloat anchor="center" open={aberta}>
                <div className={POUSO_DA_PALETA}>
                    <Command
                        variant="panel"
                        shouldFilter={false}
                        value={escolhida ?? NENHUMA[nenhuma]}
                        onValueChange={aoAcender}
                        className="w-full"
                    >
                        <ShowcaseFlight layoutId="auth-search" active={aberta} className="rounded-full">
                            <CommandInput caret value={texto} placeholder="" />
                        </ShowcaseFlight>
                        {/* A placa entra com a primeira tecla, e as linhas sobem em cascata (`command-reveal`). */}
                        {texto && grupos ? (
                            <CommandList>
                                {grupos.map(({ heading, linhas, largo }) => (
                                    <CommandGroup key={heading} heading={heading} className={largo ? SO_NO_LARGO : undefined}>
                                        {linhas.map(({ title, description, icon: Icon, meta }) => (
                                            <CommandItem key={title} value={title}>
                                                <CommandItemIcon>
                                                    <Icon />
                                                </CommandItemIcon>
                                                <CommandItemContent>
                                                    <CommandItemTitle>
                                                        <CommandHighlight>{title}</CommandHighlight>
                                                    </CommandItemTitle>
                                                    {description ? (
                                                        <CommandItemDescription>
                                                            <CommandHighlight>{description}</CommandHighlight>
                                                        </CommandItemDescription>
                                                    ) : null}
                                                </CommandItemContent>
                                                {meta ? <CommandItemMeta>{meta}</CommandItemMeta> : null}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ))}
                            </CommandList>
                        ) : null}
                        {/* A legenda de teclado da paleta do app, só no palco grande (48rem, a janela de 1920). */}
                        {texto ? (
                            <CommandDock className="@max-3xl/showcase:hidden">
                                <CommandDockItem>
                                    <Kbd>↑↓</Kbd> navegar
                                </CommandDockItem>
                                <CommandDockItem>
                                    <Kbd>↵</Kbd> abrir
                                </CommandDockItem>
                                <CommandDockItem>
                                    <Kbd>esc</Kbd> fechar
                                </CommandDockItem>
                            </CommandDock>
                        ) : null}
                    </Command>
                </div>
            </ShowcaseFloat>
        </>
    )
}
