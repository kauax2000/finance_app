"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
  type FieldSize,
} from "@/components/ui/field"
import {
  Input,
  type InputBaseProps,
  type InputMoneyProps,
} from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { P } from "@/components/ui/typography"

/**
 * O formulário do projeto — o `<form>`, a política do Enter e as peças.
 *
 * **Ele era um átomo, e a pergunta que o mudou foi "um formulário não é feito
 * de um input e um botão?".** Era, no modelo; não era, neste arquivo — havia só
 * o `<form>` e o `onKeyDown`, e os 46 botões de enviar do app eram escritos à
 * mão, um por um, cada um com o próprio nome de booleano (`saving`, `loading`,
 * `submitting`, `busy`) e a própria grafia de reticência em "Salvando…". Agora
 * ele compõe os átomos, e é uma molécula.
 *
 * ## O que cada peça resolve, com a contagem que a pediu
 *
 * - `FormInput` / `FormTextarea` — **104 campos escritos à mão** em 27 arquivos,
 *   cinco dialetos de espaçamento, e `Field` com **zero** consumidores fora do
 *   catálogo. A ligação (`htmlFor`, `aria-describedby`, `aria-invalid`) é do
 *   `Field`; o que faltava era uma forma curta de pedi-la.
 * - `FormSubmit` — os 46 botões, e o *pending* em **76 strings**. Aqui ele é um
 *   prop: desabilita, marca `aria-busy`, mostra o `Spinner` e troca o rótulo.
 * - `FormCancel` — **173 `variant="outline"`** no app, contra a hierarquia que o
 *   `AGENTS.md` documenta (sair sem fazer nada é `tertiary`). A peça a embute.
 * - `FormActions variant="sticky"` — o `MobileSheetFormFooter` que o backlog
 *   pedia: o chrome de folha cobria cabeçalho e corpo, e cinco arquivos
 *   derivavam a classe do rodapé à mão, com três `!important`.
 * - `FormError` — **três contratos de acessibilidade** para a mesma coisa.
 *
 * ## O `id`, e até onde ele chega
 *
 * `Form` gera um `id` com `useId` e o publica em contexto; `FormSubmit` escreve
 * `form={id}` sempre. Dentro do `<form>` isso é inócuo — o `submitFrom` acha o
 * botão na primeira busca. **Fora dele é o que faz o Enter funcionar**: um
 * `DialogFooter` é portalizado, e contexto do React atravessa portal.
 *
 * O que ele **não** atravessa é *slot irmão*: quando o rodapé é renderizado por
 * outro componente ao lado do formulário — o `footer=` do assistente de
 * categorias —, não há contexto a herdar, e ali `form={UM_ID}` explícito
 * continua sendo a resposta.
 */

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

type FormContextValue = { id: string; pending: boolean }

const FormContext = React.createContext<FormContextValue | null>(null)

/**
 * O ritmo entre os campos.
 *
 * `stack` lê `--space-block`, o token de 16px que o `PageSection` usa entre
 * blocos — o formulário não inventa um respiro próprio. `inline` é o formulário
 * de busca do Frost, campo e botão na mesma linha (`items-end` alinha o botão
 * pela base do campo, e não pela do rótulo). `none` é o que o `CustomForm`
 * sempre foi: sem layout, porque as 54 chamadas do app trazem o próprio `gap`.
 */
const formVariants = cva("", {
  variants: {
    layout: {
      stack: "flex flex-col gap-(--space-block)",
      inline: "flex items-end gap-2",
      none: "",
    },
  },
  defaultVariants: { layout: "stack" },
})

