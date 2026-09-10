import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { glassRoundSurfaceClassName } from "@/lib/glass-classes"
import { cn } from "@/lib/utils"
import { Caption, P } from "@/components/ui/typography"

/**
 * Feed cronológico de eventos: marcador, conector e conteúdo.
 *
 * ## O docblock antigo descrevia um trabalho que ninguém fazia
 *
 * Ele dizia que a atividade do workspace e o histórico de fatura *"hoje
 * desenham a linha à mão"*. **Não desenhavam.** Varrido `src/` inteiro: fora de
 * `ui/` não existe um único conector vertical — nem `w-px`, nem `border-l` de
 * trilho, nem ponto com anel. As duas telas são listas `divide-y` chatas, e
 * sempre foram. A premissa que justificava o componente era falsa, e é ela que
 * explica os zero consumidores.
 *
 * ## A lista assume o que é dela
 *
 * `isLast` era prop de quem chamava, e a página do catálogo afirmava o
 * contrário — *"o conector é responsabilidade do item, não do consumidor"* —
 * enquanto a própria demonstração escrevia `isLast={i === EVENTOS.length - 1}`.
 * Hoje a `Timeline` deriva do índice e injeta por clone, como `Stepper` e
 * `BreadcrumbList` já fazem. O mesmo clone leva o `marker`: uma trilha tem
 * **uma** largura de calha, e quem a conhece é a lista.
 *
 * ## O ponto nunca esteve no centro
 *
 * Era `mt-0.5` — 2px — mais metade de `size-2.5`: centro a **7px** do topo.
 * `TimelineTitle` é `P`, que traz `leading-relaxed`, então a caixa da primeira
 * linha mede **22,75px** e o centro dela está em 11,375. **4,4px de desalinho**,
 * o dobro do que o `Stepper` chamou de "assinatura de desalinhamento
 * sistemático".
 *
 * A conta é a que o `Alert` registrou: `(entrelinha − marcador) / 2`. Ela vive
 * em `MARCADOR_OFFSET`, deriva do degrau, e o `max(0px, …)` é o que faz o poço
 * — que é **maior** que uma linha — alinhar pelo topo do bloco em vez de subir
 * para fora dele.
 *
 * ## O anel não tinha trabalho
 *
 * `ring-4 ring-background` existe para furar um conector que passa **atrás** do
 * ponto. Aqui ele nunca passou: o conector é irmão, e nasce abaixo. O anel só
 * sobrepunha 4px do fio com `--background` — um entalhe visível em qualquer
 * superfície `--card`. É a régua do `Accordion`: um componente não sabe sobre
 * que superfície está, e não pode pintar a suposição.
 *
 * ## Servidor, e é por isso que tudo desce por variável
 *
 * Não há `"use client"`, e não é acidente: um feed de histórico é a coisa que
 * mais quer ser renderizada no servidor com dado já buscado. Por isso o degrau,
 * a orientação e a calha viajam em **variável CSS** — que herda e não disputa —
 * e nunca em contexto ou em `in-*`, que compila com `:where()` e perderia para
 * a classe base no mesmo elemento.
 */

/**
 * A lista dos tons, exportada para o teste e a página do catálogo iterarem **o
 * `cva` de verdade** em vez de uma cópia que envelhece sozinha. O teste falha se
 * as duas divergirem — é o precedente de `containerSizes`.
 */
const TIMELINE_TONES = [
  "default",
  "primary",
  "success",
  "warning",
  "destructive",
  "income",
  "expense",
] as const

/**
 * A raiz. **Este é o primeiro `cva` do arquivo de propósito**: o
 * `npm run ds:catalog` lê só o primeiro `variants:` de cada fonte, e foi assim
 * que o `Item` passou uma rodada inteira reportando os eixos do grupo como se
 * fossem os dele. `tone` fica de fora do relatório e mora na `PropsTable` —
 * a mesma lacuna conhecida do `gap` do `Carousel` e do `glass` do `Tabs`.
 *
 * `marker` é da **lista** e não do item porque uma trilha tem uma calha só: se
 * cada item decidisse a própria largura, a faixa de data não teria com o que se
 * alinhar. O item ainda pode sobrescrever para a exceção — a `Timeline` injeta
 * o valor por clone, e um `marker` escrito no item vence.
 */
