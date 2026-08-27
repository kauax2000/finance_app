"use client"

import { Code } from "@/components/ui/code"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CodeDoc() {
  return (
    <>
      <Usage>
        Um identificador literal: nome de token, caminho de arquivo, chave,
        comando. Duas aparências, e a escolha é de <strong>contexto</strong> —
        dentro de uma frase ele não tem fundo; sozinho, como rótulo, tem.
      </Usage>

      <DocSection
        title="Dentro de uma frase"
        description="Sem fundo. Uma pastilha no meio de um parágrafo pica a linha e atrapalha a leitura corrida — o que identifica o literal ali é a fonte monoespaçada, que já basta."
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
        description="Com fundo. Fora de uma frase não há nada ancorando o literal, e o preenchimento é o que o separa do que está em volta: o meta de um espécime, o token ao lado de um ladrilho de cor, um comando para copiar."
        code={`<Code>npm run ds:audit</Code>`}
      >
        <Code>npm run ds:audit</Code>
        <Code>--income-muted</Code>
        <Code>⌘K</Code>
      </DocSection>

      <DocNote title="Eram três aparências, sem regra nenhuma">
        A pastilha deste componente aparecia em <strong>6</strong>{" "}
        lugares; o <code>&lt;code&gt;</code>{" "}
        cru da prosa, estilizado pelas próprias páginas, em mais de{" "}
        <strong>500</strong>; e um punhado de{" "}
        <code>&lt;code&gt;</code>{" "}
        com classes escritas à mão nas páginas de documentação. Corpos e tintas
        diferentes, nada dizendo qual usar quando. O <code>inline</code>{" "}
        casa com o tratamento da prosa de propósito: numa página que mistura os
        dois, eles não podem brigar.
      </DocNote>

      <DocNote title="A regra já tinha um infrator">
        A visão geral do catálogo escrevia &ldquo;os componentes vivem em{" "}
        <code>src/components/ui/</code>&rdquo; com a pastilha, no meio da frase.
        Virou <code>inline</code> junto com esta página.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"chip" | "inline"',
            default: '"chip"',
            description:
              "chip para literal solto; inline para literal dentro de uma frase.",
          },
        ]}
      />
    </>
  )
}
