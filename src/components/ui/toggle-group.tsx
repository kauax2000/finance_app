"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import {
  ToggleContent,
  toggleStyle,
  toggleVariants,
  type ToggleExtras,
} from "@/components/ui/toggle"

type ToggleVariant = VariantProps<typeof toggleVariants>["variant"]
/** As peles do item, mais a do grupo: `segmented` só existe em grupo. */
type ToggleGroupVariant = ToggleVariant | "segmented"

const ToggleGroupContext = React.createContext<
  Omit<VariantProps<typeof toggleVariants>, "variant"> & {
    variant?: ToggleGroupVariant
    /** O marcador do segmentado já mediu a escolhida. */
    indicatorReady?: boolean
  }
>({
  size: "md",
  variant: "plain",
  shape: "rounded",
  tint: "vivid",
})

/**
 * O item dentro da bandeja (rodada 199): sem chão próprio — quem pinta a
 * escolhida é o marcador —, tinta apagada que acende no cursor, e a escolhida
 * com a tinta cheia. `relative` para pintar por cima do marcador, que vem
 * antes no DOM.
 */
const SEGMENTO = [
  "relative border-transparent bg-transparent text-muted-foreground",
  "hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground",
  "data-[state=on]:bg-transparent data-[state=on]:text-foreground",
  "data-[state=on]:hover:bg-transparent data-[state=on]:active:bg-transparent",
].join(" ")

/**
 * Antes da primeira medida — e sem JavaScript —, a escolhida se pinta sozinha
 * com a superfície do marcador, a decisão do `Tabs`: um marcador sem posição
 * deixaria a escolha sem marca na primeira pintura.
 */
const SEGMENTO_SEM_MARCADOR =
  "data-[state=on]:border-border/80 data-[state=on]:bg-background data-[state=on]:shadow-xs data-[state=on]:hover:bg-background data-[state=on]:active:bg-background"

/**
 * **Em `type="single"`, clicar no item ativo não desmarca tudo.**
 *
 * Medido no Radix: ele trata o grupo de um valor como um toggle, então o
 * segundo clique no item selecionado devolve `""` e o grupo fica com **zero**
 * selecionados. Num filtro que já tem "Todas" como neutro isso é um quarto
 * estado que ninguém pediu — e era o que impedia os três filtros do app de
 * saírem de `role="tab"`, porque cada tela precisaria do próprio guarda
 * (`onValueChange={(v) => v && setX(v)}`), em seis grafias.
 *
 * O guarda mora aqui: a mudança para vazio é engolida, e o grupo `single` passa
 * a ser controlado por dentro quando quem chama não controla — senão o Radix
 * desmarca antes de avisar. `type="multiple"` não passa por isto — lá esvaziar é uma
 * resposta legítima.
 *
 * ## As versões da rodada 199
 *
 * - **`variant="segmented"`** — a bandeja: o trilho `bg-muted` com a escolhida
 *   levantada, e o realce é **um marcador só que desliza** até ela, a
 *   mecânica do `Tabs` (`ResizeObserver` mais `MutationObserver` em
 *   `data-state`, a caixa publicada em `--toggle-indicator-*`). A bandeja
 *   mede o item mais 4px. O seletor de período da tabela de transações a
 *   escrevia à mão, com `aria-pressed` e uma sombra em `rgb()` cru. É escolha
 *   de **valor**: quando a opção troca o conteúdo da tela, é `Tabs`.
 * - **`variant="chip"`** e **`count`** — ver o `Toggle`.
 * - **`stretch`** — os itens dividem a largura em partes iguais.
 */
