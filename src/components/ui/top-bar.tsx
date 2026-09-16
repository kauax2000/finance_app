"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { useViewportWindow } from "@/hooks/use-mobile"
import { barSurfaceClassName } from "@/lib/bar-classes"
import { cn } from "@/lib/utils"

/**
 * A barra do topo da janela.
 *
 * `PageHeader` é o topo **de dentro** da tela, e `DialogHeader`/`CardHeader`
 * são o topo de uma superfície. Esta é a barra que fica parada enquanto a tela
 * rola — e ela existia escrita à mão duas vezes: o `AppHeader` do produto e o
 * `DsTopBar` do catálogo, já divergentes em borrão, camada e altura.
 *
 * **A altura é do `<header>`, com o fio e a área segura dentro.** O degrau
 * publica `--top-bar-h`, `fixed` publica `--top-bar-safe`, e a caixa é a soma
 * das duas em `border-box`. Assim o total no telefone é exatamente
 * `--mobile-header-offset` — o `AppHeader` media o fio **por fora**, e o
 * conteúdo começava 1px debaixo dele.
 *
 * **`sticky` mora em `--z-sticky`, e não em `--z-header`.** A faixa de aviso
 * (`offline-banner`) é `fixed md:top-0` em `--z-banner` e cobre a barra do
 * desktop de propósito; a 40 a barra a esconderia. `fixed` é o telefone, onde a
 * faixa desce para baixo da barra, e ali ela vai a `--z-header`.
 *
 * **O fio lê `--sidebar-inset-rule`**, que o `SidebarInset` publica: numa
 * `Sidebar` `floating` a placa não tem `border-r` para ele encostar, e ele
 * sumiria em vez de ficar pendurado. Fora de um `SidebarInset`, 1px.
 *
 * O padrão é `sm`: **48 no telefone e no desktop**, um tamanho só, com a
 * barra lateral aberta ou recolhida — decisão do dono. No telefone a área
 * segura soma por dentro. O que anima é o fundo, quando o vidro acende, na
 * curva da casa.
 */
const topBarVariants = cva(
  [
    "flex w-full min-w-0 shrink-0 items-center gap-2",
    "h-[calc(var(--top-bar-h)+var(--top-bar-safe,0px))] pt-[var(--top-bar-safe,0px)]",
    "border-b border-b-[length:var(--sidebar-inset-rule,1px)] border-border",
    // O borrão do `backdrop-filter` ignora o recorte de todo ancestral no
    // Chromium — `overflow-hidden`, `clip-path`, máscara e `contain: paint`,
    // os quatro medidos — e só respeita o raio do **próprio** elemento. Quem põe
    // a barra no topo de uma caixa arredondada publica `--top-bar-r` (a moldura
    // do catálogo publica); fora disso, 0.
    "rounded-t-[var(--top-bar-r,0px)]",
    "transition-[background-color] duration-(--duration-slow) ease-(--ease-emphasized)",
  ],
  {
    variants: {
      size: {
        sm: "[--top-bar-h:3rem]",
        md: "[--top-bar-h:3.5rem]",
      },
      position: {
        static: "",
        sticky: "sticky top-0 z-(--z-sticky)",
        fixed:
          "fixed inset-x-0 top-0 z-(--z-header) [--top-bar-safe:env(safe-area-inset-top,0px)]",
        auto: "max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-(--z-header) max-md:[--top-bar-safe:env(safe-area-inset-top,0px)] md:sticky md:top-0 md:z-(--z-sticky)",
      },
      surface: {
        solid: "bg-background",
        glass: barSurfaceClassName,
      },
      gutter: {
        bar: "px-4",
        none: "",
      },
    },
    defaultVariants: {
      size: "sm",
      position: "sticky",
      surface: "solid",
      gutter: "bar",
    },
  }
)

type TopBarSurface = "solid" | "glass" | "scroll"

/**
 * Se o que passa por baixo da barra saiu do topo.
 *
 * Quem faz o conteúdo passar por baixo de uma barra `sticky` é o ancestral que
 * rola — a janela, no app; uma região rolável, na moldura do catálogo ou numa
 * coluna de painel. Por isso a escuta é em **captura** na janela, e o alvo é
 * decidido a cada evento: vale a janela, ou um ancestral da barra. Uma lista
 * rolando **dentro** da tela não é ancestral, e não acende nada.
 *
 * Resolver o ancestral uma vez, na montagem, foi a primeira versão, e falhou
 * medida: dentro da moldura o CSS chega depois do efeito, o `overflow` ainda
 * lia `visible`, e a barra passava a escutar a janela errada para sempre.
 */
function useRolou(ref: React.RefObject<HTMLElement | null>, ativo: boolean) {
  const janelaDaMoldura = useViewportWindow()
  const [rolou, setRolou] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!ativo || !el) return
    const janela = janelaDaMoldura ?? window
    const ler = (e?: Event) => {
      const alvo = e?.target as Element | Document | undefined
      if (!alvo || alvo === el.ownerDocument) {
        setRolou(janela.scrollY > 0)
      } else if ("contains" in alvo && alvo.contains(el)) {
        setRolou((alvo as Element).scrollTop > 0)
      }
    }
    ler()
    janela.addEventListener("scroll", ler, { capture: true, passive: true })
    return () =>
      janela.removeEventListener("scroll", ler, { capture: true })
  }, [ref, ativo, janelaDaMoldura])

  return rolou
}

function TopBar({
  className,
  size,
  position,
  surface = "solid",
  gutter,
  ...props
}: React.ComponentProps<"header"> &
  Omit<VariantProps<typeof topBarVariants>, "surface"> & {
    /** `scroll` é `solid` até o conteúdo rolar por baixo, e `glass` depois. */
    surface?: TopBarSurface
  }) {
  const ref = React.useRef<HTMLElement>(null)
  const rolou = useRolou(ref, surface === "scroll")
  // Escolhe entre duas strings inteiras que o `cva` já tem — nunca monta classe.
  const pintura = surface === "scroll" ? (rolou ? "glass" : "solid") : surface

  return (
    <header
      ref={ref}
      data-slot="top-bar"
      data-size={size ?? "sm"}
      data-surface={surface}
      data-scrolled={surface === "scroll" ? rolou : undefined}
      className={cn(
        topBarVariants({ size, position, surface: pintura, gutter }),
        className
      )}
      {...props}
    />
  )
}

/** A ponta de entrada: voltar, gatilho da barra lateral, marca. */
function TopBarStart({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="top-bar-start"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  )
}

/**
 * O nome da tela. Um `<h1>` porque, no telefone, é o único título que a tela
 * mostra; `asChild` para quando a tela já tem o seu.
 *
 * Fica cru, e não sobre `H4`: o átomo traria corpo, peso e entrelinha que os
 * três seriam anulados aqui — é a mesma conta do `CardTitle`.
 */
function TopBarTitle({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"h1"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "h1"
  return (
    <Comp
      data-slot="top-bar-title"
      className={cn(
        "min-w-0 flex-1 truncate font-heading text-sm font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

/** O meio elástico: trilha, busca, título composto. */
function TopBarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="top-bar-content"
      className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
      {...props}
    />
  )
}

/** A ponta de saída. `ms-auto` a encosta à direita mesmo sem meio elástico. */
function TopBarActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="top-bar-actions"
      className={cn("ms-auto flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  )
}

export {
  TopBar,
  TopBarActions,
  TopBarContent,
  TopBarStart,
  TopBarTitle,
  topBarVariants,
}
