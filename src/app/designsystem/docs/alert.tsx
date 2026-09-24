"use client"

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid"

import {
  Alert,
  AlertAction,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function AlertDoc() {
  return (
    <>
      <Usage>
          Mensagem que fica na tela porque é sobre <strong>o conteúdo dela</strong>. Confirmação do que acabou de acontecer é <code>toast</code>; aviso sobre o app inteiro é <code>AnnouncementBar</code>. Três eixos que não se misturam: <code>tone</code> é a cor, <code>variant</code> a forma, <code>size</code> o corpo. Quando quem fala é o produto e não o dado, a forma é <code>brand</code>.
      </Usage>

      <DocSection
        title="Tom"
        description="Cinco tons, tonais e nunca sólidos — o alerta explica, não interrompe. Título e descrição levam a tinta do tom; só o default tem descrição cinza, porque a superfície é neutra."
        code={`<Alert tone="warning">
  <ExclamationTriangleIcon />
  <AlertTitle>Orçamento perto do limite</AlertTitle>
  <AlertDescription>Mercado está em 88%.</AlertDescription>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert>
          <InformationCircleIcon />
          <AlertTitle>Padrão</AlertTitle>
          <AlertDescription>
            Sem cor: o aviso é neutro e não pede ação.
          </AlertDescription>
        </Alert>
        <Alert tone="info">
          <InformationCircleIcon />
          <AlertTitle>Parcelas futuras não entram</AlertTitle>
          <AlertDescription>
            O total considera só o que já foi lançado neste mês.
          </AlertDescription>
        </Alert>
        <Alert tone="success">
          <CheckCircleIcon />
          <AlertTitle>Fatura paga</AlertTitle>
          <AlertDescription>Registrada em 05/04.</AlertDescription>
        </Alert>
        <Alert tone="warning">
          <ExclamationTriangleIcon />
          <AlertTitle>Orçamento perto do limite</AlertTitle>
          <AlertDescription>
            Mercado está em 88% com 9 dias restantes.
          </AlertDescription>
        </Alert>
        <Alert tone="destructive">
          <XCircleIcon />
          <AlertTitle>Não foi possível sincronizar</AlertTitle>
          <AlertDescription>
            As alterações ficaram salvas no aparelho e sobem quando a conexão
            voltar.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocSection
        title="Marca"
        description="A caixa neutra em repouso, e o arco-íris acendendo num arco da borda conforme o ponteiro passa pela tela, com um leve borrão. É a forma para quando quem fala é o produto — uma novidade, uma boas-vindas — e não o dinheiro da pessoa. Ela não aceita tone: marca não tem gravidade. Uma por tela. Passe o mouse perto de um destes."
        code={`<Alert variant="brand">
  <SparklesIcon />
  <AlertTitle>O total agora considera as parcelas</AlertTitle>
  <AlertDescription>…</AlertDescription>
  <AlertActions>
    <AlertAction>Ver o que mudou</AlertAction>
  </AlertActions>
</Alert>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <Alert variant="brand">
          <SparklesIcon />
          <AlertTitle>O total agora considera as parcelas</AlertTitle>
          <AlertDescription>
            Compras parceladas passam a entrar no mês em que cada parcela cai, e
            não no da compra.
          </AlertDescription>
          <AlertActions>
            <AlertAction>Ver o que mudou</AlertAction>
          </AlertActions>
        </Alert>
        <Alert variant="brand">
          <SparklesIcon />
          <AlertTitle>Agora dá para convidar alguém para a carteira</AlertTitle>
        </Alert>
      </DocSection>

      <DocSection
        title="Corpo"
        description="md fala com a tela; sm fala com um campo, colado ao controle que explica. O degrau encolhe texto, respiro e ícone juntos."
        code={`<Alert tone="info">…</Alert>            {/* md */}
<Alert tone="info" size="sm">…</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="info">
          <InformationCircleIcon />
          <AlertTitle>O dia de fechamento não é o de vencimento</AlertTitle>
          <AlertDescription>
            Compras após o fechamento entram na fatura seguinte.
          </AlertDescription>
        </Alert>
        <Alert tone="info" size="sm">
          <InformationCircleIcon />
          <AlertTitle>O dia de fechamento não é o de vencimento</AlertTitle>
          <AlertDescription>
            Compras após o fechamento entram na fatura seguinte.
          </AlertDescription>
        </Alert>
      </DocSection>

      <DocSection
        title="Com ação"
        description="A saída fica em AlertActions, no pé e alinhada ao texto. AlertAction não declara cor: sai de currentColor e serve os cinco tons."
        code={`<Alert tone="destructive">
  <XCircleIcon />
  <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
  <AlertDescription>A conexão caiu no meio do carregamento.</AlertDescription>
  <AlertActions>
    <AlertAction>
      <ArrowPathIcon aria-hidden />
      Tentar novamente
    </AlertAction>
  </AlertActions>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="destructive">
          <XCircleIcon />
          <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
          <AlertDescription>
            A conexão caiu no meio do carregamento.
          </AlertDescription>
          <AlertActions>
            <AlertAction>
              <ArrowPathIcon aria-hidden />
              Tentar novamente
            </AlertAction>
          </AlertActions>
        </Alert>
        <Alert tone="warning">
          <ExclamationTriangleIcon />
          <AlertTitle>Orçamento de Mercado em 88%</AlertTitle>
          <AlertDescription>
            Faltam 9 dias para o mês virar.
          </AlertDescription>
          <AlertActions>
            <AlertAction>Revisar orçamento</AlertAction>
            <AlertAction>Ver gastos</AlertAction>
          </AlertActions>
        </Alert>
      </DocSection>

      <DocSection
        title="Sem ícone"
        description="O ícone é opcional: sem svg o alerta é de uma coluna só, e o texto começa na borda do respiro."
        code={`<Alert tone="info">
  <AlertTitle>Sem ícone</AlertTitle>
  <AlertDescription>…</AlertDescription>
</Alert>`}
        previewClassName="flex-col items-stretch gap-3"
      >
        <Alert tone="info">
          <AlertTitle>Modo de leitura</AlertTitle>
          <AlertDescription>
            Você entrou por um convite de visualização e não pode editar.
          </AlertDescription>
        </Alert>
        <Alert tone="info" size="sm">
          <AlertTitle>Uma linha só não precisa de descrição.</AlertTitle>
        </Alert>
      </DocSection>

      <PropsTable
        rows={[
          {
            prop: "tone",
            type: '"default" | "info" | "success" | "warning" | "destructive"',
            default: '"default"',
            description:
              "A cor: pinta superfície, borda, ícone e texto, sempre tonal.",
          },
          {
            prop: "variant",
            type: '"soft" | "brand"',
            default: '"soft"',
            description:
              "A forma: soft com moldura, o padrão; brand com o brilho de arco-íris na borda — e sem tone.",
          },
          {
            prop: "size",
            type: '"sm" | "md"',
            default: '"md"',
            description:
              "O corpo; sm é o aviso que fala com um campo.",
          },
          {
            prop: "role",
            type: '"alert" | "status" | string',
            default: "derivado do tom",
            description:
              "só destructive sai como alert (assertivo); todo o resto, status.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "AlertTitle",
            type: "div",
            description:
              "O resumo, a primeira linha que o leitor de tela anuncia.",
          },
          {
            prop: "AlertDescription",
            type: "div",
            description:
              "O detalhe, na tinta do alerta a 85%.",
          },
          {
            prop: "AlertActions",
            type: "div",
            description:
              "A linha da saída, no pé e alinhada ao texto.",
          },
          {
            prop: "AlertAction",
            type: "Button",
            description:
              "A ação: Button tertiary que herda a tinta do tom; aceita asChild.",
          },
        ]}
      />

      <DocNote title="Houve um variant=&quot;plain&quot;, e ele saiu">
          Era o aviso tingido <strong>sem borda</strong>, para dentro de formulário ou diálogo — onde a moldura já é de outro e mais uma só acrescenta um retângulo. Tinha 8 chamadas em 4 telas de acesso e saiu a pedido do dono. O custo está dito: esses avisos passaram a desenhar a própria borda dentro do formulário, que é exatamente o que o <code>plain</code> evitava. O caminho de volta é uma linha (<code>border-0</code>).
      </DocNote>

      <DocNote title="Título sem descrição é permitido; descrição sem título não">
          O título é o resumo que faz o olho decidir se vale ler, e o que o leitor de tela anuncia primeiro. Uma descrição solta perde esse resumo.
      </DocNote>

      <DocNote title="No telefone não há brilho, e isso é o custo da escolha">
          O efeito depende de ponteiro, então ele não existe em aparelho de toque — e como o brilho <strong>substituiu</strong> a régua de 2px que esta variante tinha, o que sobra no telefone é a caixa neutra, visualmente igual ao <code>soft</code> de <code>tone=&quot;default&quot;</code>. Nada é montado ali: a pergunta é <code>(hover: hover)</code>, a mesma que o Tailwind faz nos <code>hover:</code>, e sem ela o listener não nasce. Devolver a régua como repouso é uma linha, se a ausência incomodar.
      </DocNote>

      <DocNote title="brand não tem degrau sm — e a razão mudou">
          Na rodada 118 a proibição era <em>geométrica</em>: a régua precisava de 8px de recuo para não encostar no <code>rounded-xl</code>, e numa caixa <code>sm</code> de 34px sobravam 47% de fio. <strong>Essa razão deixou de existir</strong> com a régua — um arco na borda funciona em qualquer altura. O que fica é a razão semântica, que sempre foi a mais forte: <code>sm</code> é o aviso que fala com um campo, e a marca fala uma vez por tela, no corpo inteiro. O tipo continua proibindo o par, agora por isso e só por isso.
      </DocNote>

      <DocNote title="A cor fica parada; quem anda é a janela">
          É o que faz o arco <strong>trocar de cor</strong> conforme viaja pela borda — na aresta direita ele sai oliva e âmbar, na esquerda magenta. O <code>background</code> é um <code>repeating-conic-gradient</code> de ângulo <em>fixo</em>, e quem carrega o <code>--alert-glow-start</code> é a máscara. Medido no bundle ao vivo da referência, que faz exatamente isso. A máscara é <strong>uma camada só</strong>: a referência compõe duas com <code>mask-composite: intersect</code> para recortar o anel, e aqui esse trabalho é do par <code>padding-box</code>/<code>border-box</code> — onde a máscara apaga aparece o <code>bg-card</code> do próprio alerta, idêntico ao núcleo. Compor duas continua banido: uma camada <code>none</code> num <code>intersect</code> apaga a peça.
      </DocNote>

      <DocNote title="O volume mora num token, e não nas paradas">
          O brilho é multiplicado por <code>--alert-glow-opacity</code> (0,5), e o arco tem envelope de alfa: as duas extremidades entram em 20% e 60% antes do miolo opaco, então ele nasce e morre em vez de cortar seco. Em opacidade cheia ele saía berrante ao lado da referência, onde o fio é fraco e fino. <strong>Quem for mexer no volume mexe no multiplicador</strong> — baixar as paradas do meio tiraria a cor junto com a força.
      </DocNote>

      <DocNote title="Duas tentativas erradas antes desta, e elas se opõem">
          A <strong>1ª</strong> mascarava o <code>--brand-rainbow</code>, que é <em>linear</em>: a janela revelava só o pedaço da rampa naquela aresta e acendia <strong>uma cor</strong> — um borrão teal, que lia como sujeira. A <strong>2ª</strong> corrigiu para cônico mas o girou <em>junto</em> com o arco, e aí ele passou a carregar sempre a mesma sequência de cores e só mudar de lugar. O certo é o cônico <strong>parado</strong> com a janela andando por cima. As duas asserções que separam o certo dos dois erros estão no <code>brand-contour.test.ts</code>, e mutação confirma que cada uma pega o seu.
      </DocNote>

      <DocNote title="A rolagem recalcula o brilho, e isso era um bug">
          Rolar move a caixa sem mover o ponteiro. Medido antes do conserto: rolando 260px com o mouse parado, o alerta ia de <code>top 255</code> para <code>-5</code> e o brilho <strong>continuava aceso</strong> apontando para onde o ponteiro não estava mais — só voltava ao normal no movimento seguinte. O conserto é o da referência: guardar a última posição do ponteiro e refazer a conta inteira em <code>scroll</code> e <code>resize</code>, não só remedir a geometria. Com <code>capture: true</code> a mais, que é a única divergência deliberada — <code>scroll</code> não borbulha mas captura, e sem isso a rolagem <em>dentro de um container</em> passa despercebida, um caso que a própria referência erra.
      </DocNote>

      <DocNote title="O rAF aqui coalesce, e o proibido é o laço">
          O trabalho de cada rajada de <code>pointermove</code> vai para <strong>um</strong> <code>requestAnimationFrame</code>, cancelado no anterior e no unmount. O que esta casa recusou (no marcador do <code>Tabs</code>) é o <code>rAF</code> que se <em>re-agenda</em> para fazer polling — outra coisa. É o que permite ler <code>getBoundingClientRect()</code> a cada quadro em vez de cachear: o cache só se invalidava em <code>scroll</code> e <code>resize</code>, e a caixa também se move por reflow, por acordeão abrindo, por imagem carregando.
      </DocNote>

      <DocNote title="Três medições que o código carrega">
          <strong>A @property é inherits: true</strong>, ao contrário das outras quatro da casa: ela é lida num pseudo-elemento, e pseudo não herda propriedade registrada como <code>false</code> — medido, a opacidade ficava em 0 com a variável valendo 1. <strong>isolate é obrigatório</strong>: sem ele o pseudo de <code>z</code> negativo cai atrás do fundo de um ancestral e some. E <strong>com isolate ele passa a pintar por cima do bg-card</strong>, o que cobriria o texto com sete matizes — por isso o núcleo chapado em <code>padding-box</code>, que faz a região apagada ficar idêntica ao cartão.
      </DocNote>

      <DocNote title="Use AlertAction, e não pinte o botão">
          <code>AlertAction</code> é um <code>Button</code> <code>tertiary</code> <code>size=&quot;sm&quot;</code> cuja borda, tinta e realce saem de <code>currentColor</code>: trocar o tom do aviso troca o botão junto. Escrever <code>border-destructive/40</code> ali é reimportar a paleta para dentro da tela.
      </DocNote>

      <DocNote title="Alert, AnnouncementBar e toast não se substituem">
          <code>Alert</code> fica dentro do conteúdo e fala daquela tela. <code>AnnouncementBar</code> atravessa o topo e fala de estado global — offline, convite, manutenção —, e é dispensável. <code>toast</code> confirma o que acabou de acontecer e some. Um <code>Alert</code> fixado no topo com <code>rounded-none border-x-0</code> é uma <code>AnnouncementBar</code> escrita com o componente errado.
      </DocNote>
    </>
  )
}
