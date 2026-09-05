"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { Muted } from "@/components/ui/typography"
import {
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  fieldTriggerHoverClassName,
  fieldTriggerSizeClassName,
} from "@/lib/field-classes"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  scrollFadeBandsClassName,
  scrollFadeBleedClassName,
  scrollFadeViewportClassName,
} from "@/lib/scroll-fade-classes"
import { useScrollFade } from "@/hooks/use-scroll-fade"

/**
 * O seletor ancorado num campo — e agora também o que vai dentro dele.
 *
 * ## O que faltava
 *
 * Este arquivo resolvia a **casca**: largura do gatilho, folga de colisão,
 * altura limitada, foco que não pula. Só que o conteúdo é sempre a mesma coisa,
 * e as três telas que o usam escreviam a mesma anatomia à mão:
 *
 * | Faixa | Grafia repetida | Vezes |
 * | --- | --- | --- |
 * | Busca | `shrink-0 border-b border-border/50 p-3 pb-2` mais lupa `absolute` | 2 |
 * | Lista | `formPickerListScrollClassName` + `onWheel` que para a propagação | 3 |
 * | Rodapé | `shrink-0 border-t border-border/50 bg-muted/25 p-2` | 3 |
 *
 * (Os dois fios e a tinta do rodapé saíram desde então: as faixas não pintam
 * nem aparam, e quem marca o limite é o conteúdo dissolvendo por baixo delas.)
 * | Ação do rodapé | `Button tertiary xl w-full text-xs asChild` com um `Link` | 3 |
 * | Gatilho | `Button outline xl w-full justify-between px-3 …` mais chevron | 3 |
 * | Raiz | `modal={isMobile}` | 3 |
 *
 * São as três faixas que o `Card` chama de `CardToolbar` / corpo / `CardFooter`
 * e o `Dialog` chama de `DialogHeader` / `DialogBody` / `DialogFooter`. A
 * gramática do projeto já existia; só este componente não a falava.
 *
 * ## O foco voltou a voltar
 *
 * `onCloseAutoFocus` vinha com `preventDefault()` incondicional. Com o mouse
 * isso não aparece — o foco nunca saiu do gatilho. Mas o campo de busca vive
 * **dentro** do popover, então o caminho de teclado é o caminho normal, e ali
 * fechar deixava o foco no `<body>`: medido, tanto ao escolher um item quanto
 * no Esc. Quem usa teclado perdia o lugar no formulário.
 *
 * A justificativa era evitar o salto de rolagem. Ela vale para **abrir**, e não
 * para fechar: o Radix devolve o foco com `element.focus({ preventScroll:
 * true })` (`@radix-ui/react-focus-scope`), então o `preventDefault` não
 * comprava nada e custava a volta do foco. Abrir continua sem roubar o foco —
 * ali a razão é real, e é o teclado do telefone.
 */

/**
 * As classes da região rolável, ainda exportadas.
 *
 * `FormPickerPopoverList` é o destino: a string não consegue carregar o
 * `onWheel` que as três telas escrevem ao lado dela toda vez, e uma classe
 * solta é um componente que não foi declarado. Ela sobrevive porque as três
 * telas ainda a importam, e migrá-las é uma mudança à parte.
 */
export const formPickerListScrollClassName =
  "min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-1 [-webkit-overflow-scrolling:touch]"

/**
 * A raiz — e ela é quem sabe do telefone.
 *
 * `modal` no telefone tranca a rolagem do documento enquanto o seletor está
 * aberto. Sem isso, rolar a lista arrasta a folha que a contém, e o dedo não
 * distingue as duas. As três telas tomavam essa decisão por conta própria, com
 * a mesma resposta; quem a toma agora é o componente.
 */
function FormPickerPopover({
  modal,
  ...props
}: React.ComponentProps<typeof Popover>) {
  const isMobile = useIsMobile()

  return (
    <Popover
      data-slot="form-picker-popover"
      modal={modal ?? isMobile}
      {...props}
    />
  )
}

