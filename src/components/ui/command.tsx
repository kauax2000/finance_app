"use client"

import * as React from "react"
import { ArrowUpRightIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Command as CommandPrimitive, useCommandState } from "cmdk"

import { cn } from "@/lib/utils"
import { Caption, P } from "@/components/ui/typography"
import {
  menuItemGeometryClassName,
  menuSeparatorClassName,
  menuItemFadeClassName, menuPanelTintClassName } from "@/lib/menu-classes"
import {
  scrollFadeBandsClassName,
  scrollFadeBleedClassName,
  scrollFadeViewportClassName,
} from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import { useCommandIdleSelection } from "@/hooks/use-command-idle-selection"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
/**
 * O eixo é a **moldura**, e não só o raio.
 *
 * A primeira versão tinha `inline` e `dialog`, e decidia apenas o
 * arredondamento. Isso deixava de fora a pergunta que importa — **quem desenha
 * a borda** —, e a resposta acabava na tela: as quatro demonstrações do
 * catálogo escreviam `border border-border` à mão, medido.
 *
 * São três contextos, não dois:
 *
 * | Onde a paleta vive | Quem dá a moldura |
 * | --- | --- |
 * | dentro de um `Popover` ou do `Combobox` | o popover, com anel e sombra |
 * | solta numa página | **ninguém** — era o buraco |
 * | dentro de um `CommandDialog` | o `DialogContent` |
 *
 * `plain` é o padrão porque é o caso do `Combobox`, o único consumidor de
 * produto: ali uma segunda borda dentro do anel do popover desenharia duas
 * linhas a 1px de distância.
 *
 * `inline` saiu do tipo. Não é renomeação cosmética — o nome dizia *onde* e não
 * *o quê*, e era por isso que ele não respondia sobre a borda.
 */
const commandVariants = cva(
  [
    // **O `Command` hospedado não pinta — quem pinta é a casca.** Ele já vestiu
    // a placa da régua por dentro; num `Popover` (Combobox, FormPicker) isso
    // eram **duas** placas a 60% empilhadas, 84% no escuro, e o Combobox saía
    // visivelmente mais claro que o DatePicker — o mesmo popover com uma placa
    // só. É a regra "uma placa por superfície" de `lib/menu-classes`. Só a
    // variante `panel`, a paleta solta numa página, pinta a própria.
    //
    // `relative` é carga estrutural: as camadas de borrão das duas pontas são
    // **irmãs** do rolável e absolutas, e sem bloco de contenção aqui elas
    // resolveriam contra um ancestral qualquer. O `overflow-hidden` ao lado é o
    // que as apara no canto da casca.
    "relative flex size-full flex-col overflow-hidden text-popover-foreground",
    "[--command-list-max-h:--spacing(72)]",
    // A casca só publica as duas medidas estruturais, porque só ela enxerga as
    // faixas como **irmãs** do rolável. Todo o resto da dissolução — âncoras,
    // rampa, máscara — mora na própria lista, em `scroll-fade-y`.
    //
    // A altura da faixa de busca é campo (32) + recuo (16). Não há fio a somar:
    // ele saiu quando o topo passou a dissolver o conteúdo em vez de aparar.
    //
    // As duas são **condicionais à presença da faixa**, nunca à rolagem. Três
    // demos do catálogo montam `CommandList` sem `CommandInput`, e sem a
    // condição a rampa dissolveria o primeiro item a partir da borda do painel,
    // sem nada acima que justificasse. E o rodapé já dependeu de
    // `data-scrollable`: como `pb` é `foot-h + 4`, declarar "esta lista rola"
    // **acrescentava 36px ao próprio conteúdo** e realimentava a condição que
    // produziu a decisão — histerese, não laço divergente, e por isso passou
    // despercebida. Medido: uma demo com 288 de altura e 297 de conteúdo estava
    // marcada como rolável quando, com `pb` de 40, ela não rolaria.
    //
    // O `Combobox`, que nunca renderiza rodapé, deixa de carregar uma calha
    // vazia de 76px no fim de cada popover.
    scrollFadeBandsClassName,
    "has-[[data-slot=command-input-wrapper]]:[--scroll-fade-band-h:calc(--spacing(8)+--spacing(4))]",
    // O campo `lg` (36) publica a própria faixa. O `:has()` com dois atributos
    // pesa mais que o de um, então vence sem depender da ordem de emissão.
    "has-[[data-slot=command-input-wrapper][data-size=lg]]:[--scroll-fade-band-h:calc(--spacing(9)+--spacing(4))]",
  ],
  {
    variants: {
      variant: {
        /**
         * Sem moldura — e **sem canto próprio**: ele herda o de quem contém.
         *
         * É isto que apagou a terceira variante. `dialog` existia só para
         * cravar `rounded-xl` e bater com o casco do diálogo — um número que
         * pertence ao contêiner, copiado para dentro do componente. Herdando,
         * a paleta acerta o canto do popover (10px), o do diálogo (14px) e o
         * de qualquer superfície futura, sem saber de nenhum deles.
         */
        plain: "[border-radius:inherit]",
        /**
         * **A pilha** (rodada 143): a raiz é uma coluna que não pinta, e cada
         * peça pinta a sua superfície — a pílula de busca, a placa da lista e
         * as cápsulas da legenda, a 12px uma da outra, no mesmo plano. É o
         * desenho que nasceu no `CommandDialog` (rodadas 140–142) e virou a
         * linguagem da paleta: solta numa página, em diálogo e no `Combobox`.
         *
         * Ela já foi a placa inteira da régua com o campo dentro. O
         * `overflow-visible` devolve o que a base recorta — o anel da pílula
         * fica **fora** da caixa dela —, e as linhas sobem ao aparecer em toda
         * a pilha, porque isso não mexe em altura.
         */
        panel: "gap-3 overflow-visible [--command-reveal:var(--duration-spring)]",
      },
      /**
       * A densidade da pilha (rodada 143). `palette` é a paleta — pílula de
       * 36, linhas de 36, respiro largo. `menu` é a pilha com as medidas de
       * um dropdown — pílula de 32, linhas de 28, o recuo e o respiro dos
       * menus, 4px entre as peças (o mesmo afastamento do popover até o
       * gatilho) —, para o `Combobox`, que é um seletor de
       * valor preso a um campo e não um destino de busca.
       */
      density: {
        palette: "",
        menu: "gap-1",
      },
    },
    defaultVariants: { variant: "plain", density: "palette" },
  }
)

