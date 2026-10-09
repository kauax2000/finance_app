"use client"

import * as React from "react"

import {
  AvatarGroup,
  AvatarGroupAdd,
  AvatarGroupItem,
  AvatarGroupSkeleton,
  type AvatarGroupItemProps,
} from "@/components/ui/avatar-group"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Caption } from "@/components/ui/typography"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

const FOTO = (n: number) => `https://i.pravatar.cc/112?img=${n}`

/** A carteira "Casa": a dona, cinco membros e dois convites em aberto. */
const PESSOAS: AvatarGroupItemProps[] = [
  { name: "Ana Ribeiro", src: FOTO(47), description: "ana.ribeiro@gmail.com", status: "info", statusLabel: "Dona da carteira" },
  { name: "Bruno Lima", description: "bruno.lima@outlook.com" },
  { name: "Carla Mendes", src: FOTO(45), description: "carla.mendes@gmail.com" },
  { name: "Diego Souza", description: "diego.souza@icloud.com", status: "warning", statusLabel: "Convite pendente" },
  { name: "Elisa Prado", src: FOTO(32), description: "elisa.prado@gmail.com" },
  { name: "Fábio Nunes", description: "fabio.nunes@gmail.com" },
  { name: "Gabriela Torres", description: "gabi.torres@hotmail.com", status: "warning", statusLabel: "Convite pendente" },
]

const TAMANHOS = ["xs", "sm", "md", "lg", "xl"] as const
const EMPILHAR = ["first", "last"] as const
const DICAS = ["contrast", "plate"] as const
const TINTAS = ["vivid", "soft"] as const

function DemoNaTela() {
  const [size, setSize] = React.useState<(typeof TAMANHOS)[number]>("md")
  const [stacking, setStacking] = React.useState<(typeof EMPILHAR)[number]>("first")
  const [tooltip, setTooltip] = React.useState<(typeof DICAS)[number]>("contrast")
  const [tint, setTint] = React.useState<(typeof TINTAS)[number]>("vivid")
  const [leque, setLeque] = React.useState(true)
  const [mais, setMais] = React.useState(true)
  const [convidar, setConvidar] = React.useState(true)
  const [resumo, setResumo] = React.useState(false)
  const [selo, setSelo] = React.useState(true)
  const [clicavel, setClicavel] = React.useState(false)
  const [acao, setAcao] = React.useState<string | null>(null)

  return (
    <div className="flex w-full flex-col gap-3">
      <Controles
        empilhar
        inicio={
          <>
            <Eixo rotulo="size" valores={TAMANHOS} valor={size} onChange={setSize} />
            <Eixo rotulo="stacking" valores={EMPILHAR} valor={stacking} onChange={setStacking} />
            <Eixo rotulo="tooltip" valores={DICAS} valor={tooltip} onChange={setTooltip} />
            <Eixo rotulo="tint" valores={TINTAS} valor={tint} onChange={setTint} />
          </>
        }
        fim={
          <Interruptores>
            <Interruptor id="ag-leque" rotulo="spread" valor={leque} onChange={setLeque} />
            <Interruptor id="ag-max" rotulo="max" valor={mais} onChange={setMais} />
            <Interruptor id="ag-add" rotulo="AvatarGroupAdd" valor={convidar} onChange={setConvidar} />
            <Interruptor id="ag-resumo" rotulo="summary" valor={resumo} onChange={setResumo} />
            <Interruptor id="ag-selo" rotulo="status" valor={selo} onChange={setSelo} />
            <Interruptor id="ag-clicavel" rotulo="onSelect" valor={clicavel} onChange={setClicavel} />
          </Interruptores>
        }
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Casa</CardTitle>
          <CardDescription>As contas do apartamento, divididas entre 7 pessoas.</CardDescription>
          <CardAction>
            <AvatarGroup
              label="Membros da carteira Casa"
              size={size}
              stacking={stacking}
              tooltip={tooltip}
              tint={tint}
              spread={leque}
              max={mais ? 4 : undefined}
              summary={resumo}
              add={convidar ? <AvatarGroupAdd label="Convidar pessoa" onClick={() => setAcao("Convidar pessoa")} /> : undefined}
            >
              {PESSOAS.map((p) => (
                <AvatarGroupItem
                  key={p.name}
                  {...(selo ? p : { ...p, status: undefined, statusLabel: undefined })}
                  onSelect={clicavel ? () => setAcao(`Abrir o perfil de ${p.name}`) : undefined}
                />
              ))}
            </AvatarGroup>
          </CardAction>
        </CardHeader>
      </Card>
      <Caption aria-live="polite">{acao ?? "Passe o cursor, use as setas ou toque num rosto."}</Caption>
    </div>
  )
}

