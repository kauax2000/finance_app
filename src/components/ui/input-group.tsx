"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/**
 * O grupo é um controle, então ele fala a escada do projeto.
 *
 * A altura era `h-8` cravada, com um comentário jurando 36px e citando um
 * `Button default` que não existe mais. Enquanto `Input`, `SelectTrigger`,
 * `NativeSelect` e `ComboboxTrigger` diziam `sm | md | lg | xl`, o grupo só
 * sabia uma altura — e um grupo ao lado de um campo `lg` não tinha como
 * alinhar sem alguém escrever `h-9` por fora.
 */
type InputGroupSize = "sm" | "md" | "lg" | "xl"

/**
 * O tamanho desce pelo contexto porque três peças precisam concordar sobre ele:
 * a moldura dá a altura, o controle interno dá o corpo do texto e o botão
 * acoplado desce um degrau. Passar `size` em cada uma à mão é como as três
 * divergem.
 */
type InputGroupContextValue = {
  size: InputGroupSize
  /**
   * O `id` do controle de dentro, gerado pelo grupo.
   *
   * Existe para o addon poder ser um `<label>` de verdade. Antes ele era um
   * `<div>` com `onClick` chamando `focus()` — comportamento certo no elemento
   * errado: um `<div>` clicável não recebe foco nem responde ao Enter, e o
   * auditor marcava a linha. Com `htmlFor`, quem foca o campo é o navegador, e
   * o texto do addon passa a nomear o campo em vez de ficar mudo para o leitor
   * de tela.
   */
  controlId: string
}

const InputGroupContext = React.createContext<InputGroupContextValue>({
  size: "md",
  controlId: "",
})

const inputGroupSizes: Record<InputGroupSize, string> = {
  sm: "h-7",
  md: "h-8",
  lg: "h-9",
  xl: "h-10",
}

function InputGroup({
  className,
  size = "md",
  children,
  ...props
}: React.ComponentProps<"div"> & { size?: InputGroupSize }) {
  const controlId = React.useId()

  return (
    <div
      data-slot="input-group"
      data-size={size}
      role="group"
      className={cn(
        "group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-input bg-input-fill/30 transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input-fill/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/70 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:has-disabled:bg-input-fill/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        inputGroupSizes[size],
        className
      )}
      {...props}
    >
      <InputGroupContext.Provider value={{ size, controlId }}>
        {children}
      </InputGroupContext.Provider>
    </div>
  )
}

const inputGroupAddonVariants = cva(
  // Sem `group-data-[disabled=true]/input-group:opacity-50`: nada nunca marcou
  // `data-disabled` no grupo, e o apagamento do estado desligado já vem do
  // `has-disabled:opacity-50` da moldura.
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        // A margem negativa é compensação óptica: o botão e o `kbd` já trazem
        // padding próprio, e sem ela a folga até a borda do grupo lê como o
        // dobro da do lado do ícone. Era `-0.3rem` e `-0.15rem`, dois valores
        // fora da escala por 0,8px e 0,4px — abaixo do que o olho separa, e
        // acima do que o auditor tolera.
        "inline-start":
          "order-first pl-2 has-[>button]:-ml-1 has-[>kbd]:-ml-0.5",
        "inline-end":
          "order-last pr-2 has-[>button]:-mr-1 has-[>kbd]:-mr-0.5",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"label"> & VariantProps<typeof inputGroupAddonVariants>) {
  const { controlId } = React.useContext(InputGroupContext)

  return (
    <label
      // Um `<label>`, e não um `<div>` com `onClick`. O comportamento sempre
      // foi de rótulo — clicar foca o campo —, e num `<label htmlFor>` quem faz
      // isso é o navegador: sem JavaScript, com o texto do addon nomeando o
      // campo, e sem a linha que o auditor marcava como `<div onClick>`.
      //
      // Sem `role="group"`. O addon é o rótulo de um controle, não uma região:
      // um grupo sem nome acessível dentro de outro grupo só acrescenta uma
      // fronteira que o leitor de tela anuncia e ninguém pediu — eram cinco
      // deles na página do catálogo.
      htmlFor={controlId}
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        // Um botão dentro do rótulo: o clique é dele, e sem isto o `<label>`
        // roubaria o foco para o campo no mesmo gesto.
        if ((e.target as HTMLElement).closest("button")) {
          e.preventDefault()
        }
      }}
      {...props}
    />
  )
}

type InputGroupButtonSize = "xs" | "sm" | "icon-xs" | "icon-sm"

/**
 * Um degrau abaixo do grupo, e sempre um degrau que o `Button` conhece.
 *
 * Ele reimplementava a escada em vez de usá-la: as classes vinham de um `cva`
 * local, o `size` ia para um `data-size` decorativo e nunca chegava ao
 * `Button`. Duas consequências. O `icon-sm` daqui media 32px contra os 28 do
 * `Button` — o mesmo nome para duas alturas, que é justamente o que a escada
 * existe para impedir. E `sm` era string vazia: pedir `size="sm"` não fazia
 * absolutamente nada.
 *
 * O degrau agora vem do grupo, porque a regra é do sistema e não da tela:
 * `xs` (24) dentro de um grupo de 28 ou 32, `sm` (28) dentro de um de 36 ou 40.
 * `xs` e `icon-xs` existem para morar dentro de outro controle, e é aqui.
 */
const inputGroupButtonSteps: Record<InputGroupSize, InputGroupButtonSize> = {
  sm: "xs",
  md: "xs",
  lg: "sm",
  xl: "sm",
}

function InputGroupButton({
  className,
  type = "button",
  variant = "tertiary",
  size,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> & {
  size?: InputGroupButtonSize
}) {
  const { size: groupSize } = React.useContext(InputGroupContext)
  const resolved = size ?? inputGroupButtonSteps[groupSize]

  return (
    <Button
      type={type}
      variant={variant}
      size={resolved}
      className={cn("shadow-none", className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const { size, controlId } = React.useContext(InputGroupContext)

  return (
    <Input
      // O `id` do grupo é o padrão; quem já tem um continua com o seu.
      id={props.id ?? controlId}
      data-slot="input-group-control"
      // O degrau chega ao campo para o corpo do texto acompanhar a altura —
      // `sm` desce para `text-control-sm` como em qualquer outro campo.
      size={size}
      className={cn(
        // `h-auto` mais `self-stretch`: a altura é da moldura, e o campo a
        // preenche. Com a altura própria do `Input` valendo, um grupo `lg`
        // deixava uma faixa de 1px em cima e embaixo fora da área de clique.
        "h-auto flex-1 self-stretch rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  const { controlId } = React.useContext(InputGroupContext)

  return (
    <Textarea
      // Mesmo contrato do campo de uma linha: o addon de bloco embaixo de um
      // textarea é o `<label>` deste controle.
      id={props.id ?? controlId}
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
