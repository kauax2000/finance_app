import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { tileColorFor } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

/**
 * O ladrilho que carrega uma cor escolhida pela pessoa — ícone de categoria,
 * marca de conta, capa de conta a pagar.
 *
 * **É a construção do `AvatarFallback`, e agora literalmente:** superfície
 * chapada com a cor, tinta escura por cima, um valor só nos dois temas. O que
 * separa os dois é a forma e quem escolhe — o avatar é redondo e o sistema
 * sorteia uma das seis identidades; o ladrilho é de canto arredondado e quem
 * escolhe é a pessoa.
 *
 * **A claridade é do sistema; o matiz é da pessoa.** A superfície é
 * `oklch(from var(--tile-color) 0.86 min(c, 0.12) h)`: pega o matiz do que ela
 * escolheu, prende a claridade na faixa da rampa de identidade e **limita** o
 * croma. Medido, o piso não é opinião — com a tinta em
 * `--identity-foreground`, qualquer cor de runtime cai entre **10,63 e 11,74**,
 * a mesma faixa que as seis identidades do avatar entregam hoje (10,17 a
 * 12,12). Preto, branco e cinza chegam neutros e a 11,2. Não há o que medir por
 * cor: o contraste é estrutural.
 *
 * **O limite de croma não é cosmético.** Sem ele, magenta cai a 7,70 e o croma
 * das peças varia de 0,12 a 0,28 — oito ladrilhos numa lista deixam de ler como
 * uma família. Com ele, todos ficam na banda da identidade.
 *
 * **E por que a cor não entra crua.** Chapar a parada da marca como ela é
 * reprova: com a tinta escura, índigo dá 3,55, violeta 3,21 e magenta 4,09;
 * com tinta branca, âmbar 1,94, lima 1,83, teal 2,23 e azul 2,42. **Nenhuma
 * tinta única serve as oito** — que é exatamente o desenho que este componente
 * já teve e abandonou, quando 4 dos 10 presets reprovavam nos 3:1 da WCAG
 * 1.4.11. É a mesma lição da rodada 83 no avatar: da parada do arco-íris vem o
 * matiz, e só ele.
 *
 * **Uma versão só.** Ele já foi lustrado (degradê branco, borda clara, sombra,
 * `backdrop-blur`), já teve um eixo `glass`, e por muitas rodadas foi um véu de
 * 12%/18% sobre o cartão com a tinta e o fio normalizados e um par de valores
 * por tema. Tudo isso saiu: sobrou uma superfície e uma tinta.
 */
const colorTileVariants = cva(
  [
    "flex shrink-0 items-center justify-center overflow-hidden",
    "bg-[oklch(from_var(--tile-color)_0.86_min(c,_0.12)_h)]",
    "text-identity-foreground",
  ].join(" "),
  {
    variants: {
      /**
       * A escada, com os nomes do sistema.
       *
       * As medidas são 32 · 36 · 40 · 44, e os nomes são os que o `Button`, o
       * `Input`, o `Tabs` e o `SelectTrigger` dão a 32, 36 e 40 — um ladrilho
       * `md` ao lado de um botão `md` alinha sem ninguém dizer nada. Eles já
       * foram `sm` · `md` · `lg` para as mesmas 32 · 36 · 44, e era o defeito
       * que o `Menubar` e o `Tabs` já corrigiram: um nome da escada apontando
       * para outra altura.
       *
       * **`2xl` é o único que alcança os 44px de alvo de toque**, e é o degrau
       * de quando o ladrilho é clicável. Acima de `xl` o sistema não tem nome
       * de controle para emprestar, e `2xl` vem do `MoneyDisplay`.
       *
       * O raio cresce com a caixa, e o conjunto do ícone acompanha o corpo:
       * `size-4` é micro (16/solid) e `size-5` é mini (20/solid), pela régua de
       * Iconografia.
       */
      size: {
        md: "size-8 rounded-md [&>svg]:size-4",
        lg: "size-9 rounded-md [&>svg]:size-4",
        xl: "size-10 rounded-lg [&>svg]:size-5",
        "2xl": "size-11 rounded-lg [&>svg]:size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

function ColorTile({
  className,
  size,
  color,
  style,
  ...props
  // `div` já tem um `color` — o atributo HTML legado, `string | undefined`.
  // Sem o Omit, a interseção proíbe o `null` que vem do banco.
}: Omit<React.ComponentProps<"div">, "color"> &
  VariantProps<typeof colorTileVariants> & {
    /**
     * Cor gravada no banco. Vazia cai no cinza do sistema, e um preset legado é
     * dobrado na parada de marca mais próxima por `tileColorFor`.
     */
    color?: string | null
  }) {
  return (
    <div
      data-slot="color-tile"
      aria-hidden
      className={cn(colorTileVariants({ size }), className)}
      // A cor entra uma vez, como variável, e a superfície se deriva dela no
      // CSS. Fazer a conta em JavaScript perderia o `oklch(from …)`, que é o
      // que prende a claridade sem precisar medir cor por cor.
      //
      // **Sem cor, o ladrilho é cinza, e isso é dito.** O padrão era
      // `--primary`, escrito quando o primário era o verde da marca; com o
      // branding preto e branco ele virou croma 0, e o ladrilho "sem cor"
      // passou a ser a tecla da marca esmaecida — lia como desativado.
      // `--muted-foreground` é croma 0 de propósito, e a fórmula da superfície
      // o leva ao mesmo cinza de 0,86 nos dois temas.
      //
      // **O arco-íris não entra como preenchimento** — a rodada 90 mediu e
      // recusou isso no primário, e sob um ícone oito paradas não têm um
      // contraste só. Ele entra pela outra ponta: desde a rodada 96 as cores
      // que a pessoa **escolhe** são as oito da marca, e `tileColorFor` dobra
      // na leitura o que o banco já guardava.
      style={
        {
          "--tile-color": tileColorFor(color) ?? "var(--muted-foreground)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { ColorTile, colorTileVariants }
