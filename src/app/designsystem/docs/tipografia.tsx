"use client"

import {
  Caption,
  H1,
  H2,
  H3,
  H4,
  Lead,
  Muted,
  P,
  Small,
} from "@/components/ui/typography"

import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { Group, Spec, Stack } from "../ds-kit"

export default function TipografiaDoc() {
  return (
    <>
      <Usage>
        Três famílias, cada uma com um território: <strong>Inter</strong> na interface inteira, <strong>Ledger</strong> no título de tela e na marca, e <strong>Geist Mono</strong> no valor que é o assunto da tela. Nunca escolha tamanho e peso soltos numa tela.
      </Usage>

      <DocSection
        title="Títulos"
        description="H1 é o título de tela e usa a serifa de display. H2 para baixo são títulos de interface e seguem na sans — a serifa a 16px perde hierarquia contra o corpo. H2 traz uma régua embaixo: é o divisor de seção de uma página longa, não um título qualquer."
        code={`<H1>Suas finanças</H1>
<H2>Este mês</H2>
<H3>Cartões</H3>
<H4>Fatura aberta</H4>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <H1>Suas finanças</H1>
        <H2>Este mês</H2>
        <H3>Cartões</H3>
        <H4>Fatura aberta</H4>
      </DocSection>

      <DocSection
        title="Texto"
        description="Lead abre uma tela. P é o parágrafo. Muted é o mesmo tamanho de P com a cor secundária, para quando o texto explica em vez de afirmar."
        code={`<Lead>Acompanhe entradas e saídas do mês.</Lead>
<P>A fatura fecha no dia 28 e vence no dia 5.</P>
<Muted>Parcelas futuras não entram neste total.</Muted>
<Small>Atualizado agora</Small>
<Caption>Valores em reais</Caption>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Lead>Acompanhe entradas e saídas do mês.</Lead>
        <P>A fatura fecha no dia 28 e vence no dia 5.</P>
        <Muted>Parcelas futuras não entram neste total.</Muted>
        <Small>Atualizado agora</Small>
        <Caption>Valores em reais</Caption>
      </DocSection>

      <Group title="A escala" layout="grid">
        <Spec title="Tamanhos" meta="--text-*">
          <Stack className="gap-2">
            {[
              ["text-2xs", "0,6875rem", "contagem dentro de controle pequeno"],
              ["text-xs", "0,75rem", "legenda, metadado"],
              ["text-control-sm", "0,8rem", "texto de controle size=\"sm\""],
              ["text-sm", "0,875rem", "o corpo do produto"],
              ["text-base", "1rem", "campo no telefone (evita o zoom do iOS)"],
              ["text-lg", "1,125rem", "título de bloco, saldo de linha"],
              ["text-2xl", "1,5rem", "título de tela no telefone"],
              ["text-3xl", "1,875rem", "título de tela no desktop"],
            ].map(([name, size, use]) => (
              <div key={name} className="flex items-baseline gap-3">
                <code className="w-32 shrink-0 font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
                <span className="nums w-20 shrink-0 text-2xs text-muted-foreground">
                  {size}
                </span>
                <span className="text-xs text-muted-foreground">{use}</span>
              </div>
            ))}
          </Stack>
        </Spec>

        <Spec title="Números" meta=".nums">
          <Stack>
            <div>
              <p className="text-2xs text-muted-foreground">Sem tabular</p>
              <p className="text-sm">R$ 1.111,11</p>
              <p className="text-sm">R$ 8.888,88</p>
            </div>
            <div>
              <p className="text-2xs text-muted-foreground">Com .nums</p>
              <p className="nums text-sm">R$ 1.111,11</p>
              <p className="nums text-sm">R$ 8.888,88</p>
            </div>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="A serifa é voz de display, não de título">
        Ela vive em <code>.page-title</code> e <code>.wordmark</code>, mais o
        &ldquo;DS&rdquo; do cabeçalho deste catálogo — e em mais lugar nenhum.
        Peso 400 numa serifa de contraste alto a 16px não lê como título — lê
        como texto menor, e some a hierarquia contra o corpo em Inter. Título
        de cartão, de diálogo e de seção seguem na sans. Guardar a face para
        onde ela tem tamanho é o que a mantém bonita. A sigla é a exceção que
        confirma a régua: duas maiúsculas não são texto, e o motivo dela está
        em <strong>Marca</strong>.
      </DocNote>

      <DocNote title=".wordmark é o nome quando ele precisa ser texto">
        O nome escrito virou desenho: quem apresenta a marca é o lockup de{" "}
        <strong>Marca</strong>, um SVG onde símbolo e palavra estão no mesmo
        traçado. A classe continua valendo para onde não cabe SVG — assunto de
        e-mail, título de janela, texto puro — e ela existe pela mesma razão de
        sempre: antes o nome saía em Inter seminegrito ao lado de um símbolo
        caligráfico, duas metades da marca falando línguas diferentes.
      </DocNote>

      <DocNote title="Ledger é peso único, e o 400 não se força">
        A família tem só o 400. Pedir <code>font-semibold</code>{" "}
        num título dispara o negrito sintético do navegador, que engorda a haste
        de forma irregular e desmonta justamente o desenho da serifa. É por isso
        que <code>.page-title</code> declara <code>font-weight: 400</code>{" "}
        em vez de herdar o 600 dos outros títulos.
      </DocNote>

      <DocNote title="Por que dois degraus fora da escala do Tailwind">
        Valor arbitrário repetido é um token que ainda não foi nomeado: <code>text-[10px]</code> e <code>text-[0.8rem]</code> já apareciam em seis lugares, cada um livre para divergir um pixel.
      </DocNote>

      <PropsTable
        title="Componentes"
        rows={[
          { prop: "H1 … H4", type: "ComponentProps<'h1'>", description: "Títulos. H2 traz a régua de seção." },
          { prop: "Lead", type: "ComponentProps<'p'>", description: "Parágrafo de abertura, maior e secundário." },
          { prop: "P", type: "ComponentProps<'p'>", description: "O parágrafo do corpo." },
          { prop: "Muted", type: "ComponentProps<'p'>", description: "Texto secundário, mesmo tamanho de P." },
          { prop: "Small", type: "ComponentProps<'small'>", description: "Metadado com peso médio." },
          { prop: "Caption", type: "ComponentProps<'p'>", description: "Legenda abaixo de um bloco." },
        ]}
      />
    </>
  )
}
