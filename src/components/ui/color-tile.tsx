import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { glassControlSurfaceClassName } from "@/lib/glass-classes"
import { cn } from "@/lib/utils"

/**
 * O ladrilho que carrega uma cor escolhida pela pessoa — ícone de categoria,
 * marca de conta, capa de conta a pagar.
 *
 * **A cor da pessoa entra como matiz, não como preenchimento.** O ladrilho a
 * dissolve num véu sobre o cartão e devolve o mesmo matiz, saturado, no ícone —
 * a construção do `Avatar` com os tons de identidade, e pelo mesmo motivo:
 * quando a cor vem do banco, quem garante a legibilidade é o sistema.
 *
 * Ele já foi o contrário disso. Preenchia de cor cheia com ícone branco por
 * cima, e quatro dos dez presets de categoria reprovavam nos 3:1 da WCAG
 * 1.4.11 — âmbar dava 2,15, esmeralda 2,54. A rodada anterior consertou isso
 * medindo a luminância e virando a tinta para escura quando o branco não
 * alcançava. Funcionava, mas era remendo: uma conta corrigindo um desenho que
 * não fechava. Fixando a **claridade** da tinta e deixando a pessoa escolher só
 * matiz e croma, não há o que medir — o contraste é estrutural.
 *
 * Antes disso ele também foi lustrado: degradê branco na diagonal, borda clara,
 * sombra e um `backdrop-blur`. Saiu porque o resto do sistema preenche chapado.
 */
