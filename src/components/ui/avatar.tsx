"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { IDENTITY_TONES } from "@/lib/avatar"
import { cn } from "@/lib/utils"

/**
 * Duas versões, e só duas: **com foto** (a foto) e **sem foto** (as iniciais
 * em tinta escura sobre um degradê pastel de marca, com grão). O avatar já teve um modo de vidro e um
 * anel de arco-íris para a pessoa logada; os dois saíram a pedido, porque com
 * o degradê já sendo a marca eram três maneiras de dizer a mesma coisa.
 */

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

function Avatar({
  className,
  size,
  shape,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size ?? "md"}
      data-shape={shape ?? "circle"}
      className={cn(avatarVariants({ size, shape }), className)}
      {...props}
    />
  )
}

/**
 * A foto entra em fade quando termina de carregar.
 *
 * É uma animação de **entrada**, não uma transição de estado: o Radix não
 * monta a imagem antes de ela carregar, então um `data-[state=loaded]:opacity-100`
 * com `opacity-0` na base deixava toda foto invisível — o elemento nascia já
 * carregado e nunca passava pelo estado que a transição esperava.
 */
const AvatarImage = React.forwardRef<
  HTMLImageElement,
  // `alt` obrigatório: `""` é a escolha certa ao lado do nome, mas tem de ser
  // escrita — um padrão silencioso deixava foto sem nome nenhum.
  Omit<React.ComponentProps<typeof AvatarPrimitive.Image>, "alt"> & { alt: string }
>(({ className, alt, ...props }, ref) => (
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
      "animate-in fade-in animation-duration-(--duration-base) ease-(--ease-out)",
      className
    )}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

/**
 * As iniciais, e o que se vê enquanto a foto não chega.
 *
 * **Sempre sobre um degradê pastel de marca, com grão e a tinta escura.** O padrão é a
 * primeira identidade; quem sabe qual pessoa é passa o par de
 * `identityToneFor` por `className` (`cn(tone.surface, tone.ink)`), e o
 * `bg-(image:…)` dele vence o padrão no merge.
 *
 * **O degradê se move no cursor e no toque.** Ele é pintado a 160% da caixa e
 * ancorado no canto de cima; no `hover:` e no `active:` (o par que a regra H
 * cobra) a âncora vai para o canto oposto, e a transição de
 * `background-position` faz o degradê deslizar por baixo das letras. Movimento
 * reduzido: o bloco global encurta a transição, e o degradê só troca de lugar.
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
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(
      "flex h-full w-full items-center justify-center font-medium",
      IDENTITY_TONES[0].surface,
      IDENTITY_TONES[0].ink,
      // O grão vem por um `::before` e não por uma segunda camada de
      // `background-image`: a camada vive no token de identidade, e quem
      // chama troca o token inteiro por `className` — uma lista de camadas
      // aqui seria sobrescrita junto. O pseudo fica atrás das letras (o
      // `relative isolate` do fallback é o que o segura dentro).
      "relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-(image:--identity-grain) before:bg-size-(--identity-grain-size) before:mix-blend-overlay",
      "bg-size-(--identity-drift-size) bg-position-[0%_0%] transition-[background-position] duration-(--duration-slow) ease-(--ease-out) hover:bg-position-[100%_100%] active:bg-position-[100%_100%]",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage, avatarVariants }
