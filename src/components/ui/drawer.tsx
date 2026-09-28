"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
import { modalSurfaceClassName } from "@/lib/glass-classes"
import { useViewportModal, useViewportWindow } from "@/hooks/use-mobile"

/**
 * O véu das superfícies de borda — desta gaveta e do `Sheet`, nos dois ramos.
 * Ele morava no `sheet.tsx`, e a gaveta o importava de lá; quando a alça veio
 * para cá (rodada 159) o `Sheet` passou a importar deste arquivo, e o véu veio
 * junto para a dependência correr num sentido só.
 */
const SHEET_OVERLAY_CLASS =
  "fixed inset-0 z-(--z-sheet) bg-overlay supports-backdrop-filter:backdrop-blur-xs"

/**
 * A alça: a única pista de que aquela superfície se arrasta — e o próprio
 * alvo do gesto.
 *
 * ## Ela é da superfície, e não do conteúdo
 *
 * Ela mora neste arquivo desde a rodada 159: tinha arquivo e página próprios,
 * e as duas superfícies que a vestem são gavetas do vaul — o `DrawerContent`
 * daqui e o `Sheet` no telefone, que a importa deste arquivo. Continua um
 * componente com nome; só não é mais uma peça solta do catálogo.
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
 * Varridos os degraus, 70% era o primeiro que passava nos dois temas: **3,06 no
 * claro e 4,24 no escuro**. Era o degrau a que a pega do `resizable` chegou por
 * varredura independente, e por isso a tinta de arraste tinha um número só.
 *
 * ## E 70% deixou de bastar quando a placa virou vidro
 *
 * **Aqueles números foram medidos contra `--background` opaco.** Esta tinta tem
 * alfa, então o que se vê é ela composta sobre o fundo da gaveta — e a gaveta
 * passou a ser translúcida sobre o véu do modal. No claro a placa desce de 250
 * para **236**, e uma tinta escura sobre fundo mais escuro **perde**:
 *
 * | | placa opaca | placa de vidro |
 * | --- | --- | --- |
 * | escuro | 4,24 | 4,22 |
 * | **claro** | 3,06 | **2,85 — reprova** |
 *
 * A folga sempre foi de 0,06 sobre o piso de 3:1, e o vidro a consumiu.
 * Varridos os degraus de novo, **75% é o primeiro que passa: 3,12 no claro e
 * 4,73 no escuro**. O `resizable` fica em 70 e é correto — a pega dele vive
 * entre dois painéis **opacos**, e o número dela foi medido contra o fundo que
 * ela de fato tem. **Alfa medido contra um fundo não sobrevive à troca do
 * fundo.**
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
  "!opacity-100 !bg-muted-foreground/75",
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


/**
 * A gaveta — **em qualquer largura de tela**.
 *
 * ## O lugar dela entre as quatro superfícies
 *
 * O projeto tem quatro, e cada uma responde a uma pergunta diferente:
 *
 * | | Onde encosta | Responde ao dedo | Muda com a largura |
 * | --- | --- | --- | --- |
 * | `Dialog` | no meio | não | só na largura da caixa |
 * | **`Drawer`** | **no topo ou no rodapé** | **sim** | **não** |
 * | `Sheet` | borda no desktop, rodapé no telefone | no telefone | **sim** |
 *
 * `Sheet` é a que **troca de superfície**: painel de borda acima de 768px,
 * gaveta abaixo — e isso vale para tudo, inclusive a navegação. `Drawer` é
 * gaveta sempre, em qualquer largura: é o que se usa quando o gesto é a
 * afordância, e não uma consequência de a tela ser estreita.
 *
 * ## O que esta versão corrigiu
 *
 * A anterior era o arquivo do shadcn intacto, sem nenhuma tela, e repetia
 * exatamente o defeito que a rodada do `Sheet` tirou de 37 telas: a alça era
 * uma `div` decorativa — sem `data-vaul-handle`, sem área de toque, sem gesto.
 * Ela **desenhava a promessa do arraste** enquanto a física ficava só na
 * documentação. Agora a alça é o `DragHandle`, que é o `Handle` do vaul: ela é
 * a área de arraste e tem os 44px de alvo. O que **não** faz é fechar no
 * clique — o vaul só fecha ali quando `dismissible` é falso, e está medido e
 * escrito no `DragHandle`, abaixo.
 *
 * Junto vieram as decisões que o `Sheet` já tinha tomado e esta não seguia:
 * `--z-sheet` em vez de `--z-modal` (duas gavetas em camadas diferentes),
 * `bg-background` em vez de `bg-popover` (que é token de camada pequena),
 * `dvh` + área segura em vez de `80vh` (que mente quando a barra do navegador
 * recolhe), e `repositionInputs`, que é o que impede a gaveta de encolher
 * quando o teclado do iOS sobe.
 *
 * ## A cromagem não é daqui
 *
 * `DrawerHeader`, `DrawerTitle`, `DrawerDescription` e `DrawerFooter` **saíram
 * do arquivo**. Cabeçalho, título, corpo rolável e rodapé vêm do `Dialog`, como
 * já vêm na folha, e pelo mesmo motivo: `vaul` é construído sobre
 * `@radix-ui/react-dialog`, há uma instância só em `node_modules`, e por isso
 * `DialogTitle` encontra o contexto de que precisa **dentro** de um
 * `DrawerContent`. Manter uma segunda cromagem aqui era manter dois títulos de
 * gaveta que divergiam — e o daqui divergia: centralizava o texto, contra a
 * decisão de que o cabeçalho é alinhado à esquerda em toda largura.
 *
 * ## Só o eixo vertical
 *
 * `direction` aceita `bottom` e `top`, e não `left` / `right`. Não é
 * simplificação: o `[data-vaul-handle]` do vaul declara `touch-action: pan-y`,
 * ou seja, a alça **só arrasta na vertical**. Uma gaveta lateral teria a alça
 * de enfeite outra vez. Painel preso a uma borda lateral é o ramo desktop do
 * `Sheet`, que não promete gesto nenhum.
 */

