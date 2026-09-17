"use client"

import { MoneyDisplay } from "@/components/ui/money-display"
import { Separator } from "@/components/ui/separator"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function SeparatorDoc() {
  return (
    <>
      <Usage>
        Uma régua entre conteúdos que <strong>já estão relacionados</strong>. Se
        são assuntos diferentes, o que separa é espaço — régua demais transforma
        a tela numa planilha. E se a divisão muda o assunto de verdade, quem
        organiza é um cabeçalho, não uma linha.
      </Usage>

      <DocSection
        title="Horizontal"
        description="O padrão. Ocupa a largura do pai e tem 1px."
        code={`<Separator className="my-3" />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="w-full">
          <p className="text-sm text-foreground">Fatura de março</p>
          <Separator className="my-3" />
          <p className="text-sm text-muted-foreground">Fecha em 28/03</p>
        </div>
      </DocSection>

      <DocSection
        title="Vertical"
        description="16px por padrão, e precisa de um pai flex. A altura muda por className."
        code={`<div className="flex items-center gap-3">
  <span>12 transações</span>
  <Separator orientation="vertical" />
  <MoneyDisplay value={1482.3} tone="muted" />
</div>

<Separator orientation="vertical" className="h-7" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>12 transações</span>
          <Separator orientation="vertical" />
          <MoneyDisplay value={1482.3} tone="muted" />
          <Separator orientation="vertical" />
          <span>3 categorias</span>
        </div>
        <div className="flex items-center gap-3">
          {(["h-3", "h-4", "h-7", "h-10"] as const).map((h) => (
            <div key={h} className="flex items-center gap-2">
              <code className="font-mono text-2xs text-muted-foreground">
                {h}
              </code>
              <Separator orientation="vertical" className={h} />
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Peso"
        description="default estrutura; soft arruma o interior de uma superfície já delimitada, como o rodapé de um diálogo, onde a moldura já disse que começa outra coisa."
        code={`<Separator />
<Separator tone="soft" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {(
          [
            ["default", "seções de uma página", undefined],
            ["soft", "rodapé de diálogo, interior de cartão", "soft"],
          ] as const
        ).map(([nome, nota, tone]) => (
          <div key={nome} className="flex w-full flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <code className="font-mono text-2xs text-foreground">{nome}</code>
              <span className="text-2xs text-muted-foreground">{nota}</span>
            </div>
            <Separator tone={tone} />
          </div>
        ))}
      </DocSection>

      <DocNote title="Peso é tone, nunca alfa à mão">
        Use <code>tone</code>, não <code>bg-border/60</code> nem <code>opacity-60</code>: dois nomes cobrem os usos, e cada alfa escrito à mão é livre para divergir.
      </DocNote>

      <DocSection
        title="Com rótulo no meio"
        description="Duas réguas flex-1 com o rótulo entre elas — o “ou” do Field. Não mascare uma régua com um retângulo de fundo: ele só acerta a cor direto na página."
        code={`<div className="flex items-center gap-3">
  <Separator className="flex-1" />
  <span className="shrink-0 text-muted-foreground">ou</span>
  <Separator className="flex-1" />
</div>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full items-center gap-3 text-xs">
          <Separator className="flex-1" />
          <span className="shrink-0 text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>
      </DocSection>

      <DocNote title="Decorativo por padrão, e quase sempre é o certo">
        <code>decorative</code>, o padrão, sai como <code>role=&quot;none&quot;</code>: a régua é recurso visual, e ouvir &ldquo;separador&rdquo; entre blocos não ajuda. <code>decorative={"{false}"}</code> vira <code>role=&quot;separator&quot;</code>, para quando a linha é a única fronteira — um grupo sem título num menu.
      </DocNote>

      <DocNote title="O espaçamento é de quem chama, e vale escolher um">
        A régua não traz margem: <code>my-2</code> num menu ou lista densa, <code>my-3</code> entre blocos de um cartão, <code>my-6</code> entre seções — e aí pergunte se o que separa não deveria ser só espaço.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description:
              "O vertical precisa de pai flex e tem 16px, sobrescritos por className.",
          },
          {
            prop: "tone",
            type: '"default" | "soft"',
            default: '"default"',
            description:
              "default estrutura a página; soft arruma o interior de uma superfície já delimitada.",
          },
          {
            prop: "decorative",
            type: "boolean",
            default: "true",
            description:
              "Decorativo sai como role=\"none\". false vira role=\"separator\" e é anunciado.",
          },
        ]}
      />
    </>
  )
}