/**
 * Se a peça está na **pilha** — um `Command variant="panel"`, que é o que o
 * `CommandDialog` e o `Combobox` montam (rodadas 141 e 143). Na pilha o campo,
 * a lista, o grupo e a linha vestem o desenho de três superfícies; em `plain`,
 * nada muda.
 */
const CommandStackContext = React.createContext<"palette" | "menu" | null>(null)

/**
 * Se a pilha está num `CommandDialog` — o único lugar que acende o **feixe**
 * da pílula (rodada 142). Na paleta solta e no `Combobox` ele saiu a pedido
 * do dono (rodada 143): lá a busca é uma peça entre outras da tela, e a luz
 * correndo chamava atenção para o lugar errado.
 */
const CommandBeamContext = React.createContext(false)

/**
 * `autoSelectFirst={false}` faz a paleta abrir **sem nada selecionado** — e o
 * mecanismo inteiro, com a razão de cada peça, está em
 * [`use-command-idle-selection`](src/hooks/use-command-idle-selection.ts).
 *
 * O padrão é `true` porque o comportamento de hoje serve o `Combobox`, que é o
 * consumidor de produto: ali a lista é um seletor de valor, e abrir com o
 * primeiro item realçado é o que se espera de um select. Quem liga o modo ocioso
 * é o `CommandDialog`, onde a lista é um destino de busca e não um valor.
 *
 * **Ele é dono do `value`.** Com `autoSelectFirst={false}`, um `value` controlado
 * por fora seria sobrescrito a cada tecla — as duas coisas são mutuamente
 * exclusivas, e é por isso que o hook devolve `{}` quando está desligado, em vez
 * de devolver handlers inertes que ainda ocupariam as props.
 */
function Command({
  className,
  variant,
  density,
  autoSelectFirst = true,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> &
  VariantProps<typeof commandVariants> & {
    /** Abrir com a primeira linha já selecionada. `false` = modo ocioso. */
    autoSelectFirst?: boolean
  }) {
  const resolvida = variant ?? "plain"
  const pilha = resolvida === "panel" ? (density ?? "palette") : null
  const ocioso = useCommandIdleSelection(!autoSelectFirst)

  return (
    <CommandPrimitive
      data-slot="command"
      data-variant={resolvida}
      className={cn(commandVariants({ variant: resolvida, density }), className)}
      {...props}
      // Os três handlers são **compostos**, e não sobrescritos: um `{...ocioso}`
      // antes de `{...props}` deixaria o `onKeyDown` de quem chama apagar o do
      // modo ocioso, e depois seria o contrário. O de quem chama roda primeiro,
      // para poder prevenir — o do hook confere `defaultPrevented`.
      value={ocioso.value ?? props.value}
      onValueChange={ocioso.onValueChange ?? props.onValueChange}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        ocioso.onKeyDown?.(event)
      }}
      onInput={(event) => {
        props.onInput?.(event)
        ocioso.onInput?.(event)
      }}
      onPointerMoveCapture={(event) => {
        props.onPointerMoveCapture?.(event)
        ocioso.onPointerMoveCapture?.(event)
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event)
        ocioso.onPointerLeave?.(event)
      }}
    >
      <CommandStackContext.Provider value={pilha}>
        {children}
      </CommandStackContext.Provider>

      {/* Sem camadas de borrão. Elas moraram aqui — três `backdrop-filter`
          empilhados por ponta, somados à rampa — e eram a última paleta da casa
          com o borrão nas pontas depois de o diálogo e a folha o terem tirado.
          Dentro de um casco que já borra a 24px, cada camada aninhada
          re-borrava a placa e a aresta de cada uma saía como uma **linha de
          tom** atravessando a lista: três linhas em cima, duas embaixo, "como
          se a resolução fosse baixa". A máscara sozinha faz o trabalho, como
          em todo rolável da casa. */}
    </CommandPrimitive>
  )
}

/**
 * A paleta em diálogo — e ela é dona do próprio `Command`.
 *
 * **Ela não era.** O casco montava o `Dialog` e entregava `children` direto,
 * então quem chamava tinha de lembrar de embrulhar tudo num `<Command>` —
 * porque `CommandInput` e `CommandList` são peças do cmdk e exigem o contexto
 * da raiz. Dos dois consumidores do projeto, **um errou**: o `ds-search`
 * embrulhava, a demonstração do catálogo não, e o resultado era um diálogo que
 * abria e estourava na hora com `Cannot read properties of undefined (reading
 * 'subscribe')` — o store do cmdk sem raiz. O limite de erro engolia, e o
 * botão parecia simplesmente não funcionar.
 *
 * Um componente chamado `CommandDialog` que não monta o `Command` é uma
 * armadilha com o nome trocado. Agora ele monta, transparente (`plain`), e
 * `commandProps` é a saída para o que a raiz precisa receber — o `filter`
 * próprio do `ds-search`, por exemplo.
 */
