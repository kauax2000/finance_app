"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import {
  fieldControlHeightClassName,
  fieldControlPaddingClassName,
  fieldTriggerClassName,
  type FieldControlSize,
} from "@/lib/field-classes"
import {
  scrollFadeBandsClassName,
  scrollFadeBleedClassName,
  scrollFadeViewportClassName,
} from "@/lib/scroll-fade-classes"
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows"
import { useIsMobile } from "@/hooks/use-mobile"
import { useScrollFade } from "@/hooks/use-scroll-fade"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Muted, P } from "@/components/ui/typography"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SearchInput } from "@/components/ui/search-input"

/**
 * O formulário do projeto: o `<form>`, a política do Enter e as peças. Compõe
 * `Field` e `RadioGroup` (moléculas), então é organismo (o `registry.ts` o
 * classifica). `FormInput` / `FormTextarea` ligam `htmlFor`, `aria-describedby`
 * e `aria-invalid` pelo `Field`; `FormSubmit` desabilita, marca `aria-busy`,
 * mostra o `Spinner` e troca o rótulo; `FormCancel` embute a tabela do rodapé
 * (sair é `tertiary`); `FormActions variant="sticky"` é o rodapé fixo de uma
 * folha que não é `Dialog`; `FormError` é o erro que não é de campo.
 *
 * `Form` gera um `id` com `useId` e o publica em contexto; `FormSubmit` escreve
 * `form={id}` sempre. O Enter é a submissão implícita do navegador, que aciona
 * o primeiro `type="submit"` cujo dono é o formulário (dentro dele ou por
 * `form=`). O contexto atravessa portal, mas não *slot irmão*: quando o rodapé é
 * renderizado por outro componente ao lado do formulário (o `footer=` do
 * assistente de categorias), `form={UM_ID}` explícito é a resposta
 * (`form-submit-owner.test.ts` confere no fonte). O navegador decide pelo dono
 * do campo no DOM: o Enter na busca de um popover portalizado não envia o
 * formulário, mesmo que o evento suba pela árvore do React até ele.
 */

/**
 * Enquanto uma tecla morta compõe um caractere, o Enter confirma o candidato:
 * é do editor de entrada, não do formulário. O `keyCode 229` é o mesmo fato
 * para os navegadores que não publicam `isComposing`.
 */
function isComposing(e: React.KeyboardEvent): boolean {
  return e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229
}

/** Onde o nome do campo aparece: `visible` é o rótulo em cima (padrão); `hidden` o tira da vista e o põe no placeholder (o rótulo fica para o leitor de tela). */
type FormLabels = "visible" | "hidden"

type FormContextValue = {
  id: string
  pending: boolean
  labels: FormLabels
  /** As mensagens da validação nativa, pelo `id` do controle. */
  nativos: Record<string, string>
  /** O `FormField` diz que tem lugar para a mensagem daquele `id`. */
  registrar: (id: string) => () => void
}

const FormContext = React.createContext<FormContextValue | null>(null)

/** Os campos por onde o Enter anda: o texto de uma linha e o textarea como destino; nunca botão, caixa, rádio, arquivo nem cor. */
const CAMPOS_QUE_AVANCAM =
  "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=file]):not([type=range]):not([type=color]):not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])"

/** Num formulário sem rótulo à vista (`labels="hidden"`) o Enter avança ao campo de texto seguinte (o teclado do iOS diz "Seguinte"); com o rótulo em cima continua enviando. */
function avancaComEnter(form: HTMLFormElement, alvo: HTMLElement): boolean {
  // `tagName` e não `instanceof`: no iframe do catálogo o elemento é de outra
  // janela. O dono no DOM, como o navegador decide: a busca de um popover
  // portalizado não é campo deste formulário, e um combobox usa o Enter para escolher.
  return (
    alvo.tagName === "INPUT" &&
    (alvo as HTMLInputElement).form === form &&
    alvo.getAttribute("role") !== "combobox" &&
    alvo.matches(CAMPOS_QUE_AVANCAM) &&
    form.dataset.labels === "hidden"
  )
}

/** Só os que se podem focar: um `display:none` ou `tabindex="-1"` recusaria o foco, e o Enter morreria calado (o `preventDefault` já teria tirado o envio). */
function camposQueAvancam(form: HTMLFormElement): HTMLElement[] {
  return Array.from(form.querySelectorAll<HTMLElement>(CAMPOS_QUE_AVANCAM)).filter(
    (el) => el.tabIndex >= 0 && el.getClientRects().length > 0
  )
}

