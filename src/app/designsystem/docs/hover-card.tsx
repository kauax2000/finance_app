"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  HoverCardBody,
  HoverCardContent,
  HoverCardDescription,
  HoverCardFooter,
  HoverCardHeader,
  HoverCardTitle,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

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
  <HoverCardFooter>18 transações</HoverCardFooter>
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
    <HoverCardHeader>
      <HoverCardTitle>Ana Ribeiro</HoverCardTitle>
      <HoverCardDescription>Membro desde março</HoverCardDescription>
    </HoverCardHeader>
  </HoverCardContent>
</HoverCard>`}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">Ana Ribeiro</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback className="bg-identity-4-surface text-identity-4">
                  AR
                </AvatarFallback>
              </Avatar>
              <HoverCardHeader>
                <HoverCardTitle>Ana Ribeiro</HoverCardTitle>
                <HoverCardDescription>
                  Membro desde março · 42 transações
                </HoverCardDescription>
              </HoverCardHeader>
            </div>
          </HoverCardContent>
        </HoverCard>
      </DocSection>

      <DocSection
        title="A seta"
        description={
          <>
            Este é o único lugar do sistema onde ela se paga. Um menu abre a
            partir de um controle que a pessoa acabou de clicar; uma prévia
            dispara sobre <strong>uma palavra dentro de um parágrafo</strong>, e
            aí a seta é a única coisa que diz de qual das quatro o cartão está
            falando.
          </>
        }
        code={`<HoverCardContent>
  …
  <HoverCardArrow />