const colorTileVariants = cva(
  [
    "flex shrink-0 items-center justify-center overflow-hidden",
    // A tinta vem da cor da pessoa com a **claridade trocada** pela do sistema:
    // 0,42 no claro e 0,78 no escuro, os mesmos números da rampa de identidade.
    // `oklch(from …)` pega matiz e croma do que ela escolheu e descarta o resto,
    // então amarelo puro e azul-marinho chegam aqui com o mesmo peso.
    //
    // **É a única das três camadas que vale nos dois modos**, e por isso é a
    // única que ficou na base: a lâmina clara é quase branca e a escura quase
    // preta, então 0,42 e 0,78 continuam do lado certo das duas.
    "[&>*]:text-[oklch(from_var(--tile-color)_0.42_c_h)]",
    "dark:[&>*]:text-[oklch(from_var(--tile-color)_0.78_c_h)]",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-8 rounded-md [&>svg]:size-4",
        md: "size-9 rounded-md [&>svg]:size-4",
        lg: "size-11 rounded-lg [&>svg]:size-5",
      },
      /**
       * A superfície: preenchimento chapado, ou a lâmina de vidro do sistema.
       *
       * **O eixo existe para não haver o que anular.** Como embrulho, o modo de
       * vidro empilhava `bg-transparent` e `ring-0 ring-transparent` por fora
       * para desfazer o véu e o fio que a base já tinha emitido — e o fio
       * precisava de três classes, porque `ring-0` derruba só a largura. Aqui
       * as duas camadas simplesmente **não são escritas** no ramo de vidro.
       *
       * O raio não muda de lugar: a `@utility glass` não declara
       * `border-radius`, então o `rounded-md`/`rounded-lg` do degrau continua
       * valendo — é isso que a torna portátil sem eixo de forma.
       */
      glass: {
        false: [
          // O véu é 12% da cor sobre o cartão no claro e 18% no escuro. Opaco e
          // não alpha — dois ladrilhos vizinhos não devem se atravessar.
          //
          // Ele **já teve** as mesmas proporções de `--identity-N-surface`, e
          // deixou de ter quando o par de identidade passou a inverter no tema
          // claro. A divergência é correta, e o motivo é a régua deste arquivo:
          // o ladrilho carrega uma cor **de runtime**, escolhida pela pessoa e
          // vinda do banco, e ele não pode virar uma pastilha preenchida numa
          // cor que ninguém calibrou. O avatar carrega uma das seis identidades
          // do sistema.
          "bg-[color-mix(in_srgb,var(--tile-color)_12%,var(--card))]",
          "dark:bg-[color-mix(in_srgb,var(--tile-color)_18%,var(--card))]",
          // O fio leva a mesma claridade normalizada da tinta, e não a cor
          // crua. Medido: com a cor crua, um ladrilho branco dava véu de 1,00
          // contra o cartão **e** fio branco sobre branco — o corpo sumia
          // inteiro e sobrava um ícone flutuando. Normalizado, o fio de um
          // branco é um cinza de 0,42, que se enxerga. É o mesmo motivo da
          // tinta, aplicado à aresta.
          "ring-1 ring-[oklch(from_var(--tile-color)_0.42_c_h_/_0.25)]",
          "dark:ring-[oklch(from_var(--tile-color)_0.78_c_h_/_0.25)]",
        ].join(" "),
        // A lâmina, mais a cor da pessoa como tom dela. **É a primeira tradução
        // de uma cor de runtime**: as outras leem um token de uma tabela, e
        // aqui a cor é um hex do banco, então o tom lê a `--tile-color` que o
        // `style` publica. Literais e nunca montadas — o Tailwind varre o
        // código como texto.
        //
        // Os dois percentuais saíram de varredura com os dez presets de
        // `CATEGORY_COLORS` e os três extremos da paleta livre, minimizando o
        // **desvio contra o véu chapado** para os dois lerem como a mesma
        // família: 0,011 no claro e 0,086 no escuro, com a tinta em 6,48 e 4,78
        // no pior caso — bem acima dos 3:1 da WCAG 1.4.11.
        true: [
          glassControlSurfaceClassName,
          // **Aqui o percentual não é alfa — é diluição**, e é o que faz esta
          // peça ser a exceção quando o tom passou a ser opaco. Nas outras a
          // fonte é um token `-muted` já na cor certa, e o `N%` era só
          // transparência; aqui a fonte é o **hex cru do banco**, e o `12%` /
          // `18%` são a receita que transforma uma cor saturada num véu.
          //
          // Por isso o tom é literalmente **o véu do ladrilho chapado, opaco**:
          // é o que faz o corpo das duas versões ser o mesmo, que é a decisão
          // desta rodada. Um `100%` aqui pintaria a cor cheia — o desenho que
          // reprovava em 4 dos 10 presets nos 3:1 da WCAG 1.4.11.
          "[--glass-tone:color-mix(in_srgb,var(--tile-color)_12%,var(--card))]",
          "dark:[--glass-tone:color-mix(in_srgb,var(--tile-color)_18%,var(--card))]",
          // E a mesma cor tinge o aro e as nuvens. Aqui a fonte de matiz é a
          // própria `--tile-color`, sem par por tema: ela é a cor crua do
          // banco, e não um token que inverte.
          "[--glass-ink:var(--tile-color)] [--glass-ink-amount:20%]",
        ].join(" "),
      },
    },
    defaultVariants: {
      size: "md",
      glass: false,
    },
  }
)

function ColorTile({
  className,
  size,
  glass,
  color,
  style,
  ...props
  // `div` já tem um `color` — o atributo HTML legado, `string | undefined`.
  // Sem o Omit, a interseção proíbe o `null` que vem do banco.
}: Omit<React.ComponentProps<"div">, "color"> &
  VariantProps<typeof colorTileVariants> & {
    /** Cor gravada no banco. Vazia cai em `--primary`. */
    color?: string | null
  }) {
  return (
    <div
      data-slot="color-tile"
      data-glass={glass || undefined}
      aria-hidden
      className={cn(colorTileVariants({ size, glass }), className)}
      // A cor entra uma vez, como variável, e as três camadas — véu, tinta e
      // fio — se derivam dela no CSS. Passá-la três vezes pelo `style` exigiria
      // repetir a conta em JavaScript e perderia o `dark:`.
      style={
        {
          "--tile-color": color?.trim() || "var(--primary)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { ColorTile, colorTileVariants }
