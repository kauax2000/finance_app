"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Duas versões, e só duas: **com foto** (a foto) e **sem foto** (as iniciais
 * em tinta escura sobre a cor chapada de identidade). O avatar já teve um modo
 * de vidro, um anel de arco-íris para a pessoa logada e, por três rodadas, um
 * degradê com grão e ponto de luz no lugar da cor; todos saíram a pedido. A
 * peça vai ficando mais simples a cada rodada, e é de propósito.
 *
 * **Uma forma só, o círculo.** O `shape="rounded"` existiu para o quadrado de
 * canto arredondado que o produto desenhava, e saiu a pedido: retrato é
 * redondo, e o canto arredondado é a família do `ColorTile` e da marca de
 * workspace, que são outra coisa.
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
  "relative flex shrink-0 overflow-hidden rounded-full select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-2xs",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-14 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function Avatar({
  className,
  size,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size ?? "md"}
      className={cn(avatarVariants({ size }), className)}
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
 * **Uma cor chapada de identidade, em duas versões** (rodada 184): `tint`
 * `vivid` (o padrão, a cor cheia com a tinta escura) ou `soft` (quase branca,
 * com a letra no tom forte da família). O padrão é a primeira identidade;
 * quem sabe qual pessoa é passa o par de `identityToneFor` por `className`
 * (`cn(tone.surface, tone.ink)`), que declara a família e vence o padrão.
 *
 * **Isto já foi um degradê, e o que sobrou é este parágrafo.** Por três
 * rodadas a superfície foi uma mancha radial num `::before`, com grão, com um
 * ponto de luz e, por um tempo, com movimento no cursor; depois ganhou um
 * `variant` para conviver com a versão chapada, e no fim o degradê foi apagado
 * a pedido do dono. Saíram o pseudo-elemento, o `variant`, os tokens
 * `--identity-grain*` e `--identity-spec*`, e a indireção por
 * `--identity-surface` — que existia só porque um degradê não cabe no
 * `@theme inline`. As cores de hoje são a parada do meio daquela mancha.
 *
 * Três medições daquele tempo valem para quem for repor movimento aqui, e
 * estão inteiras no histórico da rodada 87: uma camada em `background-size:
 * cover` **não se desloca por porcentagem** (só por `px`), o que permite mover
 * uma camada de cima sem mexer no fundo; `transition-[background-position]` é
 * obrigatório, porque este projeto sobrescreve a lista padrão do Tailwind;
 * e **girar pelo ângulo do gradiente não funciona** a partir do `:root`,
 * porque um `var()` dentro de uma propriedade personalizada é substituído
 * onde ela é **declarada** e não no elemento que a veste. `--brand-rainbow`
 * e `--brand-angle` tinham o mesmo defeito, e a saída está na rodada 88:
 * declarar o gradiente no próprio elemento (`@utility brand-rainbow-image`),
 * não no `:root`. Quem repuser movimento aqui faz o mesmo.
 *
 * Sem raio próprio: quem recorta é o `overflow-hidden` da raiz. E o
 * `select-none` da raiz é o que tira o I-beam de cima das iniciais: sobre
 * texto que não se seleciona, `cursor: auto` não resolve para `text` — e
 * continua herdando o ponteiro quando o avatar mora dentro de um botão.
 *
 * O Radix aceita `delayMs`: com ele o fallback só aparece depois do prazo, e
 * uma foto que chega rápido deixa de piscar iniciais antes de si mesma.
 */
const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
    /**
     * `vivid` (o padrão) é a cor de identidade cheia com a tinta escura;
     * `soft` é quase branca, com a letra no tom forte da mesma família.
     */
    tint?: "vivid" | "soft"
  }
>(({ className, tint = "vivid", ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    data-tint={tint}
    className={cn(
      "flex h-full w-full items-center justify-center font-medium",
      // A primeira identidade é o padrão pelo fallback do `var()`, e não por
      // uma classe `identity-1`: duas `identity-N` no mesmo elemento seriam
      // decididas pela ordem de emissão, e a da pessoa perderia para a 1.
      "bg-[var(--identity-surface,var(--identity-1))] text-identity-foreground",
      "data-[tint=soft]:bg-[var(--identity-surface-soft,var(--identity-1-soft))] data-[tint=soft]:text-[var(--identity-ink,var(--identity-1-ink))]",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage, avatarVariants }
