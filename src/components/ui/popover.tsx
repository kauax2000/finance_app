"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Popover as PopoverPrimitive } from "radix-ui";
import { XMarkIcon } from "@heroicons/react/16/solid";

import { menuPanelSurfaceClassName } from "@/lib/menu-classes";
import { cn } from "@/lib/utils";
import { ANCHORED_COLLISION_PADDING } from "@/lib/anchored-surface";
import { useIsMobile, useViewportWindow } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { Muted } from "@/components/ui/typography";
import { scrollFadeViewportClassName } from "@/lib/scroll-fade-classes";
import { useScrollFade } from "@/hooks/use-scroll-fade";
import { ScrollFadeArrows } from "@/lib/scroll-fade-arrows";
import {
  skipFocusAfterScrollClose,
  useCloseOnScroll,
} from "@/hooks/use-close-on-scroll";

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

/** A marca de "fechou por rolagem", da raiz para o `Content`. */
const PopoverScrollCloseContext =
  React.createContext<React.RefObject<boolean> | null>(null);

/**
 * Quem está em volta: se é a gaveta do telefone e como fechar por código (a
 * confirmação curta fecha depois de confirmar).
 */
const PopoverModoContext = React.createContext<{
  folha: boolean;
  fechar: () => void;
}>({ folha: false, fechar: () => {} });

/**
 * Não modal, o popover fecha quando a página rola — ver `useCloseOnScroll`.
 * `Combobox` e `DatePicker` herdam daqui.
 *
 * `mobile="sheet"` (rodada 220): abaixo de 768px o mesmo conteúdo abre numa
 * gaveta. As telas decidiam isso à mão com `modal={isMobile}` — um popover
 * modal no telefone ainda é um popover de 288px pendurado num dedo.
 */
