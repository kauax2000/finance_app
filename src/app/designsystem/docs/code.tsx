"use client"

import { Code } from "@/components/ui/code"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CodeDoc() {
  return (
    <>
      <Usage>
        Um identificador literal: nome de token, caminho de arquivo, chave, comando. Dentro de uma frase ele não tem fundo; sozinho, como rótulo, tem. Tecla de atalho é <code>Kbd</code>.
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
        description="Com fundo: fora de uma frase o preenchimento é o que separa o literal do entorno — o meta de um espécime, um comando para copiar."
        code={`<Code>npm run ds:audit</Code>`}
      >
        <Code>npm run ds:audit</Code>
        <Code>--income-muted</Code>
        <Code>⌘K</Code>
      </DocSection>

      <DocNote title="inline casa com o código da prosa">
        Duas aparências, escolhidas pelo contexto. O <code>inline</code> segue o tratamento do código da prosa de propósito, para os dois não brigarem numa página que mistura ambos.
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
