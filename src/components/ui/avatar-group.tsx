"use client"

import * as React from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react"
import { useIsHydrated } from "radix-ui/internal"
import { PlusIcon } from "@heroicons/react/16/solid"

import { Avatar, AvatarFallback, AvatarImage, avatarVariants } from "@/components/ui/avatar"
import { Badge, BadgeDot } from "@/components/ui/badge"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { tooltipContentVariants } from "@/components/ui/tooltip"
import { useIsMobile, useViewportWindow } from "@/hooks/use-mobile"
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface"
import { identityToneFor } from "@/lib/avatar"
import { menuPanelSurfaceClassName } from "@/lib/menu-classes"
import { MOLA } from "@/lib/spring"
import { cn, getInitials } from "@/lib/utils"

/**
 * Pessoas empilhadas — rodada 246, a partir do Avatar Group do Animate UI
 * (Elliot Sutton, `primitives-animate-avatar-group`, lido do registry).
 *
 * Da referência vêm três coisas: a pilha com o anel na cor do fundo, o rosto
 * que **sobe** na mola quando o ponteiro chega, e **uma dica só**, que viaja de
 * um rosto ao outro em vez de fechar e abrir. A dica não é um `Tooltip` do
 * Radix: a âncora de um `Tooltip` é o gatilho dele, e não se troca. Aqui a
 * posição é calculada a cada troca e animada num `MotionValue`; o visual é o
 * da `Tooltip` (`tooltipContentVariants`).
 *
 * O nome de cada pessoa é o nome acessível do rosto, então a dica é
 * `aria-hidden`: ela repete à vista o que o leitor de tela já ouve.
 */

type Tamanho = "xs" | "sm" | "md" | "lg" | "xl"
type Status = "success" | "warning" | "info" | "destructive" | "neutral"

/** A subida e a viagem da referência, com os números dela. */
const SUBIDA = { type: "spring", stiffness: 300, damping: 17 } as const
const VIAGEM = { type: "spring", stiffness: 300, damping: 35 } as const
const INSTANTE = { duration: 0 } as const
/** Quanto o rosto sobe, em fração do diâmetro — o `-30%` da referência. */
const SUBIDA_FRACAO = 0.3
/** O vão entre a dica e o rosto erguido: o `sideOffset` da `Tooltip`. */
const VAO_DICA = 6

/**
 * A sobreposição é 25% do diâmetro, a da referência (12 em 48), em cada
 * degrau do `Avatar`. No leque ela vira um vão de 4px.
 */
const SOBREPOR: Record<Tamanho, string> = {
  xs: "-ms-1.5",
  sm: "-ms-2",
  md: "-ms-2.5",
  lg: "-ms-3",
  xl: "-ms-3.5",
}
const LEQUE = "ms-1"

/** O anel que separa um rosto do vizinho: 2px até o `md`, 3 no `lg` e `xl`. */
const ANEL: Record<Tamanho, string> = {
  xs: "ring-2",
  sm: "ring-2",
  md: "ring-2",
  lg: "ring-3",
  xl: "ring-3",
}
/**
 * A cor do anel é a da superfície onde a pilha pousa. Quem a declara primeiro
 * é a tela (`--avatar-group-ring`, num ancestral ou na própria pilha); sem ela,
 * vale `--avatar-group-surface`, que a raiz escreve sozinha dentro de um `Card`
 * e de um `Popover`; fora deles, a página.
 *
 * São duas variáveis porque uma só não deixava a tela vencer: a regra "dentro
 * de um cartão" mora na raiz, e uma variável declarada na raiz vence a herdada
 * — medido, um painel `muted` dentro de um cartão saía com o anel do cartão.
 */
const ANEL_COR =
  "ring-[color:var(--avatar-group-ring,var(--avatar-group-surface,var(--color-background)))]"
/**
 * O fundo do +N: a tinta a 10% misturada na superfície da pilha, opaca. Era
 * `bg-muted`, e sobre um painel `muted` o +N sumia — medido, a mesma cor do
 * fundo. Misturado, ele fica um degrau acima de qualquer superfície.
 */
const MAIS_FUNDO =
  "bg-[color-mix(in_oklab,var(--color-foreground)_10%,var(--avatar-group-ring,var(--avatar-group-surface,var(--color-background))))]"
