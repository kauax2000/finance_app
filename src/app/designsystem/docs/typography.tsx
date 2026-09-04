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
import { Group, Spec, SpecimenPanel, Stack } from "../ds-kit"

/** Os degraus de corpo, do menor ao maior, com o que cada um carrega. */
const DEGRAUS = [
  ["text-2xs", "0,6875rem", "contagem dentro de controle pequeno"],
  ["text-xs", "0,75rem", "legenda, metadado"],
  ["text-control-sm", "0,8rem", 'texto de controle size="sm"'],
  ["text-sm", "0,875rem", "o corpo do produto"],
  ["text-base", "1rem", "campo no telefone (evita o zoom do iOS)"],
  ["text-lg", "1,125rem", "título de bloco, saldo de linha"],
  ["text-2xl", "1,5rem", "título de tela no telefone"],
  ["text-3xl", "1,875rem", "título de tela no desktop"],
]

export default function TypographyDoc() {
  return (
    <>
      <Usage>
        Três famílias, cada uma com um território: <strong>Inter</strong> na
        interface inteira, <strong>Ledger</strong> no título de tela e na marca,
        e <strong>Geist Mono</strong> no valor que é o assunto da tela. Dentro
        delas, oito degraus de corpo e nove componentes de texto — e escrever
        texto é escolher um dos nove, nunca um tamanho e um peso soltos. O
        próximo título escrito à mão diverge do anterior por dois pixels, e
        ninguém nota até as telas aparecerem lado a lado.
      </Usage>

      <Group
        title="As três famílias"
        layout="grid"
        description="Nenhuma delas se escolhe na tela: a face vem do componente ou da classe. As três são carregadas em src/app/layout.tsx e publicadas como --font-sans, --font-display e --font-mono."
      >
        <Spec title="Inter" meta="--font-sans">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <span className="font-sans text-lg text-foreground">
                Fatura fechada em 28 de março
              </span>
              <span className="font-sans text-sm text-muted-foreground">
                Corpo, rótulo, botão, título de cartão e de diálogo.
              </span>
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A interface inteira. <code>--font-heading</code> é um{" "}
              <strong>apelido</strong> dela, e não uma segunda face — medido, a
              classe <code>font-heading</code> aparece 32 vezes no repositório e
              nenhuma delas muda um pixel. Ela não é token morto: é o gancho para
              o dia em que os títulos de interface deixarem de ser Inter. Trocar
              custa uma linha, e não 32.
            </p>
          </Stack>
        </Spec>

        <Spec title="Ledger" meta="--font-display">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <span className="page-title text-3xl text-foreground">
                Suas finanças
              </span>
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              O título de tela e o nome escrito, e nada mais. Peso único 400,
              serifas em cunha, caixa generosa. Quatro famílias caíram antes
              dela, cada uma por um motivo diferente — Plus Jakarta não se
              distinguia de Inter no corpo em que renderizava, Fraunces era
              acolhedora em vez de elegante, Instrument Serif era condensada
              demais, e Playfair está em todo lugar. O caminho inteiro está no
              comentário de <code>src/app/layout.tsx</code>.
            </p>
          </Stack>
        </Spec>

        <Spec title="Geist Mono" meta="--font-mono">
          <Stack className="gap-3">
            <SpecimenPanel surface="background" className="items-start">
              <span className="nums font-mono text-2xl text-foreground">
                R$ 4.281,90
              </span>
              <span className="nums font-mono text-2xl text-muted-foreground">
                R$ 1.111,11
              </span>
            </SpecimenPanel>
            <p className="text-xs leading-relaxed text-muted-foreground">
              A face de extrato, para o valor que é o assunto da tela. Ela não se
              escreve à mão: entra por padrão nos dois tamanhos em que o número é
              o herói (<code>MoneyDisplay</code> em <code>xl</code> e{" "}
              <code>2xl</code>), no <code>&lt;Input money mono&gt;</code> e no{" "}
              <code>Code</code>. Nas linhas de lista o valor volta para Inter com
              figura tabular — mono em 46 linhas de extrato vira textura.
            </p>
          </Stack>
        </Spec>
      </Group>

      <DocNote title="A serifa é voz de display, não de título">
        Ela vive em <code>.page-title</code> e <code>.wordmark</code>, mais o
        &ldquo;DS&rdquo; do cabeçalho deste catálogo — e em mais lugar nenhum.
        Peso 400 numa serifa de contraste alto a 16px não lê como título — lê
        como texto menor, e some a hierarquia contra o corpo em Inter. Título de
        cartão, de diálogo e de seção seguem na sans. Guardar a face para onde
        ela tem tamanho é o que a mantém bonita. A sigla é a exceção que confirma
        a régua: duas maiúsculas não são texto, e o motivo dela está em{" "}
        <strong>Marca</strong>. Medido: <code>.page-title</code> é aplicada em
        exatamente dois lugares do repositório — o <code>H1</code> aqui embaixo e
        o <code>PageHeaderTitle</code>. Ela mora fora de <code>@layer</code>, e
        por isso vence utilitário; é o que o teste de escada do chrome de página
        já tranca.
      </DocNote>

      <DocNote title=".wordmark é o nome quando ele precisa ser texto">
        O nome escrito virou desenho: quem apresenta a marca é o lockup de{" "}
        <strong>Marca</strong>, um SVG onde símbolo e palavra estão no mesmo
        traçado. A classe continua valendo para onde não cabe SVG — assunto de
        e-mail, título de janela, texto puro — e ela existe pela mesma razão de
        sempre: antes o nome saía em Inter seminegrito ao lado de um símbolo
        caligráfico, duas metades da marca falando línguas diferentes. Como
        classe, hoje ela é aplicada num lugar só, o espécime da página de Marca.
        A contagem é um, e é honesto dizer.
      </DocNote>

      <DocNote title="Ledger é peso único, e o 400 não se força">
        A família tem só o 400. Pedir <code>font-semibold</code> num título
        dispara o negrito sintético do navegador, que engorda a haste de forma
        irregular e desmonta justamente o desenho da serifa. É por isso que{" "}
        <code>.page-title</code> declara <code>font-weight: 400</code> em vez de
        herdar o 600 dos outros títulos.
      </DocNote>

      <Group
        title="A escala"
        layout="grid"
        description="Oito degraus, e nenhum deles se escolhe por gosto: cada um tem um trabalho. Ao lado, .nums — a figura tabular, que trava a largura do dígito para a coluna de valores não dançar a cada centavo."
      >
        {/* A tabela tem três colunas e duas delas têm largura fixa. Numa célula
            de um terço do grupo sobram 46px para o uso, e ele quebra em até
            seis linhas — medido. Ela ocupa a linha inteira no `md` e dois
            terços no `xl`; o `.nums` ao lado é pequeno e cabe num terço. */}
        <Spec title="Tamanhos" meta="--text-*" className="md:col-span-2">
          <Stack className="gap-2">
            {DEGRAUS.map(([name, size, use]) => (
              <div
                key={name}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
              >
                <code className="w-32 shrink-0 font-mono text-2xs text-muted-foreground">
                  {name}
                </code>
                <span className="nums w-20 shrink-0 text-2xs text-muted-foreground">
                  {size}
                </span>
                {/* O nome e a medida somam 232px com as calhas. Abaixo de `sm`
                    o cartão tem 311, e o uso ficava com 47 — quatro linhas de
                    uma palavra, medido. Ele desce para a própria linha, e volta
                    para o lado assim que houver largura. */}
                <span className="basis-full text-xs text-muted-foreground sm:basis-auto">
                  {use}
                </span>
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

      <DocNote title="Por que dois degraus fora da escala do Tailwind">
        Valor arbitrário repetido é um token que ainda não foi nomeado:{" "}
        <code>text-[10px]</code> e <code>text-[0.8rem]</code> já apareciam em
        seis lugares, cada um livre para divergir um pixel. Hoje são{" "}
        <code>--text-2xs</code> e <code>--text-control-sm</code>, declarados no{" "}
        <code>@theme</code> de <code>globals.css</code> com a própria entrelinha.
      </DocNote>

      <DocSection
        title="Títulos"
        description="H1 é o título de tela e usa a serifa de display; H2 para baixo são títulos de interface e seguem na sans — a serifa a 16px perde hierarquia contra o corpo. Os quatro carregam scroll-m-20, para que um link de âncora não pare com o título colado no topo."
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
        description="Lead abre uma tela. P é o parágrafo, e a entrelinha relaxada é o que o separa de um text-sm qualquer. Muted é o mesmo corpo de P na cor secundária — ele é cor, não tamanho; para texto menor os componentes são Small e Caption."
        code={`<Lead>Acompanhe entradas e saídas do mês.</Lead>
<P>A fatura do Nubank fecha no dia 28 e vence no dia 5.</P>
<Muted>Parcelas futuras não entram neste total.</Muted>
<Small>Atualizado agora</Small>
<Caption>Valores em reais</Caption>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Lead>Acompanhe entradas e saídas do mês.</Lead>
        <P>
          A fatura do Nubank fecha no dia 28 e vence no dia 5. Compras feitas
          depois do fechamento entram na fatura seguinte.
        </P>
        <Muted>Parcelas futuras não entram neste total.</Muted>
        <Small>Atualizado agora</Small>
        <Caption>Valores em reais</Caption>
      </DocSection>

      <DocNote title="Um H1 por tela, e ele é o PageHeaderTitle">
        <code>PageHeaderTitle</code> já é o <code>&lt;h1&gt;</code>. Usar{" "}
        <code>H1</code> de novo no corpo cria dois títulos de nível um, e quem
        navega por cabeçalhos passa a ver duas telas onde há uma. Os dois vestem
        a mesma classe <code>.page-title</code>; a diferença é o corpo —{" "}
        <code>H1</code> crava <code>text-3xl</code>, e{" "}
        <code>PageHeaderTitle</code> lê <code>--page-title</code>, que o{" "}
        <code>PageHeader</code> publica em três degraus. Medido:{" "}
        <code>H1</code> tem zero usos fora deste catálogo, e isso é o certo, não
        um esquecimento — quem escreve o título de uma tela é o cabeçalho dela. O
        espécime acima é a exceção que uma página de documentação paga: para
        mostrar o componente ela precisa renderizá-lo.
      </DocNote>

      <DocNote title="PageSectionTitle é o H2, e PageHeaderTitle é o H1">
        Os dois vestem o átomo por <code>asChild</code> e trocam só o corpo —{" "}
        <code>text-(length:--page-section-title)</code> em três degraus (14, 16 e
        18px), <code>text-(length:--page-title)</code> no cabeçalho. É por isso
        que o <code>H2</code> <strong>não traz régua</strong>: trazia, herança do
        shadcn, e um átomo que o template precisa desfazer para vestir não é a
        peça de baixo. A régua de seção existe, e é de quem dispõe —{" "}
        <code>PageSection variant=&quot;ruled&quot;</code>.
      </DocNote>

      <DocNote title="Com asChild, a sobrescrita vai no átomo">
        O <code>Slot</code> concatena as duas <code>className</code> sem{" "}
        <code>twMerge</code>: <code>&lt;H4 asChild&gt;&lt;p
        className=&quot;text-base&quot;/&gt;&lt;/H4&gt;</code> deixa{" "}
        <code>text-lg</code> <em>e</em> <code>text-base</code> no DOM, e quem
        vence é a ordem de emissão do CSS. Escreva{" "}
        <code>&lt;H4 asChild className=&quot;text-base&quot;&gt;&lt;p/&gt;&lt;/H4&gt;</code>
        — <code>cn()</code> resolve tamanho contra tamanho, verificado.
      </DocNote>

      <DocNote title="Seis dos nove são a base que o sistema veste">
        Dezessete arquivos de <code>ui/</code> passaram a importar este:{" "}
        <code>PageHeaderTitle</code> sobre <code>H1</code>,{" "}
        <code>PageSectionTitle</code> sobre <code>H2</code>,{" "}
        <code>EmptyStateTitle</code> sobre <code>H4</code>, os títulos de vazio
        de <code>Command</code> e <code>Timeline</code> sobre <code>P</code>, e{" "}
        <code>Muted</code> e <code>Caption</code> em toda descrição, legenda e
        rótulo de grupo — <code>Card</code>, <code>Dialog</code>,{" "}
        <code>Popover</code>, <code>Field</code>, <code>Item</code>,{" "}
        <code>Table</code>, <code>Select</code>. Antes, nenhum importava: cada
        um escrevia <code>text-sm text-muted-foreground</code> à mão. No app,
        fora do catálogo, <code>Muted</code> tem 9 usos e <code>P</code> 6;{" "}
        <code>H3</code>, <code>Lead</code> e <code>Small</code> seguem sem
        consumidor — e a contagem fica aqui porque promessa medida é melhor que
        promessa calada.
      </DocNote>

      <PropsTable
        title="Componentes"
        rows={[
          {
            prop: "H1 … H4",
            type: "ComponentProps<'h1'…'h4'> & { asChild? }",
            description:
              "H1 é a serifa de display; H2–H4 são a sans, sem régua. asChild troca o elemento e mantém o estilo.",
          },
          {
            prop: "Lead",
            type: "ComponentProps<'p'>",
            description: "text-lg secundário, para abrir uma tela.",
          },
          {
            prop: "P",
            type: "ComponentProps<'p'>",
            description: "text-sm com entrelinha relaxada.",
          },
          {
            prop: "Muted",
            type: "ComponentProps<'p'>",
            description:
              "text-sm secundário — o mesmo corpo de P, na cor secundária.",
          },
          {
            prop: "Small",
            type: "ComponentProps<'small'>",
            description: "text-xs de peso médio, para metadado.",
          },
          {
            prop: "Caption",
            type: "ComponentProps<'p'>",
            description: "text-xs secundário — a legenda abaixo de um bloco.",
          },
        ]}
      />
    </>
  )
}
