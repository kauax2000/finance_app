"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckIcon, MinusIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { CharCountLive, contarCaracteres } from "@/lib/char-count"
import { Label } from "@/components/ui/label"
import { Caption, Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"

/**
 * A estrutura de um campo e a ligação entre as peças dele: o `FieldControl`
 * escreve `htmlFor`, `id`, `aria-describedby` e `aria-invalid`. As peças se
 * registram, e o `aria-describedby` só é escrito quando existe alvo (apontar
 * para um `id` ausente deixa a descrição vazia, pior que não apontar). O
 * próprio `Field` carimba `data-invalid` e `data-disabled`.
 *
 * `orientation="responsive"` depende de `@md/field-group:` e exige um
 * `FieldGroup`, `FieldSet` ou `FieldRow` em volta: uma container query vale
 * para os descendentes do contêiner, e a direção do flex é declarada no próprio
 * `Field`. Sem um grupo, `responsive` se comporta como `vertical`.
 */

type FieldSize = "sm" | "md"

/**
 * O degrau do andaime (rótulo, descrição e erro), não a altura do controle: um
 * `Field` não sabe que controle carrega e não decide a caixa dele (ancorar a
 * escada no contêiner é o defeito que `Menubar` e `Tabs` já tiveram). Os nomes
 * são os da escada: `Field size="sm"` se escreve ao lado de `Input size="sm"`.
 */
const FieldSizeContext = React.createContext<FieldSize | null>(null)

/** A escada do andaime num lugar só, para poder ser lida por um teste (degraus em ternários espalhados não se comparam). */
const fieldTextScale = {
  sm: {
    label: "text-xs",
    title: "text-xs",
    description: "text-xs",
    error: "text-xs",
    legend: "text-sm",
  },
  md: {
    label: "text-sm",
    title: "text-sm",
    description: "text-sm",
    error: "text-sm",
    legend: "text-base",
  },
} as const satisfies Record<FieldSize, Record<string, string>>



type FieldContextValue = {
  controlId: string
  labelId: string
  descriptionId: string
  checklistId: string
  errorId: string
  invalid: boolean
  hasControl: boolean
  hasDescription: boolean
  hasChecklist: boolean
  hasError: boolean
  setHasControl: (present: boolean) => void
  /** O `id` explícito do controle, quando quem chama escreveu um. */
  setExplicitControlId: (id: string | null) => void
  setHasDescription: (present: boolean) => void
  setHasChecklist: (present: boolean) => void
  setHasError: (present: boolean) => void
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

/**
 * O degrau vigente: `Field`, `FieldSet`, `FieldGroup` e `FieldRow` o publicam,
 * então um formulário inteiro se declara uma vez. É contexto e não `data-*` com
 * `in-*`, que compila com `:where()` e perde para a classe base no mesmo
 * elemento.
 */
function useFieldSize(explicit?: FieldSize): FieldSize {
  const inherited = React.useContext(FieldSizeContext)
  return explicit ?? inherited ?? "md"
}

function FieldSet({
  className,
  size,
  ...props
}: React.ComponentProps<"fieldset"> & { size?: FieldSize }) {
  const resolved = useFieldSize(size)
  return (
    <FieldSizeContext.Provider value={resolved}>
      <fieldset
        data-slot="field-set"
        data-size={resolved}
        className={cn(
          "@container/field-group flex flex-col gap-4 has-[>[data-slot=radio-group]]:gap-3",
          className
        )}
        {...props}
      />
    </FieldSizeContext.Provider>
  )
}

/** A legenda de um conjunto. `variant="label"` segue o degrau em vez de cravar `text-sm`. */
function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  const size = useFieldSize()
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "font-medium",
        variant === "legend"
          ? fieldTextScale[size].legend
          : fieldTextScale[size].label,
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & { size?: FieldSize }) {
  const resolved = useFieldSize(size)
  return (
    <FieldSizeContext.Provider value={resolved}>
      <div
        data-slot="field-group"
        data-size={resolved}
        className={cn(
          "group/field-group @container/field-group flex w-full flex-col gap-5 *:data-[slot=field-group]:gap-4",
          className
        )}
        {...props}
      />
    </FieldSizeContext.Provider>
  )
}

/**
 * A linha de dois campos. Empilha no telefone (dois selects a 160px cada não
 * cabem) e declara o contêiner, então um `Field orientation="responsive"`
 * dentro dela também funciona.
 */
function FieldRow({
  className,
  size,
  stack = true,
  ...props
}: React.ComponentProps<"div"> & {
  size?: FieldSize
  /** `false`: os dois continuam lado a lado no telefone, para o par curto (MM/AAAA, DDD/número); não para dois selects. */
  stack?: boolean
}) {
  const resolved = useFieldSize(size)
  return (
    <FieldSizeContext.Provider value={resolved}>
      <div
        data-slot="field-row"
        data-size={resolved}
        className={cn(
          "@container/field-group grid w-full gap-4",
          stack ? "sm:grid-cols-2" : "grid-cols-2",
          className
        )}
        {...props}
      />
    </FieldSizeContext.Provider>
  )
}

/**
 * Os filhos diretos esticam até a largura do campo, menos os controles de
 * medida própria (`Switch`, `Checkbox`, `Radio`). Classe escrita por extenso:
 * o Tailwind varre o fonte como texto.
 */
const ESTICA_FILHOS =
  "*:not-data-[slot=switch]:not-data-[slot=checkbox]:not-data-[slot=radio]:w-full"

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        // `*:w-full` estica o controle até a coluna, menos os de medida própria
        // (um `Switch` esticado virava um trilho de 406px).
        vertical: `flex-col ${ESTICA_FILHOS} [&>.sr-only]:w-auto`,
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto *:data-[slot=field-title]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        // Exige `FieldGroup` / `FieldSet` / `FieldRow` em volta (ver o cabeçalho).
        responsive:
          `flex-col ${ESTICA_FILHOS} @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto @md/field-group:*:data-[slot=field-title]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

/**
 * Um campo. `role="group"` não é carimbado sempre: um papel sem nome é
 * anunciado como o papel, e num campo de um controle o grupo só faz ruído.
 * Passe `role="group"` (ou `radiogroup`) quando o `Field` de fato agrupa; aí
 * o `aria-labelledby` aponta para o `FieldLabel`.
 */
function Field({
  className,
  orientation = "vertical",
  size,
  invalid,
  disabled,
  role,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof fieldVariants> & {
    size?: FieldSize
    /** O estado inválido quando ele não vem de um `FieldError` (validação que mora fora do campo). */
    invalid?: boolean
    disabled?: boolean
  }) {
  const reactId = React.useId()
  const resolvedSize = useFieldSize(size)
  const [hasControl, setHasControl] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)
  const [hasChecklist, setHasChecklist] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [explicitControlId, setExplicitControlId] = React.useState<string | null>(null)

  const isInvalid = invalid ?? hasError

  const field = React.useMemo<FieldContextValue>(
    () => ({
      // Um `id` escrito no controle vence o gerado, e o rótulo precisa saber disso.
      controlId: explicitControlId ?? `${reactId}-control`,
      labelId: `${reactId}-label`,
      descriptionId: `${reactId}-description`,
      checklistId: `${reactId}-checklist`,
      errorId: `${reactId}-error`,
      invalid: isInvalid,
      hasControl,
      hasDescription,
      hasChecklist,
      hasError,
      setHasControl,
      setExplicitControlId,
      setHasDescription,
      setHasChecklist,
      setHasError,
    }),
    [reactId, explicitControlId, isInvalid, hasControl, hasDescription, hasChecklist, hasError]
  )

  return (
    <FieldSizeContext.Provider value={resolvedSize}>
      <FieldContext.Provider value={field}>
        <div
          data-slot="field"
          data-orientation={orientation}
          data-size={resolvedSize}
          data-invalid={isInvalid || undefined}
          data-disabled={disabled || undefined}
          role={role}
          // Um papel sem nome não diz nada: só nomeia quando há papel.
          aria-labelledby={role ? (ariaLabelledBy ?? field.labelId) : ariaLabelledBy}
          className={cn(fieldVariants({ orientation }), className)}
          {...props}
        />
      </FieldContext.Provider>
    </FieldSizeContext.Provider>
  )
}

/**
 * O controle do campo: injeta `id`, `aria-describedby` e `aria-invalid` no
 * filho único. É um embrulho explícito e não um hook no `Input`, porque um
 * `Field` pode conter mais de um controle (dois reivindicariam o mesmo `id`).
 *
 * Embrulha o controle e não a raiz do Radix: `Select.Root` e `RadioGroup.Root`
 * não viram DOM ou não repassam `id` ao gatilho, então o embrulho vai no
 * gatilho (`<Select><FieldControl><SelectTrigger/></FieldControl>…`). Vale igual
 * para o `InputGroup`: o embrulho vai no `InputGroupInput`, senão o `id` pousa
 * na `div` do grupo.
 *
 * `cloneElement` e não `Slot`: o `Slot` deixa o filho vencer conflitos, e um
 * controle com `aria-describedby` próprio perderia calado o da descrição e o do
 * erro. Aqui os três são compostos, na ordem de leitura.
 */
function FieldControl({ children }: { children: React.ReactNode }) {
  const field = React.useContext(FieldContext)
  const setHasControl = field?.setHasControl
  const setExplicitControlId = field?.setExplicitControlId
  const explicitId = React.isValidElement(children)
    ? ((children.props as { id?: string }).id ?? null)
    : null

  React.useEffect(() => {
    if (!setHasControl) return
    setHasControl(true)
    return () => setHasControl(false)
  }, [setHasControl])

  React.useEffect(() => {
    if (!setExplicitControlId) return
    setExplicitControlId(explicitId)
    return () => setExplicitControlId(null)
  }, [setExplicitControlId, explicitId])

  if (!field) {
    return <>{children}</>
  }

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>
  >
  const childProps = child.props

  const describedBy = [
    childProps["aria-describedby"] as string | undefined,
    field.hasDescription ? field.descriptionId : undefined,
    field.hasChecklist ? field.checklistId : undefined,
    field.hasError ? field.errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ")

  return React.cloneElement(child, {
    id: (childProps.id as string | undefined) ?? field.controlId,
    "aria-describedby": describedBy || undefined,
    "aria-invalid":
      (childProps["aria-invalid"] as boolean | undefined) ??
      (field.invalid || undefined),
  })
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      // `gap-0`: título sobre descrição é par de identidade, separado pela entrelinha.
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0 leading-snug",
        className
      )}
      {...props}
    />
  )
}

/**
 * O rótulo. O `htmlFor` sai sozinho, só quando existe um `FieldControl` (apontar
 * para um `id` ausente deixa o rótulo órfão); um `htmlFor` explícito vence.
 * `optional` escreve o marcador de campo dispensável: a convenção do app é
 * invertida, marca-se o opcional.
 */
function FieldLabel({
  className,
  htmlFor,
  id,
  optional,
  children,
  ...props
}: React.ComponentProps<typeof Label> & { optional?: boolean }) {
  const field = React.useContext(FieldContext)
  const size = useFieldSize()

  return (
    <Label
      data-slot="field-label"
      id={id ?? field?.labelId}
      htmlFor={htmlFor ?? (field?.hasControl ? field.controlId : undefined)}
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        // O cartão de escolha: um `FieldLabel` que embrulha outro `Field` vira o
        // alvo inteiro. O contorno é `primary-accent` a 60% (traço com alfa é
        // sempre acento; 60% é o primeiro degrau que alcança 3:1 nos dois
        // temas). O realce tem par `active:`, porque `hover:` compila dentro de
        // `@media (hover: hover)`.
        "has-data-checked:border-primary-accent/60 has-data-checked:bg-primary/5 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-row-lg has-[>[data-slot=field]]:border",
        "has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:active:bg-muted/50",
        "has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/45",
        "*:data-[slot=field]:p-2.5",
        fieldTextScale[size].label,
        className
      )}
      {...props}
    >
      {children}
      {optional ? <FieldOptionalMark /> : null}
    </Label>
  )
}

/** A marca do campo dispensável, dividida pelo `FieldLabel` (controle) e pelo `FieldTitle` (grupo). */
function FieldOptionalMark() {
  return (
    <span data-slot="field-optional" className="font-normal text-muted-foreground">
      (opcional)
    </span>
  )
}

/**
 * O título de um campo que não é um `<label>`: o que rotula um grupo. Usa
 * `data-slot="field-title"` para os seletores o distinguirem do `field-label`.
 */
function FieldTitle({
  className,
  id,
  optional,
  children,
  ...props
}: React.ComponentProps<"div"> & { optional?: boolean }) {
  const size = useFieldSize()
  const field = React.useContext(FieldContext)
  return (
    <div
      // O `aria-labelledby` do grupo aponta para o `labelId`; sem este `id` o grupo ficava sem nome.
      id={id ?? field?.labelId}
      data-slot="field-title"
      className={cn(
        "flex w-fit items-center gap-2 font-medium group-data-[disabled=true]/field:opacity-50",
        fieldTextScale[size].title,
        className
      )}
      {...props}
    >
      {children}
      {optional ? <FieldOptionalMark /> : null}
    </div>
  )
}

/** O texto de ajuda. O respiro é do contêiner (sem margens negativas corrigindo a geometria de outra peça por seletor). */
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  const field = React.useContext(FieldContext)
  const size = useFieldSize()
  const setHasDescription = field?.setHasDescription

  React.useEffect(() => {
    if (!setHasDescription) return
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [setHasDescription])

  return (
    <Muted
      data-slot="field-description"
      id={field?.descriptionId}
      // A escada do `Field` vence o `text-sm` do átomo por `cn()`.
      className={cn(
        "text-left leading-normal font-normal group-has-data-horizontal/field:text-balance",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a]:hover:text-primary-accent",
        fieldTextScale[size].description,
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  // O rótulo do meio é do `Separator`; aqui ficam só o corpo do texto e o respiro do campo.
  if (children) {
    return (
      <Separator
        data-slot="field-separator"
        data-content
        className={cn("-my-2 h-5 gap-2 text-sm font-normal", className)}
        {...(props as React.ComponentProps<typeof Separator>)}
      >
        {children}
      </Separator>
    )
  }
  return (
    <div
      data-slot="field-separator"
      data-content={false}
      className={cn("-my-2 flex h-5 items-center", className)}
      {...props}
    >
      <Separator />
    </div>
  )
}

/**
 * O rótulo e o que mora à direita dele (o "Esqueceu a senha?", o contador). O
 * vizinho fica fora do `<label>`, senão clicar num link também focaria o campo.
 * Linha de base, porque rótulo e link têm corpos diferentes.
 */
function FieldHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-header"
      className={cn("flex items-baseline justify-between gap-2", className)}
      {...props}
    />
  )
}

/**
 * O contador de um campo de uma linha: visível só perto do teto (`lib/char-count`),
 * em âmbar, e anunciado uma vez por mudança pela região viva; o número à vista
 * é `aria-hidden`. Vai no `FieldHeader`.
 */
function FieldCounter({
  value,
  max,
  className,
}: {
  value: string
  max: number
  className?: string
}) {
  const { restam, perto } = contarCaracteres(value.length, max)
  return (
    <>
      {perto ? (
        <span
          data-slot="field-counter"
          aria-hidden
          className={cn("nums text-xs text-warning-muted-foreground", className)}
        >
          {value.length}/{max}
        </span>
      ) : null}
      <CharCountLive restam={restam} perto={perto} />
    </>
  )
}

/**
 * A lista viva de regras (✓ atendido, – falta, em duas colunas). É descrição do
 * controle (o `FieldControl` soma o `id` ao `aria-describedby`) e a região viva
 * é educada. O texto escondido diz o estado de cada regra, já que cor e ícone
 * não chegam ao leitor de tela.
 */
function FieldChecklist({
  items,
  title,
  className,
}: {
  items: ReadonlyArray<{ id?: string; label: React.ReactNode; met: boolean }>
  title?: React.ReactNode
  className?: string
}) {
  const field = React.useContext(FieldContext)
  const setHasChecklist = field?.setHasChecklist

  React.useEffect(() => {
    if (!setHasChecklist) return
    setHasChecklist(true)
    return () => setHasChecklist(false)
  }, [setHasChecklist])

  return (
    <div
      data-slot="field-checklist"
      id={field?.checklistId}
      className={cn("flex flex-col gap-2", className)}
    >
      {title ? <Caption>{title}</Caption> : null}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1" aria-live="polite">
        {items.map((item, i) => {
          const Icon = item.met ? CheckIcon : MinusIcon
          return (
            <li
              key={item.id ?? i}
              data-met={item.met || undefined}
              className={cn(
                "flex items-center gap-1.5 text-xs text-muted-foreground",
                "data-met:text-success-muted-foreground"
              )}
            >
              <Icon aria-hidden className="size-3 shrink-0" />
              <span>{item.label}</span>
              <span className="sr-only">{item.met ? " — atendido" : " — falta"}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** A mensagem de erro: renderizá-la carimba `data-invalid` no `Field` e `aria-invalid` no controle. */
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const field = React.useContext(FieldContext)
  const size = useFieldSize()

  const content = React.useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  const present = !!content
  const setHasError = field?.setHasError

  React.useEffect(() => {
    if (!setHasError) return
    setHasError(present)
    return () => setHasError(false)
  }, [setHasError, present])

  if (!present) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      id={field?.errorId}
      className={cn(
        "font-normal text-destructive",
        fieldTextScale[size].error,
        className
      )}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldChecklist,
  FieldContent,
  FieldControl,
  FieldCounter,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldHeader,
  FieldLabel,
  FieldLegend,
  FieldRow,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  fieldTextScale,
  fieldVariants,
  useFieldSize,
}
export type { FieldSize }
