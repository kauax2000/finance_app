"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"

/**
 * A estrutura de um campo — e, agora, a ligação entre as peças dele.
 *
 * **O que este arquivo prometia e não fazia.** Três lugares do repositório
 * diziam que o `Field` entrega `htmlFor`, `aria-describedby` e `aria-invalid`
 * "já ligados": o `AGENTS.md`, o índice de busca do catálogo e a própria
 * página. Um quarto — `lib/field-classes.ts` — dizia o contrário, e era o que
 * estava certo: não havia `useId`, nem contexto, nem `aria-describedby` em
 * lugar nenhum.
 *
 * A prova mais dura estava na página do catálogo: **19 `htmlFor` escritos à
 * mão, 4 `aria-invalid` e 1 `aria-describedby`** em 313 linhas que anunciavam
 * os três como automáticos. No app a conta era **24 `aria-invalid` contra 5
 * `aria-describedby`** — campos marcados como inválidos cujo texto de erro
 * nunca chegava ao leitor de tela.
 *
 * O mecanismo é o que o `Popover` já usa nesta base: as peças **se registram**,
 * e o `aria-describedby` só é escrito quando existe alvo. Apontar para um `id`
 * ausente deixa a descrição vazia — pior que não apontar.
 *
 * ## Cinco seletores mortos saíram
 *
 * Todos da família "sobreviveu à remoção", que este projeto já nomeia (o
 * `in-data-[variant=dialog]` do `Command`):
 *
 * 1. `data-[invalid=true]:text-destructive` — ninguém escrevia `data-invalid`.
 *    Agora o próprio `Field` o carimba, e o seletor passa a valer.
 * 2. `group-data-[disabled=true]/field:opacity-50` — ninguém escrevia
 *    `data-disabled`. Idem: virou o prop `disabled`.
 * 3. `has-[>[data-slot=checkbox-group]]:gap-3` no `FieldSet` — **não existe**
 *    `data-slot="checkbox-group"` neste projeto. (`radio-group` existe, e fica.)
 * 4. `data-[slot=checkbox-group]:gap-3` no `FieldGroup` — o mesmo slot
 *    inexistente, e ainda testando o slot do **próprio** elemento, que é
 *    `field-group`.
 * 5. `group-data-[variant=outline]/field-group:-mb-2` no `FieldSeparator` —
 *    `FieldGroup` nunca teve prop `variant`.
 *
 * ## Um contêiner não consulta a si mesmo
 *
 * `orientation="responsive"` depende de `@md/field-group:`, e **exige um
 * `FieldGroup`, `FieldSet` ou `FieldRow` em volta**. Não é preguiça: uma
 * *container query* vale para os **descendentes** do contêiner, e a direção do
 * flex é declarada no próprio `Field`. Pôr `@container/field` aqui não faria
 * nada — a classe estaria no elemento que ela precisa consultar.
 *
 * Sem um grupo em volta, `responsive` se comporta como `vertical`. Está dito
 * aqui, na página do catálogo e na tabela de props, porque foi assim que ela
 * passou a existir sem nunca ter sido vista funcionando: `FieldGroup` tinha
 * **zero** usos, inclusive no catálogo.
 */

type FieldSize = "sm" | "md"

/**
 * O degrau do andaime — rótulo, descrição e erro. **Não é a altura do
 * controle.**
 *
 * Ancorar a escada de altura no contêiner é o defeito que este design system já
 * cometeu quatro vezes: `Menubar` entregou 24px, `Tabs` entregou 27, `Item`
 * teve dois degraus com a mesma string, `Calendar` prometeu 36 e mediu 28. Um
 * `Field` não sabe que controle carrega, e não decide a caixa dele.
 *
 * Os nomes são os da escada de propósito: `Field size="sm"` se escreve ao lado
 * de `Input size="sm"`.
 *
 * A contagem que o justifica: **29 `<Label className="text-xs">`** no app — os
 * formulários novos reduzem o rótulo, os antigos não — e **73 textos de ajuda
 * em `text-xs`/`text-2xs`** enquanto `FieldDescription` era `text-sm`. Um
 * degrau existindo sem nome.
 */
