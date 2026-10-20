"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const DEGRAUS = ["sm", "md", "lg"] as const

export default function ThemeToggleDoc() {
  return (
    <>
      <Usage>
        O trilho de tema: <strong>sistema, claro e escuro</strong>. Vale no instante do toque, mas escolhe entre três opções igualmente válidas, então não é um <code>Switch</code> — é um <code>radiogroup</code>, com as três faces desenhadas. É o único controle de tema: não escreva outro com <code>setTheme</code>. Todas as demonstrações abaixo são o controle de verdade, e trocam o tema do catálogo.
      </Usage>

      <DocSection
        title="Degraus"
        description="sm 28 para barras densas, md 32 (o padrão, o do menu da conta) e lg 36, ao lado de um campo lg. A parada é a altura menos 4, a peça viaja uma parada por índice, e o alvo de toque é 44 nos três."
        code={`<ThemeToggle size="sm" />
<ThemeToggle />
<ThemeToggle size="lg" />`}
        previewClassName="items-end gap-6"
      >
        {DEGRAUS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <ThemeToggle size={s} />
            <Caption>{s}</Caption>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Com rótulos"
        description="labels põe o nome ao lado do ícone, para uma tela de preferências onde o ícone sozinho não basta. As três paradas têm a mesma largura, e a peça estica os mesmos pixels que na versão de ícone — numa pílula larga, proporcionalmente menos."
        code={`<ThemeToggle labels />`}
        previewClassName="flex-col items-start gap-4"
      >
        <ThemeToggle labels />
        <ThemeToggle labels size="sm" />
      </DocSection>

      <DocSection
        title="A revelação circular"
        description="A troca abre num círculo que parte da parada tocada e cobre a tela (View Transitions API): a página velha fica por cima, a nova se revela por baixo, e a peça continua viajando dentro do círculo. É o padrão; reveal={false} troca na hora. Sem suporte no navegador, ou com movimento reduzido, a troca também é na hora."
        code={`<ThemeToggle />
<ThemeToggle reveal={false} />`}
        previewClassName="items-end gap-6"
      >
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle />
          <Caption>reveal</Caption>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle reveal={false} />
          <Caption>reveal=&#123;false&#125;</Caption>
        </div>
      </DocSection>

      <DocSection
        title="A versão de marca"
        description="variant=&quot;brand&quot; é o brilho da família do Switch, do Checkbox e do Badge: a borda do trilho acende em arco-íris conforme o ponteiro se aproxima, e só a borda. Longe do ponteiro, e no toque, é o trilho de sempre. Uma por tela."
        code={`<ThemeToggle variant="brand" />`}
      >
        <ThemeToggle variant="brand" size="lg" />
      </DocSection>

      <DocSection
        title="Numa linha de menu"
        description="A forma do menu da conta: o rótulo à esquerda, o controle empurrado para a borda."
        code={`<div className="flex items-center justify-between gap-3">
  <span className="text-sm text-foreground">Tema</span>
  <ThemeToggle className="ml-auto shrink-0" />
</div>`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-xs items-center justify-between gap-3">
          <span className="text-sm text-foreground">Tema</span>
          <ThemeToggle className="ml-auto shrink-0" />
        </div>
      </DocSection>

      <DocNote title="Três paradas, na ordem do sistema operacional">
        <strong>Sistema · Claro · Escuro</strong>, a ordem do menu de tema do macOS. O eixo do trilho <strong>não</strong> significa escuro→claro, e nenhuma posição carrega sentido próprio; quem quiser um eixo reordena <code>PARADAS</code>, e nada mais. Sistema é o padrão do app desde a rodada 116 (<code>defaultTheme=&quot;system&quot;</code>): quem nunca escolheu segue o aparelho.
      </DocNote>

      <DocNote title="Uma peça só, esticando em fase com a corrida">
        <p>
          Houve três nós — cabeça, rastro e pescoço —, e eles liam como duas bolas. Hoje é <strong>uma</strong> pílula, com a mecânica do <a href="https://21st.dev/community/components?q=glass&amp;preview=%2F%40dennysdionigi%2Fcomponents%2Fapple-liquid-glass-switcher" target="_blank" rel="noreferrer">apple-liquid-glass-switcher</a> (Dennys Dionigi): um trajeto com inércia (<code>cubic-bezier(1, 0, .4, 1)</code>, 400ms), um <strong>esticão</strong> em <code>scale</code> com a origem na borda de trás — a forma estica para a frente — e o volume conservado: esticando em X, ela afina em Y (34,1 × 25,2 no auge).
        </p>
        <p>
          O esticão roda num relógio de <strong>640ms</strong>, contra 400 do trajeto (a versão anterior desta página dizia que eram o mesmo). Os 400 primeiros são o esticão, com o pico em 0,58 do trajeto, perto do pico de velocidade (0,667) — a referência o punha anticorrelacionado, e a forma esticava parada. Os 240 que sobram são o <strong>pouso</strong>: um mergulho só, ancorado na borda da frente. A amplitude é a velocidade — 1,11 num salto de uma parada, 1,22 no de duas —, e o teto é a borda do trilho: 87,7 dos 88px no salto longo.
        </p>
      </DocNote>

      <DocNote title="Quem desloca é a WAAPI, e o movimento reduzido é perguntado à mão">
        O next-themes roda com <code>disableTransitionOnChange</code>, que injeta <code>transition: none !important</code> durante a troca. Uma transição de CSS morreria ali; a Web Animations API não é transição e escapa. O repouso é o estilo, e a animação (com <code>fill: &quot;none&quot;</code>) só cobre o trajeto. O preço é que o bloco global de movimento reduzido também não a alcança, e o componente pergunta à mão — como pergunta antes da revelação circular. E a primeira pintura não anima: o conteúdo do menu da conta desmonta ao fechar, e sem essa guarda a peça entraria deslizando a cada abertura.
      </DocNote>

      <DocNote title="A bandeja é sobreposição, e não tinta chapada">
        <code>bg-muted</code> pintava 38,38,38 em qualquer fundo, e o controle mora na barra de vidro, no menu, no popover do telefone e em cartão. A superfície é a do campo, <code>bg-input-fill/50</code> — no escuro 28 sobre a página e 40 sobre o cartão. É a divergência consciente do <code>TabsList</code>, que continua chapado porque sabe onde mora.
      </DocNote>

      <DocNote title="Antes de montar, um Skeleton do mesmo tamanho">
        O servidor não sabe o tema, e um palpite faria a peça saltar na hidratação. Até montar, o lugar é de um <code>Skeleton</code> com a medida do trilho — 4 de recuo mais três paradas —, nos três degraus e com rótulo.
      </DocNote>

      <DocNote title="Dois conjuntos de ícone, exceção nomeada">
        A face apagada é <code>24/outline</code> e a acesa <code>16/solid</code>, ambas a 16px: não existe <code>16/outline</code>, e o peso do traço é o sinal que a cor sozinha não entrega num glifo pequeno no tema escuro.
      </DocNote>

      <DocNote title="Onde o app usa">
        Dois: o menu da conta no desktop (<code>UserMenu</code>), na forma de linha de menu, e a seção Aparência de Configurações (<code>ThemeSettings</code>), onde o tema mora no telefone — o telefone não tem menu da conta, a aba Você abre uma página. Os dois no degrau <code>md</code> e com a revelação circular. O catálogo usa mais dois no cabeçalho. A versão anterior desta página dizia que existia um só no app.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "A altura: 28, 32 e 36. O alvo de toque é 44 nos três." },
          { prop: "labels", type: "boolean", default: "false", description: "Ícone e texto em cada parada." },
          { prop: "reveal", type: "boolean", default: "true", description: "A troca abre num círculo a partir da parada tocada." },
          { prop: "variant", type: '"default" | "brand"', default: '"default"', description: "brand é o brilho de arco-íris na borda do trilho. Uma por tela." },
          { prop: "className", type: "string", description: "Para o trilho — e para o Skeleton que ocupa o lugar dele antes de montar." },
        ]}
      />
    </>
  )
}
