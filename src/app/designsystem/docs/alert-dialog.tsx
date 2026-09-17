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
        Confirmação de uma ação <strong>sem volta</strong>: excluir uma transação, sair de uma carteira. Não use para perguntas comuns — um diálogo que aparece sempre deixa de ser lido. Para uma tarefa, como preencher um formulário, use <code>Dialog</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="A descrição diz o que acontece, não pergunta de novo. A ação repete o verbo — “Excluir”, não “Confirmar” — e já vem destructive."
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
        description="Quando a consequência é definitiva mas não destrutiva — fechar uma fatura, enviar um convite —, a ação é primary. É o único caso em que AlertDialogAction recebe variant."
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
        description="AlertDialogAction é um Button: disabled e rótulo que muda saem sem className. Cancelar desabilita junto — sair no meio da exclusão deixa a tela mentindo."
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
              "Os dois são Button e aceitam variant, size, disabled e asChild.",
          },
          {
            prop: "type",
            type: '"button" | "submit"',
            default: '"button"',
            description:
              "Explícito de fábrica, para o botão de um alerta dentro de um Form não virar o alvo do Enter.",
          },
        ]}
      />

      <DocNote title="O rodapé tem uma hierarquia só">
        <code>AlertDialogCancel</code> é <code>tertiary</code> e vem primeiro; <code>AlertDialogAction</code> é <code>destructive</code>, ou <code>primary</code> quando não destrói nada. Dois botões de contorno pesam igual e obrigam a ler os dois para achar a saída.
      </DocNote>

      <DocNote title="Não repinte a ação">
        Use <code>variant</code>, nunca <code>buttonVariants()</code> ou cor na <code>className</code>: o <code>tailwind-merge</code> troca o fundo mas deixa a borda da variante antiga, e o botão sai com um fio da cor errada.
      </DocNote>

      <DocNote title="A superfície é a do Dialog">
        Veste <code>dialogContentVariants</code>, com o mesmo <code>size</code> (padrão <code>md</code>) e o vidro do cabeçalho. Não há <code>layout=&quot;fixed&quot;</code>: confirmação com corpo rolável não é confirmação.
      </DocNote>

      <DocNote title="AlertDialog interrompe">
        Ele não fecha clicando fora, e o foco vai para a opção mais segura. Use-o só quando a resposta importa.
      </DocNote>
    </>
  )
}