function CommandDialog({
  title = "Paleta de comandos",
  description = "Busque uma tela, uma ação ou um registro.",
  children,
  className,
  showCloseButton = false,
  commandProps,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  /** Classes da raiz `Command`, a pilha (não pinta). */
  className?: string
  showCloseButton?: boolean
  /** O que a raiz `Command` precisa receber: `filter`, `shouldFilter`, `loop`. */
  commandProps?: Omit<React.ComponentProps<typeof Command>, "children">
}) {
  return (
    <Dialog {...props}>
      <DialogPortal>
        <DialogOverlay />
        {/* **O `Content` é uma coluna que não pinta** (rodada 140): a placa é
            um filho, e a legenda de teclado (`dock`) é a irmã dela, embaixo.
            Ele deixou de ser o `DialogContent` porque ali a placa **é** o
            `Content` — vidro e `overflow-hidden` no mesmo nó —, e uma linha
            embaixo dela ou seria recortada, ou moraria dentro de um elemento
            com `backdrop-filter`, que é **raiz de fundo**: o borrão das
            cápsulas não enxergaria a página. Como irmãs, cada uma borra o que
            está atrás de si. A posição, a largura e a camada são as da base
            do `dialogContentVariants`. */}
        <DialogPrimitive.Content
          data-slot="command-dialog"
          className={cn(
            "fixed left-1/2 z-(--z-modal) flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col text-sm outline-none sm:max-w-md",
            // **Uma sombra só, atrás das três superfícies** — pílula, placa e
            // legenda ficam no mesmo plano, e o que se levanta da página é o
            // conjunto. Ela mora num `::before` da coluna, em `z` negativo sob
            // o contexto de empilhamento que o `fixed` + `z-index` já criam:
            // pinta abaixo das três. É `box-shadow` e não `filter:
            // drop-shadow`: um `filter` na coluna a tornaria **raiz de fundo**,
            // e o vidro das três deixaria de enxergar a página. E sombra externa
            // não pinta dentro da própria caixa, então os vãos de 8px entre as
            // peças continuam mostrando a página.
            "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:shadow-xl before:content-['']",
            // A posição precisa de conta própria. Centralizar pela altura
            // **real** fazia o campo de busca subir e descer sob o cursor a
            // cada tecla, conforme a lista encolhe. Aqui o topo é fixado onde a
            // placa **cheia** começaria — `50% - altura-máxima/2` —, e o que
            // encolhe é a borda de baixo, com a legenda descendo e subindo
            // junto. 24rem: a 512px a paleta ocupava metade de uma tela de 867.
            "[--command-dialog-h:min(60dvh,24rem)]",
            // **O topo centraliza a pilha cheia, e não só a placa** (rodada
            // 143). Com a lista no teto a pilha mede a placa mais 48 — a
            // pílula de 36 e os 12 de respiro, menos os 44 que o teto da lista
            // já desconta, mais os 12 e os 32 da legenda —, e centralizar só
            // a placa a deixava 24px abaixo do meio da tela. No toque a
            // legenda some (`pointer-coarse:hidden`) e a sobra cai para 4.
            // Com a busca encolhendo a lista, o topo fica onde está e só a
            // base sobe.
            "[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(12))]",
            "pointer-coarse:[--command-dialog-stack:calc(var(--command-dialog-h)+--spacing(1))]",
            "[--command-dialog-top:calc(50%-var(--command-dialog-stack)/2)]",
            "top-(--command-dialog-top)",
            // **A paleta abre na mola** (rodada 139): ela é algo que *aparece*,
            // e a casa põe a mola no que aparece. Desce 4px enquanto cresce de
            // 95%. O fechar fica curto e em `--ease-out`: uma mola até zero
            // passa por baixo de zero, a lição do `Collapsible`.
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring) data-open:slide-in-from-top-1",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:animation-duration-(--duration-fast) data-closed:ease-(--ease-out)"
          )}
        >
          {/* O nome acessível mora dentro do `Content`. Fora dele o elemento
              ficava no fluxo normal da página, e como `DialogHeader` embute
              `w-full` — que vence o `width: 1px` do `sr-only` —, ele empurrava
              o documento em 40px e criava rolagem horizontal a 320px. */}
          <DialogHeader className="sr-only">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <CommandBeamContext.Provider value>
          <Command
            // **A pilha** — pílula, placa e, se o consumidor puser um
            // `CommandDock` como último filho, a legenda. O desenho é da
            // variante `panel`; aqui fica só o que é do diálogo.
            //
            // A paleta abre **sem nada selecionado**. Vem antes do spread para
            // o consumidor poder voltar atrás por `commandProps`.
            variant="panel"
            autoSelectFirst={false}
            className={cn(
              "[&_[data-slot=command-list]]:max-h-none",
              "[&_[data-slot=command-list]]:min-h-0",
              // **O teto da lista, e a transição, são declarados pela casca**
              // — a casca publica a medida estrutural, a lista lê. O teto é o
              // da paleta menos 44 (a pílula de 36 e 8 de respiro). Com o
              // respiro em 12 a pilha cresce 4px, e a raiz aberta — camadas e
              // dois recentes — continua cabendo sem rolar: descontar 48 a
              // fazia rolar 4px, medido.
              "[--command-list-ceiling:calc(var(--command-dialog-h)_-_--spacing(11))]",
              // Só o diálogo anima a altura. O `Combobox` mora num popover que
              // se reposiciona quando o conteúdo muda de tamanho, e ali uma
              // altura em movimento faria o painel perseguir o gatilho.
              "[--command-list-transition:var(--duration-base)]",
              className
              // **Sem `flex-1`**: `flex: 1 1 0%` faz o `flex-basis: 0` vencer
              // qualquer `height`, e a altura derivada da lista — que é o que
              // anima — nunca chegaria ao layout.
            )}
            {...commandProps}
          >
            {children}
          </Command>
          </CommandBeamContext.Provider>
          {showCloseButton ? <DialogCloseButton /> : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

/**
 * A faixa de busca — vidro, e o campo com a mesma linguagem do cabeçalho.
 *
 * ## O campo é o mesmo do cabeçalho do catálogo
 *
 * `h-8` (o degrau `md`), `rounded-lg`, `border-border` e `bg-input-fill/30` —
 * as mesmas medidas do gatilho de busca que fica no alto da página. Quem abre
 * a paleta vem de clicar naquele campo; encontrar outro desenho do outro lado
 * do gesto quebra a continuidade.
 *
 * ## A superfície é uma só, e é a da casca
 *
 * O casco do `CommandDialog` veste a placa modal da régua — o mesmo `--popover`
 * translúcido com o material do iOS que o popover veste — e o `Command` de
 * dentro não pinta. É a regra "uma placa por superfície" de `lib/menu-classes`,
 * que nasceu de medir o Combobox mais claro que o DatePicker por causa de duas
 * placas empilhadas. O que fica desta seção é a lição de forma: **uma
 * superfície só**, declarada num lugar, para o tom não divergir entre as faixas.
 */
function CommandInput({
  className,
  value,
  onValueChange,
  leading,
  size: sizeProp,
  "aria-label": ariaLabel = "Buscar",
  ...props
}: Omit<React.ComponentProps<typeof CommandPrimitive.Input>, "size"> & {
  /** O que fica entre a lupa e o texto — o `CommandScope` da busca por camada. */
  leading?: React.ReactNode
  /**
   * `md` (32) é o gatilho do cabeçalho do catálogo; `lg` (36) é a pílula da
   * pilha, e é o padrão dentro dela. Foi 40 com o corpo `base` por uma rodada,
   * e o dono pediu menor nos dois. A faixa de dissolução acompanha (`data-size` no wrapper).
   */
  size?: "md" | "lg"
}) {
  const temTexto = value != null && String(value).length > 0
  const pilha = React.useContext(CommandStackContext)
  const naPilha = pilha !== null
  // Na paleta o campo nasce `lg` (36), a pílula que o dono escolheu; na
  // densidade de menu e solto, `md` (32).
  const size = sizeProp ?? (pilha === "palette" ? "lg" : "md")
  const noDialogo = React.useContext(CommandBeamContext)
  const comFeixe = naPilha && noDialogo
  // A busca vazia, lida do cmdk — vale com o campo controlado ou não. É ela que
  // liga o feixe da pílula: ele corre enquanto o campo espera a primeira tecla.
  const busca = useCommandState((estado) => estado.search)
  const esperando = (value != null ? String(value) : busca) === ""

  return (
    <div
      data-slot="command-input-wrapper"
      // `relative z-10` e o vidro próprio: a faixa deixa de ser irmã da lista
      // e passa a ficar **sobre** ela, do jeito que o `<header>` do catálogo
      // fica sobre a página. É o que faz o conteúdo rolar por trás do campo em
      // vez de parar embaixo dele.
      //
      // **Sem fio e sem tinta.** É o que o rodapé sempre foi, e pela mesma
      // razão: quem marca o limite é o conteúdo sumindo, não uma superfície
      // cobrindo. A primeira tentativa tirou só o fio e manteve o vidro, e o
      // resultado continuava lendo como duas faixas — porque **era**: a faixa
      // repintava a placa (`bg-popover/85`) sobre um casco que já a tinha, e
      // dois 85% empilhados dão 97,75%. No tema escuro `--popover` é mais claro
      // que a página, então a faixa era um retângulo **mais claro** com uma
      // aresta na base. É a mesma aritmética que tirou a placa do `Command`
      // hospedado: tinta sobre a casca é uma segunda superfície. O
      // `backdrop-blur` saiu junto, senão a borda do borrão desenharia a mesma
      // linha sozinha.
      //
      // O `relative z-10` fica: sem ele o campo não pintaria por cima da lista
      // que passa atrás dele.
      data-size={size}
      className={cn(
        "relative z-10 flex shrink-0 items-center",
        // No diálogo a pílula é solta, sem o recuo da faixa.
        !naPilha && "p-2"
      )}
    >
      {/* Anel de foco **fora** do diálogo. Na paleta (`CommandDialog`) o campo é
            autofocado ao abrir, o anel nasceria aceso e nunca apagaria, e quem
            carrega o foco visível é a linha selecionada — ali ele some. No
            `Command` solto e no `Combobox` quem chega por teclado precisa vê-lo. */}
        {/* Não veste `field-classes` de propósito: este campo imita o gatilho do
            cabeçalho do catálogo que o abriu — `border-border`, sem anel de foco
            — e não um campo de formulário. A decisão está registrada acima. */}
        <div
          data-waiting={(comFeixe && esperando) || undefined}
          className={cn(
            "flex w-full min-w-0 items-center",
            size === "lg" ? "h-9 gap-2.5 px-3.5 text-sm" : "h-8 gap-2 px-3 text-sm",
            naPilha
              ? // **No diálogo o campo é uma pílula de vidro solta** (rodada
                // 141), com as pontas de pílula do gatilho do cabeçalho: ele
                // saiu da placa e pinta a própria superfície, a mesma receita
                // flutuante da placa e das cápsulas da legenda. **Sem sombra, nas
                // três**: elas estão no mesmo plano, e sombra diria que uma flutua
                // sobre a outra — a pedido do dono. Sem anel de foco — o campo
                // nasce focado, e quem carrega o foco visível é a linha
                // selecionada.
                cn(
                  "rounded-full ring-1 ring-foreground/10",
                  menuPanelTintClassName,
                  // O feixe da borda de baixo (rodada 142), aceso por
                  // `data-waiting` — **só no diálogo** (rodada 143). Ver a
                  // utility em `globals.css`.
                  // A pílula veste a **mesma** tinta da placa da lista, em
                  // toda densidade: no `Combobox` ela chegou a levar o
                  // preenchimento de campo por cima, e o dono a quis igual ao
                  // fundo do dropdown (rodada 143).
                  comFeixe && "command-beam"
                )
              : "rounded-lg border border-border bg-input-fill/30 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/45"
          )}
        >
        <MagnifyingGlassIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground opacity-70"
        />
        {leading}
        <CommandPrimitive.Input
          data-slot="command-input"
          aria-label={ariaLabel}
          value={value}
          onValueChange={onValueChange}
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {onValueChange && temTexto ? (
          <Button
            type="button"
            variant="tertiary"
            size="icon-xs"
            aria-label="Limpar busca"
            className="-mr-1.5 shrink-0"
            onClick={(event) => {
              onValueChange("")
              // Limpar pelo × não dispara `input` no campo, e a raiz lê `onInput`
              // para voltar ao estado ocioso. O evento sai do botão, e não do
              // `<input>`, para não reentrar no `onChange` com o texto velho.
              event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }))
            }}
          >
            <XMarkIcon aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * O escopo da busca — o texto pintado antes do que se digita (rodada 139).
 *
 * É o destinatário de um e-mail depois de digitado: o nome e o ícone da camada
 * pintados em azul, **no mesmo corpo do campo**, como parte do texto. Foi
 * `Badge` por uma rodada, e o dono pediu esta forma.
 *
 * **Não há ×: quem tira o escopo é o Backspace, em dois toques.** Com o campo
 * vazio, o primeiro toque **arma** o escopo (`armed`) — o fundo acende, como
 * o destinatário selecionado antes de apagar —, e o segundo o remove. Quem
 * conta os toques é quem tem o estado; a peça só pinta. Enquanto armado, uma
 * região viva diz o que o próximo toque faz, porque o fundo sozinho não chega
 * ao leitor de tela.
 *
 * A tinta é **uma parada do arco-íris por escopo** (`tint`), a pedido do
 * dono: a marca como cor chapada de texto, fora das peças de marca — a
 * exceção está registrada no histórico. O recuo de 4px vive nos dois estados, compensado por margem
 * negativa, para acender o fundo não empurrar o texto.
 */
function CommandScope({
  icon,
  armed = false,
  tint,
  children,
  className,
  style,
  ...props
}: React.ComponentProps<"span"> & {
  icon?: React.ReactNode
  /** O primeiro Backspace com o campo vazio: o próximo remove o escopo. */
  armed?: boolean
  /** A cor do escopo, um `var(--brand-*)`. Violeta por padrão. */
  tint?: string
}) {
  return (
    <span
      data-slot="command-scope"
      data-armed={armed || undefined}
      style={tint ? ({ "--command-scope-tint": tint, ...style } as React.CSSProperties) : style}
      className={cn(
        // A cor vem de quem chama (`tint`, uma parada do arco-íris; violeta
        // por padrão). **No claro a luz é fixa em 0,47** e só matiz e croma
        // vêm da parada: as paradas claras (teal a 0,72) davam ~2:1 contra o
        // campo, e a 0,5 teal e azul ainda ficavam em 4,40 e 4,49. No escuro
        // todas passam cruas (pior caso, o violeta, 5,20).
        "[--command-scope-ink:oklch(from_var(--command-scope-tint,var(--brand-violet))_0.47_c_h)] dark:[--command-scope-ink:var(--command-scope-tint,var(--brand-violet))]",
        "-mx-1 inline-flex shrink-0 items-center gap-1 rounded-sm px-1 py-0.5 leading-tight font-semibold text-(--command-scope-ink)",
        "[&_svg:not([class*='size-'])]:size-4",
        "transition-colors duration-(--duration-base) ease-(--ease-out)",
        "data-armed:bg-(--command-scope-ink)/20",
        "animate-in fade-in-0 animation-duration-(--duration-base) ease-(--ease-out)",
        className
      )}
      {...props}
    >
      {icon}
      {children}
      <span aria-live="polite" className="sr-only">
        {armed
          ? `Apague de novo para sair de ${typeof children === "string" ? children : "o escopo"}.`
          : ""}
      </span>
    </span>
  )
}

/**
 * A lista — e a altura dela é **medida**, não deixada ao layout.
 *
 * ## A régua já existia, e ninguém a lia
 *
 * `Command.List` do cmdk renderiza um wrapper interno `[cmdk-list-sizer]` e
 * mantém um `ResizeObserver` sobre ele, publicando a altura do conteúdo em
 * **`--cmdk-list-height`** no próprio elemento da lista. É a API oficial para
 * animar altura, e nenhum arquivo deste projeto a lia — a paleta encolhia aos
 * saltos com a medida disponível ao lado. Medido antes: a borda de baixo do
 * diálogo ia de 626 a 584 a 478 em degraus instantâneos.
 *
 * ## Por que a conta soma as faixas de volta
 *
 * O projeto roda `box-sizing: border-box`, e esta lista carrega o `pt`/`pb` de
 * `scrollFadeBleedClassName` — o recuo que devolve o espaço das faixas depois de
 * o conteúdo subir para trás delas. `--cmdk-list-height` mede só o **conteúdo**,
 * então a altura da caixa precisa somar os dois recuos mais os 4px de folga que
 * cada um traz. Medido: sizer 144 → 236px, e a altura computada bateu.
 *
 * ## Quem decide o teto e a transição é a casca
 *
 * `--command-list-ceiling` cai no `--command-list-max-h` de sempre quando ninguém
 * diz nada, e `--command-list-transition` em `0s` — então **nada muda** para o
 * `Combobox` e para a paleta solta numa página. O `CommandDialog` sobrescreve as
 * duas. É a mesma divisão que este arquivo já usa para as faixas, e pela mesma
 * razão: só a casca enxerga as faixas como irmãs do rolável.
 *
 * ## A transição não vale na primeira pintura
 *
 * A variável do cmdk só existe depois de dois quadros — ele mede num
 * `ResizeObserver` e escreve dentro de um `requestAnimationFrame`. Sem a espera,
 * a lista nasceria no teto e **deslizaria** até o tamanho certo toda vez que a
 * paleta abrisse. É o mesmo problema que o `Tabs` resolve com `indicatorReady`, e
 * a espera aqui são dois `requestAnimationFrame` encadeados — o padrão que o
 * `ThemeToggle` já usa, e exatamente o tempo que a medida leva para chegar.
 */
function CommandList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const [medido, setMedido] = React.useState(false)

  React.useEffect(() => {
    let segundo: number | null = null
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => setMedido(true))
    })
    return () => {
      cancelAnimationFrame(primeiro)
      if (segundo !== null) cancelAnimationFrame(segundo)
    }
  }, [])

  const pilha = React.useContext(CommandStackContext)
  const naPilha = pilha !== null
  const naPaleta = pilha === "palette"
  // As setas só na pilha, que é a lista suspensa (a paleta e o `Combobox`):
  // é a placa dela o pai `relative` em que elas pousam.
  const fadeRef = useScrollFade({ arrows: naPilha })
  const lista = (
    <CommandPrimitive.List
      ref={fadeRef}
      data-slot="command-list"
      data-medido={medido || undefined}
      className={cn(
        "no-scrollbar overflow-x-hidden overflow-y-auto p-1 outline-none",
        // As linhas sobem ao aparecer — só onde a casca declara
        // `--command-reveal`; `0s` por padrão. Ver a utility em `globals.css`.
        "command-reveal",
        // A dissolução das duas pontas — âncoras, rampa, máscara e a folga de
        // rolagem. A casca só publica as alturas das faixas; o resto mora aqui,
        // no elemento que de fato rola.
        scrollFadeViewportClassName,
        // O conteúdo sobe para trás das faixas e devolve o mesmo tanto em
        // recuo: o primeiro item nasce abaixo do campo de busca, e o que rola
        // passa por baixo em vez de sumir numa borda. É isto que dá à rampa o
        // que dissolver.
        scrollFadeBleedClassName,
        // A lista só **lê** o teto; quem o declara é a casca. O seletor que
        // estava aqui (`in-data-[variant=dialog]`) apontava para uma variante
        // que deixou de existir quando `dialog` foi apagada — medido, a lista
        // caía para 288px dentro do diálogo em vez de 448. E variante por
        // seletor ainda perderia a disputa: o `in-*` do Tailwind compila com
        // `:where()`, que não soma especificidade.
        "max-h-(--command-list-max-h)",
        // **Os dois padrões moram no `var()`, e não numa declaração aqui.** Um
        // `[--command-list-ceiling:…]` neste elemento venceria o que o
        // `CommandDialog` declara no ancestral — declaração local ganha de
        // herdada, e a casca nunca conseguiria mandar. Com o fallback, quem não
        // diz nada fica no comportamento de sempre e quem diz é obedecido.
        //
        // A altura medida. O `_-_` do `calc()` não é cosmético: o Tailwind
        // normaliza espaço em torno de `+`, `*` e `/`, mas não pode com `-`, que
        // seria indistinguível de `--var`. (Aqui não há subtração, e os `_+_`
        // seguem a mesma grafia por consistência.)
        "h-[min(calc(var(--cmdk-list-height,var(--command-list-ceiling,var(--command-list-max-h)))_+_var(--scroll-fade-band-h)_+_var(--scroll-fade-foot-h)_+_--spacing(2)),var(--command-list-ceiling,var(--command-list-max-h)))]",
        // Só transiciona depois da primeira medida — ver o cabeçalho.
        "data-medido:transition-[height] data-medido:duration-[var(--command-list-transition,0s)] data-medido:ease-(--ease-out)",
        // Na pilha a placa recua 8px dos lados, e não 4: a linha acesa alinha
        // com as bordas da pílula de busca acima dela.
        naPaleta && "px-2",
        className
      )}
      {...props}
    >
      {naPaleta ? (
        // O respiro de cima e de baixo da placa mora **dentro** do conteúdo
        // medido, e não no recuo da lista: o cmdk mede o conteúdo
        // (`--cmdk-list-height`), e a altura da lista soma só os recuos que
        // ela conhece. Um `py` na lista a faria rolar 12px sem precisar.
        <div data-slot="command-list-body" className="py-1.5">
          {children}
        </div>
      ) : (
        children
      )}
    </CommandPrimitive.List>
  )

  if (!naPilha) return lista

  // **No diálogo a lista mora numa placa própria** (rodada 141), porque o campo
  // saiu dela. A placa é um embrulho, e não a lista: a lista é o elemento
  // mascarado da dissolução, e a máscara recortaria fundo, anel e sombra junto.
  // A faixa do topo zera aqui — ela existia para o conteúdo passar por baixo do
  // campo, e agora não há nada por cima. Declarada no embrulho, ela vence o
  // valor que a raiz publica sem disputar os seletores `has-[…]` de lá.
  return (
    <div
      data-slot="command-dialog-panel"
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10 [--scroll-fade-band-h:0px]",
        menuPanelTintClassName
      )}
    >
      {lista}
      <ScrollFadeArrows />
    </div>
  )
}