export interface FormProps
  extends React.FormHTMLAttributes<HTMLFormElement>,
    VariantProps<typeof formVariants> {
  onSubmit?: React.FormEventHandler<HTMLFormElement>
  /** Enviando. Desce por contexto: desabilita o cancelar e ocupa o enviar. */
  pending?: boolean
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    { className, id, layout, pending = false, onSubmit, onKeyDown, children, ...props },
    ref
  ) => {
    const reactId = React.useId()
    const formId = id ?? reactId
    const contexto = React.useMemo(
      () => ({ id: formId, pending }),
      [formId, pending]
    )

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
      <FormContext.Provider value={contexto}>
        <form
          ref={ref}
          id={formId}
          data-slot="form"
          data-layout={layout ?? "stack"}
          data-pending={pending || undefined}
          className={cn(formVariants({ layout }), className)}
          onSubmit={onSubmit}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    )
  }
)
Form.displayName = "Form"

/**
 * O nome antigo, e ele continua válido: `Form` sem layout.
 *
 * São 54 chamadas em 29 arquivos, todas trazendo o próprio `gap` — trocá-las
 * pelo nome novo sem trocar o conteúdo seria diff sem ganho. Elas migram quando
 * a tela migrar os campos e os botões, que é a rodada seguinte.
 */
export type CustomFormProps = Omit<FormProps, "layout">

const CustomForm = React.forwardRef<HTMLFormElement, CustomFormProps>(
  (props, ref) => <Form ref={ref} layout="none" {...props} />
)
CustomForm.displayName = "CustomForm"

/** O que a peça de campo acrescenta ao controle que ela embrulha. */
type FormFieldOwnProps = {
  label: React.ReactNode
  /** A ajuda. Condicional de propósito: `FieldDescription` se registra mesmo vazia. */
  description?: React.ReactNode
  /** A mensagem. Renderizá-la é o que torna o campo inválido — o `Field` percebe. */
  error?: React.ReactNode
  /** Marca o campo como opcional. A convenção do app é marcar o opcional, não o obrigatório. */
  optional?: boolean
  /**
   * O degrau do **andaime** — rótulo, ajuda e erro. Não é a altura do controle,
   * que é o `size` do `Input`: `field.tsx` proíbe ancorar um no outro, porque um
   * `Field` não sabe que controle carrega. Sem valor, herda do `FieldGroup`.
   */
  fieldSize?: FieldSize
  fieldClassName?: string
}

/**
 * A ordem aqui é o contrato: `FieldControl` compõe o `aria-describedby` na
 * ordem em que os irmãos se registram — descrição, depois erro.
 */
function FormField({
  label,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  children,
}: FormFieldOwnProps & { children: React.ReactNode }) {
  return (
    <Field size={fieldSize} className={fieldClassName}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <FieldControl>{children}</FieldControl>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  )
}

/**
 * A união do `Input` distribuída **à mão**, e é obrigatório que seja assim.
 *
 * `FormFieldOwnProps & React.ComponentProps<typeof Input>` é uma **interseção**
 * com a união aninhada dentro. Desestruturar o rest de uma interseção assim
 * colapsa os dois ramos num objeto só — `money?: boolean` —, e o objeto
 * colapsado não é atribuível a nenhum dos ramos: `<Input {...props} />` deixa
 * de compilar, com a mensagem apontando para `Type 'true' is not assignable to
 * type 'false'`. Escrita como união de topo, cada ramo mantém o próprio `money`
 * literal, o rest vira uma união, e o spread volta a fechar.
 *
 * O mesmo colapso é o que fixa `InputGroupInput` e `SidebarInput` no ramo base:
 * lá ele ainda comeria `onChange`, `type` e `defaultValue`.
 */
type FormInputProps =
  | (FormFieldOwnProps & InputBaseProps & React.RefAttributes<HTMLInputElement>)
  | (FormFieldOwnProps &
      InputMoneyProps &
      React.RefAttributes<HTMLInputElement>)

function FormInput({
  label,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  ...props
}: FormInputProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      optional={optional}
      fieldSize={fieldSize}
      fieldClassName={fieldClassName}
    >
      <Input data-slot="form-input" {...props} />
    </FormField>
  )
}

function FormTextarea({
  label,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  ...props
}: FormFieldOwnProps & React.ComponentProps<typeof Textarea>) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      optional={optional}
      fieldSize={fieldSize}
      fieldClassName={fieldClassName}
    >
      <Textarea data-slot="form-textarea" {...props} />
    </FormField>
  )
}

