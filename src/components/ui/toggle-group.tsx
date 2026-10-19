"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { useMarcador } from "@/hooks/use-marcador"
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
 * O item dentro da bandeja: sem chão próprio (quem pinta a escolhida é o
 * marcador), tinta apagada que acende no cursor, e a escolhida com a tinta
 * cheia. `relative` para pintar por cima do marcador, que vem antes no DOM.
 */
const SEGMENTO = [
  "relative border-transparent bg-transparent text-muted-foreground",
  "hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground",
  "data-[state=on]:bg-transparent data-[state=on]:text-foreground",
  "data-[state=on]:hover:bg-transparent data-[state=on]:active:bg-transparent",
].join(" ")

/**
 * Antes da primeira medida (e sem JavaScript) a escolhida se pinta sozinha com a
 * superfície do marcador, a decisão do `Tabs`: um marcador sem posição deixaria
 * a escolha sem marca na primeira pintura.
 */
const SEGMENTO_SEM_MARCADOR =
  "data-[state=on]:border-border/80 data-[state=on]:bg-background data-[state=on]:shadow-xs data-[state=on]:hover:bg-background data-[state=on]:active:bg-background"

/** O mesmo, na pele do `floating`: a tecla em relevo do `Tabs`. */
const PILULA_SEM_MARCADOR =
  "data-[state=on]:bg-muted data-[state=on]:ring-1 data-[state=on]:ring-foreground/10 data-[state=on]:shadow-xs data-[state=on]:hover:bg-muted data-[state=on]:active:bg-muted"

/**
 * Em `type="single"`, clicar no item ativo não desmarca tudo. O Radix trata o
 * grupo de um valor como um toggle: o segundo clique devolve `""` e o grupo fica
 * com zero selecionados, um quarto estado que ninguém pediu num filtro que já
 * tem "Todas" como neutro. O guarda mora aqui (a mudança para vazio é engolida) e
 * o grupo `single` passa a ser controlado por dentro quando quem chama não
 * controla, senão o Radix desmarca antes de avisar. `type="multiple"` não passa
 * por isto: lá esvaziar é uma resposta legítima.
 * - `variant="segmented"`: a bandeja `bg-muted` com a escolhida levantada, e o
 *   realce é um marcador só que desliza até ela (a mecânica do `Tabs`,
 *   `useMarcador`: caixa publicada em `--toggle-indicator-*`, viagem líquida). A
 *   bandeja mede o item mais 4px. É escolha de valor: quando a opção troca o
 *   conteúdo da tela, é `Tabs`.
 * - `variant="floating"`: a mesma escolha na pele do `Tabs` padrão (pílula
 *   `--popover` com anel de 1px; marcador em tecla em relevo, `--muted`, anel e
 *   `shadow-xs`, 2px para dentro do item). O painel Exibir do `DataTable` a usa.
 *   É o visual das abas sem o papel: uma `tablist` sem painel anunciaria abas
 *   que não existem.
 * - `variant="chip"` e `count`: ver o `Toggle`.
 * - `stretch`: os itens dividem a largura em partes iguais.
 */
function ToggleGroup({
  className,
  variant,
  tint,
  size = "md",
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
  // Num grupo não controlado quem guarda o valor é o Radix, e o guarda de callback
  // não alcança (ele já desmarcou por dentro antes de avisar): o `single` é sempre
  // controlado, com `defaultValue` como semente.
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

  // A união discriminada do Radix (`single` | `multiple`) não sobrevive a um valor
  // calculado no espalhamento: o objeto é montado aqui e convertido uma vez só (o
  // idioma da ponte de tipos em `form.tsx`).
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
  // A mecânica do `Tabs` (`useMarcador`) nas duas peles: a viagem líquida, em WAAPI,
  // só quando a escolhida muda (redimensionar só reposiciona). No `floating` o
  // marcador recua 2px para dentro do item (o `RECUO_DO_MARCADOR` de lá); no
  // `segmented` é o item inteiro.
  const indicatorReady = useMarcador({
    trilha: trilhaRef,
    marcador: marcadorRef,
    ativo: (t) => t.querySelector<HTMLElement>('[data-slot="toggle-group-item"][data-state="on"]'),
    atributos: ["data-state"],
    prefixo: "toggle-indicator",
    insete: flutuante ? 2 : 0,
    viajar: viaja,
    deps: [size, stretch],
  })

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
            // Sem transição de CSS nas duas peles: quem anda é a viagem líquida.
            flutuante
              ? // A tecla em relevo do `Tabs floating`.
                "rounded-full bg-muted ring-1 ring-foreground/10 shadow-xs"
              : // A superfície do marcador do `Tabs solid`.
                "rounded-full border border-border/80 bg-background shadow-xs"
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
          // No dedo o item alcança os 44 do alvo do iOS (rodada 332): o `::after` de
          // 44, centrado, cobre o recuo da bandeja sem mexer no desenho (o mesmo das
          // abas do `Tabs`; altura fixa, porque ele mede por dentro da borda).
          "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
          // A bandeja é o item mais 4: com o item em 40 no dedo ela chega aos 44 das
          // abas do `Tabs` (era 36, e a bandeja ficava em 40).
          "pointer-coarse:h-10",
          flutuante
            ? // O gatilho do `Tabs floating`, classe a classe: a pílula, o ar
              // nas pontas, o corpo dos controles e o esmaecer no tempo de lá.
              "gap-1.5 rounded-full px-3 text-control-sm duration-(--duration-base)"
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
