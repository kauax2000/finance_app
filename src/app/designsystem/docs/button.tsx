"use client"

import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function ButtonDoc() {
  return (
    <>
      <Usage>
        Toda ação clicável. Se navega, é um link dentro de <code>asChild</code>. Nunca um <code>&lt;div onClick&gt;</code>: ele não recebe foco, não responde ao Enter e não é anunciado como controle.
      </Usage>

      <DocSection
        title="Hierarquia"
        description="Três degraus que descem em peso visual: primary preenche de preto (branco no escuro), secondary de cinza, tertiary não preenche. Uma tela tem um primary só — se dois competem, nenhum é a ação da tela."
        code={`<Button>primary</Button>
<Button variant="secondary">secondary</Button>
<Button variant="tertiary">tertiary</Button>`}
      >
        <Button>primary</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="tertiary">tertiary</Button>
      </DocSection>

      <DocSection
        title="Fora da escada"
        description="outline quando o controle precisa de contorno, destructive para o que não tem volta, link para ação que se comporta como texto (sublinhado sempre; no cursor o traço troca de tinta, do texto para o arco-íris, sem animação), brand para o único CTA de marca da tela — a tecla do primary com o arco-íris em volta, girando enquanto o cursor estiver em cima; brandOutline é o mesmo sem o halo, para onde ele não cabe. Passe o mouse: o link varre o sublinhado da esquerda para a direita, e os dois de marca giram."
        code={`<Button variant="outline">outline</Button>
<Button variant="destructive">destructive</Button>
<Button variant="link">link</Button>
<Button variant="brand">brand</Button>
<Button variant="brandOutline">brandOutline</Button>`}
      >
        <Button variant="outline">outline</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="link">link</Button>
        <Button variant="brand">brand</Button>
        <Button variant="brandOutline">brandOutline</Button>
      </DocSection>

      <DocSection
        title="Tamanhos"
        description="De 24 a 40 em degraus de 4. O padrão é md (32), o corpo da ação comum."
        code={`<Button size="xs">24 · xs</Button>
<Button size="sm">28 · sm</Button>
<Button>32 · md</Button>
<Button size="lg">36 · lg</Button>
<Button size="xl">40 · xl</Button>`}
      >
        <Button size="xs">24 · xs</Button>
        <Button size="sm">28 · sm</Button>
        <Button>32 · md</Button>
        <Button size="lg">36 · lg</Button>
        <Button size="xl">40 · xl</Button>
      </DocSection>

      <DocSection
        title="Só ícone"
        description="icon-xs a icon-xl espelham a escada de texto; ao lado de um botão de texto, use o par (md com icon-md)."
        code={`<Button size="icon-xs" aria-label="icon-xs"><PlusIcon /></Button>
<Button size="icon-sm" aria-label="icon-sm"><PlusIcon /></Button>
<Button size="icon-md" aria-label="icon-md"><PlusIcon /></Button>
<Button size="icon-lg" aria-label="icon-lg"><PlusIcon /></Button>
<Button size="icon-xl" aria-label="icon-xl"><PlusIcon /></Button>`}
      >
        <Button size="icon-xs" aria-label="icon-xs">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-sm" aria-label="icon-sm">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-md" aria-label="icon-md">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-lg" aria-label="icon-lg">
          <PlusIcon aria-hidden />
        </Button>
        <Button size="icon-xl" aria-label="icon-xl">
          <PlusIcon aria-hidden />
        </Button>
      </DocSection>

      <DocSection
        title="Colado a um campo"
        description="Input, SelectTrigger, NativeSelect e ComboboxTrigger falam a mesma escada, então alinham sem declarar size."
        code={`<Input placeholder="Input · md" />
<Button>Button · md</Button>`}
      >
        <div className="flex w-full max-w-sm items-center gap-2">
          <Input placeholder="Input · md" aria-label="Exemplo de campo" />
          <Button>Button · md</Button>
        </div>
      </DocSection>

      <DocSection
        title="Com ícone e desabilitado"
        code={`<Button><PlusIcon aria-hidden />com ícone</Button>
<Button variant="destructive"><TrashIcon aria-hidden />destructive com ícone</Button>
<Button disabled>desabilitado</Button>`}
      >
        <Button>
          <PlusIcon aria-hidden />
          com ícone
        </Button>
        <Button variant="destructive">
          <TrashIcon aria-hidden />
          destructive com ícone
        </Button>
        <Button disabled>desabilitado</Button>
      </DocSection>

      <DocSection
        title="O primário é uma tecla"
        description="Contorno e plinto escuros com um fio de luz no topo. Ao apertar, a tecla afunda; enviando, ela fica afundada com opacidade cheia, porque salvando não é o mesmo que desabilitado."
        code={`<Button>salvar</Button>
<Button disabled>desabilitado</Button>
<FormSubmit pending pendingLabel="salvando">salvar</FormSubmit>`}
      >
        <Button>salvar</Button>
        <Button disabled>desabilitado</Button>
        <FormSubmit pending pendingLabel="salvando">
          salvar
        </FormSubmit>
      </DocSection>

      <DocNote title="O sublinhado do link é ancorado na entrelinha, não no pé do botão">
        O traço arco-íris é <code>background</code>, porque <code>text-decoration</code> não aceita degradê — e ele fica em <code>calc(50% + 0.5lh)</code>, meia entrelinha abaixo do meio da caixa. A versão anterior usava <code>bg-bottom</code>, e como o eixo <code>size</code> só declara recuo <em>lateral</em>, a caixa de conteúdo tem a altura inteira do botão: o traço caía no pé dele, <strong>5,5px abaixo</strong> do sublinhado, e saltava para longe do texto assim que o cursor chegava. Com a âncora o erro é zero em <code>md</code>, <code>lg</code> e <code>xl</code>, e 1px em <code>xs</code> e <code>sm</code>.
      </DocNote>

      <DocNote title="O traço do link é fundo, e isso conserta uma emenda">
        Ele não é <code>text-decoration</code>, e a razão foi medida: o <code>::first-letter</code> da base — a maiúscula inicial do CTA — cria caixa própria para a primeira letra, e a decoração propagada sai <strong>partida em dois segmentos</strong>. Sublinhar também o <code>::first-letter</code>, <code>text-decoration-skip-ink: none</code> e mover a decoração para o <code>&lt;span&gt;</code> mantêm a emenda; só a camada de <code>background</code> a elimina, porque um fundo é uma pintura só. Ela é ancorada em <code>calc(50% + 0.5lh)</code>, que cai no mesmo pixel em que a decoração caía.
      </DocNote>

      <DocNote title="A troca de tinta é seca, e isso é decisão">
        No cursor o traço passa da cor do texto para o arco-íris <strong>sem animação</strong> — <code>background-image</code> é propriedade discreta, então a troca é instantânea sem ninguém pedir. Ele chegou a varrer da esquerda para a direita, a recuar na saída e a ter uma segunda linha no rótulo só para ter timing próprio; foram quatro rodadas de ajuste, e o dono encerrou pedindo a troca seca. O que sobrou não tem transição própria, nem atraso, nem segunda camada.
      </DocNote>

      <DocNote title="brandOutline é o brand onde o halo não cabe">
        O halo do <code>brand</code> é um <code>::after</code> a <code>-inset-1</code>: ele sangra 4px para fora da caixa, e num vizinho próximo — uma barra, um cabeçalho, um par de ações — isso encosta. <code>brandOutline</code> tira a camada do halo e mantém o resto, contorno de 1px e giro incluídos. **Não é um degrau a menos na escada**: continua fora dela, e continua um por tela. O que muda é quanto espaço ele pede em volta.
      </DocNote>

      <DocNote title="O giro do brand pausa, não desliga">
        <code>brand-rainbow-live</code> fica aplicada sempre, com <code>animation-play-state: paused</code>; o cursor e o toque a põem em <code>running</code>. Ligar a animação só dentro do <code>hover:</code> faria o ângulo <strong>voltar a 0°</strong> na saída — pausada, ela congela onde estava e retoma dali. Medido: 119,5° ao sair, e 119,5° um segundo depois. <code>--brand-spin</code> é o botão de velocidade da utility: 6s aqui, contra os 12s do padrão que a marca grande usa. Quem pede menos movimento não vê giro nenhum, porque o bloco global de <code>prefers-reduced-motion</code> isenta só <code>animate-spin</code> e <code>animate-pulse</code>.
      </DocNote>

      <DocNote title="Hover usa --primary-hover, nunca alfa">
        <code>--primary-hover</code> é opaco e escurece nos dois temas. Um alfa
        como <code>bg-primary/90</code> clareava no tema claro e derrubava o
        contraste do rótulo branco; escurecer é o único sentido que o sobe.
      </DocNote>

      <DocNote title="Elevação escura, não luz">
        Contorno e plinto em <code>--primary-edge</code>, e a única luz é o fio
        de 1px no topo. Luz no corpo ou na borda faz o botão inteiro ler mais
        claro. O plinto é sombra interna, então a altura continua alinhada ao
        <code>Input</code>.
      </DocNote>

      <DocNote title="A maiúscula inicial é do sistema">
        O botão embrulha texto cru num <code>span</code> com{" "}
        <code>::first-letter</code>: <code>salvar</code> sai{" "}
        <strong>Salvar</strong>. Para manter minúscula, passe um elemento —{" "}
        <code>&lt;Button&gt;&lt;span&gt;git push&lt;/span&gt;&lt;/Button&gt;</code>{" "}
        sai intacto.
      </DocNote>

      <DocNote title="Não existe size=&quot;default&quot;">
        O nome dizia &ldquo;o padrão&rdquo; e apontava para 36, que deixou de ser
        o padrão. Use <code>lg</code> e <code>icon-lg</code>; nos variants,{" "}
        <code>default</code> virou <code>primary</code> e <code>ghost</code>{" "}
        virou <code>tertiary</code>, para o nome dizer o degrau.
      </DocNote>

      <DocNote title="Rodapé de diálogo: uma hierarquia só">
        Vale para todo <code>Dialog</code> e <code>AlertDialog</code>: cancelar vem antes e é <code>tertiary</code>; a ação é <code>primary</code>, ou <code>destructive</code> quando não tem volta. Dois botões de contorno lado a lado pesam igual.
      </DocNote>

      <DocNote title="type=&quot;submit&quot; é só da ação principal">
        Dentro de um <code>Form</code> o Enter aciona o submit. Cancelar, dispensar e alternar levam <code>type=&quot;button&quot;</code> — sem isso, cancelar vira o alvo do Enter e o formulário fecha em vez de salvar.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"primary" | "secondary" | "tertiary" | "outline" | "destructive" | "link" | "brand" | "brandOutline"',
            default: '"primary"',
            description: "O degrau da hierarquia; outline, destructive, link e brand ficam fora da escada.",
          },
          {
            prop: "size",
            type: '"xs" | "sm" | "md" | "lg" | "xl" | "icon-xs" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl"',
            default: '"md"',
            description: "Altura de 24 a 40; icon-* é quadrado.",
          },
          {
            prop: "asChild",
            type: "boolean",
            default: "false",
            description: "Passa o estilo para o filho. Use com <Link>.",
          },
        ]}
      />
    </>
  )
}
