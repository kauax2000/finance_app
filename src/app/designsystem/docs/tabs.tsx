"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowsRightLeftIcon,
  CreditCardIcon,
  ListBulletIcon,
} from "@heroicons/react/16/solid"

import { Kbd } from "@/components/ui/kbd"
import {
  Tabs,
  TabsAdd,
  TabsContent,
  TabsList,
  TabsNav,
  TabsNavLink,
  TabsTrigger,
  type TabsSize,
  type TabsVariant,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { IphoneFrame } from "../ds-frame"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"

const VARIANTES = ["floating", "solid", "underline", "plain"] as const
const DEGRAUS = ["sm", "md", "lg", "xl"] as const
const ORIENTACOES = ["horizontal", "vertical"] as const

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]



const PAINEIS = [
  { valor: "extrato", nome: "Extrato", texto: "12 transações entre 01/03 e 28/03." },
  { valor: "categorias", nome: "Categorias", texto: "Mercado, Transporte e Lazer." },
  { valor: "parcelas", nome: "Parcelas", texto: "3 compras parceladas em andamento." },
]

function DemoNaTela() {
  const [variant, setVariant] = React.useState<TabsVariant>("floating")
  const [size, setSize] = React.useState<TabsSize | "padrão">("padrão")
  const [orientation, setOrientation] = React.useState<(typeof ORIENTACOES)[number]>("horizontal")
  const [esticar, setEsticar] = React.useState(true)
  const [vidro, setVidro] = React.useState(false)

  return (
    <div className="flex w-full flex-col gap-4">
      <Controles
        inicio={
          <>
            <Eixo rotulo="variant" valores={VARIANTES} valor={variant} onChange={setVariant} />
            <Eixo rotulo="size" valores={["padrão", ...DEGRAUS] as const} valor={size} onChange={setSize} />
            <Eixo rotulo="orientation" valores={ORIENTACOES} valor={orientation} onChange={setOrientation} />
          </>
        }
        fim={
          <Interruptores>
            {/* `stretch` divide a largura de uma fileira; na coluna ele não existe. */}
            {orientation === "horizontal" ? (
              <Interruptor id="ds-tabs-stretch" rotulo="stretch" valor={esticar} onChange={setEsticar} />
            ) : null}
            <Interruptor id="ds-tabs-glass" rotulo="glass" valor={vidro} onChange={setVidro} />
          </Interruptores>
        }
      />
      <Tabs defaultValue="extrato" orientation={orientation}>
        <TabsList
          variant={variant}
          size={size === "padrão" ? undefined : size}
          stretch={esticar}
          glass={vidro}
        >
          {PAINEIS.map((p) => (
            <TabsTrigger key={p.valor} value={p.valor}>
              {p.nome}
            </TabsTrigger>
          ))}
        </TabsList>
        {PAINEIS.map((p) => (
          <TabsContent key={p.valor} value={p.valor}>
            <p className="text-sm text-muted-foreground">{p.texto}</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function DemoIconeContagem() {
  return (
    <Tabs defaultValue="todas">
      <TabsList stretch={false}>
        <TabsTrigger value="todas" icon={<ListBulletIcon aria-hidden />} count={24}>
          Todas
        </TabsTrigger>
        <TabsTrigger value="cartao" icon={<CreditCardIcon aria-hidden />} count={9}>
          Cartão
        </TabsTrigger>
        <TabsTrigger value="transferencias" icon={<ArrowsRightLeftIcon aria-hidden />} count={3}>
          Transferências
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function DemoFechar() {
  const [abas, setAbas] = React.useState(["Março", "Abril", "Maio"])
  const [ativa, setAtiva] = React.useState("Março")
  const proximo = React.useRef(0)
  return (
    <Tabs value={ativa} onValueChange={setAtiva}>
      <TabsList
        stretch={false}
        end={
          <TabsAdd
            label="Abrir um mês"
            onClick={() => {
              const livre = MESES.find((m) => !abas.includes(m)) ?? `Mês ${++proximo.current}`
              setAbas((a) => [...a, livre])
              setAtiva(livre)
            }}
          />
        }
      >
        {abas.map((m) => (
          <TabsTrigger
            key={m}
            value={m}
            onClose={abas.length > 1 ? () => setAbas((a) => a.filter((x) => x !== m)) : undefined}
          >
            {m}
          </TabsTrigger>
        ))}
      </TabsList>
      {abas.map((m) => (
        <TabsContent key={m} value={m}>
          <p className="text-sm text-muted-foreground">O extrato de {m.toLowerCase()}.</p>
        </TabsContent>
      ))}
    </Tabs>
  )
}

function DemoMais() {
  return (
    <div className="w-full max-w-md">
      <Tabs defaultValue="Março">
        <TabsList overflow="menu">
          {MESES.map((m) => (
            <TabsTrigger key={m} value={m}>
              {m}
            </TabsTrigger>
          ))}
        </TabsList>
        {MESES.map((m) => (
          <TabsContent key={m} value={m}>
            <p className="text-sm text-muted-foreground">Os lançamentos de {m.toLowerCase()}.</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function DemoNavegacao() {
  const rotas = [
    { href: "/designsystem/tabs", nome: "Tabs" },
    { href: "/designsystem/table", nome: "Table" },
    { href: "/designsystem/data-table", nome: "Data Table" },
  ]
  return (
    <TabsNav aria-label="Páginas vizinhas" stretch={false}>
      {rotas.map((r) => (
        <TabsNavLink key={r.href} asChild active={r.href === "/designsystem/tabs"}>
          <Link href={r.href}>{r.nome}</Link>
        </TabsNavLink>
      ))}
    </TabsNav>
  )
}

function DemoUrl() {
  return (
    <Tabs defaultValue="extrato" urlParam="aba">
      <TabsList stretch={false}>
        {PAINEIS.map((p) => (
          <TabsTrigger key={p.valor} value={p.valor}>
            {p.nome}
          </TabsTrigger>
        ))}
      </TabsList>
      {PAINEIS.map((p) => (
        <TabsContent key={p.valor} value={p.valor}>
          <p className="text-sm text-muted-foreground">Olhe a barra de endereço: ?aba={p.valor}.</p>
        </TabsContent>
      ))}
    </Tabs>
  )
}

function DemoArrastar() {
  return (
    <IphoneFrame title="Abas num iPhone">
      <div className="flex h-full flex-col gap-3 overflow-y-auto bg-background px-4 pt-16 pb-8">
        <Tabs defaultValue="extrato" swipe>
          <TabsList size="xl">
            {PAINEIS.map((p) => (
              <TabsTrigger key={p.valor} value={p.valor}>
                {p.nome}
              </TabsTrigger>
            ))}
          </TabsList>
          {PAINEIS.map((p) => (
            <TabsContent key={p.valor} value={p.valor} className="min-h-80 rounded-2xl bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">
                {p.texto} Arraste para os lados para trocar de aba.
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </IphoneFrame>
  )
}

function DemoMontado() {
  return (
    <Tabs defaultValue="nota" shortcuts>
      <TabsList stretch={false}>
        <TabsTrigger value="nota">Nota</TabsTrigger>
        <TabsTrigger value="resumo">Resumo</TabsTrigger>
      </TabsList>
      <TabsContent value="nota" keepMounted>
        <Textarea aria-label="Nota do mês" placeholder="Escreva, troque de aba e volte: o rascunho fica." minRows={3} />
      </TabsContent>
      <TabsContent value="resumo" keepMounted>
        <p className="text-sm text-muted-foreground">O resumo do mês.</p>
      </TabsContent>
    </Tabs>
  )
}

export default function TabsDoc() {
  return (
    <>
      <Usage>
        Painéis irmãos do mesmo nível, um visível por vez. Se as opções <em>filtram</em> a mesma lista, é{" "}
        <code>ToggleGroup</code>; se <em>navegam</em> para outra rota, é o <code>TabsNav</code>, com links.
      </Usage>

      <DocSection
        title="Na tela"
        description="floating é o padrão desde a rodada 226: a pílula da casa, chapada, com o anel de 1px e nenhuma sombra atrás — o marcador em relevo é que tem a sombra mínima. Troque de aba: o marcador corre como o polegar do alternador de tema, com inércia, esticando na direção da viagem e acomodando ao pousar. Troque a variante, o degrau, a orientação, o stretch e o vidro."
        code={`<Tabs defaultValue="extrato">
  <TabsList>                {/* variant="floating" size="md", de fábrica */}
    <TabsTrigger value="extrato">Extrato</TabsTrigger>
    <TabsTrigger value="categorias">Categorias</TabsTrigger>
  </TabsList>
  <TabsContent value="extrato">…</TabsContent>
</Tabs>`}
        previewClassName="items-stretch"
      >
        <DemoNaTela />
      </DocSection>

      <DocNote title="Sem sombra atrás, de propósito">
        A placa flutuante não paira sobre a linha de controles: ela está <em>nela</em>, rente ao <code>Button</code> e
        ao <code>Input</code> ao lado. Quem a separa da página é o anel, como as placas do <code>CommandDialog</code>.
        A sombra mínima é do marcador — é o relevo que diz qual aba está apertada.
      </DocNote>

      <DocNote title="A viagem é a do alternador de tema">
        O marcador não desliza: corre. A receita mora em <code>lib/liquid-move</code> e é a mesma do{" "}
        <code>ThemeToggle</code> — a curva que quase não sai do lugar, dispara e pousa macio; o esticão em fase com a
        velocidade, preso à borda de trás; o volume que se conserva (esticar em X afina em Y); e um mergulho só no pouso.
        O esticão é proporcional ao caminho, 0,11 por aba andada até o teto de 0,22. Em WAAPI, porque o bloco global de
        movimento reduzido só corta transição — a pergunta é feita à mão, e sem movimento o marcador salta.
      </DocNote>

      <DocSection
        title="Ícone e contagem"
        description="icon põe o ícone antes do rótulo (16/solid; iconActive troca pelo par quando a aba fica ativa); count é a contagem tabular, com um espaço de verdade antes — o leitor de tela ouve “Cartão 9”, e não “Cartão9”."
        code={`<TabsTrigger value="cartao" icon={<CreditCardIcon />} count={9}>Cartão</TabsTrigger>`}
        previewClassName="items-start"
      >
        <DemoIconeContagem />
      </DocSection>

      <DocSection
        title="Abas que fecham, e o +"
        description="onClose põe o × redondo e liga Delete com a aba focada; fechar a ativa leva à vizinha, e o foco vai junto. O × é só do ponteiro (aria-hidden): um botão dentro de uma aba é controle aninhado. end é o slot fora do tablist, onde mora o TabsAdd."
        code={`<TabsList end={<TabsAdd label="Abrir um mês" onClick={abrir} />}>
  <TabsTrigger value="mar" onClose={() => fechar("mar")}>Março</TabsTrigger>
</TabsList>`}
        previewClassName="items-start"
      >
        <DemoFechar />
      </DocSection>

      <DocSection
        title="O que não cabe vai para o Mais"
        description="overflow='menu' mede a fileira e manda as abas que não cabem para o menu Mais ▾, no fim. A ativa nunca sai: se ela não cabe, sai a última que cabia. É a alternativa ao scrollable para quem não quer rolar."
        code={`<TabsList overflow="menu">{meses.map(…)}</TabsList>`}
        previewClassName="items-start"
      >
        <DemoMais />
      </DocSection>

      <DocSection
        title="Abas de navegação"
        description="TabsNav é a mesma fileira num <nav>, com links: cada aba é uma rota, a atual é aria-current='page', e não há role='tab' — o padrão de abas do W3C é para painéis na mesma página."
        code={`<TabsNav aria-label="Seções">
  <TabsNavLink asChild active><Link href="/tabs">Tabs</Link></TabsNavLink>
</TabsNav>`}
        previewClassName="items-start"
      >
        <DemoNavegacao />
      </DocSection>

      <DocSection
        title="A aba na URL"
        description="urlParam lê a aba ao abrir e grava a cada troca, com history.replaceState — o link abre na mesma aba, e o voltar não vira um histórico de cliques."
        code={`<Tabs defaultValue="extrato" urlParam="aba">…</Tabs>`}
        previewClassName="items-start"
      >
        <DemoUrl />
      </DocSection>

      <DocSection
        title="Arrastar no telefone"
        description="swipe troca de aba arrastando o painel para os lados: 56px e bem mais horizontal que vertical, senão a rolagem da página trocaria de aba. O painel desliza do lado para onde a aba andou."
        code={`<Tabs swipe>…</Tabs>`}
        previewClassName="justify-center"
      >
        <DemoArrastar />
      </DocSection>

      <DocSection
        title="O rascunho fica, e os atalhos"
        description="keepMounted mantém o painel montado depois de visto — escreva na nota, troque de aba e volte. shortcuts liga ⌥1…⌥9 para ir direto à aba N."
        code={`<Tabs shortcuts>
  <TabsContent value="nota" keepMounted>…</TabsContent>
</Tabs>`}
        previewClassName="items-stretch"
      >
        <DemoMontado />
      </DocSection>

      <DocNote title="⌥, e não ⌘">
        <Kbd keys="mod+1" /> troca a aba do navegador, e o Chrome não deixa a página cancelar — a mesma razão de o{" "}
        <code>Command</code> evitar <code>mod+n</code>. <Kbd keys="alt+1" /> é livre, não dispara dentro de campo de
        texto, e vai anunciado em <code>aria-keyshortcuts</code>. A tecla é lida pelo <code>code</code>: no Mac o ⌥
        troca o caractere (⌥1 é “¡”).
      </DocNote>

      <DocNote title="O painel desliza do lado certo">
        O estado mora na raiz do <code>Tabs</code> desde a rodada 226, e ela sabe o sentido da última troca — a ordem é
        a do DOM, a que a pessoa vê. O painel novo entra 12px desse lado, na mola; sem sentido (a primeira pintura), é o
        fade de sempre.
      </DocNote>

      <PropsTable
        title="Props de Tabs"
        rows={[
          { prop: "value / defaultValue / onValueChange", type: "string", description: "A aba ativa, guardada na raiz e entregue controlada ao Radix." },
          { prop: "urlParam", type: "string", description: "A aba na URL, com replaceState." },
          { prop: "swipe", type: "boolean", default: "false", description: "Arrastar o painel troca de aba, no toque." },
          { prop: "shortcuts", type: "boolean", default: "false", description: "⌥1…⌥9 vão para a aba N." },
          { prop: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "A fileira ou a coluna." },
        ]}
      />

      <PropsTable
        title="Props de TabsList"
        rows={[
          { prop: "variant", type: '"floating" | "solid" | "underline" | "plain"', default: '"floating"', description: "A pílula sem sombra, a bandeja, o fio, ou nada." },
          { prop: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md" (lg no underline e no plain)', description: "A bandeja: 28 · 32 · 36 · 40." },
          { prop: "stretch", type: "boolean", default: "true no floating e no solid", description: "Abas de largura igual." },
          { prop: "glass", type: "boolean", default: "false", description: "O marcador de vidro, no floating e no solid." },
          { prop: "scrollable / overflow", type: 'boolean / "menu"', description: "Rolar dissolvendo, ou mandar o excesso para o Mais." },
          { prop: "end", type: "ReactNode", description: "O slot fora do tablist — o TabsAdd." },
        ]}
      />

      <PropsTable
        title="Peças"
        rows={[
          { prop: "TabsTrigger", type: "{ icon, iconActive, count, onClose, closeLabel }", description: "O ícone (e o par ativo), a contagem e a aba que fecha." },
          { prop: "TabsContent", type: "{ keepMounted }", description: "Desliza do lado da viagem; keepMounted guarda o painel visto." },
          { prop: "TabsAdd", type: "{ label }", description: "O + redondo, para o end." },
          { prop: "TabsNav / TabsNavLink", type: "{ variant, size, stretch, glass } / { active, asChild }", description: "As abas de navegação, com aria-current." },
        ]}
      />
    </>
  )
}
