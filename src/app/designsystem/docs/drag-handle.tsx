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
        A barra no topo de uma gaveta. Ela é a convenção de iOS e Android que diz{" "}
        <strong>isto se arrasta</strong> — e, ao contrário de quase toda cópia
        dela, é também o <strong>alvo do gesto</strong>: o que se agarra, e não
        um desenho ao lado do que se agarra.{" "}
        <strong>Quem a escreve é a superfície</strong>, nunca a tela. Ela vem de
        fábrica no <Link href="/designsystem/drawer" className="underline">
          Drawer
        </Link>{" "}
        e no{" "}
        <Link href="/designsystem/sheet" className="underline">
          Sheet
        </Link>{" "}
        quando ele é gaveta; no desktop, onde a folha entra pela lateral e não se
        arrasta, não há alça nenhuma.
      </Usage>

      <DocSection
        title="O gesto"
        description="Arraste a alça para baixo. Ela é a área de acerto, não o enfeite dela — e num ponteiro fino responde ao cursor antes de responder ao arraste."
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
                O véu acompanha o dedo em vez de esmaecer por duração fixa — é
                por isso que a gaveta não tem <code>animation-duration</code>.
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
        description="O contorno é a área de acerto que o vaul injeta — invisível numa gaveta de verdade. No dedo ela mede 44px e transborda a barra de 6; no mouse, 20."
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
                Num aparelho de toque este retângulo tem 44px e passa 9 por
                baixo do cabeçalho — o que é correto, porque ali não há
                controle, e o dedo agradece. Num ponteiro fino ele encolhe para
                20 e cabe inteiro na folga da alça.
              </p>
            </DialogBody>
          </DrawerContent>
        </Drawer>
      </DocSection>

      <DocNote title="A alça é da superfície, e nunca da tela">
        <code>Sheet</code> e <code>DrawerContent</code> a compõem; uma tela não a
        escreve, como não escreve a borda nem a sombra da folha. A versão
        anterior deste componente era um <code>return null</code> com{" "}
        <strong>31 chamadas em 27 arquivos</strong> — resto de quando a alça era
        uma <code>div</code> decorativa desenhada por quem chamava. As 31 saíram
        na mesma rodada em que ela voltou a desenhar, senão seriam duas alças, e
        só uma arrastaria.
      </DocNote>

      <DocNote title="Toda medida leva ! — e uma não levava">
        O vaul injeta <code>[data-vaul-handle]</code> numa folha criada em tempo
        de execução, e ela vence qualquer classe deste projeto em qualquer
        especificidade — não por vir depois, mas porque as utilities do Tailwind
        vivem em <code>@layer utilities</code> e a folha dele é{" "}
        <strong>sem camada</strong>: a cascata resolve a camada antes da
        especificidade. Os valores são <code>background:#e2e2e4</code>,{" "}
        <code>height:5px</code>, <code>width:32px</code>,{" "}
        <code>border-radius:1rem</code>, <code>opacity:.7</code>. Quem inverte a
        ordem é <code>!</code>: entre declarações <code>!important</code> a
        camada ganha da ausência dela. Toda propriedade redeclarada aqui precisa
        dele. A
        versão anterior escrevia <code>rounded-full</code> <strong>sem</strong>{" "}
        ele e perdia calada — medido no navegador, o{" "}
        <code>border-radius</code> computado da alça era{" "}
        <strong>16px</strong>, o do vaul. A asserção 1 de{" "}
        <code>drag-handle.test.ts</code> é o que impede que a próxima escape.
      </DocNote>

      <DocNote title="70% é o piso da tinta de arraste, e vale para as duas peças">
        A alça era <code>bg-muted-foreground/35</code> por cima da{" "}
        <code>opacity:.7</code> do vaul: <strong>24,5% de alfa efetivo</strong>,
        que medido contra <code>--background</code> dá{" "}
        <strong>1,41:1 no claro e 1,46 no escuro</strong> — contra os 3:1 que a
        WCAG 1.4.11 pede de um componente não-textual. Varridos os degraus,{" "}
        <strong>70% é o primeiro que passa nos dois temas</strong>: 3,06 e 4,24.
        É o mesmo degrau a que a pega do{" "}
        <Link href="/designsystem/resizable" className="underline">
          Resizable
        </Link>{" "}
        chegou, por varredura independente e contra outra superfície. O par de
        cursor e toque vai a 90% — 4,61 e 6,36 —, e é um <strong>par</strong>:{" "}
        <code>hover:</code> compila dentro de{" "}
        <code>@media (hover: hover)</code> e não existe no telefone, que é
        justamente onde a alça é usada.
      </DocNote>

      <DocNote title="O clique nela não fecha, e é de propósito">
        O <code>handleCycleSnapPoints</code> do vaul só chama{" "}
        <code>closeDrawer()</code> quando <code>dismissible</code> é{" "}
        <strong>falso</strong>, e sem <code>snapPoints</code> não há o que
        ciclar — então numa gaveta comum tocar a alça é um no-op. Ela se
        arrasta. Quem fecha no clique é o × do cabeçalho, o véu, e o{" "}
        <kbd>Esc</kbd>.
      </DocNote>

      <DocNote title="Ela é aria-hidden, e isso está certo">
        Um leitor de tela não tem o que fazer com uma alça: pelo teclado quem
        fecha é o <kbd>Esc</kbd>, e pelo toque o botão de fechar. Anunciá-la
        somaria ruído a cada abertura. O que ela não pode é ser a{" "}
        <strong>única</strong> saída — e não é: a superfície sempre traz uma das
        outras duas.
      </DocNote>

      <DocNote title="O pointer:fine do vaul nunca valeu — um : sobrando">
        A biblioteca quis encolher a área de acerto no mouse e escreveu{" "}
        <code>@media (pointer:fine){"{"}[data-vaul-handle-hitarea]:{"{"}…
        {"}}"}</code>, com um dois-pontos a mais depois do seletor de atributo. A
        regra é inválida e nunca aplica, então os 44px persistiam no cursor —{" "}
        <code>document.elementFromPoint</code> no topo do cabeçalho devolvia a
        área da alça, 9px em que o clique era do arraste. Aqui{" "}
        <code>pointer-fine:</code> faz o que a biblioteca pretendia, com um
        número em vez de <code>100%</code>: 20px, o dobro dos 10 que o{" "}
        <code>Resizable</code> reserva para o mouse, e que cabem inteiros na
        folga da alça. É por isso que o <code>my-2.5</code> dela é carga
        estrutural, e não respiro.
      </DocNote>

      <DocNote title="Só o eixo vertical">
        O <code>[data-vaul-handle]</code> declara{" "}
        <code>touch-action: pan-y</code>: a alça só arrasta para cima e para
        baixo. É a razão de o <code>Drawer</code> aceitar apenas{" "}
        <code>bottom</code> e <code>top</code> — uma gaveta lateral teria a alça
        de enfeite outra vez. Painel preso a uma borda lateral é o ramo desktop
        do{" "}
        <Link href="/designsystem/sheet" className="underline">
          Sheet
        </Link>
        , que não promete gesto nenhum.
      </DocNote>

      <DocNote title="Sem eixo, e a contagem é a razão">
        Uma geometria, duas superfícies, e nenhuma tela pedindo outra: um{" "}
        <code>size</code> aqui seria ficção. O que existe é o{" "}
        <code>showHandle</code> do <code>DrawerContent</code>, que decide se há
        alça — e ele é da superfície, porque a pergunta que ele responde
        (&ldquo;esta gaveta se arrasta?&rdquo;) é dela.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "className",
            type: "string",
            description:
              "Somado à régua. Toda medida que dispute com a folha do vaul precisa de ! para valer.",
          },
          {
            prop: "preventCycle",
            type: "boolean",
            default: "false",
            description:
              "Do vaul: desliga a ação de clique da alça. Sem snapPoints e com dismissible, ela já não faz nada.",
          },
          {
            prop: "…props",
            type: "ComponentProps<typeof Drawer.Handle>",
            description:
              "Props de div. Ela exige o contexto do vaul: fora de um Drawer.Root, lança — como DialogTitle fora de um Dialog.",
          },
        ]}
      />
    </>
  )
}
