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
import { ShowcaseCursor, ShowcaseFlight, ShowcaseFloat } from "@/components/ui/showcase"
import { useMovimentoReduzido } from "@/hooks/use-scene-script"
import { cn } from "@/lib/utils"
import type { SceneScriptId, ScriptFrame } from "@/lib/scene-script"
import type { HeroIcon } from "@/types/navigation"

/**
 * # A paleta ⌘K digitada pelo roteiro
 *
 * O cursor "Você" chega à pílula de busca do cabeçalho e clica; a pílula voa
 * (`ShowcaseFlight` "auth-search") até o campo de uma `Command variant="panel"`
 * de verdade — a pílula se estica no lugar, na largura da tela, com o véu na
 * janela inteira (`VEU_DA_JANELA`, no `AuthShowcase`); a consulta se
 * digita sozinha, as linhas entram com o trecho casado em negrito, uma é
 * escolhida, e a paleta fecha. O roteiro (`useSceneScript`) corre no
 * `PaletaDoRoteiro`, fora deste pedaço; este arquivo só desenha o quadro.
 *
 * - **Digitação só aqui.** Os ~14 quadros por segundo re-renderizam esta
 *   subárvore. O que muda fora — a pílula do cabeçalho, a fatura, a ida e volta
 *   ao celular — sobe pelo `onStage` (`scriptStage`), umas seis vezes por
 *   roteiro, e volta como `stage`: abrir a paleta e soltar a pílula do
 *   cabeçalho acontecem no mesmo commit, e o fantasma voa de um ponto ao outro.
 * - **Nada que escute o teclado.** Sem `shortcut=` (ele pendura um `keydown`
 *   no `document`), sem `autoFocus`; a tecla ↵ é desenhada. O palco é `inert`.
 * - **A placa é a do palco**: opaca pelo escopo `data-opaque` do `Showcase`, e
 *   sem sombra (a pilha do `Command` não tem). A densidade é a `menu` da pilha
 *   (pílula de 32, a altura da pílula do cabeçalho, e a placa 4px abaixo): a
 *   janela desenhada tem 300px de altura no notebook, e na `palette` a paleta
 *   completa passaria do pé dela.
 * - **Diz que é exemplo.** A placa pousa sobre o cabeçalho da mini UI e cobre o
 *   selo "dados de exemplo" dela (no movimento reduzido, de vez): o primeiro
 *   grupo leva o seu (`RotuloComSelo`).
 * - **Movimento reduzido**: um quadro só — a paleta aberta na consulta, com a
 *   linha escolhida e o cursor de texto aceso, sobre o painel.
 */

type PaletteScript = Exclude<SceneScriptId, "masked-password">

type Linha = {
    /** O `value` do cmdk, igual ao título: é o que o roteiro escolhe. */
    title: string
    /** A segunda linha; sem ela, a linha tem uma altura só (40, com o ícone). */
    description?: string
    /** Classes de quem some por nível do palco (`description`, selo). */
    descriptionClassName?: string
    icon: HeroIcon
    meta?: React.ReactNode
}

type Grupo = {
    heading: string
    linhas: Linha[]
    className?: string
}

/*
 * A régua de cada palco é a janela: a placa termina a mais de 16px do pé dela e **entre dois textos da mini UI
 * de trás** — nunca cortando um ao meio, nem deixando uma lasca à mostra na curva do canto de baixo (o raio de
 * 22 recua até 22px da borda). Com a pílula de 32 na linha do cabeçalho, a placa começa 44px abaixo do topo da
 * tela; na mini UI, os cartões terminam aos 155, "Próximas contas" vai de 165 a 181 e as contas têm o ladrilho em
 * 192–216, 230–254 e 268–292 (no XS, 4px acima). O pé de cada placa é dado pelo respiro do último grupo
 * (`className`), medido a 1024, 1280 e 1440:
 * - login: 154 no XS (as duas faturas, sem o selo, que cortaria o título), 230 no S (mais "Ações › Pagar
 *   fatura"; sem a segunda linha, que passaria do pé), 261 do M para cima (com a segunda linha);
 * - sessão e segurança: 188 (duas linhas de duas alturas).
 */
