"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDownIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid"

import { cn } from "@/lib/utils"
import { CharCountLive, contarCaracteres } from "@/lib/char-count"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import {
  fieldControlHeightClassName,
  fieldGroupDisabledClassName,
  fieldGroupFocusRingClassName,
  fieldGroupInvalidClassName,
  fieldSurfaceClassName,
  type FieldControlSize,
} from "@/lib/field-classes"
import { Input, type InputBaseProps } from "@/components/ui/input"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"
import { useScrollFade } from "@/hooks/use-scroll-fade"

/**
 * O grupo é um controle, então ele fala a escada do projeto.
 *
 * A altura era `h-8` cravada, com um comentário jurando 36px e citando um
 * `Button default` que não existe mais. Enquanto `Input`, `SelectTrigger`,
 * `NativeSelect` e `ComboboxTrigger` diziam `sm | md | lg | xl`, o grupo só
 * sabia uma altura — e um grupo ao lado de um campo `lg` não tinha como
 * alinhar sem alguém escrever `h-9` por fora.
 */
type InputGroupSize = FieldControlSize

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
  /** A senha à mostra (rodada 193): o `InputGroupPasswordToggle` escreve, o campo lê. */
  revealed: boolean
  setRevealed: (revealed: boolean) => void
}

const InputGroupContext = React.createContext<InputGroupContextValue>({
  size: "md",
  controlId: "",
  revealed: false,
  setRevealed: () => {},
})

function InputGroup({
  className,
  size = "md",
  pending = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  size?: InputGroupSize
  /**
   * Algo em andamento (rodada 193) — a busca, a verificação do e-mail. O
   * `Spinner` toma o lugar do addon da ponta enquanto dura, e o grupo marca
   * `aria-busy`. O addon escondido continua montado — sai com `hidden`, e não
   * desmonta —, então um botão ali não perde o estado durante a espera.
   */
  pending?: boolean
}) {
  const controlId = React.useId()
  const [revealed, setRevealed] = React.useState(false)
  const contexto = React.useMemo(
    () => ({ size, controlId, revealed, setRevealed }),
    [size, controlId, revealed]
  )

  return (
    <div
      data-slot="input-group"
      data-size={size}
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      role="group"
      // A moldura veste a superfície de campo direto (ela não tem `has-`), e
      // os três estados vêm das variantes `Group` da mesma régua — era a "quarta
      // ocorrência" do backlog, e já tinha divergido: faltava o
      // `dark:…border-destructive/50` do inválido e o cursor do desabilitado.
      className={cn(
        "group/input-group flex w-full min-w-0 items-center",
        fieldSurfaceClassName,
        fieldGroupFocusRingClassName,
        fieldGroupInvalidClassName,
        fieldGroupDisabledClassName,
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        // A altura vem do registro da família — era a quinta grafia da mesma
        // escada, e agora traz o piso de toque junto.
        //
        // **E ela tem de continuar sem prefixo de `data-size`.** Os escapes
        // logo acima (`has-[>textarea]:h-auto` e os dois `data-align`) são
        // (0,2,0) e vencem um `h-8` limpo, que é (0,1,0). Numa grafia
        // `data-[size=md]:h-8` os dois empatariam, e um textarea dentro do
        // grupo ficaria travado em 32px conforme a ordem de emissão.
        fieldControlHeightClassName[size],
        // Com bloco ou textarea o grupo cresce em altura e veste o raio do
        // `Textarea`, a linha alta (rodadas 240, 241h e 241p).
        "has-[>textarea]:rounded-row-lg has-[>[data-align=block-end]]:rounded-row-lg has-[>[data-align=block-start]]:rounded-row-lg",
        pending && "[&>[data-align=inline-end]:not([data-pending])]:hidden",
        className
      )}
      {...props}
    >
      <InputGroupContext.Provider value={contexto}>
        {children}
        {pending ? (
          <InputGroupAddon align="inline-end" data-pending="">
            <Spinner size="sm" aria-hidden />
          </InputGroupAddon>
        ) : null}
      </InputGroupContext.Provider>
    </div>
  )
}

