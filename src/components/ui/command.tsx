"use client"

import * as React from "react"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid"
import { cva, type VariantProps } from "class-variance-authority"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  menuItemGeometryClassName,
  menuSeparatorClassName,
} from "@/lib/menu-classes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
 * `bare` é o padrão porque é o caso do `Combobox`, o único consumidor de
 * produto: ali uma segunda borda dentro do anel do popover desenharia duas
 * linhas a 1px de distância.
 *
 * `inline` saiu do tipo. Não é renomeação cosmética — o nome dizia *onde* e não
 * *o quê*, e era por isso que ele não respondia sobre a borda.
 */
const commandVariants = cva(
  [
    "flex size-full flex-col overflow-hidden bg-popover/85 text-popover-foreground backdrop-blur",
    "[--command-list-max-h:--spacing(72)]",
    // A altura da faixa de busca, para a lista saber quanto recuar:
    // campo (32) + recuo (16) + o fio (1).
    "[--command-band-h:calc(--spacing(8)+--spacing(4)+1px)]",
    // A altura do rodapé. Ela é bem maior que o texto que carrega, de
    // propósito: a metade de cima é a distância que o conteúdo tem para se
    // dissolver, e dissolução curta lê como corte.
    // Sem rolagem o rodapé é só a linha do texto; com rolagem ele ganha a zona
    // onde o conteúdo se dissolve. É a regra que o `ScrollFade` já enuncia: o
    // gradiente aparece só do lado em que ainda há conteúdo. Sem isso, um
    // painel de dois itens exibia 44px de vazio entre a última linha e a
    // legenda — medido.
    //
    // As duas vão em **variável**, e não em classe sob variante: variável
    // herda e não disputa especificidade.
    "[--command-footer-h:--spacing(9)] [--command-footer-mask:none]",
    "data-[scrollable=true]:[--command-footer-h:--spacing(18)]",
    "data-[scrollable=true]:[--command-footer-mask:var(--command-footer-ramp)]",
    // Onde a legenda mora: daqui para baixo o conteúdo já sumiu por completo.
    "[--command-footer-text-h:--spacing(7)]",
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
        bare: "[border-radius:inherit]",
        /** A própria moldura, para a paleta solta numa página. */
        panel: "rounded-lg border border-border shadow-xs",
      },
    },
    defaultVariants: { variant: "bare" },
  }
)

