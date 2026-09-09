"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Popover as PopoverPrimitive } from "radix-ui";

import { menuPanelSurfaceClassName } from "@/lib/menu-classes";
import { cn } from "@/lib/utils";
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface";
import { Muted } from "@/components/ui/typography";
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes";
import { useScrollFade } from "@/hooks/use-scroll-fade";

/**
 * Um popover é um `role="dialog"` — e ele precisa de nome.
 *
 * O `Popover.Content` do Radix renderiza `role="dialog"` e **nunca escreve
 * `aria-labelledby`**. Um papel de diálogo sem nome é anunciado como "diálogo",
 * e mais nada: quem usa leitor de tela sabe que alguma coisa abriu, e não o
 * quê.
 *
 * O `PopoverTitle` daqui não corrigia isso — ele era uma `<div>` tipada como
 * `h2`, sem `id`, sem ligação nenhuma com o conteúdo. O
 * `MobileAccountMenu` chegou a escrever `<PopoverHeader className="sr-only">`
 * com título e descrição dentro, exatamente para nomear o popover; o texto
 * existia no DOM e não chegava ao papel.
 *
 * Agora o título e a descrição **se registram**: cada um recebe um `id` deste
 * contexto, e o `PopoverContent` só aponta `aria-labelledby` /
 * `aria-describedby` para eles quando eles de fato foram renderizados —
 * apontar para um `id` que não existe deixa o nome vazio, que é onde
 * estávamos. É o mesmo mecanismo do `Dialog` do Radix, aplicado à superfície
 * que compartilha o papel dele.
 *
 * Quem passa o próprio `aria-labelledby` continua ganhando: os props do
 * chamador são espalhados depois.
 */
type PopoverLabelContextValue = {
  titleId: string;
  descriptionId: string;
  setHasTitle: (present: boolean) => void;
  setHasDescription: (present: boolean) => void;
};

const PopoverLabelContext =
  React.createContext<PopoverLabelContextValue | null>(null);

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverClose({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

/**
 * O recuo é um eixo, como no `Card`.
 *
 * Cinco chamadas o anulam à mão — três escrevem `w-auto p-0` para pôr um
 * calendário dentro, e o `Combobox` e o `FormPickerPopoverContent` fazem o
 * mesmo porque quem manda no respiro é a lista de dentro. Um popover que
 * hospeda um componente inteiro não quer recuo nenhum: o conteúdo sangra até a
 * borda e cuida do próprio.
 *
 * `none` tira o `gap` junto. As chamadas escreviam `gap-0 p-0` porque as duas
 * coisas andam juntas — sem recuo, a folga entre filhos é do conteúdo também.
 */
const popoverContentVariants = cva(
  [
    /** Above Sheet overlay/content (`z-(--z-sheet)`); below Toaster (`z-(--z-toast)`). */
    menuPanelSurfaceClassName,
    "z-(--z-popover) flex w-72 origin-(--radix-popover-content-transform-origin) flex-col text-sm outline-hidden",
    "max-h-(--radix-popover-content-available-height) max-w-(--radix-popover-content-available-width) overflow-y-auto overscroll-contain",
    // Quem declara um corpo rolável **cede a rolagem da casca**. Sem isto o
    // popover e o `PopoverBody` rolariam os dois, um dentro do outro. Quem não
    // declara continua exatamente como antes.
    "has-[[data-slot=popover-body]]:overflow-hidden",
    // A entrada é a do sistema — fade, 8px do lado de onde veio e `zoom-95` —,
    // e o que faltava era a curva chegar até aqui. `animate-in` do
    // tw-animate-css é `enter var(--tw-animation-duration, …) var(--tw-ease,
    // ease)`, e quem escreve `--tw-ease` é a classe `ease-*`: sem ela,
    // medido, `--tw-ease` saía **vazio** e o popover abria com o `ease` do
    // navegador. É o mesmo defeito que o `NavigationMenu` tinha.
    //
    // `animation-duration-*` e não `duration-*`: o segundo escreve
    // `transition-duration` junto, e sem nenhum `transition-property` isso
    // deixa `transition: all` — medido aqui, `all 0.1s`. Numa superfície que
    // só anima e não transiciona, o utilitário certo é o que mexe só na
    // animação.
    "animation-duration-(--duration-base) ease-(--ease-out)",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
    "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
    // A saída não se move e é mais curta: um popover que se fecha some, não
    // recua. O `zoom-out-95` saiu junto com o resto do movimento.
    "data-closed:animate-out data-closed:fade-out-0 data-closed:animation-duration-(--duration-instant)",
  ],
  {
    variants: {
      padding: {
        // O recuo das tiras acompanha o do casco: onde o casco já recua, a tira
        // não recua duas vezes. Em `none` ela vira dona do próprio — e os 12/8
        // são exatamente o que as seis faixas escritas à mão pelo app já
        // escreviam (`px-3 py-2`).
        default:
          "gap-2.5 p-2.5 [--popover-strip-px:0px] [--popover-strip-py:0px]",
        none: "gap-0 p-0 [--popover-strip-px:--spacing(3)] [--popover-strip-py:--spacing(2)]",
      },
    },
    defaultVariants: { padding: "default" },
  },
);

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  padding,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> &
  VariantProps<typeof popoverContentVariants>) {
  const reactId = React.useId();
  const [hasTitle, setHasTitle] = React.useState(false);
  const [hasDescription, setHasDescription] = React.useState(false);

  const label = React.useMemo<PopoverLabelContextValue>(
    () => ({
      titleId: `${reactId}-title`,
      descriptionId: `${reactId}-description`,
      setHasTitle,
      setHasDescription,
    }),
    [reactId],
  );

  return (
    // **O Provider fica por fora do Portal, e isso é o que faz a saída
    // existir.** O `Portal` do Radix é `<Presence>` em volta de um
    // `PortalPrimitive asChild`, e o `Presence` decide se espera a animação
    // lendo `getComputedStyle` do **ref do filho**. Com o Provider no meio, o
    // `Slot` do `asChild` tenta pôr o ref num context provider — que não é
    // elemento —, o ref se perde, `getAnimationName(undefined)` devolve
    // `"none"` e o Radix desmonta **no mesmo commit** em que escreve
    // `data-state="closed"`. Medido: no instante do `state=closed` o
    // `getComputedStyle` do conteúdo já vinha **vazio**, ou seja o nó estava
    // destacado, e nenhum `animationstart` de `exit` chegava a disparar — as
    // três classes `data-closed:*` eram código morto desde sempre. O
    // `DropdownMenu`, que tem `Portal → Content` direto, sempre animou.
    //
    // O contexto continua alcançando o título e a descrição: ele está acima do
    // Portal na árvore do React, e contexto atravessa portal.
    //
    // Saiu junto o `data-slot="popover-portal"`, que também não existia: as
    // props iam para o mesmo `Slot` e morriam no Provider. Verificado no DOM
    // com um popover aberto — `[data-slot=popover-portal]` não casava nada.
    <PopoverLabelContext.Provider value={label}>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          // Sem isto o popover encosta na borda da tela. O
          // `FormPickerPopoverContent` já somava a folga à mão (16/16/12/12) —
          // era o único que somava, e não é um caso especial dele.
          collisionPadding={collisionPadding}
          aria-labelledby={hasTitle ? label.titleId : undefined}
          aria-describedby={hasDescription ? label.descriptionId : undefined}
          data-padding={padding}
          className={cn(popoverContentVariants({ padding }), className)}
          {...props}
        />
      </PopoverPrimitive.Portal>
    </PopoverLabelContext.Provider>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * A faixa de topo — e ela **não tem fio**.
 *
 * Ela não tinha borda nenhuma, e era por isso que seis telas escreviam a faixa
 * à mão em duas grafias (`border-b border-border px-3 py-2` e
 * `border-b border-border/60 px-2 py-1.5`) — inclusive a demonstração dentro da
 * doc deste componente, que ensinava a grafia. Agora a faixa é a peça, e o que
 * a separa do corpo é o respiro que ela traz mais a dissolução, quando há
 * `PopoverBody`.
 *
 * O `relative z-10` é o que põe a faixa **sobre** o corpo em vez de ao lado
 * dele: o conteúdo passa por trás. É o mesmo do `FormPickerPopoverSearch`.
 *
 * Ele **não** ganha tipo de rótulo (`text-xs text-muted-foreground`): este é o
 * par título+descrição que registra `aria-labelledby`, e carimbar tipo de
 * rótulo aqui faria a peça mentir sobre a própria função. Uma faixa que é só um
 * rótulo põe um `<p>` com esse tipo dentro.
 *
 * Título sobre descrição é **o mesmo dado em duas linhas**, e quem os separa é
 * a entrelinha. O `gap-0.5` que estava aqui bastava para o par deixar de ler
 * como uma coisa só.
 */
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn(
        "relative z-10 flex shrink-0 flex-col text-sm",
        "px-(--popover-strip-px) py-(--popover-strip-py)",
        className,
      )}
      {...props}
    />
  );
}

