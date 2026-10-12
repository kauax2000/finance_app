"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowPathRoundedSquareIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid"

import { BanknotesIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerAction,
  DrawerActions,
  DrawerCancel,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

export default function DrawerDoc() {
  return (
    <>
      <Usage>
        Uma gaveta que se arrasta, <strong>em qualquer largura de tela</strong>.
        O <code>Sheet</code> troca de superfície com a largura — painel no
        desktop e, no telefone, <strong>este</strong> <code>Drawer</code>, a
        mesma peça; o <code>Drawer</code> é gaveta sempre.
        Escolha-o quando o gesto é a afordância.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Drawer>
  <DrawerTrigger asChild><Button>Abrir</Button></DrawerTrigger>
  <DrawerContent>
    <DialogHeader>
      <DialogTitle>Filtros</DialogTitle>
      <DialogDescription>Arraste para baixo para fechar.</DialogDescription>
    </DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>
      <DrawerClose asChild>
        <Button type="button" variant="tertiary">Cancelar</Button>
      </DrawerClose>
      <Button>Aplicar</Button>
    </DialogFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Abrir filtros</Button>
          </DrawerTrigger>
          <DrawerContent>
            {/* A alça e o contorno da gaveta já dizem onde ela começa — o fio
                do cabeçalho seria um terceiro sinal para a mesma divisão. */}
            <DialogHeader>
              <DialogTitle>Filtros</DialogTitle>
              <DialogDescription>
                Arraste a alça para baixo para fechar, ou toque fora.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-muted-foreground">
                O corpo rola entre o cabeçalho e o rodapé, que ficam parados.
              </p>
            </DialogBody>
            <DialogFooter>
              <DrawerClose asChild>
                <Button type="button" variant="tertiary">
                  Cancelar
                </Button>
              </DrawerClose>
              <Button>Aplicar</Button>
            </DialogFooter>
          </DrawerContent>
        </Drawer>
      </DocSection>

      <DocSection
        title="Superfície e largura"
        code={`<DrawerContent variant="inset" size="md">…</DrawerContent>`}
        previewClassName="flex-col items-start gap-3"
      >
        <SuperficieDemo />
      </DocSection>

      <DocSection
        title="Folha de ações"
        description={
          <>
            <code>DrawerActions</code> + <code>DrawerAction</code> é o action
            sheet: linhas de 52px com o ícone a 20px (o <code>20/solid</code>),
            a destrutiva em vermelho, e o <code>DrawerCancel</code> separado
            embaixo. Cada ação fecha a gaveta depois de rodar;{" "}
            <code>asChild</code> leva a linha para um link. É o &ldquo;+
            Adicionar&rdquo; e o menu da conta no telefone.
          </>
        }
        code={`<DrawerContent>
  <DialogHeader className="sr-only">…</DialogHeader>
  <DrawerActions>
    <DrawerAction onClick={editar}><PencilSquareIcon />Editar</DrawerAction>
    <DrawerAction variant="destructive" onClick={excluir}><TrashIcon />Excluir</DrawerAction>
  </DrawerActions>
  <DrawerCancel />
</DrawerContent>`}
      >
        <AcoesDemo />
      </DocSection>

      <DocSection
        title="Degraus, gaveta sobre gaveta e o fundo que encolhe"
        description={
          <>
            <code>snapPoints</code> faz a gaveta parar em degraus — aqui, 45%
            da tela e a tela cheia; puxe para subir. Uma <code>Drawer</code>{" "}
            aberta dentro de outra vira aninhada sozinha, e a de baixo recua —
            e <code>Drawer</code> e <code>Sheet</code> se empilham entre si,
            porque no telefone a folha é esta gaveta.{" "}
            <code>scaleBackground</code> encolhe a página atrás, o gesto do
            iOS.
          </>
        }
        code={`<Drawer snapPoints={[0.45, 1]}>…</Drawer>
<Drawer scaleBackground>…</Drawer>
{/* dentro de uma DrawerContent: */}
<Drawer>…</Drawer>`}
        previewClassName="flex-col items-start gap-3"
      >
        <GestosDemo />
      </DocSection>

      <DocSection
        title="Salvando, não-modal, altura e cabeçalho fixo"
        description={
          <>
            <code>pending</code> trava a gaveta: arrastar, tocar fora, Esc e{" "}
            <strong>tocar a alça</strong> não fecham. Com{" "}
            <code>modal={"{false}"}</code> ela fica presa embaixo sem véu, e a
            página continua usável. A altura acompanha o conteúdo, animando em
            vez de saltar; e sem <code>DialogBody</code> o meio rola entre o
            cabeçalho e o rodapé parados, dissolvendo nas bordas.
          </>
        }
        code={`<Drawer pending={salvando}>…</Drawer>
<Drawer modal={false} dismissible={false} snapPoints={[0.18, 0.6]}>…</Drawer>`}
        previewClassName="flex-col items-start gap-3"
      >
        <ComportamentoDemo />
      </DocSection>

      <DocNote title="A largura existe por causa do desktop">
        Gaveta de ponta a ponta numa janela larga vira linha de leitura longa
        demais. <code>full</code> é o padrão, o comportamento do telefone;{" "}
        <code>md</code> e <code>lg</code> centralizam e param, e{" "}
        <code>variant=&quot;inset&quot;</code> solta a gaveta das bordas — é por
        isso que as demonstrações desta página, abertas numa janela larga, o
        usam. No telefone toda gaveta é a <code>flush</code>, o padrão: o{" "}
        <code>Popover</code>, os menus, o &ldquo;+ Adicionar&rdquo; e o menu da
        conta.
      </DocNote>

      <DocNote title="A cromagem vem do Dialog — aqui não existe DrawerHeader">
        Cabeçalho, título, descrição, corpo e rodapé são as peças{" "}
        <code>Dialog*</code>, as mesmas da{" "}
        <Link href="/designsystem/sheet">folha</Link>: o <code>vaul</code> é
        construído sobre <code>@radix-ui/react-dialog</code>, então{" "}
        <code>DialogTitle</code> acha o contexto dentro de{" "}
        <code>DrawerContent</code>. O cabeçalho é alinhado à esquerda em toda
        largura.
      </DocNote>

      <DocSection
        title="A alça"
        description="A barra no topo diz isto se arrasta, e é o próprio alvo do gesto: o DragHandle, que mora no drawer.tsx e que o Sheet também veste quando vira gaveta no telefone. Nenhuma tela a escreve. O contorno tracejado é a área de acerto que o vaul injeta, invisível numa gaveta real: 44px no dedo, 20 no mouse. Numa gaveta de cima ela troca de lado sozinha, para a borda que o dedo puxa."
        code={`// A superfície já a compõe. Numa tela, isto é tudo:
<DrawerContent>
  <DialogHeader>…</DialogHeader>
</DrawerContent>

// só nesta demonstração, para o alvo aparecer
<DrawerContent className="[&_[data-vaul-handle-hitarea]]:outline-2 …">`}
      >
        {(["bottom", "top"] as const).map((direction) => (
          <Drawer key={direction} direction={direction}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm">
                {direction === "bottom" ? "ver a alça e o alvo" : "gaveta de cima"}
              </Button>
            </DrawerTrigger>
            <DrawerContent
              variant="inset"
              size="md"
              className="[&_[data-vaul-handle-hitarea]]:outline-2 [&_[data-vaul-handle-hitarea]]:outline-dashed [&_[data-vaul-handle-hitarea]]:outline-primary-accent"
            >
              <DialogHeader>
                <DialogTitle>
                  {direction === "bottom" ? "44 no dedo, 20 no mouse" : "A alça troca de lado"}
                </DialogTitle>
                <DialogDescription>
                  {direction === "bottom"
                    ? "Arraste a alça, ou solte no meio do caminho e veja a gaveta voltar."
                    : "Ela nasce na borda que o dedo puxa, e sabe disso sozinha."}
                </DialogDescription>
              </DialogHeader>
            </DrawerContent>
          </Drawer>
        ))}
      </DocSection>

      <DocNote title="A alça é da superfície, e é o gesto — não o desenho dele">
        <code>DrawerContent</code> e o <code>Sheet</code> no telefone a compõem, como compõem a borda e a sombra. Uma tela que escrevesse a própria alça teria duas, e só uma arrastaria. Ela <strong>não fecha no clique</strong>: numa gaveta comum (sem <code>snapPoints</code>, com <code>dismissible</code>) tocar nela é um no-op, e quem fecha é o ×, o véu e o <kbd>Esc</kbd>. Por isso <code>showHandle</code> só se desliga junto com <code>dismissible={"{false}"}</code> — alça sem gesto promete o que não existe. Ela é <code>aria-hidden</code>: um leitor de tela não tem o que fazer com ela, e a superfície sempre traz outra saída.
      </DocNote>

      <DocNote title="Toda medida da alça leva !, e a tinta é 75%">
        O vaul injeta <code>[data-vaul-handle]</code> numa folha sem camada, e CSS sem camada vence as utilities do Tailwind em qualquer especificidade; só <code>!</code> inverte a ordem, e <code>drawer-drag-handle.test.ts</code> tranca a lista. A tinta é <code>--muted-foreground</code> a 75%, o primeiro degrau que passa nos 3:1 da WCAG 1.4.11 sobre a folha de vidro nos dois temas (a pega do <code>Resizable</code> fica em 70% porque vive entre painéis opacos); cursor e toque vão a 90%, em par. No mouse a área de acerto é 20px, o que o vaul tentou fazer com uma regra inválida — e cabe na folga da alça, por isso o <code>my-2.5</code> dela é estrutural.
      </DocNote>


      <DocNote title="Só o eixo vertical">
        <code>direction</code> aceita <code>bottom</code> e <code>top</code>: a
        alça do <code>vaul</code> declara <code>touch-action: pan-y</code> e só
        arrasta na vertical. Painel preso a uma borda lateral é o{" "}
        <Link href="/designsystem/sheet">Sheet</Link> no desktop.
      </DocNote>

      <DocNote title="Drawer, Sheet ou Dialog?">
        <code>Drawer</code> para conteúdo curto e casual, que se descarta com o
        polegar, e para a folha de ações. Formulário é o{" "}
        <code>Dialog surface=&quot;auto&quot;</code> (rodada 211): diálogo no
        desktop e a gaveta do <code>Sheet</code> no telefone, numa API só.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "direction",
            type: `"bottom" | "top"`,
            default: `"bottom"`,
            description:
              "De qual borda a gaveta sobe. Vai na raiz, não no conteúdo.",
          },
          {
            prop: "repositionInputs",
            type: "boolean",
            default: "true",
            description:
              "Impede a gaveta de encolher quando o teclado do iOS sobe.",
          },
          {
            prop: "fill",
            type: "boolean",
            default: "false",
            description: "Gaveta alta, quase a tela toda; sem ela, mede o conteúdo até 85dvh.",
          },
          {
            prop: "variant",
            type: '"flush" | "inset"',
            default: '"flush"',
            description:
              "flush cola nas bordas e arredonda só o lado de dentro; inset solta a gaveta da tela, com margem e cantos completos.",
          },
          {
            prop: "size",
            type: '"full" | "md" | "lg"',
            default: '"full"',
            description: "Teto de largura acima de 640px: full estica, md para em 32rem, lg em 42rem.",
          },
          {
            prop: "snapPoints",
            type: "(number | string)[]",
            description:
              "Os degraus de altura (0,45 = 45% da tela). Com eles o conteúdo fica alto sozinho.",
          },
          {
            prop: "scaleBackground",
            type: "boolean",
            default: "false",
            description:
              "A página recua e arredonda atrás da gaveta. Escala o [data-vaul-drawer-wrapper] da raiz.",
          },
          {
            prop: "pending",
            type: "boolean",
            default: "false",
            description:
              "Salvando: arrastar, tocar fora, Esc e a alça não fecham; aria-busy no conteúdo.",
          },
          {
            prop: "modal",
            type: "boolean",
            default: "true",
            description: "false: sem véu, a página continua usável.",
          },
          {
            prop: "DrawerActions · DrawerAction · DrawerCancel",
            type: "div · button (variant, asChild) · Button",
            description:
              "A folha de ações: linhas de 52px que fecham ao rodar, e o cancelar separado.",
          },
          {
            prop: "showHandle",
            type: "boolean",
            default: "true",
            description: "Desligue só junto com dismissible={false}.",
          },
          {
            prop: "DragHandle · …props",
            type: "ComponentProps<typeof Drawer.Handle>",
            description:
              "Exportada deste arquivo para o Sheet vesti-la. Exige o contexto do vaul: fora de um Drawer.Root, lança. Medida que dispute com a folha do vaul precisa de !.",
          },
        ]}
      />
    </>
  )
}

