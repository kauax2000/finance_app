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
        Uma camada ancorada a um gatilho, aberta por clique. Diferente do <code>Tooltip</code>, funciona no toque; diferente do <code>Dialog</code>, não bloqueia a tela — certo para um ajuste rápido, errado para uma decisão. Seletor que sai de um campo é <code>FormPickerPopover</code>.
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
              <PopoverTitle className="text-xs font-medium text-muted-foreground">
                Período
              </PopoverTitle>
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

      <DocNote title="padding=&quot;none&quot; tira recuo e gap juntos">
        Para quando o popover hospeda um componente inteiro — calendário, lista, <code>Command</code> — e quem manda no respiro é o conteúdo. É a mesma decisão do <code>Card</code>.
      </DocNote>

      <DocNote title="Todo popover tem PopoverTitle">
        O conteúdo é <code>role=&quot;dialog&quot;</code>, e sem nome o leitor de tela anuncia só &quot;diálogo&quot;. <code>PopoverTitle</code> e <code>PopoverDescription</code> viram o <code>aria-labelledby</code> e o <code>aria-describedby</code> quando existem. Sem rótulo visível, use o par em <code>className=&quot;sr-only&quot;</code>.
      </DocNote>

      <DocNote title="Ele cabe inteiro na janela">
        Centra no gatilho quando cabe, desloca para dentro com a folga de 8px quando não cabe, e encolhe pelos tetos <code>max-h-…-available-height</code> e <code>max-w-…-available-width</code> quando é maior que o espaço — deslocar não torna visível o que não cabe. A folga mora em <code>lib/anchored-surface</code>, e a regra <strong>K</strong> do <code>ds:audit</code> impede uma tela de decidir a dela.
      </DocNote>

      <DocNote title="Nada entre o Portal e o Content">
        O <code>Presence</code> do Radix lê a animação pelo ref do filho do <code>Portal</code>. Um Provider no meio perde o ref e o popover some sem animar a saída. Contexto atravessa portal, então providers ficam por fora.
      </DocNote>

      <DocNote title="Entrada com a curva da casa; saída só fade">
        A entrada usa <code>ease-(--ease-out)</code> em <code>--duration-base</code> — sem a classe <code>ease-*</code>, vale a curva do navegador — com fade, 8px do lado de onde veio e <code>zoom-95</code>. A duração é <code>animation-duration-*</code>, não <code>duration-*</code>, que liga <code>transition: all</code>. A saída é só fade em <code>--duration-instant</code>: o que sai de cena não pede atenção.
      </DocNote>

      <DocNote title="Para seletor ancorado num campo, use FormPickerPopover">
        Ele iguala a largura ao gatilho, aumenta a folga de colisão e não rouba o foco; repetir isso à mão é como cada seletor acaba diferente.
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
              "A folga até a borda da janela, de lib/anchored-surface; não a mude na tela — a regra K do auditor reprova.",
          },
        ]}
      />
    </>
  )
}
