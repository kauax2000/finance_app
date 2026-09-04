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
        O espécime não abre aqui de propósito: abaixo de 768px o{" "}
        <code>Sheet</code> não é uma folha — ele é um <code>Drawer</code>, e
        seria esse componente que você veria. Abra o catálogo no desktop para
        ver a folha.
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
        <strong>Folha no desktop, gaveta no telefone</strong> — e uma API só. A
        superfície se escolhe aqui dentro: acima de 768px é um painel que desliza
        de uma borda; abaixo, é uma gaveta de verdade (<code>vaul</code>), que
        acompanha o dedo e fecha pelo gesto. Quem chama escreve{" "}
        <code>&lt;Sheet&gt;</code> nos dois casos. <strong>Este arquivo é só a
        superfície</strong> — título, cabeçalho, corpo e rodapé vêm do{" "}
        <code>Dialog</code>.
      </Usage>

      <DocSection
        title="Os quatro lados"
        description="side vale no desktop, e só. As laterais tomam a altura inteira e param em 384px; topo e base tomam a largura e a altura do conteúdo. Cada lado tem a borda do seu próprio lado — a folha encosta na tela, então só o gume que fica para dentro é desenhado. No telefone os quatro viram a mesma gaveta de baixo: um painel que entra pela lateral num aparelho de 375px não é um painel, é a tela inteira com uma sobra."
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
        title="Formulário no telefone"
        description="No telefone isto é uma gaveta. fillMobileViewport a faz alta — quase a tela inteira, com folga no topo e área segura embaixo; sem ela, a gaveta mede o próprio conteúdo e para em 85%. Dentro, a mesma tríade do diálogo: cabeçalho parado, DialogBody rolando, rodapé parado. A alça vem da superfície e é o gesto, não um desenho dele."
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
        title="Props · SheetContent"
        rows={[
          {
            prop: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"right"',
            description:
              "De onde ela entra — no desktop. Laterais tomam a altura e param em 384px; topo e base tomam a largura. No telefone é ignorado: ali é sempre gaveta de baixo.",
          },
          {
            prop: "fillMobileViewport",
            type: "boolean",
            default: "false",
            description:
              "Gaveta alta: quase a tela inteira, com folga no topo e área segura embaixo. Sem ela, a gaveta mede o conteúdo e para em 85%.",
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
              "A raiz, o gatilho e a saída. SheetClose é o passa-tudo: recebe asChild com um Button dentro.",
          },
          {
            prop: "SheetContent, SheetOverlay, SheetPortal",
            type: "@/components/ui/sheet",
            description:
              "A folha, o véu e o portal. É tudo o que este arquivo tem.",
          },
          {
            prop: "DialogHeader, DialogHeaderRow, DialogTitle, DialogDescription",
            type: "@/components/ui/dialog",
            description:
              "O cabeçalho. DialogTitle é obrigatório — é o nome acessível da folha, e sem ele o Radix avisa no console.",
          },
          {
            prop: "DialogBody, DialogFooter",
            type: "@/components/ui/dialog",
            description:
              "O corpo que rola e a tira de ações. Os dois leem o recuo da folha (16px) pela mesma variável que leem o do diálogo (24px).",
          },
          {
            prop: "DialogCloseButton",
            type: "@/components/ui/dialog",
            description:
              "O ×. A folha não o injeta mais — 16 das 36 chamadas o desligavam, porque ele flutua sobre o conteúdo e some atrás de um cabeçalho fixo. Quem quer, compõe; dentro de um cabeçalho, className=\"static\".",
          },
        ]}
      />

      <DocNote title="Cancelar vem antes no código, e embaixo na tela">
        No DOM, <code>Cancelar</code> precede a ação — é a ordem que o teclado e
        o leitor de tela seguem, e a saída vem primeiro. Na tela do telefone a
        ordem se inverte sozinha, porque <code>DialogFooter</code> é{" "}
        <code>flex-col-reverse</code>: a ação fica em cima da pilha, ao alcance
        do polegar. No desktop vira linha, com a saída à esquerda e a ação à
        direita. <strong>Não escreva <code>flex-col</code> aqui</strong> — ele
        anula essa inversão e devolve o cancelar para cima.
      </DocNote>

      <DocNote title="Por que a folha vira gaveta">
        Porque ela já se vestia de gaveta sem ser uma. O app desenhava a alça
        com uma <code>div</code> <code>aria-hidden</code> e{" "}
        <strong>nenhum handler</strong>, e a &ldquo;física&rdquo; eram dois
        keyframes de CSS — uma animação de entrada, que não responde ao dedo.
        Trinta e sete telas prometiam o arraste e não entregavam, enquanto o{" "}
        <code>vaul</code>, que faz isso de verdade, estava no projeto com zero
        usos. Agora a promessa e o gesto são a mesma coisa.
      </DocNote>

      <DocNote title="Por que a cromagem é do Dialog">
        Porque os dois <strong>são a mesma primitiva</strong>:{" "}
        <code>Sheet</code> é <code>Dialog.Root</code> do Radix, então{" "}
        <code>DialogTitle</code> encontra o contexto de que precisa dentro de um{" "}
        <code>SheetContent</code> — e dentro da gaveta também, porque o{" "}
        <code>vaul</code> é construído sobre o mesmo{" "}
        <code>@radix-ui/react-dialog</code>. Medido em runtime: o{" "}
        <code>aria-labelledby</code> da gaveta aponta para o <code>id</code> que
        o título do Radix gerou. E porque a duplicação não era teórica —{" "}
        <strong>18 dos 31 arquivos</strong> que usavam a cromagem da folha já
        importavam a do diálogo no mesmo fonte, porque a mesma tela é{" "}
        <code>Dialog</code> no desktop e <code>Sheet</code> no telefone. Eram
        dois nomes para um título só.
      </DocNote>

      <DocNote title="A folha não injeta o ×">
        Ela injetava, e <strong>16 das 36 chamadas o desligavam</strong> — o
        motivo está escrito no próprio projeto: o × flutuante passa por cima do
        conteúdo e some atrás do cabeçalho fixo assim que a pessoa rola. Agora
        ele é uma peça, <code>DialogCloseButton</code>, e quem quer o compõe. A
        reserva de espaço no cabeçalho não vem mais de um prop: vem de{" "}
        <strong>haver</strong> um ×, detectado por{" "}
        <code>has-[&gt;[data-slot=dialog-close-button]]</code>. Dentro de um{" "}
        <code>DialogHeaderRow</code> quem reserva é a coluna do adorno, e aí não
        há o que reservar.
      </DocNote>

      <DocNote title="O recuo é 16, não 24">
        A folha declara <code>--dialog-px</code> em 16px; o diálogo, em 24. A
        folha encosta na borda da tela e o dedo já está ali; o diálogo flutua e
        pede mais ar. É a mesma peça de cabeçalho lendo a medida do contêiner em
        que ela caiu — que é exatamente para isso que a variável existe.
      </DocNote>

      <DocNote title="A animação tem curva própria">
        Entrada e saída usam <code>cubic-bezier(0.32, 0.72, 0, 1)</code> em
        300ms, que é o token <code>--ease-emphasized</code>. Com{" "}
        <code>fillMobileViewport</code> quem move é o keyframe de{" "}
        <code>globals.css</code>, com física de gaveta. Com{" "}
        <code>prefers-reduced-motion</code>, o deslize vira um fade curto em vez
        de sumir de vez: a folha ainda precisa comunicar que apareceu.
      </DocNote>

      <DocNote title="A folha fica acima do chrome do telefone">
        <code>--z-sheet</code> (70) passa por cima da navegação de baixo e do
        botão flutuante, que vivem em <code>--z-modal</code> (50), e passa por
        baixo do <code>Toaster</code>, em <code>--z-toast</code> (100). Uma
        confirmação precisa aparecer sobre a folha que a disparou.
      </DocNote>
    </>
  )
}