/**
 * O botão padrão do formulário, como o navegador o escolhe: o primeiro de
 * envio entre os controles dele, em ordem do documento — inclusive os ligados
 * por `form=` — e um `<button>` sem `type` conta como de envio.
 */
function botaoPadrao(form: HTMLFormElement): HTMLButtonElement | HTMLInputElement | null {
  for (const el of Array.from(form.elements)) {
    if ((el.tagName === "BUTTON" || el.tagName === "INPUT") && (el as HTMLButtonElement).type === "submit") {
      return el as HTMLButtonElement | HTMLInputElement
    }
  }
  return null
}

/** Exportada para poder ser testada. */
export function proximoCampo(form: HTMLFormElement, atual: HTMLElement): HTMLElement | null {
  const campos = camposQueAvancam(form)
  const i = campos.indexOf(atual)
  return i >= 0 ? (campos[i + 1] ?? null) : null
}

/**
 * O rótulo de espera sai do verbo: "Salvar" → "Salvando…", "Criar conta" →
 * "Criando conta…". Só a primeira palavra, e só quando termina em `-ar`, `-er`
 * ou `-ir`; um rótulo que não é texto ou não começa por verbo devolve `null` e
 * não muda.
 */
export function rotuloDeEspera(rotulo: React.ReactNode): string | null {
  if (typeof rotulo !== "string") return null
  const m = rotulo.trim().match(/^(\p{L}{2,}?)([aei])r(\s.*)?$/u)
  if (!m) return null
  return `${m[1]}${m[2]}ndo${m[3] ?? ""}…`
}

/** A mensagem da validação nativa, em português: o balão do navegador fala a língua do sistema, some sozinho e não chega ao `FieldError`; aqui `required`, `type="email"`, `minLength`… viram a frase embaixo do campo. */
export function mensagemNativa(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): string {
  const v = el.validity
  if (v.valueMissing) return "Preencha este campo."
  if (v.typeMismatch) {
    if (el.type === "email") return "Digite um e-mail válido."
    if (el.type === "url") return "Digite um endereço válido, com https://."
  }
  if ("minLength" in el && v.tooShort) return `Use pelo menos ${el.minLength} caracteres.`
  if ("maxLength" in el && v.tooLong) return `Use no máximo ${el.maxLength} caracteres.`
  if ("min" in el && v.rangeUnderflow) return `O mínimo é ${el.min}.`
  if ("max" in el && v.rangeOverflow) return `O máximo é ${el.max}.`
  if (v.patternMismatch) return el.title || "O formato não confere."
  if (v.customError) return el.validationMessage
  return "Valor inválido."
}

type Validavel = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

function validavel(el: Element): el is Validavel {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  )
}

/**
 * O ritmo entre os campos: `stack` lê `--space-block` (16px, o do
 * `PageSection`); `inline` é o formulário de convite, campo e botão na mesma
 * linha (`items-end` alinha o botão pela base do campo), um embaixo do outro no
 * telefone; `none` é o `CustomForm`, cujas chamadas trazem o próprio `gap`.
 */
const formVariants = cva("", {
  variants: {
    layout: {
      stack: "flex flex-col gap-(--space-block)",
      // Empilha no telefone, com o botão na largura toda; de `sm` em diante o campo ocupa a sobra.
      inline:
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:*:data-[slot=field]:flex-1",
      none: "",
    },
  },
  defaultVariants: { layout: "stack" },
})