const FieldSizeContext = React.createContext<FieldSize | null>(null)

/**
 * A escada do andaime, num lugar só — para poder ser lida por um teste.
 *
 * Enquanto os degraus eram ternários espalhados por cinco componentes, não
 * havia como afirmar que eles diferiam. É o defeito que o `Item` teve
 * (`default` e `sm` com a **mesma string**) e que só apareceu quando a escada
 * virou um objeto inspecionável.
 */
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
  errorId: string
  invalid: boolean
  hasControl: boolean
  hasDescription: boolean
  hasError: boolean
  setHasControl: (present: boolean) => void
  setHasDescription: (present: boolean) => void
  setHasError: (present: boolean) => void
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

/**
 * O degrau vigente. `Field`, `FieldSet`, `FieldGroup` e `FieldRow` o publicam,
 * então um formulário inteiro se declara uma vez.
 *
 * Contexto, e não `data-*` com `in-*`: o `in-*` do Tailwind compila com
 * `:where()`, que **não soma especificidade**, e uma classe sob esse variante
 * perde para a classe base no mesmo elemento. O `Command` e o
 * `DescriptionList` já pagaram essa medição.
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

/**
 * A legenda de um conjunto.
 *
 * `variant="label"` passou a seguir o degrau em vez de cravar `text-sm`, e é o
 * que faltava para a peça servir: o app escreve **~50 cabeçalhos de seção** em
 * `text-xs font-medium` e nenhum deles usava `FieldLegend`, porque ela era
 * `text-base`/`text-sm`. Não foi preciso inventar um `FormSection` — a peça já
 * existia, com o corpo errado.
 */
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
 * A linha de dois campos.
 *
 * Existe porque o app a escreve **8 vezes em 4 grafias** —
 * `grid grid-cols-2 gap-3` (×3), `grid grid-cols-2 gap-2` (×2),
 * `grid gap-3 sm:grid-cols-2` e `grid gap-4 sm:grid-cols-2` (×2). Nas cinco
 * primeiras os campos **não empilham no telefone**: dois selects de dia de
 * fechamento a 160px cada, num aparelho de 375.
 *
 * Ela declara o contêiner, então um `Field orientation="responsive"` dentro de
 * uma linha também funciona.
 */
