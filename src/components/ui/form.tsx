"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CustomFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: React.FormEventHandler<HTMLFormElement>
}

/**
 * Onde o Enter **não** é sequestrado, e por quê.
 *
 * Esta lista é a fonte: a página `/designsystem/formularios` a importa em vez
 * de redigitá-la. Ela era uma cópia à mão, e já tinha divergido — a página
 * mostrava 6 regras enquanto o código checava 7, e a que faltava era
 * justamente a do seletor ancorado, que é a lição mais geral do arquivo.
 * Documentação que duplica um dado sempre atrasa; a que o lê, não.
 */
export const ENTER_DEFERRAL_RULES = [
  { match: "<textarea>", why: "o Enter quebra linha" },
  { match: "<select> nativo", why: "o Enter escolhe a opção" },
  { match: "contenteditable", why: "o Enter quebra linha" },
  {
    match: '[data-slot="select-trigger"]',
    why: "o Enter abre o Select do Radix",
  },
  {
    match: '[data-slot="form-picker-popover-search"]',
    why: "a lista já filtra a cada tecla — ali o Enter não é nada",
  },
  { match: 'role="combobox"', why: "o Enter confirma o item destacado" },
  { match: 'role="listbox"', why: "o Enter confirma o item destacado" },
] as const

/**
 * Exportada para poder ser testada. Enquanto era privada, as 7 regras acima
 * eram uma promessa sem asserção — e não existia `form.test.ts`.
 */
export function shouldDeferEnterToWidget(target: HTMLElement): boolean {
  if (
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  ) {
    return true
  }
  if (target.closest('[data-slot="select-trigger"]')) {
    return true
  }
  // A busca de um seletor ancorado num campo. Ela **não** está dentro do
  // `<form>` no DOM — o popover é portalizado —, mas eventos de portal do React
  // sobem pela árvore do **React**, e a raiz do seletor é filha deste
  // formulário. Medido: sem esta regra, o Enter enquanto se busca uma categoria
  // salvava a transação. Ali o Enter não é "salvar" nem é nada: a lista já
  // filtra a cada tecla.
  if (target.closest('[data-slot="form-picker-popover-search"]')) {
    return true
  }
  const role = target.getAttribute("role")
  if (role === "combobox" || role === "listbox") {
    return true
  }
  if (target.closest('[role="combobox"]') || target.closest('[role="listbox"]')) {
    return true
  }
  return false
}

/**
 * Enquanto uma tecla morta está compondo um caractere, o Enter **confirma o
 * candidato** — ele pertence ao editor de método de entrada, não ao
 * formulário. Sem esta guarda, digitar `ç` ou `ã` num teclado que compõe
 * enviava o formulário no meio da palavra.
 *
 * `isComposing` não aparecia em lugar nenhum deste repositório. O `keyCode
 * 229` é o mesmo fato pela porta antiga, para os navegadores que não publicam
 * a propriedade.
 */
function isComposing(e: React.KeyboardEvent): boolean {
  return e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229
}

function submitFrom(form: HTMLFormElement) {
  let submitButton = form.querySelector(
    'button[type="submit"]:not(:disabled)'
  ) as HTMLButtonElement | null
  // O botão pode viver fora do `<form>` — num `DialogFooter` ou num cabeçalho
  // fixo de folha —, ligado pelo atributo `form`.
  if (!submitButton && form.id) {
    submitButton = document.querySelector(
      `button[type="submit"][form="${CSS.escape(form.id)}"]:not(:disabled)`
    ) as HTMLButtonElement | null
  }
  submitButton?.click()
}

const CustomForm = React.forwardRef<HTMLFormElement, CustomFormProps>(
  ({ className, onSubmit, onKeyDown, children, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isComposing(e)) {
        // `⌘/Ctrl + Enter` envia **de dentro** do controle que ficaria com a
        // tecla. É a saída para o textarea, que defere o Enter e por isso não
        // tinha nenhuma forma de enviar sem tirar a mão do teclado.
        const forced = e.metaKey || e.ctrlKey
        if (forced || !shouldDeferEnterToWidget(e.target as HTMLElement)) {
          e.preventDefault()
          submitFrom(e.currentTarget)
        }
      }
      onKeyDown?.(e)
    }

    return (
      <form
        ref={ref}
        data-slot="form"
        className={cn(className)}
        onSubmit={onSubmit}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </form>
    )
  }
)
CustomForm.displayName = "CustomForm"

export { CustomForm }