export interface FormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit">,
    VariantProps<typeof formVariants> {
  /** Devolvendo uma `Promise`, o formulário fica `pending` até ela assentar (a tela não guarda `saving`); o erro dela não é engolido. */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<unknown>
  /** Enviando. Desce por contexto: desabilita o cancelar e ocupa o enviar. */
  pending?: boolean
  /** Onde o nome dos campos aparece; fora do `visible`, o Enter leva ao campo seguinte e só envia no último. */
  labels?: FormLabels
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      id,
      layout,
      pending = false,
      labels = "visible",
      noValidate = false,
      onSubmit,
      onKeyDown,
      onInput,
      children,
      ...props
    },
    ref
  ) => {
    const reactId = React.useId()
    const formId = id ?? reactId
    const formRef = React.useRef<HTMLFormElement | null>(null)
    React.useImperativeHandle(ref, () => formRef.current as HTMLFormElement, [])

    const [enviando, setEnviando] = React.useState(false)
    const pendente = pending || enviando
    const [nativos, setNativos] = React.useState<Record<string, string>>({})
    const registradosRef = React.useRef(new Set<string>())
    const registrar = React.useCallback((campo: string) => {
      registradosRef.current.add(campo)
      return () => {
        registradosRef.current.delete(campo)
      }
    }, [])

    const contexto = React.useMemo(
      () => ({ id: formId, pending: pendente, labels, nativos, registrar }),
      [formId, pendente, labels, nativos, registrar]
    )

    // A tecla do teclado do telefone diz o que o Enter faz ("Seguinte" até o
    // penúltimo campo, "Ir" no último); uma escrita por quem chama fica. O que
    // este efeito escreveu sai antes de cada passada, e de vez fora do `hidden`.
    // Um combobox não ganha tecla: ali o Enter não avança.
    React.useEffect(() => {
      const form = formRef.current
      if (!form) return
      for (const el of form.querySelectorAll<HTMLElement>("[data-form-enterkeyhint]")) {
        el.removeAttribute("enterkeyhint")
        el.removeAttribute("data-form-enterkeyhint")
      }
      if (labels !== "hidden") return
      const campos = camposQueAvancam(form)
      campos.forEach((el, i) => {
        if (!avancaComEnter(form, el)) return
        if (el.hasAttribute("enterkeyhint")) return
        el.setAttribute("enterkeyhint", i < campos.length - 1 ? "next" : "go")
        el.setAttribute("data-form-enterkeyhint", "")
      })
    })

    /**
     * O foco vai ao primeiro erro: depois do envio (e quando uma `Promise`
     * assenta, para o erro do servidor) o primeiro controle com `aria-invalid`
     * recebe o foco. Dois quadros: o do render com o erro e o que já tem o DOM.
     * O botão de fora do `<form>` não conta.
     */
    const focarErro = React.useCallback(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const alvo = formRef.current?.querySelector<HTMLElement>(
            '[aria-invalid="true"]'
          )
          if (!alvo) return
          // Um grupo (`radiogroup`) é uma `div`: o foco vai ao rádio de dentro.
          const foco = alvo.matches("input, select, textarea, button, [tabindex]")
            ? alvo
            : alvo.querySelector<HTMLElement>(
                'input:not([type=hidden]), select, textarea, button:not([tabindex="-1"]), [tabindex="0"]'
              )
          if (foco && foco !== document.activeElement) foco.focus()
        })
      )
    }, [])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      // Enviando, não envia de novo — o `requestSubmit` do Enter sem botão à
      // vista não passaria pelo `disabled` do `FormSubmit`.
      if (pendente) {
        e.preventDefault()
        return
      }
      // A validação nativa é do formulário, e não do balão do navegador:
      // `noValidate` na tela é quem diz "eu valido", e ali ela fica de fora.
      if (!noValidate) {
        const invalidos = Array.from(e.currentTarget.elements).filter(
          (el): el is Validavel =>
            validavel(el) && el.willValidate && !el.validity.valid
        )
        if (invalidos.length > 0) {
          e.preventDefault()
          const mensagens: Record<string, string> = {}
          let semLugar = false
          for (const el of invalidos) {
            if (el.id && registradosRef.current.has(el.id)) {
              mensagens[el.id] = mensagemNativa(el)
            } else {
              semLugar = true
            }
          }
          setNativos(mensagens)
          // Um controle sem `FormField` não tem onde mostrar a frase: o balão do navegador continua sendo a resposta.
          if (semLugar) e.currentTarget.reportValidity()
          else focarErro()
          return
        }
        if (Object.keys(nativos).length > 0) setNativos({})
      }
      const resultado = onSubmit?.(e)
      focarErro()
      if (resultado && typeof (resultado as Promise<unknown>).then === "function") {
        setEnviando(true)
        void (resultado as Promise<unknown>).finally(() => {
          setEnviando(false)
          focarErro()
        })
      }
    }

    // A frase nativa sai quando o campo passa a valer, não a cada tecla.
    const handleInput = (e: Parameters<NonNullable<typeof onInput>>[0]) => {
      const alvo = e.target as Element
      if (validavel(alvo) && nativos[alvo.id] && alvo.validity.valid) {
        setNativos((atuais) => {
          const resto = { ...atuais }
          delete resto[alvo.id]
          return resto
        })
      }
      onInput?.(e)
    }

    // O Enter é a submissão implícita do navegador. Fica aqui o que ele não faz:
    // ⌘/Ctrl+Enter envia de um textarea (o Enter sozinho quebra a linha), e com
    // `labels="hidden"` o Enter leva ao campo seguinte. `tagName`, e não
    // `instanceof`: no iframe do catálogo o elemento é de outra janela.
    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || e.key !== "Enter" || e.shiftKey || isComposing(e)) return
      const alvo = e.target as HTMLElement
      if (
        (e.metaKey || e.ctrlKey) &&
        alvo.tagName === "TEXTAREA" &&
        (alvo as HTMLTextAreaElement).form === e.currentTarget
      ) {
        e.preventDefault()
        // O mesmo botão que o Enter num campo acionaria: o primeiro de envio do
        // formulário. Desabilitado, não envia — a regra nativa.
        const padrao = botaoPadrao(e.currentTarget)
        if (padrao && !padrao.disabled) e.currentTarget.requestSubmit(padrao)
        return
      }
      const proximo =
        !e.metaKey && !e.ctrlKey && avancaComEnter(e.currentTarget, alvo)
          ? proximoCampo(e.currentTarget, alvo)
          : null
      if (proximo) {
        e.preventDefault()
        proximo.focus()
      }
    }

    return (
      <FormContext.Provider value={contexto}>
        <form
          ref={formRef}
          id={formId}
          data-slot="form"
          data-layout={layout ?? "stack"}
          data-labels={labels}
          data-pending={pendente || undefined}
          className={cn(formVariants({ layout }), className)}
          noValidate
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    )
  }
)
Form.displayName = "Form"

