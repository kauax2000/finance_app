"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
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
 * A folga até a borda da janela. Maior que o padrão do `PopoverContent` porque
 * este popover tem a largura do campo — ou seja, é largo, e encostar na borda
 * numa tela estreita é o caso comum, não o extremo.
 */
const formPickerCollisionPadding = {
  top: 16,
  bottom: 16,
  left: 12,
  right: 12,
} as const

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
 * O gatilho **é o campo** — por isso ele parece um campo e não um botão: mesma
 * altura da escada (`xl`, 40), peso normal, texto à esquerda e o valor
 * truncando em vez de empurrar o chevron para fora.
 */
function FormPickerPopoverTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <PopoverTrigger asChild>
      <Button
        data-slot="form-picker-popover-trigger"
        type="button"
        variant="outline"
        size="xl"
        className={cn(
          "w-full justify-between px-3 text-left text-sm font-normal",
          className
        )}
        {...props}
      >
        <span className="flex min-w-0 items-center gap-2">{children}</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-data-open/button:rotate-180"
        />
      </Button>
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
      collisionPadding={formPickerCollisionPadding}
      sticky="partial"
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
      className="shrink-0 border-b border-border/50 p-3 pb-2"
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
      data-slot="form-picker-popover-list"
      className={cn(formPickerListScrollClassName, className)}
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
    <p
      data-slot="form-picker-popover-empty"
      className={cn(
        "px-3 py-6 text-center text-sm text-balance text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * Uma linha da lista.
 *
 * `min-h-11` são os 44px de alvo — este é um seletor de toque antes de ser
 * qualquer outra coisa. E o realce tem o par `active:`, porque no telefone
 * `hover:` não existe: as linhas escritas à mão nas telas acendiam no cursor e
 * não respondiam ao dedo, que é a regra **H** do auditor.
 */
function FormPickerPopoverItem({
  className,
  selected = false,
  ...props
}: React.ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      data-slot="form-picker-popover-item"
      type="button"
      aria-pressed={selected}
      data-selected={selected || undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/70",
        selected
          ? "bg-muted font-medium text-foreground"
          : "hover:bg-muted/60 active:bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

/**
 * O pé — onde mora a saída para gerenciar o que a lista mostra ("Gerenciar
 * categorias", "Cadastrar cartão"). Tinta mais quieta que a lista, porque não é
 * uma das opções.
 */
function FormPickerPopoverFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-picker-popover-footer"
      className={cn(
        "shrink-0 border-t border-border/50 bg-muted/25 p-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A ação do pé. Sempre a mesma forma nas três telas, sempre um `Link` dentro —
 * então `asChild` vem de fábrica e quem chama passa só o destino.
 */
function FormPickerPopoverFooterAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="form-picker-popover-footer-action"
      type="button"
      variant="tertiary"
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
