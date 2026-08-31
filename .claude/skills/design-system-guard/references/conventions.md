# O padrão de componente do Finance App

Ler antes de escrever qualquer arquivo em `src/components/ui/`. O objetivo é que
um componente novo seja indistinguível dos 73 que já existem.

## A forma

```tsx
"use client"                            // só se usar hook, estado ou evento

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const algoVariants = cva("classes que valem sempre", {
  variants: {
    tone: {
      default: "…",
      income: "…",
    },
  },
  defaultVariants: {
    tone: "default",
  },
})

/**
 * O que ele é no produto, e a decisão que não cabe numa prop.
 */
function Algo({
  className,
  tone,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof algoVariants>) {
  return (
    <div
      data-slot="algo"
      data-tone={tone ?? "default"}
      className={cn(algoVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Algo, algoVariants }
```

## As regras, e o porquê de cada uma

**`radix-ui` como primitivo.** O pacote é o barrel único (`import { Popover as
PopoverPrimitive } from "radix-ui"`), não `@radix-ui/react-popover`. Trinta
componentes já seguem isso. A única exceção deliberada é `combobox.tsx`, montado
sobre `Command` (cmdk) e `Popover` — a versão do registry vem sobre Base UI, e
trazê-la adicionaria uma segunda biblioteca de primitivos por causa de um
componente só.

**`asChild`, não `render`.** A composição do Radix neste projeto usa `asChild`
(104 ocorrências). `render` é a API do Base UI e não funciona aqui.

**`data-slot` em toda raiz.** É o gancho de teste, de CSS de terceiros e do
`shouldDeferEnterToWidget` do `CustomForm`. Um componente que use o Enter para
si **precisa** de um `data-slot` estável, senão o Enter dentro dele vai enviar o
formulário.

**`cn()` por último.** `cn(variants({…}), className)` — nessa ordem, para o
consumidor conseguir sobrescrever. Invertido, o `className` da tela perde para a
classe padrão e ninguém entende por quê.

**Estado no DOM, não só na classe.** `data-tone`, `data-size`, `data-state`. É o
que permite estilizar de fora e verificar num teste sem depender de nome de
classe do Tailwind.

**Tokens, zero literais.** Nenhum `#hex`, nenhum `bg-white`, nenhum
`text-gray-600`, nenhum `p-[13px]`. Se falta um token para o papel que a cor
cumpre, isso é proposta de `globals.css`, não desculpa para o literal.

**Toque junto com hover.** Toda superfície interativa que tem `hover:` precisa de
`active:` ou `group-active:`. `hover:` compila para `@media (hover: hover)` e não
existe no telefone.

**`Omit` quando o nome colide com o HTML.** `Input` declara
`Omit<React.ComponentProps<"input">, "size">` porque o `size` nativo é largura em
caracteres. Sem o `Omit`, o tipo vira a interseção dos dois e qualquer consumidor
que repasse props quebra.

**Nada de `forwardRef` em componente novo.** React 19 passa `ref` como prop
comum. Os `forwardRef` que restam no projeto são anteriores a isso e ficam onde
estão; código novo não os reproduz.

## Nomear

O nome descreve **o que é no produto**, não como parece:

- `MoneyDisplay`, `StatCard`, `EmptyState` — sim.
- `GreenBox`, `RoundedPanel`, `SmallText` — não.

Sub-partes usam o nome do pai como prefixo: `CardHeader`, `ItemContent`,
`TimelineTitle`. Isso mantém o import legível e o autocomplete útil.

## Documentar

Todo componente novo entra em três lugares, na mesma mudança:

1. `src/components/ui/<slug>.tsx` — o componente.
2. `src/app/designsystem/registry.ts` — a entrada, com descrição e `importLine`.
3. `src/app/designsystem/docs/<slug>.tsx` — a página, com demonstração ao vivo.

Depois, `npm run ds:docs-map` regenera o mapa. Um slug no registry sem página
correspondente é erro de build, não página vazia em produção.

## O que a página de documentação precisa ter

- **`Usage`** — quando usar, e principalmente **quando não usar**. A comparação
  com o componente vizinho é o que mais economiza tempo de quem lê.
- **`DocSection`** por variante ou estado, com `code` para copiar.
- **`DocNote`** para as decisões que não cabem numa prop: por que o token é
  aquele, o que acontece no toque, qual armadilha já custou caro.
- **`PropsTable`** curada. Não liste as 300 props nativas de um `<input>`; liste
  as que o consumidor precisa decidir.
