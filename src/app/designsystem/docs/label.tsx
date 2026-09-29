"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function LabelDoc() {
  return (
    <>
      <Usage>
        O nome do controle, ligado a ele por <code>htmlFor</code>: o clique no texto foca o controle e o leitor de tela anuncia os dois juntos. Num formulário, prefira <code>Field</code> ou <code>FormInput</code>: o <code>FieldLabel</code> é este átomo com a ligação, o degrau e o &ldquo;opcional&rdquo; já resolvidos.
      </Usage>

      <DocSection
        title="Com um campo"
        description="Solto, é preciso escrever o par htmlFor e id à mão. É o caso raro; dentro de um Field o FieldControl escreve os dois."
        code={`<Label htmlFor="descricao">Descrição</Label>
<Input id="descricao" />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="ds-label-input">Descrição</Label>
          <Input id="ds-label-input" placeholder="Padaria" />
        </div>
      </DocSection>

      <DocSection
        title="Com um controle booleano"
        description="O rótulo ao lado soma o texto à área clicável: clicar em “Repetir todo mês” marca a caixa. O alvo de 44px da caixa já existe sem ele; o rótulo é o nome e a área a mais."
        code={`<Checkbox id="recorrente" />
<Label htmlFor="recorrente">Repetir todo mês</Label>`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-label-check" />
          <Label htmlFor="ds-label-check">Repetir todo mês</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="ds-label-switch" />
          <Label htmlFor="ds-label-switch">Avisar antes do vencimento</Label>
        </div>
      </DocSection>

      <DocSection
        title="Desabilitado"
        description="O rótulo apaga junto com o controle, sem prop nenhuma: ele lê o estado do irmão anterior (peer-disabled). Por isso a ordem importa: o controle vem antes do rótulo no DOM."
        code={`<Checkbox id="a" disabled />
<Label htmlFor="a">Débito automático</Label>`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex items-center gap-2">
          <Checkbox id="ds-label-off-1" disabled />
          <Label htmlFor="ds-label-off-1">Débito automático</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="ds-label-off-2" disabled defaultChecked />
          <Label htmlFor="ds-label-off-2">Sincronizar com o banco</Label>
        </div>
      </DocSection>

      <DocNote title="O irmão precisa ser peer, e só dois são">
        <code>peer-disabled</code> só casa com um controle que carrega a classe <code>peer</code>: o <code>Checkbox</code> e o <code>Switch</code>. Um <code>Input</code> desabilitado ao lado de um <code>Label</code> solto não apaga o rótulo, e a saída é o <code>Field disabled</code>, que apaga o <code>FieldLabel</code> pelo grupo. Com o rótulo antes do controle, como num campo, o seletor de irmão também não alcança.
      </DocNote>

      <DocNote title="Uma linha, e a entrelinha é zero">
        O átomo é <code>leading-none</code>: o nome de um controle ao lado dele cabe numa linha, e a caixa do texto fica do tamanho da letra, sem sobra para desalinhar do controle. O <code>FieldLabel</code> troca para <code>leading-snug</code>, porque o rótulo de campo quebra. Quem escrever um rótulo longo num <code>Label</code> solto troca a entrelinha junto.
      </DocNote>

      <DocNote title="Rótulo e valor empilhados não são Label">
        Rótulo sobre valor em modo leitura não rotula controle nenhum: ali o componente é <code>DescriptionList</code>, e quem separa os dois é a entrelinha.
      </DocNote>

      <DocNote title="Onde o app usa">
        Quase sempre por dentro de outra peça: o <code>FieldLabel</code>, o addon do <code>InputGroup</code> (que é um <code>&lt;label&gt;</code> ligado ao campo) e a caixa do <code>RadioGroupItem</code>. Direto numa tela, uma chamada: o &ldquo;Outra&rdquo; do seletor de cor da aparência do workspace, que embrulha o <code>&lt;input type=&quot;color&quot;&gt;</code>. O &ldquo;Mês e ano&rdquo; do seletor de orçamento também era <code>Label</code>, sem controle ligado, e nomeava o par de <code>Select</code>: virou <code>FieldLegend</code> num <code>FieldSet</code>, que é o que uma legenda de conjunto é.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "htmlFor",
            type: "string",
            description: "O id do controle. Sem ele, o rótulo só nomeia o controle que embrulhar.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "Entrega a régua a outro elemento. O InputGroup a usa para um addon com botão, que não pode ser um elemento label.",
          },
          {
            prop: "…props do elemento label",
            type: "React.ComponentProps<typeof LabelPrimitive.Root>",
            description: "Vão para o elemento label do Radix, com data-slot=\"label\". O Radix impede que um duplo clique no texto selecione a palavra.",
          },
        ]}
      />
    </>
  )
}