/**
 * O corpo rolável, para o popover que hospeda uma lista longa.
 *
 * Ele existe porque **o `PopoverContent` não pode ser o elemento mascarado**: a
 * máscara recorta o alfa do elemento inteiro, e ali moram o `bg-popover`, o
 * `ring-1`, o `rounded-lg` e a sombra — os quatro cantos do painel sairiam
 * apagados enquanto os lados continuam opacos. Quem rola e dissolve é este nó,
 * que não desenha nada.
 *
 * **Modo sem faixa**, de propósito: o cabeçalho tem `PopoverDescription`
 * opcional, logo altura variável, e medi-la exigiria um observador escrevendo
 * a altura do JS. A dissolução acontece na borda do próprio corpo, logo abaixo
 * da faixa — que é a delimitação que se quer.
 */
function PopoverBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={useScrollFade()}
      data-slot="popover-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        "px-(--popover-strip-px)",
        scrollFadeViewportClassName,
        className,
      )}
      {...props}
    />
  );
}

/** A faixa de pé — espelho do cabeçalho, e sem fio pela mesma razão. */
function PopoverFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-footer"
      className={cn(
        "relative z-10 flex shrink-0 flex-wrap items-center gap-2",
        "px-(--popover-strip-px) py-(--popover-strip-py)",
        className,
      )}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const label = React.useContext(PopoverLabelContext);
  const setHasTitle = label?.setHasTitle;

  React.useEffect(() => {
    if (!setHasTitle) return;
    setHasTitle(true);
    return () => setHasTitle(false);
  }, [setHasTitle]);

  return (
    <h2
      data-slot="popover-title"
      id={label?.titleId}
      className={cn("font-heading font-medium text-balance", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const label = React.useContext(PopoverLabelContext);
  const setHasDescription = label?.setHasDescription;

  React.useEffect(() => {
    if (!setHasDescription) return;
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);

  return (
    <Muted
      data-slot="popover-description"
      id={label?.descriptionId}
      className={cn("text-pretty", className)}
      {...props}
    />
  );
}

export {
  popoverContentVariants,
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
