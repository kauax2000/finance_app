"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect"
import { cn } from "@/lib/utils"

/**
 * A faixa preenchida — o único lugar onde a marca entra.
 *
 * ## O arco-íris é do **trilho**, e a faixa é a janela que o revela
 *
 * O degradê tem a largura do trilho inteiro e fica atrás; a faixa preenchida
 * mostra só o pedaço dele que está por baixo. Em 15% a barra é **só teal**, e o
 * arco-íris só fica completo com a barra cheia. É a mesma leitura do
 * `Progress variant="brand"`, e por uma razão que se viu na tela: com o degradê
 * escalado à **faixa**, um valor baixo comprime as oito paradas em poucos
 * pixels e a peça lê como ruído colorido, não como marca.
 *
 * **A primeira versão desta variante fazia o contrário, e o texto dela afirmava
 * que a receita do trilho "não transplantava".** Essa conclusão estava certa
 * sobre um mecanismo e errada sobre a saída:
 *
 * 1. **Recalcular pelo `value` não serve** — e isto continua de pé. O
 *    `Progress` escala `background-size` por `10000 / pct` porque é sempre
 *    controlado e sabe a porcentagem no render. Um `Slider` costuma ser
 *    `defaultValue`: um valor calculado no render congelaria no inicial e
 *    erraria no primeiro arraste.
 * 2. **Mas dá para medir a caixa renderizada**, que é o padrão desta casa —
 *    o marcador do `Tabs`, o `useScrollFade`, o `--collapsible-full`. Medir
 *    funciona controlado ou não, em qualquer orientação, e não depende de
 *    refazer a conta do valor. É o que o efeito abaixo faz.
 *
 * **Sem JavaScript não há caminho**, e isso foi verificado por eliminação: o
 * arco-íris no `Track` com a faixa transparente pintaria também a parte não
 * preenchida (e não há elemento que cubra o complemento); um `::before` da
 * faixa tem a **própria faixa** como bloco contentor, não o trilho; um
 * `overflow-hidden` na faixa não recorta um absoluto ancorado acima dela na
 * cadeia de bloco contentor; e um `background-size` fixo em `rem` deixa trilho
 * sem pintura num slider largo. O Radix escreve `left`/`right` **inline**, e
 * CSS não lê o valor de outra propriedade.
 *
 * **Os fallbacks das `var()` são carga estrutural.** Antes da primeira medição
 * — e sem JavaScript — o `100%` faz o degradê preencher a faixa, que é
 * exatamente a versão anterior: a peça **degrada** em vez de derrubar a
 * declaração. É a mesma garantia que a rampa do `Command` explora, e a mesma
 * postura do `Tabs`, que sem JS ainda pinta o gatilho ativo.
 *
 * **Dois desvios conhecidos, e os dois são de ordem de cor, não de ancoragem.**
 * Num slider **vertical** o Radix preenche de baixo para cima e
 * `--brand-rainbow` é um `linear-gradient(135deg)` fixo, então o valor baixo
 * revela a **lima** (o fim do degradê) e não o teal; `inverted` e `dir="rtl"`
 * têm a mesma classe de desvio. A ancoragem continua correta nos três, porque
 * ela é **medida** e não deduzida do valor. `orientation="vertical"` não tem
 * consumidor no app.
 *
 * ## O texto nunca pousa aqui
 *
 * É a mesma isenção da invariante 3 que o `Progress` e o `Badge variant="brand"`
 * têm: sete matizes não têm um contraste só, e o que os liberta é não haver
 * rótulo em cima.
 *
 * **A divergência da 1.4.11 vem junto, e foi medida aqui** — não herdada de
 * papel. O trilho é `--input-fill`, o mesmo token do `Progress`, e por isso os
 * números do claro saem idênticos aos dele, o que é a confirmação de que os
 * dois dividem a peça:
 *
 *   escuro   trilho compositado rgb(58,58,58)    pior caso **3,40** (violeta)
 *            as oito paradas passam os 3:1
 *   claro    trilho compositado rgb(222,222,222) pior caso **1,42** (lima)
 *            **cinco reprovam** — lima 1,42, âmbar 1,51, teal 1,73,
 *            azul 1,87, coral 2,53
 *
 * Nota de método, porque ela custou uma medição errada: no escuro
 * `--input-fill` é `oklch(1 0 0 / 15%)`, **translúcido**, então medir contra o
 * token cru dá número sem sentido (deu 6 paradas reprovando). Ele tem de ser
 * compositado sobre a superfície de baixo — aqui o cartão — antes da razão.
 *
 * O leito preto que resolveria o claro já foi recusado na tela no `Progress`, e
 * recusá-lo aqui é a mesma decisão: uma peça que destoa das vizinhas não é o
 * desenho. O caminho de volta é o mesmo — uma declaração de `background-color`
 * no trilho.
 */
