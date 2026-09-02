"use client"

import { Button } from "@/components/ui/button"
import {
  toastError,
  toastInfo,
  toastPromise,
  toastSuccess,
  toastUndo,
  toastWarning,
} from "@/lib/toast"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function SonnerDoc() {
  return (
    <>
      <Usage>
        Confirmação passageira do que <strong>acabou de acontecer</strong>, fora
        do fluxo. Nunca ponha nele informação que a pessoa vai precisar depois:
        some em quatro segundos e não volta.
      </Usage>

      <DocSection
        title="Os tipos"
        description="Chame pelos helpers de @/lib/toast, e não pelo toast cru da biblioteca: eles é que carregam as durações — um sucesso e um erro não duram o mesmo tempo."
        code={`toastSuccess("Transação salva")
toastError("Não foi possível salvar")
toastWarning("Orçamento no limite")
toastInfo("Sincronizando…")`}
      >
        <Button variant="outline" onClick={() => toastSuccess("Transação salva")}>
          Sucesso
        </Button>
        <Button
          variant="outline"
          onClick={() => toastInfo("Sincronizando com o servidor…")}
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toastWarning("Mercado atingiu 88% do orçamento do mês")}
        >
          Aviso
        </Button>
        <Button
          variant="outline"
          onClick={() => toastError("Não foi possível salvar. Tente de novo.")}
        >
          Erro
        </Button>
      </DocSection>

      <DocSection
        title="Com ação de desfazer"
        description="Um toast com “desfazer” é o que permite excluir sem um diálogo de confirmação. Ou um, ou outro — os dois juntos pedem duas decisões pela mesma coisa."
        code={`toastUndo("Transação excluída", {
  description: "Mercado · −R$ 128,40",
  onUndo: () => restaurar(),
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toastUndo("Transação excluída", {
              description: "Mercado · −R$ 128,40",
              onUndo: () => toastSuccess("Transação restaurada"),
            })
          }
        >
          Excluir com desfazer
        </Button>
      </DocSection>

      <DocSection
        title="Operação longa"
        description="Sincronizar, importar, gerar relatório. Sem isso, entre o clique e o resultado não há nada — e a pessoa clica de novo."
        code={`toastPromise(sincronizar(), {
  loading: "Sincronizando…",
  success: "Tudo sincronizado",
  error: "Não foi possível sincronizar",
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toastPromise(
              new Promise((resolve) => setTimeout(resolve, 2200)),
              {
                loading: "Sincronizando…",
                success: "Tudo sincronizado",
                error: "Não foi possível sincronizar",
              }
            )
          }
        >
          Sincronizar
        </Button>
      </DocSection>

      <DocNote title="A superfície é a mesma do Alert — agora de verdade">
        O CSS dizia &ldquo;espelhando as variantes do <code>Alert</code>&rdquo; e
        não espelhava: o Alert usa o token <code>bg-{"{tom}"}-muted</code>, e
        aqui havia <code>color-mix(--{"{tom}"} 10%, --popover)</code> — uma
        segunda receita para a mesma coisa. Medido no claro, o mesmo aviso saía
        em dois cremes: <strong>255,243,216</strong> no Alert contra{" "}
        <strong>252,243,230</strong> no toast, distância RGB 14. Os outros três
        ficavam entre 6 e 9.
        <br />
        <br />
        Nenhum reprovava em contraste, então isto nunca foi acessibilidade — era
        uma medida escrita à mão ao lado de outra que precisava concordar com
        ela. Hoje os dois usam os mesmos tokens: <strong>distância 0</strong>{" "}
        nos quatro tons, nos dois temas.
      </DocNote>

      <DocNote title="O toast sem tipo estava em preto puro">
        Não havia regra para o neutro nem para o <code>loading</code> do{" "}
        <code>toastPromise</code>. No tema claro isso passou batido porque o
        branco do sonner e o <code>--popover</code> coincidem. No escuro a
        coincidência quebra: medido, o fundo saía <strong>0,0,0</strong> contra
        os <code>23,23,23</code> do <code>--popover</code>, e a borda{" "}
        <code>51,51,51</code> contra <code>25,26,26</code>.{" "}
        <strong>Preto puro é uma cor que este design system não usa em
        superfície nenhuma</strong> — a página é 37,37,37 —, então o toast
        neutro era um retângulo mais escuro que tudo em volta.
      </DocNote>

      <DocNote title="O tom chega ao texto miúdo e aos controles">
        A descrição saía num cinza neutro sobre a superfície verde. É literalmente a decisão que o <code>Alert</code>{" "}
        documenta e reverteu: cinza sobre superfície colorida passa na norma mas
        lê como texto que caiu ali por acidente. Hoje ela é{" "}
        <code>currentColor</code> a 85%, como o <code>AlertDescription</code>.
        <br />
        <br />
        O × tinha borda cinza e tinta quase preta sobre um toast verde, e o
        &ldquo;Desfazer&rdquo; era um preenchido invertido. Os dois passaram a
        contorno e <code>currentColor</code>, que é o que o{" "}
        <code>AlertActions</code> documenta: a mesma linha servindo os cinco
        tons.
        <br />
        <br />
        <strong>Mas o fundo dos dois é diferente, e ignorar isso custou um
        bug.</strong> O botão de ação vive <em>dentro</em> do toast, então
        fantasma é o certo. O × é <code>position: absolute</code> e{" "}
        <strong>cavalga a borda</strong> — medido, ele sai 6px para fora em cima
        e à esquerda. Transparente, esses 6px mostravam a página e o círculo
        lia como um furo no canto. Ele leva a superfície do próprio toast.
        <br />
        <br />
        <strong>E a borda só apareceu quando ganhou largura.</strong> Havia
        apenas <code>border-color</code>: a cor era aplicada — verificável no
        elemento — e a borda nunca desenhava, porque o sonner deixa{" "}
        <code>border-style: none</code>. O &ldquo;Desfazer&rdquo; saía como
        texto pelado. Com os três, o botão fica <strong>idêntico ao da{" "}
        <code>AnnouncementBar</code></strong>: 24 de altura, <code>0 8px</code>{" "}
        de recuo, raio 10, corpo 12, peso 500 e contorno em{" "}
        <code>currentColor/25</code> — que é o <code>Button
        variant=&quot;tertiary&quot; size=&quot;xs&quot;</code> que ela usa.
        Aqui não dá para usar o componente, porque quem renderiza é o sonner; dá
        para chegar na mesma caixa — e chegar na mesma caixa foi mais do que a
        borda. Um diff dos 693 computados contra o botão da barra acusava{" "}
        <strong>14 diferenças</strong>, e as que importavam eram de estado:{" "}
        <strong>nenhum anel de foco</strong> (medido:{" "}
        <code>box-shadow: none</code> num controle alcançável por teclado), sem
        o afundar ao pressionar, e o realce em 400ms com a curva do navegador
        contra os 150ms e a curva do Tailwind. Hoje o diff dá{" "}
        <strong>zero</strong>.
      </DocNote>

      <DocNote title="Ele estava na fonte do sistema operacional">
        As cores vieram para os tokens numa rodada anterior, e o trabalho parou
        ali. Medido depois: <code>font-family: ui-sans-serif, system-ui,
        -apple-system, &quot;Segoe UI&quot;, Roboto…</code> — o toast era{" "}
        <strong>a única superfície do app que trocava de tipografia com o
        sistema operacional</strong>, enquanto tudo em volta é Inter. Em 222
        pontos de uso. Junto vieram o corpo (13px, fora da escala), o raio (8
        contra 10) e uma sombra cravada sem par no tema escuro.
      </DocNote>

      <DocNote title="Empatar a especificidade não bastou">
        O sonner declara raio e sombra em{" "}
        <code>[data-sonner-toast][data-styled=true]</code> — 0,2,0 — e{" "}
        <strong>injeta a própria folha em tempo de execução</strong>, ou seja
        depois da folha do app. Com a mesma especificidade, quem vem depois
        ganha: medido, o raio continuou 8px. O seletor da superfície é
        descendente (0,3,0).
        <br />
        <br />
        E os <strong>controles</strong> precisaram de um degrau a mais: o sonner
        os declara em <code>[data-styled]</code>, que também é 0,3,0, e com o
        empate a cor e a borda pegavam mas o <strong>preenchimento não</strong> —
        o &ldquo;Desfazer&rdquo; continuava um bloco invertido, medido. Com{" "}
        <code>[data-styled]</code> no seletor daqui são 0,4,0, e aí vence.
      </DocNote>

      <DocNote title="Os ícones agora são Heroicons">
        Os da biblioteca não eram — medido no DOM:{" "}
        <code>viewBox=&quot;0 0 20 20&quot;</code> sem <code>data-slot</code> no
        ícone de tipo, <code>0 0 24 24</code> no ×. É a regra <strong>G</strong>{" "}
        do projeto, e era o único lugar onde ela vazava sem nenhum guarda pegar:
        o ESLint olha imports e o auditor olha o repositório, e esses SVGs moram
        em <code>node_modules</code>.
      </DocNote>

      <DocNote title="A física é do sonner, e é de propósito">
        Empilhamento, arraste para dispensar, <code>promise</code>,
        deduplicação por <code>id</code> e a largura de 356px continuam sendo
        dele. Só a cromagem é nossa — é o mesmo julgamento da rodada do{" "}
        <code>vaul</code>: pega-se o mecanismo emprestado e veste-se o desenho
        próprio.
      </DocNote>

      <DocNote title="No telefone ele desce abaixo do cabeçalho">
        <code>mobileOffset</code> soma a área segura do topo aos 4,5rem do
        cabeçalho fixo. Sem isso, o toast aparece sob o notch em telefones com
        recorte. No topo e não no rodapé porque embaixo está a ilha de
        navegação, e um toast sobre ela cobre o alvo de toque mais usado do app.
      </DocNote>

      <DocNote title="Erro que exige ação não é toast">
        Se a pessoa precisa fazer algo a respeito, a mensagem tem que ficar: um{" "}
        <code>Alert</code> na tela ou um <code>FieldError</code> no campo. O
        toast serve para o que ela só precisa saber que aconteceu.
      </DocNote>

      <PropsTable
        title="Helpers de @/lib/toast"
        rows={[
          {
            prop: "toastSuccess / toastError",
            type: "(message: string) => void",
            default: "4000 / 6000 ms",
            description: "Um sucesso se percebe; um erro se lê. Daí a diferença.",
          },
          {
            prop: "toastWarning / toastInfo",
            type: "(message: string) => void",
            default: "5000 / 4000 ms",
            description:
              "toastInfo faltava — o tipo já estava estilizado no CSS e não tinha helper.",
          },
          {
            prop: "toastUndo",
            type: "(message, { onUndo, label?, description? })",
            default: "8000 ms",
            description:
              "A duração mais longa da casa: é a janela de arrependimento, não a de uma confirmação.",
          },
          {
            prop: "toastPromise",
            type: "(promise, { loading, success, error })",
            description:
              "Troca a mesma bolha de carregando para o resultado, sem empilhar duas.",
          },
          {
            prop: "toastPageFetchError",
            type: "(pageId: string, message: string)",
            description:
              "Substitui o erro anterior daquela página, em vez de empilhar a cada tentativa.",
          },
        ]}
      />
    </>
  )
}
