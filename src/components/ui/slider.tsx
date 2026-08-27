"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

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
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const resolved = value ?? defaultValue
  const thumbCount =
    Array.isArray(resolved) && resolved.length > 0 ? resolved.length : 1

  return (
    <SliderPrimitive.Root
      data-slot="slider"
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
          data-slot="slider-range"
          // `h-full` no horizontal é o que faltava. O Radix posiciona a faixa
          // por `left`/`right` inline e não declara altura nenhuma — sem esta
          // classe ela mede 0.
          className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
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
            "focus-visible:ring-3 focus-visible:ring-ring/70 focus-visible:outline-hidden"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
