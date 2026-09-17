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

      <DocNote title="A alça é o gesto, e não o desenho dele">
        A alça é o{" "}
        <Link href="/designsystem/drag-handle" className="underline">
          DragHandle
        </Link>
        : a própria área de arraste, com 44px de alvo. Ela não fecha no clique,
        então <code>showHandle</code> só se desliga junto com{" "}
        <code>dismissible={"{false}"}</code> — alça sem gesto promete o que não
        existe.
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
        ]}
      />
    </>
  )
}