function SuperficieDemo() {
  const [variant, setVariant] = React.useState<"flush" | "inset">("flush")
  const [size, setSize] = React.useState<"full" | "md" | "lg">("full")

  return (
    <>
      <Controles
        inicio={
          <>
            <Eixo rotulo="variant" valores={["flush", "inset"] as const} valor={variant} onChange={setVariant} />
            <Eixo rotulo="size" valores={["full", "md", "lg"] as const} valor={size} onChange={setSize} />
          </>
        }
      />
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            abrir
          </Button>
        </DrawerTrigger>
        <DrawerContent variant={variant} size={size}>
          <DialogHeader>
            <DialogTitle>
              {variant} · {size}
            </DialogTitle>
            <DialogDescription>
              Arraste a alça para baixo para fechar.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Numa janela larga, <code>full</code> estica a gaveta de ponta a
              ponta; <code>md</code> e <code>lg</code> a centralizam.
            </p>
          </DialogBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function AcoesDemo() {
  const [feito, setFeito] = React.useState("")
  // "Editar" fecha a folha e abre o formulário — que no telefone é outra
  // gaveta. É o caminho do "+ Adicionar" do app.
  const [editando, setEditando] = React.useState(false)

  return (
    <div className="flex flex-col items-start gap-2">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">ações do lançamento</Button>
        </DrawerTrigger>
        <DrawerContent variant="inset" size="md">
          <DialogHeader>
            <DialogTitle>Mercado</DialogTitle>
            <DialogDescription>12 set · −R$ 42,90</DialogDescription>
          </DialogHeader>
          <DrawerActions>
            <DrawerAction onClick={() => setEditando(true)}>
              <PencilSquareIcon aria-hidden />
              Editar
            </DrawerAction>
            <DrawerAction onClick={() => setFeito("Duplicar")}>
              <DocumentDuplicateIcon aria-hidden />
              Duplicar
            </DrawerAction>
            <DrawerAction onClick={() => setFeito("Tornar recorrente")}>
              <ArrowPathRoundedSquareIcon aria-hidden />
              Tornar recorrente
            </DrawerAction>
            <DrawerAction
              variant="destructive"
              onClick={() => setFeito("Excluir")}
            >
              <TrashIcon aria-hidden />
              Excluir
            </DrawerAction>
          </DrawerActions>
          <DrawerCancel />
        </DrawerContent>
      </Drawer>
      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {feito ? `Escolhido: ${feito}` : ""}
      </p>
      <Dialog surface="auto" open={editando} onOpenChange={setEditando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
            <DialogDescription>
              Aberto pela folha de ações, que fechou antes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="tertiary">
                fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GestosDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Drawer snapPoints={[0.45, 1]}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            degraus
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DialogHeader>
            <DialogTitle>Últimos lançamentos</DialogTitle>
            <DialogDescription>
              Começa em 45% da tela. Puxe a alça para cima.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-2">
            {Array.from({ length: 24 }, (_, i) => (
              <p key={i} className="text-sm">
                Lançamento {i + 1}
              </p>
            ))}
          </DialogBody>
        </DrawerContent>
      </Drawer>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            gaveta sobre gaveta
          </Button>
        </DrawerTrigger>
        {/* Alta, para a de cima não a cobrir: o recuo aparece por trás. */}
        <DrawerContent variant="inset" size="md" fill>
          <DialogHeader>
            <DialogTitle>Nova despesa</DialogTitle>
            <DialogDescription>
              Escolha a categoria: ela abre por cima, e esta recua.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="secondary" className="w-full">
                  escolher categoria
                </Button>
              </DrawerTrigger>
              <DrawerContent variant="inset" size="md">
                <DialogHeader>
                  <DialogTitle>Categoria</DialogTitle>
                  <DialogDescription>A gaveta de baixo recuou.</DialogDescription>
                </DialogHeader>
                <DrawerActions>
                  {["Mercado", "Moradia", "Transporte"].map((c) => (
                    <DrawerAction key={c}>{c}</DrawerAction>
                  ))}
                </DrawerActions>
                <DrawerCancel />
              </DrawerContent>
            </Drawer>
          </DialogBody>
        </DrawerContent>
      </Drawer>

      <Drawer scaleBackground>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            fundo que encolhe
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DialogHeader>
            <DialogTitle>A página recuou</DialogTitle>
            <DialogDescription>
              Ela encolhe e arredonda atrás da gaveta, e volta quando esta fecha.
            </DialogDescription>
          </DialogHeader>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function ComportamentoDemo() {
  const [salvando, setSalvando] = React.useState(false)
  const [aberto, setAberto] = React.useState(false)
  const [mais, setMais] = React.useState(false)
  const [resumo, setResumo] = React.useState(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Drawer open={aberto} onOpenChange={setAberto} pending={salvando}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            salvar e travar
          </Button>
        </DrawerTrigger>
        <DrawerContent variant="inset" size="md">
          <DialogHeader>
            <DialogTitle>Pagar conta de luz</DialogTitle>
            <DialogDescription>
              Pague e tente fechar: nada fecha até terminar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DrawerClose asChild>
              <Button type="button" variant="tertiary" disabled={salvando}>
                cancelar
              </Button>
            </DrawerClose>
            <Button
              type="button"
              disabled={salvando}
              onClick={() => {
                setSalvando(true)
                window.setTimeout(() => {
                  setSalvando(false)
                  setAberto(false)
                }, 1800)
              }}
            >
              <BanknotesIcon aria-hidden />
              {salvando ? "pagando…" : "pagar"}
            </Button>
          </DialogFooter>
        </DrawerContent>
      </Drawer>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            altura que acompanha
          </Button>
        </DrawerTrigger>
        <DrawerContent variant="inset" size="md">
          <DialogHeader>
            <DialogTitle>Detalhes</DialogTitle>
            <DialogDescription>O conteúdo cresce, e a gaveta acompanha.</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-2">
            {(mais ? ["Categoria", "Cartão", "Parcelas", "Observação"] : ["Categoria"]).map((c) => (
              <p key={c} className="text-sm">
                {c}
              </p>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setMais((m) => !m)}>
              {mais ? "mostrar menos" : "mostrar mais"}
            </Button>
          </DialogFooter>
        </DrawerContent>
      </Drawer>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            cabeçalho fixo
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DialogHeader>
            <DialogTitle>Categorias</DialogTitle>
            <DialogDescription>
              Sem DialogBody: a lista rola e o título fica.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 px-4 pb-4">
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i} className="text-sm">
                Categoria {i + 1}
              </p>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={resumo}
        onOpenChange={setResumo}
        modal={false}
        dismissible={false}
        snapPoints={[0.18, 0.6]}
      >
        <Button variant="outline" size="sm" onClick={() => setResumo((r) => !r)}>
          {resumo ? "fechar resumo" : "resumo não-modal"}
        </Button>
        <DrawerContent showHandle>
          <DialogHeader>
            <DialogTitle>3 lançamentos selecionados</DialogTitle>
            <DialogDescription>
              A página continua usável. Puxe para ver mais.
            </DialogDescription>
          </DialogHeader>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