/**
 * O vazio.
 *
 * `text-muted-foreground` entrou porque faltava: a mensagem saía no peso cheio
 * do texto, competindo com os comandos que ela diz não existirem. E o eixo em
 * coluna existe porque o `ds-search` escrevia `flex flex-col items-center
 * gap-3 py-10` à mão para caber um título e uma dica — um vazio de paleta
 * costuma ter as duas coisas.
 */
function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        // Sem `gap`: título sobre descrição é o mesmo dado em duas linhas, e
        // quem os separa é a entrelinha. O `gap-3` que estava aqui afastava os
        // dois como se fossem blocos diferentes.
        "flex flex-col items-center px-6 text-center text-sm text-muted-foreground",
        // O recuo próprio é curto porque a lista já reserva 52px em cima e
        // 40px embaixo para as faixas — quando elas existem; zero quando não —,
        // e somar `py-10` empurrava o bloco para fora do centro óptico.
        "py-6",
        // A ação **é** outra coisa, e por isso ganha respiro. É a mesma regra
        // ao contrário: gap entre coisas diferentes, entrelinha entre as
        // linhas do mesmo dado.
        "[&_button]:mt-4",
        // O vazio só monta quando a contagem zera, então sobe ao nascer.
        "animate-in fade-in-0 slide-in-from-bottom-1 animation-duration-(--duration-base) ease-(--ease-out)",
        className
      )}
      {...props}
    />
  )
}