function FieldRow({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & { size?: FieldSize }) {
  const resolved = useFieldSize(size)
  return (
    <FieldSizeContext.Provider value={resolved}>
      <div
        data-slot="field-row"
        data-size={resolved}
        className={cn(
          "@container/field-group grid w-full gap-4 sm:grid-cols-2",
          className
        )}
        {...props}
      />
    </FieldSizeContext.Provider>
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto *:data-[slot=field-title]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        // Exige `FieldGroup` / `FieldSet` / `FieldRow` em volta — ver o
        // cabeçalho do arquivo. Um contêiner não consulta a si mesmo.
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto @md/field-group:*:data-[slot=field-title]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

/**
 * Um campo.
 *
 * **`role="group"` deixou de ser carimbado sempre.** Ele vinha em todo campo,
 * inclusive no de um controle só, e **sem nome** — a mesma medição que o
 * `Popover` registrou nesta base: um papel sem nome é anunciado como o papel, e
 * nada mais. Num campo de um controle o rótulo já está ligado ao controle, e o
 * grupo em volta não acrescenta informação nenhuma; só ruído.
 *
 * Passe `role="group"` (ou `radiogroup`) quando o `Field` de fato agrupa — um
 * `RadioGroup`, uma grade de cores, um par de controles. Aí ele sai **com
 * nome**: o `aria-labelledby` aponta para o `FieldLabel`, sozinho.
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
    /**
     * O estado inválido quando ele **não** vem de um `FieldError` — validação
     * que mora fora do campo. Com um `FieldError` renderizado, isto é
     * desnecessário: o `Field` percebe sozinho.
     */
    invalid?: boolean
    disabled?: boolean
  }) {
  const reactId = React.useId()
  const resolvedSize = useFieldSize(size)
  const [hasControl, setHasControl] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  const isInvalid = invalid ?? hasError

  const field = React.useMemo<FieldContextValue>(
    () => ({
      controlId: `${reactId}-control`,
      labelId: `${reactId}-label`,
      descriptionId: `${reactId}-description`,
      errorId: `${reactId}-error`,
      invalid: isInvalid,
      hasControl,
      hasDescription,
      hasError,
      setHasControl,
      setHasDescription,
      setHasError,
    }),
    [reactId, isInvalid, hasControl, hasDescription, hasError]
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
          // Um papel sem nome não diz nada. Só nomeia quando há papel — e o
          // nome é o rótulo que o contexto já conhece.
          aria-labelledby={role ? (ariaLabelledBy ?? field.labelId) : ariaLabelledBy}
          className={cn(fieldVariants({ orientation }), className)}
          {...props}
        />
      </FieldContext.Provider>
    </FieldSizeContext.Provider>
  )
}

/**
 * O controle do campo — e é ele que fecha a ligação.
 *
 * Injeta `id`, `aria-describedby` e `aria-invalid` no filho único.
 *
 * **Por que um embrulho explícito, e não um hook dentro do `Input`.** Um
 * `Field` pode conter mais de um controle: o app tem 8 linhas de dois campos
 * lado a lado. Um hook que lesse o contexto faria os dois reivindicarem o mesmo
 * `id`, e a reivindicação seria estado durante o render. O embrulho diz qual é
 * o controle, uma vez, sem ambiguidade — é o idioma que `Button asChild` e
 * `DialogClose asChild` já estabeleceram.
 *
 * **Ele embrulha o controle, e não a raiz do Radix.** `Select.Root`,
 * `RadioGroup.Root` e companhia ou não renderizam nó nenhum ou não repassam
 * `id` ao gatilho: `<FieldControl><Select>…</Select></FieldControl>` clona um
 * componente que não vira DOM, o `id` não chega a lugar nenhum, e o rótulo
 * passa a apontar para o vazio — exatamente o defeito que este arquivo existe
 * para eliminar, e que a demonstração do catálogo reproduziu antes de ser
 * medida. A forma certa põe o embrulho no gatilho:
 * `<Select><FieldControl><SelectTrigger/></FieldControl><SelectContent/></Select>`.
 * Vale igual para invólucro que **é** DOM: no `InputGroup` o embrulho vai no
 * `InputGroupInput`, senão o `id` pousa na `div` do grupo e o `<label for>`
 * aponta para um elemento que não é rotulável — ele existe, e não faz nada.
 *
 * **Por que `cloneElement` e não `Slot`.** O `Slot` do Radix resolve conflito
 * de prop com `{...slotProps, ...childProps}` — o filho vence. Para `id` isso é
 * o que se quer; para `aria-describedby` **não é**: um controle que já tenha o
 * próprio descritor perderia calado o da descrição e o do erro. Aqui os três
 * são **compostos**, na ordem em que devem ser lidos.
 */
function FieldControl({ children }: { children: React.ReactNode }) {
  const field = React.useContext(FieldContext)
  const setHasControl = field?.setHasControl

  React.useEffect(() => {
    if (!setHasControl) return
    setHasControl(true)
    return () => setHasControl(false)
  }, [setHasControl])

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
      // `gap-0`, e não `gap-0.5`. Título sobre descrição é **par de
      // identidade** — o mesmo dado em duas linhas —, e quem os separa é a
      // entrelinha. Dois pixels bastam para o par deixar de ler como uma coisa
      // só. Mesmo defeito que `ItemContent` e `StatCard` já corrigiram.
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0 leading-snug",
        className
      )}
      {...props}
    />
  )
}

