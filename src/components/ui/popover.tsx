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
 * Um popover é um `role="dialog"` e precisa de nome: o Radix nunca escreve
 * `aria-labelledby`, e sem ele o leitor de tela anuncia só "diálogo".
 * `PopoverTitle` e `PopoverDescription` se registram neste contexto, e o
 * `PopoverContent` só aponta `aria-labelledby` / `aria-describedby` para eles
 * quando foram renderizados (apontar para um `id` ausente deixa o nome vazio).
 * O `aria-labelledby` passado por quem chama vence.
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
 * Não modal, o popover fecha quando a página rola (ver `useCloseOnScroll`);
 * `Combobox` e `DatePicker` herdam daqui. `mobile="sheet"`: abaixo de 768px o
 * mesmo conteúdo abre numa gaveta, em vez de `modal={isMobile}` à mão.
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
 * O recuo é um eixo, como no `Card`. `none` serve o popover que hospeda um
 * componente inteiro (calendário, `Command`, lista): o conteúdo sangra até a
 * borda, e tira o `gap` junto.
 */
const popoverContentVariants = cva(
  [
    /** Above Sheet overlay/content (`z-(--z-sheet)`); below Toaster (`z-(--z-toast)`). */
    "relative z-(--z-popover) flex origin-(--radix-popover-content-transform-origin) flex-col text-sm outline-hidden",
    "max-h-(--radix-popover-content-available-height) max-w-(--radix-popover-content-available-width) overflow-y-auto overscroll-contain",
    // Quem declara um corpo rolável cede a rolagem da casca; senão o popover e o
    // `PopoverBody` rolariam os dois.
    "has-[[data-slot=popover-body]]:overflow-hidden",
    // O movimento é o eixo `motion`: `sprout` é a placa do tour, `field` o
    // desdobrar dos campos, `none` para quem anima por conta própria.
  ],
  {
    variants: {
      /**
       * A largura, na escada: `md` 288 (padrão), `sm` 224 para uma frase, `lg` 352
       * para um formulário curto, `auto` para quem hospeda um componente com largura
       * própria e `trigger` para a largura do gatilho.
       */
      size: {
        auto: "w-auto",
        sm: "w-56",
        md: "w-72",
        lg: "w-88",
        trigger: "w-(--radix-popover-trigger-width)",
      },
      /**
       * Quem pinta. `plate` (padrão) é a placa flutuante da régua. `none` não pinta
       * nada, para conteúdo que traz as próprias superfícies (placa em volta de placa
       * é o "fundo quebrado" que a regra proíbe); hoje nenhuma tela o usa.
       */
      surface: {
        plate: menuPanelSurfaceClassName,
        none: "overflow-visible",
      },
      /**
       * Como a placa entra e sai, sempre voltando ao gatilho. `sprout` (padrão) brota
       * do gatilho, como a placa do tour; `field` desdobra do campo (`Combobox`,
       * seletor do `Form`); `none` não anima (o `DatePicker`, o tour e a dica do
       * onboarding animam por conta própria).
       */
      motion: {
        sprout: "popover-sprout",
        field: "field-bloom",
        none: "",
      },
      padding: {
        // O recuo das tiras acompanha o do casco: onde o casco já recua, a tira não recua
        // duas vezes. Em `none` ela é dona do próprio (12/8).
        default:
          "gap-2.5 p-2.5 [--popover-strip-px:0px] [--popover-strip-py:0px]",
        none: "gap-0 p-0 [--popover-strip-px:--spacing(3)] [--popover-strip-py:--spacing(2)]",
      },
    },
    defaultVariants: { surface: "plate", padding: "default", size: "md", motion: "sprout" },
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
  motion,
  label,
  onCloseAutoFocus,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> &
  VariantProps<typeof popoverContentVariants> & {
    /** O nome para o leitor de tela, sem título à vista: vira um `PopoverTitle` `sr-only`. */
    label?: React.ReactNode;
  }) {
  const reactId = React.useId();
  const fechouPorRolagem = React.useContext(PopoverScrollCloseContext);
  const { folha } = React.useContext(PopoverModoContext);
  // O portal vai ao `body` da janela da moldura do catálogo, como o do `Tooltip`
  // e o do `Drawer`; fora dela o contexto é `null` e o app não muda.
  const janela = useViewportWindow();
  const [hasTitle, setHasTitle] = React.useState(false);
  const [hasDescription, setHasDescription] = React.useState(false);

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
    // O Provider fica por fora do Portal, e é isso que faz a saída existir: o
    // `Presence` do Radix lê o `getComputedStyle` do ref do filho, e com o Provider
    // no meio o ref se perde e o conteúdo desmonta no mesmo commit do
    // `data-state="closed"`, sem animação de saída. O contexto ainda alcança título e
    // descrição (atravessa portal).
    <PopoverLabelContext.Provider value={rotulos}>
      {folha ? (
        // No telefone, a gaveta: o mesmo conteúdo, sem placa nem seta; `PopoverTitle`
        // vira `DialogTitle` nela, e o destino do foco ao fechar atravessa.
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
          // Sem isto o popover encosta na borda da tela (a folga que o
          // `FormPickerPopoverContent` somava à mão).
          collisionPadding={collisionPadding}
          aria-labelledby={hasTitle ? rotulos.titleId : undefined}
          aria-describedby={hasDescription ? rotulos.descriptionId : undefined}
          data-padding={padding}
          onCloseAutoFocus={skipFocusAfterScrollClose(
            fechouPorRolagem,
            onCloseAutoFocus,
          )}
          className={cn(popoverContentVariants({ size, surface, padding, motion }), className)}
          {...props}
        >
          {label != null ? (
            <PopoverTitle className="sr-only">{label}</PopoverTitle>
          ) : null}
          {children}
          {process.env.NODE_ENV !== "production" &&
          props["aria-label"] == null &&
          props["aria-labelledby"] == null ? (
            <PopoverNameWarning titleId={rotulos.titleId} janela={janela} />
          ) : null}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
      )}
    </PopoverLabelContext.Provider>
  );
}