/** A linha forte do vazio: o que não foi encontrado. */
function CommandEmptyTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <P
      data-slot="command-empty-title"
      className={cn("font-medium text-balance", className)}
      {...props}
    />
  )
}

/** A saída: o que a pessoa pode tentar em vez disso. */
function CommandEmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Caption
      data-slot="command-empty-description"
      className={cn("max-w-xs text-balance", className)}
      {...props}
    />
  )
}

/**
 * O estado de busca assíncrona.
 *
 * O cmdk sempre teve `Command.Loading` e o projeto nunca o expôs — então uma
 * paleta que consulta o servidor não tinha como dizer que está consultando, e
 * a lista vazia se passava por "nada encontrado" enquanto o dado vinha.
 */
function CommandLoading({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Loading>) {
  return (
    <CommandPrimitive.Loading
      data-slot="command-loading"
      className={cn(
        "flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </CommandPrimitive.Loading>
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  const naPaleta = React.useContext(CommandStackContext) === "palette"
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        // O recuo do cabeçalho acompanha o do item (`px-1.5`), e não `px-2`: com o
        // item na régua dos menus, os 8px do cabeçalho deixavam o texto do grupo
        // 2px à direita do texto das linhas que ele encima. E `p-0` no grupo
        // porque a casca já recua — dois `p-1` empilhados punham o item a 8px da
        // borda enquanto o estado vazio ficava a 4px.
        "overflow-hidden p-0 text-foreground **:[[cmdk-group-heading]]:px-1.5 **:[[cmdk-group-heading]]:text-2xs **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:tracking-wider **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:text-muted-foreground",
        // **O cabeçalho deixou de ser um item apagado.** Ele era `text-xs
        // font-medium` — o mesmo peso das linhas, um degrau menor e mais
        // claro, que é a receita de "linha desabilitada" e não de rótulo.
        // Caixa alta com `tracking-wider` é a régua `labels="caps"` do
        // `TableHead` — a mesma que 3 mini-tabelas de folha já escreviam à
        // mão: nenhum item jamais se parece com isso, então o olho separa os
        // grupos antes de ler as palavras.
        // **O respiro do cabeçalho é assimétrico, e é o que o faz pertencer à
        // lista abaixo dele.** Com `py-1` nos dois lados ele ficava equidistante
        // dos dois grupos e lia como mais uma linha apagada — o que ficou óbvio
        // quando as descrições saíram da busca do catálogo e todo item virou uma
        // linha só. É a mesma conta do par de identidade, um degrau acima.
        "**:[[cmdk-group-heading]]:pt-1 **:[[cmdk-group-heading]]:pb-0.5",
        // **A folga entre grupos é margem no grupo, não recuo no cabeçalho.**
        // Duas propriedades diferentes não disputam; um `pt` base mais um `pt`
        // sob variante seriam a mesma propriedade duas vezes, decidida por ordem
        // de emissão do Tailwind e não pelo que se escreveu.
        //
        // **O primeiro grupo visível não recebe a folga**, e o irmão geral (`~`)
        // é o que torna isso robusto: o cmdk esconde os grupos sem resultado com
        // o atributo `hidden` **sem os tirar do DOM**, então eles ficam no meio
        // da fileira. Medido buscando "card": `Átomos` sai escondido entre
        // `Fundações` e `Moléculas`, e um seletor de adjacência (`+`) perderia o
        // segundo grupo visível. `~` casa quem tem **algum** grupo visível
        // antes, que é a pergunta certa.
        "[[cmdk-group]:not([hidden])~&]:mt-2.5",
        // Na pilha as linhas são de 36, e o respiro cresce junto: 16px entre
        // grupos e 6px entre o rótulo e a primeira linha (os 2 do rótulo mais
        // 4 aqui). Margem, pela mesma razão da folga entre grupos.
        naPaleta && "[[cmdk-group]:not([hidden])~&]:mt-4 [&>[cmdk-group-items]]:mt-1",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn(menuSeparatorClassName, className)}
      {...props}
    />
  )
}

/**
 * A linha da paleta.
 *
 * ## O tique que nunca acendia
 *
 * Esta linha renderizava um `CheckIcon` fixo, escondido por `opacity-0` e
 * revelado por `group-data-[checked=true]`. **O cmdk não emite
 * `data-checked`** — medido no DOM: os atributos de um item são `data-slot`,
 * `data-disabled`, `data-selected` e `data-value`, e mais nenhum. O ícone
 * portanto nunca aparecia, em nenhum estado.
 *
 * E ele não era só inerte: no `Combobox`, que desenha o **próprio** check para
 * marcar o valor ativo, cada linha saía com **dois ícones** — um funcionando
 * e um permanentemente invisível. Quem marca seleção aqui é quem sabe o que
 * está selecionado, e isso não é a paleta.
 *
 * ## O corpo é o dos menus
 *
 * A geometria vem de `menuItemGeometryClassName`: o `Command` é a quarta
 * superfície de comandos do projeto, e era a única fora da régua — `rounded-sm
 * px-2 py-1.5 gap-2` contra `rounded-md px-1.5 py-1 gap-1.5`, e sem alvo de
 * toque. O que **não** vem de lá são os estados, porque o cmdk os escreve
 * diferente: a linha ativa é `data-selected` e não `:focus`, e
 * `data-disabled="false"` fica sempre presente no elemento — a regra por
 * presença dos menus apagaria toda linha.
 */
function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const naPaleta = React.useContext(CommandStackContext) === "palette"
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item",
        menuItemGeometryClassName,
        // O acender dos menus — ver `menuItemFadeClassName`.
        menuItemFadeClassName,
        "data-selected:bg-accent data-selected:text-accent-foreground data-selected:*:[svg]:text-accent-foreground",
        // `=true` e não por presença: ver o comentário acima.
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        // Na pilha a linha tem 36, e não os 28 dos menus: a paleta é um
        // destino de busca, lida uma linha por vez, e não uma lista de ações.
        naPaleta && "min-h-9",
        className
      )}
      {...props}
    />
  )
}

