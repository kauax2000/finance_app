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
        A diferença para o <code>Sheet</code> não é o desenho, é quem decide: o{" "}
        <code>Sheet</code> troca de superfície com a largura — painel no
        desktop, gaveta no telefone. O <code>Drawer</code> é gaveta sempre.
        Escolha-o quando o gesto é a afordância, e não uma consequência de a
        tela ser estreita.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Drawer>
  <DrawerTrigger asChild><Button>Abrir</Button></DrawerTrigger>
  <DrawerContent>
    <DialogHeader hideSeparator>
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
            <DialogHeader hideSeparator>
              <DialogTitle>Filtros</DialogTitle>
              <DialogDescription>
                Arraste a alça para baixo para fechar, ou toque fora.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-muted-foreground">
                O corpo rola entre o cabeçalho e o rodapé, que ficam parados.
                Quem entrega isso é o <code>DialogBody</code>, e não uma classe
                escrita aqui.
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
                <DialogHeader hideSeparator>
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
        Uma gaveta de baixo numa janela de 1900px vira uma linha de leitura de
        1900px, que medida de texto nenhuma suporta. <code>full</code> continua
        o padrão porque é o comportamento do telefone, onde a gaveta nasceu —{" "}
        <code>md</code> e <code>lg</code> a centralizam e param.{" "}
        <code>variant=&quot;inset&quot;</code> vai junto nessa direção: solta a
        gaveta das bordas, arredonda os quatro cantos e deixa a página aparecer
        em volta.
      </DocNote>

      <DocNote title="A cromagem vem do Dialog — aqui não existe DrawerHeader">
        Cabeçalho, título, descrição, corpo rolável e rodapé são{" "}
        <code>DialogHeader</code>, <code>DialogTitle</code>,{" "}
        <code>DialogDescription</code>, <code>DialogBody</code> e{" "}
        <code>DialogFooter</code> — os mesmos que a{" "}
        <Link href="/designsystem/sheet">folha</Link> usa, e pelo mesmo motivo:{" "}
        <code>vaul</code> é construído sobre <code>@radix-ui/react-dialog</code>
        , há uma instância só em <code>node_modules</code>, e por isso o{" "}
        <code>DialogTitle</code> encontra o contexto de que precisa dentro de
        um <code>DrawerContent</code>. As quatro peças que este arquivo tinha
        saíram: eram um segundo título de gaveta que divergia do primeiro —
        centralizava o texto, contra a decisão de que o cabeçalho é alinhado à
        esquerda em toda largura.
      </DocNote>

      <DocNote title="A alça é o gesto, e não o desenho dele">
        Até esta revisão a alça daqui era uma <code>div</code> decorativa: sem{" "}
        <code>data-vaul-handle</code>, sem área de toque, sem arraste. Ela
        desenhava a promessa que a documentação descrevia — exatamente o defeito
        que a rodada do <code>Sheet</code> tirou de 37 telas. Agora é{" "}
        <code>DrawerPrimitive.Handle</code>: ela <em>é</em> a área de arraste,
        recebe os 44px de alvo que o <code>vaul</code> injeta em volta, e o
        clique nela fecha. Por isso <code>showHandle</code> só se desliga junto
        com <code>dismissible={"{false}"}</code> — sem gesto e com alça, a
        promessa volta.
      </DocNote>

      <DocNote title="Só o eixo vertical">
        <code>direction</code> aceita <code>bottom</code> e <code>top</code>. Não
        é simplificação: o <code>[data-vaul-handle]</code> do <code>vaul</code>{" "}
        declara <code>touch-action: pan-y</code> — a alça só arrasta na
        vertical, e uma gaveta lateral teria a alça de enfeite outra vez. Painel
        preso a uma borda lateral é o{" "}
        <Link href="/designsystem/edge-panel">EdgePanel</Link>, que não promete
        gesto nenhum.
      </DocNote>

      <DocNote title="Drawer ou Sheet?">
        O app resolve formulário no telefone com <code>Sheet</code>, e ali o
        arraste disputa com a rolagem do formulário. Use <code>Drawer</code>{" "}
        para conteúdo curto e casual, que se descarta com o polegar — e{" "}
        <code>Sheet</code> quando a mesma tela precisa ser painel no desktop.
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
            description:
              "Gaveta alta: ocupa quase a tela, com folga e área segura na borda oposta. Sem ela, a gaveta mede o próprio conteúdo e para no teto de 85dvh.",
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
            description:
              "O teto de largura acima de 640px: full estica, md para em 32rem, lg em 42rem — e as duas centralizam.",
          },
          {
            prop: "showHandle",
            type: "boolean",
            default: "true",
            description:
              "Desligue só junto com dismissible={false} — com o gesto ligado, a alça é a única pista de que ele existe.",
          },
        ]}
      />
    </>
  )
}
