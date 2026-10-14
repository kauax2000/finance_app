"use client"

import * as React from "react"

import {
    CameraIcon,
    EnvelopeIcon,
    KeyIcon,
    LightBulbIcon,
    LockClosedIcon,
    ShieldCheckIcon,
} from "@heroicons/react/16/solid"

import { PasswordRequirements } from "@/components/auth/password-requirements"
import { focoPulaORoteiro, type SceneSpec } from "@/components/auth/showcase/scenes"
import { Card, CardContent } from "@/components/ui/card"
import { ColorTile } from "@/components/ui/color-tile"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { ShowcaseSwap, useShowcase } from "@/components/ui/showcase"
import { Spinner } from "@/components/ui/spinner"
import { Timeline, TimelineItem, TimelineTitle } from "@/components/ui/timeline"
import { useMovimentoReduzido, useSceneScript } from "@/hooks/use-scene-script"
import { fieldControlHeightClassName, fieldControlPaddingClassName, fieldSurfaceClassName } from "@/lib/field-classes"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

/**
 * # O celular da recuperação: as telas que não são o mundo comum
 *
 * "Esqueci minha senha" acontece no bolso: a tela de bloqueio desce sobre o
 * painel enquanto o código vem por e-mail; no passo da senha ela sobe e mostra a
 * tela "Nova senha", com o campo **desenhado** sendo preenchido pelo roteiro
 * `masked-password`; pelo link do e-mail, a tela confere o link e, vencido, fica
 * apagada sob o aviso. O `AuthShowcase` monta tudo aqui sobre o `AuthMiniApp`,
 * dentro da `Cobertura` (que apaga a tela no link vencido), e a linha do tempo
 * da recuperação é o chip ao lado do aparelho.
 *
 * **Camadas, nunca troca de tela.** O painel continua embaixo; por cima, a tela
 * do celular ("Nova senha" ou "conferindo", opacas, por `ShowcaseSwap`) e, por
 * cima de todas, o bloqueio, que só translada (`translate`, nunca `scale()`):
 * desce em 300ms na curva enfática e sobe em 300ms dentro da recuperação ou em
 * 200ms quando a recuperação acaba. Em repouso fora dela ele fica acima da tela
 * e `invisible`.
 *
 * **Nada que pareça um formulário.** O campo é um `div` com a superfície de
 * campo do DS (`field-classes`) e um `span` "•" por caractere, mais o
 * `type-caret` — nenhum `<input>`, `type="password"`, `id` ou `name` que colida
 * com o formulário de verdade ao lado. O cursor de texto pisca só enquanto o
 * roteiro digita: no fim o campo perde o foco desenhado e nada fica em laço.
 *
 * **Peças sem quebra de viewport** (seção 4 do plano), auditadas: `ColorTile`,
 * `Item`, `Spinner`, o `Progress` e o `FieldChecklist` do `PasswordRequirements`
 * (`grid-cols-2` fixo) não têm `sm:`/`md:`/`lg:`; a superfície de campo tem
 * `md:text-sm`, que só muda o corpo (o mockup inteiro fica na escala desktop).
 * A `Timeline` mora no chip, fora do aparelho, e é sempre horizontal.
 */

const cor = (nome: (typeof TILE_PALETTE)[number]["nome"]) => TILE_PALETTE.find((p) => p.nome === nome)!.hex

/* ── O bloqueio ────────────────────────────────────────────────────────── */

/**
 * A tela de bloqueio: o cadeado, a data e a hora fictícias do palco (quinta-feira, 9 de outubro, 9:41 — sem
 * `Date`) e, no pé, a lanterna e a câmera. O fundo desce do `muted` ao `background`: em cima ele encontra a
 * barra de status (que o `AuthShowcase` pinta de `muted` com o bloqueio), embaixo a faixa das abas, já
 * `background` — o bloqueio cobre o aparelho inteiro sem costura. A hora mora a um quarto da altura, abaixo de
 * onde a ilha se abre no aviso do código (a 1/6 o aviso encostava no cadeado).
 */
