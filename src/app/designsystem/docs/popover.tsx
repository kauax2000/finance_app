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

      <DocNote title="O teto e a folga de colisão vêm de fábrica">
        <code>max-h-(--radix-popover-content-available-height)</code> e{" "}
        <code>collisionPadding</code> deixaram de ser trabalho de quem chama: um
        popover alto saía da tela, e um popover perto da borda encostava nela. A
        variável já era calculada pelo Radix — só o{" "}
        <code>FormPickerPopoverContent</code> a lia, e não é um caso especial
        dele.
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
            default: "8",
            description:
              "Folga mínima até a borda da janela. Suba para um popover largo em tela estreita.",
          },
        ]}
      />
    </>
  )
}
