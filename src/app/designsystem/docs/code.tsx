"use client"

import { Code } from "@/components/ui/code"
import { Kbd } from "@/components/ui/kbd"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** As duas aparências, com o que cada uma declara em `codeVariants`. */
const ANATOMIA = [
  {
    variant: "inline",
    exemplo: "--income-muted",
    medidas: "12px · text-xs · --foreground · sem fundo",
  },
  {
    variant: "chip",
    exemplo: "--income-muted",
    medidas: "11px · text-2xs · --muted-foreground · bg-muted · raio 6px · 6×2 de recuo",
  },
] as const

export default function CodeDoc() {
  return (
    <>
      <Usage>
        Um identificador literal: nome de token, caminho de arquivo, classe, comando. Dentro de uma frase ele não tem fundo; sozinho, como rótulo, tem. Tecla de atalho não é <code>Code</code>, é <code>Kbd</code>.
      </Usage>

      <DocSection
        title="Dentro de uma frase"
        description="Sem fundo: uma pastilha no meio do parágrafo pica a linha, e a fonte monoespaçada já identifica o literal."
        code={`A cor vem de <Code variant="inline">--income-muted</Code>.`}
        previewClassName="flex-col items-start gap-3"
      >
        <p className="max-w-prose text-sm text-foreground">
          A cor vem de <Code variant="inline">--income-muted</Code>, declarada
          em <Code variant="inline">src/app/globals.css</Code>, e o auditor
          reclama de quem escrever{" "}
          <Code variant="inline">text-green-600</Code> na tela.
        </p>
      </DocSection>

      <DocSection
        title="Sozinho, como rótulo"
        description="Com fundo: fora de uma frase o preenchimento é o que separa o literal do entorno — o meta de um espécime, um comando para copiar, o token ao lado de uma amostra."
        code={`<Code>npm run ds:audit</Code>
<Code>--income-muted</Code>
<Code>src/components/ui/code.tsx</Code>`}
      >
        <Code>npm run ds:audit</Code>
        <Code>--income-muted</Code>
        <Code>src/components/ui/code.tsx</Code>
      </DocSection>

      <DocSection
        title="As duas aparências, medidas"
        description="O que cada variante declara. O inline tem o corpo e a tinta do código da prosa do catálogo, que é o que as páginas escrevem com <code> cru."
        code={`<Code variant="inline">--income-muted</Code>
<Code>--income-muted</Code>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {ANATOMIA.map((a) => (
          <div key={a.variant} className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-14 shrink-0 text-xs font-medium text-foreground">{a.variant}</span>
            <Code variant={a.variant}>{a.exemplo}</Code>
            <span className="text-xs text-muted-foreground">{a.medidas}</span>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Code, Kbd ou texto"
        description="Três coisas que parecem iguais e não são. O literal que se digita ou se procura no código é Code; a tecla que se aperta é Kbd, desenhada como tecla; o nome de uma tela ou de um botão é texto — ele é para ler, não para copiar."
        code={`<Code>npm run ds:audit</Code>
<Kbd keys="mod+k" />
<span>Nova transação</span>`}
        previewClassName="flex-wrap gap-6"
      >
        <div className="flex flex-col items-start gap-1">
          <Code>npm run ds:audit</Code>
          <span className="text-2xs text-muted-foreground">um comando</span>
        </div>
        <div className="flex flex-col items-start gap-1">
          <Kbd keys="mod+k" />
          <span className="text-2xs text-muted-foreground">um atalho</span>
        </div>
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm text-foreground">Nova transação</span>
          <span className="text-2xs text-muted-foreground">um rótulo</span>
        </div>
      </DocSection>

      <DocNote title="A regra é de contexto, e não de gosto">
        O catálogo tinha três tratamentos convivendo sem ninguém dizer qual usar: a pastilha deste componente, o <code>&lt;code&gt;</code> da prosa estilizado pelas páginas (<code>[&amp;_code]:text-xs</code> em <code>ds-doc</code>) e um punhado de <code>&lt;code&gt;</code> com classes escritas à mão. A divisão que ficou é a de contexto: dentro de uma frase, <code>inline</code>, com o corpo e a tinta do código da prosa para os dois não brigarem na mesma página; sozinho, <code>chip</code>.
      </DocNote>

      <DocNote title="Onde se usa">
        Só no catálogo: 56 chamadas em 14 arquivos, contadas na rodada 157, e 52 delas nas próprias páginas de documentação. O <code>meta</code> de todo <code>Spec</code> é um <code>chip</code> (<code>ds-kit.tsx</code>), e a página inicial usa o <code>inline</code>. <strong>Nenhuma tela do app</strong> mostra um literal — nome de token e caminho de arquivo não são conteúdo para quem usa o produto. A prosa das páginas continua com <code>&lt;code&gt;</code> cru, que o <code>ds-doc</code> estiliza igual ao <code>inline</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"chip" | "inline"',
            default: '"chip"',
            description:
              "chip para literal solto, com fundo; inline para literal dentro de uma frase, sem fundo.",
          },
          {
            prop: "…props de <code>",
            type: 'React.ComponentProps<"code">',
            description: "Vão para o elemento. O componente é um <code> de verdade, com data-slot=\"code\" e data-variant.",
          },
        ]}
      />
    </>
  )
}
