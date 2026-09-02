"use client"

import * as React from "react"
import { CheckIcon } from "@heroicons/react/16/solid"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Progresso por etapas de um fluxo.
 *
 * ## A lista assume o que é dela
 *
 * `StepperItem` recebia `step` (o número) e `isLast` como props, com
 * `Omit<…, "children">`. Os dois são exatamente o que o **pai** sabe e o filho
 * não: o índice e o fim da lista. Quem chamava tinha de escrever
 * `step={i + 1}` e `isLast={i === ETAPAS.length - 1}` em toda chamada, e errar
 * o segundo desenhava um conector para lugar nenhum.
 *
 * É a mesma correção que a `BreadcrumbList` recebeu ao assumir os separadores:
 * o contêiner deriva do índice, e o item volta a aceitar `children`.
 *
 * ## A trilha alcança a borda
 *
 * Todos os itens eram `flex-1`, inclusive o último — que não desenha conector.
 * Medido: quatro itens de 218px, e o último ocupando os mesmos 218 para mostrar
 * um marcador de 24. Sobravam **~192px de vão morto**, e a trilha parava a 78%
 * da largura. Agora o último é `flex-none` e os conectores absorvem a sobra.
 *
 * ## O estado chega ao leitor de tela
 *
 * `data-state` não é lido por tecnologia assistiva, e o tique é `aria-hidden`:
 * uma etapa concluída e uma futura soavam idênticas — a informação existia só em
 * cor e ícone. Cada item passa a carregar o estado em `sr-only`.
 */

type StepState = "complete" | "current" | "upcoming"

type StepperOrientation = "horizontal" | "vertical"
type StepperSize = "sm" | "md"

const ESTADO_EM_PALAVRAS: Record<StepState, string> = {
  complete: "concluída",
  current: "etapa atual",
  upcoming: "não iniciada",
}

const MARCADOR: Record<StepperSize, string> = {
  sm: "size-5 text-2xs",
  md: "size-6 text-2xs",
}

/**
 * A medida do marcador, publicada como variável para o **rótulo** poder se
 * centrar nela. Sem isto o alinhamento seria um número repetido em dois lugares
 * que precisam concordar — e o segundo a mudar sairia de sincronia calado.
 */
const MARCADOR_VAR: Record<StepperSize, string> = {
  sm: "[--stepper-marker:--spacing(5)]",
  md: "[--stepper-marker:--spacing(6)]",
}

const StepperContext = React.createContext<{
  orientation: StepperOrientation
  size: StepperSize
}>({ orientation: "horizontal", size: "md" })

function Stepper({
  className,
  children,
  orientation = "horizontal",
  size = "md",
  ...props
}: Omit<React.ComponentProps<"ol">, "children"> & {
  children?: React.ReactNode
  orientation?: StepperOrientation
  size?: StepperSize
}) {
  const itens = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <StepperContext.Provider value={{ orientation, size }}>
      <ol
        data-slot="stepper"
        data-orientation={orientation}
        data-size={size}
        className={cn(
          "flex w-full",
          MARCADOR_VAR[size],
          orientation === "horizontal"
            ? "items-start gap-2"
            : "flex-col gap-0",
          className
        )}
        {...props}
      >
        {itens.map((item, i) =>
          React.cloneElement(
            item as React.ReactElement<{ step?: number; isLast?: boolean }>,
            { step: i + 1, isLast: i === itens.length - 1 }
          )
        )}
      </ol>
    </StepperContext.Provider>
  )
}