function Bloqueio({ down, rapido }: { down: boolean; rapido: boolean }) {
    return (
        <div
            data-slot="auth-lock-screen"
            data-state={down ? "down" : "up"}
            className={cn(
                "absolute inset-0 flex flex-col items-center bg-linear-to-b from-muted to-background text-center",
                "transition-[translate,visibility] ease-(--ease-emphasized)",
                down ? "visible translate-y-0 duration-(--duration-slow)" : "invisible -translate-y-full",
                !down && (rapido ? "duration-(--duration-base)" : "duration-(--duration-slow)")
            )}
        >
            <div className="shrink-0 basis-1/4" />
            <LockClosedIcon aria-hidden className="size-4 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">quinta-feira, 9 de outubro</p>
            <p className="text-5xl font-semibold tracking-tight nums">9:41</p>
            <div className="mt-auto flex w-full justify-between px-5 pb-4">
                {[LightBulbIcon, CameraIcon].map((Icon, i) => (
                    <span key={i} className="flex size-9 items-center justify-center rounded-full bg-foreground/10">
                        <Icon aria-hidden className="size-4" />
                    </span>
                ))}
            </div>
        </div>
    )
}

/* ── A nova senha ──────────────────────────────────────────────────────── */

/**
 * O campo desenhado da senha nova: a superfície de campo do DS (cápsula, contorno `--input`, preenchimento a
 * `/50`), focado enquanto o roteiro digita (o anel do sistema), um ponto por caractere e o cursor de texto. O
 * `PasswordRequirements` de verdade recebe a mesma senha, letra a letra: as regras acendem conforme ela cresce.
 * O roteiro começa quando o campo monta — a cada entrada na cena, e depois do link conferido.
 */
function CampoDaSenha() {
    const { active } = useShowcase()
    const reduced = useMovimentoReduzido()
    const { frame, skip } = useSceneScript("masked-password", { active, reduced })

    // Quem foi trabalhar na coluna pula a digitação (o mesmo filtro da paleta do login).
    React.useEffect(() => {
        const ouvir = (e: FocusEvent) => {
            if (focoPulaORoteiro(e.target)) skip()
        }
        document.addEventListener("focusin", ouvir)
        return () => document.removeEventListener("focusin", ouvir)
    }, [skip])

    const senha = frame.text ?? ""
    const digitando = frame.beat !== "done"
    return (
        <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">Senha</p>
            <div
                data-slot="auth-drawn-password"
                className={cn(
                    fieldSurfaceClassName,
                    fieldControlHeightClassName.lg,
                    fieldControlPaddingClassName.lg,
                    "flex items-center gap-px text-foreground",
                    digitando && "border-ring ring-3 ring-ring/30"
                )}
            >
                {Array.from(senha, (_, i) => (
                    <span key={i} className="leading-none">
                        •
                    </span>
                ))}
                {digitando ? <span className="type-caret ms-px" /> : null}
            </div>
            {/* No palco baixo (o celular de 201px) as duas colunas das regras quebram "8+ caracteres": uma coluna, sem o
                título da lista — o campo logo acima já diz de quem são as regras. */}
            <div className="showcase-short:[&_[data-slot=field-checklist]_ul]:grid-cols-1 showcase-short:[&_[data-slot=field-checklist]>p]:hidden">
                <PasswordRequirements password={senha} />
            </div>
        </div>
    )
}

/** O link do e-mail sendo conferido: a roda do sistema e a linha que diz o que está acontecendo, no lugar do campo. */
function ConferindoOLink() {
    return (
        <Item size="sm" variant="muted">
            <ItemMedia>
                <Spinner />
            </ItemMedia>
            <ItemContent>
                <ItemTitle>Conferindo seu link…</ItemTitle>
                <ItemDescription>Leva só um instante.</ItemDescription>
            </ItemContent>
        </Item>
    )
}

/**
 * A tela "Nova senha" do celular: o ladrilho, o título e a frase, e embaixo o campo — ou, pelo link do e-mail,
 * a linha que confere o link, no lugar dele (o link conferido vira o campo, e o cabeçalho não pisca). A linha
 * das sessões encerradas mora no pé: o `PasswordRequirements` só aparece na primeira tecla, e ela não pula.
 */
