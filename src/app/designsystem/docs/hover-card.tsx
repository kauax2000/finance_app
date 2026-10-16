"use client"

import * as React from "react"
import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { identityToneFor } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import {
  HoverCard,
  HoverCardArrow,
  HoverCardGroup,
  HoverCardLink,
  HoverCardBody,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const LARGURAS = [
  ["sm", "Um dado só — um saldo, uma data."],
  ["md", "O par identidade + linha de meta. O caso canônico."],
  ["lg", "Quando há um parágrafo. E é o teto."],
] as const

const CODIGO_FATURA = `<HoverCardContent padding="none" size="lg">
  <HoverCardHeader
    endAdornment={<Badge tone="success" size="xs">Aberta</Badge>}
  >
    <HoverCardTitle>Fatura de março</HoverCardTitle>
    <HoverCardDescription>Nubank · •••• 4821</HoverCardDescription>
  </HoverCardHeader>
  <HoverCardBody>
    <DescriptionListItem>
      <DescriptionTerm>Total da fatura</DescriptionTerm>
      <DescriptionDetails>
        <MoneyDisplay value={-1284.6} tone="expense" size="xl" />
      </DescriptionDetails>
    </DescriptionListItem>
    <DescriptionList layout="inline" className="gap-1">
      <DescriptionListItem layout="inline">
        <DescriptionTerm>Fecha</DescriptionTerm>
        <DescriptionDetails className="nums">28/02</DescriptionDetails>
      </DescriptionListItem>
      …
    </DescriptionList>
  </HoverCardBody>
  <HoverCardFooter>
    18 transações
    <HoverCardLink asChild><Link href="/credit-cards">Ver fatura</Link></HoverCardLink>
  </HoverCardFooter>
  <HoverCardArrow />
</HoverCardContent>`

export default function HoverCardDoc() {
  return (
    <>
      <Usage>
        Uma prévia rica ao pousar o cursor. Sempre <strong>redundante</strong> —
        clicar precisa levar à mesma informação, porque no toque ele não existe.
      </Usage>

      <DocSection
        title="Padrão"
        description={
          <>
            O gatilho precisa ser <strong>focável</strong>: o Radix abre no foco
            além do cursor, e é isso que dá ao teclado o mesmo acesso. Em volta
            de um <code>&lt;span&gt;</code> a prévia passa a existir só para quem
            tem mouse.
          </>
        }
        code={`<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">Ana Ribeiro</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <HoverCardHeader media={<Avatar>…</Avatar>}>
      <HoverCardTitle>Ana Ribeiro</HoverCardTitle>
      <HoverCardDescription>Membro desde março · 42 transações</HoverCardDescription>
    </HoverCardHeader>
  </HoverCardContent>
</HoverCard>`}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">Ana Ribeiro</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <HoverCardHeader media={<AvatarDe nome="Ana Ribeiro" />}>
              <HoverCardTitle>Ana Ribeiro</HoverCardTitle>
              <HoverCardDescription>
                Membro desde março · 42 transações
              </HoverCardDescription>
            </HoverCardHeader>
          </HoverCardContent>
        </HoverCard>
      </DocSection>

      <DocSection
        title="No texto: o gatilho pontilhado, a seta e o grupo"
        description={
          <>
            <code>variant=&quot;inline&quot;</code> é o nome dentro de um parágrafo, com sublinhado pontilhado — &ldquo;há mais aqui&rdquo;, sem prometer navegação. A seta se paga só aqui: a prévia dispara sobre <strong>uma palavra entre outras iguais</strong>, e ela diz de qual. Em <code>HoverCardGroup</code>, passar de um nome ao vizinho abre na hora, sem esperar os 400ms de novo.
          </>
        }
        code={`<HoverCardGroup>
  <p>
    … dividida entre{" "}
    <HoverCard>
      <HoverCardTrigger variant="inline">Ana Ribeiro</HoverCardTrigger>
      <HoverCardContent>
        …
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCard>
    , …
  </p>
</HoverCardGroup>`}
        previewClassName="items-stretch"
      >
        <HoverCardGroup>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            A fatura de março foi dividida entre{" "}
            <MembroInline nome="Ana Ribeiro" saldo={-318.4} />,{" "}
            <MembroInline nome="Ana Paula" saldo={-96.2} /> e{" "}
            <MembroInline nome="Anderson Lima" saldo={-197.8} />, e o
            acerto vence no dia 10.
          </p>
        </HoverCardGroup>
      </DocSection>

      <DocSection
        title="A largura"
        description="Três degraus; lg é o teto."
        code={`<HoverCardContent size="lg">…</HoverCardContent>`}
        previewClassName="flex-col items-start gap-4"
      >
        <LarguraDemo />
      </DocSection>

      <DocSection
        title="As três faixas"
        description={
          <>
            <code>padding=&quot;none&quot;</code>, como no <code>PopoverContent</code>: o casco cede o respiro e <strong>cada faixa passa a ser dona do seu</strong>. O estado vai no <code>endAdornment</code>, e o rodapé leva o <code>HoverCardLink</code> — o caminho do clique que toda prévia tem de ter.
          </>
        }
        code={CODIGO_FATURA}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">Fatura de março</Button>
          </HoverCardTrigger>
          <HoverCardContent padding="none" size="lg">
            <HoverCardHeader
              endAdornment={
                <Badge tone="success" size="xs">
                  Aberta
                </Badge>
              }
            >
              <HoverCardTitle>Fatura de março</HoverCardTitle>
              <HoverCardDescription>Nubank · •••• 4821</HoverCardDescription>
            </HoverCardHeader>
            <HoverCardBody>
              {/* O número é o herói do cartão, e por isso leva rótulo: sozinho,
                  −R$ 1.284,60 pode ser o total, o mínimo ou o que falta pagar. */}
              <DescriptionListItem>
                <DescriptionTerm>Total da fatura</DescriptionTerm>
                <DescriptionDetails>
                  <MoneyDisplay value={-1284.6} tone="expense" size="xl" />
                </DescriptionDetails>
              </DescriptionListItem>
              <DescriptionList layout="inline" className="gap-1">
                <DescriptionListItem layout="inline">
                  <DescriptionTerm>Fecha</DescriptionTerm>
                  <DescriptionDetails className="nums">
                    28/02
                  </DescriptionDetails>
                </DescriptionListItem>
                <DescriptionListItem layout="inline">
                  <DescriptionTerm>Vence</DescriptionTerm>
                  <DescriptionDetails className="nums">
                    10/03
                  </DescriptionDetails>
                </DescriptionListItem>
              </DescriptionList>
            </HoverCardBody>
            <HoverCardFooter>
              <span className="text-xs text-muted-foreground">
                18 transações
              </span>
              <HoverCardLink asChild>
                <Link href="/credit-cards">Ver fatura</Link>
              </HoverCardLink>
            </HoverCardFooter>
            <HoverCardArrow />
          </HoverCardContent>
        </HoverCard>
      </DocSection>

      <DocSection
        title="Carrega ao abrir"
        description={
          <>
            A prévia busca o que mostra no <code>onOpenChange</code> — nada carrega antes de alguém pousar —, e <code>pending</code> mostra o <code>HoverCardSkeleton</code> até o dado chegar. Aqui a busca leva um segundo, e a resposta fica guardada.
          </>
        }
        code={`const [dado, setDado] = React.useState<Resumo | null>(null)

<HoverCard onOpenChange={(aberta) => { if (aberta && !dado) buscar().then(setDado) }}>
  <HoverCardTrigger asChild><Button variant="link">Nubank</Button></HoverCardTrigger>
  <HoverCardContent pending={!dado}>
    …
  </HoverCardContent>
</HoverCard>`}
      >
        <CarregaDemo />
      </DocSection>

      <DocNote title="No telefone, o toque longo">
        O Radix ignora o toque, e a prévia não existia no telefone. Agora segurar o gatilho por meio segundo a abre; o toque simples continua sendo do gatilho, e o clique que o soltar dispara é engolido — senão o link levaria embora a prévia no mesmo gesto. Numa linha com <code>ContextMenu</code>, o toque longo no gatilho é da prévia. <code>touch=&#123;false&#125;</code> desliga.
      </DocNote>

      <DocNote title="A prévia brota do gatilho">
        No gesto de toda sobreposição, o do menu da barra de baixo (rodada 287): nasce em elipse na origem do Radix, cresce primeiro na altura, e as faixas surgem do desfoque atrás; ao sair, volta ao gatilho. Até a rodada 286 ela se desvelava, subindo 8px de um desfoque, e dissolvia no lugar.
      </DocNote>

      <PropsTable
        title="Props · HoverCardContent"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "A largura — 224, 256, 320. Acima disso a prévia vira a página que ela deveria adiar.",
          },
          {
            prop: "padding",
            type: '"default" | "none"',
            default: '"default"',
            description:
              "none zera o gap junto, porque as duas coisas andam juntas quando o cartão hospeda faixas.",
          },
          {
            prop: "pending",
            type: "boolean",
            description:
              "O dado está chegando: o HoverCardSkeleton no lugar do conteúdo, e aria-busy.",
          },
          {
            prop: "collisionPadding",
            type: "number",
            default: "ANCHORED_COLLISION_PADDING (8)",
            description:
              "A folga da borda da janela, a mesma de toda superfície ancorada; o cartão também encolhe em janela estreita.",
          },
        ]}
      />

      <PropsTable
        title="Props · as peças"
        rows={[
          {
            prop: "HoverCardHeader media",
            type: "React.ReactNode",
            description:
              "O avatar, o ladrilho ou o ícone antes do par, centrado nas duas linhas.",
          },
          {
            prop: "HoverCardTrigger variant",
            type: '"default" | "inline"',
            default: '"default"',
            description:
              "inline é o nome num parágrafo, sublinhado pontilhado; sem asChild vira um botão nativo, que é focável.",
          },
          {
            prop: "HoverCardLink",
            type: "ComponentProps<typeof Button>",
            description:
              "O caminho do clique no rodapé — link pequeno, encostado à direita; passe o Link por asChild.",
          },
          {
            prop: "HoverCardSkeleton",
            type: "{ media?: boolean; label?: string }",
            description: "O esqueleto da prévia, o que o pending mostra.",
          },
          {
            prop: "HoverCardGroup skipDelay",
            type: "number",
            default: "300",
            description:
              "Enquanto uma prévia do grupo está aberta, e por skipDelay depois, as vizinhas abrem sem atraso.",
          },
          {
            prop: "endAdornment",
            type: "React.ReactNode",
            description:
              "O canto superior direito — Badge de estado, contagem —, preso ao topo mesmo com a descrição em duas linhas.",
          },
        ]}
      />

      <PropsTable
        title="Props · HoverCard"
        rows={[
          {
            prop: "openDelay",
            type: "number",
            default: "400",
            description:
              "Acima de uma pausa intencional e abaixo do ponto em que a espera vira dúvida; os 700 do Radix leem como quebrado.",
          },
          {
            prop: "closeDelay",
            type: "number",
            default: "200",
            description:
              "Dá tempo de o cursor atravessar o vão até o cartão.",
          },
          {
            prop: "touch",
            type: "boolean",
            default: "true",
            description:
              "Segurar o gatilho no toque abre a prévia; o clique do soltar é engolido.",
          },
        ]}
      />

      <DocNote title="Diferença para o Tooltip">
        Tooltip é uma frase e é anunciado por <code>aria-describedby</code>.
        HoverCard é um bloco com estrutura e pode conter links. Se cabe numa
        linha, é tooltip.
      </DocNote>

      <DocNote title="Um número sem rótulo é ambíguo">
        Sozinho, <code>−R$ 1.284,60</code> pode ser o total da fatura, o mínimo ou o que falta pagar. Use o par termo/valor do <code>DescriptionList</code>.
      </DocNote>

      <DocNote title="O rótulo e a cor do estado saem do produto, não da demonstração">
        O ciclo aberto se chama <strong>Aberta</strong> e é <strong>verde</strong> (<code>tagChipSuccess</code>); âmbar é <code>Fechada</code> e vermelho é <code>Anterior</code>. Catálogo que inventa palavra e cor ensina a divergir do produto.
      </DocNote>

      <DocNote title="O corpo não rola, e o botão de fechar não existe">
        Uma prévia que precisa rolar ou se reter não é mais prévia: sai o cursor, sai o cartão. Nesses casos o componente é o <code>Popover</code>, que abre no clique.
      </DocNote>
    </>
  )
}

