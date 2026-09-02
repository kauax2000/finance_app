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
]

export default function TabsDoc() {
  return (
    <>
      <Usage>
        Painéis irmãos do mesmo nível, dos quais só um aparece por vez. Se as
        opções <em>filtram</em> a mesma lista em vez de trocar o conteúdo, o
        componente é <code>ToggleGroup</code> — e o app quebra essa regra em
        quatro lugares hoje. Se elas <em>navegam</em> para outra rota, é um link.
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
        description="A bandeja preenchida, e a forma que o app já usa. Ela vive numa linha de controles: a bandeja mede 32 para ficar rente ao Button e ao Input ao lado, e por isso o padrão dela é md. O marcador corre dentro da bandeja."
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

      <DocNote title="Ele é o único que nasce esticado">
        <code>stretch</code> vem ligado aqui e desligado nas outras duas, porque
        uma bandeja lê como <strong>controle segmentado</strong> — e um controle
        segmentado divide a largura que tem. Uma fileira de abas de página não.
      </DocNote>

      <DocSection
        title="Underline — as abas de página"
        description="Um fio sob a fileira, e o marcador pousa nele. Aqui não há bandeja para caber em linha de controle nenhuma: são abas que dividem a página com título e texto corrido, então o padrão é lg — o degrau em que o rótulo volta aos 14px."
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
        Ele é a fronteira entre a fileira e o painel de baixo. Um fio que
        <strong> para depois da última aba</strong> lê como sublinhado do grupo,
        não como base da página — por isso a moldura do <code>underline</code>{" "}
        ocupa a largura toda mesmo com as abas do tamanho do rótulo.
      </DocNote>

      <DocSection
        title="Ghost — dentro de uma moldura que já existe"
        description="Nem bandeja nem fio: para dentro de um cartão ou de um diálogo que já tem contorno próprio. Também é abas de página, então também nasce lg."
        code={`<TabsList variant="ghost">…</TabsList>  {/* size="lg" de fábrica */}`}
        previewClassName="flex-col flex-nowrap items-stretch gap-6 p-6"
      >
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="jan">
            <TabsList variant="ghost">
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

      <DocNote title="ghost não viaja, e a razão é o trilho">
        O marcador viaja <em>ao longo de alguma coisa</em>: a bandeja do{" "}
        <code>solid</code> e o fio do <code>underline</code> são o trilho que dá
        sentido ao deslocamento. O <code>ghost</code> não desenha nem um nem
        outro, então ali o mesmo movimento deixa de ser um realce correndo por um
        trilho e vira um bloco preenchido deslizando sozinho sobre o fundo — na
        variante escolhida justamente para uma fileira que <strong>não</strong>{" "}
        deve chamar atenção. A mais silenciosa das três não pode ficar com o
        marcador mais barulhento. Sem marcador ela cai no mesmo caminho de antes
        da hidratação: cada gatilho pinta o próprio realce, e a tinta troca com{" "}
        <code>transition-colors</code> — mudança de cor, não deslocamento.
      </DocNote>

      <DocNote title="As três não compartilham um padrão, e é de propósito">
        Antes desta rodada elas saíam idênticas — moldura 32, gatilho 28 e fonte
        de 12,8px nas três, medidas —, diferindo só no que a moldura pintava.
        Hoje <code>solid</code> nasce <code>md</code> porque a bandeja dele tem
        de ficar rente a um <code>Button</code>, e as outras duas nascem{" "}
        <code>lg</code> porque <strong>é ali que o rótulo volta ao corpo de
        texto da página</strong>: só <code>sm</code> e <code>md</code> carregam{" "}
        <code>text-control-sm</code>. Um <code>size</code> explícito continua
        vencendo.
      </DocNote>

      <DocSection
        title="Altura da bandeja"
        description="size mede a bandeja — a caixa que um layout posiciona —, e o gatilho deriva dela. Os mesmos nomes e os mesmos números do Button, do Input e do SelectTrigger: botão ao lado de aba alinha sem ninguém dizer size."
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
        description="stretch divide a linha em partes iguais. Ele nasce ligado em solid e desligado nas outras duas, porque uma bandeja lê como controle segmentado e uma fileira de abas de página não."
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
        description="scrollable rola a fileira quando ela não cabe, dissolvendo nas pontas com a mesma primitiva da paleta de comandos e da tabela. Arraste a fileira abaixo para ver as bordas acenderem."
        code={`<TabsList scrollable>
  {MESES.map((mes) => (
    <TabsTrigger key={mes} value={mes}>{mes}</TabsTrigger>
  ))}
</TabsList>`}
        previewClassName="flex-col flex-nowrap items-stretch p-6"
      >
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
              Oito meses não cabem em 360px. Antes disso, a resposta escrita
              aqui era “ou são três abas, ou a navegação é outra coisa”.
            </p>
          </TabsContent>
        </Tabs>
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
            default: '"md" em solid · "lg" em underline e ghost',
            description:
              "A altura da bandeja — 28, 32, 36, 40 —, que é a caixa que um layout posiciona. O gatilho deriva (bandeja − 4): 24, 28, 32, 36. Os oito números são degraus da escada. No ponteiro grosso a bandeja tem piso de 40.",
          },
          {
            prop: "variant",
            type: '"solid" | "underline" | "ghost"',
            default: '"solid"',
            description:
              "O tipo de aba, e não só o que a moldura desenha: ele decide também o padrão de size e o de stretch. solid é controle segmentado; underline e ghost são abas de página.",
          },
          {
            prop: "stretch",
            type: "boolean",
            default: "variant === solid",
            description:
              "Abas de largura igual dividindo a linha. Desligado, o alvo de toque cresce para 44px.",
          },
          {
            prop: "scrollable",
            type: "boolean",
            default: "false",
            description:
              "A fileira rola e dissolve nas pontas. Vence stretch, porque os dois juntos não fazem nada.",
          },
          {
            prop: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description:
              "Declarado no Tabs, não na lista. Troca as setas de navegação junto.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "TabsList",
            type: "div + Tabs.List",
            description:
              "A moldura mais a fileira. O className cai na moldura, que é a caixa que um layout posiciona.",
          },
          {
            prop: "TabsTrigger",
            type: "Tabs.Trigger",
            description:
              "Lê tamanho, superfície e distribuição do contexto da lista. Não precisa repeti-los.",
          },
          {
            prop: "TabsContent",
            type: "Tabs.Content",
            description: "O painel. Recebe foco, e por isso tem anel próprio.",
          },
        ]}
      />

      <DocNote title="O gatilho media 27px, e a conta escrita não fechava">
        A lista era <code>h-9</code> (36) com <code>p-1</code> (8), o que deixa
        28 de caixa; o gatilho era <code>h-[calc(100%-1px)]</code>, ou seja{" "}
        <strong>27</strong> — abaixo do piso de 28 da escada. A justificativa
        registrada dizia que “a 32 o gatilho cairia a 24”, uma conta que faz 36 −
        8 = 28 e para, sem nunca subtrair o <code>-1px</code> que o próprio
        componente escrevia. A raiz é ancorar a escada no contêiner, o mesmo
        defeito que o <code>Menubar</code> já teve e já corrigiu.
      </DocNote>

      <DocNote title="A bandeja padrão cresceu de 36 para 40">
        Consequência direta de <code>md</code> ser o padrão do sistema e nomear
        um gatilho de 32. Quem quiser os 36 de antes pede <code>{'size="sm"'}</code>{" "}
        — e ganha de brinde o gatilho de 28 que a versão anterior prometia sem
        entregar.
      </DocNote>

      <DocNote title="flex-1 nas abas era decorativo">
        A lista era <code>w-fit</code>, e <code>flex-1</code> dentro de um
        contêiner que encolhe para o conteúdo distribui sobra zero. As abas
        nunca esticaram — o que derruba a premissa que sustentava a exceção da
        escada. Hoje esticar é <code>stretch</code>, e ele traz a largura de que
        precisa.
      </DocNote>

      <DocNote title="Por que scrollable não vem ligado">
        <code>scroll-fade-x</code> declara 36px de{" "}
        <code>scroll-padding-inline</code>. Ligá-la sempre mudaria o{" "}
        <code>scrollIntoView</code> de toda barra de abas do app, inclusive das
        que nunca transbordam — então o eixo é opt-in. Em{" "}
        <code>underline</code> a fileira precisa de <code>pb-0</code> para o
        marcador encontrar o fio, e ali o anel de foco perde 3px na base:
        medido, aceito, e visível nos outros três lados.
      </DocNote>

      <DocNote title="A moldura fica fora da fileira">
        A dissolução recorta o alfa do elemento inteiro — fundo, anel e sombra
        junto. Uma bandeja mascarada sairia com os quatro cantos apagados e os
        lados opacos, que lê como falha de renderização. Por isso quem pinta é a
        moldura e quem rola é a fileira, que não desenha nada. E ela fica{" "}
        <em>fora</em>: um nó entre um <code>{'role="tablist"'}</code> e as suas{" "}
        <code>{'role="tab"'}</code> mexe na posse ARIA.
      </DocNote>

      <DocNote title="Por que o marcador é um nó só, e não o gatilho">
        Um realce que acende e apaga em elementos diferentes não tem como
        viajar — não há objeto que se mova, só dois que trocam de estado. Então
        a pintura saiu do gatilho e virou <code>{'tabs-indicator'}</code>,
        absoluto dentro da fileira, posicionado por quatro variáveis que a
        trilha publica. Ele está fora do fluxo, então animar largura e altura
        nele não recalcula o layout de irmão nenhum. A alternativa
        transform-only (<code>scaleX</code>) foi rejeitada porque distorce o raio
        e a borda de 1px do <code>solid</code>: uma pílula esticada lê como bug,
        não como movimento.
      </DocNote>

      <DocNote title="200ms, e o rótulo anda no mesmo relógio">
        <code>{'--duration-base'}</code> com <code>{'--ease-out'}</code>. A 300 o
        marcador arrasta e a interface parece lenta; a 100 ele pisca e não se lê
        como deslocamento. A cor do rótulo usa a mesma duração e a mesma curva de
        propósito: com relógios diferentes a aba acenderia antes de o realce
        chegar, e o que é um evento pareceriam dois.
      </DocNote>

      <DocNote title="Sem JavaScript o gatilho ainda se pinta">
        Não há caixa para medir antes da hidratação, e um marcador sem posição
        deixaria a aba ativa sem marca nenhuma na primeira pintura. Então o
        gatilho mantém o próprio realce e só o larga quando o marcador está
        vivo — a troca é decidida em React, e não por seletor, porque{" "}
        <code>{'in-*'}</code> e <code>{'group-*'}</code> compilam com{" "}
        <code>{':where()'}</code>, que não soma especificidade. Um booleano não
        disputa.
      </DocNote>

      <DocNote title="Movimento reduzido não precisou de regra própria">
        O bloco global de <code>{'prefers-reduced-motion'}</code> encurta
        transições para 0,01ms, então o marcador <strong>salta</strong> em vez de
        viajar e o estado final chega igual. É o que a regra do sistema já
        prometia: menos movimento, mesmo significado.
      </DocNote>

      <DocNote title="O app ainda não usa este componente">
        São 10 <code>{'role="tablist"'}</code> escritos à mão em 7 arquivos, a
        partir de duas strings exportadas de uma pasta de feature — sem foco
        itinerante, sem setas, sem <code>aria-controls</code> e sem{" "}
        <code>{'role="tabpanel"'}</code>. Eles anunciam o padrão ARIA de abas e
        entregam botões soltos. Quatro deles são filtros e querem{" "}
        <code>ToggleGroup</code>; os outros seis são{" "}
        <code>{'variant="solid" stretch'}</code>.
      </DocNote>
    </>
  )
}
