"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverConfirm,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

const TAMANHOS = ["sm", "md", "lg", "auto", "trigger"] as const

const CATEGORIAS = [
  "Mercado",
  "Restaurantes",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Impostos",
  "Presentes",
]

export default function PopoverDoc() {
  return (
    <>
      <Usage>
        Uma camada ancorada a um gatilho, aberta por clique. Diferente do <code>Tooltip</code>, funciona no toque; diferente do <code>Dialog</code>, não bloqueia a tela — certo para um ajuste rápido, errado para uma decisão. Seletor que sai de um campo é o <code>FormPickerPopover</code>, na página do <code>Form</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="O cabeçalho com o × no canto, para o popover que se lê e se dispensa, e a seta. Ele brota do gatilho — a placa do tour: nasce a 92%, desfocado, 10px do lado do botão, e as faixas sobem atrás —, e ao fechar volta para dentro dele."
        code={`<Popover>
  <PopoverTrigger asChild><Button variant="outline">Como calculamos</Button></PopoverTrigger>
  <PopoverContent>
    <PopoverHeader closeButton>
      <PopoverTitle>Como o total é calculado</PopoverTitle>
      <PopoverDescription>Soma das transações efetivadas do mês.</PopoverDescription>
    </PopoverHeader>
    <PopoverArrow />
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Como calculamos</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader closeButton>
              <PopoverTitle>Como o total é calculado</PopoverTitle>
              <PopoverDescription>
                Soma das transações efetivadas do mês, sem parcelas futuras e
                sem transferências entre carteiras.
              </PopoverDescription>
            </PopoverHeader>
            <PopoverArrow />
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="Larguras"
        description="A escada: sm 224 para uma frase, md 288 (o padrão), lg 352 para um formulário curto, auto para quem hospeda um componente com largura própria, trigger para a largura do gatilho."
        code={`<PopoverContent size="trigger">…</PopoverContent>`}
        previewClassName="flex-col items-start gap-4"
      >
        <LargurasDemo />
      </DocSection>

      <DocSection
        title="Corpo que rola e rodapé"
        description="Com padding=&quot;none&quot; cada faixa é dona do seu respiro; o PopoverBody rola com a dissolução e a seta de tem mais, e o cabeçalho e o rodapé ficam parados."
        code={`<PopoverContent padding="none" label="Categorias">
  <PopoverHeader><PopoverTitle>Categorias</PopoverTitle></PopoverHeader>
  <PopoverBody className="max-h-48">…</PopoverBody>
  <PopoverFooter className="justify-end">
    <PopoverClose asChild><Button size="sm" variant="secondary">Pronto</Button></PopoverClose>
  </PopoverFooter>
</PopoverContent>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Categorias</Button>
          </PopoverTrigger>
          <PopoverContent padding="none" size="sm">
            <PopoverHeader>
              <PopoverTitle>Categorias</PopoverTitle>
            </PopoverHeader>
            <PopoverBody className="max-h-48">
              <ul className="flex flex-col py-1 text-sm">
                {CATEGORIAS.map((c) => (
                  <li key={c} className="py-1.5">
                    {c}
                  </li>
                ))}
              </ul>
            </PopoverBody>
            <PopoverFooter className="justify-end">
              <PopoverClose asChild>
                <Button type="button" variant="secondary" size="sm">
                  Pronto
                </Button>
              </PopoverClose>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="Confirmação curta"
        description="PopoverConfirm vai no lugar do PopoverContent: título, uma linha e Cancelar/Confirmar. Um onConfirm que devolve Promise trava os botões com o Spinner e fecha quando ela assenta. O que não tem volta continua sendo AlertDialog."
        code={`<Popover>
  <PopoverTrigger asChild><Button variant="outline">Remover filtro</Button></PopoverTrigger>
  <PopoverConfirm
    title="Remover o filtro de categoria?"
    description="A lista volta a mostrar todas as categorias."
    confirmLabel="remover"
    variant="destructive"
    onConfirm={() => removerFiltro()}
  />
</Popover>`}
        previewClassName="flex-col items-start gap-2"
      >
        <ConfirmDemo />
      </DocSection>

      <DocSection
        title="Sem recuo"
        description="Para quando o popover hospeda um componente inteiro — uma lista de ações, um calendário, a grade de meses — e quem manda no respiro é o conteúdo."
        code={`<PopoverContent padding="none" size="sm" label="Período">
  {periodos.map((p) => (
    <PopoverClose asChild key={p}>
      <Button variant="tertiary" size="lg" className="w-full justify-start">{p}</Button>
    </PopoverClose>
  ))}
</PopoverContent>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Escolher período</Button>
          </PopoverTrigger>
          <PopoverContent padding="none" size="sm" label="Período" className="p-1">
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
          </PopoverContent>
        </Popover>
      </DocSection>

      <DocSection
        title="No telefone, a gaveta"
        description={
          <>
            <code>mobile=&quot;sheet&quot;</code>: abaixo de 768px o mesmo conteúdo abre numa gaveta, sem placa nem seta, e o <code>PopoverTitle</code> vira o nome dela. É o que as telas decidiam à mão com <code>modal=&#123;isMobile&#125;</code>.
          </>
        }
        code={`<Popover mobile="sheet">…</Popover>`}
        previewClassName="justify-center"
      >
        <IphoneFrame title="O popover num iPhone">
          <div className="flex h-full items-start justify-center px-4 pt-16">
            <Popover mobile="sheet">
              <PopoverTrigger asChild>
                <Button variant="outline">Como calculamos</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader closeButton>
                  <PopoverTitle>Como o total é calculado</PopoverTitle>
                  <PopoverDescription>
                    Soma das transações efetivadas do mês, sem parcelas futuras.
                  </PopoverDescription>
                </PopoverHeader>
                <PopoverClose asChild>
                  <Button type="button" variant="secondary">
                    Entendi
                  </Button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          </div>
        </IphoneFrame>
      </DocSection>

      <DocNote title="Todo popover tem nome">
        O conteúdo é <code>role=&quot;dialog&quot;</code>, e sem nome o leitor de tela anuncia só &quot;diálogo&quot;. <code>PopoverTitle</code> e <code>PopoverDescription</code> viram o <code>aria-labelledby</code> e o <code>aria-describedby</code>; sem título à vista, passe <code>label</code>, que vira um título <code>sr-only</code>. Em desenvolvimento, um popover que abre sem nome avisa no console.
      </DocNote>

      <DocNote title="A seta se paga entre iguais">
        Use <code>PopoverArrow</code> quando o gatilho é um entre muitos iguais — o dia numa grade de trinta, uma célula — e a posição do painel não basta para dizer de qual ele fala. Num botão solto ela é enfeite. Ela espelha a tinta da placa à mão, como a do <code>HoverCard</code>.
      </DocNote>

      <DocNote title="Ele cabe inteiro na janela">
        Centra no gatilho quando cabe, desloca para dentro com a folga de 8px quando não cabe, e encolhe pelos tetos <code>max-h-…-available-height</code> e <code>max-w-…-available-width</code> quando é maior que o espaço. A folga mora em <code>lib/anchored-surface</code>, e a regra <strong>K</strong> do <code>ds:audit</code> impede uma tela de decidir a dela.
      </DocNote>

      <DocNote title="Nada entre o Portal e o Content">
        O <code>Presence</code> do Radix lê a animação pelo ref do filho do <code>Portal</code>. Um Provider no meio perde o ref e o popover some sem animar a saída. Contexto atravessa portal, então providers ficam por fora.
      </DocNote>

      <PropsTable
        title="Popover e PopoverContent"
        rows={[
          {
            prop: "Popover mobile",
            type: '"popover" | "sheet"',
            default: '"popover"',
            description: "sheet abre o mesmo conteúdo numa gaveta abaixo de 768px.",
          },
          {
            prop: "size",
            type: '"auto" | "sm" | "md" | "lg" | "trigger"',
            default: '"md"',
            description: "A largura: 224 · 288 · 352, a do conteúdo ou a do gatilho.",
          },
          {
            prop: "padding",
            type: '"default" | "none"',
            default: '"default"',
            description:
              "none zera recuo e gap, e cada faixa passa a ser dona do seu respiro.",
          },
          {
            prop: "label",
            type: "React.ReactNode",
            description: "O nome para o leitor de tela, sem título à vista.",
          },
          {
            prop: "surface",
            type: '"plate" | "none"',
            default: '"plate"',
            description:
              "none não pinta nada, para conteúdo com superfícies próprias. Nenhuma tela usa hoje — a pilha do Command no Combobox, para quem foi feita, saiu na rodada 198.",
          },
          {
            prop: "align / sideOffset",
            type: '"start" | "center" | "end" / number',
            default: '"center" / 4',
            description: "Alinhamento e distância em relação ao gatilho.",
          },
          {
            prop: "collisionPadding",
            type: "number | Padding",
            default: "ANCHORED_COLLISION_PADDING (8)",
            description:
              "A folga até a borda da janela; não a mude na tela — a regra K do auditor reprova.",
          },
        ]}
      />

      <PropsTable
        title="As peças"
        rows={[
          {
            prop: "PopoverHeader closeButton",
            type: "boolean",
            description: "O × no canto, preso ao topo do título; some na gaveta.",
          },
          {
            prop: "PopoverBody",
            type: 'ComponentProps<"div">',
            description: "O corpo que rola, com a dissolução e a seta de tem mais.",
          },
          {
            prop: "PopoverFooter",
            type: 'ComponentProps<"div">',
            description: "A faixa de pé, sem fio.",
          },
          {
            prop: "PopoverArrow",
            type: "ComponentProps<typeof Popover.Arrow>",
            description: "A seta, na tinta da placa.",
          },
          {
            prop: "PopoverConfirm",
            type: "{ title, description?, confirmLabel?, cancelLabel?, variant?, onConfirm }",
            description:
              "A confirmação curta, no lugar do PopoverContent; Promise no onConfirm trava e fecha ao assentar.",
          },
        ]}
      />
    </>
  )
}

function LargurasDemo() {
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("md")
  return (
    <>
      <Controles inicio={<Eixo rotulo="size" valores={TAMANHOS} valor={size} onChange={setSize} />} />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-64 justify-start">
            {/* Um texto só: em pedaços, a maiúscula do botão caía no meio. */}
            {`abrir com size="${size}"`}
          </Button>
        </PopoverTrigger>
        <PopoverContent size={size} align="start">
          <PopoverHeader>
            <PopoverTitle>size=&quot;{size}&quot;</PopoverTitle>
            <PopoverDescription>
              {size === "trigger"
                ? "A mesma largura do botão que o abriu."
                : size === "auto"
                  ? "A largura do que está dentro."
                  : "Um degrau da escada."}
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </>
  )
}

function ConfirmDemo() {
  const [feito, setFeito] = React.useState(false)
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Remover filtro</Button>
        </PopoverTrigger>
        <PopoverConfirm
          title="Remover o filtro de categoria?"
          description="A lista volta a mostrar todas as categorias."
          confirmLabel="remover"
          variant="destructive"
          onConfirm={() =>
            new Promise<void>((r) =>
              setTimeout(() => {
                setFeito(true)
                r()
              }, 1000)
            )
          }
        />
      </Popover>
      <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
        {feito ? "Filtro removido." : ""}
      </p>
    </>
  )
}
