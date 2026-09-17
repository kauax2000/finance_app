"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const DEGRAUS = [
  ["sm", "bandeja 28, gatilho 24 — para dentro de um cartão apertado."],
  ["md", "bandeja 32, gatilho 28 — o padrão, e a altura de um Button md."],
  ["lg", "bandeja 36, gatilho 32."],
  ["xl", "bandeja 40, gatilho 36 — o trilho do telefone."],
] as const

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export default function TabsDoc() {
  return (
    <>
      <Usage>
        Painéis irmãos do mesmo nível, um visível por vez. Se as opções{" "}
        <em>filtram</em> a mesma lista, é <code>ToggleGroup</code>; se{" "}
        <em>navegam</em> para outra rota, é um link.
      </Usage>

      <DocSection
        title="Padrão"
        description="Uma aba é um painel, não um filtro. O valor pertence à URL sempre que o conteúdo é endereçável."
        code={`<Tabs defaultValue="extrato">
  <TabsList>
    <TabsTrigger value="extrato">Extrato</TabsTrigger>
    <TabsTrigger value="categorias">Categorias</TabsTrigger>
  </TabsList>
  <TabsContent value="extrato">…</TabsContent>
</Tabs>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <Tabs defaultValue="extrato">
          <TabsList>
            <TabsTrigger value="extrato">Extrato</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          </TabsList>
          <TabsContent value="extrato">
            <p className="text-sm text-muted-foreground">
              12 transações entre 01/03 e 28/03.
            </p>
          </TabsContent>
          <TabsContent value="categorias">
            <p className="text-sm text-muted-foreground">
              Mercado, Transporte e Lazer.
            </p>
          </TabsContent>
          <TabsContent value="parcelas">
            <p className="text-sm text-muted-foreground">
              3 compras parceladas em andamento.
            </p>
          </TabsContent>
        </Tabs>
      </DocSection>

      <DocSection
        title="Solid — o controle segmentado"
        description="A bandeja preenchida, para uma linha de controles: mede 32, rente ao Button e ao Input ao lado, por isso o padrão é md."
        code={`<TabsList>…</TabsList>  {/* variant="solid" size="md", os dois de fábrica */}`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="jan">
            <TabsList stretch={false}>
              <TabsTrigger value="jan">Janeiro</TabsTrigger>
              <TabsTrigger value="fev">Fevereiro</TabsTrigger>
              <TabsTrigger value="mar">Março</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Troque de aba: o realce é um objeto só que se desloca dentro da
            bandeja.
          </p>
        </div>
      </DocSection>


      <DocSection
        title="O marcador de vidro"
        description="glass troca o marcador que viaja pelo vidro do sistema, como o controle segmentado do iOS. Só em solid."
        code={`<TabsList glass stretch={false}>…</TabsList>`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        {(
          [
            [false, "chapado — o padrão"],
            [true, "glass"],
          ] as const
        ).map(([vidro, rotulo]) => (
          <div key={rotulo} className="flex flex-col gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {rotulo}
            </span>
            <Tabs defaultValue="fev">
              <TabsList glass={vidro} stretch={false}>
                <TabsTrigger value="jan">Janeiro</TabsTrigger>
                <TabsTrigger value="fev">Fevereiro</TabsTrigger>
                <TabsTrigger value="mar">Março</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        ))}
      </DocSection>

      <DocNote title="Vidro no marcador, nunca na bandeja">
        O marcador de vidro usa <code>--background</code> opaco, a mesma cor do
        chapado, então o contraste do rótulo não muda; o que entra é só o aro,
        no 1px de borda que já existia. É vidro pintado, sem{" "}
        <code>backdrop-filter</code>: nada passa por baixo de uma fileira de
        abas. Com material na bandeja, ela escurece e deixa de ler como bandeja.
      </DocNote>

      <DocSection
        title="Underline — as abas de página"
        description="Um fio sob a fileira, e o marcador pousa nele. São abas que dividem a página com título e texto corrido, então o padrão é lg, o degrau em que o rótulo volta aos 14px."
        code={`<TabsList variant="underline">…</TabsList>  {/* size="lg" de fábrica */}`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="visao">
            <TabsList variant="underline">
              <TabsTrigger value="visao">Visão geral</TabsTrigger>
              <TabsTrigger value="limites">Limites</TabsTrigger>
              <TabsTrigger value="faturas">Faturas</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            O traço de acento corre sobre o fio.
          </p>
        </div>
      </DocSection>

      <DocNote title="O fio sempre atravessa a largura toda">
        Ele é a fronteira entre a fileira e o painel. Um fio que para depois da
        última aba lê como sublinhado do grupo, não como base da página.
      </DocNote>

      <DocSection
        title="Plain — dentro de uma moldura que já existe"
        description="Nem bandeja nem fio: para dentro de um cartão ou diálogo com contorno próprio. Também são abas de página, então nasce lg."
        code={`<TabsList variant="plain">…</TabsList>  {/* size="lg" de fábrica */}`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="jan">
            <TabsList variant="plain">
              <TabsTrigger value="jan">Janeiro</TabsTrigger>
              <TabsTrigger value="fev">Fevereiro</TabsTrigger>
              <TabsTrigger value="mar">Março</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Aqui o marcador não viaja: a tinta troca no lugar.
          </p>
        </div>
      </DocSection>

      <DocNote title="plain não tem marcador que viaja">
        O marcador viaja ao longo de um trilho — a bandeja ou o fio. Sem trilho,
        vira um bloco deslizando sozinho, barulhento demais para a variante mais
        silenciosa.
      </DocNote>

      <DocSection
        title="Altura da bandeja"
        description="size mede a bandeja, e o gatilho deriva dela. Mesmos nomes e números do Button, do Input e do SelectTrigger: aba ao lado de botão alinha sem declarar size."
        code={`<TabsList size="sm">…</TabsList>  {/* bandeja 28 */}
<TabsList size="md">…</TabsList>  {/* bandeja 32 — o padrão */}
<TabsList size="lg">…</TabsList>  {/* bandeja 36 */}
<TabsList size="xl">…</TabsList>  {/* bandeja 40 */}`}
        previewClassName="flex-col flex-nowrap items-start gap-5 p-6"
      >
        {DEGRAUS.map(([size, dica]) => (
          <div key={size} className="flex flex-col gap-1.5">
            <Tabs defaultValue="mes">
              <TabsList size={size}>
                <TabsTrigger value="mes">Mês</TabsTrigger>
                <TabsTrigger value="ano">Ano</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">
              <code className="font-mono">{size}</code> — {dica}
            </p>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Distribuição"
        description="stretch divide a linha em partes iguais. Nasce ligado em solid, que lê como controle segmentado, e desligado nas abas de página."
        code={`{/* padrão em solid */}
<TabsList stretch>…</TabsList>

{/* uma fileira do tamanho dos rótulos */}
<TabsList variant="solid" stretch={false}>…</TabsList>`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="todas">
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            <code className="font-mono">stretch</code> — as três dividem a
            largura.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="todas">
            <TabsList stretch={false}>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
              <TabsTrigger value="receitas">Receitas</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            <code className="font-mono">stretch={"{false}"}</code> — cada uma do
            tamanho do rótulo, e o alvo de toque cresce para 44px no dedo.
          </p>
        </div>
      </DocSection>

      <DocSection
        title="Excesso horizontal"
        description="scrollable rola a fileira quando ela não cabe, dissolvendo nas pontas como a paleta de comandos e a tabela. A moldura tracejada tem a largura de um telefone."
        code={`<TabsList scrollable>
  {MESES.map((mes) => (
    <TabsTrigger key={mes} value={mes}>{mes}</TabsTrigger>
  ))}
</TabsList>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
        <div className="w-full max-w-sm rounded-lg border border-dashed border-border p-3">
          <Tabs defaultValue="Janeiro">
            <TabsList scrollable>
              {MESES.map((mes) => (
                <TabsTrigger key={mes} value={mes}>
                  {mes}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="Janeiro">
              <p className="text-sm text-muted-foreground">
                Doze meses não cabem em 384px.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </DocSection>

      <DocSection
        title="Vertical"
        description="orientation vale para as três superfícies, e as setas passam a ser as de cima e de baixo sozinhas. O marcador do underline vai para a aresta vizinha ao painel."
        code={`<Tabs orientation="vertical" defaultValue="perfil">
  <TabsList variant="underline">…</TabsList>
  <TabsContent value="perfil">…</TabsContent>
</Tabs>`}
        previewClassName="items-stretch p-6"
      >
        <Tabs orientation="vertical" defaultValue="perfil" className="w-full">
          <TabsList variant="underline">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="sessoes">Sessões</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          </TabsList>
          <TabsContent value="perfil">
            <p className="text-sm text-muted-foreground">
              Nome, e-mail e foto.
            </p>
          </TabsContent>
          <TabsContent value="sessoes">
            <p className="text-sm text-muted-foreground">
              2 dispositivos conectados.
            </p>
          </TabsContent>
          <TabsContent value="notificacoes">
            <p className="text-sm text-muted-foreground">
              Faturas a vencer e limite estourado.
            </p>
          </TabsContent>
        </Tabs>
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md" em solid · "lg" em underline e plain',
            description:
              "Altura da bandeja (28, 32, 36, 40); o gatilho mede bandeja − 4, e no ponteiro grosso a bandeja tem piso de 40.",
          },
          {
            prop: "variant",
            type: '"solid" | "underline" | "plain"',
            default: '"solid"',
            description:
              "O tipo de aba: solid é controle segmentado, underline e plain são abas de página. Decide os padrões de size e stretch.",
          },
          {
            prop: "stretch",
            type: "boolean",
            default: "variant === solid",
            description:
              "Abas de largura igual dividindo a linha. Desligado, cada aba mede o próprio rótulo.",
          },
          {
            prop: "glass",
            type: "boolean",
            default: "false",
            description:
              "O marcador vira a peça de vidro do sistema. Sem efeito fora de solid.",
          },
          {
            prop: "scrollable",
            type: "boolean",
            default: "false",
            description: "A fileira rola e dissolve nas pontas; vence stretch.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description: "Declarado no Tabs; troca as setas de navegação junto.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "TabsList",
            type: "div + Tabs.List",
            description: "Moldura mais fileira; o className cai na moldura.",
          },
          {
            prop: "TabsTrigger",
            type: "Tabs.Trigger",
            description: "Lê tamanho, superfície e distribuição da lista.",
          },
          {
            prop: "TabsContent",
            type: "Tabs.Content",
            description: "O painel. Recebe foco, e por isso tem anel próprio.",
          },
        ]}
      />

      <DocNote title="scrollable é opt-in">
        <code>scroll-fade-x</code> declara 36px de{" "}
        <code>scroll-padding-inline</code>; ligado sempre, mudaria o{" "}
        <code>scrollIntoView</code> de toda barra de abas, inclusive das que
        não transbordam. Em <code>underline</code> o anel de foco perde 3px na
        base para o marcador encontrar o fio.
      </DocNote>

      <DocNote title="A moldura pinta, a fileira rola">
        A dissolução recorta o alfa do elemento inteiro: uma bandeja mascarada
        sairia com os cantos apagados. A moldura fica <em>fora</em> da fileira
        porque um nó entre <code>{'role="tablist"'}</code> e{" "}
        <code>{'role="tab"'}</code> quebra a posse ARIA.
      </DocNote>

      <DocNote title="O marcador é um nó só">
        Um realce que troca de elemento não tem como viajar:{" "}
        <code>{'tabs-indicator'}</code> é absoluto na fileira e anima largura e
        altura, porque <code>scaleX</code> distorceria o raio e a borda. Antes
        da hidratação, o gatilho pinta o próprio realce.
      </DocNote>

      <DocNote title="Marcador e rótulo no mesmo relógio">
        Os dois usam <code>{'--duration-base'}</code> com{" "}
        <code>{'--ease-out'}</code>. Com relógios diferentes, a aba acende antes
        de o realce chegar e um evento parece dois.
      </DocNote>
    </>
  )
}
