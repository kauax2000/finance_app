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
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function AlertDialogDoc() {
  return (
    <>
      <Usage>
        Confirmação de uma ação <strong>sem volta</strong>: excluir uma transação, sair de um workspace. Não use para perguntas comuns — um diálogo que aparece sempre deixa de ser lido.
      </Usage>

      <DocSection
        title="Padrão"
        description="A descrição diz o que acontece, não pergunta de novo. O rótulo da ação repete o verbo — “Excluir”, não “Confirmar” —, porque é o texto do botão que a pessoa lê antes de clicar."
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

      <DocNote title="O rodapé tem uma hierarquia só">
        <code>AlertDialogCancel</code> é <code>ghost</code> e <strong>não recebe variant</strong>. A ação é <code>default</code>, ou <code>destructive</code> quando não tem volta. Cancelar vem primeiro.
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
