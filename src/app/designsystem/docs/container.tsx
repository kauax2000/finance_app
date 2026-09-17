"use client"

import {
  Container,
  containerGutters,
  containerSizes,
  containerStacks,
} from "@/components/ui/container"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

/** A medida de cada degrau, em px. `full` não tem teto. */
const MEDIDA: Record<keyof typeof containerSizes, number | null> = {
  sm: 448,
  md: 576,
  lg: 672,
  xl: 1280,
  full: null,
}

const QUEM_PEDIU: Record<keyof typeof containerSizes, string> = {
  sm: "as duas cascas de erro",
  md: "seis das nove cascas do app — o padrão",
  lg: "o detalhe de cartão",
  xl: "a casca deste catálogo",
  full: "quem já tem largura de fora",
}

/**
 * O traço da régua é o número: a proporção sai da divisão pelo maior degrau
 * nomeado, e por isso vive em `style`, como a barra de um gráfico.
 */
const MAIOR = 1280

function larguraDoTraco(size: keyof typeof containerSizes): string {
  const px = MEDIDA[size]
  return px === null ? "100%" : `${(px / MAIOR) * 100}%`
}

export default function ContainerDoc() {
  return (
    <>
      <Usage>
        Onde uma tela começa: até onde o conteúdo cresce, quanto respiro tem na lateral e em que ritmo os blocos se sucedem. Dentro dele, o bloco com título é o <code>PageSection</code>.
      </Usage>

      <DocSection
        title="Os degraus"
        description="Cinco larguras, cada uma com um consumidor. Não há degrau sem tela."
        code={`<Container>…</Container>              {/* md · 576 */}
<Container size="lg">…</Container>`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        {(
          Object.keys(containerSizes) as (keyof typeof containerSizes)[]
        ).map((name) => (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-2xs text-foreground">
                size=&quot;{name}&quot;
              </code>
              <code className="font-mono text-2xs text-muted-foreground">
                {containerSizes[name]}
                {MEDIDA[name] === null ? " · sem teto" : ` · ${MEDIDA[name]}px`}
              </code>
              <span className="text-2xs text-muted-foreground">
                {QUEM_PEDIU[name]}
              </span>
            </div>
            <span
              className="h-2 rounded-full bg-primary-accent/25"
              style={{ width: larguraDoTraco(name) }}
            />
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A calha é opt-in"
        description="none é o padrão, porque a casca do app já é dona da calha. page é a gramática que o app renderiza: px-4, e px-6 a partir de 768."
        code={`<Container />                    {/* sem calha — o padrão */}
<Container gutter="page" />      {/* px-4 md:px-6 */}`}
        previewClassName="flex-col items-stretch gap-3 p-0"
      >
        {(
          Object.keys(containerGutters) as (keyof typeof containerGutters)[]
        ).map((name) => (
          <div key={name} className="rounded-lg bg-muted/40 py-2">
            <Container
              size="full"
              gutter={name}
              className="border-y border-dashed border-primary-accent/40 py-2"
            >
              <code className="font-mono text-2xs text-muted-foreground">
                gutter=&quot;{name}&quot;
                {containerGutters[name] ? ` · ${containerGutters[name]}` : ""}
              </code>
            </Container>
          </div>
        ))}
      </DocSection>

      <DocNote title="Não some calha dentro da casca do app">
        A casca já declara o recuo lateral (<code>px-4 … md:p-6</code>). Um <code>Container</code> com <code>gutter=&quot;page&quot;</code> dentro dela dobra a calha e rouba largura justo no telefone; use <code>page</code> só quando ninguém acima a declarou.
      </DocNote>

      <DocNote title="full não é &ldquo;o mais largo&rdquo;">
        É &ldquo;não limite aqui&rdquo;, para quando o contêiner de fora já resolve a largura. Usado como maior degrau, produz linhas de texto que ninguém lê sem perder a vista.
      </DocNote>

      <DocNote title="As classes ficam literais no cva">
        O Tailwind varre o código como texto, então classe montada em tempo de execução não chega ao CSS. <code>containerSizes</code> e <code>containerGutters</code> existem ao lado do <code>cva</code> para esta página iterar, e <code>page-chrome-ladder.test.ts</code> falha se divergirem.
      </DocNote>

      <DocSection
        title="O ritmo"
        description="stack empilha o conteúdo e declara a distância entre os blocos, no lugar do flex flex-col gap-* escrito à mão em cada chamada."
        code={`<Container stack="section">
  <PageHeader />
  <PageSection />
  <PageSection />
</Container>`}
        previewClassName="flex-col items-stretch gap-6 p-0"
      >
        {(
          Object.keys(containerStacks) as (keyof typeof containerStacks)[]
        ).map((name) => (
          <div key={name} className="flex flex-col gap-1">
            <code className="font-mono text-2xs text-muted-foreground">
              stack=&quot;{name}&quot;
            </code>
            <Container size="full" stack={name}>
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-lg border border-dashed border-border px-3 py-2 text-2xs text-muted-foreground"
                >
                  bloco {n}
                </div>
              ))}
            </Container>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="A escala tem nome"
        description="Quatro distâncias com nome, e não uma régua numérica: elas nomeiam as decisões que o sistema já tomou."
        code={`gap-(--space-block)      /* entre blocos */
gap-(--space-section)    /* entre seções */`}
        previewClassName="flex-col items-stretch gap-4 p-0"
      >
        {[
          {
            token: "--space-identity",
            valor: "0",
            o: "o par de identidade — nome sobre e-mail, rótulo sobre valor",
            w: "0",
          },
          {
            token: "--space-inline",
            valor: "8px",
            o: "dentro de um bloco",
            w: "0.5rem",
          },
          {
            token: "--space-block",
            valor: "16px",
            o: "entre blocos — o gap do PageSection",
            w: "1rem",
          },
          {
            token: "--space-section",
            valor: "32px",
            o: "entre seções — o stack do Container",
            w: "2rem",
          },
        ].map((d) => (
          <div key={d.token} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-2xs text-foreground">
                {d.token}
              </code>
              <code className="font-mono text-2xs text-muted-foreground">
                {d.valor}
              </code>
              <span className="text-2xs text-muted-foreground">{d.o}</span>
            </div>
            {/* A barra é a distância de verdade, e não uma proporção
                desenhada: quem lê confere o token com a régua do olho. */}
            <span
              className="h-2 rounded-full bg-primary-accent/25"
              style={{ width: d.w, minWidth: d.w === "0" ? "2px" : undefined }}
            />
          </div>
        ))}
      </DocSection>

      <DocNote title="Quem espaça é quem contém">
        Nenhum filho declara a própria margem: a distância entre dois blocos é de quem os empilha — <code>stack</code> aqui, <code>gap</code> no <code>PageSection</code>. Um componente com margem própria muda de respiro conforme o vizinho.
      </DocNote>

      <DocNote title="Dentro de um bloco é metade da distância entre blocos">
        Dentro, <code>--space-inline</code> (8px); entre blocos, <code>--space-block</code> (16px). A razão de 2 para 1 é o que separa &ldquo;mesmo assunto&rdquo; de &ldquo;outro assunto&rdquo; — tudo a 8px lê como linhas soltas.
      </DocNote>

      <DocNote title="Par de identidade: sem gap">
        Nome sobre e-mail, rótulo sobre valor: quando dois textos são <strong>o mesmo dado em duas linhas</strong>, quem os separa é a entrelinha. Não declare <code>gap</code>, nem <code>gap-1</code> — é <code>--space-identity</code>, que vale zero.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl" | "full"',
            default: '"md"',
            description: "A largura máxima: 448 · 576 · 672 · 1280 · sem teto.",
          },
          {
            prop: "gutter",
            type: '"none" | "page"',
            default: '"none"',
            description: "A calha lateral. page só quando ninguém acima já a declarou.",
          },
          {
            prop: "stack",
            type: '"none" | "block" | "section"',
            default: '"none"',
            description: "Empilha o conteúdo e declara a distância entre os blocos.",
          },
        ]}
      />
    </>
  )
}
