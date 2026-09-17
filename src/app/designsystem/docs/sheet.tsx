"use client"

import { InformationCircleIcon } from "@heroicons/react/16/solid"
import Link from "next/link"

import {
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIDES = ["left", "right", "top", "bottom"] as const

const CAMPOS = [
  "Descrição",
  "Valor",
  "Data",
  "Categoria",
  "Forma de pagamento",
  "Observação",
]

export default function SheetDoc() {
  const isMobile = useIsMobile()

  /**
   * Nesta largura o `Sheet` **é** uma gaveta — e uma página chamada "Sheet"
   * que abre um `Drawer` ensina o contrário do que documenta. O espécime cede
   * o lugar para a regra, com o caminho para o componente que está de fato
   * respondendo. É a mesma escolha do catálogo com o `HoverCard`: demonstrar
   * no aparelho errado é pior que não demonstrar.
   */
  const avisoDeGaveta = (
    <Alert tone="info" className="w-full">
      <InformationCircleIcon />
      <AlertTitle>Nesta largura, a folha é uma gaveta</AlertTitle>
      <AlertDescription>
        Abaixo de 768px o <code>Sheet</code> é uma gaveta, e seria ela que você
        veria. Abra o catálogo no desktop para ver a folha.
      </AlertDescription>
      <AlertActions>
        <AlertAction asChild>
          <Link href="/designsystem/drawer">Ver o Drawer</Link>
        </AlertAction>
      </AlertActions>
    </Alert>
  )

  return (
    <>
      <Usage>
        <strong>Folha no desktop, gaveta no telefone</strong>, com uma API só: acima de 768px é um painel que desliza de uma borda; abaixo, uma gaveta do <code>vaul</code>, que acompanha o dedo. <code>surface=&quot;panel&quot;</code> fixa o painel em qualquer largura, e só a navegação usa. Título, corpo e rodapé vêm do <code>Dialog</code>; gaveta em toda largura é <code>Drawer</code>.
      </Usage>

      <DocSection
        title="Os quatro lados"
        description="side vale só no desktop: as laterais tomam a altura e param em 384px, topo e base tomam a largura, e só o gume de dentro tem borda. No telefone os quatro viram a mesma gaveta de baixo."
        code={`<Sheet>
  <SheetTrigger asChild><Button>Abrir</Button></SheetTrigger>
  <SheetContent side="bottom">
    …
    <DialogCloseButton />
  </SheetContent>
</Sheet>`}
      >
        {isMobile
          ? avisoDeGaveta
          : SIDES.map((side) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="outline">{side}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <DialogHeader>
                <DialogTitle>Nova transação</DialogTitle>
                <DialogDescription>
                  Entra de <code>{side}</code>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <SheetClose asChild>
                  <Button type="button" variant="tertiary">
                    Cancelar
                  </Button>
                </SheetClose>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
              <DialogCloseButton />
            </SheetContent>
          </Sheet>
        ))}
      </DocSection>

      <DocSection
        title="Encostado e flutuante"
        description="flush cola nas bordas e é o padrão. floating abre uma calha de 8px, arredonda os cantos e fecha a borda em volta. Vale só no desktop."
        code={`<SheetContent side="left" variant="floating">…</SheetContent>`}
        previewClassName="items-start"
      >
        {isMobile ? (
          avisoDeGaveta
        ) : (
          <div className="flex flex-wrap gap-2">
            {(
              [
                { lado: "left", v: "flush", rotulo: "left · flush (padrão)" },
                { lado: "left", v: "floating", rotulo: "left · floating" },
                { lado: "bottom", v: "flush", rotulo: "bottom · flush" },
                { lado: "bottom", v: "floating", rotulo: "bottom · floating" },
              ] as const
            ).map((c) => (
              <Sheet key={c.rotulo}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    {c.rotulo}
                  </Button>
                </SheetTrigger>
                <SheetContent side={c.lado} variant={c.v}>
                  <DialogHeader>
                    <DialogTitle>{c.rotulo}</DialogTitle>
                    <DialogDescription>
                      O <code>flush</code> encosta na tela; o{" "}
                      <code>floating</code> deixa a página aparecer em volta.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogCloseButton />
                </SheetContent>
              </Sheet>
            ))}
          </div>
        )}
      </DocSection>

      <DocSection
        title="Formulário no telefone"
        description="fillMobileViewport leva a gaveta a quase a tela inteira; sem ela, a gaveta mede o conteúdo e para em 85%. Dentro, a tríade do diálogo: cabeçalho parado, DialogBody rolando, rodapé parado. A alça vem da superfície e é o próprio gesto."
        code={`<SheetContent fillMobileViewport>
  <DialogHeader>
    <DialogTitle>Nova transação</DialogTitle>
  </DialogHeader>
  <DialogBody>…</DialogBody>
  <DialogFooter>…</DialogFooter>
  <DialogCloseButton />
</SheetContent>`}
      >
        {isMobile ? avisoDeGaveta : (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Abrir formulário</Button>
          </SheetTrigger>
          <SheetContent
            fillMobileViewport
            className="gap-0 px-0 pt-0"
          >
            <DialogHeader className="pb-3">
              <DialogTitle>Nova transação</DialogTitle>
              <DialogDescription>
                O que entrou ou saiu, e de onde.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
              {CAMPOS.map((campo, i) => (
                <Field key={campo}>
                  <FieldLabel htmlFor={`ds-sheet-campo-${i}`}>
                    {campo}
                  </FieldLabel>
                  <Input id={`ds-sheet-campo-${i}`} placeholder={campo} />
                </Field>
              ))}
            </DialogBody>
            <DialogFooter>
              <SheetClose asChild>
                <Button type="button" variant="tertiary">
                  Cancelar
                </Button>
              </SheetClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
            <DialogCloseButton />
          </SheetContent>
        </Sheet>
        )}
      </DocSection>

      <PropsTable
        title="Props · Sheet"
        rows={[
          {
            prop: "surface",
            type: '"auto" | "panel"',
            default: '"auto"',
            description:
              "auto é painel acima de 768px e gaveta abaixo; panel fixa o painel para navegação presa a uma borda, e gaveta em toda largura é o Drawer.",
          },
        ]}
      />

      <PropsTable
        title="Props · SheetContent"
        rows={[
          {
            prop: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"right"',
            description:
              "De onde ela entra, só no desktop; no telefone é sempre a gaveta de baixo.",
          },
          {
            prop: "variant",
            type: '"flush" | "floating"',
            default: '"flush"',
            description:
              "Encostada ou flutuante, só no desktop; no telefone é ignorado.",
          },
          {
            prop: "fillMobileViewport",
            type: "boolean",
            default: "false",
            description:
              "Gaveta alta, quase a tela inteira; sem ela, mede o conteúdo e para em 85%.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "Sheet, SheetTrigger, SheetClose",
            type: "@/components/ui/sheet",
            description:
              "A raiz, o gatilho e a saída; SheetClose recebe asChild com um Button.",
          },
          {
            prop: "SheetContent, SheetOverlay, SheetPortal",
            type: "@/components/ui/sheet",
            description:
              "A folha, o véu e o portal — tudo o que este arquivo tem.",
          },
          {
            prop: "DialogHeader, DialogHeaderRow, DialogTitle, DialogDescription",
            type: "@/components/ui/dialog",
            description:
              "O cabeçalho; DialogTitle é obrigatório, porque é o nome acessível da folha.",
          },
          {
            prop: "DialogBody, DialogFooter",
            type: "@/components/ui/dialog",
            description:
              "O corpo que rola e a tira de ações, lendo o recuo da folha (16px).",
          },
          {
            prop: "DialogCloseButton",
            type: "@/components/ui/dialog",
            description:
              "O ×, que a folha não injeta: quem quer compõe; dentro de um cabeçalho, placement=\"inline\".",
          },
        ]}
      />

      <DocNote title="Cancelar vem antes no código, e embaixo na tela">
        No DOM, <code>Cancelar</code> precede a ação — é a ordem do teclado e do leitor de tela. <code>DialogFooter</code> é <code>flex-col-reverse</code>, então no telefone a ação fica em cima, ao alcance do polegar, e no desktop vira linha. <strong>Não escreva <code>flex-col</code> aqui</strong>: ele anula a inversão.
      </DocNote>

      <DocNote title="O material é o mesmo em flush e floating">
        A folha é modal: há o véu e a página inteira atrás, então o material borrado da <Link href="/designsystem/dialog">placa modal</Link> serve os dois. O eixo mexe em geometria e em nada mais.
      </DocNote>

      <DocNote title="A calha conta a área segura — nas verticais">
        As bordas verticais leem <code>max(calha, env(safe-area-inset-…))</code>, senão o canto fica atrás do indicador de home do iPhone. A área segura horizontal é lacuna do app inteiro, e o dono dela é a casca.
      </DocNote>

      <DocNote title="A cromagem é do Dialog">
        <code>Sheet</code> é <code>Dialog.Root</code> do Radix, e o <code>vaul</code> usa o mesmo <code>@radix-ui/react-dialog</code>: <code>DialogTitle</code> encontra o contexto na folha e na gaveta. A mesma tela costuma ser <code>Dialog</code> no desktop e <code>Sheet</code> no telefone.
      </DocNote>

      <DocNote title="A folha não injeta o ×">
        O × é <code>DialogCloseButton</code>, composto como último filho: injetado, ele sumia atrás do cabeçalho fixo ao rolar. A reserva de espaço no título vem de <strong>haver</strong> um ×.
      </DocNote>

      <DocNote title="O recuo é 16, não 24">
        A folha declara <code>--dialog-px</code> em 16px; o diálogo, em 24. A folha encosta na borda da tela, e o diálogo flutua e pede mais ar — a mesma peça de cabeçalho lê a medida do contêiner.
      </DocNote>

      <DocNote title="A animação tem curva própria">
        Entrada e saída usam <code>--ease-emphasized</code> em 300ms; com <code>fillMobileViewport</code>, o keyframe de gaveta. Com <code>prefers-reduced-motion</code> o deslize vira um fade curto: a folha ainda precisa comunicar que apareceu.
      </DocNote>

      <DocNote title="A folha fica acima do chrome do telefone">
        <code>--z-sheet</code> (70) fica acima da navegação de baixo e do botão flutuante (<code>--z-modal</code>, 50) e abaixo do <code>Toaster</code> (<code>--z-toast</code>, 100): uma confirmação precisa aparecer sobre a folha que a disparou.
      </DocNote>
    </>
  )
}