function Command({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> &
  VariantProps<typeof commandVariants>) {
  const resolvida = variant ?? "bare"

  return (
    <CommandPrimitive
      data-slot="command"
      data-variant={resolvida}
      // A rampa da máscara do rodapé, curvada. Ela vive aqui e não numa classe
      // por duas razões: sete paradas com um `calc()` em cada uma viram uma
      // string ilegível, e uma classe montada em tempo de execução nunca
      // chegaria ao CSS — o Tailwind varre o código como texto.
      style={
        {
          // A rampa desce 1 → 0,12, e o piso **não** é zero. Duas versões
          // erraram para os lados opostos: em `transparent` o conteúdo
          // desaparecia inteiro e a última linha ganhava uma borda de
          // extinção — era isso que lia como fade forte; em 0,26 ele
          // continuava legível e disputava com a legenda. Em 0,12 a lista lê
          // como se seguisse por baixo, sem reivindicar leitura.
          //
          // Numa máscara o valor não é cor: só o canal alfa conta, e o preto é
          // o estêncil de "opaco".
          "--command-footer-ramp": [
            "linear-gradient(to bottom",
            "#000 0",
            "#000 calc(100% - var(--command-footer-h))",
            "rgb(0 0 0 / 0.88) calc(100% - var(--command-footer-h) + 16px)",
            "rgb(0 0 0 / 0.66) calc(100% - var(--command-footer-h) + 30px)",
            "rgb(0 0 0 / 0.42) calc(100% - var(--command-footer-h) + 42px)",
            "rgb(0 0 0 / 0.24) calc(100% - var(--command-footer-h) + 54px)",
            "rgb(0 0 0 / 0.12) 100%)",
          ].join(", "),
          ...props.style,
        } as React.CSSProperties
      }
      className={cn(commandVariants({ variant: resolvida }), className)}
      {...props}
    />
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
 * armadilha com o nome trocado. Agora ele monta, já em `variant="dialog"`, e
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
  className?: string
  showCloseButton?: boolean
  /** O que a raiz `Command` precisa receber: `filter`, `shouldFilter`, `loop`. */
  commandProps?: Omit<React.ComponentProps<typeof Command>, "children">
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          // `rounded-xl` não se repete: é o padrão de todo `DialogContent`.
          //
          // A posição, sim, precisa de conta própria. O casco centraliza pela
          // altura **real** (`top-1/2` com `-translate-y-1/2`), e numa paleta
          // isso faz o campo de busca subir e descer sob o cursor a cada tecla,
          // conforme a lista encolhe. Aqui o topo é fixado onde a caixa
          // **cheia** começaria — `50% - altura-máxima/2` —, e o que encolhe é
          // a borda de baixo. O `top-1/3` do shadcn resolvia o mesmo sintoma
          // chutando um terço; esta conta acerta o centro de verdade.
          // 24rem, e não 32: a 512px a paleta ocupava metade de uma tela de 867 e
          // a lista mostrava mais itens do que se lê de uma vez. O teto anterior
          // — antes de o casco ganhar altura própria — dava 374px no total, e
          // este fica na mesma vizinhança com um valor da escala.
          "[--command-dialog-h:min(60dvh,24rem)]",
          "[--command-dialog-top:calc(50%-var(--command-dialog-h)/2)]",
          "top-(--command-dialog-top) translate-y-0 max-h-(--command-dialog-h)",
          "overflow-hidden border-0 bg-transparent p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {/* O nome acessível mora dentro do `DialogContent`. Fora dele o
            elemento ficava no fluxo normal da página, e como `DialogHeader`
            embute `w-full` — que vence o `width: 1px` do `sr-only` —, ele
            empurrava o documento em 40px e criava rolagem horizontal a 320px. */}
        {/* `hideSeparator` porque o cabeçalho aqui é só o nome acessível: um
            fio embaixo de um bloco invisível é decoração sem dono — e, num
            casco `p-0`, ele ainda sangrava 24px para fora de cada lado. */}
        <DialogHeader className="sr-only" hideSeparator>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command
          // No diálogo o teto é do **casco**, não da lista: com um teto próprio
          // a lista somava 448 aos 48 da busca e aos 37 do rodapé, dava 533
          // contra os 512 do casco, e o `overflow-hidden` **cortava o rodapé** —
          // medido. Aqui a coluna recebe o mesmo teto do casco e a lista passa
          // a ocupar só o que sobra entre as duas faixas.
          //
          // O seletor de descendente, e não uma classe na lista: a lista solta
          // numa página não tem altura definida acima dela, e ali `flex-1`
          // colapsaria o conteúdo.
          className={cn(
            "max-h-(--command-dialog-h)",
            "[&_[data-slot=command-list]]:max-h-none",
            "[&_[data-slot=command-list]]:min-h-0",
            "[&_[data-slot=command-list]]:flex-1"
          )}
          {...commandProps}
        >
          {children}
        </Command>
      </DialogContent>
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
 * ## O vidro é o do cabeçalho, e ele precisa de algo atrás
 *
 * `bg-background/85` com `backdrop-blur`, igual ao `<header>` do catálogo.
 * Vidro só desenha quando há o que borrar: por isso o casco do `CommandDialog`
 * ficou transparente e a lista carrega a superfície. Sem isso o efeito seria
 * decoração — um `backdrop-filter` sobre uma cor opaca não faz nada.
 */
function CommandInput({
  className,
  value,
  onValueChange,
  "aria-label": ariaLabel = "Buscar",
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const temTexto = value != null && String(value).length > 0

  return (
    <div
      data-slot="command-input-wrapper"
      // `relative z-10` e o vidro próprio: a faixa deixa de ser irmã da lista
      // e passa a ficar **sobre** ela, do jeito que o `<header>` do catálogo
      // fica sobre a página. É o que faz o conteúdo rolar por trás do campo em
      // vez de parar embaixo dele.
      className="relative z-10 flex shrink-0 items-center border-b border-border bg-popover/85 p-2 backdrop-blur"
    >
      {/* Sem anel de foco, e é decisão e não esquecimento: o campo é
            autofocado quando a paleta abre, então o anel nasceria aceso e
            nunca apagaria — indicador que está sempre ligado não indica nada.
            Numa paleta quem carrega o foco visível é a **linha selecionada**,
            que se move com as setas; o anel aqui competia com ela. */}
        <div className="flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-input-fill/30 px-3">
        <MagnifyingGlassIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground opacity-70"
        />
        <CommandPrimitive.Input
          data-slot="command-input"
          aria-label={ariaLabel}
          value={value}
          onValueChange={onValueChange}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
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
            onClick={() => onValueChange("")}
          >
            <XMarkIcon aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Marca na casca se há ou não o que rolar.
 *
 * A decisão precisa chegar ao **rodapé**, que é irmão da lista e não seu
 * descendente — por isso o atributo sobe até `[data-slot="command"]`, de onde
 * as duas variáveis (altura e máscara) descem por herança. Escrever no
 * ancestral é o que evita um contexto do React para transportar um booleano.
 */
function useMarcaRolagem() {
  return React.useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const casca = el.closest<HTMLElement>('[data-slot="command"]')
    if (!casca) return

    const sincronizar = () => {
      // 1px de folga: alturas fracionárias nunca fecham a conta exatamente —
      // a mesma tolerância que o `ScrollFade` usa.
      casca.dataset.scrollable = String(el.scrollHeight > el.clientHeight + 1)
    }
    sincronizar()

    const ro = new ResizeObserver(sincronizar)
    ro.observe(el)
    // O conteúdo muda a cada tecla, e o tamanho da lista não: quem cresce e
    // encolhe é o filho que o cmdk mede.
    const sizer = el.firstElementChild
    if (sizer) ro.observe(sizer)
    return () => ro.disconnect()
  }, [])
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const marcarRolagem = useMarcaRolagem()

  return (
    <CommandPrimitive.List
      ref={marcarRolagem}
      data-slot="command-list"
      className={cn(
        // `max-h-72` era cravado: numa paleta em diálogo ela é a janela, e 288px
        // desperdiçava metade da tela. O teto agora depende do contexto, e o
        // `in-data-[variant=dialog]` lê a variante que a raiz carimba.
        "no-scrollbar overflow-x-hidden overflow-y-auto p-1 outline-none",
        // A folga de rolagem tem que conhecer a faixa que cobre o topo. O
        // `scroll-py-1` de antes dava 4px, e o `scrollIntoView` do cmdk
        // encostava o primeiro item no topo **real** da lista — ou seja, atrás
        // do campo de busca. Subir ao primeiro item com a seta o escondia.
        "scroll-pt-[calc(var(--command-band-h)+--spacing(1))]",
        "scroll-pb-[calc(var(--command-footer-h)+--spacing(1))]",
        // Sobe para trás da faixa e devolve o mesmo tanto em recuo: o primeiro
        // item nasce abaixo dela, e o que rola passa por baixo em vez de sumir
        // numa borda.
        "-mt-(--command-band-h) pt-[calc(var(--command-band-h)+--spacing(1))]",
        // O mesmo por baixo: a lista passa sob o rodapé em vez de terminar
        // numa borda, e é isso que dá ao gradiente o que dissolver.
        "-mb-(--command-footer-h) pb-[calc(var(--command-footer-h)+--spacing(1))]",
        // A máscara é o fade. Ela some com o conteúdo antes de ele alcançar a
        // legenda, sem acrescentar cor nenhuma — por isso o rodapé deixa de
        // parecer um bloco. As paradas são curvadas pelo mesmo motivo que as do
        // gradiente eram: alfa linear deixa duas quinas visíveis.
        "[mask-image:var(--command-footer-mask)] [-webkit-mask-image:var(--command-footer-mask)]",
        // A lista só **lê** o teto; quem o declara é a casca. O seletor que
        // estava aqui (`in-data-[variant=dialog]`) apontava para uma variante
        // que deixou de existir quando `dialog` foi apagada — medido, a lista
        // caía para 288px dentro do diálogo em vez de 448. E variante por
        // seletor ainda perderia a disputa: o `in-*` do Tailwind compila com
        // `:where()`, que não soma especificidade.
        "max-h-(--command-list-max-h)",
        className
      )}
      {...props}
    />
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
        // O recuo próprio é curto porque a lista já reserva 53px em cima e
        // 76px embaixo para as faixas — somar `py-10` empurrava o bloco para
        // fora do centro óptico.
        "py-6",
        // A ação **é** outra coisa, e por isso ganha respiro. É a mesma regra
        // ao contrário: gap entre coisas diferentes, entrelinha entre as
        // linhas do mesmo dado.
        "[&_button]:mt-4",
        className
      )}
      {...props}
    />
  )
}

/** A linha forte do vazio: o que não foi encontrado. */
function CommandEmptyTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="command-empty-title"
      className={cn("text-sm font-medium text-balance text-foreground", className)}
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
    <p
      data-slot="command-empty-description"
      className={cn("max-w-xs text-xs text-balance text-muted-foreground", className)}
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
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        // O recuo do cabeçalho acompanha o do item (`px-1.5`), e não `px-2`: com o
        // item na régua dos menus, os 8px do cabeçalho deixavam o texto do grupo
        // 2px à direita do texto das linhas que ele encima. E `p-0` no grupo
        // porque a casca já recua — dois `p-1` empilhados punham o item a 8px da
        // borda enquanto o estado vazio ficava a 4px.
        "overflow-hidden p-0 text-foreground **:[[cmdk-group-heading]]:px-1.5 **:[[cmdk-group-heading]]:py-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
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
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item",
        menuItemGeometryClassName,
        "data-selected:bg-accent data-selected:text-accent-foreground data-selected:*:[svg]:text-accent-foreground",
        // `=true` e não por presença: ver o comentário acima.
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
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
 * O rodapé da paleta — a terceira faixa.
 *
 * É onde vive o que a lista não pode ensinar: as teclas que navegam, o que o
 * Enter faz, o escopo da busca. Numa paleta isso não é enfeite — ela é uma
 * interface de teclado, e sem a legenda a pessoa descobre `↑↓` e `↵` por
 * tentativa. Sangra até as bordas e traz o próprio fio, como o `CardFooter` e
 * o `DialogFooter`.
 *
 * Tinta mais quieta que a lista, porque não é uma das opções.
 */
function CommandFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command-footer"
      className={cn(
        // **Fade, e não vidro.** A faixa de cima se separa por um fio porque ela
        // é um controle e precisa de limite. O rodapé é legenda: ele não
        // começa, ele **termina** — o conteúdo se dissolve nele e a paleta
        // acaba. Um fio ali desenharia uma terceira divisão numa caixa que já
        // tem duas.
        //
        // O gradiente vai a `popover` cheio embaixo, e não a `popover/85`: é a
        // borda inferior da paleta, onde não há nada ao lado para comparar, e
        // parar em 85% deixaria a lista aparecendo através do fim.
        //
        // `pointer-events-none` pelo mesmo motivo que o `ScrollFade` o usa: a
        // faixa cobre itens roláveis, e não pode comer o clique deles.
        // **Sem fundo.** Pintar um gradiente aqui foi a versão anterior, e ela
        // não tinha como integrar: o gradiente terminava em `--popover` cheio
        // enquanto a superfície em volta é `popover/85`, e 100% sobre uma
        // página escura é mais **claro** que 85% — o rodapé lia como um bloco
        // aceso. Nenhuma tinta por cima resolve isso, porque qualquer alfa
        // somado à casca aumenta a opacidade.
        //
        // Quem desaparece agora é o **conteúdo**: a lista leva uma máscara que
        // apaga os últimos pixels dela. A superfície continua uniforme de ponta
        // a ponta, e a legenda fica sobre a mesma cor de todo o resto.
        "pointer-events-none relative z-10 flex shrink-0 items-end justify-between gap-3 px-3 pb-2 text-xs text-muted-foreground",
        "h-(--command-footer-h)",
        className
      )}
      {...props}
    />
  )
}

/**
 * Uma dica do rodapé: a tecla e o que ela faz.
 *
 * O `Kbd` fica de fora de propósito — quem chama escolhe entre desenhar a
 * tecla e escrever o nome dela, e a paleta não decide isso pela tela.
 */
function CommandHint({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-hint"
      className={cn("inline-flex items-center gap-1.5", className)}
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
  CommandEmpty,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandFooter,
  CommandGroup,
  CommandHint,
  CommandInput,
  CommandItem,
  CommandItemContent,
  CommandItemDescription,
  CommandItemTitle,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
}