const timelineVariants = cva("flex", {
  variants: {
    orientation: {
      vertical: [
        "flex-col",
        "[--tl-rail-dir:column] [--tl-item-dir:row]",
        "[--tl-rail-w:var(--tl-marker)] [--tl-rail-h:auto] [--tl-grow:0_1_auto]",
        // O conector cresce no eixo principal da calha (é `flex-1`); o que se
        // declara aqui é a **espessura**, que é o eixo cruzado.
        "[--tl-line-w:1px] [--tl-line-h:auto]",
        // Liga a centragem do marcador na primeira linha do título.
        "[--tl-center:1]",
        // Na vertical o conteúdo é a coluna que cresce, rente à esquerda.
        "[--tl-content-grow:1_1_0%] [--tl-content-w:auto]",
        "[--tl-content-center:0] [--tl-content-tx:none] [--tl-content-align:start]",
        "[--tl-pb:var(--tl-pad)]",
      ],
      horizontal: [
        "flex-row items-start",
        "[--tl-rail-dir:row] [--tl-item-dir:column]",
        "[--tl-rail-w:100%] [--tl-rail-h:var(--tl-marker)] [--tl-grow:1_1_0%]",
        "[--tl-line-w:auto] [--tl-line-h:1px]",
        // Na horizontal o marcador tem linha própria: não há o que centrar, e
        // `max(0px, …)` zera a conta inteira quando este fator é 0.
        "[--tl-center:0]",
        // Na deitada o texto se **centra no marcador**, e não encosta na borda
        // esquerda dele. Medido antes: o centro da caixa de texto ficava a
        // **161,4px** do centro do marcador, e o olho lia a palavra pendurada
        // na trilha em vez de presa ao evento. É o mesmo defeito que o
        // `Stepper` mediu em 127px.
        //
        // `max-content` é o que encolhe a caixa até o texto; sem isso ela
        // ocupa a célula inteira e não há o que centrar.
        "[--tl-content-grow:0_0_auto] [--tl-content-w:max-content]",
        "[--tl-content-center:1] [--tl-content-tx:-50%] [--tl-content-align:center]",
        // **Os três se centram, e o primeiro também.** Isto inverte a escolha
        // que o `Stepper` registrou para a mesma geometria: lá o primeiro
        // rótulo fica rente à esquerda, porque centrá-lo o levaria 5px para
        // fora da trilha. Aqui foi decisão do dono, com o custo medido na
        // mesa: o texto do primeiro passa **6,62px** da borda esquerda da
        // lista. Nenhum contêiner com respiro recorta — medido no catálogo,
        // sobram 18,4px dos 25 —, mas uma trilha rente à borda corta ~7px.
        "[--tl-pb:0px]",
      ],
    },
    size: {
      sm: "[--tl-dot:--spacing(2)] [--tl-icon:--spacing(3.5)] [--tl-pad:--spacing(4)] [--tl-rail-gap:--spacing(1)] [--tl-lead:calc(var(--text-xs)*1.625)] [--tl-title:var(--text-xs)] [--tl-well-size:--spacing(6)] gap-2",
      md: "[--tl-dot:--spacing(2.5)] [--tl-icon:--spacing(4)] [--tl-pad:--spacing(6)] [--tl-rail-gap:--spacing(1.5)] [--tl-lead:calc(var(--text-sm)*1.625)] [--tl-title:var(--text-sm)] [--tl-well-size:--spacing(8)] gap-3",
      lg: "[--tl-dot:--spacing(3)] [--tl-icon:--spacing(5)] [--tl-pad:--spacing(8)] [--tl-rail-gap:--spacing(2)] [--tl-lead:calc(var(--text-sm)*1.625)] [--tl-title:var(--text-sm)] [--tl-well-size:--spacing(10)] gap-4",
    },
    /**
     * A forma do marcador, e com ela a largura da calha.
     *
     * `dot` é o ponto de sempre, na cor cheia. `icon` é o poço tingido — o
     * desenho que `account/activity` já escreve à mão em `h-8 w-8`, que é
     * exatamente o `md` daqui. `avatar` é a casca sem tinta, porque a
     * identidade traz a cor dela. `none` deixa só o fio.
     */
    marker: {
      dot: "[--tl-marker:var(--tl-dot)]",
      icon: "[--tl-marker:var(--tl-well-size)]",
      avatar: "[--tl-marker:var(--tl-well-size)]",
      none: "[--tl-marker:0px]",
    },
  },
  defaultVariants: { orientation: "vertical", size: "md", marker: "dot" },
})