/**
 * O campo que **agrupa**, e o irmão do `FormField` que existe por mecânica.
 *
 * O `FormField` liga rótulo e controle por `htmlFor`/`id`, e isso vale quando o
 * controle é rotulável (`input`, `select`, `textarea`, `button`). Quando o
 * "controle" é um `role="radiogroup"` — uma `div` —, **`htmlFor` não faz nada**:
 * o atributo exige um *labelable element*, e o navegador o ignora sem avisar.
 * Aqui o nome do grupo vem de `aria-labelledby` apontando para um `FieldTitle`,
 * que é a peça que `field.tsx` já reserva para rotular grupo em vez de controle.
 *
 * **O `Field` fica sem `role`.** A raiz do Radix já é o `radiogroup`, e um
 * segundo em volta poria um nó entre o grupo e os `role="radio"` dele — é
 * palavra por palavra a regra que este projeto escreve para o `ButtonGroup` em
 * volta de um `tablist`: quebra a posse ARIA.
 *
 * **O `FieldControl` continua servindo**, ao contrário do que o JSDoc dele
 * deixa supor: a advertência de lá é sobre `Select.Root`, que não vira DOM.
 * Aqui a raiz é uma `div` real, e os três atributos que ele injeta são
 * exatamente os que um grupo quer — `id`, `aria-describedby` (descrição e erro,
 * na ordem de registro) e `aria-invalid`, que o `RadioGroup` desce por contexto
 * até cada `Radio`.
 */
function FormFieldGroup({
  label,
  labelId,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  children,
}: FormFieldOwnProps & { labelId: string; children: React.ReactNode }) {
  return (
    <Field size={fieldSize} className={fieldClassName}>
      <FieldTitle id={labelId} optional={optional}>
        {label}
      </FieldTitle>
      <FieldControl>{children}</FieldControl>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  )
}

/** Uma opção. `description` só aparece em `variant="card"`. */
type FormRadioOption = {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

/**
 * A escolha única, na forma curta — o molde do `FormInput`.
 *
 * **Ele recebe `options` e não `children`, de propósito.** Todos os sítios do
 * app são listas estáticas de duas ou três opções, e aceitar as duas fontes
 * repetiria o defeito que o `Kbd` corrigiu: duas fontes para o mesmo conteúdo
 * deixam uma em silêncio, e quem escreveu não descobre qual. Quem precisar de
 * conteúdo próprio na opção compõe `Field` + `RadioGroup` à mão, que é para o
 * que o `Field` existe.
 */
function FormRadioGroup({
  label,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  options,
  ...props
}: FormFieldOwnProps &
  Omit<React.ComponentProps<typeof RadioGroup>, "children"> & {
    options: FormRadioOption[]
  }) {
  const labelId = `${React.useId()}-radio-group-label`

  return (
    <FormFieldGroup
      label={label}
      labelId={labelId}
      description={description}
      error={error}
      optional={optional}
      fieldSize={fieldSize}
      fieldClassName={fieldClassName}
    >
      <RadioGroup
        data-slot="form-radio-group"
        aria-labelledby={labelId}
        {...props}
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option.value}
            value={option.value}
            description={option.description}
            disabled={option.disabled}
          >
            {option.label}
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </FormFieldGroup>
  )
}

/**
 * O erro do formulário inteiro — o que não pertence a nenhum campo.
 *
 * **Só `role="alert"`.** O papel já implica `aria-live="assertive"`, e um
 * `aria-live="polite"` explícito **vence** o implícito: `role="alert"
 * aria-live="polite"`, que uma tela do app escreve, é uma região polida chamada
 * de alerta. Não é redundância, é contradição. É o mesmo contrato do
 * `FieldError`, um nível acima.
 *
 * **E não é um `Alert`.** Compor a molécula dentro da molécula reprovaria a
 * asserção 3 da taxonomia — e um erro de formulário é uma frase, não um painel.
 * Quem quer a caixa escreve `<Alert tone="destructive" variant="plain">` na tela.
 */
