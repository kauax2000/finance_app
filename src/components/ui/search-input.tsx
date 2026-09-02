"use client"

import * as React from "react"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * O campo de busca do projeto.
 *
 * **Ele existe porque a regra já existia e não tinha casa.** O `AGENTS.md`
 * registra que `type="search"` traz um × desenhado pelo WebKit — azul do
 * sistema, medida do sistema, sem conhecer o tema escuro nem a escada de
 * controles — e que o desenho tem de ser suprimido e substituído por um botão
 * nosso. E diz, com estas palavras, que *"vale para qualquer campo de busca do
 * app"*.
 *
 * Medido: o `FormPickerPopoverSearch` acerta sozinho, e as **três** buscas de
 * `transactions-filters-panel.tsx` (linhas 418, 538 e 772) erram — `<Input
 * type="search">` cru, com o × do navegador aparecendo. Quatro usos, três
 * violações: regra sem dono é regra que se reimplementa ou se esquece.
 *
 * A semântica de busca **fica**: é ela que dá a tecla "Buscar" no teclado do
 * iOS, e o `role="searchbox"` que o leitor de tela anuncia. O que sai é só o
 * desenho.
 *
 * **O botão de limpar só aparece quando há texto**, e só quando quem chama
 * passa `onClear` — sem ele não há botão, porque um × que não limpa nada é pior
 * que nenhum.
 *
 * **`className` dimensiona o campo, e não o texto dentro dele.** Ele vai para a
 * superfície — o `InputGroup` —, porque é ela que desenha a borda e ancora os
 * addons. Medido na primeira versão, em que ia para o `<input>`: um
 * `max-w-xs` encolhia só a área de digitação e deixava a moldura com a largura
 * toda, com o botão de limpar **354px** à direita do texto. Para o caso raro de
 * mexer no `<input>` existe `inputClassName`.
 */
function SearchInput({
  className,
  inputClassName,
  size = "md",
  type = "search",
  placeholder = "Buscar…",
  autoComplete = "off",
  onClear,
  clearLabel = "Limpar busca",
  ...props
}: React.ComponentProps<typeof InputGroupInput> & {
  size?: React.ComponentProps<typeof InputGroup>["size"]
  /** Mostra o botão de limpar quando há texto. Sem ele, não há botão. */
  onClear?: () => void
  clearLabel?: string
  /** Para o `<input>` de dentro. `className` dimensiona o campo inteiro. */
  inputClassName?: string
}) {
  const temTexto = props.value != null && String(props.value).length > 0

  return (
    <InputGroup size={size} data-slot="search-input" className={className}>
      <InputGroupAddon>
        <MagnifyingGlassIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cn(
          // O × do navegador sai; o nosso entra logo abaixo.
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          inputClassName
        )}
        {...props}
      />
      {onClear && temTexto ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label={clearLabel} onClick={onClear}>
            <XMarkIcon aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

export { SearchInput }