const sliderRangeVariants = cva(
  // `h-full` no horizontal é o que faltava. O Radix posiciona a faixa
  // por `left`/`right` inline e não declara altura nenhuma — sem esta
  // classe ela mede 0.
  "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
  {
    variants: {
      variant: {
        default: "bg-primary",
        // `brand-rainbow-image` não é decoração: é ela que declara
        // `--brand-rainbow` no elemento. Ver a rodada 88.
        //
        // `bg-no-repeat` não é zelo: a imagem tem a largura do **trilho**, e
        // numa faixa mais larga que ela (não acontece hoje, mas acontece com
        // `inverted`) o degradê ladrilharia.
        brand: [
          "brand-rainbow-image bg-(image:--brand-rainbow) bg-no-repeat",
          "data-[orientation=horizontal]:[background-size:var(--slider-rainbow-w,100%)_100%]",
          "data-[orientation=horizontal]:[background-position-x:var(--slider-rainbow-x,0px)]",
          "data-[orientation=vertical]:[background-size:100%_var(--slider-rainbow-h,100%)]",
          "data-[orientation=vertical]:[background-position-y:var(--slider-rainbow-y,0px)]",
        ].join(" "),
      },
    },
    defaultVariants: { variant: "default" },
  }
)

/**
 * O trilho de valor contínuo.
 *
 * O desenho é uma razão entre duas medidas: o trilho e o punho. A 6px de trilho
 * com 16px de punho a razão era 2,7 — o punho não lia como a ponta da barra, e
 * sim como um disco pousado sobre um fio. Agora são 8px e 14px, razão 1,75, e o
 * punho termina o preenchimento em vez de flutuar sobre ele.
 *
 * O que mais mudou a leitura não foi nenhuma das duas: a faixa preenchida
 * **não tinha altura**. `SliderPrimitive.Range` recebia `absolute` sem
 * `h-full`, então media 0px e nunca pintou. O trilho inteiro saía cinza nos dois
 * lados do punho, e sem o verde à esquerda o punho era a única coisa na peça —
 * daí boa parte da proeminência.
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant,
  thumbLabels,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> &
  VariantProps<typeof sliderRangeVariants> & {
    /** Nome de cada punho. Com dois, o padrão é "Valor mínimo" e "Valor máximo". */
    thumbLabels?: string[]
  }) {
  const resolved = value ?? defaultValue
  const thumbCount =
    Array.isArray(resolved) && resolved.length > 0 ? resolved.length : 1

  const trilhoRef = React.useRef<HTMLSpanElement | null>(null)
  const faixaRef = React.useRef<HTMLSpanElement | null>(null)

  /**
   * Prende a imagem do arco-íris ao **trilho**, medindo a caixa renderizada.
   *
   * Publica no trilho (o pai, como a trilha do `Tabs` publica), e os valores de
   * posição saem **já negados**, para a classe ser um `var()` puro em vez de um
   * `calc()` com sinal.
   *
   * `offsetLeft`/`offsetTop` são **relativos ao trilho** — e não
   * `getBoundingClientRect` —, que é a regra que o marcador do `Tabs` já
   * tranca: com a página rolada, o retângulo do viewport escorregaria.
   *
   * **Os dois observadores cobrem coisas diferentes.** O `ResizeObserver` pega
   * mudança de tamanho (a janela, a fonte, a faixa crescendo no arraste) e o
   * `MutationObserver` em `style` pega a faixa **andando sem mudar de
   * tamanho** — o Radix reescreve `left`/`right` inline, e é o caso do slider
   * de intervalo quando os dois punhos se movem juntos.
   *
   * Só em `brand`: um slider comum não ganha observador nenhum.
   */
  useIsomorphicLayoutEffect(() => {
    const trilho = trilhoRef.current
    const faixa = faixaRef.current
    if (variant !== "brand" || !trilho || !faixa) return

    const medir = () => {
      trilho.style.setProperty("--slider-rainbow-w", `${trilho.offsetWidth}px`)
      trilho.style.setProperty("--slider-rainbow-h", `${trilho.offsetHeight}px`)
      trilho.style.setProperty("--slider-rainbow-x", `${-faixa.offsetLeft}px`)
      trilho.style.setProperty("--slider-rainbow-y", `${-faixa.offsetTop}px`)
    }

    medir()

    const ro = new ResizeObserver(medir)
    ro.observe(trilho)
    ro.observe(faixa)

    const mo = new MutationObserver(medir)
    mo.observe(faixa, { attributes: true, attributeFilter: ["style"] })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [variant])

  // Quem tem papel de `slider` é o punho, não a raiz: o nome precisa chegar a
  // ele. Sem isto um punho único ficava sem nome, e o par recebia o
  // "Minimum"/"Maximum" em inglês do Radix.
  const nomeDoPunho = (index: number): string | undefined =>
    thumbLabels?.[index] ??
    (thumbCount === 1
      ? ariaLabel
      : thumbCount === 2
        ? index === 0
          ? "Valor mínimo"
          : "Valor máximo"
        : undefined)

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-variant={variant ?? "default"}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        // O estado desligado mora aqui, e não no punho: `disabled:` é a
        // pseudo-classe `:disabled`, que não existe em `<span>` — era o que o
        // punho declarava, e nunca valeu nada. O Radix marca `data-disabled` em
        // todas as partes; a raiz apaga a peça inteira de uma vez.
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        ref={trilhoRef}
        data-slot="slider-track"
        className={cn(
          "relative w-full grow overflow-hidden rounded-full",
          // O mesmo token do trilho desligado do `Switch`. Era `bg-muted`, que
          // no tema claro fica a meio ponto de cinza do cartão branco: o trilho
          // vazio quase não existia, e a barra parecia começar do nada. (Sem os
          // valores escritos aqui de propósito — o auditor lê comentário como
          // código, e um hex numa observação vira cor literal no relatório.)
          "bg-input-fill",
          "h-2 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        <SliderPrimitive.Range
          ref={faixaRef}
          data-slot="slider-range"
          className={sliderRangeVariants({ variant })}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={nomeDoPunho(index)}
          aria-labelledby={thumbCount === 1 && !ariaLabel ? ariaLabelledBy : undefined}
          className={cn(
            "relative block size-3.5 shrink-0 rounded-full border border-primary-accent/50 bg-background shadow-sm",
            // 44px de alvo sob um punho de 14 — o mínimo confortável de
            // Mobile e toque. O pseudo-elemento é a mesma saída do `Switch`:
            // ele cresce a área de contato sem crescer o desenho, e por ser
            // absoluto não empurra a altura da peça.
            "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2",
            // Só o anel transita. `transition-all` aqui seria seguro — quem se
            // move no arraste é o `<span>` de posição que embrulha o punho, não
            // o punho —, mas nomear a propriedade diz o que se anima.
            "transition-[box-shadow] duration-(--duration-fast) ease-(--ease-out)",
            // O halo de contato é da marca e baixo: o `ring-4` anterior vinha
            // na cor do anel de foco, então tocar o ponteiro no punho parecia
            // focá-lo. `active:` é o par de toque — no telefone `hover:` não
            // existe, e sem ele o arraste não tem resposta nenhuma.
            "ring-0 hover:ring-4 hover:ring-primary-accent/15 active:ring-4 active:ring-primary-accent/25",
            // O anel de foco do projeto: 3px em `--ring`, como no `Switch` e no
            // `Input`. Vem por último para vencer o halo.
            "focus-visible:ring-3 focus-visible:ring-ring/45 focus-visible:outline-hidden"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider, sliderRangeVariants }
