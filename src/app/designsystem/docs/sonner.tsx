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
        description="Chame pelos helpers de @/lib/toast, nunca pelo toast cru: são eles que carregam as durações."
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
        description="Um toast com “desfazer” substitui o diálogo de confirmação — um ou outro, nunca os dois."
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

      <DocNote title="A superfície usa os tokens do Alert">
        Cada tipo lê <code>bg-{"{tom}"}-muted</code>, os mesmos tokens do <code>Alert</code>, e o neutro lê <code>--popover</code>. Receita própria ao lado dos tokens diverge calada, e o preto puro de fábrica do sonner não é cor de superfície neste sistema.
      </DocNote>

      <DocNote title="O tom chega à descrição e aos controles">
        A descrição é <code>currentColor</code> a 85%, como a do <code>Alert</code>: cinza sobre superfície colorida lê como acidente. O &ldquo;Desfazer&rdquo; tem a caixa do <code>Button variant=&quot;tertiary&quot; size=&quot;xs&quot;</code> da <code>AnnouncementBar</code> — contorno em <code>currentColor</code>, anel de foco e afundar ao pressionar. O × cavalga a borda do toast e leva a superfície dele; transparente, leria como furo no canto.
      </DocNote>

      <DocNote title="Tipografia e medidas são as do sistema">
        Inter, corpo da escala, raio 10 e sombra com par no tema escuro. Sem isso o toast herda a fonte do sistema operacional e vira a única superfície do app com outra tipografia.
      </DocNote>

      <DocNote title="O seletor precisa superar o do sonner">
        O sonner injeta a própria folha em tempo de execução, depois da do app, então empatar perde. A superfície usa seletor descendente (0,3,0) e os controles levam <code>[data-styled]</code> (0,4,0).
      </DocNote>

      <DocNote title="Ícones Heroicons pelo prop icons">
        Os ícones de tipo e o × entram pelo prop <code>icons</code>. Os SVGs de fábrica moram em <code>node_modules</code>, fora do alcance do ESLint e do auditor.
      </DocNote>

      <DocNote title="A física é do sonner, de propósito">
        Empilhamento, arraste para dispensar, <code>promise</code>, deduplicação por <code>id</code> e a largura de 356px são dele; só a cromagem é nossa.
      </DocNote>

      <DocNote title="No telefone ele desce abaixo do cabeçalho">
        <code>mobileOffset</code> soma a área segura do topo à altura do cabeçalho fixo, para o toast não ficar sob o recorte. Fica no topo porque embaixo está a barra de navegação, o alvo de toque mais usado do app.
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
              "Atenção e aviso neutro.",
          },
          {
            prop: "toastUndo",
            type: "(message, { onUndo, label?, description? })",
            default: "8000 ms",
            description:
              "A duração mais longa da casa: é a janela de arrependimento.",
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