function TelaDaSenha({ conferindo }: { conferindo: boolean }) {
    return (
        <div
            data-slot="auth-phone-screen"
            data-screen={conferindo ? "link-checking" : "new-password"}
            className="flex size-full flex-col gap-4 bg-background px-4 pt-4"
        >
            <div className="flex flex-col">
                <ColorTile tint="soft" size="lg" color={cor("violeta")} className="mb-2 showcase-short:hidden">
                    <KeyIcon />
                </ColorTile>
                <p className="text-base font-semibold">Nova senha</p>
                {/* No palco baixo a frase sai: as regras em uma coluna precisam da altura dela. */}
                <p className="text-xs text-muted-foreground showcase-short:hidden">Escolha uma senha para entrar de novo.</p>
            </div>
            <div className="relative">
                <ShowcaseSwap swapKey={conferindo ? "conferindo" : "campo"} effect="rise">
                    {conferindo ? <ConferindoOLink /> : <CampoDaSenha />}
                </ShowcaseSwap>
            </div>
            <Item size="sm" variant="muted" className={cn("mt-auto mb-4 transition-opacity duration-(--duration-base)", conferindo && "opacity-0")}>
                <ItemMedia variant="icon">
                    <ShieldCheckIcon className="text-muted-foreground" />
                </ItemMedia>
                <ItemContent>
                    {/* Sem o corte em duas linhas: no celular de 201px (a janela de 1024) a frase pede três. */}
                    <ItemDescription className="line-clamp-none text-foreground">Sessões em outros aparelhos serão encerradas</ItemDescription>
                </ItemContent>
            </Item>
        </div>
    )
}

/* ── As camadas ────────────────────────────────────────────────────────── */

export type PhoneScreen = Extract<SceneSpec["screen"], "new-password" | "link-checking">

/**
 * O que a recuperação põe sobre o painel: a tela da senha (`tela`, que entra e sai por `ShowcaseSwap`) e o
 * bloqueio por cima (`bloqueio`; `rapido` quando ele sobe porque a recuperação acabou). Fora da recuperação
 * nada aparece: a tela vazia e o bloqueio em cima, invisível.
 */
export function AuthPhoneScreens({ tela, bloqueio, rapido }: { tela: PhoneScreen | null; bloqueio: boolean; rapido: boolean }) {
    return (
        <>
            <div className="absolute inset-0">
                <ShowcaseSwap swapKey={tela ? "senha" : "nenhuma"} className="size-full">
                    {tela ? <TelaDaSenha conferindo={tela === "link-checking"} /> : null}
                </ShowcaseSwap>
            </div>
            <Bloqueio down={bloqueio} rapido={rapido} />
        </>
    )
}

/* ── A linha do tempo ──────────────────────────────────────────────────── */

/**
 * Os três passos, cada um pelo que ele toca: o código que vai ao e-mail, o código conferido e a senha nova. Uma
 * palavra por passo: com "Código enviado", "Código conferido" e "Nova senha" os títulos vizinhos se tocavam na
 * largura de um cartão (192px no palco S), e em duas linhas o chip crescia sem dizer mais que o ícone já diz.
 */
const PASSOS_DA_RECUPERACAO = [
    { icon: EnvelopeIcon, titulo: "E-mail" },
    { icon: KeyIcon, titulo: "Código" },
    { icon: LockClosedIcon, titulo: "Senha" },
] as const

/** A largura dos cartões da colagem, por nível do palco: o chip mora na coluna deles, ao lado do celular. */
const LARGURA_DE_CARTAO = "w-44 @md/showcase:w-48 @xl/showcase:w-56"

/**
 * O chip da recuperação: os três passos numa `Timeline` horizontal de poços — o feito em verde (o passo deu
 * certo), o atual com o anel, o que falta tracejado. `current` 3 é o fim, com os três feitos: é assim que a
 * linha sai quando a senha é trocada.
 */
export function AuthRecoveryTimeline({ timeline }: { timeline: NonNullable<SceneSpec["timeline"]> }) {
    return (
        <Card variant="elevated" padding="sm" className={cn("shadow-lg", LARGURA_DE_CARTAO)}>
            <CardContent>
                {/* O último passo reserva à direita a metade do título que passa do poço: o recuo só à esquerda centra a
                    trilha no cartão (as pontas dos títulos ficam a 27 e 32px das bordas, no palco S). */}
                <Timeline orientation="horizontal" marker="icon" size="sm" className="ps-5">
                    {PASSOS_DA_RECUPERACAO.map(({ icon: Icon, titulo }, i) => {
                        const state = i < timeline.current ? "done" : i === timeline.current ? "current" : "upcoming"
                        return (
                            <TimelineItem key={titulo} state={state} tone={state === "done" ? "success" : "primary"} icon={<Icon />}>
                                <TimelineTitle>{titulo}</TimelineTitle>
                            </TimelineItem>
                        )
                    })}
                </Timeline>
            </CardContent>
        </Card>
    )
}