const drawerContentVariants = cva(
  [
    // `group/dialog-content` é o que a cromagem do `Dialog` procura — é por
    // este nome que `DialogHeader` sabe que está num layout `fixed`.
    "group/dialog-content fixed inset-x-0 z-(--z-sheet)",
    "flex flex-col text-sm shadow-lg",
    modalSurfaceClassName,
    "focus:outline-none",
    // O contrato que a cromagem do `Dialog` lê — o mesmo que `SheetContent`
    // declara, palavra por palavra, para o cabeçalho e o rodapé medirem igual
    // na folha, no painel e aqui.
    "[--dialog-px:--spacing(4)]",
    "[--dialog-bleed:0px]",
    // A reserva do × vem de **haver** um ×, não de um prop.
    "[--dialog-close:0px] has-[>[data-slot=dialog-close-button]]:[--dialog-close:--spacing(11)]",
    // As alturas saem de variáveis para uma gaveta poder baixar o teto sem
    // reescrever a fórmula: uma lista curta pede menos que 85%.
    "[--drawer-max-h:85dvh]",
    // A área segura é da superfície, com a mesma conta da gaveta do `Sheet`:
    // 24px de respiro mais a barra de gestos. Antes aqui era só o `env()`, e a
    // mesma gaveta saía 24px mais baixa por dentro que a do `Sheet`.
    "data-[vaul-drawer-direction=bottom]:pb-(--drawer-safe)",
    "data-[vaul-drawer-direction=top]:pt-(--drawer-safe)",
    "data-[vaul-drawer-direction=bottom]:[--drawer-safe:calc(--spacing(6)+env(safe-area-inset-bottom,0px))]",
    "data-[vaul-drawer-direction=top]:[--drawer-safe:calc(--spacing(6)+env(safe-area-inset-top,0px))]",
    // A folga do topo muda com o aparelho, então ela também é variável.
    "data-[vaul-drawer-direction=bottom]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-top,0px)))]",
    "data-[vaul-drawer-direction=top]:[--drawer-h:calc(100dvh-max(0.5rem,env(safe-area-inset-bottom,0px)))]",
    // O raio e a borda ficam do lado que **não** encosta na tela.
    "data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:rounded-t-2xl data-[vaul-drawer-direction=bottom]:border-t",
    "data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:rounded-b-2xl data-[vaul-drawer-direction=top]:border-b",
  ],
  {
    variants: {
      /**
       * Gaveta alta: ocupa quase a tela, com uma folga na borda oposta. Sem
       * ela, a gaveta mede o próprio conteúdo e para no teto de 85%.
       */
      fill: {
        true: "h-(--drawer-h)",
        false: "max-h-(--drawer-max-h)",
      },
      /**
       * Onde a gaveta encosta.
       *
       * `flush` cola nas três bordas e arredonda só o lado de dentro — é a
       * gaveta do telefone, e o padrão. `inset` a solta da tela: margem nos
       * três lados, cantos completos, e a página aparecendo em volta. A segunda
       * forma existe porque uma gaveta **de desktop** coberta de borda a borda
       * lê como um erro de layout, não como uma superfície.
       */
      variant: {
        flush: "",
        inset: [
          "inset-x-(--drawer-inset) rounded-2xl border",
          "data-[vaul-drawer-direction=bottom]:bottom-(--drawer-inset)",
          "data-[vaul-drawer-direction=top]:top-(--drawer-inset)",
          "[--drawer-inset:--spacing(2)]",
        ].join(" "),
      },
      /**
       * O teto de largura.
       *
       * Uma gaveta de baixo numa janela de 1900px vira uma linha de leitura de
       * 1900px, que nenhuma medida de texto suporta. `md` e `lg` a centralizam
       * e param; `full` é o comportamento do telefone, e continua o padrão
       * porque é lá que a gaveta nasceu.
       */
      size: {
        full: "",
        md: "mx-auto sm:max-w-lg",
        lg: "mx-auto sm:max-w-2xl",
      },
    },
    defaultVariants: {
      fill: false,
      variant: "flush",
      size: "full",
    },
  }
)