/**
 * `(entrelinha − marcador) / 2`, por degrau, com o fator de orientação embutido.
 *
 * O `max(0px, …)` não é defensivo: quando o marcador é **maior** que uma linha
 * — o poço de 32 contra uma caixa de 22,75 — a conta fica negativa, e obedecê-la
 * puxaria o poço para fora do topo do bloco. Zerar ali é o que faz o poço
 * alinhar pelo topo e o ponto pelo centro, com uma fórmula só.
 *
 * Todo `-` binário dentro de um `calc()` arbitrário vai como `_-_`: o Tailwind
 * normaliza espaço em torno de `+`, `*` e `/`, mas não pode com `-`, que seria
 * indistinguível de `--var`.
 */
/**
 * O tom publica **três** variáveis e não pinta nada: a cor cheia do ponto, a
 * superfície do poço e a tinta que vai dentro dele. Quem escolhe qual usar é a
 * forma do marcador — e é isso que evita 14 `compoundVariants` de tom × forma.
 *
 * **É aqui que o colapso de tons se desfaz.** `--income` é declarado como
 * `var(--success)` e `--expense` como `var(--destructive)`, então na cor cheia
 * os dois pares saem idênticos — medido, `oklch(0.542 0.14 152)` nos dois
 * verdes. Na família `-muted` eles **divergem**: `--income-muted` é
 * `oklch(0.93 0.07 152)` contra `oklch(0.96 0.03 152)` do genérico, e o
 * comentário do `globals.css` chama essa família, com estas palavras, de
 * "chips, badges, **icon wells**". O poço tingido não é enfeite: é o único
 * lugar do componente onde sete tons rendem sete cores.
 */
const timelineToneVariants = cva("", {
  variants: {
    tone: {
      default:
        "[--tl-fill:var(--color-border)] [--tl-ink:var(--color-muted-foreground)] [--tl-well:var(--color-muted)]",
      primary:
        "[--tl-fill:var(--color-primary)] [--tl-ink:var(--color-primary-muted-foreground)] [--tl-well:var(--color-primary-muted)]",
      success:
        "[--tl-fill:var(--color-success)] [--tl-ink:var(--color-success-muted-foreground)] [--tl-well:var(--color-success-muted)]",
      warning:
        "[--tl-fill:var(--color-warning)] [--tl-ink:var(--color-warning-muted-foreground)] [--tl-well:var(--color-warning-muted)]",
      destructive:
        "[--tl-fill:var(--color-destructive)] [--tl-ink:var(--color-destructive-muted-foreground)] [--tl-well:var(--color-destructive-muted)]",
      income:
        "[--tl-fill:var(--color-income)] [--tl-ink:var(--color-income-muted-foreground)] [--tl-well:var(--color-income-muted)]",
      expense:
        "[--tl-fill:var(--color-expense)] [--tl-ink:var(--color-expense-muted-foreground)] [--tl-well:var(--color-expense-muted)]",
    },
  },
  defaultVariants: { tone: "default" },
})

const MARCADOR_OFFSET =
  "[margin-block-start:max(0px,calc((var(--tl-lead)_-_var(--tl-marker))/2*var(--tl-center)))]"

