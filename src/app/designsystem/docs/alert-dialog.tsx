"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function AlertDialogDoc() {
  return (
    <>
      <Usage>
        Confirmação de uma ação <strong>sem volta</strong>: excluir uma
        transação, sair de uma carteira. Não use para perguntas comuns — um
        diálogo que aparece sempre deixa de ser lido. Ele mede pela mesma régua
        do <code>Dialog</code> (<code>size</code>, padrão <code>md</code>) e não
        oferece <code>layout=&quot;fixed&quot;</code>: uma confirmação que
        precisa de corpo rolável não é uma confirmação.
      </Usage>

      <DocSection
        title="Padrão"
        description="A descrição diz o que acontece, não pergunta de novo. O rótulo da ação repete o verbo — “Excluir”, não “Confirmar” —, porque é o texto do botão que a pessoa lê antes de clicar. A ação já vem destructive: um AlertDialog existe para o que não tem volta, e foi o que oito de oito confirmações do app pediram."
        code={`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
      <AlertDialogDescription>
        Ela sai do extrato e dos totais do mês. Não dá para desfazer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Excluir transação</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
              <AlertDialogDescription>
                Ela sai do extrato e dos totais do mês. Não dá para desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocSection>

      <DocSection
        title="Confirmação que não destrói"
        description="Nem toda ação sem volta apaga alguma coisa. Quando a consequência é definitiva mas não destrutiva — fechar uma fatura, enviar um convite —, a ação é primary. É o único caso em que AlertDialogAction recebe variant, e o nome passa a dizer o que a tela quis."
        code={`<AlertDialogAction variant="primary">Fechar fatura</AlertDialogAction>`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Fechar fatura</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fechar a fatura de março?</AlertDialogTitle>
              <AlertDialogDescription>
                Depois de fechada, novos lançamentos entram na fatura de abril.
                O fechamento não é reversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="primary">
                Fechar fatura
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocSection>

      <DocSection
        title="Ação em andamento"
        description="Como AlertDialogAction é um Button de verdade, disabled, o rótulo que muda e o size vêm de graça — sem className, sem repintar o botão. Cancelar desabilita junto: sair no meio de uma exclusão que já começou deixa a tela mentindo sobre o que aconteceu."
        code={`<AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
<AlertDialogAction
  disabled={deleting}
  onClick={(e) => { e.preventDefault(); void confirmDelete() }}
>
  {deleting ? "Excluindo…" : "Excluir"}
</AlertDialogAction>`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Ver estado ocupado</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta carteira?</AlertDialogTitle>
              <AlertDialogDescription>
                As transações, categorias e cartões dela vão junto.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled>Excluindo…</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocSection>

      <PropsTable
        title="Props · AlertDialogAction e AlertDialogCancel"
        rows={[
          {
            prop: "variant",
            type: "as variantes do Button",
            default: '"destructive" na ação, "tertiary" no cancelar',
            description:
              "Os dois são Button de verdade, e aceitam tudo o que ele aceita — variant, size, disabled, asChild. Antes eram as classes carimbadas num primitivo do Radix, sem prop nenhuma.",
          },
          {
            prop: "type",
            type: '"button" | "submit"',
            default: '"button"',
            description:
              "Explícito de fábrica, para o botão de um alerta dentro de um CustomForm não virar o alvo do Enter.",
          },
        ]}
      />

      <DocNote title="O rodapé tem uma hierarquia só">
        <code>AlertDialogCancel</code> é <code>tertiary</code> e vem primeiro;{" "}
        <code>AlertDialogAction</code> é <code>destructive</code>, ou{" "}
        <code>primary</code> quando a confirmação não destrói nada. Dois botões
        de contorno lado a lado pesam igual, e o olho tem que ler os dois para
        descobrir qual é a saída.
      </DocNote>

      <DocNote title="A ação é um Button, e isso tem consequência">
        Antes eram <code>buttonVariants()</code> carimbado num primitivo do
        Radix — e é o caso que o próprio design system já registrava: a
        maiúscula inicial do CTA vem do <code>&lt;span&gt;</code> que o{" "}
        <code>Button</code> embrulha, e ali não havia <code>span</code>. Sem{" "}
        <code>variant</code>, as oito confirmações do app repintaram o botão à
        mão: cinco com <code>buttonVariants(&#123; variant: &quot;destructive&quot; &#125;)</code> e
        três com um vermelho sólido inventado na tela. Nessas três,{" "}
        <code>tailwind-merge</code> resolvia o fundo mas não tinha o que fazer
        com a borda — o <code>border-primary</code> do <code>primary</code>{" "}
        sobrevivia embaixo, e o botão de excluir saía vermelho com um fio verde
        em volta.
      </DocNote>

      <DocNote title="AlertDialog ou Dialog?">
        AlertDialog interrompe: ele não fecha clicando fora, e o foco vai para a
        opção mais segura. Use-o só quando a resposta importa. Para uma tarefa —
        preencher um formulário, escolher uma categoria — o componente é{" "}
        <code>Dialog</code>.
      </DocNote>
    </>
  )
}