type DrawerDirection = "bottom" | "top"

function Drawer({
  direction = "bottom",
  repositionInputs = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * Só o eixo vertical — a alça do vaul é `touch-action: pan-y`.
   *
   * A restrição é uma **interseção**, e não um `Omit`: os props da raiz do
   * `vaul` são uma união discriminada (com e sem `fadeFromIndex`), e `Omit`
   * sobre união achata os dois lados num objeto só, que depois não é
   * atribuível a nenhum deles. A interseção distribui e preserva a união.
   */
  direction?: DrawerDirection
}) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      direction={direction}
      // O motivo é o mesmo que o `Sheet` documenta: é `repositionInputs` que
      // impede a superfície de encolher quando o teclado do iOS sobe.
      repositionInputs={repositionInputs}
      // Dentro da moldura do catálogo ela deixa de ser modal — senão o
      // `RemoveScroll` do Radix trava a rolagem da **página de fora**. Antes de
      // `{...props}`, para quem chama continuar mandando. Ver `useViewportModal`.
      modal={useViewportModal()}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

/**
 * O portal vai para o `body` da **janela ativa**, como o do `Sheet`.
 *
 * Fora da moldura de viewport do catálogo o contexto é `null` e o vaul usa o
 * próprio documento — o app não muda. Dentro dela, é isto que impede a gaveta
 * de escapar do `<iframe>` e cobrir a página inteira: a moldura já faz o
 * `useIsMobile` ler a janela de dentro, então uma folha a 375px toma o ramo
 * gaveta ali, e sem o `container` ela era portalizada para fora.
 */
function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  const janela = useViewportWindow()
  return <DrawerPrimitive.Portal container={janela?.document.body} {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

/**
 * O véu — o mesmo do painel e o mesmo da folha, escrito uma vez em
 * `sheet.tsx`. Sem a duração fixa que o painel acrescenta: aqui o véu
 * acompanha o dedo, e um keyframe brigaria com o arraste.
 */
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(SHEET_OVERLAY_CLASS, className)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  fill,
  variant,
  size,
  showHandle = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerContentVariants> & {
    /**
     * A gaveta sem alça — para quando ela não se arrasta (`dismissible={false}`
     * na raiz). Com o gesto ligado, desligar a alça é tirar a única pista de
     * que ele existe.
     */
    showHandle?: boolean
  }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        data-surface="drawer"
        data-variant={variant}
        data-size={size}
        // `fixed` é o que a cromagem do `Dialog` lê para dar recuo ao cabeçalho
        // e deixar o corpo rolar entre ele e o rodapé.
        data-layout="fixed"
        className={cn(drawerContentVariants({ fill, variant, size }), className)}
        {...props}
      >
        {showHandle ? (
          <DragHandle />
        ) : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

export {
  DragHandle,
  dragHandleClassName,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
  drawerContentVariants,
  SHEET_OVERLAY_CLASS,
}