function Popover({
  open: openProp,
  defaultOpen,
  onOpenChange,
  modal,
  mobile = "popover",
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root> & {
  mobile?: "popover" | "sheet";
}) {
  const isMobile = useIsMobile();
  const folha = mobile === "sheet" && isMobile;
  const [open, setOpen, fechouPorRolagem] = useCloseOnScroll({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    closed: false,
    // A gaveta não fecha ao rolar: ela é a superfície, e rolar é dentro dela.
    enabled: !modal && !folha,
  });
  const modo = React.useMemo(
    () => ({ folha, fechar: () => setOpen(false) }),
    [folha, setOpen],
  );

  if (folha) {
    return (
      <PopoverModoContext.Provider value={modo}>
        <Drawer open={open} onOpenChange={setOpen}>
          {children}
        </Drawer>
      </PopoverModoContext.Provider>
    );
  }

  return (
    <PopoverModoContext.Provider value={modo}>
      <PopoverScrollCloseContext.Provider value={fechouPorRolagem}>
        <PopoverPrimitive.Root
          data-slot="popover"
          open={open}
          onOpenChange={setOpen}
          modal={modal}
          {...props}
        >
          {children}
        </PopoverPrimitive.Root>
      </PopoverScrollCloseContext.Provider>
    </PopoverModoContext.Provider>
  );
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  const { folha } = React.useContext(PopoverModoContext);
  if (folha) return <DrawerTrigger data-slot="popover-trigger" {...props} />;
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverClose({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  const { folha } = React.useContext(PopoverModoContext);
  if (folha) return <DrawerClose data-slot="popover-close" {...props} />;
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
    "relative z-(--z-popover) flex origin-(--radix-popover-content-transform-origin) flex-col text-sm outline-hidden",
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
    //
    // **Desde a rodada 220 a entrada é a mola** dos menus redesenhados
    // (`Menubar`, `NavigationMenu`): desce 6px de 97% em `--ease-spring`. A
    // saída continua curta e sem mola — uma mola até zero passaria por baixo
    // de zero.
    "data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5",
    "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.97] data-open:animation-duration-(--duration-spring) data-open:ease-(--ease-spring)",
    // A saída não se move e é mais curta: um popover que se fecha some, não
    // recua.
    "data-closed:animate-out data-closed:fade-out-0 data-closed:animation-duration-[130ms] data-closed:ease-(--ease-out)",
  ],
  {
    variants: {
      /**
       * A largura, na escada (rodada 220): `md` 288 é o padrão de sempre;
       * `sm` 224 para uma frase, `lg` 352 para um formulário curto, `auto`
       * para quem hospeda um componente com largura própria (o calendário, a
       * grade de meses) e `trigger` para a largura do gatilho. Quatro telas
       * escreviam `w-auto`, `w-max`, `w-[min(…)]` e
       * `w-[var(--radix-popover-trigger-width)]` à mão.
       */
      size: {
        auto: "w-auto",
        sm: "w-56",
        md: "w-72",
        lg: "w-88",
        trigger: "w-(--radix-popover-trigger-width)",
      },
      /**
       * Quem pinta (rodada 143). `plate` é a placa flutuante da régua — o
       * padrão, e o que todo popover do app veste. `none` não pinta nada —
       * sem placa, sem anel, sem sombra, sem recorte —, para o conteúdo que
       * traz as **próprias** superfícies. Ela foi feita para a pilha do
       * `Command` no `Combobox`, que saiu dela na rodada 198 — **hoje nenhuma
       * tela a usa**, e a página afirmava o contrário. Placa em volta de placa
       * seria o "fundo quebrado" que a regra de uma placa por superfície
       * proíbe.
       */
      surface: {
        plate: menuPanelSurfaceClassName,
        none: "overflow-visible",
      },
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
    defaultVariants: { surface: "plate", padding: "default", size: "md" },
  },
);

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = ANCHORED_COLLISION_PADDING,
  padding,
  surface,
  size,
  label,
  onCloseAutoFocus,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> &
  VariantProps<typeof popoverContentVariants> & {
    /**
     * O nome para o leitor de tela, sem título à vista (rodada 220): vira um
     * `PopoverTitle` `sr-only`. Era o que o calendário do painel escrevia à
     * mão, e o que os seletores de mês das categorias esqueciam.
     */
    label?: React.ReactNode;
  }) {
  const reactId = React.useId();
  const fechouPorRolagem = React.useContext(PopoverScrollCloseContext);
  const { folha } = React.useContext(PopoverModoContext);
  // O portal vai ao `body` da janela da moldura do catálogo, como o do
  // `Tooltip` e o do `Drawer` (rodada 245). Fora dela o contexto é `null`, e o
  // app não muda. Ia ao documento de fora, e lá o clique dentro da moldura
  // nunca chegava a ele: o popover não fechava ao clicar fora.
  const janela = useViewportWindow();
  const [hasTitle, setHasTitle] = React.useState(false);
  const [hasDescription, setHasDescription] = React.useState(false);

  // Um popover é `role="dialog"`, e sem nome o leitor de tela anuncia só
  // "diálogo". Em desenvolvimento, quem abre um sem nome fica sabendo. O
  // título se registra no efeito do filho, que roda antes deste — por isso o
  // aviso espera um quadro, e o render com o título o cancela.
  const nomeado =
    hasTitle || label != null || props["aria-label"] != null || props["aria-labelledby"] != null;
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" || nomeado) return;
    const t = window.setTimeout(() => {
      console.warn(
        "PopoverContent sem nome: passe `label` ou um `PopoverTitle` (pode ser sr-only).",
      );
    }, 0);
    return () => window.clearTimeout(t);
  }, [nomeado]);

  const rotulos = React.useMemo<PopoverLabelContextValue>(
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
    <PopoverLabelContext.Provider value={rotulos}>
      {folha ? (
        // No telefone, a gaveta: o mesmo conteúdo, sem placa nem seta. O
        // nome é o da gaveta — `PopoverTitle` vira `DialogTitle` nela. O
        // destino do foco ao fechar atravessa (rodada 245): quem decide para
        // onde ele volta no popover decide também na gaveta.
        <DrawerContent
          data-slot="popover-sheet"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          {label != null ? (
            <PopoverTitle className="sr-only">{label}</PopoverTitle>
          ) : null}
          <div
            className={cn(
              "flex min-h-0 flex-col gap-2.5 px-4 pb-2 text-sm",
              "[--popover-strip-px:0px] [--popover-strip-py:0px]",
            )}
          >
            {children}
          </div>
        </DrawerContent>
      ) : (
      <PopoverPrimitive.Portal container={janela?.document.body}>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          // Sem isto o popover encosta na borda da tela. O
          // `FormPickerPopoverContent` já somava a folga à mão (16/16/12/12) —
          // era o único que somava, e não é um caso especial dele.
          collisionPadding={collisionPadding}
          aria-labelledby={hasTitle ? rotulos.titleId : undefined}
          aria-describedby={hasDescription ? rotulos.descriptionId : undefined}
          data-padding={padding}
          onCloseAutoFocus={skipFocusAfterScrollClose(
            fechouPorRolagem,
            onCloseAutoFocus,
          )}
          className={cn(popoverContentVariants({ size, surface, padding }), className)}
          {...props}
        >
          {label != null ? (
            <PopoverTitle className="sr-only">{label}</PopoverTitle>
          ) : null}
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
      )}
    </PopoverLabelContext.Provider>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  const { folha } = React.useContext(PopoverModoContext);
  // A gaveta não se ancora: o que a âncora embrulha aparece como está.
  if (folha) return props.asChild ? <>{props.children}</> : null;
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * A seta (rodada 220). Ela se paga quando o gatilho é **um entre iguais** — o
 * dia numa grade de trinta, uma célula de tabela —, e a posição do painel não
 * basta para dizer de qual ele fala. É a do `HoverCard`: `fill` e não `bg`, e
 * os alfas da placa espelhados à mão — agora são **dois** espelhos da mesma
 * receita, e este fica no mesmo número do outro.
 */
function PopoverArrow({
  className,
  width = 12,
  height = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  const { folha } = React.useContext(PopoverModoContext);
  if (folha) return null;
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      width={width}
      height={height}
      className={cn(
        "fill-popover/85 supports-backdrop-filter:dark:fill-popover/60 reduced-transparency:fill-popover",
        className,
      )}
      {...props}
    />
  );
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
function PopoverHeader({
  className,
  closeButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * O × no canto (rodada 220), preso ao topo do título como o `endAdornment`
   * do `DialogHeaderRow` — para o popover que se lê e se dispensa. Na gaveta
   * do telefone ele some: lá a alça e o toque fora fecham.
   */
  closeButton?: boolean;
}) {
  const { folha } = React.useContext(PopoverModoContext);
  const comX = closeButton && !folha;
  return (
    <div
      data-slot="popover-header"
      className={cn(
        "relative z-10 shrink-0 text-sm",
        comX
          ? "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"
          : "flex flex-col",
        "px-(--popover-strip-px) py-(--popover-strip-py)",
        className,
      )}
      {...props}
    >
      {comX ? <div className="flex min-w-0 flex-col">{children}</div> : children}
      {comX ? (
        <PopoverPrimitive.Close asChild>
          <Button
            type="button"
            variant="tertiary"
            size="icon-xs"
            aria-label="Fechar"
            data-slot="popover-header-close"
            className="-me-1 -mt-0.5"
          >
            <XMarkIcon aria-hidden />
          </Button>
        </PopoverPrimitive.Close>
      ) : null}
    </div>
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
    <>
      <div
        ref={useScrollFade({ arrows: true })}
        data-slot="popover-body"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          "px-(--popover-strip-px)",
          scrollFadeViewportClassName,
          className,
        )}
        {...props}
      />
      <ScrollFadeArrows />
    </>
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

  const { folha } = React.useContext(PopoverModoContext);
  if (folha) {
    return (
      <DialogTitle
        data-slot="popover-title"
        className={cn("text-base font-medium", className)}
        {...props}
      />
    );
  }

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

  const { folha } = React.useContext(PopoverModoContext);
  if (folha) {
    return (
      <DialogDescription
        data-slot="popover-description"
        className={cn("text-pretty", className)}
        {...props}
      />
    );
  }

  return (
    <Muted
      data-slot="popover-description"
      id={label?.descriptionId}
      className={cn("text-pretty", className)}
      {...props}
    />
  );
}

/**
 * A confirmação curta (rodada 220): título, uma linha e Cancelar/Confirmar —
 * a ação de baixo risco que não merece um diálogo modal (remover um filtro,
 * desfazer uma marcação). O que não tem volta continua sendo `AlertDialog`.
 *
 * É um `PopoverContent` inteiro: vai no lugar dele, dentro do `Popover`. Um
 * `onConfirm` que devolve `Promise` trava os dois botões com o `Spinner` e
 * fecha quando ela assenta; o Cancelar segue a tabela do rodapé (`tertiary`).
 */
function PopoverConfirm({
  title,
  description,
  confirmLabel = "confirmar",
  cancelLabel = "cancelar",
  variant = "primary",
  onConfirm,
  ...props
}: Omit<React.ComponentProps<typeof PopoverContent>, "title" | "children"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  variant?: "primary" | "destructive";
  onConfirm: () => void | Promise<unknown>;
}) {
  const { fechar } = React.useContext(PopoverModoContext);
  const [pendente, setPendente] = React.useState(false);

  const confirmar = () => {
    const r = onConfirm();
    if (r && typeof (r as Promise<unknown>).then === "function") {
      setPendente(true);
      void (r as Promise<unknown>).finally(() => {
        setPendente(false);
        fechar();
      });
      return;
    }
    fechar();
  };

  return (
    <PopoverContent size="sm" role="alertdialog" aria-busy={pendente || undefined} {...props}>
      <PopoverHeader>
        <PopoverTitle>{title}</PopoverTitle>
        {description ? <PopoverDescription>{description}</PopoverDescription> : null}
      </PopoverHeader>
      <PopoverFooter className="justify-end">
        <PopoverClose asChild>
          <Button type="button" variant="tertiary" size="sm" disabled={pendente}>
            {cancelLabel}
          </Button>
        </PopoverClose>
        <Button
          type="button"
          variant={variant}
          size="sm"
          disabled={pendente}
          aria-busy={pendente || undefined}
          onClick={confirmar}
        >
          {pendente ? <Spinner /> : null}
          {confirmLabel}
        </Button>
      </PopoverFooter>
    </PopoverContent>
  );
}

export {
  popoverContentVariants,
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverConfirm,
  PopoverContent,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