/**
 * A pilha de texto de uma linha de duas linhas.
 *
 * O `ds-search` escrevia `<span className="flex min-w-0 flex-col">` com nome e
 * descrição dentro — e é o formato natural de uma paleta, onde o rótulo
 * sozinho raramente basta para escolher. Segue a gramática que o `Item` do
 * projeto já usa: `Content`, `Title`, `Description`.
 */
function CommandItemContent({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-content"
      // Sem `gap`: nome sobre descrição é o mesmo dado em duas linhas, e quem
      // os separa é a entrelinha.
      className={cn("flex min-w-0 flex-col", className)}
      {...props}
    />
  )
}

function CommandItemTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-title"
      className={cn("truncate font-medium", className)}
      {...props}
    />
  )
}

function CommandItemDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-description"
      className={cn(
        "truncate text-xs text-muted-foreground group-data-selected/command-item:text-accent-foreground/80",
        className
      )}
      {...props}
    />
  )
}

/**
 * O ícone da linha, numa caixa de 24 (rodada 143).
 *
 * A caixa é o que alinha o nome da linha na mesma coluna em qualquer grupo —
 * com ícone de camada, relógio de recente ou nada. O ícone fica cinza e acende
 * com a linha selecionada; ele mora dentro da caixa, então quem o tinge é o
 * `group`, e não a regra de filho direto do `CommandItem`.
 */
function CommandItemIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-icon"
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-(--duration-base) ease-(--ease-out) group-data-selected/command-item:text-accent-foreground",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * O lado direito da linha: uma contagem, uma descrição, a seta (rodada 143).
 * Empurrado para a ponta, com 16px de folga do nome, e cortando antes de
 * encostar nele.
 */
function CommandItemMeta({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-item-meta"
      className={cn("ml-auto flex min-w-0 items-center gap-2 pl-4", className)}
      {...props}
    />
  )
}

/**
 * A seta de "ir" (rodada 143): só aparece na linha selecionada, e entra na
 * diagonal em que aponta. Ela é o que diz que Enter **leva** a algum lugar.
 */
function CommandItemArrow({
  className,
  ...props
}: React.ComponentProps<typeof ArrowUpRightIcon>) {
  return (
    <ArrowUpRightIcon
      data-slot="command-item-arrow"
      aria-hidden
      className={cn(
        "ml-auto size-4 shrink-0 -translate-x-0.5 translate-y-0.5 opacity-0 transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out) group-data-selected/command-item:translate-x-0 group-data-selected/command-item:translate-y-0 group-data-selected/command-item:opacity-100",
        className
      )}
      {...props}
    />
  )
}

/**
 * A legenda de teclado da pilha — fora da placa, embaixo dela
 * (rodada 140).
 *
 * É o padrão novo do iOS: em vez de uma faixa dentro da caixa, cada dica é uma
 * **cápsula de vidro solta**, e a linha as distribui como o rodapé distribuía
 * — navegar à esquerda, abrir e fechar à direita. Mora como irmã da placa, e
 * não dentro dela, porque um ancestral com `backdrop-filter` é raiz de fundo:
 * ali o borrão das cápsulas não enxergaria a página.
 *
 * **São legendas, não botões**, por decisão do dono: nada acontece ao clicar,
 * e no toque (`pointer-coarse`) a linha some, porque lá não há teclado. Entra
 * um instante depois da placa, na mesma mola. Ela é o último filho da pilha,
 * em qualquer `Command variant="panel"`.
 */