const FORA_DO_XS = "@max-md/showcase:hidden"
const SO_DO_M = "@max-xl/showcase:hidden"
/** O selo não quebra em duas linhas ao lado do valor: quem cede é o título. */
const SELO = "shrink-0"
/** O selo da fatura sai no XS: com ele, "Fatura de outubro" cortaria em reticências. */
const SELO_DA_FATURA = cn(SELO, FORA_DO_XS)

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
                    descriptionClassName: SO_DO_M,
                    icon: CreditCardIcon,
                    meta: (
                        <>
                            <Badge variant="soft" tone="warning" size="xs" className={SELO_DA_FATURA}>
                                em 3 dias
                            </Badge>
                            <MoneyDisplay value={1284.6} size="sm" />
                        </>
                    ),
                },
                {
                    title: "Fatura de setembro",
                    description: "cartão final 4821 · fechou 05/09",
                    descriptionClassName: SO_DO_M,
                    icon: CreditCardIcon,
                    meta: (
                        <>
                            <Badge variant="soft" tone="success" size="xs" className={SELO_DA_FATURA}>
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
            className: cn(FORA_DO_XS, "pb-1 @min-xl/showcase:pb-3"),
        },
    ],
    "palette-session": [
        {
            heading: "Ir para",
            className: "pb-2.5",
            linhas: [
                { title: "Continuar de onde parou", description: "Painel · outubro", icon: ArrowUturnLeftIcon, meta: ENTER },
                { title: "Painel", description: "Saldo, contas e orçamento", icon: HomeIcon },
            ],
        },
    ],
    "palette-security": [
        {
            heading: "Segurança",
            className: "pb-2.5",
            linhas: [
                {
                    title: "Senha alterada",
                    description: "Segurança · sessões encerradas",
                    icon: KeyIcon,
                    meta: (
                        <Badge variant="soft" tone="success" size="xs" className={SELO}>
                            agora
                        </Badge>
                    ),
                },
                {
                    title: "Sessões ativas",
                    description: "Segurança · este computador",
                    icon: ComputerDesktopIcon,
                    meta: (
                        <Badge variant="soft" tone="neutral" size="xs" className={SELO}>
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
 * O rótulo do primeiro grupo, com o selo "exemplo" na ponta: a placa cobre o da mini UI. O `Badge xs` (14px)
 * cabe na linha do rótulo sem crescê-la — o pé de cada placa, medido contra a tela de trás, não muda —, e sai da
 * caixa alta e do espaçamento do rótulo, como a contagem do `CommandGroup`.
 */
function RotuloComSelo({ children }: { children: React.ReactNode }) {
    return (
        <span className="flex items-center justify-between gap-2">
            {children}
            <Badge variant="soft" tone="neutral" size="xs" className="shrink-0 tracking-normal normal-case">
                exemplo
            </Badge>
        </span>
    )
}

/**
 * Onde a paleta pousa: **a pílula do cabeçalho se estica no lugar**. O campo fica exatamente sobre ela (a 2,75rem
 * do topo do herói: a barra de 2,25rem e os 8px da pílula de 32 na linha de 48) e ocupa a área de conteúdo menos
 * 12px de cada lado — centrado nela, à direita do trilho de 3rem; a placa desce sobre a tela velada. Nenhuma tira
 * estreita sobra ao lado com pedaços da tela de trás.
 *
 * O `ShowcaseFloat center` prende o topo a 58% do herói, com 80% da largura dele: aqui a largura e a subida vêm
 * por extenso da `@utility showcase-stage` — a largura do herói é `min(86cqw, 140cqh)` (`min(92cqw, …)` abaixo
 * de 28rem), a altura é 10/16 dela, e 0,58 × 10/16 = 0,3625. Se a utility mudar, estes números acompanham.
 */
const POUSO_DA_PALETA = cn(
    "relative left-1/2 translate-x-[calc(-50%_+_1.5rem)]",
    "w-[calc(min(86cqw,140cqh)_-_4.5rem)] translate-y-[calc(2.75rem_-_min(31.175cqw,50.75cqh))]",
    "@max-md/showcase:w-[calc(min(92cqw,140cqh)_-_4.5rem)] @max-md/showcase:translate-y-[calc(2.75rem_-_min(33.35cqw,50.75cqh))]",
    // No palco estreito (abaixo de 24rem) a janela é 6/5: 0,58 × 5/6 = 0,48333.
    "@max-sm/showcase:translate-y-[calc(2.75rem_-_min(44.47cqw,67.67cqh))]"
)

/**
 * No palco estreito a placa tem ~230px: o título e o valor não cabem lado a lado (o valor passava da borda da
 * placa). Fica o título inteiro; o valor da fatura está na tela logo depois.
 */
const META_FORA_DO_ESTREITO = "@max-sm/showcase:hidden"

/**
 * Antes da escolha, nenhuma linha acesa: o cmdk acende a primeira ao registrar
 * os itens e a cada tecla, e com `value` controlado ele só volta ao valor da
 * prop quando ela muda — dois sentinelas que revezam (o mecanismo do
 * `useCommandIdleSelection`; o `\0` não colide com título nenhum).
 */
const NENHUMA = ["\0paleta-a", "\0paleta-b"] as const

export type PaletteDemoProps = {
    /** O roteiro da cena (`null` nas cenas sem paleta). */
    script: SceneScriptId | null
    /** O quadro do roteiro, que corre fora do pedaço (`PaletaDoRoteiro`). */
    frame: ScriptFrame
    /** O que o palco já mostra (o que `onStage` subiu): abre e fecha a paleta no mesmo commit da pílula. */
    stage: ScriptStage
    /** Sobe o palco do quadro atual, com o roteiro de quem o calculou. */
    onStage: (script: SceneScriptId | null, stage: ScriptStage) => void
}

export function PaletteDemo({ script, frame, stage, onStage }: PaletteDemoProps) {
    const reduced = useMovimentoReduzido()
    // A senha mascarada da recuperação é de outro desenho (o celular): aqui, só as três paletas.
    const roteiro: PaletteScript | null = script === "masked-password" ? null : script

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
                        density="menu"
                        value={escolhida ?? NENHUMA[nenhuma]}
                        onValueChange={aoAcender}
                        className="w-full"
                    >
                        <ShowcaseFlight layoutId="auth-search" active={aberta} className="rounded-full">
                            <CommandInput caret value={texto} placeholder="" />
                        </ShowcaseFlight>
                        {/* A placa entra com a primeira tecla, e as linhas surgem do desfoque em cascata (`command-reveal`). */}
                        {texto && grupos ? (
                            <CommandList>
                                {grupos.map(({ heading, linhas, className }, i) => (
                                    <CommandGroup
                                        key={heading}
                                        heading={i === 0 ? <RotuloComSelo>{heading}</RotuloComSelo> : heading}
                                        className={className}
                                    >
                                        {linhas.map(({ title, description, descriptionClassName, icon: Icon, meta }) => (
                                            <CommandItem key={title} value={title}>
                                                <CommandItemIcon>
                                                    <Icon />
                                                </CommandItemIcon>
                                                <CommandItemContent>
                                                    <CommandItemTitle>
                                                        <CommandHighlight>{title}</CommandHighlight>
                                                    </CommandItemTitle>
                                                    {description ? (
                                                        <CommandItemDescription className={descriptionClassName}>
                                                            <CommandHighlight>{description}</CommandHighlight>
                                                        </CommandItemDescription>
                                                    ) : null}
                                                </CommandItemContent>
                                                {meta ? <CommandItemMeta className={META_FORA_DO_ESTREITO}>{meta}</CommandItemMeta> : null}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                ))}
                            </CommandList>
                        ) : null}
                    </Command>
                </div>
            </ShowcaseFloat>
        </>
    )
}
