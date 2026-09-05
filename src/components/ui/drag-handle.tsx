"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

/**
 * A alça: a única pista de que aquela superfície se arrasta — e o próprio
 * alvo do gesto.
 *
 * ## Ela é da superfície, e não do conteúdo
 *
 * Quem a escreve é `Sheet` (no ramo gaveta) e `DrawerContent`. **Uma tela nunca
 * a escreve**, como não escreve a borda nem a sombra da folha. A versão anterior
 * deste arquivo era um `return null` com **31 chamadas em 27 arquivos** — 11
 * delas envolvidas num `{isMobile ? … : null}` que escolhia entre dois nadas —,
 * resto de quando a alça era uma `div` decorativa desenhada pela tela.
 * `drag-handle.test.ts` tranca que elas não voltem.
 *
 * ## O que o vaul dá, e o que ele cobra
 *
 * `DrawerPrimitive.Handle` renderiza a barra com `data-vaul-handle` e, dentro
 * dela, um `<span data-vaul-handle-hitarea>` absoluto de 44px — o alvo de dedo
 * que a barra de 6px não teria. Os dois são `aria-hidden`, e isso é correto:
 * quem fecha a superfície pelo teclado é o `Esc`, e pelo toque o × do cabeçalho.
 * A alça é afordância de ponteiro, e anunciá-la seria ruído.
 *
 * **O clique nela não fecha.** O `handleCycleSnapPoints` do vaul só chama
 * `closeDrawer()` quando `dismissible` é **falso** (`if (!dismissible)`), e sem
 * `snapPoints` não há o que ciclar — então numa gaveta comum, que é o caso de
 * todas as deste app, tocar a alça é um no-op deliberado. Ela se arrasta.
 *
 * O que ele cobra é uma folha de estilo injetada em tempo de execução
 * (`__insertCSS` anexa um `<style>` ao `<head>`), com valores que não conhecem
 * tema nem escada: `background:#e2e2e4`, `height:5px`, `width:32px`,
 * `border-radius:1rem`, `opacity:.7`.
 *
 * **E ela ganha de qualquer classe deste projeto, em qualquer especificidade.**
 * Não é por vir depois: é porque as utilities do Tailwind v4 vivem em
 * `@layer utilities` e a folha do vaul é **sem camada** — e a cascata resolve a
 * camada *antes* da especificidade, dando a declaração normal sem camada como
 * vencedora sempre. Quem inverte isso é `!`: entre declarações `!important` a
 * ordem das camadas se inverte, e a que está em camada passa a ganhar.
 *
 * Logo **toda** propriedade que este arquivo redeclara precisa de `!`, e a
 * asserção 1 do teste é o que garante isso. Foi o que faltava: a versão
 * anterior escrevia `rounded-full` **sem** ele e perdia calada — medido no
 * navegador, o `border-radius` computado da alça era **16px**, o do vaul.
 *
 * A regra vale para descendente também, e isso custou uma medição: o
 * `pointer-fine:` abaixo tem especificidade (0,2,0) contra os (0,1,0) do vaul,
 * a regra era emitida, o `matchMedia` casava — e a altura computada continuava
 * 44px, porque especificidade não decide nada contra uma camada.
 *
 * ## A tinta, e por que 70%
 *
 * A versão anterior era `bg-muted-foreground/35` sobre a `opacity:.7` do vaul,
 * ou seja **24,5% de alfa efetivo**. Medido contra `--background`, composto
 * sobre o fundo real: **1,41:1 no claro e 1,46 no escuro** — contra os 3:1 que
 * a WCAG 1.4.11 pede de um componente não-textual. O `/35` sozinho já daria só
 * 1,64 e 1,85; a `opacity` levava o número abaixo de um e meio.
 *
 * Varridos os degraus, **70% é o primeiro que passa nos dois temas**: **3,06 no
 * claro e 4,24 no escuro**. É exatamente o degrau a que a pega do `resizable`
 * chegou, por varredura independente e contra outra superfície — então a tinta
 * de arraste deste sistema tem um número só, e ele vale para as duas peças.
 *
 * Isso corrige, de passagem, o argumento que ficou escrito lá: área muda como a
 * cor **lê**, não o que a norma **exige**. A alça tem 2,25× a superfície da
 * pega e mesmo assim reprova no mesmo degrau.
 *
 * ## A resposta ao gesto
 *
 * Neutralizar a `opacity` do vaul apaga junto o `:hover`/`:active` dele, que
 * mexia só nela. O par volta como tinta — **90%: 4,61 e 6,36** —, e é um
 * **par**: `hover:` compila dentro de `@media (hover: hover)` e não existe no
 * telefone, que é justamente onde a alça é usada. A regra H do auditor não
 * alcança esta string (ela não é um `cva`), então quem a tranca é a asserção 4.
 *
 * ## O alvo, e um bug do vaul que fica documentado
 *
 * O vaul quis encolher a área de acerto no ponteiro fino e **errou o seletor**:
 * ele emite `@media (pointer:fine){[data-vaul-handle-hitarea]:{…}}`, com um `:`
 * sobrando, e a regra nunca vale. O efeito medido: os 44px persistem no mouse, e
 * `document.elementFromPoint` no topo do cabeçalho devolve a área da alça — **9px
 * de faixa em que o clique é do arraste, e não do cabeçalho**.
 *
 * `pointer-fine:` faz o que a biblioteca pretendia, com um número em vez de
 * `100%`: **20px**, o dobro dos 10 que o `resizable` reserva para o mouse, e que
 * **cabem inteiros** na caixa de margem da alça (6 + 2×10 = 26). Zero
 * sobreposição no ponteiro fino; os 44 ficam onde o dedo precisa deles. É por
 * isso que `my-2.5` é carga estrutural, e não respiro.
 */
const dragHandleClassName = cn(
  // `my-2.5` é o único sem `!`, e é o único que o vaul não declara. Os quatro
  // que ele declara — margem lateral, altura, largura, raio — disputam com a
  // folha dele e precisam vencer. A asserção 1 do teste é essa tabela.
  "!mx-auto my-2.5 shrink-0",
  "!h-1.5 !w-12 !rounded-full",
  // A tinta. `!opacity-100` é o que tira o fator 0,7 de cima do alfa.
  "!opacity-100 !bg-muted-foreground/70",
  "hover:!bg-muted-foreground/90 active:!bg-muted-foreground/90",
  "transition-colors duration-(--duration-fast) ease-(--ease-out)",
  // O alvo de acerto no mouse — o que o vaul quis fazer e o seletor dele não faz.
  "pointer-fine:[&>[data-vaul-handle-hitarea]]:!h-5",
  // Numa gaveta de cima, a alça é a borda de baixo: a que o dedo puxa. As duas
  // superfícies declaram `group/dialog-content`, então o seletor serve às duas —
  // e a alça sabe sozinha de que lado nasce, em vez de a superfície lhe dizer.
  "group-data-[vaul-drawer-direction=top]/dialog-content:order-last"
)

/**
 * Ela exige o contexto do vaul, como `DialogTitle` exige o do `Dialog`: fora de
 * um `Drawer.Root` o `useDrawerContext` lança. Não é limitação a contornar — é o
 * que impede a alça de existir onde não há gesto, que foi o defeito original.
 */
function DragHandle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  return (
    <DrawerPrimitive.Handle
      data-slot="drag-handle"
      className={cn(dragHandleClassName, className)}
      {...props}
    />
  )
}

export { DragHandle, dragHandleClassName }
