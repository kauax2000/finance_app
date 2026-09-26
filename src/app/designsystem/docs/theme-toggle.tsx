"use client"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ThemeToggleDoc() {
  return (
    <>
      <Usage>
        O trilho de tema: <strong>sistema, claro e escuro</strong>. Vale no instante do toque, mas escolhe entre três opções igualmente válidas, então não é um <code>Switch</code> — é um <code>radiogroup</code>, com as três faces desenhadas. Existe <strong>um</strong> no app, no menu da conta; para ligar e desligar algo, use <code>Switch</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="A demonstração é o controle de verdade: tocar aqui troca o tema do catálogo inteiro."
        code={`<ThemeToggle />`}
      >
        <ThemeToggle />
      </DocSection>

      <DocSection
        title="Degraus"
        description="md (32) é o padrão; lg (36) fica ao lado de um campo lg. A peça, as faces e a viagem crescem juntas."
        code={`<ThemeToggle />
<ThemeToggle size="lg" />`}
      >
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <ThemeToggle size="lg" />
        </div>
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

      <PropsTable
        rows={[
          {
            prop: "size",
            type: '"md" | "lg"',
            default: '"md"',
            description:
              "md tem 32 de altura, o do menu da conta; lg tem 36, para ficar ao lado de um campo lg, como o gatilho de busca do catálogo. A área de toque é 44 nos dois.",
          },
          {
            prop: "className",
            type: "string",
            description:
              "Classes para o trilho — e para o Skeleton que ocupa o lugar dele antes de montar.",
          },
        ]}
      />

      <DocNote title="Três paradas, e a ordem é a do sistema operacional">
        <p>
          <strong>Sistema · Claro · Escuro</strong>, a ordem do menu de tema do macOS. A consequência fica dita em vez de escondida: o eixo do trilho <strong>não</strong> significa escuro→claro, então nenhuma posição carrega sentido próprio. Quem quiser um eixo com significado reordena o array <code>PARADAS</code>, e nada mais.
        </p>
        <p>
          Sistema é o padrão do app desde esta rodada (<code>defaultTheme=&quot;system&quot;</code>, <code>enableSystem</code>): quem nunca escolheu nada segue o aparelho. Antes recebia escuro sempre.
        </p>
      </DocNote>

      <DocNote title="Uma peça só, esticando — não duas bolas">
        <p>
          A primeira versão tinha três nós: uma cabeça, um rastro atrasado e um pescoço ligando os dois, fundidos por serem do mesmo <code>--background</code>. A fusão por cor apaga a costura, mas não faz uma forma só — na tela aquilo lia como <strong>duas bolas transitando</strong>.
        </p>
        <p>
          Hoje é <strong>uma</strong> pílula, e o orgânico vem de três coisas: um trajeto com inércia (<code>cubic-bezier(1, 0, .4, 1)</code> — quase não sai do lugar, dispara, pousa macio), um <strong>esticão</strong> em <code>scale</code> que sobe e volta a 1, e a <strong>origem presa na borda de trás</strong> do movimento, que é o que faz a forma esticar <em>para a frente</em>. A mecânica é a do <a href="https://21st.dev/community/components?q=glass&amp;preview=%2F%40dennysdionigi%2Fcomponents%2Fapple-liquid-glass-switcher" target="_blank" rel="noreferrer">apple-liquid-glass-switcher</a> (Dennys Dionigi), lida do bundle do preview.
        </p>
      </DocNote>

      <DocNote title="O esticão anda em fase com a velocidade, e essa é a divergência da referência">
        <p>
          A referência põe o pico do esticão no meio do <em>seu</em> relógio — 0,44s de escala contra 0,40s de viagem. Com esta curva de trajeto isso sai <strong>anticorrelacionado</strong>, e foi medido: aos 30% do caminho a escala estava em <strong>1,33</strong> com a velocidade a <strong>6%</strong> do máximo, e aos 70%, com 68% da velocidade, a escala já tinha caído para 1,04. A forma esticava <strong>parada</strong> e atravessava contraída — o contrário do que matéria faz.
        </p>
        <p>
          Aqui os dois relógios são o mesmo (400ms) e o pico fica em <strong>0,58</strong>, perto do pico de velocidade da curva (0,667) e cedo o bastante para o auge não cair em cima da borda do trilho. O perfil é uma meia-senoide de cada lado, e não um triângulo: vértice reto no auge lê como repuxão.
        </p>
      </DocNote>

      <DocNote title="O volume se conserva, e a chegada se acomoda">
        <p>
          Esticando em X, a forma <strong>afina em Y</strong> — sem isso ela <em>engorda</em> em vez de esticar, e é essa contrafase que separa matéria elástica de uma pílula que cresce. Medido na animação real: no auge a peça vai a <strong>34,1 × 25,2</strong>, e no fundo do pouso a <strong>26,8 × 28,6</strong>.
        </p>
        <p>
          O relógio da escala passa o do trajeto de propósito (640 contra 400ms): os 240 que sobram são o <strong>pouso</strong>, e ele é <strong>um mergulho só</strong> — a forma bate na parada, compacta atrás e relaxa, indo a 26,8 × 28,6 e voltando. Houve uma versão que oscilava três vezes em 160ms e ficava estalada; uma travessia por zero, nenhum repique. E a <strong>origem vira</strong> na chegada: enquanto corre, a forma estica a partir da borda de trás (para a frente); ao chegar, ela se acomoda a partir da borda da frente, para dentro do trilho. A troca cai exatamente onde a escala é 1, então é invisível por construção — e é ela que libera a amplitude do pouso, que presa atrás crescia contra a borda.
        </p>
      </DocNote>

      <DocNote title="A amplitude é a velocidade, e o teto é a borda do trilho">
        <p>
          As duas viagens duram o mesmo e a longa percorre o dobro — então ela corre ao dobro e estica o dobro: <strong>1,11</strong> num salto de uma parada, <strong>1,22</strong> no de duas. Medido por scrubbing da animação real no salto longo: a largura vai de 28 a <strong>34,2px</strong> no auge e volta a 28, com a borda dianteira chegando no máximo a <strong>87,7</strong> dos 88px do trilho — <strong>0,3px</strong> de folga, simétrica nos dois sentidos.
        </p>
        <p>
          O teto não é gosto. Em 1,26 a forma passa da borda e sai da pílula — e isso não reprova em teste nenhum, só aparece na tela.
        </p>
      </DocNote>

      <DocNote title="A bandeja é sobreposição, e não tinta chapada">
        <p>
          <code>bg-muted</code> é opaco, e medido ele pintava <strong>38,38,38</strong> tanto na barra do catálogo quanto dentro do painel de um cartão — ignorando o que está atrás. Um trilho de abas vive numa tela conhecida; este controle não: ele mora na barra de vidro, no painel do <code>DropdownMenu</code>, no <code>Popover</code> do telefone e solto num cartão. Chapado, ele lê como um bloco estrangeiro colado sobre o preto do app.
        </p>
        <p>
          A superfície passou a ser a do campo — <code>bg-input-fill/50</code>, a mesma de <code>field-classes</code> —, então a placa lê como o fundo de um <code>Input</code>. No escuro <code>--input-fill</code> é branco a 15%, e a <code>/50</code> são 7,5% de sobreposição: <strong>28</strong> sobre a página e <strong>40</strong> sobre o cartão, contra os 38 fixos de antes. É a divergência consciente do <code>TabsList</code>, que continua chapado porque sabe onde mora.
        </p>
      </DocNote>

      <DocNote title="Três faces, não um Switch nu">
        <p>
          Num switch nu, &ldquo;marcado&rdquo; não diz qual tema é — e três estados não cabem num booleano. As três faces ficam desenhadas e a cabeça desliza por baixo. A semântica é <code>radiogroup</code>: uma parada de tabulação, as setas passam pelas três, e o valor acompanha o tema na hora, mesmo com a aparência dois quadros atrás.
        </p>
      </DocNote>

      <DocNote title="Antes de montar, um Skeleton do mesmo tamanho">
        <p>
          O servidor não sabe o tema, e um palpite faria a cabeça saltar na hidratação. Até montar, o lugar é de um <code>Skeleton</code> de 32×88, a medida do trilho — 4 de recuo mais três paradas de 28.
        </p>
      </DocNote>

      <DocNote title="Quem desloca é a Web Animations API, e isso é conserto de defeito">
        <p>
          O next-themes roda com <code>disableTransitionOnChange</code>, que injeta <code>* {"{"} transition: none !important {"}"}</code> enquanto troca a classe do tema. A primeira versão fugia disso aplicando a posição <strong>dois <code>requestAnimationFrame</code> depois</strong> — e era frágil por construção: quando o rAF não corre no ritmo esperado, o estado adiado nunca roda e o polegar fica <strong>parado</strong>. Medido: clique, 1400ms de espera, cabeça sem sair do lugar e <code>document.getAnimations()</code> vazio.
        </p>
        <p>
          A WAAPI não é uma transição, então o <code>!important</code> não a alcança. A posição de repouso é aplicada na hora por <code>--tt-i</code>, e o movimento é uma animação explícita do valor antigo para o novo com <code>fill: &quot;none&quot;</code> — o estilo manda no repouso, a animação só cobre o trajeto. Sem adiamento e sem rAF, e o movimento começa <strong>no mesmo quadro</strong> em que o tema troca, em vez de 45ms depois.
        </p>
        <p>
          O preço: o bloco global de <code>prefers-reduced-motion</code> encurta <em>transição</em>, e a WAAPI escapa dele. Por isso a pergunta é feita à mão no componente — e sem movimento não há nada a fazer, porque <code>--tt-i</code> já pôs as três peças no lugar certo. As faces continuam em transição de CSS de propósito: ali o que muda é tinta, e trocar de estalo junto com a página é o compasso certo.
        </p>
      </DocNote>

      <DocNote title="Nascer é chegar, não viajar">
        <p>
          O gate de montagem leva a parada de 0 para a real, e sem guarda o polegar entra deslizando da esquerda <strong>toda vez que o componente nasce</strong> — no app, a cada abertura do menu da conta, já que o conteúdo de um <code>DropdownMenu</code> desmonta ao fechar. A primeira pintura não anima: ela chega.
        </p>
      </DocNote>

      <DocNote title="Dois conjuntos de ícone, exceção nomeada">
        <p>
          A face apagada é <code>24/outline</code> e a acesa <code>16/solid</code>, ambas a 16px. É exceção à régua de iconografia no auditor: não existe <code>16/outline</code>, e o peso do traço é o sinal que a cor sozinha não entrega num glifo de 16px no tema escuro.
        </p>
      </DocNote>
    </>
  )
}
