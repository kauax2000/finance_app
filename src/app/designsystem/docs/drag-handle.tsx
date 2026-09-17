"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function DragHandleDoc() {
  return (
    <>
      <Usage>
        A barra no topo de uma gaveta: diz <strong>isto se arrasta</strong> e é o próprio alvo do gesto. <strong>Quem a escreve é a superfície</strong>, nunca a tela — ela vem no{" "}
        <Link href="/designsystem/drawer" className="underline">
          Drawer
        </Link>{" "}
        e no{" "}
        <Link href="/designsystem/sheet" className="underline">
          Sheet
        </Link>{" "}
        quando ele é gaveta. No desktop, onde a folha entra pela lateral, não há alça.
      </Usage>

      <DocSection
        title="O gesto"
        description="Arraste a alça para baixo. Ela é a área de acerto, não um enfeite ao lado dela."
        code={`// A superfície já a compõe. Numa tela, isto é tudo:
<DrawerContent>
  <DialogHeader>…</DialogHeader>
</DrawerContent>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              gaveta de baixo
            </Button>
          </DrawerTrigger>
          <DrawerContent variant="inset" size="md">
            <DialogHeader>
              <DialogTitle>Arraste a alça</DialogTitle>
              <DialogDescription>
                Ou solte no meio do caminho e veja a gaveta voltar.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-muted-foreground">
                O véu acompanha o dedo em vez de esmaecer por duração fixa.
              </p>
            </DialogBody>
          </DrawerContent>
        </Drawer>

        <Drawer direction="top">
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              gaveta de cima
            </Button>
          </DrawerTrigger>
          <DrawerContent variant="inset" size="md">
            <DialogHeader>
              <DialogTitle>A alça troca de lado</DialogTitle>
              <DialogDescription>
                Ela nasce na borda que o dedo puxa, e sabe disso sozinha.
              </DialogDescription>
            </DialogHeader>
          </DrawerContent>
        </Drawer>
      </DocSection>

      <DocSection
        title="O alvo, desenhado"
        description="O contorno é a área de acerto que o vaul injeta, invisível numa gaveta real: 44px no dedo, 20 no mouse."
        code={`// só nesta demonstração, para o invisível aparecer
<DrawerContent className="[&_[data-vaul-handle-hitarea]]:outline-2 …">`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              ver a área de acerto
            </Button>
          </DrawerTrigger>
          <DrawerContent
            variant="inset"
            size="md"
            className="[&_[data-vaul-handle-hitarea]]:outline-2 [&_[data-vaul-handle-hitarea]]:outline-dashed [&_[data-vaul-handle-hitarea]]:outline-primary-accent"
          >
            <DialogHeader>
              <DialogTitle>44 no dedo, 20 no mouse</DialogTitle>
              <DialogDescription>
                O contorno é maior que a barra de propósito: um alvo de 6px de
                altura não é acertável com o polegar.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-muted-foreground">
                No toque o retângulo tem 44px e passa por baixo do cabeçalho,
                onde não há controle; no ponteiro fino encolhe para 20.
              </p>
            </DialogBody>
          </DrawerContent>
        </Drawer>
      </DocSection>

      <DocNote title="A alça é da superfície, nunca da tela">
        <code>Sheet</code> e <code>DrawerContent</code> a compõem, como compõem a borda e a sombra da folha. Uma tela que escrevesse a própria alça teria duas, e só uma arrastaria.
      </DocNote>

      <DocNote title="Toda medida da alça leva !">
        O vaul injeta <code>[data-vaul-handle]</code> numa folha sem camada, e CSS sem camada vence as utilities do Tailwind (<code>@layer utilities</code>) em qualquer especificidade. Só <code>!</code> inverte a ordem, então toda propriedade redeclarada precisa dele — sem ele a medida perde calada. <code>drag-handle.test.ts</code> tranca a lista.
      </DocNote>

      <DocNote title="A alça é 75%, e o realce é um par">
        A tinta é <code>--muted-foreground</code> a 75%, o primeiro degrau que passa nos 3:1 da WCAG 1.4.11 sobre a folha de vidro nos dois temas. A pega do{" "}
        <Link href="/designsystem/resizable" className="underline">
          Resizable
        </Link>{" "}
        fica em 70% porque vive entre painéis opacos. Cursor e toque vão a 90%, e são par: <code>hover:</code> não existe no telefone, onde a alça é usada.
      </DocNote>

      <DocNote title="Tocar a alça não fecha">
        Numa gaveta comum (sem <code>snapPoints</code>, com <code>dismissible</code>) o clique na alça é um no-op: ela se arrasta. Quem fecha é o × do cabeçalho, o véu e o <kbd>Esc</kbd>.
      </DocNote>

      <DocNote title="Ela é aria-hidden, e nunca a única saída">
        Um leitor de tela não tem o que fazer com uma alça, e anunciá-la somaria ruído a cada abertura. A superfície sempre traz o <kbd>Esc</kbd> e o botão de fechar.
      </DocNote>

      <DocNote title="No mouse, a área de acerto é 20px">
        O vaul tenta encolher a área no ponteiro fino com uma regra inválida, e os 44px ficavam sobre o cabeçalho. <code>pointer-fine:</code> faz isso com 20px, que cabem na folga da alça — por isso o <code>my-2.5</code> dela é estrutural, não respiro.
      </DocNote>

      <DocNote title="Só o eixo vertical">
        O <code>[data-vaul-handle]</code> declara <code>touch-action: pan-y</code>, então o <code>Drawer</code> aceita só <code>bottom</code> e <code>top</code>. Painel preso a uma borda lateral é o ramo desktop do{" "}
        <Link href="/designsystem/sheet" className="underline">
          Sheet
        </Link>
        , que não promete gesto.
      </DocNote>

      <DocNote title="Sem eixo próprio">
        Uma geometria serve as duas superfícies. Se há alça é decisão do <code>showHandle</code> do <code>DrawerContent</code>, porque a pergunta — &ldquo;esta gaveta se arrasta?&rdquo; — é da superfície.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "className",
            type: "string",
            description: "Somado à régua. Medida que dispute com a folha do vaul precisa de !.",
          },
          {
            prop: "preventCycle",
            type: "boolean",
            default: "false",
            description: "Do vaul: desliga a ação de clique da alça, que sem snapPoints já não faz nada.",
          },
          {
            prop: "…props",
            type: "ComponentProps<typeof Drawer.Handle>",
            description: "Props de div. Exige o contexto do vaul: fora de um Drawer.Root, lança.",
          },
        ]}
      />
    </>
  )
}
