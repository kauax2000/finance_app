"use client"

import { Container, containerSizes } from "@/components/ui/container"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

export default function EspacamentoDoc() {
  return (
    <>
      <Usage>
        Duas decisões: até onde o conteúdo cresce (<code>Container</code>) e o ritmo entre os blocos (<code>PageSection</code>). Uma tela que declara as duas não precisa de margem própria.
      </Usage>

      <Group title="Largura" layout="grid">
        <Spec title="Container" meta="4 degraus">
          <Stack className="gap-3">
            {Object.entries(containerSizes).map(([name, cls]) => (
              <div key={name} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <code className="font-mono text-2xs text-foreground">
                    size=&quot;{name}&quot;
                  </code>
                  <code className="font-mono text-2xs text-muted-foreground">
                    {cls}
                  </code>
                </div>
                <span
                  className={`h-2 rounded-full bg-primary-accent/25 ${
                    name === "sm"
                      ? "w-1/3"
                      : name === "default"
                        ? "w-2/3"
                        : name === "lg"
                          ? "w-11/12"
                          : "w-full"
                  }`}
                />
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Quando usar cada um">
          <Stack className="gap-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">sm</strong>{" "}
              — formulário de uma
              coluna, tela de autenticação, confirmação.
            </p>
            <p>
              <strong className="text-foreground">default</strong>{" "}
              — o padrão de
              quase toda tela: lista, detalhe, configurações.
            </p>
            <p>
              <strong className="text-foreground">lg</strong>{" "}
              — dashboard e
              tabelas largas, onde a coluna extra cabe.
            </p>
            <p>
              <strong className="text-foreground">full</strong>{" "}
              — quando o
              contêiner de fora já limita a largura. Não é &ldquo;o mais
              largo&rdquo;: é &ldquo;não limite aqui&rdquo;.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Ritmo vertical"
        description="PageSection empilha com gap-4. Entre seções, gap-6 ou gap-8 no contêiner da página. Nunca margem no filho: quem espaça é quem contém."
        code={`<Container size="default" className="flex flex-col gap-8">
  <PageHeader>…</PageHeader>
  <PageSection>…</PageSection>
  <PageSection>…</PageSection>
</Container>`}
        previewClassName="block p-0"
      >
        <Container size="sm" className="flex flex-col gap-6 py-6">
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            PageHeader
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              PageSection · bloco 1
            </div>
            <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              PageSection · bloco 2
            </div>
          </div>
        </Container>
      </DocSection>

      <DocNote title="Par de identidade: sem gap">
        Nome sobre e-mail, rótulo sobre valor, título sobre legenda: quando dois textos empilhados são <strong>o mesmo dado em duas linhas</strong>, quem os separa é a entrelinha. Não declare <code>gap</code>, nem <code>gap-1</code> — dois pixels bastam para o par deixar de ler como uma coisa só. Entre coisas diferentes, <code>gap</code> continua certo.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "default" | "lg" | "full"',
            default: '"default"',
            description: "A largura máxima do conteúdo.",
          },
        ]}
      />
    </>
  )
}
