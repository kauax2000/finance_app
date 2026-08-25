"use client"

import { Container, containerSizes } from "@/components/ui/container"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ContainerDoc() {
  return (
    <>
      <Usage>
        A largura máxima do conteúdo e o respiro lateral. Toda tela começa com um, e o tamanho é sobre <strong>quantas colunas de informação</strong> ela tem.
      </Usage>

      <DocSection
        title="Os degraus"
        code={`<Container size="default">…</Container>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        {Object.entries(containerSizes).map(([name, cls]) => (
          <div key={name} className="rounded-lg bg-muted/40 py-2">
            <Container
              size={name as keyof typeof containerSizes}
              className="rounded-md border border-dashed border-primary/40 py-2"
            >
              <span className="text-xs text-muted-foreground">
                size=&quot;{name}&quot; · {cls}
              </span>
            </Container>
          </div>
        ))}
      </DocSection>

      <DocNote title="O respiro lateral já vem">
        <code>px-4 sm:px-6 lg:px-8</code>. Uma tela que soma o seu próprio
        padding horizontal acaba com o dobro no telefone, que é justamente onde
        cada pixel de largura conta.
      </DocNote>

      <DocNote title="full não é “o mais largo”">
        É &ldquo;não limite aqui&rdquo;, para quando o contêiner de fora já
        resolve a largura. Usar <code>full</code>{" "}
        achando que é o maior degrau
        produz linhas de texto de 1600px, que ninguém consegue ler sem perder a
        linha.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "default" | "lg" | "full"',
            default: '"default"',
            description: "sm para formulário, default para quase tudo, lg para dashboard.",
          },
        ]}
      />
    </>
  )
}