function NoTelefone() {
  return (
    <IphoneFrame title="A pilha num iPhone">
      <div className="flex h-full flex-col gap-4 px-4 pt-16">
        <Card>
          <CardHeader>
            <CardTitle>Casa</CardTitle>
            <CardDescription>7 pessoas</CardDescription>
          </CardHeader>
          <div className="px-(--card-px) pb-(--card-px)">
            <AvatarGroup label="Membros da carteira Casa" size="sm" max={4} spread summary>
              {PESSOAS.map((p) => (
                <AvatarGroupItem key={p.name} {...p} />
              ))}
            </AvatarGroup>
          </div>
        </Card>
      </div>
    </IphoneFrame>
  )
}

function Superficies() {
  const pilha = (
    <AvatarGroup label="Membros da carteira Casa" size="md" max={4}>
      {PESSOAS.map((p) => (
        <AvatarGroupItem key={p.name} name={p.name} src={p.src} />
      ))}
    </AvatarGroup>
  )
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Card className="items-start">
        <div className="flex flex-col items-start gap-2 px-(--card-px)">
          {pilha}
          <Caption>Num cartão: --card, sozinho</Caption>
        </div>
      </Card>
      <div className="flex flex-col items-start gap-2 rounded-surface bg-muted p-4 [--avatar-group-ring:var(--color-muted)]">
        {pilha}
        <Caption>Noutra superfície: ela declara --avatar-group-ring</Caption>
      </div>
    </div>
  )
}

