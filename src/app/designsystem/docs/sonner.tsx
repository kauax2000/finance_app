"use client"


import { Button } from "@/components/ui/button"
import { MoneyDisplay } from "@/components/ui/money-display"
import {
  toastError,
  toastInfo,
  toastPill,
  toastProgress,
  toastPromise,
  toastSuccess,
  toastUndo,
  toastWarning,
} from "@/lib/toast"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

function DemoProgresso() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const id = "ds-importar"
        let pct = 0
        toastProgress(id, "Importando extrato", pct, { description: "nubank-março.ofx" })
        const passo = window.setInterval(() => {
          pct += 12 + Math.random() * 14
          if (pct >= 100) {
            window.clearInterval(passo)
            toastSuccess("Extrato importado", {
              id,
              description: "42 transações novas",
              action: { label: "Ver", href: "/designsystem/sonner#ver" },
            })
            return
          }
          toastProgress(id, "Importando extrato", pct, { description: "nubank-março.ofx" })
        }, 450)
      }}
    >
      importar extrato
    </Button>
  )
}

export default function SonnerDoc() {
  return (
    <>
      <Usage>
        Confirmação passageira do que <strong>acabou de acontecer</strong>, fora
        do fluxo. Nunca ponha nele informação que a pessoa vai precisar depois:
        ele some sozinho. Chame sempre pelos helpers de <code>@/lib/toast</code> —
        são eles que levam a duração, o assunto e a contagem.
      </Usage>

      <DocSection
        title="A placa e os tipos"
        description="A placa flutuante da casa, em vidro como os outros flutuantes — --popover a 85% (60% no escuro) com o borrão, o anel de 1px, a sombra e o raio 18. O tom mora no poço do ícone, e não na superfície: uma pilha de três não sai em três cores."
        code={`toastSuccess("Transação salva")
toastError("Não foi possível salvar")
toastWarning("Orçamento no limite")
toastInfo("Sincronizando com o servidor")`}
      >
        <Button variant="outline" onClick={() => toastSuccess("Transação salva", { description: "Mercado · ontem" })}>
          sucesso
        </Button>
        <Button variant="outline" onClick={() => toastInfo("Sincronizando com o servidor")}>
          info
        </Button>
        <Button variant="outline" onClick={() => toastWarning("Mercado atingiu 88% do orçamento do mês")}>
          aviso
        </Button>
        <Button variant="outline" onClick={() => toastError("Não foi possível salvar o cartão")}>
          erro
        </Button>
      </DocSection>

      <DocSection
        title="Valor, ações e o Ver"
        description="A descrição aceita um nó — um MoneyDisplay, um avatar. A ação principal é o secondary em pílula; a segunda (cancel) não preenche. Com href, a ação navega pelo roteador: é o Ver depois de criar."
        code={`toastSuccess("Transação salva", {
  description: <MoneyDisplay value={-128.4} signed />,
  action: { label: "Ver", href: \`/transactions?transaction=\${id}\` },
})

toastInfo("Nova versão disponível", {
  action: { label: "Atualizar", onClick: atualizar },
  cancel: { label: "Agora não" },
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toastSuccess("Transação salva", {
              description: <MoneyDisplay value={-128.4} signed size="sm" />,
              action: { label: "Ver", href: "/designsystem/sonner#ver" },
            })
          }
        >
          com valor e ver
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toastInfo("Nova versão disponível", {
              description: "Recarregue para usar a versão 2.4",
              action: { label: "Atualizar", onClick: () => toastPill("Atualizado") },
              cancel: { label: "Agora não" },
            })
          }
        >
          duas ações
        </Button>
      </DocSection>

      <DocSection
        title="Desfazer"
        description="O botão é o mesmo de toda ação, com uma roda que esvazia no tempo do toast antes do rótulo, e o resultado troca a mesma bolha — Desfazendo…, e depois Restaurada — em vez de empilhar outra. Um toast com desfazer substitui o diálogo de confirmação; um ou outro, nunca os dois."
        code={`toastUndo("Transação excluída", {
  description: "Mercado · −R$ 128,40",
  onUndo: () => restaurar(id), // pode devolver Promise
  undone: "Transação restaurada",
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toastUndo("Transação excluída", {
              description: "Mercado · −R$ 128,40",
              onUndo: () => new Promise((r) => setTimeout(r, 900)),
              undone: "Transação restaurada",
            })
          }
        >
          excluir com desfazer
        </Button>
      </DocSection>

      <DocSection
        title="Operação longa e progresso"
        description="toastPromise vai do carregando ao resultado na mesma bolha. toastProgress mostra a porcentagem e é chamado de novo com o mesmo id a cada passo; no fim, um toastSuccess com o id a substitui."
        code={`toastPromise(sincronizar(), {
  loading: "Sincronizando",
  success: "Tudo sincronizado",
  error: "Não foi possível sincronizar",
})

toastProgress("importar", "Importando extrato", 42)
toastSuccess("Extrato importado", { id: "importar" })`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toastPromise(new Promise((r) => setTimeout(r, 2200)), {
              loading: "Sincronizando",
              success: "Tudo sincronizado",
              error: "Não foi possível sincronizar",
            })
          }
        >
          sincronizar
        </Button>
        <DemoProgresso />
      </DocSection>

      <DocSection
        title="Pílula"
        description="A confirmação de uma palavra — Copiado, Salvo —, no mesmo canto dos outros avisos, sem × e por dois segundos. Para copiar, a confirmação no próprio botão (Tooltip confirmation) costuma ser melhor: ela aparece onde o dedo está."
        code={`toastPill("Link copiado")`}
      >
        <Button variant="outline" onClick={() => toastPill("Link copiado")}>
          copiar link
        </Button>
        <Button variant="outline" onClick={() => toastPill("Sem conexão", "warning")}>
          sem conexão
        </Button>
      </DocSection>

      <DocSection
        title="Repetidos e assunto"
        description="O mesmo aviso com a bolha à vista não empilha: ela mostra ×2, ×3 e o tempo recomeça. Com id, o toast é um assunto — o sucesso do formulário substitui o erro dele."
        code={`toastError("Sem conexão com o servidor") // ×2, ×3…

toastError("Não foi possível salvar", { id: "salvar-cartao" })
toastSuccess("Cartão salvo", { id: "salvar-cartao" }) // a mesma bolha`}
      >
        <Button variant="outline" onClick={() => toastError("Sem conexão com o servidor")}>
          erro repetido
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            toastError("Não foi possível salvar o cartão", { id: "ds-salvar" })
            window.setTimeout(() => toastSuccess("Cartão salvo", { id: "ds-salvar" }), 1600)
          }}
        >
          erro, depois salvo
        </Button>
      </DocSection>

      <DocNote title="O tom mora no poço">
        A superfície é a mesma nos cinco tipos; o ícone vai num poço de 28px na superfície <code>-muted</code> do tom, com a tinta dele. Até a rodada 227 o toast inteiro era pintado como um <code>Alert</code>, e um aviso passageiro gritava como um que fica na tela.
      </DocNote>

      <DocNote title="A pausa é honesta">
        O tempo para com o cursor em cima da pilha, com o foco dentro dela (Tab, ou ⌥T, que leva o foco à pilha) e com a aba escondida Esc fecha o toast que tem o foco.
      </DocNote>

      <DocNote title="Erro interrompe">
        A região do sonner é <code>polite</code>; o título de um erro entra com <code>role=&quot;alert&quot;</code>, para o leitor de tela não esperar a frase acabar.
      </DocNote>

      <DocNote title="A física é do sonner, de propósito">
        Empilhamento (três à vista, abrindo no cursor), arraste para dispensar — no telefone, para cima ou para o lado —, <code>promise</code> e deduplicação por <code>id</code> são dele; a entrada e a pilha andam na mola da casa, e a saída não. No telefone ele ocupa a largura menos 16px de cada lado e desce abaixo do cabeçalho.
      </DocNote>

      <DocNote title="Erro que exige ação não é toast">
        Se a pessoa precisa fazer algo a respeito, a mensagem tem que ficar: um <code>Alert</code> na tela ou um <code>FieldError</code> no campo.
      </DocNote>

      <PropsTable
        title="Helpers de @/lib/toast"
        rows={[
          { prop: "toastSuccess / toastError", type: "(message, opts?)", default: "4000 / 6000 ms", description: "Um sucesso se percebe; um erro se lê." },
          { prop: "toastWarning / toastInfo", type: "(message, opts?)", default: "5000 / 4000 ms", description: "Atenção e aviso neutro." },
          { prop: "opts.description", type: "ReactNode", default: "—", description: "A segunda linha: texto, valor, avatar." },
          { prop: "opts.id", type: "string", default: "—", description: "O assunto: o mesmo id substitui a bolha em vez de empilhar." },
          { prop: "opts.action / opts.cancel", type: "{ label, onClick } | { label, href } / { label, onClick? }", default: "—", description: "A ação principal (com href, navega) e a secundária." },
          { prop: "toastUndo", type: "(message, { onUndo, undone?, undoError?, description?, label? })", default: "8000 ms", description: "A roda de contagem e o resultado na mesma bolha; onUndo pode devolver Promise." },
          { prop: "toastPromise", type: "(promise, { loading, success, error, action? })", default: "—", description: "Do carregando ao resultado, sem empilhar." },
          { prop: "toastProgress", type: "(id, message, value, { description? })", default: "—", description: "A porcentagem na mesma bolha; termine com toastSuccess(…, { id })." },
          { prop: "toastPill", type: "(message, tipo?)", default: "2000 ms", description: "A confirmação de uma palavra, no canto dos outros avisos." },
          { prop: "toastPageFetchError", type: "(pageId, message)", default: "6000 ms", description: "Substitui o erro anterior daquela página." },
          { prop: "toastPersistentAction", type: "(message, { id, label, onClick })", default: "sem fim", description: "O aviso que espera uma decisão." },
        ]}
      />
    </>
  )
}