function Timeline({
  className,
  orientation,
  size,
  marker,
  glass = false,
  children,
  ...props
}: React.ComponentProps<"ol"> &
  VariantProps<typeof timelineVariants> & {
    /**
     * O acabamento da trilha: preenchimento chapado, ou a lâmina de vidro do
     * sistema.
     *
     * **É da lista, e não do item, e isso é a garantia e não a conveniência.**
     * Numa `Timeline` o estilo é um só: se é vidro, é vidro em todo marcador;
     * se não é, nenhum tem. Como `marker` é sobrescrevível por item, um eixo
     * por item deixaria escrever a lista inconsistente — um poço de vidro ao
     * lado de um avatar chapado. Aqui o clone **sobrescreve** em vez de
     * preencher, e não há como.
     */
    glass?: boolean
  }) {
  const itens = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <ol
      data-slot="timeline"
      data-orientation={orientation ?? "vertical"}
      data-size={size ?? "md"}
      data-marker={marker ?? "dot"}
      data-glass={glass || undefined}
      className={cn(timelineVariants({ orientation, size, marker }), className)}
      {...props}
    >
      {itens.map((item, i) =>
        React.cloneElement(
          item as React.ReactElement<{
            isLast?: boolean
            marker?: TimelineMarker
            glass?: boolean
          }>,
          {
            isLast: i === itens.length - 1,
            // Um `marker` escrito no item vence: o clone só preenche o que
            // estava vazio. `undefined` cai no padrão do `cva`, que é `dot`.
            marker:
              (item as React.ReactElement<{ marker?: TimelineMarker }>).props
                .marker ?? marker ?? undefined,
            // O vidro **não** aceita exceção, e é a diferença entre os dois.
            // Ele sobrescreve o que o item disser, porque a uniformidade da
            // trilha é o contrato — inclusive no item que troca de `marker`.
            glass,
          }
        )
      )}
    </ol>
  )
}

type TimelineMarker = NonNullable<
  VariantProps<typeof timelineVariants>["marker"]
>

/**
 * A superfície de vidro, na forma que as três têm em comum.
 *
 * `glassRoundSurfaceClassName` é `glass glass-control glass-round` — o mesmo
 * que o `Avatar` veste em `shape="circle"`. O preset cônico existe porque o aro
 * padrão é um gradiente **linear**, e num círculo as duas pontas dele caem nos
 * **cantos** da caixa, que ali não existem: medido no avatar, **0% do
 * perímetro** via o pico. As três formas daqui são redondas, então as três o
 * vestem.
 *
 * A tinta é `--tl-ink` — o `-muted-foreground` do tom —, e **isso foi medido
 * contra a alternativa**, não escolhido.
 *
 * O candidato óbvio era `--tl-fill`, a cor cheia: a régua do vidro diz que a
 * fonte de matiz deve ser `--{tom}`, porque o matiz é idêntico nos dois temas e
 * basta um valor. Só que a receita faz `oklch(from ink l calc(c * 4) h)` — ela
 * toma o **`l`** da tinta também, e `--tl-fill` tem claridade fixa (~0,5), que
 * não conversa com um aro cujos próprios tokens invertem por tema
 * (`oklch(0 0 0 / 18%)` no claro, `oklch(1 0 0 / 34%)` no escuro).
 *
 * `--tl-ink` acompanha o tema (0,32 no claro, 0,88 no escuro), que é a mesma
 * polaridade do aro. Medido, o aro contra o corpo:
 *
 * |            | `--tl-fill` | `--tl-ink` |
 * | ---------- | ----------- | ---------- |
 * | escuro     | 3,15        | **3,66**   |
 * | claro      | 1,77        | **2,07**   |
 * | pior caso  | 2,60        | **3,48**   |
 *
 * Ele ganha nos dois temas, e o pior caso é o que decide: `default` é o tom
 * mais usado, e era justamente onde o aro sumia.
 *
 * O par `dark:` que a régua queria evitar **não é necessário**: o token já
 * inverte sozinho, como `--identity-N-surface` faz no `Avatar`.
 */
const VIDRO = [
  glassRoundSurfaceClassName,
  "[--glass-ink:var(--tl-ink)] [--glass-ink-amount:20%]",
].join(" ")

