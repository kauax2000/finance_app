"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogConfirmInput,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogError,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogList,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function AlertDialogDoc() {
  return (
    <>
      <Usage>
        Confirmação de uma ação <strong>sem volta</strong>: excluir uma transação, sair de uma carteira. Não use para perguntas comuns — um diálogo que aparece sempre deixa de ser lido. Para uma tarefa, como preencher um formulário, use <code>Dialog</code>; para o que dá para desfazer, o toast com &ldquo;Desfazer&rdquo;.
      </Usage>

      <DocSection
        title="Padrão"
        description="A descrição diz o que acontece, não pergunta de novo. A ação repete o verbo — “Excluir”, não “Confirmar” — e já vem destructive. AlertDialogMedia põe o ícone na linha do título, na cor dele, e a descrição passa embaixo na largura toda: a lixeira no destructive."
        code={`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Excluir</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogMedia tone="destructive" />
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
        previewClassName="flex-wrap gap-3"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">excluir transação</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia tone="destructive" />
              <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
              <AlertDialogDescription>
                Ela sai do extrato e dos totais do mês. Não dá para desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>cancelar</AlertDialogCancel>
              <AlertDialogAction>excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">fechar fatura</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia tone="warning" />
              <AlertDialogTitle>Fechar a fatura de março?</AlertDialogTitle>
              <AlertDialogDescription>
                Depois de fechada, novos lançamentos entram na fatura de abril.
                O fechamento não é reversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>cancelar</AlertDialogCancel>
              <AlertDialogAction variant="primary">fechar fatura</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocSection>

      <DocNote title="Confirmação que não destrói">
        Quando a consequência é definitiva mas não destrutiva — fechar uma fatura, enviar um convite —, a ação é <code>variant=&quot;primary&quot;</code>, e o ícone, o do tom (<code>warning</code> é o triângulo). É o único caso em que <code>AlertDialogAction</code> recebe <code>variant</code>.
      </DocNote>

      <DocSection
        title="Ação em andamento"
        description="pending na raiz: a ação ganha o Spinner e o pendingLabel e trava, o Cancelar trava, e Esc deixa de fechar — fechar no meio da exclusão deixa a tela mentindo. A tela só diz quando começa e quando termina."
        code={`<AlertDialog pending={deleting} open={open} onOpenChange={setOpen}>
  …
  <AlertDialogAction
    pendingLabel="Excluindo…"
    onClick={(e) => { e.preventDefault(); void confirmDelete() }}
  >
    Excluir
  </AlertDialogAction>
</AlertDialog>`}
      >
        <AndamentoDemo />
      </DocSection>

      <DocSection
        title="O que acontece, e quando falha"
        description="AlertDialogList é a lista das consequências, dentro da descrição — o leitor de tela a lê como parte do aviso. AlertDialogError é a falha dentro do diálogo, que fica aberto: role=&quot;alert&quot;, entre o cabeçalho e o rodapé."
        code={`<AlertDialogDescription>
  <p>Você deixa de ter acesso a esta carteira.</p>
  <AlertDialogList>
    <li>Os outros membros mantêm tudo.</li>
    <li>Você pode voltar a ser convidado.</li>
  </AlertDialogList>
</AlertDialogDescription>
{error ? <AlertDialogError>{error}</AlertDialogError> : null}`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">sair da carteira</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da carteira?</AlertDialogTitle>
              <AlertDialogDescription>
                <p>Você deixa de ter acesso a esta carteira e aos dados compartilhados.</p>
                <AlertDialogList>
                  <li>Os outros membros mantêm tudo; a carteira não é apagada.</li>
                  <li>Você pode voltar a ser convidado pelo responsável.</li>
                </AlertDialogList>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogError>Não foi possível sair agora. Tente de novo.</AlertDialogError>
            <AlertDialogFooter>
              <AlertDialogCancel>cancelar</AlertDialogCancel>
              <AlertDialogAction>sair da carteira</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocSection>

      <DocSection
        title="Digite para confirmar"
        description="AlertDialogConfirmInput: para o que apaga muito — uma carteira inteira —, a ação só libera quando o texto digitado confere com expected (sem espaços nas pontas). O campo é do diálogo, e volta vazio quando ele fecha."
        code={`<AlertDialogConfirmInput
  expected={workspace.name}
  label="Digite o nome da carteira para confirmar"
/>`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">excluir carteira</Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="lg">
            <AlertDialogHeader>
              <AlertDialogMedia tone="destructive" />
              <AlertDialogTitle>Excluir carteira?</AlertDialogTitle>
              <AlertDialogDescription>
                <p>Esta ação é permanente. Serão removidos desta carteira:</p>
                <AlertDialogList>
                  <li>todas as transações e divisões associadas</li>
                  <li>categorias e orçamentos</li>
                  <li>membros, convites e notificações</li>
                </AlertDialogList>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogConfirmInput
              expected="Casa"
              label={
                <span>
                  Digite o nome da carteira para confirmar:{" "}
                  <span className="font-semibold text-foreground">Casa</span>
                </span>
              }
              placeholder="Nome exato da carteira"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>cancelar</AlertDialogCancel>
              <AlertDialogAction>excluir carteira</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocSection>

      <PropsTable
        title="Props · AlertDialog"
        rows={[
          { prop: "pending", type: "boolean", default: "false", description: "A ação está correndo: trava a ação e o Cancelar, segura o Esc e marca aria-busy." },
          { prop: "open · onOpenChange", type: "do Radix", description: "Controlado ou não." },
        ]}
      />

      <PropsTable
        title="Props · peças"
        rows={[
          {
            prop: "AlertDialogAction · variant",
            type: "as variantes do Button",
            default: '"destructive"',
            description: "primary para a confirmação definitiva que não destrói nada.",
          },
          { prop: "AlertDialogAction · pendingLabel", type: "ReactNode", description: "O rótulo enquanto a raiz está pending; ao lado, o Spinner." },
          {
            prop: "AlertDialogAction · AlertDialogCancel · type",
            type: '"button" | "submit"',
            default: '"button"',
            description: "Explícito de fábrica, para o botão de um alerta dentro de um Form não virar o alvo do Enter.",
          },
          { prop: "AlertDialogMedia · tone", type: '"default" | "info" | "success" | "warning" | "destructive"', default: '"default"', description: "O glifo, na linha do título; children troca o ícone (16/solid)." },
          { prop: "AlertDialogConfirmInput · expected · label", type: "string · ReactNode", description: "O texto que libera a ação, e o rótulo do campo." },
          { prop: "AlertDialogList · AlertDialogError", type: "ul · p", description: "A lista das consequências, dentro da descrição, e a falha, role=alert." },
          { prop: "AlertDialogContent · size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "A largura, a régua do Dialog." },
        ]}
      />

      <DocNote title="O rodapé tem uma hierarquia só">
        <code>AlertDialogCancel</code> é <code>tertiary</code> e vem primeiro; <code>AlertDialogAction</code> é <code>destructive</code>, ou <code>primary</code> quando não destrói nada. Dois botões de contorno pesam igual e obrigam a ler os dois para achar a saída — era o caso da exclusão de carteira até a rodada 201.
      </DocNote>

      <DocNote title="Não repinte a ação">
        Use <code>variant</code>, nunca <code>buttonVariants()</code> ou cor na <code>className</code>: o <code>tailwind-merge</code> troca o fundo mas deixa a borda da variante antiga, e o botão sai com um fio da cor errada. E não escreva o andamento à mão (<code>deleting ? &quot;Excluindo…&quot; : &quot;Excluir&quot;</code>, <code>disabled</code> nos dois botões): é o <code>pending</code>.
      </DocNote>

      <DocNote title="A superfície é a do Dialog">
        Veste <code>dialogContentVariants</code>, com o mesmo <code>size</code> (padrão <code>md</code>), e um teto de altura com rolagem que uma confirmação curta nunca alcança — é para a que leva o campo de digitar, quando o teclado do telefone sobe. Não há <code>layout=&quot;fixed&quot;</code>: confirmação com corpo rolável não é confirmação. O movimento também é o dele: do <code>md</code> para cima brota do centro no gesto dos menus e recolhe nele; abaixo, abre na mola.
      </DocNote>

      <DocNote title="AlertDialog interrompe">
        Ele não fecha clicando fora, e o foco vai para o Cancelar, a opção mais segura. Use-o só quando a resposta importa.
      </DocNote>

      <DocNote title="Onde o app usa">
        Em todas as exclusões — transação, assinatura, conta, cartão, categoria, membro —, na saída e na exclusão de carteira, ao desmarcar o pagamento de uma fatura e no <code>useConfirmDialog</code>. Desde a rodada 201 as que esperam o servidor usam <code>pending</code>, as listas de consequências são <code>AlertDialogList</code>, e a exclusão de carteira, que era um <code>Dialog</code> com o campo escrito à mão, é esta com <code>AlertDialogConfirmInput</code>.
      </DocNote>
    </>
  )
}

/** O andamento de verdade: a ação "corre" por 1,5s, e o Esc não fecha. */
function AndamentoDemo() {
  const [aberto, setAberto] = React.useState(false)
  const [excluindo, setExcluindo] = React.useState(false)

  return (
    <AlertDialog pending={excluindo} open={aberto} onOpenChange={setAberto}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">ver em andamento</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia tone="destructive" />
          <AlertDialogTitle>Excluir esta assinatura?</AlertDialogTitle>
          <AlertDialogDescription>
            As cobranças futuras deixam de aparecer na projeção.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>cancelar</AlertDialogCancel>
          <AlertDialogAction
            pendingLabel="excluindo…"
            onClick={(e) => {
              e.preventDefault()
              setExcluindo(true)
              window.setTimeout(() => {
                setExcluindo(false)
                setAberto(false)
              }, 1500)
            }}
          >
            excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
