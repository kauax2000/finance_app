"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { TRAJETO_MACIO, viajarLiquido, type CaixaLiquida } from "@/lib/liquid-move"
import {
  ToggleContent,
  toggleStyle,
  toggleVariants,
  type ToggleExtras,
} from "@/components/ui/toggle"

type ToggleVariant = VariantProps<typeof toggleVariants>["variant"]
/** As peles do item, mais as do grupo: `segmented` e `floating` só existem em grupo. */
type ToggleGroupVariant = ToggleVariant | "segmented" | "floating"

const ToggleGroupContext = React.createContext<
  Omit<VariantProps<typeof toggleVariants>, "variant"> & {
    variant?: ToggleGroupVariant
    /** O marcador do segmentado já mediu a escolhida. */
    indicatorReady?: boolean
  }
>({
  size: "md",
  variant: "plain",
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

/** O mesmo, na pele do `floating`: a tecla em relevo do `Tabs`. */
const PILULA_SEM_MARCADOR =
  "data-[state=on]:bg-muted data-[state=on]:ring-1 data-[state=on]:ring-foreground/10 data-[state=on]:shadow-xs data-[state=on]:hover:bg-muted data-[state=on]:active:bg-muted"

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
 * - **`variant="floating"`** (rodada 231) — a mesma escolha na pele do `Tabs`
 *   padrão: a pílula `--popover` com o anel de 1px, e o marcador é a tecla em
 *   relevo (`--muted`, anel, `shadow-xs`) 2px para dentro do item. O painel
 *   Exibir do `DataTable` a usa. É o visual das abas sem o papel delas: uma
 *   `tablist` sem painel anunciaria abas que não existem.
 * - **`variant="chip"`** e **`count`** — ver o `Toggle`.
 * - **`stretch`** — os itens dividem a largura em partes iguais.
 */
function ToggleGroup({
  className,
  variant,
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
  const flutuante = variant === "floating"
  const segmentado = variant === "segmented" || flutuante
  const viaja = segmentado && unico
  const trilhaRef = React.useRef<HTMLDivElement>(null)
  const marcadorRef = React.useRef<HTMLSpanElement>(null)
  const anterior = React.useRef<{ el: HTMLElement; caixa: CaixaLiquida } | null>(null)
  const emCurso = React.useRef<Animation[]>([])
  const [medido, setMedido] = React.useState(false)
  const indicatorReady = viaja && medido

  React.useLayoutEffect(() => {
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
      // Relativos à trilha, e não à janela, como no `Tabs`. No `floating` o
      // marcador recua 2px para dentro do item, o `RECUO_DO_MARCADOR` dele.
      const recuo = flutuante ? 2 : 0
      const caixa: CaixaLiquida = {
        x: ativa.offsetLeft + recuo,
        y: ativa.offsetTop + recuo,
        w: ativa.offsetWidth - recuo * 2,
        h: ativa.offsetHeight - recuo * 2,
      }
      trilha.style.setProperty("--toggle-indicator-x", `${caixa.x}px`)
      trilha.style.setProperty("--toggle-indicator-y", `${caixa.y}px`)
      trilha.style.setProperty("--toggle-indicator-w", `${caixa.w}px`)
      trilha.style.setProperty("--toggle-indicator-h", `${caixa.h}px`)
      // No `floating` a viagem é a do `Tabs`: líquida, em WAAPI, e só quando
      // a escolhida muda — redimensionar só reposiciona. 0,09 por item andado,
      // teto de 0,18, a conta do `useMarcador` de lá.
      const antes = anterior.current
      anterior.current = { el: ativa, caixa }
      const peca = marcadorRef.current
      if (flutuante && antes && antes.el !== ativa && peca) {
        for (const a of emCurso.current) a.cancel()
        const andado = Math.abs(caixa.x - antes.caixa.x)
        const amplitude = Math.min(0.18, caixa.w > 0 ? (andado / caixa.w) * 0.09 : 0.09)
        emCurso.current = viajarLiquido(peca, antes.caixa, caixa, { amplitude, trajeto: TRAJETO_MACIO })
      }
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
  }, [viaja, flutuante, size, stretch])

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
          "relative inline-flex w-fit items-stretch gap-0.5",
          flutuante ? "bg-popover ring-1 ring-foreground/10" : "bg-muted",
          "rounded-full p-0.5",
        ],
        stretch && "flex w-full [&>[data-slot=toggle-group-item]]:flex-1",
        className
      )}
      {...raiz}
    >
      {indicatorReady ? (
        <span
          ref={marcadorRef}
          aria-hidden
          data-slot="toggle-group-indicator"
          className={cn(
            // Vem antes dos itens no DOM e não declara camada: os itens são
            // `relative` e pintam por cima por ordem de documento.
            "pointer-events-none absolute top-0 left-0",
            "translate-x-(--toggle-indicator-x) translate-y-(--toggle-indicator-y)",
            "w-(--toggle-indicator-w) h-(--toggle-indicator-h)",
            flutuante
              ? // A tecla em relevo do `Tabs floating`, e sem transição de CSS:
                // quem anda é a viagem líquida.
                "rounded-full bg-muted ring-1 ring-foreground/10 shadow-xs"
              : [
                  // A superfície do marcador do `Tabs solid`, no mesmo tempo.
                  "rounded-full border border-border/80 bg-background shadow-xs",
                  "transition-[translate,width,height] duration-(--duration-base) ease-(--ease-out)",
                ]
          )}
        />
      ) : null}
      <ToggleGroupContext.Provider value={{ variant, tint, size, indicatorReady }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
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
  const flutuante = !variant && context.variant === "floating"
  const segmentado = (!variant && context.variant === "segmented") || flutuante
  const pele: ToggleVariant = variant ?? (segmentado ? "plain" : (context.variant as ToggleVariant))

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={flutuante ? "floating" : segmentado ? "segmented" : (pele ?? "plain")}
      className={cn(
        toggleVariants({
          variant: pele,
          tint: tint ?? context.tint,
          size: size ?? context.size,
        }),
        segmentado && [
          SEGMENTO,
          flutuante
            ? // O gatilho do `Tabs floating`, classe a classe: a pílula, o ar
              // nas pontas, o corpo dos controles e o esmaecer no tempo de lá.
              "gap-1.5 rounded-full px-3 text-control-sm pointer-coarse:h-9 duration-(--duration-base)"
            : null,
        ],
        segmentado && !context.indicatorReady && (flutuante ? PILULA_SEM_MARCADOR : SEGMENTO_SEM_MARCADOR),
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
