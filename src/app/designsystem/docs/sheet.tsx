"use client"

import Link from "next/link"
import * as React from "react"

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
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const LADOS = ["right", "left", "top", "bottom"] as const
const VARIANTES = ["floating", "flush"] as const
const TAMANHOS = ["sm", "md", "lg", "full"] as const

const CAMPOS = ["Descrição", "Valor", "Data", "Categoria"]


function DemoEixos() {
  const [side, setSide] = React.useState<(typeof LADOS)[number]>("right")
  const [variant, setVariant] = React.useState<(typeof VARIANTES)[number]>("floating")
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("sm")
  const lateral = side === "left" || side === "right"

  return (
    <div className="flex w-full flex-col gap-4">
      <Controles
        inicio={
          <>
            <Eixo rotulo="Lado" valores={LADOS} valor={side} onChange={setSide} />
            <Eixo rotulo="Variante" valores={VARIANTES} valor={variant} onChange={setVariant} />
            <Eixo rotulo="Largura" valores={TAMANHOS} valor={size} onChange={setSize} />
          </>
        }
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="self-start">
            abrir a folha
          </Button>
        </SheetTrigger>
        <SheetContent side={side} variant={variant} size={size}>
          <DialogHeader>
            <DialogTitle>Nova transação</DialogTitle>
            <DialogDescription>
              {`Entra de ${side}, ${variant}${lateral ? `, ${size}` : ""}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            {CAMPOS.map((campo, i) => (
              <Field key={campo}>
                <FieldLabel htmlFor={`ds-sheet-eixo-${i}`}>{campo}</FieldLabel>
                <Input id={`ds-sheet-eixo-${i}`} placeholder={campo} />
              </Field>
            ))}
          </DialogBody>
          <DialogFooter>
            <SheetClose asChild>
              <Button type="button" variant="tertiary">
                cancelar
              </Button>
            </SheetClose>
            <Button type="submit">salvar</Button>
          </DialogFooter>
          <DialogCloseButton />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** Salvar trava a folha; alterar e fechar pergunta. */
function DemoSalvar() {
  const [aberta, setAberta] = React.useState(false)
  const [valor, setValor] = React.useState("")
  const [salvando, setSalvando] = React.useState(false)

  return (
    <Sheet
      open={aberta}
      onOpenChange={(v) => {
        setAberta(v)
        if (!v) setValor("")
      }}
      pending={salvando}
      dirty={valor !== ""}
      confirmDiscard
    >
      <SheetTrigger asChild>
        <Button variant="outline">editar a descrição</Button>
      </SheetTrigger>
      <SheetContent>
        <DialogHeader>
          <DialogTitle>Editar transação</DialogTitle>
          <DialogDescription>
            Escreva algo e tente fechar; depois salve.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="ds-sheet-descricao">Descrição</FieldLabel>
            <Input
              id="ds-sheet-descricao"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Mercado"
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <SheetClose asChild>
            <Button type="button" variant="tertiary" disabled={salvando}>
              cancelar
            </Button>
          </SheetClose>
          <Button
            type="button"
            disabled={salvando}
            onClick={() => {
              setSalvando(true)
              window.setTimeout(() => {
                setSalvando(false)
                setValor("")
                setAberta(false)
              }, 1500)
            }}
          >
            {salvando ? "Salvando…" : "salvar"}
          </Button>
        </DialogFooter>
        <DialogCloseButton />
      </SheetContent>
    </Sheet>
  )
}

function DemoEmpilhada() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">abrir o detalhe</Button>
      </SheetTrigger>
      <SheetContent size="md">
        <DialogHeader>
          <DialogTitle>Mercado</DialogTitle>
          <DialogDescription>−R$ 612,40 · 1 de outubro</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">editar</Button>
            </SheetTrigger>
            <SheetContent>
              <DialogHeader>
                <DialogTitle>Editar transação</DialogTitle>
                <DialogDescription>
                  A folha de baixo recuou; feche esta e ela volta.
                </DialogDescription>
              </DialogHeader>
              <DialogCloseButton />
            </SheetContent>
          </Sheet>
        </DialogBody>
        <DialogCloseButton />
      </SheetContent>
    </Sheet>
  )
}

function DemoLarguraAoLado() {
  return (
    <div className="flex flex-wrap gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">largura arrastável</Button>
        </SheetTrigger>
        <SheetContent resizable="ds-sheet-demo">
          <DialogHeader>
            <DialogTitle>Arraste a aresta da esquerda</DialogTitle>
            <DialogDescription>
              Ou foque nela e use as setas. A largura fica guardada para a
              próxima abertura.
            </DialogDescription>
          </DialogHeader>
          <DialogCloseButton />
        </SheetContent>
      </Sheet>
      <Sheet modal={false}>
        <SheetTrigger asChild>
          <Button variant="outline">ao lado, sem véu</Button>
        </SheetTrigger>
        <SheetContent>
          <DialogHeader>
            <DialogTitle>Detalhe ao lado</DialogTitle>
            <DialogDescription>
              A página continua clicável, e clicar nela não fecha a folha. Esc
              e o × fecham.
            </DialogDescription>
          </DialogHeader>
          <DialogCloseButton />
        </SheetContent>
      </Sheet>
    </div>
  )
}

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
        <strong>Folha no desktop, gaveta no telefone</strong>, com uma API só: acima de 768px é uma placa que desliza de uma borda; abaixo, ela <strong>é</strong> o <code>Drawer</code> — a mesma gaveta, com a superfície de vidro dele, a alça e a altura que acompanha o conteúdo. <code>surface=&quot;panel&quot;</code> fixa o painel em qualquer largura, e só a navegação usa. Título, corpo e rodapé vêm do <code>Dialog</code>; gaveta em toda largura é <code>Drawer</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="side é a borda de onde ela entra; variant, a placa solta (floating, o padrão) ou encostada (flush); size, a largura das laterais. O casco já é o de formulário: cabeçalho e rodapé parados, DialogBody rolando."
        code={`<Sheet>
  <SheetTrigger asChild><Button>Abrir</Button></SheetTrigger>
  <SheetContent side="right" size="md">
    <DialogHeader>…</DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>…</DialogFooter>
    <DialogCloseButton />
  </SheetContent>
</Sheet>`}
        previewClassName="items-stretch"
      >
        {isMobile ? avisoDeGaveta : <DemoEixos />}
      </DocSection>

      <DocNote title="floating é o padrão, numa placa chapada">
        Como o <code>Sidebar</code> e o <code>Menubar</code>: calha de 8px, raio 18, o anel de 1px das placas e a sombra. O material é <code>--popover</code>, chapado — o véu já separa a folha da página, e o borrão por baixo dele era uma segunda separação para a mesma coisa. <code>flush</code> encosta na tela e desenha só o gume de dentro; as folhas do app o pedem por enquanto. Os dois são do desktop: no telefone a superfície é a do <code>Drawer</code>.
      </DocNote>

      <DocNote title="Entra na mola, sai curta, e o conteúdo sobe atrás">
        O deslize assenta na mola da casa (<code>--ease-spring</code>, 500ms) e o fechar leva 200ms sem quique. Cabeçalho, corpo e rodapé sobem 3px em cascata logo atrás (<code>sheet-reveal</code>). Com <code>prefers-reduced-motion</code> o bloco global corta toda entrada: a folha simplesmente aparece.
      </DocNote>

      <DocSection
        title="Salvando e descartando"
        description="pending trava Esc, véu, × e o arraste da gaveta enquanto salva, e marca aria-busy. dirty com confirmDiscard pergunta antes de fechar — a mesma régua do Dialog. Fechar por fora, depois de salvar, não pergunta."
        code={`<Sheet pending={salvando} dirty={alterou} confirmDiscard>`}
      >
        <DemoSalvar />
      </DocSection>

      <DocSection
        title="Folha sobre folha"
        description="Uma folha aberta de dentro de outra cobre a de baixo, que recua — encolhe e se afasta da borda — e volta quando a de cima fecha. No telefone a folha é o Drawer, e Drawer e Sheet se empilham entre si: a gaveta de dentro vira aninhada sozinha, e a de baixo recua."
        code={`<SheetContent>
  …
  <Sheet>
    <SheetTrigger>editar</SheetTrigger>
    <SheetContent>…</SheetContent>
  </Sheet>
</SheetContent>`}
      >
        {isMobile ? avisoDeGaveta : <DemoEmpilhada />}
      </DocSection>

      <DocSection
        title="Largura arrastável e painel ao lado"
        description="resizable põe uma costura na aresta de dentro das laterais: arraste, ou foque e use as setas; com uma string, a largura fica guardada. modal={false} é o painel ao lado: sem véu, a página continua clicável e clicar nela não fecha."
        code={`<SheetContent resizable="detalhe-transacao">…</SheetContent>
<Sheet modal={false}>…</Sheet>`}
      >
        {isMobile ? avisoDeGaveta : <DemoLarguraAoLado />}
      </DocSection>

      <DocNote title="Alturas no telefone: snapPoints">
        <code>{"<Sheet snapPoints={[0.5, 1]}>"}</code> faz a gaveta parar em meia altura e subir até cheia pelo arraste; no desktop não vale. É a mesma gaveta do <Link href="/designsystem/drawer">Drawer</Link>, e a demonstração mora lá: dentro da moldura de telefone do catálogo o <code>vaul</code> mede os degraus pela janela <strong>de fora</strong> (medido: 431px de uma tela de 667), então a prévia aqui mostraria a altura errada.
      </DocNote>

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
          {
            prop: "pending",
            type: "boolean",
            default: "false",
            description: "Salvando: nada fecha a folha até acabar, e ela marca aria-busy.",
          },
          {
            prop: "dirty / confirmDiscard",
            type: "boolean / boolean | { title, description }",
            default: "false",
            description: "Com os dois, fechar pergunta \"Descartar alterações?\".",
          },
          {
            prop: "modal",
            type: "boolean",
            default: "true",
            description: "false é o painel ao lado: sem véu, e clicar fora não fecha.",
          },
          {
            prop: "snapPoints",
            type: "(number | string)[]",
            description: "As alturas em que a gaveta para, no telefone.",
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
            type: '"floating" | "flush"',
            default: '"floating"',
            description:
              "A placa solta ou encostada, só no desktop; no telefone é ignorado.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "full"',
            default: '"sm"',
            description:
              "A largura das laterais: 384 · 448 · 512 · a janela menos 4rem. Topo e base tomam a largura.",
          },
          {
            prop: "resizable",
            type: "boolean | string",
            default: "false",
            description:
              "A aresta de dentro arrasta a largura; a string é a chave em que ela fica guardada.",
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

      <DocNote title="A calha conta a área segura — nas verticais">
        As bordas verticais leem <code>max(calha, env(safe-area-inset-…))</code>, senão o canto fica atrás do indicador de home do iPhone. A área segura horizontal é lacuna do app inteiro, e o dono dela é a casca.
      </DocNote>

      <DocNote title="A cromagem é do Dialog">
        <code>Sheet</code> é <code>Dialog.Root</code> do Radix, e o <code>vaul</code> usa o mesmo <code>@radix-ui/react-dialog</code>: <code>DialogTitle</code> encontra o contexto na folha e na gaveta. Um <code>Dialog surface=&quot;auto&quot;</code> é esta gaveta no telefone.
      </DocNote>

      <DocNote title="A folha não injeta o ×">
        O × é <code>DialogCloseButton</code>, composto como último filho: injetado, ele sumia atrás do cabeçalho fixo ao rolar. A reserva de espaço no título vem de <strong>haver</strong> um ×.
      </DocNote>

      <DocNote title="O recuo é 16, não 24">
        A folha declara <code>--dialog-px</code> em 16px; o diálogo, em 24. A folha encosta na borda da tela, e o diálogo flutua e pede mais ar — a mesma peça de cabeçalho lê a medida do contêiner.
      </DocNote>

      <DocNote title="A folha fica acima do chrome do telefone">
        <code>--z-sheet</code> (70) fica acima da navegação de baixo e do botão flutuante (<code>--z-modal</code>, 50) e abaixo do <code>Toaster</code> (<code>--z-toast</code>, 100): uma confirmação precisa aparecer sobre a folha que a disparou.
      </DocNote>
    </>
  )
}
