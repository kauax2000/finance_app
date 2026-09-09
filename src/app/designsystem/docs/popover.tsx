"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function PopoverDoc() {
  return (
    <>
      <Usage>
        Uma camada ancorada a um gatilho, aberta por clique. Diferente do
        tooltip, funciona no toque; diferente do diálogo, não bloqueia a tela —
        certo para um ajuste rápido, errado para uma decisão.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Popover>
  <PopoverTrigger asChild><Button variant="outline">Detalhes</Button></PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Como o total é calculado</PopoverTitle>
      <PopoverDescription>Soma das transações efetivadas do mês.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Como calculamos</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Como o total é calculado</PopoverTitle>
              <PopoverDescription>
                Soma das transações efetivadas do mês, sem parcelas futuras e
                sem transferências entre carteiras.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="Com uma ação que fecha"
        code={`<PopoverContent>
  <PopoverHeader>
    <PopoverTitle>Ocultar transferências</PopoverTitle>
  </PopoverHeader>
  <PopoverClose asChild>
    <Button type="button" variant="secondary" size="sm">Entendi</Button>
  </PopoverClose>
</PopoverContent>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Sobre transferências</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Ocultar transferências</PopoverTitle>
              <PopoverDescription>
                Mover dinheiro entre as suas carteiras não é despesa nem
                receita, então o extrato não conta essas linhas duas vezes.
              </PopoverDescription>
            </PopoverHeader>
            <PopoverClose asChild>
              <Button type="button" variant="secondary" size="sm">
                Entendi
              </Button>
            </PopoverClose>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="Sem recuo"
        code={`<PopoverContent padding="none" className="w-auto">
  <Calendar />
</PopoverContent>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Escolher período</Button>
          </PopoverTrigger>
          <PopoverContent padding="none" className="w-auto">
            <PopoverHeader>
              <p className="text-xs font-medium text-muted-foreground">
                Período
              </p>
            </PopoverHeader>
            <div className="flex flex-col p-1">
              {["Este mês", "Trimestre", "Ano"].map((r) => (
                <PopoverClose asChild key={r}>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="lg"
                    className="w-full justify-start font-normal"
                  >
                    {r}
                  </Button>
                </PopoverClose>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocNote title="O recuo é um eixo, e cinco chamadas já o anulavam">
        <code>padding=&quot;none&quot;</code> tira o recuo <strong>e</strong> o{" "}
        <code>gap</code>, porque as chamadas escreviam <code>gap-0 p-0</code> —
        as duas coisas andam juntas. É para quando o popover hospeda um
        componente inteiro (um calendário, uma lista, um{" "}
        <code>Command</code>) e quem manda no respiro é o conteúdo. Mesma
        decisão que o <code>Card</code> chama de <code>padding=&quot;none&quot;</code>.
      </DocNote>

      <DocNote title="O título é o que dá nome ao popover — e ele precisa existir">
        O <code>Popover.Content</code> do Radix renderiza{" "}
        <code>role=&quot;dialog&quot;</code> e nunca escreve{" "}
        <code>aria-labelledby</code>. Um papel de diálogo sem nome é anunciado
        como &quot;diálogo&quot;, e nada mais. <code>PopoverTitle</code> e{" "}
        <code>PopoverDescription</code> agora se registram no conteúdo e viram o{" "}
        <code>aria-labelledby</code> e o <code>aria-describedby</code> dele —
        mas só quando existem, porque apontar para um <code>id</code> ausente
        deixa o nome vazio, que era exatamente o estado anterior. Popover sem
        rótulo visível leva o par em <code>className=&quot;sr-only&quot;</code>.
      </DocNote>

      <DocNote title="Ele cabe inteiro na janela, e são três cláusulas">
        <strong>Centra no gatilho quando cabe</strong>; quando não cabe,{" "}
        <strong>desloca para dentro</strong> com a folga do sistema; e quando é{" "}
        <strong>maior que o espaço</strong>, encolhe — os dois tetos{" "}
        <code>max-h-…-available-height</code> e{" "}
        <code>max-w-…-available-width</code>. A terceira é a que sempre falta, e
        sem ela as outras duas não fecham: deslocar não torna visível o que não
        cabe. Antes desta régua o teto de largura existia em{" "}
        <strong>3 arquivos de 11</strong>.
        <br />
        Medido numa janela de <strong>280px</strong>: este popover, que é{" "}
        <code>w-72</code> (288), abre com <strong>264</strong> — a janela menos
        a folga dos dois lados — em <code>left: 8</code>, cabendo inteiro. A
        folga mora em <code>lib/anchored-surface</code> e a regra{" "}
        <strong>K</strong> do <code>ds:audit</code> impede que uma tela decida a
        dela.
      </DocNote>

      <DocNote title="A saída nunca tinha rodado, e o culpado era um Provider no meio do caminho">
        O casco declarava <code>data-closed:animate-out</code>,{" "}
        <code>fade-out-0</code> e <code>zoom-out-95</code> desde sempre, e as
        três eram <strong>código morto</strong>: o popover não esmaecia, ele
        sumia. Medido com um <code>MutationObserver</code> lendo{" "}
        <code>getComputedStyle</code> de forma síncrona no instante do{" "}
        <code>data-state=&quot;closed&quot;</code>, o retorno vinha{" "}
        <strong>vazio</strong> — e estilo computado vazio é o que se obtém de um
        nó <em>já destacado do documento</em>. Nenhum{" "}
        <code>animationstart</code> de <code>exit</code> chegava a disparar.
        <br />
        O <code>Portal</code> do Radix é um <code>Presence</code> em volta de um{" "}
        <code>PortalPrimitive asChild</code>, e o <code>Presence</code> decide se
        espera a animação lendo o estilo do <strong>ref do filho</strong>. Havia
        um <code>PopoverLabelContext.Provider</code> entre o Portal e o Content:
        o <code>Slot</code> do <code>asChild</code> tentava pôr o ref num context
        provider, que não é elemento, o ref se perdia,{" "}
        <code>getAnimationName(undefined)</code> devolvia <code>&quot;none&quot;</code>{" "}
        e o Radix desmontava no mesmo commit. O <code>DropdownMenu</code>, que
        tem <code>Portal → Content</code> direto, sempre animou — foi a
        comparação entre os dois que isolou a causa.
        <br />O Provider passou para <strong>fora</strong> do Portal. O contexto
        continua chegando ao título e à descrição, porque ele está acima na
        árvore do React e contexto atravessa portal. Medido depois:{" "}
        <code>animationstart exit @21ms</code>,{" "}
        <code>animationend exit @116ms</code>, e o nó desmontando limpo.
      </DocNote>

      <DocNote title="A curva da casa não chegava aqui, e duration-* transicionava tudo">
        A entrada abria com <code>animation: enter 0.1s ease</code> — a curva{" "}
        <em>do navegador</em>. O <code>animate-in</code> lê{" "}
        <code>--tw-ease</code>, e quem a escreve é a classe <code>ease-*</code>;
        sem ela, medido, <code>--tw-ease</code> saía <strong>vazio</strong>. É o
        mesmo defeito que o <code>NavigationMenu</code> tinha, e a correção é a
        mesma: <code>ease-(--ease-out)</code>, em{" "}
        <code>--duration-base</code>. A forma não mudou — fade, 8px do lado de
        onde veio e <code>zoom-95</code> são a língua de toda superfície ancorada
        da casa.
        <br />
        <strong>E a duração passou a ser da animação, não da transição.</strong>{" "}
        <code>duration-*</code> escreve <code>transition-duration</code> junto, e
        sem nenhum <code>transition-property</code> isso deixa{" "}
        <code>transition: all</code> — medido aqui, <code>all 0.1s</code>: toda
        propriedade do popover transicionava, calada. Numa superfície que só
        anima, o utilitário certo é <code>animation-duration-*</code>, que não
        toca a transição. Medido depois: <code>transition-duration: 0s</code>.
        <br />A saída é mais curta que a entrada e não se move — só fade, em{" "}
        <code>--duration-instant</code>. Um popover que se fecha some; recuar
        seria pedir atenção para o que está saindo de cena.
      </DocNote>

      <DocNote title="Para seletor ancorado num campo, use FormPickerPopover">
        Um popover que sai de um campo precisa de largura igual à do gatilho,
        folga de colisão maior e não roubar o foco.{" "}
        <code>FormPickerPopoverContent</code> resolve os três; repetir à mão é
        como cada seletor acaba diferente.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "align",
            type: `"start" | "center" | "end"`,
            default: `"center"`,
            description: "Alinhamento em relação ao gatilho.",
          },
          {
            prop: "sideOffset",
            type: "number",
            default: "4",
            description: "Distância entre o gatilho e a camada.",
          },
          {
            prop: "padding",
            type: '"default" | "none"',
            default: '"default"',
            description:
              "none zera recuo e gap, para o popover que hospeda um componente inteiro.",
          },
          {
            prop: "collisionPadding",
            type: "number | Padding",
            default: "ANCHORED_COLLISION_PADDING (8)",
            description:
              "A folga até a borda da janela, vinda de lib/anchored-surface — a mesma para toda superfície ancorada do sistema. Não a suba na tela: a regra K do auditor reprova, e o teto de largura já resolve o popover largo em tela estreita.",
          },
        ]}
      />
    </>
  )
}