function AvatarDe({ nome }: { nome: string }) {
  const tom = identityToneFor(null, nome)
  const iniciais = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
  return (
    <Avatar>
      <AvatarFallback className={cn(tom.surface, tom.ink)}>{iniciais}</AvatarFallback>
    </Avatar>
  )
}

function MembroInline({ nome, saldo }: { nome: string; saldo: number }) {
  return (
    <HoverCard>
      <HoverCardTrigger variant="inline">{nome}</HoverCardTrigger>
      <HoverCardContent>
        <HoverCardHeader media={<AvatarDe nome={nome} />}>
          <HoverCardTitle>{nome}</HoverCardTitle>
          <HoverCardDescription>
            Deve <MoneyDisplay value={saldo} tone="expense" size="sm" /> nesta
            fatura
          </HoverCardDescription>
        </HoverCardHeader>
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCard>
  )
}

function LarguraDemo() {
  const [tamanho, setTamanho] = React.useState<"sm" | "md" | "lg">("md")
  const nota = LARGURAS.find(([t]) => t === tamanho)?.[1]
  return (
    <>
      <Controles
        inicio={<Eixo rotulo="size" valores={LARGURAS.map(([t]) => t)} valor={tamanho} onChange={setTamanho} />}
      />
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link">Pouse aqui</Button>
        </HoverCardTrigger>
        <HoverCardContent size={tamanho}>
          <HoverCardHeader>
            <HoverCardTitle>size=&quot;{tamanho}&quot;</HoverCardTitle>
            <HoverCardDescription>{nota}</HoverCardDescription>
          </HoverCardHeader>
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>
    </>
  )
}

type Resumo = { limite: number; usado: number }

function CarregaDemo() {
  const [dado, setDado] = React.useState<Resumo | null>(null)
  const buscandoRef = React.useRef(false)
  return (
    <HoverCard
      onOpenChange={(aberta) => {
        if (!aberta || dado || buscandoRef.current) return
        buscandoRef.current = true
        window.setTimeout(() => setDado({ limite: 8000, usado: 3120.5 }), 1000)
      }}
    >
      <HoverCardTrigger asChild>
        <Button variant="link">Nubank</Button>
      </HoverCardTrigger>
      <HoverCardContent padding="none" pending={!dado}>
        {dado ? (
          <>
            <HoverCardHeader>
              <HoverCardTitle>Nubank</HoverCardTitle>
              <HoverCardDescription>•••• 4821</HoverCardDescription>
            </HoverCardHeader>
            <HoverCardBody>
              <DescriptionListItem>
                <DescriptionTerm>Disponível</DescriptionTerm>
                <DescriptionDetails>
                  <MoneyDisplay value={dado.limite - dado.usado} size="lg" />
                </DescriptionDetails>
              </DescriptionListItem>
            </HoverCardBody>
          </>
        ) : null}
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCard>
  )
}