const SUPERFICIE =
  "in-data-[slot=card]:[--avatar-group-surface:var(--color-card)] in-data-[slot=popover-content]:[--avatar-group-surface:var(--color-popover)]"
const FOCO = "group-focus-visible/face:ring-3 group-focus-visible/face:ring-ring/45"

/** O selo: um quarto do diâmetro, mais ou menos, com o mesmo anel. */
const SELO: Record<Tamanho, string> = {
  xs: "size-2",
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
  xl: "size-4",
}
const SELO_COR: Record<Status, string> = {
  success: "[--badge-dot:var(--success)]",
  warning: "[--badge-dot:var(--warning)]",
  info: "[--badge-dot:var(--info)]",
  destructive: "[--badge-dot:var(--destructive)]",
  neutral: "[--badge-dot:var(--muted-foreground)]",
}

/**
 * O alvo no dedo: a altura vai a 44 por um `::after` que só cresce para cima e
 * para baixo — dos lados estão os vizinhos. A largura é a fatia à vista.
 */
const ALVO: Record<Tamanho, string> = {
  xs: "pointer-coarse:after:-inset-y-2.5",
  sm: "pointer-coarse:after:-inset-y-1.5",
  md: "pointer-coarse:after:-inset-y-0.5",
  lg: "",
  xl: "",
}
const FACE = cn(
  "group/face relative block rounded-full outline-none select-none",
  "after:absolute after:inset-x-0 after:inset-y-0",
  "data-[interactive]:cursor-pointer data-[interactive]:transition-transform data-[interactive]:duration-(--duration-fast) data-[interactive]:active:scale-95"
)

/* ── Contexto ─────────────────────────────────────────────────────────────── */

const GrupoContext = React.createContext<{ size: Tamanho; tint: "vivid" | "soft" }>({
  size: "md",
  tint: "vivid",
})

/** A vaga de cada peça: a parada de Tab e o registro do foco itinerante. */
const VagaContext = React.createContext<{
  tabIndex: 0 | -1
  registrar: (el: HTMLElement | null) => void
} | null>(null)

/* ── Texto ────────────────────────────────────────────────────────────────── */

const LISTA = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" })
const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome

/** "Ana, Bruno e Carla"; com mais de três, "Ana, Bruno e mais 4". */
function resumirNomes(nomes: string[]): string {
  const primeiros = nomes.map(primeiroNome)
  if (primeiros.length <= 3) return LISTA.format(primeiros)
  return `${primeiros.slice(0, 2).join(", ")} e mais ${primeiros.length - 2}`
}

/* ── Rosto ────────────────────────────────────────────────────────────────── */

type AvatarGroupItemProps = {
  /** O nome da pessoa: as iniciais, a cor (sem `color`), a dica e o nome acessível. */
  name: string
  /** A foto. Sem ela, as iniciais. */
  src?: string | null
  /** O que o perfil tem gravado (`profiles.avatar_color`), lido por `identityToneFor`. */
  color?: string | null
  /** A segunda linha na lista do +N: o e-mail, o papel. */
  description?: React.ReactNode
  /** O rosto vira link. */
  href?: string
  /** O rosto vira botão. */
  onSelect?: () => void
  className?: string
} & (
  | { status?: undefined; statusLabel?: undefined }
  | {
      /** O selo no canto do rosto. */
      status: Status
      /** O que o selo quer dizer — entra no nome acessível, na dica e na lista. */
      statusLabel: string
    }
)

function Rosto({
  name,
  src,
  color,
  size,
  tint,
  status,
  anel = true,
}: Pick<AvatarGroupItemProps, "name" | "src" | "color"> & {
  size: Tamanho
  tint: "vivid" | "soft"
  status?: Status
  anel?: boolean
}) {
  const tom = identityToneFor(color, name)
  return (
    <span className="relative block">
      <Avatar size={size} className={cn(anel && [ANEL[size], ANEL_COR, FOCO])}>
        {src ? <AvatarImage src={src} alt="" loading="lazy" /> : null}
        <AvatarFallback tint={tint} className={cn("font-semibold", tom.surface, tom.ink)}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status ? (
        <BadgeDot
          data-slot="avatar-group-status"
          className={cn(
            "absolute end-0 bottom-0 rounded-full",
            // Com o último por cima, o vizinho da direita cobre o canto direito:
            // o selo passa para o canto que fica à vista.
            "in-data-[stacking=last]:start-0 in-data-[stacking=last]:end-auto",
            SELO[size],
            SELO_COR[status],
            anel && ["ring-2", ANEL_COR]
          )}
        />
      ) : null}
    </span>
  )
}

