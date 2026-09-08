"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { IDENTITY_TONES } from "@/lib/avatar"
import {
  GLASS_IDENTITY_TONES,
  glassControlSurfaceClassName,
  glassRoundSurfaceClassName,
} from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * A escala do avatar é dele, e diverge da escada de controle de propósito.
 *
 * A escada do projeto — 24, 28, 32, 36, 40 — existe para que botão ao lado de
 * campo alinhe sem ninguém dizer `size`. Um avatar nunca disputa essa linha:
 * ele identifica uma pessoa numa lista, num menu, num cabeçalho de perfil, e
 * ali 40px é teto, não meio. Esta escala anda de 8 em 8 — 24, 32, 40, 48, 56 —
 * e o degrau que os dois vocabulários compartilham, `xs` a 24, vale o mesmo nos
 * dois: é o caso em que um avatar de fato mora dentro de uma linha de controle.
 *
 * `default` virou `md` porque o nome era redundante — `size="default"` diz "o
 * padrão" para quem já teria o padrão sem dizer nada — e porque o projeto o
 * removeu de todo o resto.
 */
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        xs: "size-6 text-2xs",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-14 text-lg",
      },
      /**
       * O produto sempre desenhou avatar de canto arredondado — a lateral do
       * usuário e a lista de membros, as duas —, enquanto o catálogo mostrava
       * círculo. Duas formas para a mesma peça, e nenhuma das duas errada:
       * círculo é a convenção de retrato, e o quadrado arredondado é a mesma
       * família da marca de workspace que aparece ao lado dele.
       *
       * O prop existe para a divergência ficar dita em vez de bifurcada. O
       * padrão continua `circle`, que é o que os consumidores atuais do
       * componente esperam.
       *
       * O raio do `rounded` mora nos compostos abaixo, e não aqui: ele **cresce
       * com a caixa**. Cravado em `rounded-lg`, um avatar de 24px ficava quase
       * redondo e um de 56px ficava quase reto — e a 32px ele desenhava 10px
       * contra os 8px que o `ColorTile` desenha no mesmo tamanho, duas peças de
       * identidade lado a lado com cantos diferentes.
       */
      shape: {
        circle: "rounded-full",
        rounded: "",
      },
    },
    // O raio acompanha o tamanho, na mesma progressão do `ColorTile`: `md` (8px)
    // nas caixas pequenas, `lg` (10px) nas médias, `xl` (14px) na maior.
    compoundVariants: [
      { shape: "rounded", size: "xs", class: "rounded-md" },
      { shape: "rounded", size: "sm", class: "rounded-md" },
      { shape: "rounded", size: "md", class: "rounded-lg" },
      { shape: "rounded", size: "lg", class: "rounded-lg" },
      { shape: "rounded", size: "xl", class: "rounded-xl" },
    ],
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
)

/**
 * O modo de vidro desce pelo **contexto**, e não por seletor.
 *
 * A superfície opaca que o vidro precisa desligar (`bg-muted`) mora no
 * `AvatarFallback`, não na raiz. Um `in-data-glass:bg-transparent` no fallback
 * compilaria com `:where()`, que **não soma especificidade**, e perderia para o
 * `bg-muted` declarado no próprio elemento — a armadilha que este projeto já
 * pagou no `DescriptionList`. Contexto não disputa: o fallback simplesmente
 * não escreve a classe.
 *
 * É o mecanismo do `Field` / `FieldControl`, e ele sai de graça porque o
 * `Avatar` já é módulo cliente.
 */
const AvatarGlassContext = React.createContext<{ ink: string } | null>(null)