/**
 * A medida do marcador, republicada **no item**.
 *
 * A raiz também publica `--tl-marker`, e ali ela é a largura da **calha** — que
 * tem de ser uniforme, senão a faixa de data não tem com o que se alinhar. Mas
 * duas outras coisas precisam da medida do marcador **renderizado**: o
 * deslocamento vertical (`MARCADOR_OFFSET`) e, na horizontal, a centragem do
 * texto sob ele.
 *
 * As duas divergem no item que **sobrescreve** o `marker`: um ponto de 10px
 * numa trilha de poço lia a medida de 32 e saía **6,38px acima** do centro do
 * título, medido na demonstração das formas misturadas.
 *
 * Ela mora no `<li>` e não no marcador porque o conteúdo é **irmão** do
 * marcador: custom property não atravessa para o lado. Do item ela desce para
 * os dois. E a calha não se mexe, porque `--tl-rail-w` é computada na raiz e
 * herda já resolvida.
 */
const MEDIDA_DO_MARCADOR: Record<TimelineMarker, string> = {
  dot: "[--tl-marker:var(--tl-dot)]",
  icon: "[--tl-marker:var(--tl-well-size)]",
  avatar: "[--tl-marker:var(--tl-well-size)]",
  none: "[--tl-marker:0px]",
}

const timelineMarkerVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full",
  {
    variants: {
      marker: {
        dot: "size-(--tl-dot)",
        icon: "size-(--tl-well-size) [color:var(--tl-ink)] [&_svg]:size-(--tl-icon) [&_svg]:shrink-0",
        avatar:
          "size-(--tl-well-size) overflow-hidden [&>*]:size-full [&>*]:rounded-full",
        none: "hidden",
      },
      /**
       * A superfície mora nos compostos abaixo, um ramo por forma.
       *
       * **É a forma do `ColorTile` e do `Tabs`, e a razão é mecânica.** A
       * asserção 13 de `glass.test.ts` proíbe o *neutralizador*: onde o eixo
       * dispensa a classe, ela não pode existir. Escrever `[background:…]` na
       * base e anular com `bg-transparent` no ramo de vidro seria o defeito —
       * e ele nem funcionaria, porque o shorthand `background` da utility
       * apaga o `background-color` de quem a veste **calado** (a armadilha nº 1
       * da régua).
       */
      glass: { true: "", false: "" },
    },
    compoundVariants: [
      { marker: "dot", glass: false, class: "[background:var(--tl-fill)]" },
      {
        marker: "dot",
        glass: true,
        class: [VIDRO, "[--glass-tone:var(--tl-fill)]"].join(" "),
      },

      { marker: "icon", glass: false, class: "[background:var(--tl-well)]" },
      {
        marker: "icon",
        glass: true,
        class: [VIDRO, "[--glass-tone:var(--tl-well)]"].join(" "),
      },

      // O avatar é o único sem tom, e é de propósito: a cor daquele marcador é
      // a identidade da pessoa, que mora **dentro** do avatar. Tingir a moldura
      // por cima competiria com ela. Sem `--glass-tone` a lâmina e as nuvens
      // voltam a pintar, e é isso que dá corpo de vidro ao bisel.
      //
      // O recuo é o que **faz o bisel existir**: com `box-sizing: border-box`,
      // 32 − 2 de borda − 4 de recuo deixam 26 de caixa de conteúdo, e o
      // `size-full` do filho encolhe para ela. Sem ele a foto cobre a casca
      // inteira e o vidro fica invisível — que era a razão pela qual esta forma
      // quase ficou de fora do modo.
      { marker: "avatar", glass: true, class: [VIDRO, "p-0.5"].join(" ") },
    ],
    defaultVariants: { marker: "dot", glass: false },
  }
)

/**
 * Um evento.
 *
 * `isLast` e `marker` são **preenchidos pela `Timeline`** a partir do índice e
 * do eixo da lista — os dois são exatamente o que o pai sabe e o filho não.
 * Passe à mão só na exceção: uma lista que continua depois do último item
 * renderizado, ou o evento cujo marcador foge da calha.
 */