const nomeAcessivel = (p: Pick<AvatarGroupItemProps, "name" | "statusLabel">) =>
  p.statusLabel ? `${p.name}, ${p.statusLabel}` : p.name

/**
 * Uma pessoa da pilha. Com `href` é link, com `onSelect` é botão; sem os dois,
 * é uma imagem com nome (`role="img"`) que ainda recebe o foco, para a dica
 * aparecer pelo teclado.
 */
function AvatarGroupItem(props: AvatarGroupItemProps) {
  const { name, src, color, status, href, onSelect, className } = props
  const { size, tint } = React.useContext(GrupoContext)
  const vaga = React.useContext(VagaContext)
  const comum = {
    ref: vaga?.registrar,
    tabIndex: vaga?.tabIndex,
    "aria-label": nomeAcessivel(props),
    "data-slot": "avatar-group-item",
    "data-interactive": href || onSelect ? "" : undefined,
    className: cn(FACE, ALVO[size], className),
  }
  const rosto = <Rosto name={name} src={src} color={color} size={size} tint={tint} status={status} />
  if (href) {
    return (
      <Link href={href} {...comum}>
        {rosto}
      </Link>
    )
  }
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} {...comum}>
        {rosto}
      </button>
    )
  }
  return (
    <span role="img" {...comum}>
      {rosto}
    </span>
  )
}

/**
 * O "+" no fim da pilha, para convidar. Entra pelo `add` do grupo, que o põe
 * depois do +N. `label` é obrigatório: o círculo não tem texto.
 */
function AvatarGroupAdd({
  label,
  href,
  onClick,
  className,
}: {
  label: string
  href?: string
  onClick?: () => void
  className?: string
}) {
  const { size } = React.useContext(GrupoContext)
  const vaga = React.useContext(VagaContext)
  const circulo = (
    <span
      className={cn(
        avatarVariants({ size }),
        "items-center justify-center border border-dashed border-foreground/25 text-muted-foreground",
        "transition-colors duration-(--duration-fast)",
        "group-hover/face:bg-muted group-hover/face:text-foreground group-active/face:bg-muted group-active/face:text-foreground",
        "[&>svg]:size-4",
        FOCO
      )}
    >
      <PlusIcon aria-hidden />
    </span>
  )
  const comum = {
    ref: vaga?.registrar,
    tabIndex: vaga?.tabIndex,
    "aria-label": label,
    "data-slot": "avatar-group-add",
    "data-interactive": "",
    className: cn(FACE, ALVO[size], className),
  }
  return href ? (
    <Link href={href} {...comum}>
      {circulo}
    </Link>
  ) : (
    <button type="button" onClick={onClick} {...comum}>
      {circulo}
    </button>
  )
}

/* ── A vaga: a sobreposição, a camada, a subida ───────────────────────────── */

function Vaga({
  indice,
  margem,
  z,
  ativo,
  reduzido,
  vagaRef,
  onAtivar,
  onAlternar,
  children,
}: {
  indice: number
  margem?: string
  z: number
  ativo: boolean
  reduzido: boolean
  vagaRef: (el: HTMLDivElement | null) => void
  onAtivar: (i: number) => void
  onAlternar: (i: number) => void
  children: React.ReactNode
}) {
  // Eventos de portal sobem pela árvore do React: a lista do +N é filha desta
  // vaga, e sem a conferência no DOM passar o cursor nela erguia o +N.
  const daqui = (e: React.SyntheticEvent) => e.currentTarget.contains(e.target as Node)
  return (
    <motion.div
      ref={vagaRef}
      layout="position"
      transition={reduzido ? INSTANTE : MOLA}
      data-slot="avatar-group-slot"
      data-active={ativo || undefined}
      className={cn("relative shrink-0", margem)}
      style={{ zIndex: z }}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch" && daqui(e)) onAtivar(indice)
      }}
      onPointerDown={(e) => {
        // No toque não há cursor: tocar no rosto o ergue e mostra o nome, e
        // tocar de novo o baixa. Link e botão agem, e não alternam.
        if (e.pointerType === "touch" && daqui(e) && !(e.target as Element).closest("a,button")) {
          onAlternar(indice)
        }
      }}
      onFocus={(e) => {
        if (daqui(e)) onAtivar(indice)
      }}
    >
      <motion.div initial={false} animate={{ y: ativo ? `${-SUBIDA_FRACAO * 100}%` : 0 }} transition={reduzido ? INSTANTE : SUBIDA}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── O grupo ──────────────────────────────────────────────────────────────── */

type AvatarGroupProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** O nome do grupo para o leitor de tela, e o título da lista do +N ("Membros da carteira"). */
  label: string
  /** O degrau do `Avatar`: xs 24 · sm 32 · md 40 · lg 48 · xl 56. */
  size?: Tamanho
  /** Quantos rostos aparecem; o resto vira o +N, que abre a lista inteira. */
  max?: number
  /** O leque: a pilha se abre quando o ponteiro, o foco ou o toque chegam. */
  spread?: boolean
  /** Quem fica por cima: o primeiro (a leitura da esquerda) ou o último. */
  stacking?: "first" | "last"
  /** A pílula da dica: `contrast` (a grave, a da referência) ou `plate`. */
  tooltip?: "contrast" | "plate"
  /** A versão das iniciais, como no `AvatarFallback`. */
  tint?: "vivid" | "soft"
  /** O texto ao lado: `true` escreve "Ana, Bruno e mais 3"; um nó escreve o que vier. */
  summary?: boolean | React.ReactNode
  /** O `AvatarGroupAdd`, no fim da pilha. */
  add?: React.ReactElement<React.ComponentProps<typeof AvatarGroupAdd>>
  /** Os `AvatarGroupItem`. */
  children: React.ReactNode
}

function AvatarGroup({
  label,
  size = "md",
  max,
  spread = false,
  stacking = "first",
  tooltip = "contrast",
  tint = "vivid",
  summary,
  add,
  className,
  children,
  ...props
}: AvatarGroupProps) {
  const reduzido = useReducedMotion() ?? false
  const janela = useViewportWindow()
  const montado = useIsHydrated()
  const resumoId = React.useId()

  // Os filhos são `AvatarGroupItem`: a lista do +N e a dica leem as props deles.
  const pessoas = React.Children.toArray(children).filter(
    React.isValidElement<AvatarGroupItemProps>
  )
  const limite = max != null && max < pessoas.length ? Math.max(1, max) : pessoas.length
  const vistas = pessoas.slice(0, limite)
  const escondidas = pessoas.slice(limite)
  const temMais = escondidas.length > 0
  const vagas = vistas.length + (temMais ? 1 : 0) + (add ? 1 : 0)
  const iMais = temMais ? vistas.length : -1
  const iAdd = add ? vagas - 1 : -1

  const rotulos = [
    ...vistas.map((p) => (p.props.statusLabel ? `${p.props.name} · ${p.props.statusLabel}` : p.props.name)),
    ...(temMais ? [resumirNomes(escondidas.map((p) => p.props.name))] : []),
    ...(add ? [add.props.label] : []),
  ]

  const [ativo, setAtivo] = React.useState<number | null>(null)
  // O último rosto aceso: a dica sai esmaecendo com o nome dele.
  const [ultimo, setUltimo] = React.useState(0)
  const [foco, setFoco] = React.useState(0)
  const [dentro, setDentro] = React.useState(false)
  const [listaAberta, setListaAberta] = React.useState(false)
  const pilhaRef = React.useRef<HTMLDivElement>(null)
  const vagasRef = React.useRef<(HTMLDivElement | null)[]>([])
  const elementosRef = React.useRef<(HTMLElement | null)[]>([])
  const paradaDeTab = Math.min(foco, vagas - 1)
  const aberto = spread && (dentro || ativo != null)

  // Fecha a dica no Esc, ao rolar, ao redimensionar e no toque fora.
  React.useEffect(() => {
    if (ativo == null) return
    const alvo = janela ?? window
    const fechar = () => setAtivo(null)
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar()
    const fora = (e: PointerEvent) => {
      if (!pilhaRef.current?.contains(e.target as Node)) fechar()
    }
    alvo.addEventListener("keydown", tecla)
    alvo.addEventListener("scroll", fechar, { capture: true, passive: true })
    alvo.addEventListener("resize", fechar)
    alvo.document.addEventListener("pointerdown", fora, true)
    return () => {
      alvo.removeEventListener("keydown", tecla)
      alvo.removeEventListener("scroll", fechar, { capture: true })
      alvo.removeEventListener("resize", fechar)
      alvo.document.removeEventListener("pointerdown", fora, true)
    }
  }, [ativo, janela])

  /* A dica: um ponto (o meio de cima do rosto) que viaja numa mola. */
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const dicaRef = React.useRef<HTMLDivElement>(null)
  const visivelRef = React.useRef(false)
  const texto = rotulos[ativo ?? ultimo] ?? ""

  React.useLayoutEffect(() => {
    if (ativo == null) {
      visivelRef.current = false
      return
    }
    const vaga = vagasRef.current[ativo]
    const pilha = pilhaRef.current
    const dica = dicaRef.current
    if (!vaga || !pilha || !dica) return
    // A posição de layout, e não a da tela: no leque as vagas ainda deslizam
    // (transformação do `layout`), e a dica tem de ir aonde elas vão parar.
    const caixa = pilha.getBoundingClientRect()
    const meio = caixa.left + vaga.offsetLeft + vaga.offsetWidth / 2
    const topo = caixa.top + vaga.offsetTop
    const largura = (janela ?? window).innerWidth
    const folga = ANCHORED_COLLISION_PADDING
    let alvoY = topo - vaga.offsetHeight * SUBIDA_FRACAO - VAO_DICA
    // Sem lugar em cima, a dica desce. O lado vai no DOM, e não num estado:
    // é uma classe de posição, e um render a mais só para ela não paga.
    const embaixo = alvoY - dica.offsetHeight < folga
    if (embaixo) alvoY = topo + vaga.offsetHeight + VAO_DICA
    dica.dataset.side = embaixo ? "bottom" : "top"
    const metade = dica.offsetWidth / 2
    const alvoX = Math.min(Math.max(meio, folga + metade), largura - folga - metade)
    if (!visivelRef.current || reduzido) {
      x.jump(alvoX)
      y.jump(alvoY)
    } else {
      animate(x, alvoX, VIAGEM)
      animate(y, alvoY, VIAGEM)
    }
    visivelRef.current = true
  }, [ativo, aberto, texto, size, janela, reduzido, x, y])

  const ativar = (i: number) => {
    setAtivo(i)
    setUltimo(i)
  }
  const alternar = (i: number) => {
    setAtivo((a) => (a === i ? null : i))
    setUltimo(i)
  }

  const mover = (para: number) => {
    const i = Math.max(0, Math.min(vagas - 1, para))
    setFoco(i)
    elementosRef.current[i]?.focus()
  }

  const zDe = (i: number) =>
    i === ativo ? vagas + 2 : stacking === "first" ? vagas - i : i + 1

  const vaga = (i: number, conteudo: React.ReactNode, margem?: string) => (
    <Vaga
      key={i}
      indice={i}
      margem={margem}
      z={zDe(i)}
      ativo={ativo === i}
      reduzido={reduzido}
      vagaRef={(el) => {
        vagasRef.current[i] = el
      }}
      onAtivar={(j) => {
        ativar(j)
        setFoco(j)
      }}
      onAlternar={alternar}
    >
      <VagaContext.Provider
        value={{
          tabIndex: i === paradaDeTab ? 0 : -1,
          registrar: (el) => {
            elementosRef.current[i] = el
          },
        }}
      >
        {conteudo}
      </VagaContext.Provider>
    </Vaga>
  )

  const margemDe = (i: number) => (i === 0 ? undefined : aberto ? LEQUE : SOBREPOR[size])

  const resumo =
    summary === true ? resumirNomes(pessoas.map((p) => p.props.name)) : summary || null

  return (
    <GrupoContext.Provider value={{ size, tint }}>
      <div
        data-slot="avatar-group"
        data-size={size}
        data-stacking={stacking}
        role="group"
        aria-label={label}
        aria-describedby={resumo ? resumoId : undefined}
        className={cn(
          "inline-flex max-w-full items-center gap-2",
          SUPERFICIE,
          className
        )}
        {...props}
      >
        <div
          ref={pilhaRef}
          data-slot="avatar-group-stack"
          data-open={aberto || undefined}
          className="relative isolate flex items-center"
          onPointerEnter={(e) => {
            if (e.pointerType !== "touch") setDentro(true)
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "touch") return
            setDentro(false)
            setAtivo(null)
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAtivo(null)
          }}
          onKeyDown={(e) => {
            // Só as paradas da pilha: as setas dentro da lista do +N (um
            // portal, mas filho desta árvore) são da lista.
            const i = elementosRef.current.indexOf(e.target as HTMLElement)
            if (i < 0) return
            const para =
              e.key === "ArrowRight" || e.key === "ArrowDown"
                ? i + 1
                : e.key === "ArrowLeft" || e.key === "ArrowUp"
                  ? i - 1
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? vagas - 1
                      : null
            if (para == null) return
            e.preventDefault()
            mover(para)
          }}
        >
          {vistas.map((p, i) => vaga(i, p, margemDe(i)))}
          {temMais
            ? vaga(
                iMais,
                <ListaDoMais
                  label={label}
                  pessoas={pessoas.map((p) => p.props)}
                  escondidas={escondidas.length}
                  nomes={rotulos[iMais]}
                  size={size}
                  tint={tint}
                  aberta={listaAberta}
                  onAbrir={(v) => {
                    setListaAberta(v)
                    if (v) setAtivo(null)
                  }}
                />,
                margemDe(iMais)
              )
            : null}
          {add ? vaga(iAdd, add, "ms-2") : null}
        </div>
        {resumo ? (
          <span
            id={resumoId}
            data-slot="avatar-group-summary"
            className="min-w-0 truncate text-sm text-muted-foreground"
          >
            {resumo}
          </span>
        ) : null}
      </div>

      {montado
        ? createPortal(
            <motion.div
              aria-hidden
              data-slot="avatar-group-tooltip"
              className="pointer-events-none fixed top-0 left-0 z-(--z-popover)"
              style={{ x, y }}
            >
              <motion.div
                ref={dicaRef}
                initial={false}
                animate={
                  ativo != null
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: reduzido ? 1 : 0.5 }
                }
                transition={reduzido ? INSTANTE : MOLA}
                className={cn(
                  "w-max max-w-80 -translate-x-1/2 -translate-y-full origin-bottom",
                  "data-[side=bottom]:translate-y-0 data-[side=bottom]:origin-top",
                  tooltip === "plate" ? menuPanelSurfaceClassName : null,
                  tooltipContentVariants({ size: "sm", variant: tooltip })
                )}
              >
                {texto}
              </motion.div>
            </motion.div>,
            janela?.document.body ?? document.body
          )
        : null}
    </GrupoContext.Provider>
  )
}

