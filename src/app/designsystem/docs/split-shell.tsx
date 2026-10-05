"use client"

import * as React from "react"
import { AppWordmark } from "@/components/layout/app-wordmark"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { FormInput } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  SplitShell,
  SplitShellAside,
  SplitShellBack,
  SplitShellFooter,
  SplitShellSkeleton,
} from "@/components/ui/split-shell"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { IphoneFrame, ViewportFrame } from "../ds-frame"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

function Eixo<T extends string>({
  rotulo,
  valores,
  valor,
  onChange,
}: {
  rotulo: string
  valores: readonly T[]
  valor: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground">{rotulo}</span>
      <ToggleGroup
        type="single"
        variant="segmented"
        size="sm"
        value={valor}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={rotulo}
      >
        {valores.map((v) => (
          <ToggleGroupItem key={v} value={v} className="font-mono">
            {v}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function Interruptor({
  id,
  rotulo,
  valor,
  onChange,
}: {
  id: string
  rotulo: string
  valor: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} size="sm" checked={valor} onCheckedChange={onChange} />
      <Label htmlFor={id} className="font-mono text-xs font-normal">
        {rotulo}
      </Label>
    </div>
  )
}

/**
 * O campo de exemplo. No app quem entra aqui é o `AuthBrandPanel`; o texto que
 * se lê mora num `Card`, nunca direto sobre o arco-íris — só a marca.
 */
function Campo({ surface }: { surface: "brand" | "muted" }) {
  return (
    <SplitShellAside
      surface={surface}
      brand={<AppWordmark size="lg" rainbow={surface === "muted"} />}
      logo={<AppWordmark size="lg" rainbow />}
    >
      <Card padding="sm" className="max-w-sm">
        <CardContent>
          <DescriptionList>
            <DescriptionListItem>
              <DescriptionTerm>Saldo</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={4182.6} />
              </DescriptionDetails>
            </DescriptionListItem>
            <DescriptionListItem>
              <DescriptionTerm>Fatura aberta</DescriptionTerm>
              <DescriptionDetails>
                <MoneyDisplay value={-1284.6} signed tone="expense" />
              </DescriptionDetails>
            </DescriptionListItem>
          </DescriptionList>
        </CardContent>
      </Card>
    </SplitShellAside>
  )
}

const PASSOS = [
  { titulo: "Recuperar senha", descricao: "Enviamos um código de seis dígitos para o seu e-mail.", campo: "E-mail" },
  { titulo: "Digite o código", descricao: "Ele chegou em voce@email.com.", campo: "Código" },
  { titulo: "Nova senha", descricao: "Ela precisa ser tão forte quanto a do cadastro.", campo: "Senha" },
] as const

function Casco({
  side = "start",
  ratio = "wide",
  surface = "brand",
  asideMobile = "card",
  voltar = true,
  pe = true,
  passo = true,
}: {
  side?: "start" | "end"
  ratio?: "wide" | "even" | "narrow"
  surface?: "brand" | "muted"
  asideMobile?: "card" | "band" | "logo" | "hidden"
  voltar?: boolean
  pe?: boolean
  passo?: boolean
}) {
  const [i, setI] = React.useState(0)
  const atual = PASSOS[passo ? i : 0]
  return (
    <SplitShell
      side={side}
      ratio={ratio}
      asideMobile={asideMobile}
      aside={<Campo surface={surface} />}
      title={atual.titulo}
      description={atual.descricao}
      step={passo ? i : undefined}
      back={voltar ? <SplitShellBack href="#">entrar</SplitShellBack> : undefined}
      footer={
        pe ? (
          <SplitShellFooter>
            <p>
              Lembrou a senha? <a href="#">Entrar</a>
            </p>
          </SplitShellFooter>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-(--space-block)">
        <FormInput size="xl" label={atual.campo} />
        <Button size="xl" className="w-full" onClick={() => setI((v) => (v + 1) % PASSOS.length)}>
          {passo ? "continuar" : "enviar"}
        </Button>
      </div>
    </SplitShell>
  )
}

function DemoNaTela() {
  const [side, setSide] = React.useState<"start" | "end">("start")
  const [ratio, setRatio] = React.useState<"wide" | "even" | "narrow">("wide")
  const [surface, setSurface] = React.useState<"brand" | "muted">("brand")
  const [voltar, setVoltar] = React.useState(true)
  const [pe, setPe] = React.useState(true)
  const [passo, setPasso] = React.useState(true)

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Eixo rotulo="side" valores={["start", "end"] as const} valor={side} onChange={setSide} />
        <Eixo rotulo="ratio" valores={["wide", "even", "narrow"] as const} valor={ratio} onChange={setRatio} />
        <Eixo rotulo="surface" valores={["brand", "muted"] as const} valor={surface} onChange={setSurface} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Interruptor id="ss-voltar" rotulo="voltar" valor={voltar} onChange={setVoltar} />
        <Interruptor id="ss-pe" rotulo="pé" valor={pe} onChange={setPe} />
        <Interruptor id="ss-passo" rotulo="passos" valor={passo} onChange={setPasso} />
      </div>
      <ViewportFrame title="Casco dividido numa janela" height={620} className="rounded-lg" screenClassName="bg-background">
        <Casco side={side} ratio={ratio} surface={surface} voltar={voltar} pe={pe} passo={passo} />
      </ViewportFrame>
    </div>
  )
}

function DemoTelefone() {
  const [asideMobile, setAsideMobile] = React.useState<"card" | "band" | "logo" | "hidden">("card")
  return (
    <div className="flex w-full flex-col items-center gap-6 p-4">
      <Eixo
        rotulo="asideMobile"
        valores={["card", "band", "logo", "hidden"] as const}
        valor={asideMobile}
        onChange={setAsideMobile}
      />
      <IphoneFrame title="Casco dividido num iPhone">
        <div className="h-full overflow-y-auto">
          <Casco asideMobile={asideMobile} />
        </div>
      </IphoneFrame>
    </div>
  )
}

export default function SplitShellDoc() {
  return (
    <>
      <Usage>
        O casco de uma tela que existe <strong>fora</strong> da casca do app — acesso, convite, qualquer página sem lateral e sem topo. Um campo de um lado, uma coluna de conteúdo do outro, e a coluna em três faixas: o voltar, o conteúdo e o pé. No app, as telas de acesso o vestem pelo <code>AuthShell</code>.
      </Usage>

      <DocSection
        title="Na tela"
        description="A divisão responde à largura do próprio casco (48rem), e não à da janela: aqui ela roda numa moldura de viewport. Avance os passos: título e conteúdo entram deslizando, e o foco vai ao título."
        code={`<SplitShell
  aside={<SplitShellAside brand={<AppWordmark size="lg" />}>…</SplitShellAside>}
  title="Recuperar senha"
  description="Enviamos um código de seis dígitos para o seu e-mail."
  back={<SplitShellBack href="/login">Entrar</SplitShellBack>}
  footer={<SplitShellFooter><p>Lembrou a senha? <Link href="/login">Entrar</Link></p></SplitShellFooter>}
  step={passo}
>
  <RecoveryForm />
</SplitShell>`}
        previewClassName="block p-0"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="O campo fica preso, e a coluna tem três faixas">
        A partir da quebra, o campo mede a altura da janela e fica preso enquanto uma coluna longa — o cadastro — rola. A coluna põe o voltar em cima e o pé embaixo, com o conteúdo centrado no meio; no telefone o conteúdo encosta no topo, logo abaixo do campo, porque centrado ele flutuava a 223px dele (medido a 375×812) e a sobra de baixo é onde o teclado sobe.
      </DocNote>

      <DocSection
        title="No telefone"
        description="asideMobile: o cartão de hoje, uma faixa só com a marca, a marca sozinha sobre a página (logo — o SplitShellAside recebe a versão dela em logo), ou nenhum campo — o formulário na primeira dobra. No toque, com um campo de texto focado, o campo de marca recolhe e o formulário sobe para a vista do teclado (sem toque, nesta prévia, ele fica)."
        code={`<SplitShell asideMobile="band" …>`}
        previewClassName="block p-0"
      >
        <DemoTelefone />
      </DocSection>

      <DocSection
        title="Esqueleto"
        description="SplitShellSkeleton: o campo e a coluna com o título, a descrição, os campos e o botão. Dentro de um casco já montado, a espera só do formulário é do produto (o AuthFormSkeleton do app)."
        code={`<SplitShellSkeleton fields={2} />`}
        previewClassName="block p-0"
      >
        <div className="p-4">
          <ViewportFrame title="Esqueleto do casco" height={420} className="rounded-lg" screenClassName="bg-background">
            <SplitShellSkeleton />
          </ViewportFrame>
        </div>
      </DocSection>

      <DocNote title="Não há cartão, e é a decisão que ele carrega">
        O cartão centrado existe para dar moldura a um formulário solto no meio de um fundo cinza. Com o campo segurando metade da tela a moldura já está dada, e um retângulo com borda dentro dela é uma segunda fronteira para o mesmo limite — a mesma conta que tirou o fio das tiras do <code>Card</code>. A coluna <strong>é</strong> a superfície.
      </DocNote>

      <DocNote title="O conteúdo do campo é do produto; a geometria, do casco">
        Marca, números e prova são conteúdo de produto e não moram em <code>ui/</code>: entram pelo <code>aside</code>. A margem, o canto, a área segura do notch e a troca entre cartão e coluna são do <code>SplitShellAside</code>. Sobre o <code>brand</code>, nenhum texto corrido: o que se lê vive num <code>Card</code>, e só a marca pousa direto no arco-íris.
      </DocNote>

      <PropsTable
        title="SplitShell"
        rows={[
          { prop: "aside", type: "ReactNode", description: "O campo. Vista o SplitShellAside para ter a geometria do casco." },
          { prop: "title", type: "string", description: "O H1 da coluna, em .page-title. Recebe o foco quando o passo muda." },
          { prop: "description", type: "ReactNode", description: "Uma linha sob o título. Par de identidade: sem gap entre os dois." },
          { prop: "back", type: "ReactNode", description: "O topo da coluna: o SplitShellBack." },
          { prop: "footer", type: "ReactNode", description: "O pé da coluna: o SplitShellFooter." },
          { prop: "side", type: '"start" | "end"', default: '"start"', description: "De que lado mora o campo. A ordem de leitura não muda." },
          { prop: "ratio", type: '"wide" | "even" | "narrow"', default: '"wide"', description: "Quanto da largura o campo leva: 5:6, 1:1 ou 1:2." },
          { prop: "asideMobile", type: '"card" | "band" | "logo" | "hidden"', default: '"card"', description: "O campo abaixo da quebra: o cartão, uma faixa só com a marca, a marca sozinha sobre a página, ou nada." },
          { prop: "step", type: "string | number", description: "O passo de um fluxo. Ao mudar, a coluna entra deslizando e o foco vai ao título." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "SplitShellAside", type: "{ surface?: \"brand\" | \"muted\", brand?, logo? }", description: "A geometria do campo, abaixo do notch. brand é a marca, que a faixa do telefone mantém; logo é a versão dela sobre a página, no asideMobile=\"logo\"." },
          { prop: "SplitShellBack", type: "{ href, children? }", description: "O voltar do topo da coluna, um link de verdade." },
          { prop: "SplitShellFooter", type: "ComponentProps<'div'>", description: "O pé da coluna; os links de dentro vestem o acento." },
          { prop: "SplitShellSkeleton", type: "{ fields?, ratio?, side? }", description: "A espera do casco inteiro, no SkeletonGroup." },
        ]}
      />
    </>
  )
}