export default function AvatarGroupDoc() {
  return (
    <>
      <Usage>
        Várias pessoas num espaço de uma linha: quem está numa carteira, quem dividiu uma conta, quem recebeu um convite. O nome de cada uma aparece ao pousar o cursor, ao focar ou ao tocar, e o +N abre a lista inteira. Uma pessoa só é o <code>Avatar</code>; uma lista em que o nome importa tanto quanto o rosto é o <code>Item</code>. Nenhuma tela do app usa a pilha ainda.
      </Usage>

      <DocSection
        title="Na tela"
        description="Passe o cursor pela pilha: o rosto sobe na mola e a dica — uma só — viaja até ele. Com spread a pilha se abre quando o ponteiro chega; com max, o resto vira +N, e o +N abre a lista. A pilha é uma parada de Tab: as setas andam entre os rostos."
        code={`<AvatarGroup label="Membros da carteira Casa" max={4} spread
  add={<AvatarGroupAdd label="Convidar pessoa" onClick={convidar} />}>
  {membros.map((m) => (
    <AvatarGroupItem key={m.id} name={m.nome} src={m.foto} color={m.avatar_color}
      description={m.email} />
  ))}
</AvatarGroup>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="Uma dica só, e ela viaja">
        A referência (o Avatar Group do Animate UI) tem uma dica por grupo, que desliza de um rosto ao outro em vez de fechar e abrir — a mola dela é 300/35, e a subida do rosto é 300/17, com quique. Os números são os dela. A dica não é um <code>Tooltip</code> do Radix, porque a âncora de um <code>Tooltip</code> é o próprio gatilho e não se troca; ela veste a mesma pílula (<code>tooltipContentVariants</code>), e é <code>aria-hidden</code>: o nome já é o nome acessível do rosto. Ela fecha no Esc, ao rolar e no toque fora, e desce para baixo do rosto quando não cabe em cima.
      </DocNote>

      <DocNote title="O rosto aceso vem para a frente">
        Na referência o rosto erguido continua atrás do vizinho que o cobria. Aqui ele passa à frente enquanto está aceso, e volta à camada dele ao sair — com <code>stacking=&quot;first&quot;</code> o primeiro fica por cima (a leitura da esquerda), com <code>&quot;last&quot;</code> o último.
      </DocNote>

      <DocNote title="A escada é a do Avatar">
        xs 24 · sm 32 · md 40 · lg 48 · xl 56, e a sobreposição é um quarto do diâmetro em cada degrau (6 a 14px), a proporção da referência (12 em 48). O anel é 2px até o <code>md</code> e 3 acima. O selo é um quarto do rosto, com o mesmo anel. No dedo a altura do alvo vai a 44; a largura é a fatia à vista, e é por isso que o leque existe.
      </DocNote>

      <DocSection
        title="O anel e a superfície"
        description="O anel que separa um rosto do vizinho tem a cor de onde a pilha pousa: --background na página, --card dentro de um Card e --popover num Popover, sozinho. Outra superfície declara --avatar-group-ring, e a declaração dela vence a automática."
        code={`<div className="bg-muted [--avatar-group-ring:var(--color-muted)]">
  <AvatarGroup label="Membros" max={4}>…</AvatarGroup>
</div>`}
        previewClassName="items-stretch"
      >
        <Superficies />
      </DocSection>

      <DocSection
        title="No telefone"
        description="Sem cursor, tocar num rosto o ergue e mostra o nome, e tocar de novo, ou fora, o baixa. Um rosto com onSelect ou href age em vez de alternar. O +N abre a lista na gaveta."
      >
        <NoTelefone />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="A pilha esperando: os círculos na escada e na sobreposição do grupo, com o mesmo anel. group={false} dentro de um esqueleto de página."
        code={`<AvatarGroupSkeleton count={4} size="md" summary />`}
      >
        <AvatarGroupSkeleton count={4} size="md" summary />
      </DocSection>

      <PropsTable
        title="Props de AvatarGroup"
        rows={[
          { prop: "label", type: "string", description: "O nome do grupo para o leitor de tela e o título da lista do +N. Obrigatório." },
          { prop: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "O degrau do Avatar: 24 · 32 · 40 · 48 · 56." },
          { prop: "max", type: "number", description: "Quantos rostos aparecem; o resto vira o +N, que abre a lista inteira (Popover; gaveta no telefone)." },
          { prop: "spread", type: "boolean", default: "false", description: "O leque: a pilha se abre quando o ponteiro, o foco ou o toque chegam." },
          { prop: "stacking", type: '"first" | "last"', default: '"first"', description: "Quem fica por cima. O rosto aceso passa à frente nos dois." },
          { prop: "tooltip", type: '"contrast" | "plate"', default: '"contrast"', description: "A pílula da dica: a grave da referência ou a placa flutuante." },
          { prop: "tint", type: '"vivid" | "soft"', default: '"vivid"', description: "A versão das iniciais, como no AvatarFallback." },
          { prop: "summary", type: "boolean | ReactNode", description: "O texto ao lado. true escreve “Ana, Bruno e mais 5”, e ele descreve o grupo para o leitor de tela." },
          { prop: "add", type: "ReactElement<AvatarGroupAdd>", description: "O + de convidar, no fim da pilha." },
        ]}
      />

      <PropsTable
        title="Props de AvatarGroupItem"
        rows={[
          { prop: "name", type: "string", description: "As iniciais, a cor (sem color), a dica e o nome acessível." },
          { prop: "src", type: "string | null", description: "A foto. Sem ela, as iniciais na cor de identidade." },
          { prop: "color", type: "string | null", description: "O profiles.avatar_color gravado, lido por identityToneFor." },
          { prop: "description", type: "ReactNode", description: "A segunda linha na lista do +N: o e-mail, o papel." },
          { prop: "status · statusLabel", type: '"success" | "warning" | "info" | "destructive" | "neutral" · string', description: "O selo no canto. O rótulo é obrigatório com ele: entra no nome, na dica e vira o Badge da lista." },
          { prop: "href · onSelect", type: "string · () => void", description: "O rosto vira link ou botão, na pilha e na lista." },
        ]}
      />

      <PropsTable
        title="Props de AvatarGroupAdd e AvatarGroupSkeleton"
        rows={[
          { prop: "label", type: "string", description: "AvatarGroupAdd: o nome do +, na dica e para o leitor de tela. Obrigatório." },
          { prop: "onClick · href", type: "() => void · string", description: "AvatarGroupAdd: o que convidar faz." },
          { prop: "count", type: "number", default: "4", description: "AvatarGroupSkeleton: quantos círculos." },
          { prop: "size · summary · group", type: "Tamanho · boolean · boolean", default: '"md" · false · true', description: "AvatarGroupSkeleton: o degrau, a linha do resumo e o SkeletonGroup em volta." },
        ]}
      />
    </>
  )
}
