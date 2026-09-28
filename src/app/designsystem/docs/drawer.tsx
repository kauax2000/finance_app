"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DrawerDoc() {
  return (
    <>
      <Usage>
        Uma gaveta que se arrasta, <strong>em qualquer largura de tela</strong>.
        O <code>Sheet</code> troca de superfície com a largura — painel no
        desktop, gaveta no telefone; o <code>Drawer</code> é gaveta sempre.
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
        previewClassName="items-start"
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "flush", s: "full", rotulo: "flush · full (padrão)" },
              { v: "inset", s: "full", rotulo: "inset · full" },
              { v: "flush", s: "md", rotulo: "flush · md" },
              { v: "inset", s: "lg", rotulo: "inset · lg" },
            ] as const
          ).map((c) => (
            <Drawer key={c.rotulo}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  {c.rotulo}
                </Button>
              </DrawerTrigger>
              <DrawerContent variant={c.v} size={c.s}>
                <DialogHeader>
                  <DialogTitle>{c.rotulo}</DialogTitle>
                  <DialogDescription>
                    Arraste a alça para baixo para fechar.
                  </DialogDescription>
                </DialogHeader>
                <DialogBody>
                  <p className="text-sm text-muted-foreground">
                    Numa janela larga, <code>full</code> estica a gaveta de
                    ponta a ponta; <code>md</code> e <code>lg</code> a
                    centralizam.
                  </p>
                </DialogBody>
              </DrawerContent>
            </Drawer>
          ))}
        </div>
      </DocSection>

      <DocNote title="A largura existe por causa do desktop">
        Gaveta de ponta a ponta numa janela larga vira linha de leitura longa
        demais. <code>full</code> é o padrão, o comportamento do telefone;{" "}
        <code>md</code> e <code>lg</code> centralizam e param, e{" "}
        <code>variant=&quot;inset&quot;</code> solta a gaveta das bordas.
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

      <DocNote title="Drawer ou Sheet?">
        <code>Drawer</code> para conteúdo curto e casual, que se descarta com o
        polegar. Formulário vai no <code>Sheet</code>: numa gaveta arrastável o
        arraste disputa com a rolagem, e a mesma tela vira painel no desktop.
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
