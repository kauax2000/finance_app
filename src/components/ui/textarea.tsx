"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  fieldControlPaddingClassName,
  fieldDisabledClassName,
  fieldFocusRingClassName,
  fieldInvalidClassName,
  fieldSurfaceClassName,
  type FieldControlSize,
} from "@/lib/field-classes"

/**
 * O campo de mais de uma linha.
 *
 * ## O degrau **não mede altura aqui**
 *
 * A altura vem de `field-sizing-content` — ela cresce com o conteúdo, e um
 * `h-*` brigaria com ela. O que o degrau carrega é o recuo e, no `sm`, o corpo
 * do texto, para um `FormTextarea` poder ficar ao lado de um
 * `FormInput size="lg"` falando o mesmo nome.
 *
 * ## A altura se diz em linhas (rodada 180)
 *
 * `field-sizing-content` **ignora `rows`** — medido: `rows={3}` e `rows={10}`
 * dão a mesma caixa. Quem manda é `minRows` (o piso, 64px sem ele) e
 * `maxRows` (o teto: dali em diante o campo rola). As duas são `lh` da
 * própria caixa mais o recuo e a borda, então acompanham o corpo do texto.
 *
 * O teto **não dissolve aqui**: a máscara recorta o elemento inteiro, e o
 * textarea pinta a própria borda e o preenchimento — a dissolução os apagaria
 * junto (a invariante da primitiva: o elemento mascarado não desenha nada).
 * Dentro de um `InputGroup` quem pinta é o grupo, e ali o `InputGroupTextarea`
 * dissolve.
 *
 * ## Onde `field-sizing` não existe, um ajuste de altura em JS
 *
 * Firefox e Safari antigo não têm `field-sizing`, e o campo ficava no piso,
 * rolando. Lá — e só lá, perguntado por `CSS.supports` — a altura é
 * `scrollHeight` a cada digitação, e o teto continua sendo o `max-height`.
 *
 * ## `maxLength` traz o contador
 *
 * "42/280" embaixo, à direita, em âmbar nos últimos 10% (ou 20 caracteres, o
 * que for maior). O número é `aria-hidden`; quem fala é uma região viva que só
 * aparece nessa faixa ("Restam 12 caracteres") — anunciar cada tecla seria
 * ruído. `showCount={false}` o desliga.
 *
 * ## `resize` é do componente
 *
 * `none` (o padrão, porque o campo cresce sozinho) ou `vertical`. A alça do
 * navegador arrastava nos dois eixos e, arrastada, cravava uma altura que
 * desligava o crescimento.
 */
type TextareaProps = Omit<React.ComponentProps<"textarea">, "size"> & {
  size?: FieldControlSize
  /** O piso, em linhas. Sem ele, 64px. */
  minRows?: number
  /** O teto, em linhas: dali em diante o campo rola. */
  maxRows?: number
  /** Mostra "n/máx" quando há `maxLength`. */
  showCount?: boolean
  /** A alça de redimensionar. */
  resize?: "none" | "vertical"
}

/** A caixa em volta das linhas: `py-2` (16px) e a borda de 1px dos dois lados. */
const linhas = (n: number) => `calc(${n}lh + 1rem + 2px)`

const temFieldSizing = () =>
  typeof CSS !== "undefined" && CSS.supports("field-sizing", "content")

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size = "md",
      minRows,
      maxRows,
      showCount = true,
      resize = "none",
      style,
      onChange,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null)
    // Repassa a limpeza de um ref que a devolve (o do `useScrollFade`): sem
    // isso o React chamaria o ref com `null`, e os ouvintes ficariam vivos.
    const setRefs = React.useCallback(
      (el: HTMLTextAreaElement | null) => {
        innerRef.current = el
        if (typeof ref === "function") {
          const limpar = ref(el)
          if (typeof limpar === "function") return limpar
        } else if (ref) ref.current = el
      },
      [ref]
    )

    const inicial = String(props.value ?? props.defaultValue ?? "").length
    const [tamanho, setTamanho] = React.useState(inicial)
    const contagem = props.value !== undefined ? String(props.value).length : tamanho

    // Onde não há `field-sizing`, a altura segue o conteúdo por script.
    const ajustar = React.useCallback(() => {
      const el = innerRef.current
      if (!el || temFieldSizing()) return
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
    }, [])
    React.useLayoutEffect(ajustar, [ajustar, props.value])

    const campo = (
      <textarea
        ref={setRefs}
        data-slot="textarea"
        data-size={size}
        className={cn(
          fieldSurfaceClassName,
          fieldFocusRingClassName,
          fieldInvalidClassName,
          fieldDisabledClassName,
          "field-sizing-content flex w-full py-2 placeholder:text-muted-foreground",
          minRows === undefined && "min-h-16",
          maxRows !== undefined && "overflow-y-auto",
          resize === "none" ? "resize-none" : "resize-y",
          fieldControlPaddingClassName[size],
          className
        )}
        style={{
          ...(minRows !== undefined && { minHeight: linhas(minRows) }),
          ...(maxRows !== undefined && { maxHeight: linhas(maxRows) }),
          ...style,
        }}
        onChange={(e) => {
          setTamanho(e.target.value.length)
          ajustar()
          onChange?.(e)
        }}
        {...props}
      />
    )

    const max = props.maxLength
    if (max === undefined || !showCount) return campo

    const restam = max - contagem
    const perto = restam <= Math.max(20, Math.ceil(max * 0.1))
    return (
      <div data-slot="textarea-root" className="flex w-full flex-col gap-1.5">
        {campo}
        <p
          data-slot="textarea-count"
          aria-hidden
          className={cn(
            "nums self-end text-xs text-muted-foreground transition-colors",
            perto && "text-warning-muted-foreground"
          )}
        >
          {contagem}/{max}
        </p>
        <span className="sr-only" aria-live="polite">
          {perto ? `Restam ${restam} caracteres` : ""}
        </span>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
export type { TextareaProps }
