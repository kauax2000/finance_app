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
 * O formulário do projeto — o `<form>`, a política do Enter e as peças.
 *
 * **Ele era um átomo, e a pergunta que o mudou foi "um formulário não é feito
 * de um input e um botão?".** Era, no modelo; não era, neste arquivo — havia só
 * o `<form>` e o `onKeyDown`, e os 46 botões de enviar do app eram escritos à
 * mão, um por um, cada um com o próprio nome de booleano (`saving`, `loading`,
 * `submitting`, `busy`) e a própria grafia de reticência em "Salvando…". Agora
 * ele compõe os átomos — e, como compõe `Field` e `RadioGroup`, que são
 * moléculas, é um **organismo** (o `registry.ts` o classifica, e a régua é a
 * de lá).
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
 * - `FormActions variant="sticky"` — o rodapé fixo de uma folha que não é
 *   `Dialog`. Os formulários do app usam o `DialogFooter` desde a rodada 211
 *   (`Dialog surface="auto"`), e ele ficou sem consumidor no app.
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
 * Esta lista é a fonte: a página `/designsystem/form` a importa em vez
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
  {
    match: "<button>, <a href>, radio, checkbox e switch",
    why: "o Enter já aciona o próprio controle — sem esta regra, Enter num botão focado (o chip «Dinheiro») enviava o formulário",
  },
] as const

/**
 * Exportada para poder ser testada. Enquanto era privada, as regras acima
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
  // Botão, link e controles de escolha têm o próprio Enter. Sequestrá-lo
  // clicava o "Salvar" quando a pessoa só queria acionar o botão focado —
  // medido no chip "Dinheiro" da nova transação. O botão de enviar focado
  // continua enviando: é o Enter nativo dele que faz isso.
  if (target.tagName === "BUTTON" || target.tagName === "A") {
    return true
  }
  const ownRole = target.getAttribute("role")
  if (ownRole === "radio" || ownRole === "checkbox" || ownRole === "switch") {
    return true
  }
  if (
    target.closest(
      'button, a[href], [role="radio"], [role="checkbox"], [role="switch"]'
    )
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
  if (submitButton) {
    submitButton.click()
    return
  }
  // Sem botão de enviar à vista, o envio ainda passa pela validação nativa.
  form.requestSubmit()
}

/**
 * Onde o nome do campo aparece (rodada 244). `visible` é o rótulo em cima, o
 * de sempre; `hidden` o tira da vista e o põe no placeholder (o rótulo fica
 * para o leitor de tela).
 */
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

/**
 * Os campos por onde o Enter anda (rodada 244): o texto de uma linha, e o
 * textarea como destino. Nunca botão, caixa, rádio, arquivo nem cor.
 */
const CAMPOS_QUE_AVANCAM =
  "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=file]):not([type=range]):not([type=color]):not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly])"

/**
 * Num formulário sem rótulo à vista (`labels="hidden"`) o Enter avança ao
 * campo de texto seguinte — o teclado do iOS diz "Seguinte". Com o rótulo em
 * cima ele continua enviando, como sempre.
 */
function avancaComEnter(form: HTMLFormElement, alvo: HTMLElement): boolean {
  // `tagName`, e não `instanceof`: dentro do iframe do catálogo o elemento é
  // de outra janela, e o `instanceof` falha.
  return (
    alvo.tagName === "INPUT" &&
    alvo.matches(CAMPOS_QUE_AVANCAM) &&
    form.dataset.labels === "hidden"
  )
}

/**
 * Só os que se podem focar: um `display:none` (o `<input>` escondido do
 * `Slider`, um painel recolhido) ou um `tabindex="-1"` recusariam o foco, e o
 * Enter morreria calado — o `preventDefault` já teria tirado o envio.
 */
function camposQueAvancam(form: HTMLFormElement): HTMLElement[] {
  return Array.from(form.querySelectorAll<HTMLElement>(CAMPOS_QUE_AVANCAM)).filter(
    (el) => el.tabIndex >= 0 && el.getClientRects().length > 0
  )
}

/** Exportada para poder ser testada, como `shouldDeferEnterToWidget`. */
export function proximoCampo(form: HTMLFormElement, atual: HTMLElement): HTMLElement | null {
  const campos = camposQueAvancam(form)
  const i = campos.indexOf(atual)
  return i >= 0 ? (campos[i + 1] ?? null) : null
}

