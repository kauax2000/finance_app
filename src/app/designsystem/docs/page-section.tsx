"use client"

import * as React from "react"
import {
  ArrowPathIcon,
  EnvelopeIcon,
  CreditCardIcon,
  UserPlusIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  PageSection,
  PageSectionDescription,
  PageSectionFooter,
  PageSectionHeader,
  PageSectionLink,
  PageSectionMeta,
  PageSectionSkeleton,
  PageSectionTitle,
} from "@/components/ui/page-section"
import { TopBar, TopBarTitle } from "@/components/ui/top-bar"
import { IphoneFrame } from "../ds-frame"
import { DocNote, DocSection, Eixo, Interruptor, PropsTable, Usage } from "../ds-doc"



const FATURAS = [
  ["Nubank Ultravioleta", "Fecha em 3 dias", -1284.6],
  ["Itaú Personnalité", "Fecha em 12 dias", -642.18],
  ["Inter Gold", "Paga em 02/03", -318.9],
] as const

/** O conteúdo de verdade de uma seção do painel: um cartão com a lista. */
function Lista({ linhas = FATURAS }: { linhas?: readonly (readonly [string, string, number | null])[] }) {
  return (
    <Card padding="none">
      <ItemGroup variant="divided">
        {linhas.map(([nome, legenda, valor]) => (
          <Item key={nome} variant="flush">
            <ItemContent>
              <ItemTitle>{nome}</ItemTitle>
              <ItemDescription className="text-xs">{legenda}</ItemDescription>
            </ItemContent>
            {valor != null ? (
              <MoneyDisplay value={valor} signed tone="expense" className="text-sm" />
            ) : null}
          </Item>
        ))}
      </ItemGroup>
    </Card>
  )
}

const ACAO = ["nenhuma", "link", "botão", "meta"] as const

function Acao({ qual }: { qual: (typeof ACAO)[number] }) {
  if (qual === "link") return <PageSectionLink href="#">ver todas</PageSectionLink>
  if (qual === "botão")
    return (
      <Button variant="tertiary">
        <ArrowPathIcon aria-hidden />
        atualizar
      </Button>
    )
  if (qual === "meta") return <PageSectionMeta>Atualizado há 2 min</PageSectionMeta>
  return null
}

function DemoNaTela() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg">("md")
  const [variant, setVariant] = React.useState<"plain" | "ruled">("plain")
  const [acao, setAcao] = React.useState<(typeof ACAO)[number]>("link")
  const [descricao, setDescricao] = React.useState(true)
  const [icone, setIcone] = React.useState(false)
  const [contagem, setContagem] = React.useState(true)
  const [rodape, setRodape] = React.useState(false)
  const [recolher, setRecolher] = React.useState(false)
  const [cascata, setCascata] = React.useState(true)
  const [vez, setVez] = React.useState(0)
  // Trocar um eixo remonta a seção, para a cascata tocar de novo.
  const chave = [size, variant, acao, descricao, icone, contagem, rodape, recolher, cascata, vez].join()

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Eixo rotulo="size" valores={["sm", "md", "lg"] as const} valor={size} onChange={setSize} />
        <Eixo rotulo="variant" valores={["plain", "ruled"] as const} valor={variant} onChange={setVariant} />
        <Eixo rotulo="ação" valores={ACAO} valor={acao} onChange={setAcao} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Interruptor id="ps-descricao" rotulo="descrição" valor={descricao} onChange={setDescricao} />
        <Interruptor id="ps-icone" rotulo="ícone" valor={icone} onChange={setIcone} />
        <Interruptor id="ps-contagem" rotulo="contagem" valor={contagem} onChange={setContagem} />
        <Interruptor id="ps-rodape" rotulo="rodapé" valor={rodape} onChange={setRodape} />
        <Interruptor id="ps-recolher" rotulo="recolher" valor={recolher} onChange={setRecolher} />
        <Interruptor id="ps-cascata" rotulo="cascata" valor={cascata} onChange={setCascata} />
        {cascata ? (
          <Button variant="tertiary" size="sm" onClick={() => setVez((v) => v + 1)}>
            <ArrowPathIcon aria-hidden />
            tocar de novo
          </Button>
        ) : null}
      </div>

      <PageSection
        key={chave}
        size={size}
        variant={variant}
        reveal={cascata}
        collapsible={recolher}
        className="w-full"
      >
        <PageSectionHeader actions={acao === "nenhuma" ? undefined : <Acao qual={acao} />}>
          <PageSectionTitle
            icon={icone ? <CreditCardIcon /> : undefined}
            count={contagem ? FATURAS.length : undefined}
          >
            Faturas do mês
          </PageSectionTitle>
          {descricao ? (
            <PageSectionDescription>
              As abertas e as que fecham nos próximos dias, da mais próxima à mais distante.
            </PageSectionDescription>
          ) : null}
        </PageSectionHeader>
        <Lista />
        {rodape ? (
          <PageSectionFooter>
            <span>Valores da fatura aberta, ainda sem os lançamentos de hoje.</span>
            <Button variant="tertiary">mostrar pagas</Button>
          </PageSectionFooter>
        ) : null}
      </PageSection>
    </div>
  )
}