function ToggleGroup({
  className,
  variant,
  shape,
  tint,
  size,
  stretch = false,
  children,
  onValueChange,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  Omit<VariantProps<typeof toggleVariants>, "variant"> & {
    variant?: ToggleGroupVariant
    /** Os itens dividem a largura em partes iguais. */
    stretch?: boolean
  }) {
  const unico = props.type === "single"
  // Num grupo não controlado quem guarda o valor é o Radix, e ali o guarda de
  // callback não alcança: ele já desmarcou por dentro antes de avisar. Por isso
  // o `single` passa a ser sempre controlado — com `defaultValue` como semente
  // quando quem chama não controla.
  const [interno, setInterno] = React.useState<string>(
    typeof props.defaultValue === "string" ? props.defaultValue : ""
  )
  const controlado = props.value !== undefined
  const valor = unico ? (controlado ? props.value : interno) : props.value

  const aoTrocar = React.useCallback(
    (proximo: string | string[]) => {
      if (unico && proximo === "") return
      if (unico && !controlado && typeof proximo === "string") setInterno(proximo)
      ;(onValueChange as ((v: string | string[]) => void) | undefined)?.(proximo)
    },
    [controlado, onValueChange, unico]
  )

  // A união discriminada do Radix (`single` | `multiple`) não sobrevive a um
  // valor calculado no espalhamento: o objeto é montado aqui e convertido uma
  // vez só, que é o mesmo idioma da ponte de tipos em `form.tsx`.
  const raiz = {
    ...props,
    ...(unico ? { value: valor as string, defaultValue: undefined } : {}),
    onValueChange: aoTrocar,
  } as React.ComponentProps<typeof ToggleGroupPrimitive.Root>

  // O marcador da bandeja. Só no `single`: no `multiple` várias ficam
  // ligadas, e cada uma se pinta sozinha (`SEGMENTO_SEM_MARCADOR`).
  const segmentado = variant === "segmented"
  const viaja = segmentado && unico
  const trilhaRef = React.useRef<HTMLDivElement>(null)
  const [medido, setMedido] = React.useState(false)
  const indicatorReady = viaja && medido

  useIsomorphicLayoutEffect(() => {
    const trilha = trilhaRef.current
    if (!trilha || !viaja) return
    const medir = () => {
      const ativa = trilha.querySelector<HTMLElement>(
        '[data-slot="toggle-group-item"][data-state="on"]'
      )
      if (!ativa) {
        // Nenhuma escolhida (o período personalizado, por exemplo): sem marca.
        setMedido(false)
        return
      }
      // Relativos à trilha, e não à janela, como no `Tabs`.
      trilha.style.setProperty("--toggle-indicator-x", `${ativa.offsetLeft}px`)
      trilha.style.setProperty("--toggle-indicator-y", `${ativa.offsetTop}px`)
      trilha.style.setProperty("--toggle-indicator-w", `${ativa.offsetWidth}px`)
      trilha.style.setProperty("--toggle-indicator-h", `${ativa.offsetHeight}px`)
      setMedido(true)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(trilha)
    for (const item of trilha.querySelectorAll('[data-slot="toggle-group-item"]')) ro.observe(item)
    const mo = new MutationObserver(medir)
    mo.observe(trilha, { attributes: true, attributeFilter: ["data-state"], subtree: true, childList: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [viaja, size, stretch])

  const pilula = shape === "pill"

  return (
    <ToggleGroupPrimitive.Root
      ref={trilhaRef}
      data-slot="toggle-group"
      data-variant={variant ?? "plain"}
      data-stretch={stretch || undefined}
      className={cn(
        "flex items-center justify-center gap-1",
        // A bandeja: o trilho e 2px de recuo — a bandeja é o item mais 4.
        segmentado && [
          "relative inline-flex w-fit items-stretch gap-0.5 bg-muted p-0.5",
          pilula ? "rounded-full" : "rounded-lg",
        ],
        stretch && "flex w-full [&>[data-slot=toggle-group-item]]:flex-1",
        className
      )}
      {...raiz}
    >
      {indicatorReady ? (
        <span
          aria-hidden
          data-slot="toggle-group-indicator"
          className={cn(
            // Vem antes dos itens no DOM e não declara camada: os itens são
            // `relative` e pintam por cima por ordem de documento.
            "pointer-events-none absolute top-0 left-0",
            "translate-x-(--toggle-indicator-x) translate-y-(--toggle-indicator-y)",
            "w-(--toggle-indicator-w) h-(--toggle-indicator-h)",
            // A superfície do marcador do `Tabs solid`, no mesmo tempo.
            "border border-border/80 bg-background shadow-xs",
            "transition-[translate,width,height] duration-(--duration-base) ease-(--ease-out)",
            pilula ? "rounded-full" : "rounded-md"
          )}
        />
      ) : null}
      <ToggleGroupContext.Provider value={{ variant, shape, tint, size, indicatorReady }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  shape,
  tint,
  size,
  icon,
  iconOn,
  color,
  count,
  style,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants> &
  ToggleExtras) {
  const context = React.useContext(ToggleGroupContext)
  const segmentado = !variant && context.variant === "segmented"
  const pele: ToggleVariant = variant ?? (segmentado ? "plain" : (context.variant as ToggleVariant))
  const forma = shape ?? context.shape

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={segmentado ? "segmented" : (pele ?? "plain")}
      className={cn(
        toggleVariants({
          variant: pele,
          shape: forma,
          tint: tint ?? context.tint,
          size: size ?? context.size,
        }),
        segmentado && [SEGMENTO, forma !== "pill" && "rounded-md"],
        segmentado && !context.indicatorReady && SEGMENTO_SEM_MARCADOR,
        className
      )}
      style={toggleStyle(color, style)}
      {...props}
    >
      <ToggleContent variant={pele} icon={icon} iconOn={iconOn} count={count}>
        {children}
      </ToggleContent>
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