function TimelineItem({
  className,
  tone,
  marker,
  icon,
  avatar,
  isLast = false,
  glass = false,
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof timelineToneVariants> & {
    marker?: TimelineMarker
    /**
     * **Preenchido pela `Timeline`, e sem exceção.** Ao contrário de `marker`,
     * este não aceita sobrescrita: o acabamento é da trilha inteira.
     */
    glass?: boolean
    /** O glifo do poço. Heroicons — 16/solid até `md`, 20/solid em `lg`. */
    icon?: React.ReactNode
    /** Um `<Avatar>` de quem chama. Vem como nó para não acoplar a camada. */
    avatar?: React.ReactNode
    isLast?: boolean
  }) {
  const forma: TimelineMarker = marker ?? "dot"

  return (
    <li
      data-slot="timeline-item"
      data-tone={tone ?? "default"}
      data-last={isLast ? "" : undefined}
      className={cn(
        "flex min-w-0 [flex:var(--tl-grow)] [flex-direction:var(--tl-item-dir)] [gap:var(--tl-rail-gap)]",
        // O último não estica, e é a lição do `Stepper`: com todos em `flex-1`,
        // o último reservava a largura de um item inteiro para mostrar um
        // marcador — ~192px de vão morto, com a trilha parando a 78% da largura.
        //
        // Vai por variável e não por `in-data-[orientation=…]`: aquele variante
        // compila com `:where()`, que não soma especificidade, e perderia para
        // a classe base no mesmo elemento. Variável herda e não disputa.
        isLast ? "[--tl-grow:0_0_auto] [--tl-pb:0px]" : null,
        MEDIDA_DO_MARCADOR[forma],
        timelineToneVariants({ tone }),
        className
      )}
      {...props}
    >
      {/* A calha. Largura fixa em `--tl-marker` nos dois eixos: é ela que faz a
          faixa de data alinhar com os eventos, e um marcador que fuja da forma
          da lista se centrar dentro dela em vez de empurrar o conteúdo. */}
      <div
        aria-hidden
        className={cn(
          // **`justify-start`, e nunca `center`.** O conector é `flex-1`, então
          // com ele não sobra espaço livre e `justify-content` não decide nada
          // — o que fazia o `center` parecer correto. No **último** item não há
          // conector, e aí o marcador sozinho se centrava na altura inteira da
          // calha: medido, **23,44px** abaixo do centro do título, contra 0 nos
          // outros três. O defeito vivia só na última linha de cada trilha, que
          // é o que o fez atravessar a rodada 69 inteira.
          //
          // Quem alinha o marcador é `MARCADOR_OFFSET`; um `justify` que só age
          // quando falta um irmão sobrescreve a fórmula pelas costas.
          "flex shrink-0 items-center justify-start [flex-direction:var(--tl-rail-dir)] [gap:var(--tl-rail-gap)]",
          "[height:var(--tl-rail-h)] [width:var(--tl-rail-w)]"
        )}
      >
        <span
          className={cn(
            timelineMarkerVariants({ marker: forma, glass }),
            MARCADOR_OFFSET
          )}
        >
          {forma === "icon" ? icon : forma === "avatar" ? avatar : null}
        </span>
        {!isLast ? (
          <span
            className="flex-1 rounded-full bg-border [height:var(--tl-line-h)] [width:var(--tl-line-w)]"
          />
        ) : null}
      </div>

      {/* O recuo é `calc(medida/2 * centro)` e não uma variável pronta da
          raiz: `var(--tl-marker)` precisa resolver **aqui**, com a medida do
          marcador deste item, e não com a da lista. O fator liga e desliga a
          conta inteira — é o mesmo mecanismo de `--tl-center`.

          Já o `translate` vem pronto, porque em vertical ele tem de ser
          `none`: qualquer valor, inclusive `0px`, cria bloco de contenção e
          mudaria o significado de um filho absoluto que a tela ponha aqui. */}
      <div
        className={cn(
          "min-w-0 [flex:var(--tl-content-grow)] [inline-size:var(--tl-content-w)]",
          "[margin-inline-start:calc(var(--tl-marker)/2*var(--tl-content-center))]",
          "[padding-block-end:var(--tl-pb)] [text-align:var(--tl-content-align)]",
          "[translate:var(--tl-content-tx)_0]"
        )}
      >
        {children}
      </div>
    </li>
  )
}

/**
 * A faixa de data — "Hoje", "Ontem", "Março de 2026".
 *
 * **Contagem no app hoje: zero.** Nenhuma das oito listas de eventos agrupa por
 * data. Ela entra por decisão do dono, com o custo na mesa, e não como resposta
 * a uma medida — o precedente é o `variant` de superfície do `Carousel`.
 *
 * O fio **continua** através dela, porque a data não interrompe a cronologia:
 * ela a rotula. E a faixa não desenha traço nem tinta próprios (regra J) — quem
 * separa é o respiro, e o rótulo veste a régua versalete que a `Table` e o
 * grupo do `Command` já falam.
 */
function TimelineSeparator({
  className,
  children,
  // A `Timeline` clona **todos** os filhos, e a faixa é um deles. Os dois
  // chegam aqui e não têm uso: a calha lê `--tl-rail-w` da raiz, e uma faixa
  // não tem conector próprio para cortar. Sem desestruturar, `...props` os
  // derramava no `<li>` — medido no console, `React does not recognize the
  // \`isLast\` prop on a DOM element`, três vezes na página.
  isLast: _isLast,
  marker: _marker,
  glass: _glass,
  ...props
}: React.ComponentProps<"li"> & {
  isLast?: boolean
  marker?: TimelineMarker
  glass?: boolean
}) {
  return (
    <li
      data-slot="timeline-separator"
      className={cn(
        "flex [flex-direction:var(--tl-item-dir)] [gap:var(--tl-rail-gap)]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="flex shrink-0 items-center justify-start [flex-direction:var(--tl-rail-dir)] [height:var(--tl-rail-h)] [width:var(--tl-rail-w)]"
      >
        <span className="flex-1 rounded-full bg-border [height:var(--tl-line-h)] [width:var(--tl-line-w)]" />
      </div>
      <Caption
        className={cn(
          "font-semibold tracking-wider uppercase",
          "[padding-block:calc(var(--tl-pad)/3)]"
        )}
      >
        {children}
      </Caption>
    </li>
  )
}

/**
 * Título do evento.
 *
 * **A entrelinha é declarada, e não herdada.** `text-(length:…)` é um
 * utilitário de tamanho, e no Tailwind ele escreve `line-height` junto: posto
 * depois, ele **derruba** o `leading-relaxed` que o `P` traz. Medido no
 * navegador — a caixa saiu com 21px onde a fórmula do marcador supunha 22,75, e
 * o ponto caiu 0,88px fora do centro.
 *
 * Por isso o degrau publica `--tl-lead` e as duas pontas a leem: o título como
 * `line-height`, e `MARCADOR_OFFSET` como a entrelinha da conta. Uma fonte só;
 * duas não teriam como divergir caladas de novo.
 */
function TimelineTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <P
      data-slot="timeline-title"
      className={cn(
        "font-medium text-(length:--tl-title) leading-(--tl-lead)",
        className
      )}
      {...props}
    />
  )
}

/** Legenda. Com o título, é o mesmo dado em duas linhas: sem `gap`. */
function TimelineDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption data-slot="timeline-description" className={className} {...props} />
  )
}

/**
 * Carimbo de tempo.
 *
 * **Passe `dateTime`.** Um `<time>` sem ele não é data para máquina nenhuma —
 * nem leitor de tela, nem indexador —, e era o que o catálogo demonstrava ao
 * escrever `"05/04 · 09:12"` como texto puro. O respiro acima existe porque o
 * carimbo é um terceiro registro, e não a segunda linha do par de identidade.
 */
function TimelineTime({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <Caption
      asChild
      data-slot="timeline-time"
      className={cn("nums mt-(--space-inline) block text-2xs", className)}
    >
      <time {...props} />
    </Caption>
  )
}

export {
  TIMELINE_TONES,
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineSeparator,
  TimelineTime,
  TimelineTitle,
  timelineMarkerVariants,
  timelineToneVariants,
  timelineVariants,
}
export type { TimelineMarker }