function Avatar({
  className,
  size,
  shape,
  glass,
  identity = 0,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants> & {
    /** A superfície: preenchimento opaco, ou a lâmina de vidro do sistema. */
    glass?: boolean
    /**
     * Qual das seis identidades, no modo de vidro — o **índice** de
     * `IDENTITY_TONES`, e não a semente de `identityToneFor`.
     *
     * O nome anterior era `seed`, e o JSDoc dizia ser "o mesmo argumento de
     * `identityToneFor`". Não era: aquela função recebe duas **strings** e faz
     * hash; aqui é um número com módulo. As duas não davam a mesma cor para a
     * mesma pessoa. Quem tem a cor gravada resolve o tom antes e passa o índice.
     */
    identity?: number
  }) {
  // Módulo duplo para aceitar índice negativo.
  const i =
    (((identity % IDENTITY_TONES.length) + IDENTITY_TONES.length) %
      IDENTITY_TONES.length) |
    0

  const raiz = (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size ?? "md"}
      data-shape={shape ?? "circle"}
      data-glass={glass || undefined}
      data-identity={glass ? i : undefined}
      className={cn(
        avatarVariants({ size, shape }),
        // A raiz não pinta fundo nenhum, então aqui não há o que anular: a
        // lâmina e o tom apenas se somam.
        // O aro do vidro é um gradiente linear, e num círculo as pontas dele
        // caem nos cantos da caixa — que ali não existem. Medido, **0% do
        // perímetro** via o pico. `glass-round` troca o aro por um cônico e
        // acende o especular; num `shape="rounded"` os cantos existem e o
        // linear continua certo.
        glass && [
          (shape ?? "circle") === "circle"
            ? glassRoundSurfaceClassName
            : glassControlSurfaceClassName,
          GLASS_IDENTITY_TONES[i],
        ],
        className
      )}
      {...props}
    />
  )

  if (!glass) return raiz

  return (
    <AvatarGlassContext.Provider value={{ ink: IDENTITY_TONES[i].ink }}>
      {raiz}
    </AvatarGlassContext.Provider>
  )
}

/**
 * A foto entra em fade quando termina de carregar.
 *
 * Sem isso ela aparece de estalo por cima das iniciais, e o troco é visível
 * justamente onde o avatar mais aparece: uma lista de membros ou de transações,
 * onde uma dúzia deles resolve em momentos diferentes e a tela pisca em
 * pedaços.
 *
 * É **animação de entrada**, e não transição. O `Avatar.Image` do Radix não
 * publica `data-state` nem renderiza cedo: ele simplesmente não monta enquanto
 * a imagem não carregou. Transição precisa de dois estados no mesmo elemento e
 * aqui só existe um — a primeira versão disto usava
 * `data-[state=loaded]:opacity-100` e deixava toda foto de perfil invisível,
 * porque o seletor nunca casava.
 */
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ComponentProps<typeof AvatarPrimitive.Image>
>(({ className, alt = "", ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    data-slot="avatar-image"
    alt={alt}
    // `decoding="async"` é sempre seguro e tira a decodificação do caminho de
    // pintura. `loading` fica com quem chama: numa lista longa vale `lazy`, na
    // lateral que aparece no primeiro quadro ele só atrasaria a foto.
    decoding="async"
    className={cn(
      "aspect-square h-full w-full object-cover",
      "animate-in fade-in duration-(--duration-base) ease-(--ease-out)",
      className
    )}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

/**
 * As iniciais, e o que se vê enquanto a foto não chega.
 *
 * Sem raio próprio: quem recorta é o `overflow-hidden` da raiz, e é o que faz o
 * fundo acompanhar o `shape`. Com `rounded-full` cravado aqui — como estava —,
 * um avatar de canto arredondado desenhava um círculo dentro de um quadrado.
 *
 * O Radix aceita `delayMs`: com ele o fallback só aparece depois do prazo, e
 * uma foto que chega rápido deixa de piscar iniciais antes de si mesma.
 */
const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => {
  const vidro = React.useContext(AvatarGlassContext)
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn(
        "flex h-full w-full items-center justify-center font-medium",
        // Sob vidro a superfície é a lâmina da raiz, e a tinta é a da
        // identidade. As duas classes opacas não são escritas — não há
        // `bg-transparent` a empilhar por cima.
        vidro ? vidro.ink : "bg-muted text-foreground",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage, avatarVariants }