/** `Form` sem layout: as chamadas trazem o próprio `gap`. */
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
  /** O degrau do andaime (rótulo, ajuda e erro), não a altura do controle (`field.tsx` proíbe ancorar um no outro). Sem valor, herda do `FieldGroup`. */
  fieldSize?: FieldSize
  fieldClassName?: string
}

/** O que só os campos de texto aceitam. */
type FormFieldTextProps = {
  /** O ícone antes do texto, um `16/solid`. */
  icon?: React.ReactNode
  /** O × que limpa o campo quando há texto, como nos campos do iOS. */
  clearable?: boolean
}

type FilhoDeCampo = React.ReactElement<{
  id?: string
  value?: unknown
  defaultValue?: unknown
  placeholder?: string
  className?: string
}>

/** Limpar sem perder o `onChange` de quem chama, controlado ou não: o setter do protótipo mais um `input` que borbulha passam pelo caminho de sempre. O foco volta ao campo (senão cairia no `<body>`). */
function limparCampo(e: React.MouseEvent<HTMLButtonElement>) {
  const campo = e.currentTarget.parentElement?.querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >("input, textarea")
  if (!campo) return
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(campo), "value")?.set?.call(campo, "")
  campo.dispatchEvent(new Event("input", { bubbles: true }))
  campo.focus()
}

/**
 * O campo em volta de qualquer controle: rótulo, ajuda e erro ligados (para um
 * `DatePicker`, um `InputGroup`, um `Checkbox`). `Select` e `Combobox` não
 * renderizam nó na raiz, então ali o `FormControl` vai no gatilho (a regra do
 * `FieldControl`). A ordem é o contrato: o `aria-describedby` compõe descrição
 * e depois erro, e o `id` é o que leva a frase da validação nativa ao
 * `FieldError`.
 *
 * Com `labels="hidden"` o placeholder diz o nome (o do rótulo, com
 * "(opcional)") e o rótulo segue no DOM. `hidden`, `icon` e `clearable` pedem
 * um `<input>` como filho (o `FormInput`) e se decidem na montagem: ligar um
 * depois põe a caixa em volta do campo e ele remonta.
 */
