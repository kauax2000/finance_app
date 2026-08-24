"use client"

import { Code } from "@/components/ui/code"
import { DocSection, Usage } from "../ds-doc"

export default function CodeDoc() {
  return (
    <>
      <Usage>
        Um identificador literal dentro do texto: nome de token, caminho de
        arquivo, chave de configuração. Existe para que essas coisas apareçam
        sempre com a mesma forma, em vez de cada tela inventar um{" "}
        <code>font-mono text-xs</code> próprio.
      </Usage>

      <DocSection
        title="Em uso"
        code={`<Code>--income-muted</Code>
<Code>src/lib/formatters.ts</Code>`}
        previewClassName="flex-col items-start gap-3"
      >
        <p className="text-sm text-muted-foreground">
          A cor vem de <Code>--income-muted</Code>, declarada em{" "}
          <Code>src/app/globals.css</Code>.
        </p>
        <Code className="text-foreground">npm run ds:audit</Code>
      </DocSection>
    </>
  )
}