function CommandDock({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-dock"
      className={cn(
        "flex items-center justify-between gap-2 pointer-coarse:hidden",
        "animate-in fade-in-0 slide-in-from-top-2 animation-duration-(--duration-spring) ease-(--ease-spring) [animation-delay:80ms] fill-mode-both",
        className
      )}
      {...props}
    />
  )
}

/** Uma cápsula da legenda: a tecla e o que ela faz, no vidro dos menus. */
function CommandDockItem({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-dock-item"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground ring-1 ring-foreground/10",
        menuPanelTintClassName,
        // As teclas sem a pastilha, a pedido do dono: dentro de uma cápsula a
        // pastilha era uma caixa dentro de outra caixa. A tecla fica só o
        // glifo, no recuo da cápsula. O seletor de descendente (0,2,0) vence
        // o `bg-*` e o `dark:bg-*` do `Kbd` sem `!important`.
        "[&_[data-slot=kbd]]:min-w-0 [&_[data-slot=kbd]]:bg-transparent [&_[data-slot=kbd]]:px-0",
        className
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  commandVariants,
  CommandDialog,
  CommandDock,
  CommandDockItem,
  CommandEmpty,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemContent,
  CommandItemArrow,
  CommandItemDescription,
  CommandItemIcon,
  CommandItemMeta,
  CommandItemTitle,
  CommandList,
  CommandLoading,
  CommandScope,
  CommandSeparator,
  CommandShortcut,
}