function FormError({
  className,
  children,
  ...props
}: React.ComponentProps<typeof P>) {
  if (!children) return null

  return (
    <P
      role="alert"
      data-slot="form-error"
      className={cn("text-destructive", className)}
      {...props}
    >
      {children}
    </P>
  )
}

/**
 * A fileira de ações.
 *
 * `flex-col-reverse` no telefone põe a ação principal em cima mantendo a ordem
 * do DOM (cancelar antes de enviar) — a mesma decisão do `DialogFooter`, e a
 * razão é a mesma.
 *
 * **`sticky` é o rodapé fixo de uma folha**, e ele não desenha fio nem tinta: a
 * regra J. Quem marca a fronteira é o conteúdo dissolvendo na borda do
 * `MobileSheetFormBody` logo acima. Também não traz área segura — ela é da
 * **superfície**, e `mobileFormSheetContentClassName` já a carrega; somar aqui
 * dobraria o recuo.
 */
const formActionsVariants = cva("flex flex-col-reverse gap-2", {
  variants: {
    variant: {
      inline: "sm:flex-row",
      // Sem fio e sem tinta: o rodapé é irmão do `MobileSheetFormBody`, que se
      // mascara sozinho, então o fundo dele já é a placa da folha. Um degradê
      // aqui (houve) vira banda sobre a placa translúcida — ver `DialogHeader`.
      sticky: "shrink-0 px-4 pt-3 sm:flex-row sm:px-5",
    },
    align: {
      end: "sm:justify-end",
      between: "sm:justify-between",
      start: "sm:justify-start",
    },
  },
  defaultVariants: { variant: "inline", align: "end" },
})

function FormActions({
  className,
  variant,
  align,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof formActionsVariants>) {
  return (
    <div
      data-slot="form-actions"
      data-variant={variant ?? "inline"}
      className={cn(formActionsVariants({ variant, align }), className)}
      {...props}
    />
  )
}

/**
 * Sair sem fazer nada. `tertiary` e `type="button"` não são escolha de quem
 * chama: é a tabela do rodapé, e o app a contraria 173 vezes.
 */
function FormCancel({
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  const form = React.useContext(FormContext)

  return (
    <Button
      data-slot="form-cancel"
      type="button"
      variant="tertiary"
      {...props}
      disabled={disabled || form?.pending}
    />
  )
}

/**
 * A ação principal, e a única `type="submit"`.
 *
 * A ordem do espalhamento é carga estrutural: `type` e `variant` vêm **antes**
 * de `...props`, para uma exclusão poder pedir `variant="destructive"`; e
 * `disabled`/`aria-busy` vêm **depois**, para o estado de envio não ser
 * sobrescrito por engano. Enter durante o envio não duplica: o botão está
 * `disabled`, e o `submitFrom` acima filtra `:not(:disabled)`.
 */
function FormSubmit({
  children,
  pendingLabel,
  pending: pendingProp,
  disabled,
  form: formProp,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** O rótulo enquanto envia. Sem ele, o rótulo não muda — só o spinner entra. */
  pendingLabel?: React.ReactNode
  /** Sobrescreve o `pending` do formulário, para um botão que envia outra coisa. */
  pending?: boolean
}) {
  const form = React.useContext(FormContext)
  const pending = pendingProp ?? form?.pending ?? false

  return (
    <Button
      data-slot="form-submit"
      type="submit"
      variant="primary"
      form={formProp ?? form?.id}
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending ? <Spinner /> : null}
      {pending && pendingLabel != null ? pendingLabel : children}
    </Button>
  )
}

export {
  CustomForm,
  Form,
  FormActions,
  FormCancel,
  FormError,
  FormInput,
  FormRadioGroup,
  FormSubmit,
  FormTextarea,
  formActionsVariants,
  formVariants,
}
