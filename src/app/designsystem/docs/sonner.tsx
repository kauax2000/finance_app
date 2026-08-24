"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function SonnerDoc() {
  return (
    <>
      <Usage>
        Confirmação passageira do que <strong>acabou de acontecer</strong>, fora
        do fluxo: &ldquo;transação salva&rdquo;, &ldquo;convite enviado&rdquo;.
        Nunca coloque num toast informação que a pessoa vai precisar depois — ele
        some em quatro segundos e não volta.
      </Usage>

      <DocSection
        title="Os tipos"
        description="As cores vêm dos tokens do app, não da paleta da biblioteca."
        code={`toast.success("Transação salva")
toast.error("Não foi possível salvar")
toast.warning("Orçamento no limite")
toast.info("Sincronizando…")`}
      >
        <Button variant="outline" onClick={() => toast("Transação salva")}>
          Neutro
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Transação salva")}
        >
          Sucesso
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info("Sincronizando com o servidor…")}
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning("Mercado atingiu 88% do orçamento do mês")
          }
        >
          Aviso
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error("Não foi possível salvar. Tente de novo.")
          }
        >
          Erro
        </Button>
      </DocSection>

      <DocSection
        title="Com ação de desfazer"
        description="Um toast com “desfazer” é o que permite excluir sem um diálogo de confirmação. Ou um, ou outro — os dois juntos pedem duas decisões pela mesma coisa."
        code={`toast.success("Transação excluída", {
  action: { label: "Desfazer", onClick: () => restaurar() },
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Transação excluída", {
              action: {
                label: "Desfazer",
                onClick: () => toast("Transação restaurada"),
              },
            })
          }
        >
          Excluir com desfazer
        </Button>
      </DocSection>

      <DocNote title="richColors saiu">
        O Toaster rodava com <code>richColors</code>, ou seja, com o verde e o
        vermelho da própria biblioteca — as únicas cores do produto que não
        vinham do <code>globals.css</code>. Hoje cada tipo é remapeado por{" "}
        <code>[data-sonner-toast][data-type=&quot;…&quot;]</code>{" "}
        a partir dos
        tokens semânticos, espelhando as variantes do <code>Alert</code>.
      </DocNote>

      <DocNote title="No telefone ele desce abaixo do cabeçalho">
        <code>mobileOffset</code>{" "}
        soma a área segura do topo aos 4,5rem do
        cabeçalho fixo. Sem isso, o toast aparece sob o notch em telefones com
        recorte.
      </DocNote>

      <DocNote title="Erro que exige ação não é toast">
        Se a pessoa precisa fazer algo a respeito, a mensagem tem que ficar: um{" "}
        <code>Alert</code> na tela ou um <code>FieldError</code>{" "}
        no campo. O
        toast serve para o que ela só precisa saber que aconteceu.
      </DocNote>
    </>
  )
}