const CONVITES = [
  ["ana@exemplo.com", "Enviado há 2 dias", null],
  ["bruno@exemplo.com", "Enviado há 5 dias", null],
] as const

/**
 * O telefone: a ação de ícone fica quadrada com o rótulo como nome, e o
 * cabeçalho prende sob a barra do topo enquanto a seção rola.
 */
function DemoTelefone() {
  return (
    <IphoneFrame title="Seções num iPhone">
      <div className="h-full overflow-y-auto bg-background">
        <TopBar position="sticky" surface="scroll">
          <TopBarTitle>Início</TopBarTitle>
        </TopBar>
        <Container stack="section" className="px-4 pt-4 pb-10 [--page-section-bleed:--spacing(4)]">
          <PageSection sticky>
            <PageSectionHeader actions={<PageSectionLink href="#">ver todas</PageSectionLink>}>
              <PageSectionTitle count={FATURAS.length * 3}>Faturas do mês</PageSectionTitle>
            </PageSectionHeader>
            <Lista linhas={[...FATURAS, ...FATURAS, ...FATURAS].map(([n, l, v], i) => [`${n} ${i + 1}`, l, v] as const)} />
          </PageSection>
          <PageSection sticky>
            <PageSectionHeader
              actions={
                <Button variant="tertiary">
                  <UserPlusIcon aria-hidden />
                  convidar
                </Button>
              }
            >
              <PageSectionTitle icon={<EnvelopeIcon />}>Convites pendentes</PageSectionTitle>
              <PageSectionDescription>Expiram em sete dias.</PageSectionDescription>
            </PageSectionHeader>
            <Lista linhas={CONVITES} />
          </PageSection>
        </Container>
      </div>
    </IphoneFrame>
  )
}