</HoverCardContent>`}
        previewClassName="items-stretch"
      >
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          A fatura de março foi dividida entre{" "}
          <MembroInline nome="Ana Ribeiro" iniciais="AR" saldo={-318.4} />,{" "}
          <MembroInline nome="Ana Paula" iniciais="AP" saldo={-96.2} /> e{" "}
          <MembroInline nome="Anderson Lima" iniciais="AL" saldo={-197.8} />, e o
          acerto vence no dia 10.
        </p>
      </DocSection>

      <DocSection
        title="A largura"
        description={
          <>
            Três degraus, e eles saem de contagem: o componente nascia{" "}
            <code>w-64</code> e a única demonstração que existia dele já o
            sobrescrevia para <code>w-72</code>. Um padrão que o seu único
            consumidor anula não é padrão.
          </>
        }
        code={`<HoverCardContent size="lg">…</HoverCardContent>`}
      >
        {LARGURAS.map(([tamanho, nota]) => (
          <HoverCard key={tamanho}>
            <HoverCardTrigger asChild>
              {/* Um `<span>` em vez de texto cru: a maiúscula inicial do CTA é
                  do `Button`, e aqui o rótulo é um identificador — `sm`, e não
                  `Sm`. É a saída que o próprio sistema documenta. */}
              <Button variant="tertiary">
                <span className="font-mono">{tamanho}</span>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent size={tamanho}>
              <HoverCardHeader>
                <HoverCardTitle>size=&quot;{tamanho}&quot;</HoverCardTitle>
                <HoverCardDescription>{nota}</HoverCardDescription>
              </HoverCardHeader>
              <HoverCardArrow />
            </HoverCardContent>
          </HoverCard>
        ))}
      </DocSection>

      <DocSection
        title="As três faixas"
        description={
          <>
            <code>padding=&quot;none&quot;</code> é o mesmo eixo, com o mesmo
            nome e a mesma razão do <code>PopoverContent</code>: o casco cede o
            respiro, e <strong>cada faixa passa a ser dona do seu</strong>.
            Cabeçalho, corpo e pé — com o estado no <code>endAdornment</code>, no
            canto superior direito.
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
            </HoverCardFooter>
            <HoverCardArrow />
          </HoverCardContent>
        </HoverCard>
      </DocSection>

      <PropsTable
        title="Props · HoverCardContent"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description:
              "A largura — 224, 256, 320. Acima de 320 a prévia deixa de ser prévia e vira a página que ela deveria adiar.",
          },
          {
            prop: "padding",
            type: '"default" | "none"',
            default: '"default"',
            description:
              "none zera o gap junto, porque as duas coisas andam juntas quando o cartão hospeda faixas.",
          },
          {
            prop: "collisionPadding",
            type: "number",
            default: "ANCHORED_COLLISION_PADDING (8)",
            description:
              "A folga da borda da janela, vinda de lib/anchored-surface — a mesma de toda superfície ancorada. O cartão também encolhe pelo max-w-…-available-width quando a janela é mais estreita que o size escolhido.",
          },
        ]}
      />

      <PropsTable
        title="Props · HoverCardHeader"
        rows={[
          {
            prop: "endAdornment",
            type: "React.ReactNode",
            description:
              "O que fica no canto superior direito: Badge de estado, contagem, ícone. A grade é items-start, então ele fica preso ao topo mesmo quando a descrição quebra em duas linhas.",
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
              "Acima do limiar de pausa intencional (~300ms) e abaixo do ponto em que a espera vira dúvida. O padrão do Radix é 700, que lê como componente quebrado.",
          },
          {
            prop: "closeDelay",
            type: "number",
            default: "200",
            description:
              "O que dá tempo de o cursor atravessar o vão entre o gatilho e o cartão.",
          },
        ]}
      />

      <DocNote title="Diferença para o Tooltip">
        Tooltip é uma frase e é anunciado por <code>aria-describedby</code>.
        HoverCard é um bloco com estrutura e pode conter links. Se cabe numa
        linha, é tooltip.
      </DocNote>

      <DocNote title="Um número sem rótulo é ambíguo, e num app de finanças isso custa caro">
        Esta demonstração já mostrou <code>−R$ 1.284,60</code> sozinho no meio do
        cartão. Sozinho, ele pode ser o total da fatura, o pagamento mínimo ou o
        que falta pagar — três coisas diferentes, e quem lê não tem como
        escolher. O par termo/valor do <code>DescriptionList</code> é o que
        resolve, e ele existe para exatamente isto: a documentação dele nomeia
        &ldquo;a fatura&rdquo; como caso de uso.
      </DocNote>

      <DocNote title="O rótulo e a cor do estado saem do produto, não da demonstração">
        Esta página já escreveu <code>Em aberto</code> num{" "}
        <code>Badge variant=&quot;warning&quot;</code>. O app não fala assim: em{" "}
        <code>credit-card-display.ts</code> o ciclo aberto se chama{" "}
        <strong>Aberta</strong> e é <strong>verde</strong> (
        <code>tagChipSuccess</code>), com o âmbar reservado para{" "}
        <code>Fechada</code> e o vermelho para <code>Anterior</code>. Um catálogo
        que inventa vocabulário e semântica próprios ensina a divergir do
        produto.
      </DocNote>

      <DocNote title="A superfície era uma cópia incompleta da do popover">
        Copiar não era o defeito — as classes que carregam o nome da primitiva (
        <code>origin-</code>, <code>max-h-</code>) <strong>têm</strong> que ser
        literais em cada arquivo, porque o Tailwind varre o código como texto. O
        defeito é que faltavam três coisas: o teto de altura, a rolagem que ele
        exige, e a folga da borda da janela. Uma prévia alta perto da borda de
        baixo simplesmente saía da tela, com o Radix já publicando a variável que
        ninguém lia.
      </DocNote>

      <DocNote title="O corpo não rola, e o botão de fechar não existe">
        As duas coisas dizem o mesmo sobre este componente.{" "}
        <code>HoverCardBody</code> não rola porque uma prévia que precisa rolar
        não é mais uma prévia; e não há <code>Close</code> porque um hover card
        não se retém — sai o cursor, sai o cartão. Nos dois casos o componente
        certo passa a ser o <code>Popover</code>, que abre no clique.
      </DocNote>
    </>
  )
}

function MembroInline({
  nome,
  iniciais,
  saldo,
}: {
  nome: string
  iniciais: string
  saldo: number
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="h-auto p-0 align-baseline">
          {nome}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback className="bg-identity-2-surface text-identity-2">
              {iniciais}
            </AvatarFallback>
          </Avatar>
          <HoverCardHeader>
            <HoverCardTitle>{nome}</HoverCardTitle>
            <HoverCardDescription>
              Deve <MoneyDisplay value={saldo} tone="expense" size="sm" /> nesta
              fatura
            </HoverCardDescription>
          </HoverCardHeader>
        </div>
        <HoverCardArrow />
      </HoverCardContent>
    </HoverCard>
  )
}