function FormField({
  label,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  icon,
  clearable,
  children,
}: FormFieldOwnProps & FormFieldTextProps & { children: FilhoDeCampo }) {
  const form = React.useContext(FormContext)
  const registrar = form?.registrar
  const autoId = React.useId()
  const filho = React.Children.only(children)
  const id = filho.props.id ?? autoId
  const escondido = form?.labels === "hidden"
  const nome = typeof label === "string" ? label : undefined

  // O × só aparece com texto. Controlado, quem diz é o `value`; solto, o
  // que se digitou — e o próprio × passa por aqui, pelo `input` que dispara.
  const controlado = filho.props.value !== undefined
  const [digitado, setDigitado] = React.useState(
    () => String(filho.props.defaultValue ?? "").length > 0
  )
  const temTexto = controlado ? String(filho.props.value).length > 0 : digitado
  const aoDigitar =
    clearable && !controlado
      ? (e: React.FormEvent) => setDigitado((e.target as HTMLInputElement).value.length > 0)
      : undefined

  React.useEffect(() => registrar?.(id), [registrar, id])

  const placeholder =
    escondido && nome ? `${nome}${optional ? " (opcional)" : ""}` : filho.props.placeholder
  const caixa = !!icon || !!clearable

  const controle = (
    <FieldControl>
      {React.cloneElement(filho, {
        id,
        placeholder,
        className: caixa
          ? cn(filho.props.className, icon && "ps-9", clearable && "pe-9")
          : filho.props.className,
      })}
    </FieldControl>
  )

  return (
    <Field size={fieldSize} className={fieldClassName}>
      <FieldLabel optional={optional} className={escondido ? "sr-only" : undefined}>
        {label}
      </FieldLabel>
      {caixa ? (
        <div data-slot="form-field-box" className="relative" onInput={aoDigitar}>
          {icon ? (
            <span
              data-slot="form-field-icon"
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground [&>svg]:size-4"
            >
              {icon}
            </span>
          ) : null}
          {controle}
          {clearable && temTexto ? (
            <Button
              type="button"
              variant="tertiary"
              size="icon-xs"
              data-slot="form-field-clear"
              aria-label={nome ? `Limpar ${nome.toLowerCase()}` : "Limpar campo"}
              // Centrado por margem, e não por `translate`: o `Button` desce
              // 1px no clique pelo `translate`.
              className="absolute inset-y-0 end-1.5 my-auto rounded-full"
              onClick={limparCampo}
            >
              <XMarkIcon aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : (
        controle
      )}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error ?? form?.nativos[id]}</FieldError>
    </Field>
  )
}

/** O gatilho de um `Select` ou `Combobox` dentro de um `FormField`. */
const FormControl = FieldControl

/**
 * A união do `Input` distribuída à mão: `FormFieldOwnProps &
 * React.ComponentProps<typeof Input>` é uma interseção com a união dentro, e
 * desestruturar o rest colapsa os ramos num objeto não atribuível a nenhum
 * (`<Input {...props} />` deixa de compilar). Como união de topo, cada ramo
 * mantém o próprio `money` literal. O mesmo colapso fixa `InputGroupInput` e
 * `SidebarInput` no ramo base.
 */
type FormInputProps =
  | (FormFieldOwnProps &
      FormFieldTextProps &
      InputBaseProps &
      React.RefAttributes<HTMLInputElement>)
  | (FormFieldOwnProps &
      FormFieldTextProps &
      InputMoneyProps &
      React.RefAttributes<HTMLInputElement>)

function FormInput({
  label,
  description,
  error,
  optional,
  fieldSize,
  fieldClassName,
  icon,
  clearable,
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
      icon={icon}
      clearable={clearable}
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
 * O campo que agrupa, irmão do `FormField`. `htmlFor` só vale para elemento
 * rotulável; quando o controle é um `role="radiogroup"` (uma `div`) o navegador
 * o ignora, então o nome do grupo vem de `aria-labelledby` apontando para um
 * `FieldTitle`. O `Field` fica sem `role`: a raiz do Radix já é o `radiogroup`,
 * e um segundo em volta quebraria a posse ARIA. O `FieldControl` continua
 * servindo (a raiz é uma `div` real) e injeta `id`, `aria-describedby` e
 * `aria-invalid`, que o `RadioGroup` desce por contexto até cada `Radio`.
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

/** Uma opção. `description` e `trailing` não aparecem na ficha (`chip`). */
type FormRadioOption = {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  /** O ícone da opção. */
  icon?: React.ReactNode
  /** O valor na outra ponta. */
  trailing?: React.ReactNode
  disabled?: boolean
}

/** A escolha única na forma curta, o molde do `FormInput`. Recebe `options` e não `children`: duas fontes para o mesmo conteúdo deixam uma em silêncio; conteúdo próprio na opção compõe `Field` + `RadioGroup` à mão. */
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
            icon={option.icon}
            trailing={option.trailing}
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
 * A linha de preferência: rótulo e descrição à esquerda, o `Switch` à direita, e
 * a linha inteira liga e desliga (o `::after` do rótulo cobre a linha e um
 * `<label for>` aciona o botão). Rótulo e descrição são par de identidade, sem
 * `gap`. `variant="card"` é a linha emoldurada; `plain` é a de dentro de um
 * `Card` ou lista.
 */
function FormSwitch({
  label,
  description,
  variant = "plain",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Switch>, "children" | "variant"> & {
  label: React.ReactNode
  description?: React.ReactNode
  variant?: "plain" | "card"
}) {
  return (
    <Field
      orientation="horizontal"
      data-slot="form-switch"
      data-variant={variant}
      className={cn(
        "relative items-start justify-between gap-4",
        variant === "card" && "rounded-surface border border-border p-3",
        className
      )}
    >
      <FieldContent className="min-w-0">
        <FieldLabel className="font-medium after:absolute after:inset-0">
          {label}
        </FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
      <FieldControl>
        {/* Acima do rótulo esticado: o toque no próprio interruptor é dele. */}
        <Switch className="relative z-10 mt-0.5" {...props} />
      </FieldControl>
    </Field>
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
 * Quem quer a caixa escreve `<Alert tone="destructive">` na tela.
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
 * A fileira de ações. `flex-col-reverse` no telefone põe a principal em cima
 * mantendo a ordem do DOM (a decisão do `DialogFooter`). `sticky` é o rodapé
 * fixo de uma folha, sem fio nem tinta (regra J; a fronteira é o conteúdo
 * dissolvendo no `DialogBody`) e sem área segura (que é da superfície).
 * `start` é a ação que encosta à esquerda ("Excluir", "Voltar"): vem antes no
 * DOM, então fica embaixo no telefone.
 */
const formActionsVariants = cva("flex flex-col-reverse gap-2", {
  variants: {
    variant: {
      inline: "sm:flex-row",
      // Sem fio e sem tinta: o rodapé é irmão do `DialogBody`, que se mascara
      // sozinho, então o fundo dele já é a placa da folha. Um degradê
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
  start,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof formActionsVariants> & {
    /** A ação à esquerda, a partir de `sm`; embaixo no telefone. */
    start?: React.ReactNode
  }) {
  return (
    <div
      data-slot="form-actions"
      data-variant={variant ?? "inline"}
      className={cn(formActionsVariants({ variant, align }), className)}
      {...props}
    >
      {start ? (
        <div
          data-slot="form-actions-start"
          className="flex flex-col-reverse gap-2 sm:me-auto sm:flex-row"
        >
          {start}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/** Sair sem fazer nada. `tertiary` e `type="button"` não são escolha de quem chama: é a tabela do rodapé. */
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
 * A ação principal, a única `type="submit"`. A ordem do espalhamento é
 * estrutural: `type` e `variant` antes de `...props` (uma exclusão pede
 * `variant="destructive"`), `disabled`/`aria-busy` depois (o estado de envio não
 * é sobrescrito). Enter durante o envio não duplica: o botão está `disabled`.
 */
function FormSubmit({
  children,
  pendingLabel,
  pending: pendingProp,
  disabled,
  form: formProp,
  ...props
}: React.ComponentProps<typeof Button> & {
  /** O rótulo enquanto envia; sem ele sai do verbo do rótulo ("Salvar" vira "Salvando…"), e um rótulo que não começa por verbo não muda. */
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
      {pending ? (pendingLabel ?? rotuloDeEspera(children) ?? children) : children}
    </Button>
  )
}

// ── O seletor ancorado num campo ────────────────────────────────────────────

/**
 * O seletor ancorado num campo, e o que vai dentro dele. Mora no `form.tsx`
 * porque só existe dentro de um formulário. Resolve a casca (largura do
 * gatilho, folga de colisão, altura limitada, foco que não pula) e as três
 * faixas que as telas escreviam à mão (busca, lista, rodapé com ação), as
 * mesmas do `Card` e do `Dialog`; as faixas não pintam nem aparam, e quem marca
 * o limite é o conteúdo dissolvendo por baixo.
 *
 * `onCloseAutoFocus` devolve o foco ao gatilho: o campo de busca vive dentro do
 * popover, então fechar deixava o foco no `<body>` e quem usa teclado perdia o
 * lugar. O salto de rolagem que justificava o `preventDefault` não existe (o
 * Radix devolve o foco com `preventScroll`); abrir continua sem roubar o foco
 * por causa do teclado do telefone.
 */

/** As classes da região rolável do `FormPickerPopoverList`; a string é só dela. */
const formPickerListScrollClassName =
  "min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-1 [-webkit-overflow-scrolling:touch]"

/** A raiz sabe do telefone: `modal` no telefone tranca a rolagem do documento, senão rolar a lista arrasta a folha que a contém. */
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
 * O gatilho é o campo e veste a superfície de campo (`border-input` +
 * `bg-input-fill/30` translúcida; o `Button outline` antigo só parecia campo
 * sob `dark:`). O padrão é `lg`, alinhando com o campo ao lado no desktop; no
 * telefone mede 40 de qualquer jeito.
 */
function FormPickerPopoverTrigger({
  className,
  children,
  size = "lg",
  ...props
}: Omit<React.ComponentProps<"button">, "size"> & {
  size?: FieldControlSize
}) {
  return (
    <PopoverTrigger
      data-slot="form-picker-popover-trigger"
      data-size={size}
      type="button"
      className={cn(
        fieldTriggerClassName,
        "group/picker-trigger flex w-full min-w-0 items-center justify-between gap-2 text-left font-normal",
        fieldControlHeightClassName[size],
        fieldControlPaddingClassName[size],
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">{children}</span>
      {/* O grupo é nomeado, e não `in-*`: o `data-state` mora no próprio
          gatilho, e `in-*` casaria com qualquer ancestral que o carregue (e
          compila com `:where()`). */}
      <ChevronDownIcon
        aria-hidden
        className="shrink-0 text-muted-foreground transition-transform duration-(--duration-fast) group-data-[state=open]/picker-trigger:rotate-180"
      />
    </PopoverTrigger>
  )
}

/** O texto de quando não há escolha (o vazio de um seletor não é um valor, é a ausência dele). */
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
      // O seletor é um campo: desdobra dele.
      motion="field"
      // Abrir não rouba o foco no toque (fecharia o teclado do telefone e a
      // folha saltaria); com mouse e teclado o foco entra, senão o teclado não
      // alcançava a busca nem a lista. Fechar devolve o foco ao gatilho.
      onOpenAutoFocus={(e) => {
        if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
          e.preventDefault()
        }
        onOpenAutoFocus?.(e)
      }}
      padding="none"
      className={cn(
        "flex min-h-0 w-(--radix-popover-trigger-width) max-w-88 flex-col overflow-hidden",
        // O teto de lista suspensa com a busca e o rodapé somados: 384px deixam a lista nos ~288 dos outros dropdowns.
        "max-h-[min(var(--radix-popover-content-available-height),--spacing(96))]",
        // A casca publica a altura das duas faixas, porque só ela as vê como
        // irmãs da lista; as duas são condicionais à presença da faixa. As
        // medidas (53,2 e 49,4) ficam no degrau abaixo (52 e 48): superestimar
        // deixa uma tira de conteúdo chapado abaixo da faixa, subestimar só
        // antecipa a dissolução em pouco mais de um pixel.
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
 * A faixa de busca: o campo é o `SearchInput` (que devolve o foco ao campo ao
 * limpar) com `surface="plate"`, a pílula de vidro da pilha do `Command`; dentro
 * da placa flutuante um campo preenchido seria uma segunda superfície.
 * `className` chega ao `<input>` como `inputClassName`. O Enter aqui não envia o
 * formulário: o popover é portalizado e o dono do campo no DOM não é o `<form>`.
 */
function FormPickerPopoverSearch({
  className,
  size = "lg",
  placeholder = "Buscar…",
  ...props
}: Omit<React.ComponentProps<typeof SearchInput>, "surface" | "variant">) {
  return (
    <div
      data-slot="form-picker-popover-search"
      // **Sem fio.** Quem marca o limite é o conteúdo dissolvendo por baixo, e
      // não uma aresta. O `relative z-10` é o que põe a faixa sobre a lista, em
      // vez de ao lado dela: o conteúdo passa por trás.
      className="relative z-10 shrink-0 p-3 pb-2"
    >
      <SearchInput
        surface="plate"
        size={size}
        placeholder={placeholder}
        inputClassName={className}
        {...props}
      />
    </div>
  )
}

/** A região que rola. O `onWheel` que para a propagação vem junto: sem ele a roda atravessa a lista e rola a página atrás quando a lista chega ao fim. */
function FormPickerPopoverList({
  className,
  onWheel,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <>
      <div
        ref={useScrollFade({ arrows: true })}
        data-slot="form-picker-popover-list"
        className={cn(
          formPickerListScrollClassName,
          // As duas pontas dissolvem, e o conteúdo passa por trás das faixas
          // (é o que dá à rampa o que dissolver). A dissolução vai aqui e não
          // na constante da lista, para a máscara nunca ficar ligada sem a casca
          // publicar `band-h`.
          scrollFadeViewportClassName,
          scrollFadeBleedClassName,
          // Sem a busca em cima, a lista abre a placa: o topo recua 8, como as
          // laterais e o pé. Os 4 do `py-1` são o vão para a busca.
          "first:pt-[calc(var(--scroll-fade-band-h)+--spacing(2))]",
          className
        )}
        onWheel={(e) => {
          e.stopPropagation()
          onWheel?.(e)
        }}
        {...props}
      />
      <ScrollFadeArrows />
    </>
  )
}

/** A lista vazia. O texto é de quem chama ("nenhuma categoria encontrada" é busca sem resultado, "nenhum cartão cadastrado" é ausência de dado); o respiro e a tinta não variam. */
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
 * Uma linha da lista, o `Button` do sistema. `min-h-11` são os 44px de alvo (um
 * seletor de toque), então a altura não é um degrau e o `data-size` sai. O
 * realce tem o par `active:`. O conteúdo vai num `<span>` próprio, estrutural:
 * o `Button` embrulha texto cru para a maiúscula do CTA, e "iFood" tem de sair
 * "iFood".
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
        // A linha alta, e não a cápsula da base: uma linha de 44 com 22 de
        // raio é pílula. O realce é a camada do `Button` (`hover:bg-*` pintaria
        // por baixo dela) na tinta do campo, `--input-fill` a 50%: translúcido
        // sobre o vidro da placa, como o fundo dos inputs. O `--muted` cheio
        // tapava a transparência.
        "rounded-row-lg [--button-hover-fill:color-mix(in_oklab,var(--input-fill)_50%,transparent)]",
        selected && "bg-input-fill/50 font-medium text-foreground",
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

/** O pé: onde mora a saída para gerenciar o que a lista mostra ("Gerenciar categorias", "Cadastrar cartão"). */
function FormPickerPopoverFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-picker-popover-footer"
      className={cn(
        // Sem fio e sem tinta: um degrau de tom na emenda seria o "bloco aceso"
        // que a paleta já registrou; quem separa é a dissolução do conteúdo.
        "relative z-10 shrink-0 p-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * A ação do pé: sempre um `Link` dentro, então `asChild` vem de fábrica. Ela
 * preenche (`secondary`): o rodapé perdeu a moldura que o degrau quieto
 * pressupõe, e um `tertiary` ficaria indistinguível de uma linha da lista até o
 * cursor chegar (a dissolução separa por gradiente, não por peso). Não disputa
 * com o `primary`, que mora no rodapé do formulário. Fica opaco de propósito:
 * a lista passa por baixo do pé, e translúcido o item apagado vazava atrás do
 * rótulo (rodada 269, recusado pelo dono).
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
  CustomForm,
  Form,
  FormActions,
  FormCancel,
  FormControl,
  FormError,
  FormField,
  FormInput,
  FormPickerPopover,
  FormPickerPopoverContent,
  FormPickerPopoverEmpty,
  FormPickerPopoverFooter,
  FormPickerPopoverFooterAction,
  FormPickerPopoverItem,
  FormPickerPopoverList,
  FormPickerPopoverPlaceholder,
  FormPickerPopoverSearch,
  FormPickerPopoverTrigger,
  FormRadioGroup,
  FormSubmit,
  FormSwitch,
  FormTextarea,
  formActionsVariants,
  formVariants,
}