const inputGroupAddonVariants = cva(
  // Sem `group-data-[disabled=true]/input-group:opacity-50`: nada nunca marcou
  // `data-disabled` no grupo, e o apagamento do estado desligado já vem do
  // `has-disabled:opacity-50` da moldura.
  // O que o `Label` já dá — `flex items-center gap-2 text-sm font-medium
  // select-none` — não se repete aqui. Fica o que é do addon.
  "h-auto cursor-text justify-center py-1.5 text-muted-foreground [&>svg:not([class*='size-'])]:size-4",
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
  children,
  ...props
}: React.ComponentProps<typeof Label> & VariantProps<typeof inputGroupAddonVariants>) {
  const { controlId } = React.useContext(InputGroupContext)
  const shared = {
    "data-slot": "input-group-addon",
    "data-align": align,
    className: cn(inputGroupAddonVariants({ align }), className),
    ...props,
  }

  // Um addon com botão não pode ser `<label for>`: o nome do botão entrava no
  // nome do campo ("Limpar busca" anunciado como o campo de busca), e botão
  // dentro de label não é HTML válido. Ele vira `<div>`, com a mesma régua.
  // ponytail: o controle é reconhecido pelo `onClick`/`aria-label` do filho
  // direto; um gatilho que não traga nenhum dos dois ainda cai no `<label>`,
  // onde o guarda de clique abaixo segura o foco.
  const temControle = React.Children.toArray(children).some(
    (c) =>
      React.isValidElement<{ onClick?: unknown; "aria-label"?: unknown }>(c) &&
      (typeof c.props.onClick === "function" || c.props["aria-label"] != null)
  )
  if (temControle) {
    return (
      <Label asChild {...shared}>
        <div>{children}</div>
      </Label>
    )
  }

  return (
    <Label
      // O `Label` do sistema, e não um `<div>` com `onClick`. O comportamento
      // sempre foi de rótulo — clicar foca o campo —, e num `<label htmlFor>`
      // quem faz isso é o navegador: sem JavaScript, com o texto do addon
      // nomeando o campo. Seis das oito classes do átomo já estavam escritas
      // aqui à mão; o que ele acrescenta é o `leading-none`.
      //
      // Sem `role="group"`. O addon é o rótulo de um controle, não uma região:
      // um grupo sem nome acessível dentro de outro grupo só acrescenta uma
      // fronteira que o leitor de tela anuncia e ninguém pediu — eram cinco
      // deles na página do catálogo.
      htmlFor={controlId}
      onClick={(e) => {
        // Um botão dentro do rótulo: o clique é dele, e sem isto o `<label>`
        // roubaria o foco para o campo no mesmo gesto.
        if ((e.target as HTMLElement).closest("button")) {
          e.preventDefault()
        }
      }}
      {...shared}
    >
      {children}
    </Label>
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
  type,
  maxLength,
  onChange,
  ...props
}: InputBaseProps & React.RefAttributes<HTMLInputElement>) {
  const { size, controlId, revealed } = React.useContext(InputGroupContext)
  const [digitados, setDigitados] = React.useState(
    String(props.defaultValue ?? "").length
  )
  const contagem = props.value !== undefined ? String(props.value).length : digitados

  const campo = (
    <Input
      // O `id` do grupo é o padrão; quem já tem um continua com o seu.
      id={props.id ?? controlId}
      // A senha à mostra vira texto; o resto do `type` passa intacto.
      type={type === "password" && revealed ? "text" : type}
      maxLength={maxLength}
      onChange={(e) => {
        setDigitados(e.target.value.length)
        onChange?.(e)
      }}
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

  if (maxLength === undefined) return campo
  return (
    <>
      {campo}
      <InputGroupCount count={contagem} max={maxLength} hideUntilNear />
    </>
  )
}

/**
 * A contagem do grupo (rodada 193), no addon da ponta: no campo de uma linha
 * ela só aparece perto do teto, como o `FieldCounter`; no textarea, embaixo e
 * sempre, como o do `Textarea`. A régua é `lib/char-count`. O número à vista é
 * `aria-hidden`, e quem fala é a região viva, só perto do teto.
 */
function InputGroupCount({
  count,
  max,
  hideUntilNear = false,
}: {
  count: number
  max: number
  hideUntilNear?: boolean
}) {
  const { restam, perto } = contarCaracteres(count, max)
  const visivel = perto || !hideUntilNear
  return (
    <>
      {visivel ? (
        <InputGroupAddon
          align={hideUntilNear ? "inline-end" : "block-end"}
          data-slot="input-group-count"
          className={hideUntilNear ? undefined : "justify-end"}
        >
          <InputGroupText
            aria-hidden
            className={cn("nums text-xs", perto && "text-warning-muted-foreground")}
          >
            {count}/{max}
          </InputGroupText>
        </InputGroupAddon>
      ) : null}
      <CharCountLive restam={restam} perto={perto} />
    </>
  )
}

/**
 * O olho da senha (rodada 193). O estado mora no grupo, e o
 * `InputGroupInput type="password"` vira texto sozinho — as quatro telas de
 * senha escreviam o botão, o `aria-pressed`, o rótulo que troca e um
 * `useState` por campo, seis vezes.
 */
function InputGroupPasswordToggle({
  showLabel = "Mostrar senha",
  hideLabel = "Ocultar senha",
}: {
  showLabel?: string
  hideLabel?: string
}) {
  const { revealed, setRevealed } = React.useContext(InputGroupContext)
  return (
    <InputGroupAddon align="inline-end">
      <InputGroupButton
        onClick={() => setRevealed(!revealed)}
        aria-label={revealed ? hideLabel : showLabel}
        aria-pressed={revealed}
      >
        {revealed ? <EyeSlashIcon /> : <EyeIcon />}
      </InputGroupButton>
    </InputGroupAddon>
  )
}

/**
 * O seletor colado no começo do campo (rodada 193) — o DDI de um telefone, a
 * moeda de um valor. É um `<select>` nativo, pela mesma razão do
 * `NativeSelect`: no telefone ele abre a roda do sistema. Ele é
 * `input-group-control` também, então o foco dele acende o anel do grupo; a
 * emenda com o campo é a borda da direita, na tinta da borda de campo. O texto
 * tem 16px no telefone, senão o iOS dá zoom ao tocar. Precisa de `aria-label`:
 * ele não tem rótulo visível.
 */
function InputGroupSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select"> & { "aria-label": string }) {
  return (
    <div
      data-slot="input-group-select"
      className="relative order-first flex items-center self-stretch border-e border-input"
    >
      <select
        data-slot="input-group-control"
        className={cn(
          "h-full cursor-pointer appearance-none bg-transparent ps-3 pe-7 text-base text-foreground outline-none md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute end-2 size-4 text-muted-foreground"
      />
    </div>
  )
}

function InputGroupTextarea({
  className,
  ref,
  ...props
}: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const { controlId } = React.useContext(InputGroupContext)
  const [digitados, setDigitados] = React.useState(
    String(props.defaultValue ?? "").length
  )
  const contagem = props.value !== undefined ? String(props.value).length : digitados
  // Com teto, o campo rola, e aqui ele pode dissolver: quem pinta a borda e o
  // preenchimento é o grupo, e o textarea é transparente — a máscara não apaga
  // nada que devia ficar (rodada 180).
  const fadeRef = useScrollFade()
  const temTeto = props.maxRows !== undefined
  const setRefs = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      const limparFade = temTeto ? fadeRef(el) : undefined
      const limparRef = typeof ref === "function" ? ref(el) : undefined
      if (ref && typeof ref !== "function") ref.current = el
      return () => {
        limparFade?.()
        if (typeof limparRef === "function") limparRef()
        else if (typeof ref === "function") ref(null)
        else if (ref) ref.current = null
      }
    },
    [fadeRef, temTeto, ref]
  )

  const campo = (
    <Textarea
      ref={setRefs}
      // O contador do `Textarea` embrulharia o campo numa `div`, e o grupo
      // deixaria de vê-lo como filho (`has-[>textarea]`): travaria na altura
      // de uma linha. Aqui a contagem é um addon do grupo (rodada 193).
      showCount={false}
      // Mesmo contrato do campo de uma linha: o addon de bloco embaixo de um
      // textarea é o `<label>` deste controle.
      id={props.id ?? controlId}
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        temTeto && "scroll-fade-y",
        className
      )}
      {...props}
      // Depois do spread, para contar e ainda chamar o da tela.
      onChange={(e) => {
        setDigitados(e.target.value.length)
        props.onChange?.(e)
      }}
    />
  )

  if (props.maxLength === undefined) return campo
  return (
    <>
      {campo}
      <InputGroupCount count={contagem} max={props.maxLength} />
    </>
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupPasswordToggle,
  InputGroupSelect,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