export default function PageSectionDoc() {
  return (
    <>
      <Usage>
        O bloco que dá ritmo vertical a uma tela: uma pilha de <code>PageSection</code> dentro de um <code>Container</code>, sem nenhum filho declarando margem própria. Cada seção é uma região com o nome do título, e uma seção dentro de outra desce o título um nível sozinha.
      </Usage>

      <DocSection
        title="Na tela"
        description="O cabeçalho é uma grade: o título e a ação dividem a primeira linha, e a descrição desce para a segunda. A ação desce ao degrau sm sozinha, e a contagem entra no nome do título."
        code={`<PageSection reveal>
  <PageSectionHeader actions={<PageSectionLink href="/credit-cards">Ver todas</PageSectionLink>}>
    <PageSectionTitle icon={<CreditCardIcon />} count={3}>Faturas do mês</PageSectionTitle>
    <PageSectionDescription>As abertas e as que fecham nos próximos dias.</PageSectionDescription>
  </PageSectionHeader>
  <Card padding="none">…</Card>
  <PageSectionFooter>…</PageSectionFooter>
</PageSection>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="A ação se centra na linha do título, e a altura dela entra na conta">
        O cabeçalho é uma grade de duas colunas: o título e a ação dividem a primeira linha, que mede o maior dos dois, e a descrição desce para a segunda. Com <code>items-center</code> no bloco todo, uma descrição de duas linhas desceria o botão para o meio do parágrafo; com uma caixa da altura do título, um botão de 32px vazaria 4px para cima e para baixo.
      </DocNote>

      <DocNote title="Os botões da ação não declaram size">
        <code>actions</code> e o <code>PageSectionFooter</code> passam o degrau <code>sm</code> aos botões, e no dedo eles sobem a 40. Um <code>size</code> no botão vence. O &ldquo;Ver todas&rdquo; é o <code>PageSectionLink</code>, com a seta que anda no cursor; o texto miúdo ao lado é o <code>PageSectionMeta</code>.
      </DocNote>

      <DocSection
        title="No telefone"
        description="A ação com ícone fica quadrada e o rótulo vira o nome dela; o título quebra sem empurrar a ação. Com sticky, o cabeçalho prende sob a barra do topo enquanto a seção rola, ganha a placa de barra e solta quando a seção acaba. Role a tela do iPhone."
        code={`<PageSection sticky>
  <PageSectionHeader actions={<Button><UserPlusIcon />Convidar</Button>}>…</PageSectionHeader>
  …
</PageSection>`}
        previewClassName="justify-center"
      >
        <DemoTelefone />
      </DocSection>

      <DocNote title="A placa sangra até a calha">
        Presa, a placa atravessa <code>--page-section-bleed</code> de cada lado — a calha da página, que é de quem monta a tela (16px no telefone do app). É a placa da <code>Toolbar sticky</code>, pela mesma medição: ela sobra 8px acima e abaixo, e o cabeçalho não muda de altura ao prender.
      </DocNote>

      <DocSection
        title="Seção dentro de seção"
        description="A de dentro rende o título como h3 sozinha, e cada uma é uma região com o nome do próprio título — o leitor de tela lista Orçamentos e Alimentação nos marcos da página."
        code={`<PageSection>
  <PageSectionHeader><PageSectionTitle>Orçamentos</PageSectionTitle></PageSectionHeader>
  <PageSection size="sm">
    <PageSectionHeader><PageSectionTitle>Alimentação</PageSectionTitle></PageSectionHeader>  {/* h3 */}
    …
  </PageSection>
</PageSection>`}
        previewClassName="items-stretch"
      >
        <PageSection className="w-full">
          <PageSectionHeader>
            <PageSectionTitle>Orçamentos</PageSectionTitle>
            <PageSectionDescription>Quanto de cada categoria já foi usado neste mês.</PageSectionDescription>
          </PageSectionHeader>
          <PageSection size="sm">
            <PageSectionHeader actions={<PageSectionMeta>Limite R$ 1.500,00</PageSectionMeta>}>
              <PageSectionTitle>Alimentação</PageSectionTitle>
            </PageSectionHeader>
            <Lista linhas={FATURAS.slice(0, 2)} />
          </PageSection>
        </PageSection>
      </DocSection>

      <DocNote title="O nível é da profundidade, e asChild é para o caso raro">
        <code>PageSectionTitle</code> é <code>&lt;h2&gt;</code> na seção de fora e desce um nível a cada seção aninhada, até <code>&lt;h6&gt;</code>; o estilo nunca muda com o nível. Quem usa leitor de tela navega pela hierarquia, e pular do h1 para um h3 deixa um degrau vazio. <code>asChild</code> continua para quem precisa do próprio elemento, e o <code>id</code> dele passa a nomear a região.
      </DocNote>

      <DocSection
        title="O ritmo da tela"
        description="16px dentro da seção, 32px entre seções no Container. Duas escalas é o que faz a tela ter blocos em vez de uma lista contínua."
        code={`<Container stack="section">
  <PageHeader>…</PageHeader>
  <PageSection>…</PageSection>
  <PageSection>…</PageSection>
</Container>`}
        previewClassName="block p-0"
      >
        <Container stack="section" className="px-4 py-6">
          {["Faturas do mês", "Compras parceladas"].map((nome) => (
            <PageSection key={nome}>
              <PageSectionHeader actions={<PageSectionLink href="#">ver todas</PageSectionLink>}>
                <PageSectionTitle>{nome}</PageSectionTitle>
              </PageSectionHeader>
              <Lista linhas={FATURAS.slice(0, 2)} />
            </PageSection>
          ))}
        </Container>
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="PageSectionSkeleton: o título na linha dele, a descrição e a ação se houver, e o bloco do conteúdo — ou o esqueleto que você passar. Dentro de um esqueleto de página, group={false}."
        code={`<PageSectionSkeleton description actions />
<PageSectionSkeleton group={false}>…</PageSectionSkeleton>`}
        previewClassName="items-stretch"
      >
        <PageSectionSkeleton description actions className="w-full" />
      </DocSection>

      <DocNote title="Não há peça de conteúdo, e a seção traz min-w-0">
        O conteúdo vai direto como filho da seção. O <code>min-w-0</code> mora na <code>PageSection</code> porque, usada como item de uma linha de flex, ela estouraria para o min-content e levaria a rolagem interna junto.
      </DocNote>

      <PropsTable
        title="Eixos de PageSection"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "O corpo do título e o respiro interno, juntos. Publica --page-section-title e --page-section-title-line.",
          },
          {
            prop: "variant",
            type: '"plain" | "ruled"',
            default: '"plain"',
            description: "A régua em cima, com o respiro que vem junto.",
          },
          {
            prop: "reveal",
            type: "boolean",
            default: "false",
            description: "O título, a ação e o conteúdo sobem em cascata ao montar.",
          },
          {
            prop: "collapsible",
            type: "boolean",
            default: "false",
            description: "O título vira o gatilho com a seta, e o que vem depois do cabeçalho — o primeiro filho — recolhe na mola. defaultOpen, open e onOpenChange como no Collapsible.",
          },
          {
            prop: "storageKey",
            type: "string",
            description: "Guarda o aberto/fechado da seção recolhível no localStorage.",
          },
          {
            prop: "sticky",
            type: "boolean",
            default: "false",
            description: "O cabeçalho prende sob a barra do topo enquanto a seção rola. A placa sangra até --page-section-bleed.",
          },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          {
            prop: "PageSection",
            type: "ComponentProps<'section'>",
            description: "O bloco: uma região nomeada pelo título, que empilha os filhos com o gap do degrau.",
          },
          {
            prop: "PageSectionHeader",
            type: "{ actions?: ReactNode }",
            description: "Título, descrição e a ação da seção, na linha do título. Os botões da ação descem a sm.",
          },
          {
            prop: "PageSectionTitle",
            type: "ComponentProps<'h2'> & { icon?, count?, asChild? }",
            description: "O nome da seção, no nível da profundidade. icon antes, count depois, no nome acessível.",
          },
          {
            prop: "PageSectionDescription",
            type: "ComponentProps<'p'>",
            description: "O que ela mostra, colada no título.",
          },
          {
            prop: "PageSectionLink",
            type: "ComponentProps<typeof Link>",
            description: "O “Ver todas” da seção, com a seta.",
          },
          {
            prop: "PageSectionMeta",
            type: "ComponentProps<'p'>",
            description: "O texto miúdo ao lado da ação: o limite, a hora da atualização.",
          },
          {
            prop: "PageSectionFooter",
            type: "ComponentProps<'div'>",
            description: "A nota ou o “Mostrar mais” embaixo do conteúdo.",
          },
          {
            prop: "PageSectionSkeleton",
            type: "{ size?, description?, actions?, group?, children? }",
            description: "O esqueleto da seção, no SkeletonGroup.",
          },
        ]}
      />
    </>
  )
}