function StepperItem({
  className,
  state = "upcoming",
  step,
  label,
  isLast = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  state?: StepState
  /**
   * O número do marcador. **A `Stepper` o preenche a partir do índice** — só
   * passe à mão numa lista que não começa em 1.
   */
  step?: number
  /** Atalho para `children`, quando o rótulo é só texto. */
  label?: string
  /** Preenchido pela `Stepper`. */
  isLast?: boolean
  asChild?: boolean
}) {
  const { orientation, size } = React.useContext(StepperContext)
  const vertical = orientation === "vertical"

  // Com `asChild`, `children` **é** o botão ou o link, e o rótulo são os
  // filhos dele. Sem, `children` é o próprio rótulo.
  //
  // O `Slot` do Radix exige um filho único, e a linha da etapa tem três
  // (marcador, estado audível, rótulo ou conector). Então o embrulho desce um
  // nível: clona-se o elemento de quem chama e injeta-se a linha como filhos
  // **dele**. É a mesma mecânica que o `Button` usa para embrulhar o rótulo sob
  // `asChild`.
  const elementoFilho =
    asChild && React.isValidElement(children)
      ? (children as React.ReactElement<{ children?: React.ReactNode }>)
      : null
  const conteudo = elementoFilho
    ? elementoFilho.props.children
    : (children ?? label)

  // A **linha do marcador**: marcador, estado audível e, na horizontal, o
  // conector que puxa até o próximo passo.
  const linhaMarcador = (
    <span
      className={cn(
        "flex min-w-0",
        vertical ? "items-start gap-3" : "items-center gap-2"
      )}
    >
      <span
        data-slot="stepper-marker"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border font-medium transition-colors",
          MARCADOR[size],
          state === "complete" &&
            "border-transparent bg-primary text-primary-foreground",
          state === "current" &&
            "border-primary-accent bg-primary/10 text-primary-accent",
          state === "upcoming" &&
            "border-border bg-transparent text-muted-foreground"
        )}
      >
        {state === "complete" ? (
          <CheckIcon className="size-3.5" aria-hidden />
        ) : (
          step
        )}
      </span>

      {vertical ? (
        <span
          data-slot="stepper-label"
          className={cn(
            // **Centrado no marcador, e não alinhado ao topo dele.** A linha é
            // `items-start`, e o marcador (24) é mais alto que a caixa de uma
            // linha de texto (20): os topos coincidiam e os centros ficavam a
            // **2px** um do outro — medido, e igual nos quatro degraus, que é a
            // assinatura de um desalinhamento sistemático e não de um acaso.
            //
            // `min-h` do marcador mais `items-center` acerta o caso de uma
            // linha, que é o comum. Com duas, o bloco volta a alinhar pelo topo,
            // que é o que se quer: um rótulo que quebra não deve empurrar o
            // marcador para o meio do parágrafo.
            "flex min-h-(--stepper-marker) min-w-0 items-center",
            "truncate text-sm",
            state === "upcoming" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {conteudo}
        </span>
      ) : !isLast ? (
        <span
          className={cn(
            "h-px flex-1",
            state === "complete" ? "bg-primary" : "bg-border"
          )}
          aria-hidden
        />
      ) : null}
    </span>
  )

  /**
   * O corpo é **tudo**: a linha do marcador mais o rótulo. Sob `asChild` ele
   * inteiro vira o botão, e é por isso que o rótulo não pode viver fora dele —
   * com o rótulo de fora, o nome acessível do botão saía "concluída" em vez de
   * "Conta, concluída", e a área clicável era o marcador e o fio.
   */
  const corpo = (
    <>
      {linhaMarcador}

      {/* Na vertical o conector é o segmento entre um marcador e o seguinte, e
          fica fora da linha do rótulo: alinhado à coluna do marcador. */}
      {vertical && !isLast ? (
        <span
          aria-hidden
          className={cn(
            // O recuo **deriva do marcador**, e desconta a espessura do próprio
            // fio. Era `ms-2.5`/`ms-3` — meia largura escrita à mão por degrau
            // —, e por isso o fio de 1px caía com o centro **1px à direita** do
            // centro do marcador, medido nos três conectores. Meia largura
            // menos meio fio é o que faz os dois centros coincidirem.
            "my-1 h-6 w-px shrink-0 ms-[calc((var(--stepper-marker)_-_1px)/2)]",
            state === "complete" ? "bg-primary" : "bg-border"
          )}
        />
      ) : null}

      {!vertical && conteudo ? (
        <span
          data-slot="stepper-label"
          className={cn(
            // `hidden` tirava o rótulo da árvore de acessibilidade no telefone:
            // quem enxerga via "1 2 3" e entende pela largura; quem usa leitor
            // ouvia "1 2 3" e mais nada. `sr-only` esconde do olho e mantém no
            // leitor, que é o que "esconder no mobile" queria dizer.
            //
            // A saída de verdade para o telefone é `orientation="vertical"`,
            // que mostra o nome de cada etapa em vez de escondê-lo.
            "sr-only text-xs sm:not-sr-only sm:block",
            // **Centrado no marcador, e não na célula.** Ele era `block` e
            // ocupava a célula inteira — 278px medidos —, com o texto rente à
            // esquerda: o centro da caixa ficava a **127px** do centro do
            // marcador, e o olho lia a palavra pendurada no círculo em vez de
            // presa a ele.
            //
            // `w-max` mais meia largura do marcador e meia da palavra é o que
            // centra os dois.
            //
            // **A primeira é a exceção, e é geometria e não gosto:** o marcador
            // dela encosta na borda esquerda da trilha, então centrar a palavra
            // a faria sair para fora. A última não precisa da exceção porque a
            // trilha deixa folga ali — medido, 13px, contra os ~6 que "Pronto"
            // pediria.
            //
            // A condição é `step === 1`, e não `first:`: o rótulo **não é** o
            // primeiro filho do corpo (o marcador é), então o variante não
            // casaria com nada. A posição é informação que o componente já tem.
            "sm:w-max sm:ms-[calc(var(--stepper-marker)/2)] sm:-translate-x-1/2",
            step === 1 && "sm:ms-0 sm:translate-x-0",
            state === "upcoming" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {conteudo}
        </span>
      ) : null}

      {/* O estado só existia em cor e ícone: `data-state` não chega a leitor de
          tela nenhum, e o tique é `aria-hidden`. Ele vem **depois** do rótulo
          para o anúncio sair "Conta, concluída" e não "concluída, Conta" — e,
          dentro do corpo clicável, ele entra no nome acessível do botão. */}
      <span className="sr-only">{ESTADO_EM_PALAVRAS[state]}</span>
    </>
  )

  const corpoClassName = cn(
    "flex min-w-0 flex-col",
    !vertical && "gap-1.5",
    // Só quando a etapa navega. O par `active:` não é cortesia: `hover:`
    // compila dentro de `@media (hover: hover)` e não existe no telefone.
    asChild &&
      "rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/70 [&_[data-slot=stepper-label]]:hover:text-foreground [&_[data-slot=stepper-label]]:active:text-foreground"
  )

  return (
    <li
      data-slot="stepper-item"
      data-state={state}
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "flex min-w-0 flex-col",
        // O último não estica. Sem isto ele reserva a largura de um item
        // inteiro para mostrar um marcador de 24px: medido, ~192px de vão morto
        // à direita, com a trilha parando a 78% da largura.
        !vertical && (isLast ? "flex-none" : "flex-1"),
        className
      )}
      {...props}
    >
      {elementoFilho ? (
        <Slot.Root className={corpoClassName}>
          {React.cloneElement(elementoFilho, undefined, corpo)}
        </Slot.Root>
      ) : (
        <div className={corpoClassName}>{corpo}</div>
      )}
    </li>
  )
}

export { Stepper, StepperItem }
export type { StepState }