/**
 * O rótulo de espera sai do verbo (rodada 214): "Salvar" → "Salvando…",
 * "Excluir" → "Excluindo…", "Criar conta" → "Criando conta…". Só a primeira
 * palavra, e só quando ela termina em `-ar`, `-er` ou `-ir`; um rótulo que não
 * é texto, ou não começa por verbo, devolve `null` e o rótulo não muda. Eram
 * 43 `pendingLabel` escritos à mão, quase todos a mesma conta.
 */
export function rotuloDeEspera(rotulo: React.ReactNode): string | null {
  if (typeof rotulo !== "string") return null
  const m = rotulo.trim().match(/^(\p{L}{2,}?)([aei])r(\s.*)?$/u)
  if (!m) return null
  return `${m[1]}${m[2]}ndo${m[3] ?? ""}…`
}

/**
 * A mensagem da validação nativa, em português (rodada 214). O balão do
 * navegador fala a língua do sistema, some sozinho, não conhece o tema e não
 * chega ao `FieldError`; aqui a mesma regra — `required`, `type="email"`,
 * `minLength`… — vira a frase embaixo do campo.
 */
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
 * O ritmo entre os campos.
 *
 * `stack` lê `--space-block`, o token de 16px que o `PageSection` usa entre
 * blocos — o formulário não inventa um respiro próprio. `inline` é o formulário
 * de convite, campo e botão na mesma linha (`items-end` alinha o botão pela
 * base do campo, e não pela do rótulo) — e um embaixo do outro no telefone. `none` é o que o `CustomForm`
 * sempre foi: sem layout, porque as chamadas do app trazem o próprio `gap`.
 */
const formVariants = cva("", {
  variants: {
    layout: {
      stack: "flex flex-col gap-(--space-block)",
      // Empilha no telefone, com o botão na largura toda; de `sm` em diante o
      // campo ocupa a sobra (rodada 214). Os convites escreviam isso à mão.
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
  /**
   * Devolvendo uma `Promise`, o formulário fica `pending` até ela assentar —
   * a tela não guarda `saving` (rodada 214). O erro dela não é engolido.
   */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<unknown>
  /** Enviando. Desce por contexto: desabilita o cancelar e ocupa o enviar. */
  pending?: boolean
  /**
   * Onde o nome dos campos aparece (rodada 244). Fora do `visible`, o Enter
   * leva ao campo seguinte e só envia no último.
   */
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

    // A tecla do teclado do telefone diz o que o Enter faz: "Seguinte" até o
    // penúltimo campo, "Ir" no último (rodada 244). Uma tecla escrita por quem
    // chama fica. O que este efeito escreveu sai antes de cada passada — e de
    // vez fora do `hidden`, senão o iOS seguia dizendo "Seguinte" num
    // formulário em que o Enter envia. O campo que adia o Enter (um combobox)
    // não ganha tecla: ali ele não avança.
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
        if (!avancaComEnter(form, el) || shouldDeferEnterToWidget(el)) return
        if (el.hasAttribute("enterkeyhint")) return
        el.setAttribute("enterkeyhint", i < campos.length - 1 ? "next" : "go")
        el.setAttribute("data-form-enterkeyhint", "")
      })
    })

    /**
     * O foco vai ao primeiro erro (rodada 214): depois do envio — e de novo
     * quando uma `Promise` assenta, para o erro que vem do servidor —, o
     * primeiro controle com `aria-invalid` recebe o foco, e o `focus()` o rola
     * à vista. Dois quadros: o primeiro é o do render com o erro, o segundo já
     * tem o DOM. O botão de fora do `<form>` (no `DialogFooter`) não conta: só
     * os controles.
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
          // Um controle sem `FormField` não tem onde mostrar a frase: ali o
          // balão do navegador continua sendo a resposta, como antes.
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

    // A frase nativa sai quando o campo passa a valer — não a cada tecla.
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isComposing(e)) {
        // `⌘/Ctrl + Enter` envia **de dentro** do controle que ficaria com a
        // tecla. É a saída para o textarea, que defere o Enter e por isso não
        // tinha nenhuma forma de enviar sem tirar a mão do teclado.
        const forced = e.metaKey || e.ctrlKey
        const alvo = e.target as HTMLElement
        if (forced || !shouldDeferEnterToWidget(alvo)) {
          e.preventDefault()
          const proximo =
            !forced && avancaComEnter(e.currentTarget, alvo)
              ? proximoCampo(e.currentTarget, alvo)
              : null
          if (proximo) proximo.focus()
          else submitFrom(e.currentTarget)
        }
      }
      onKeyDown?.(e)
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

/**
 * O nome antigo, e ele continua válido: `Form` sem layout.
 *
 * São 26 chamadas em 19 arquivos, todas trazendo o próprio `gap` — trocá-las
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

/** O que só os campos de texto aceitam (rodada 244). */
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

