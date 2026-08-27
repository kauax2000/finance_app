"use client"

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
        description="16px por padrão, e precisa de um pai flex — solto num bloco ele não tem altura de onde herdar e some. A altura se muda por className, como em qualquer outro componente."
        code={`<div className="flex items-center gap-3">
  <span>12 transações</span>
  <Separator orientation="vertical" />
  <span>R$ 1.482,30</span>
</div>

<Separator orientation="vertical" className="h-7" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>12 transações</span>
          <Separator orientation="vertical" />
          <span>R$ 1.482,30</span>
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

      <DocNote title="A altura do vertical só passou a obedecer agora">
        As medidas da base eram <code>data-[orientation=vertical]:h-4</code>{" "}
        — classe com <strong>variante</strong>, que não entra no mesmo grupo do
        merge do Tailwind. Um <code>h-7</code>{" "}
        no <code>className</code>{" "}
        não a substituía: não dava erro, não avisava, só continuava 16px.
        <br />
        <br />
        Custou preço três vezes. O cabeçalho deste catálogo pediu{" "}
        <code>h-5</code> e ficou com 16. O cabeçalho do app pedia{" "}
        <code>h-7</code>{" "}
        desde sempre e nunca teve. E o painel de filtros de transações teve que
        copiar o prefixo inteiro —{" "}
        <code>data-[orientation=horizontal]:w-[calc(…)]</code>{" "}
        — para conseguir alargar a régua. Hoje as medidas saem de uma
        condicional e a classe de quem chama é a última.
      </DocNote>

      <DocSection
        title="Peso"
        description="default estrutura; soft arruma. A régua que divide seções de uma página pesa mais que a que separa o rodapé de um diálogo — ali a moldura do próprio diálogo já disse que começa outra coisa."
        code={`<Separator />
<Separator tone="soft" />`}
        previewClassName="flex-col items-stretch gap-4"
      >
        {(
          [
            ["default", "1,35 contra o cartão", undefined],
            ["soft", "1,19 — rodapé de diálogo, interior de cartão", "soft"],
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

      <DocNote title="Três pesos viraram dois nomes">
        O app tinha <code>bg-border</code>, <code>bg-border/60</code>,{" "}
        <code>bg-border/80</code>{" "}
        e um <code>opacity-60</code>{" "}
        — quatro escritas da mesma linha, em nove chamadas, sem nada dizendo
        qual usar quando. A intenção por trás delas era legítima e agora tem
        nome; o <code>/80</code>{" "}
        foi absorvido pelo <code>default</code>, porque um terceiro degrau a
        0,09 de distância não é decisão, é ruído.
      </DocNote>

      <DocSection
        title="Com rótulo no meio"
        description="Duas metades de linha com o rótulo entre elas. É o que o Field usa no “ou” entre um formulário e o login social — e é feito com duas réguas em flex-1, não com uma régua mascarada por um retângulo de fundo, que só acerta a cor quando o separador está direto na página."
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
        Com <code>decorative</code>{" "}
        — o padrão — o elemento sai como <code>role=&quot;none&quot;</code>{" "}
        e o leitor de tela não o anuncia. É o que se quer: a régua é recurso
        visual, e quem já entendeu a estrutura pelo cabeçalho não precisa ouvir
        &ldquo;separador&rdquo; entre cada bloco.
        <br />
        <br />
        <code>decorative={"{false}"}</code>{" "}
        vira <code>role=&quot;separator&quot;</code>{" "}
        com <code>aria-orientation</code>, e serve para o caso raro em que a
        linha <strong>é</strong> a única marca de fronteira — um grupo de itens
        dentro de um menu, sem título. Se existe um título, ele já faz esse
        trabalho melhor.
      </DocNote>

      <DocNote title="O espaçamento é de quem chama, e vale escolher um">
        A régua não traz margem: o ritmo depende de onde ela está.{" "}
        <code>my-2</code>{" "}
        dentro de um menu ou de uma lista densa,{" "}
        <code>my-3</code>{" "}
        entre blocos de um cartão,{" "}
        <code>my-6</code>{" "}
        entre seções de uma página — e nesse último caso pergunte antes se o que
        separa não deveria ser só espaço.
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
