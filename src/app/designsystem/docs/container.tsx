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
 * O traço da régua é o **número**, e não uma aproximação em classe.
 *
 * A primeira versão desenhava três porcentagens arbitrárias em classe — a regra
 * D2 do auditor as pegou —, e elas ainda mentiam por um ou dois pontos, porque
 * a escala deixou de ser uniforme. A proporção é dado: ela sai da divisão pelo
 * maior degrau nomeado, e por isso vive em `style`, como a barra de um gráfico.
 *
 * (Uma lição de método de graça: o auditor varre **texto**, então citar as
 * classes removidas dentro deste comentário as fazia reaparecer no relatório.)
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
        Onde uma tela começa: até onde o conteúdo cresce, quanto respiro ele tem
        na lateral e em que ritmo os blocos dele se sucedem. As três decisões de
        espaçamento e largura de uma página moram aqui — antes eram duas
        páginas, e a Fundação declarava este arquivo como fonte.
      </Usage>

      <DocSection
        title="Os degraus"
        description="Cinco larguras, e cada uma tem um consumidor contado. Não há degrau sem tela."
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

      <DocNote title="1024 saiu da escada, e era o padrão">
        Ele tinha <strong>zero usos no repositório inteiro</strong>. A rodada
        anterior renomeou <code>default</code> para <code>md</code> e deixou o
        número sem examinar — o nome ficou certo apontando para uma largura que
        nenhuma tela pediu. Devolver um degrau no dia em que uma tela pedir é
        uma linha; mantê-lo era manter a ficção.
      </DocNote>

      <DocSection
        title="A calha é opt-in"
        description="none é o padrão. page é a gramática que o app renderiza: um degrau, quebrando em 768."
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

      <DocNote title="A calha era o que tornava este componente inadotável">
        A casca do app já é dona dela (<code>px-4 … md:p-6</code>), e uma tela
        que somasse a do <code>Container</code> a <strong>dobrava</strong>.
        Medido a 375px, o conteúdo caía de <strong>343 para 311px</strong>; a
        1280, de 1232 para <strong>960</strong>, com 56px de calha por lado. Era
        palavra por palavra o defeito que esta página descrevia enquanto o
        componente o cometia — e é por isso que ele passou tanto tempo com zero
        consumidores.
        <br />
        Das nove cascas de página escritas à mão no app,{" "}
        <strong>nenhuma</strong> declara calha horizontal. A única que tenta
        escreve <code>px-1 sm:px-0</code> — quatro pixels que somem em 640.
      </DocNote>

      <DocNote title="full não é “o mais largo”">
        É &ldquo;não limite aqui&rdquo;, para quando o contêiner de fora já
        resolve a largura. Usar <code>full</code> achando que é o maior degrau
        produz linhas de texto de 1600px, que ninguém consegue ler sem perder a
        linha de vista.
      </DocNote>

      <DocNote title="A tabela e o cva são dois, e um teste os mantém iguais">
        O Tailwind varre o código como <strong>texto</strong>, então uma classe
        montada em tempo de execução não chega ao CSS: os literais têm que ficar
        no <code>cva</code>. As tabelas <code>containerSizes</code> e{" "}
        <code>containerGutters</code> existem ao lado dele para esta página
        poder iterá-las, e <code>page-chrome-ladder.test.ts</code> falha se
        divergirem.
      </DocNote>

      <DocSection
        title="O ritmo"
        description="stack empilha o conteúdo e declara a distância entre os blocos. Era escrito à mão em toda chamada: flex flex-col gap-8 nas páginas, flex flex-col gap-4 na casca do app."
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
        description="Quatro distâncias, e não uma régua numérica. Redeclarar 4/8/12/16 seria copiar o Tailwind para dentro de casa; estes nomeiam as decisões que o sistema já tomou."
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
        Nenhum filho declara a própria margem. A distância entre dois blocos é
        decisão de quem os empilha — <code>stack</code> aqui,{" "}
        <code>gap</code> no <code>PageSection</code> —, porque só quem contém
        sabe o que vem antes e o que vem depois. Um componente que traz margem
        própria muda de respiro conforme o vizinho, e ninguém consegue prever o
        resultado sem abrir os dois arquivos.
      </DocNote>

      <DocNote title="Duas escalas, e é isso que faz a tela ter blocos">
        Dentro de um bloco a distância é <code>--space-inline</code>; entre
        blocos, <code>--space-block</code>. A razão de{" "}
        <strong>2 para 1</strong> entre as duas é o que separa &ldquo;mesmo
        assunto&rdquo; de &ldquo;outro assunto&rdquo; — foi medido na rodada do{" "}
        <code>HoverCardBody</code>, onde tudo a 8px deixava identidade, rótulo,
        número e datas lendo como cinco linhas soltas.
      </DocNote>

      <DocNote title="Par de identidade: sem gap">
        Nome sobre e-mail, rótulo sobre valor, título sobre legenda: quando dois
        textos empilhados são <strong>o mesmo dado em duas linhas</strong>, quem
        os separa é a entrelinha. Não declare <code>gap</code>, nem{" "}
        <code>gap-1</code> — dois pixels bastam para o par deixar de ler como
        uma coisa só. É <code>--space-identity</code>, e ele vale zero de
        propósito. Cinco componentes chegaram nele corrigindo o mesmo defeito.
      </DocNote>

      <DocNote title="Isto era duas páginas">
        Havia uma Fundação chamada &ldquo;Espaçamento e largura&rdquo; cuja
        fonte declarada era <code>src/components/ui/container.tsx</code> — ela
        documentava as duas coisas, e o componente entregava só uma. Os três
        blocos dela eram o <code>Container</code>, e a tabela de props dela era
        o <code>size</code> dele. Em vez de separar os assuntos, o componente
        passou a fazer os dois: largura, calha e ritmo.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl" | "full"',
            default: '"md"',
            description:
              "A largura máxima. 448 · 576 · 672 · 1280 · sem teto.",
          },
          {
            prop: "gutter",
            type: '"none" | "page"',
            default: '"none"',
            description:
              "A calha lateral. page só quando ninguém acima já a declarou.",
          },
          {
            prop: "stack",
            type: '"none" | "block" | "section"',
            default: '"none"',
            description:
              "Empilha o conteúdo e declara a distância entre os blocos.",
          },
        ]}
      />
    </>
  )
}