/**
 * Limpar sem perder o `onChange` de quem chama, controlado ou não: o `value`
 * escrito direto não avisa o React, e o setter do protótipo mais um `input`
 * que borbulha passam pelo caminho de sempre. O foco volta ao campo — o ×
 * some com o texto, e sem isso o foco caía no `<body>`.
 */
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
 * O campo em volta de **qualquer** controle (exportado na rodada 214): rótulo,
 * ajuda e erro ligados, para um `DatePicker`, um `InputGroup`, um `Checkbox`.
 * Eram 41 `Field` montados à mão em 15 arquivos.
 *
 * **`Select` e `Combobox` não renderizam nó na raiz**, e o `id` que este campo
 * dá ao filho não chegaria a lugar nenhum. Ali o `FormControl` vai no
 * **gatilho**, dentro da raiz — a mesma regra do `FieldControl`.
 *
 * A ordem aqui é o contrato: `FieldControl` compõe o `aria-describedby` na
 * ordem em que os irmãos se registram — descrição, depois erro. O `id` é deste
 * campo (ou o que o filho já traz): é por ele que a frase da validação nativa
 * chega ao `FieldError`.
 *
 * **Com `labels="hidden"` (rodada 244)** quem diz o nome é o placeholder — o
 * do rótulo, com "(opcional)" —, e o rótulo continua no DOM para o leitor de
 * tela. O flutuante, a lista agrupada e a de ajustes foram vistos lado a lado
 * e saíram a pedido do dono (244b).
 *
 * **O `hidden`, o `icon` e o `clearable` pedem um `<input>` como filho** — o
 * `FormInput`. Num `Select` ou `Combobox` o placeholder e o recuo cairiam na
 * raiz, e o nome não apareceria; com um rótulo que não é texto, não há
 * placeholder a escrever. E `icon`/`clearable` se decidem na montagem: ligar
 * um deles depois põe a caixa em volta do campo, e o campo remonta.
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