/**
 * O rótulo.
 *
 * O `htmlFor` sai sozinho — **e só quando existe um `FieldControl`**. Apontar
 * para um `id` ausente deixa o rótulo órfão, que é o defeito que o `Popover`
 * já registrou. Um `htmlFor` explícito continua vencendo, para o rótulo que
 * aponta para outra coisa.
 *
 * `optional` escreve o marcador de campo dispensável. **A convenção deste app é
 * invertida** — marca-se o opcional, não o obrigatório: `bill-form-fields` faz
 * isso três vezes e `edit-profile-dialog` uma, todas digitando "(opcional)"
 * dentro do texto do rótulo. Codificar a convenção que existe é melhor que
 * inventar um asterisco que ninguém usa.
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
        // O cartão de escolha: um `FieldLabel` que embrulha outro `Field` vira
        // o alvo inteiro.
        //
        // O contorno é `primary-accent` a 60%, e os dois números são medidos.
        //
        // **O token**: no tema claro `--primary` e `--primary-accent` são a
        // mesma cor, então a troca não muda nada ali; no escuro elas divergem,
        // e a 30% o antigo dava 1,32:1 contra 1,64:1 do acento. "Traço com alfa
        // é sempre acento".
        //
        // **O alfa**: 30% não bastava em tema nenhum. Varrendo os degraus
        // contra o fundo real do cartão, 60% é o primeiro que alcança a norma
        // de traço não-textual — **3,01:1 no claro e 2,99:1 no escuro** —, e
        // 100% sobe para 7,66 / 6,14, que lê como borda de erro num cartão que
        // só está selecionado.
        //
        // E o realce tem par `active:` — sem ele, num alvo que é para o dedo,
        // o toque não responde: `hover:` compila dentro de `@media (hover:
        // hover)`.
        "has-data-checked:border-primary-accent/60 has-data-checked:bg-primary/5 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border",
        "has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-muted/50 has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:active:bg-muted/50",
        "has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/70",
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

/**
 * A marca do campo dispensável.
 *
 * Ela existe como peça porque **dois** rotuladores a usam: o `FieldLabel`, que
 * rotula um controle, e o `FieldTitle`, que rotula um grupo. Um grupo também
 * pode ser dispensável, e a convenção deste app é invertida — marca-se o
 * opcional, não o obrigatório.
 */
function FieldOptionalMark() {
  return (
    <span data-slot="field-optional" className="font-normal text-muted-foreground">
      (opcional)
    </span>
  )
}

/**
 * O título de um campo que **não** é um `<label>` — o que rotula um grupo, e
 * não um controle.
 *
 * `data-slot="field-title"`, e não `field-label`. Os dois emitiam o mesmo slot,
 * e nenhum seletor conseguia distingui-los; os variantes de `orientation`
 * listam os dois agora.
 */
function FieldTitle({
  className,
  optional,
  children,
  ...props
}: React.ComponentProps<"div"> & { optional?: boolean }) {
  const size = useFieldSize()
  return (
    <div
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

/**
 * O texto de ajuda.
 *
 * As margens negativas saíram — `[[data-variant=legend]+&]:-mt-1.5` e
 * `nth-last-2:-mt-1` corrigiam a geometria de outra peça por seletor, e
 * "compensar geometria por seletor é sintoma de que falta uma peça". O respiro
 * é do contêiner.
 */
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
      // A escada do `Field` vence o `text-sm` do átomo por `cn()`, verificado.
      className={cn(
        "text-left leading-normal font-normal group-has-data-horizontal/field:text-balance",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary-accent",
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
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn("-my-2 flex h-5 items-center gap-2 text-sm", className)}
      {...props}
    >
      {/* Duas metades de linha com o rótulo entre elas, em vez de uma linha
          inteira com um retângulo por cima mascarando o meio. O retângulo
          pintava `bg-background`, que só acerta quando o separador está direto
          na página: dentro de um cartão, de um `Dialog` ou de um `Sheet` ele
          desenhava a cor da página sobre outra superfície. Sem fundo não há o
          que casar, e o separador funciona em qualquer lugar. */}
      <Separator className="flex-1" />
      {children && (
        <>
          <span
            className="shrink-0 text-muted-foreground"
            data-slot="field-separator-content"
          >
            {children}
          </span>
          <Separator className="flex-1" />
        </>
      )}
    </div>
  )
}

/**
 * A mensagem de erro. Ela **é** o que torna o campo inválido: renderizá-la
 * carimba `data-invalid` no `Field` e `aria-invalid` no controle. O app
 * escrevia os dois fatos à mão, em três dialetos de tipografia —
 * `text-sm font-normal`, `text-control-sm font-medium` e `text-sm font-medium`.
 */
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
  FieldContent,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
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