/**
 * Sem nome, o leitor de tela anuncia só "diálogo": em desenvolvimento, quem
 * abre um popover sem nome fica sabendo. O aviso é filho do `Content` (fechado,
 * o Radix não monta os filhos) e procura o título no DOM, não no `hasTitle`, que
 * só chega um render depois. Na gaveta o aviso é o do Radix.
 */
function PopoverNameWarning({
  titleId,
  janela,
}: {
  titleId: string;
  janela: ReturnType<typeof useViewportWindow>;
}) {
  React.useEffect(() => {
    if ((janela?.document ?? document).getElementById(titleId)) return;
    console.warn(
      "PopoverContent sem nome: passe `label` ou um `PopoverTitle` (pode ser sr-only).",
    );
  }, [titleId, janela]);
  return null;
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
 * A seta se paga quando o gatilho é um entre iguais (o dia numa grade, uma
 * célula de tabela). É a do `HoverCard`: `fill` e não `bg`, com os alfas da
 * placa espelhados à mão (são os dois espelhos da receita).
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
 * A faixa de topo, sem fio: o que a separa do corpo é o respiro dela mais a
 * dissolução do `PopoverBody`. O `relative z-10` a põe sobre o corpo (como no
 * `FormPickerPopoverSearch`).
 * Não ganha tipo de rótulo: é o par título+descrição que registra
 * `aria-labelledby`; uma faixa que é só rótulo põe um `<p>` com esse tipo dentro.
 * Título sobre descrição é par de identidade: sem `gap`.
 */
function PopoverHeader({
  className,
  closeButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * O × no canto, preso ao topo do título como o `endAdornment` do
   * `DialogHeaderRow`. Na gaveta some: a alça e o toque fora fecham.
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
 * O corpo rolável, para o popover que hospeda uma lista longa. Existe porque o
 * `PopoverContent` não pode ser o elemento mascarado (a máscara apagaria os
 * cantos do `bg-popover`, do anel e da sombra); quem rola e dissolve é este nó.
 * Modo sem faixa: o cabeçalho tem altura variável, e a dissolução acontece na
 * borda do corpo, logo abaixo dele.
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

/** A faixa de pé: espelho do cabeçalho, sem fio pela mesma razão. */
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
 * A confirmação curta: título, uma linha e Cancelar/Confirmar, para a ação de
 * baixo risco sem diálogo modal (o que não tem volta é `AlertDialog`). É um
 * `PopoverContent` inteiro. Um `onConfirm` que devolve `Promise` trava os botões
 * com o `Spinner` e fecha quando assenta.
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