/* ── O +N e a lista inteira ───────────────────────────────────────────────── */

function ListaDoMais({
  label,
  pessoas,
  escondidas,
  nomes,
  size,
  tint,
  aberta,
  onAbrir,
}: {
  label: string
  pessoas: AvatarGroupItemProps[]
  escondidas: number
  nomes: string
  size: Tamanho
  tint: "vivid" | "soft"
  aberta: boolean
  onAbrir: (v: boolean) => void
}) {
  const vaga = React.useContext(VagaContext)
  // A mesma regra do `Popover mobile="sheet"`: no telefone a lista é gaveta.
  const folha = useIsMobile()
  return (
    <Popover mobile="sheet" open={aberta} onOpenChange={onAbrir}>
      <PopoverTrigger asChild>
        <button
          ref={vaga?.registrar}
          type="button"
          tabIndex={vaga?.tabIndex}
          aria-label={`Mais ${escondidas}: ${nomes}`}
          data-slot="avatar-group-count"
          data-interactive=""
          className={cn(FACE, ALVO[size])}
        >
          <span
            className={cn(
              avatarVariants({ size }),
              "nums items-center justify-center font-medium text-foreground/75",
              MAIS_FUNDO,
              "transition-colors duration-(--duration-fast) group-hover/face:text-foreground group-active/face:text-foreground",
              ANEL[size],
              ANEL_COR,
              FOCO
            )}
          >
            +{escondidas}
          </span>
        </button>
      </PopoverTrigger>
      {/* O nome de cada linha cai no eixo do título. No popover as linhas
          recuam 8 do casco, como nos menus, e o cabeçalho recua 8 + 10; na
          gaveta o casco já recua 16 para os dois, e a lista sangra os 10 do
          recuo da linha. */}
      <PopoverContent
        size="md"
        align="start"
        padding="none"
        className="flex flex-col [--popover-strip-px:--spacing(4.5)]"
      >
        <PopoverHeader>
          <PopoverTitle>{label}</PopoverTitle>
          <PopoverDescription>
            {pessoas.length} {pessoas.length === 1 ? "pessoa" : "pessoas"}
          </PopoverDescription>
        </PopoverHeader>
        <PopoverBody className={cn("pb-2", folha ? "-mx-2.5 px-0" : "px-2")}>
          <ul role="list" className="flex flex-col">
            {pessoas.map((p, i) => (
              <li key={`${p.name}-${i}`}>
                <LinhaDaPessoa pessoa={p} tint={tint} onEscolher={() => onAbrir(false)} />
              </li>
            ))}
          </ul>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

function LinhaDaPessoa({
  pessoa,
  tint,
  onEscolher,
}: {
  pessoa: AvatarGroupItemProps
  tint: "vivid" | "soft"
  onEscolher: () => void
}) {
  const conteudo = (
    <>
      <ItemMedia>
        <Rosto name={pessoa.name} src={pessoa.src} color={pessoa.color} size="sm" tint={tint} anel={false} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="min-w-0">
          <span className="truncate">{pessoa.name}</span>
        </ItemTitle>
        {pessoa.description ? <ItemDescription className="truncate">{pessoa.description}</ItemDescription> : null}
      </ItemContent>
      {pessoa.status ? (
        <Badge tone={pessoa.status} size="xs" className="shrink-0">
          {pessoa.statusLabel}
        </Badge>
      ) : null}
    </>
  )
  if (pessoa.href) {
    return (
      <Item size="sm" interactive asChild>
        <Link href={pessoa.href} onClick={onEscolher}>
          {conteudo}
        </Link>
      </Item>
    )
  }
  if (pessoa.onSelect) {
    const escolher = pessoa.onSelect
    return (
      <Item size="sm" interactive asChild>
        <button
          type="button"
          className="w-full"
          onClick={() => {
            escolher()
            onEscolher()
          }}
        >
          {conteudo}
        </button>
      </Item>
    )
  }
  return <Item size="sm">{conteudo}</Item>
}

/* ── Esqueleto ────────────────────────────────────────────────────────────── */

/**
 * A pilha esperando: os círculos na escada e na sobreposição do grupo, com o
 * mesmo anel. `group={false}` dentro de um esqueleto de página, que já anuncia.
 */
function AvatarGroupSkeleton({
  count = 4,
  size = "md",
  summary = false,
  group = true,
  className,
}: {
  count?: number
  size?: Tamanho
  summary?: boolean
  group?: boolean
  className?: string
}) {
  const ossos = (
    <div
      data-slot="avatar-group-skeleton"
      className={cn(
        "inline-flex items-center gap-2",
        SUPERFICIE,
        className
      )}
    >
      <div className="flex items-center">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton
            key={i}
            shape="circle"
            size={size}
            className={cn(i > 0 && SOBREPOR[size], ANEL[size], ANEL_COR)}
          />
        ))}
      </div>
      {summary ? <Skeleton shape="text" className="w-28 text-sm" /> : null}
    </div>
  )
  return group ? <SkeletonGroup label="Carregando pessoas…">{ossos}</SkeletonGroup> : ossos
}

export {
  AvatarGroup,
  AvatarGroupAdd,
  AvatarGroupItem,
  AvatarGroupSkeleton,
  resumirNomes,
  type AvatarGroupItemProps,
  type AvatarGroupProps,
}