/**
 * O gatilho **é o campo** — e agora ele veste a superfície de campo, em vez de
 * parecê-la.
 *
 * A versão anterior era `Button variant="outline" size="xl"`, e a nota aqui
 * dizia que ele "parece um campo e não um botão". Parecia só sob `dark:`: no
 * tema claro `outline` é `border-border` + `bg-background` **opaco**, enquanto
 * `Input` e `SelectTrigger` são `border-input` + `bg-input-fill/30`
 * translúcido. É a mesma medição que tirou o `Combobox` do `Button` na rodada
 * 06 — e este era o outro gatilho que faltava converger.
 *
 * A altura não muda: `xl` (40) é a que ele já tinha. A conversão é de
 * **superfície**, não de medida.
 */
function FormPickerPopoverTrigger({
  className,
  children,
  size = "xl",
  ...props
}: Omit<React.ComponentProps<"button">, "size"> & {
  size?: "sm" | "md" | "lg" | "xl"
}) {
  return (
    <PopoverTrigger
      data-slot="form-picker-popover-trigger"
      data-size={size}
      type="button"
      className={cn(
        fieldSurfaceClassName,
        fieldFocusRingClassName,
        fieldInvalidClassName,
        fieldDisabledClassName,
        fieldTriggerHoverClassName,
        fieldTriggerSizeClassName,
        "group/picker-trigger flex w-full min-w-0 items-center justify-between gap-2 px-3 text-left font-normal",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">{children}</span>
      {/* O grupo é nomeado, e não `in-*`. O `data-state` mora no próprio
          gatilho, então o filho precisa de um seletor de grupo — e `in-*`
          casaria com **qualquer** ancestral que carregue `data-state`, além de
          compilar com `:where()`. Antes isto lia `group-data-open/button`, que
          era o grupo do `Button`: sem o `Button`, o grupo deixa de existir. */}
      <ChevronDownIcon
        aria-hidden
        className="shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-data-[state=open]/picker-trigger:rotate-180"
      />
    </PopoverTrigger>
  )
}

/**
 * O texto de quando não há escolha. Existe porque `text-muted-foreground` solto
 * num `<span>` é a grafia que diverge — e porque o vazio de um seletor não é
 * um valor, é a ausência dele.
 */
function FormPickerPopoverPlaceholder({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="form-picker-popover-placeholder"
      className={cn("truncate text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormPickerPopoverContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  return (
    <PopoverContent
      data-slot="form-picker-popover-content"
      side="bottom"
      align="start"
      sideOffset={6}
      // Abrir não rouba o foco: num seletor ancorado a um campo, isso fecharia
      // o teclado do telefone e faria a folha inteira saltar. **Fechar** devolve
      // o foco ao gatilho, que é o padrão do Radix e o que o teclado precisa.
      onOpenAutoFocus={(e) => {
        e.preventDefault()
        onOpenAutoFocus?.(e)
      }}
      padding="none"
      className={cn(
        "flex min-h-0 w-(--radix-popover-trigger-width) max-w-88 flex-col overflow-hidden",
        // A casca publica a altura das duas faixas, porque só ela as enxerga
        // como **irmãs** da lista. As duas são condicionais à presença da faixa
        // — sem ela, a zona daquele lado vale zero e a dissolução acontece na
        // borda do próprio rolável.
        //
        // **Medidas: 53,2 e 49,4.** Elas não caem na escala de espaçamento, e
        // por isso ficam no degrau **abaixo** (52 e 48) em vez do acima.
        // Superestimar põe a borda opaca depois do fim da faixa, e sobra uma
        // tira de conteúdo chapado logo abaixo dela; subestimar só antecipa a
        // dissolução em pouco mais de um pixel, ainda dentro da faixa. Errar
        // para baixo é invisível, errar para cima não.
        scrollFadeBandsClassName,
        "has-[[data-slot=form-picker-popover-search]]:[--scroll-fade-band-h:--spacing(13)]",
        "has-[[data-slot=form-picker-popover-footer]]:[--scroll-fade-foot-h:--spacing(12)]",
        className
      )}
      {...props}
    >
      {children}
    </PopoverContent>
  )
}

/**
 * A faixa de busca.
 *
 * Sobre `InputGroup`, não sobre uma lupa `absolute` mais `pl-9`: o addon é um
 * `<label>` de verdade ligado ao campo, então tocar no ícone foca o campo e o
 * leitor de tela para de encontrar um ícone mudo antes do controle.
 *
 * O `data-slot` não é enfeite — é por ele que o `CustomForm` sabe que o Enter
 * aqui não é "salvar". Ver `shouldDeferEnterToWidget` em `form.tsx`.
 */
function FormPickerPopoverSearch({
  className,
  size = "lg",
  placeholder = "Buscar…",
  onClear,
  ...props
}: React.ComponentProps<typeof InputGroupInput> & {
  size?: React.ComponentProps<typeof InputGroup>["size"]
  /** Mostra o botão de limpar quando há texto. Sem ele, não há botão. */
  onClear?: () => void
}) {
  const temTexto = props.value != null && String(props.value).length > 0

  return (
    <div
      data-slot="form-picker-popover-search"
      // **Sem fio.** Quem marca o limite é o conteúdo dissolvendo por baixo, e
      // não uma aresta. O `relative z-10` é o que põe a faixa sobre a lista, em
      // vez de ao lado dela: o conteúdo passa por trás.
      className="relative z-10 shrink-0 p-3 pb-2"
    >
      <InputGroup size={size}>
        <InputGroupAddon>
          <MagnifyingGlassIcon aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          autoComplete="off"
          placeholder={placeholder}
          className={cn(
            // O × que o WebKit desenha sozinho em `type="search"` é chrome do
            // navegador: azul do sistema, medida do sistema, e ele não conhece
            // o tema escuro nem a escada de controles. A semântica de busca
            // fica — é ela que dá a tecla "Buscar" no teclado do iOS —, mas o
            // desenho é nosso, logo abaixo.
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
            className
          )}
          {...props}
        />
        {onClear && temTexto ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Limpar busca" onClick={onClear}>
              <XMarkIcon aria-hidden />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </div>
  )
}

/**
 * A região que rola.
 *
 * O `onWheel` que para a propagação vem junto: as três telas o escrevem ao lado
 * da classe toda vez, porque sem ele a roda do mouse atravessa a lista e rola a
 * página atrás quando a lista chega ao fim.
 */
function FormPickerPopoverList({
  className,
  onWheel,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      ref={useScrollFade()}
      data-slot="form-picker-popover-list"
      className={cn(
        formPickerListScrollClassName,
        // As duas pontas dissolvem, e o conteúdo passa **por trás** das faixas
        // em vez de parar numa borda — é isso que dá à rampa o que dissolver.
        //
        // A dissolução vai aqui e não na constante `formPickerListScrollClassName`
        // de propósito: as telas importam a constante, e uma delas com máscara
        // ligada mas sem a casca publicando `band-h` ganharia meio tratamento —
        // um fade começando 1px abaixo do fio escrito à mão, que são os dois
        // sinais que o sistema está tentando não ter juntos.
        scrollFadeViewportClassName,
        scrollFadeBleedClassName,
        className
      )}
      onWheel={(e) => {
        e.stopPropagation()
        onWheel?.(e)
      }}
      {...props}
    />
  )
}

/**
 * A lista vazia.
 *
 * Três telas escrevem esta mensagem à mão, em duas grafias — `px-1 py-6
 * text-center` nos dois seletores de categoria e `py-4 text-center` no de
 * cartão —, e a demonstração deste catálogo tinha inventado uma terceira. O
 * texto continua sendo de quem chama, porque "nenhuma categoria encontrada" e
 * "nenhum cartão cadastrado nesta carteira" dizem coisas diferentes: uma é
 * busca sem resultado, a outra é ausência de dado. O que não varia é o respiro
 * e a tinta.
 */
function FormPickerPopoverEmpty({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <Muted
      data-slot="form-picker-popover-empty"
      className={cn("px-3 py-6 text-center text-balance", className)}
      {...props}
    />
  )
}

/**
 * Uma linha da lista — o `Button` do sistema, e não um `<button>` cru.
 *
 * `min-h-11` são os 44px de alvo — este é um seletor de toque antes de ser
 * qualquer outra coisa —, e por isso a altura não é um degrau da escada: o
 * `data-size` sai, como no `CalendarDayButton`. O realce tem o par `active:`,
 * porque no telefone `hover:` não existe: as linhas escritas à mão nas telas
 * acendiam no cursor e não respondiam ao dedo, que é a regra **H** do auditor.
 *
 * **O conteúdo vai num `<span>` próprio, e isso é carga estrutural.** O `Button`
 * embrulha texto cru para aplicar a maiúscula inicial do CTA — e um nome de
 * categoria não é um CTA: "iFood" tem de sair "iFood". Com o `<span>` como
 * único filho direto, nunca há texto cru para embrulhar, e a regra não alcança.
 */
function FormPickerPopoverItem({
  className,
  selected = false,
  children,
  ...props
}: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <Button
      type="button"
      variant="tertiary"
      size="md"
      data-slot="form-picker-popover-item"
      data-size={undefined}
      aria-pressed={selected}
      data-selected={selected || undefined}
      className={cn(
        "h-auto min-h-11 w-full justify-start px-3 py-2 text-left font-normal whitespace-normal",
        "hover:bg-muted/60 active:bg-muted/60",
        selected && "bg-muted font-medium text-foreground",
        className
      )}
      {...props}
    >
      <span
        data-slot="form-picker-popover-item-content"
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {children}
      </span>
    </Button>
  )
}

/**
 * O pé — onde mora a saída para gerenciar o que a lista mostra ("Gerenciar
 * categorias", "Cadastrar cartão").
 */
function FormPickerPopoverFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-picker-popover-footer"
      className={cn(
        // **Sem fio e sem tinta.** O `bg-muted/25` fazia do rodapé uma
        // superfície diferente da lista, e o degrau de tom na emenda é o mesmo
        // "bloco aceso" que a paleta de comandos registrou ao tentar pintar o
        // pé dela. Quem separa agora é a dissolução do conteúdo.
        "relative z-10 shrink-0 p-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A ação do pé. Sempre a mesma forma nas três telas, sempre um `Link` dentro —
 * então `asChild` vem de fábrica e quem chama passa só o destino.
 *
 * **Ela preenche (`secondary`), e não é contradição com a escada.** O degrau
 * mais quieto conta com uma moldura em volta para se distinguir do fundo, e o
 * rodapé perdeu a dele quando o fio e a tinta saíram: um `tertiary` ali fica
 * indistinguível de uma linha da lista até o cursor chegar — que é o problema
 * que a dissolução não resolve, porque ela separa por gradiente e não por
 * peso. O cinza preenchido devolve a borda que a faixa não desenha mais. E não
 * disputa com o `primary` da tela: ele mora no rodapé do formulário, não aqui.
 */
function FormPickerPopoverFooterAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="form-picker-popover-footer-action"
      type="button"
      variant="secondary"
      size="lg"
      asChild
      className={cn("w-full", className)}
      {...props}
    />
  )
}

export {
  FormPickerPopover,
  FormPickerPopoverEmpty,
  FormPickerPopoverContent,
  FormPickerPopoverFooter,
  FormPickerPopoverFooterAction,
  FormPickerPopoverItem,
  FormPickerPopoverList,
  FormPickerPopoverPlaceholder,
  FormPickerPopoverSearch,
  FormPickerPopoverTrigger,
}