/** Uma opção. `description` e `trailing` não aparecem na ficha (`chip`). */
type FormRadioOption = {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  /** O ícone da opção (rodada 197). */
  icon?: React.ReactNode
  /** O valor na outra ponta (rodada 197). */
  trailing?: React.ReactNode
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
 * A linha de preferência (rodada 214): rótulo e descrição à esquerda, o
 * `Switch` à direita, e a **linha inteira** liga e desliga — o `::after` do
 * rótulo cobre a linha, e um `<label for>` aciona o botão. A tela de
 * notificações a escrevia à mão, com borda e fundo literais e um `gap` entre
 * título e descrição (par de identidade: sem `gap`).
 *
 * `variant="card"` é a linha emoldurada, para preferências soltas numa página;
 * `plain` é a de dentro de um `Card` ou de uma lista.
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
 * A fileira de ações.
 *
 * `flex-col-reverse` no telefone põe a ação principal em cima mantendo a ordem
 * do DOM (cancelar antes de enviar) — a mesma decisão do `DialogFooter`, e a
 * razão é a mesma.
 *
 * **`sticky` é o rodapé fixo de uma folha**, e ele não desenha fio nem tinta: a
 * regra J. Quem marca a fronteira é o conteúdo dissolvendo na borda do
 * `DialogBody` logo acima. Também não traz área segura — ela é da
 * **superfície**; somar aqui dobraria o recuo.
 *
 * **`start`** (rodada 214) é a ação que encosta à esquerda — "Excluir",
 * "Voltar" —, a do `DialogFooter`: vem antes no DOM, então fica embaixo no
 * telefone.
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
  /**
   * O rótulo enquanto envia. Sem ele, sai do verbo do rótulo — "Salvar" vira
   * "Salvando…" —, e um rótulo que não começa por verbo não muda.
   */
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
 * O seletor ancorado num campo — e agora também o que vai dentro dele.
 *
 * **Mora no `form.tsx` desde a rodada 215**: ele só existe dentro de um
 * formulário (é o campo de categoria, de cartão), e a página dele é a do
 * `Form` — o precedente do `NativeSelect` no `select.tsx` e do `DragHandle`
 * no `drawer.tsx`.
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
 * As classes da região rolável do `FormPickerPopoverList`. Ela foi exportada
 * enquanto três telas a importavam ao lado de um `onWheel` à mão; as três
 * migraram para a peça, e a string ficou só dela.
 */
const formPickerListScrollClassName =
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
 * **O padrão desceu de `xl` para `md`**, na rodada do piso de toque. Ele era o
 * segundo padrão fora do passo — a página dele documentava `lg` enquanto o
 * código dizia `xl`, e nenhum dos dois era o `md` da família. Com o piso, no
 * telefone ele mede 40 de qualquer jeito; o que muda é o desktop, onde agora
 * ele alinha com o campo ao lado.
 */
function FormPickerPopoverTrigger({
  className,
  children,
  size = "md",
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
      // O seletor é um campo: desdobra dele (rodada 248).
      motion="field"
      // Abrir não rouba o foco **no toque**: ali isso fecharia o teclado do
      // telefone e faria a folha inteira saltar. Com mouse e teclado, o foco
      // entra — sem ele, quem navega por teclado no desktop não alcançava a
      // busca nem a lista. **Fechar** devolve o foco ao gatilho, como o Radix faz.
      onOpenAutoFocus={(e) => {
        if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
          e.preventDefault()
        }
        onOpenAutoFocus?.(e)
      }}
      padding="none"
      className={cn(
        "flex min-h-0 w-(--radix-popover-trigger-width) max-w-88 flex-col overflow-hidden",
        // O teto de lista suspensa, com a busca e o rodapé somados: 384px
        // deixam a lista nos ~288 dos outros dropdowns (rodada 174).
        "max-h-[min(var(--radix-popover-content-available-height),--spacing(96))]",
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
 * O campo é o `SearchInput`, e a faixa só o posiciona. Esta peça reimplementava
 * o mesmo campo — `InputGroup`, lupa, supressão do × do WebKit, × nosso — e a
 * cópia tinha ficado para trás: limpar a busca soltava o foco no `<body>`,
 * dentro de um diálogo modal, e quem estava no teclado perdia o lugar. Medido
 * no seletor de categoria da nova transação. O `SearchInput` devolve o foco ao
 * campo.
 *
 * Desde a rodada 198 ele veste `surface="plate"`: a pílula de vidro da
 * pilha do `Command`, a mesma do `Combobox`. Dentro da placa flutuante, um
 * campo preenchido era uma segunda superfície sobre ela.
 *
 * `className` continua indo para o `<input>`, como sempre foi aqui — por isso
 * ele chega como `inputClassName`.
 *
 * O `data-slot` da faixa não é enfeite — é por ele que o `CustomForm` sabe que
 * o Enter aqui não é "salvar". Ver `shouldDeferEnterToWidget` em `form.tsx`.
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
    <>
      <div
        ref={useScrollFade({ arrows: true })}
        data-slot="form-picker-popover-list"
        className={cn(
          formPickerListScrollClassName,
          // As duas pontas dissolvem, e o conteúdo passa **por trás** das faixas
          // em vez de parar numa borda — é isso que dá à rampa o que dissolver.
          //
          // A dissolução vai aqui e não na constante `formPickerListScrollClassName`
          // de propósito: quando as telas importavam a constante, uma delas com
          // máscara ligada mas sem a casca publicando `band-h` ganharia meio
          // tratamento — um fade começando 1px abaixo do fio escrito à mão, que
          // são os dois sinais que o sistema está tentando não ter juntos.
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
      <ScrollFadeArrows />
    </>
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
        // A linha alta, e não a cápsula da base: uma linha de 44 com 22 de
        // raio é pílula. E o realce é a camada do `Button`, na cor que ele
        // sempre teve — `hover:bg-*` pintaria por baixo dela, em duas camadas.
        "rounded-row-lg [--button-hover-fill:color-mix(in_oklab,var(--muted)_60%,transparent)]",
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
