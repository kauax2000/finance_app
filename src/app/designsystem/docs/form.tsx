"use client"

import * as React from "react"
import Link from "next/link"
import { EnvelopeIcon, PhoneIcon, UserIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Form,
  FormActions,
  FormCancel,
  FormControl,
  FormError,
  FormField,
  FormInput,
  FormPickerPopover,
  FormPickerPopoverContent,
  FormPickerPopoverEmpty,
  FormPickerPopoverFooter,
  FormPickerPopoverFooterAction,
  FormPickerPopoverItem,
  FormPickerPopoverList,
  FormPickerPopoverPlaceholder,
  FormPickerPopoverSearch,
  FormPickerPopoverTrigger,
  FormSubmit,
  FormSwitch,
  FormTextarea,
} from "@/components/ui/form"
import {
  Field,
  FieldControl,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Controles, DocNote, DocSection, Eixo, Interruptor, Interruptores, PropsTable, Usage } from "../ds-doc"
import { IphoneFrame } from "../ds-frame"

export default function FormDoc() {
  return (
    <>
      <Usage>
          O formulário do projeto: o <code>&lt;form&gt;</code>, o contrato do <Kbd>Enter</Kbd> e as peças curtas sobre <code>Field</code>, <code>Button</code> e <code>Spinner</code>. Use em todo fluxo que salva ou confirma com uma ação principal, nunca <code>&lt;form&gt;</code> cru. Rótulo e erro sem formulário são o <code>Field</code>. O seletor com busca ancorado num campo, o <code>FormPickerPopover</code>, mora aqui.
      </Usage>

      <DocSection
        title="Empilhado e em linha"
        description="stack (o padrão) lê --space-block, o mesmo respiro do PageSection. inline põe campo e botão na mesma linha, alinhando o botão pela base do campo — e no telefone empilha, com o botão na largura toda."
        code={`<Form onSubmit={salvar}>
  <FormInput label="E-mail" name="email" type="email" description="Usamos só para o aviso de fatura." />
  <FormInput label="Apelido" name="nick" optional />
  <FormActions>
    <FormCancel onClick={fechar}>Cancelar</FormCancel>
    <FormSubmit>Salvar</FormSubmit>
  </FormActions>
</Form>

<Form layout="inline" pending={convidando} onSubmit={convidar}>
  <FormInput label="E-mail" type="email" placeholder="email@exemplo.com" />
  <FormSubmit>Convidar</FormSubmit>
</Form>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <LayoutDemo />
      </DocSection>

      <DocNote title="Um campo é uma linha, e a ligação vem junto">
          <code>FormInput</code> monta rótulo, controle, ajuda e erro com <code>htmlFor</code>, <code>aria-describedby</code> e <code>aria-invalid</code> ligados. Não monte <code>Label</code> + <code>Input</code> à mão.
      </DocNote>

      <DocNote title="size é o controle; fieldSize é o andaime">
          <code>size</code> é a altura do <code>Input</code>; <code>fieldSize</code>, o degrau de rótulo, ajuda e erro, herdado do <code>FieldGroup</code>. Um <code>Field</code> não sabe que controle carrega.
      </DocNote>

      <DocSection
        title="Sem rótulo à vista"
        description={
          <>
            <code>labels=&quot;hidden&quot;</code> tira o rótulo de cima dos campos e põe o nome no placeholder, com &quot;(opcional)&quot;. A ajuda e o erro continuam embaixo do campo.
          </>
        }
        code={`<Form labels="hidden" onSubmit={salvar}>
  <FormInput label="E-mail" type="email" icon={<EnvelopeIcon />} clearable />
  <FormInput label="Apelido" optional />
  <FormActions>…</FormActions>
</Form>`}
        previewClassName="flex-col items-stretch gap-4"
      >
        <SemRotuloDemo />
      </DocSection>

      <DocNote title="O nome continua lá, para quem não vê">
          O <code>&lt;label&gt;</code> fica no DOM e nomeia o campo; o placeholder repete o nome com &quot;(opcional)&quot;. O placeholder de quem chama só vale com o rótulo à vista.
      </DocNote>

      <DocNote title="O Enter anda, e o teclado avisa">
          Com <code>labels=&quot;hidden&quot;</code>, o <Kbd>Enter</Kbd> leva ao campo seguinte e só envia no último — e o teclado do telefone diz &quot;Seguinte&quot; até lá e &quot;Ir&quot; no fim (<code>enterkeyhint</code>).
      </DocNote>

      <DocSection
        title="No telefone"
        description="O formulário sem rótulo num iPhone, com o Enter passando de um campo ao outro."
        previewClassName="justify-center"
      >
        <SemRotuloIphone />
      </DocSection>

      <DocSection
        title="Validação no envio"
        description={
          <>
            Sem <code>noValidate</code>, <code>required</code>, <code>type=&quot;email&quot;</code> e <code>minLength</code> viram a frase em português embaixo do campo — não o balão do navegador —, e o foco vai ao primeiro erro. Com um <code>onSubmit</code> que devolve <code>Promise</code>, o formulário espera sozinho, e o botão diz &quot;Convidando…&quot; tirado do próprio verbo.
          </>
        }
        code={`<Form onSubmit={async (e) => { e.preventDefault(); await convidar() }}>
  <FormInput label="Nome" required minLength={3} />
  <FormInput label="E-mail" type="email" required />
  <FormActions start={<FormCancel>Voltar</FormCancel>}>
    <FormSubmit>Convidar</FormSubmit>
  </FormActions>
</Form>`}
        previewClassName="items-stretch"
      >
        <ValidacaoDemo />
      </DocSection>

      <DocSection
        title="Seletor com busca"
        description={
          <>
            <code>FormPickerPopover</code>: o campo que abre uma lista longa com busca, com a largura do gatilho, altura limitada e três faixas — busca, lista rolável e um pé com a saída para gerenciar o que a lista mostra. Lista curta sem busca é <code>Select</code>; a que cabe numa palavra é <code>Combobox</code>. A raiz não renderiza nó, então o <code>FormControl</code> vai no gatilho.
          </>
        }
        code={`<FormField label="Cartão">
  <FormPickerPopover open={open} onOpenChange={setOpen}>
    <FormControl>
      <FormPickerPopoverTrigger>
        {escolhido ? escolhido.nome : (
          <FormPickerPopoverPlaceholder>Selecione o cartão</FormPickerPopoverPlaceholder>
        )}
      </FormPickerPopoverTrigger>
    </FormControl>
    <FormPickerPopoverContent>
      <FormPickerPopoverSearch value={busca} onChange={…} onClear={…} placeholder="Buscar cartão…" />
      <FormPickerPopoverList>
        {filtrados.map((c) => (
          <FormPickerPopoverItem key={c.nome} selected={…} onClick={() => escolher(c)}>
            {c.nome}
          </FormPickerPopoverItem>
        ))}
      </FormPickerPopoverList>
      <FormPickerPopoverFooter>
        <FormPickerPopoverFooterAction>
          <Link href="/credit-cards">Cadastrar cartão</Link>
        </FormPickerPopoverFooterAction>
      </FormPickerPopoverFooter>
    </FormPickerPopoverContent>
  </FormPickerPopover>
</FormField>`}
        previewClassName="items-stretch"
      >
        <PickerDemo />
      </DocSection>

      <DocNote title="O Enter na busca do seletor não salva">
          O popover é portalizado para fora do <code>&lt;form&gt;</code> no DOM, e o navegador envia pelo dono do campo no DOM: a busca não pertence ao formulário — experimente: Enter na busca não conta envio.
      </DocNote>

      <DocNote title="O gatilho é um campo, e a linha responde ao dedo">
          O gatilho veste <code>field-classes</code>, como <code>Input</code>, <code>Select</code> e <code>DatePicker</code> — não o troque por <code>Button variant=&quot;outline&quot;</code>, que no tema claro é outra superfície. Abrir não rouba o foco (o teclado do telefone não fecha); fechar o devolve ao gatilho. <code>FormPickerPopoverItem</code> tem 44px de alvo e o par <code>active:</code> junto do realce.
      </DocNote>

      <DocNote title="O vazio é do componente; o texto, de quem chama">
          <code>FormPickerPopoverEmpty</code> fixa respiro e tinta. A frase muda: &ldquo;nenhuma categoria encontrada&rdquo; é busca sem resultado, &ldquo;nenhum cartão cadastrado&rdquo; é ausência de dado.
      </DocNote>

      <DocNote title="Quem valida à mão passa noValidate">
          Login e cadastro trazem a própria regra, com <code>noValidate</code>: ali o formulário não valida, mas o foco no primeiro erro continua valendo — ele procura o <code>aria-invalid</code> que o <code>error</code> do campo escreve. Um controle nativo sem <code>FormField</code> em volta não tem onde mostrar a frase, e ali volta o balão do navegador.
      </DocNote>

      <DocSection
        title="Qualquer controle, e a linha de preferência"
        description={
          <>
            <code>FormField</code> põe rótulo, ajuda e erro em volta de um <code>DatePicker</code> ou de qualquer controle de um nó. <code>Select</code> e <code>Combobox</code> não renderizam nó na raiz: ali o <code>FormControl</code> vai no gatilho. <code>FormSwitch</code> é a preferência — a linha inteira liga e desliga.
          </>
        }
        code={`<FormField label="Vencimento" error={erro}>
  <DatePicker value={data} onChange={setData} />
</FormField>

<FormField label="Repetir">
  <Select>
    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
    <SelectContent>…</SelectContent>
  </Select>
</FormField>

<FormSwitch variant="card" label="Fatura fechando" description="Três dias antes do fechamento." checked={on} onCheckedChange={setOn} />`}
        previewClassName="items-stretch"
      >
        <ControlesDemo />
      </DocSection>

      <DocSection
        title="Em diálogo"
        description="O Form embrulha cabeçalho, corpo e rodapé; a fileira é do DialogFooter. FormActions é para formulário fora de diálogo."
        code={`<DialogContent layout="fixed">
  <Form pending={saving} layout="none" className="flex min-h-0 flex-1 flex-col">
    <DialogHeader>…</DialogHeader>
    <DialogBody>
      <FormInput label="Nome do cartão" />
    </DialogBody>
    <DialogFooter>
      <DialogClose asChild><FormCancel>Cancelar</FormCancel></DialogClose>
      <FormSubmit pendingLabel="Salvando…">Salvar</FormSubmit>
    </DialogFooter>
  </Form>
</DialogContent>`}
      >
        <EmDialogoDemo />
      </DocSection>

      <DocNote title="O botão fora do form usa o id">
          <code>FormSubmit</code> sempre escreve <code>form={"{id}"}</code>, e o contexto atravessa portal: o Enter num <code>DialogBody</code> aciona o botão do <code>DialogFooter</code>. Contexto não atravessa <strong>slot irmão</strong> — quando outro componente renderiza o rodapé ao lado, passe <code>form=&quot;um-id&quot;</code> explícito.
      </DocNote>

      <DocSection
        title="Em folha no telefone"
        description="Cabeçalho fixo, corpo rolável e FormActions variant='sticky'. Na moldura de 375px o Sheet vira gaveta."
        code={`<Sheet>
  <SheetTrigger asChild><Button>Nova transação</Button></SheetTrigger>
  <SheetContent side="bottom" fillMobileViewport>
    <DialogHeader>
      <DialogHeaderRow endAdornment={<DialogCloseButton placement="inline" />}>
        <DialogTitle>Nova transação</DialogTitle>
      </DialogHeaderRow>
    </DialogHeader>
    <Form layout="none" className="flex min-h-0 flex-1 flex-col">
      <DialogBody>…</DialogBody>
      <FormActions variant="sticky">
        <FormSubmit className="w-full">salvar</FormSubmit>
      </FormActions>
    </Form>
  </SheetContent>
</Sheet>`}
        previewClassName="justify-center"
      >
        <EmFolhaDemo />
      </DocSection>

      <DocNote title="O rodapé fixo não desenha fio, tinta nem borrão">
          Quem marca a fronteira é o conteúdo dissolvendo na borda do <code>DialogBody</code>; pintar ou borrar a tira vira banda sobre a placa translúcida. A área segura é da superfície.
      </DocNote>

      <DocSection
        title="Enviando, e o erro que não é de campo"
        description="pending desce por contexto: desabilita o cancelar e, no enviar, troca o rótulo, mostra o Spinner e marca aria-busy. O Enter durante o envio não duplica, porque o botão está desabilitado."
        code={`<Form pending={saving} onSubmit={handleSubmit}>
  <FormError>{erroGeral}</FormError>
  <FormTextarea label="Observação" description="Enter quebra linha; ⌘/Ctrl+Enter envia." />
  <FormActions>
    <FormCancel>Cancelar</FormCancel>
    <FormSubmit pendingLabel="Salvando…">Salvar</FormSubmit>
  </FormActions>
</Form>`}
        previewClassName="items-stretch"
      >
        <EstadoDemo />
      </DocSection>

      <DocNote title="FormError é role=&quot;alert&quot; e nada mais">
          O papel já implica <code>aria-live=&quot;assertive&quot;</code>; um <code>aria-live=&quot;polite&quot;</code> explícito o contradiz. Quem quer a caixa compõe <code>&lt;Alert tone=&quot;destructive&quot; size=&quot;sm&quot;&gt;</code> na tela.
      </DocNote>

      <DocNote title="A tecla morta não envia o formulário">
          Durante a composição de um acento o <Kbd>Enter</Kbd> é do editor de entrada: o navegador não envia, e a guarda de <code>isComposing</code> não avança nem envia com ⌘.
      </DocNote>

      <DocNote title="Um controle novo que use o Enter">
          Chama <code>preventDefault</code> no próprio <code>keydown</code>, como o cmdk e o <code>Select</code> do Radix já fazem: com o padrão impedido, a submissão implícita não acontece.
      </DocNote>

      <DocNote title="CustomForm continua válido">
          É <code>Form</code> com <code>layout=&quot;none&quot;</code>.
      </DocNote>

      <DocNote title="A ação principal é a única type=&quot;submit&quot;">
          Cancelar, alternar e todo o resto levam <code>type=&quot;button&quot;</code> — senão o cancelar vira o alvo do <Kbd>Enter</Kbd> e o formulário fecha em vez de salvar. Com dois <code>type=&quot;submit&quot;</code>, o Enter escolhe o primeiro do DOM; a segunda ação vira <code>type=&quot;button&quot;</code> com <code>onClick</code>.
      </DocNote>

      <DocSection
        title="O Enter de cada controle"
        description="Experimente: Enter no campo de texto envia; dentro da observação, quebra linha — e ⌘/Ctrl+Enter envia de lá mesmo; sobre o seletor, abre a lista."
        previewClassName="items-stretch"
      >
        <EnterDeferDemo />
      </DocSection>

      <DocNote title="O Enter é a submissão implícita do navegador">
          Ele aciona o primeiro <code>type=&quot;submit&quot;</code> cujo dono é o formulário — dentro do <code>&lt;form&gt;</code> ou ligado por <code>form=</code> — e decide pelo dono do campo <strong>no DOM</strong>: um campo num portal não envia, mesmo que o evento suba pela árvore do React. Com o botão desabilitado, o Enter não faz nada. Um <code>&lt;button&gt;</code> sem <code>type</code> também é de envio — o <code>Button</code> nasce <code>type=&quot;button&quot;</code> para não roubar o Enter. <code>form-submit-owner.test.ts</code> confere no fonte que o arquivo com submit tem um formulário ou um <code>form=</code>, e que nenhum <code>&lt;button&gt;</code> cru fica sem <code>type</code>.
      </DocNote>

      <PropsTable
        title="Form"
        rows={[
          {
            prop: "layout",
            type: '"stack" | "inline" | "none"',
            description:
              "stack (padrão) empilha; inline põe campo e botão na mesma linha; none não aplica layout.",
          },
          {
            prop: "pending",
            type: "boolean",
            description:
              "Enviando. Desce por contexto para FormSubmit e FormCancel; um onSubmit que devolve Promise liga sozinho.",
          },
          {
            prop: "labels",
            type: '"visible" | "hidden"',
            default: '"visible"',
            description:
              "Onde o nome dos campos aparece: em cima, ou só no placeholder, com o rótulo para o leitor de tela. Com hidden, o Enter leva ao campo seguinte.",
          },
          {
            prop: "noValidate",
            type: "boolean",
            description:
              "A tela valida à mão. Sem ele, a validação nativa vira a frase em português no FormField.",
          },
          {
            prop: "id",
            type: "string",
            description:
              "Gerado por useId; liga um botão que vive fora do <form>.",
          },
          {
            prop: "onSubmit",
            type: "(e) => void | Promise<unknown>",
            description:
              "Chame preventDefault(). Devolvendo Promise, o formulário espera até ela assentar, e depois leva o foco ao primeiro erro.",
          },
          {
            prop: "onKeyDown",
            type: "React.KeyboardEventHandler<HTMLFormElement>",
            description:
              "Chamado depois da normalização; pode chegar com defaultPrevented.",
          },
        ]}
      />

      <PropsTable
        title="FormInput, FormTextarea e FormField"
        rows={[
          {
            prop: "label",
            type: "React.ReactNode",
            description: "O rótulo. Ligado ao controle pelo Field.",
          },
          {
            prop: "description",
            type: "React.ReactNode",
            description:
              "A ajuda; só renderiza quando existe.",
          },
          {
            prop: "error",
            type: "React.ReactNode",
            description:
              "A mensagem; renderizá-la torna o campo inválido.",
          },
          {
            prop: "optional",
            type: "boolean",
            description:
              "Marca o campo como opcional — o app marca o opcional, não o obrigatório.",
          },
          {
            prop: "fieldSize",
            type: '"sm" | "md"',
            description:
              "O degrau do rótulo, ajuda e erro; a altura do controle é o size.",
          },
          {
            prop: "icon",
            type: "React.ReactNode",
            description:
              "FormInput e FormField: o ícone antes do texto, um 16/solid.",
          },
          {
            prop: "clearable",
            type: "boolean",
            description:
              "FormInput e FormField: o × que limpa o campo quando há texto, passando pelo onChange de quem chama; o foco volta ao campo.",
          },
          {
            prop: "…resto",
            type: "ComponentProps<typeof Input | typeof Textarea>",
            description: "Vai inteiro para o controle: name, type, size, ref.",
          },
          {
            prop: "FormField children",
            type: "React.ReactElement",
            description:
              "Um controle de um nó. Em Select e Combobox, o FormControl vai no gatilho.",
          },
        ]}
      />

      <PropsTable
        title="FormActions, FormSubmit, FormCancel, FormSwitch e FormError"
        rows={[
          {
            prop: "FormActions variant",
            type: '"inline" | "sticky"',
            description:
              "inline é a fileira comum; sticky é o rodapé fixo de uma folha, sem fio nem tinta.",
          },
          {
            prop: "FormActions start",
            type: "React.ReactNode",
            description:
              "A ação à esquerda a partir de sm — Excluir, Voltar —, embaixo no telefone.",
          },
          {
            prop: "FormActions align",
            type: '"end" | "between" | "start"',
            description: "Onde a fileira encosta, a partir de sm.",
          },
          {
            prop: "FormSubmit pendingLabel",
            type: "React.ReactNode",
            description:
              "O rótulo enquanto envia. Sem ele, sai do verbo: Salvar → Salvando…, Criar conta → Criando conta…; rótulo sem verbo não muda.",
          },
          {
            prop: "FormSubmit pending",
            type: "boolean",
            description:
              "Sobrescreve o pending do formulário para este botão.",
          },
          {
            prop: "FormCancel",
            type: "ComponentProps<typeof Button>",
            description:
              "type='button' e variant='tertiary' já vêm da peça.",
          },
          {
            prop: "FormSwitch",
            type: 'label, description, variant: "plain" | "card", …Switch',
            description:
              "A linha de preferência; card emoldura a linha solta numa página.",
          },
          {
            prop: "FormError",
            type: "ComponentProps<typeof P>",
            description:
              "O erro do formulário inteiro; some quando não há mensagem.",
          },
        ]}
      />
      <PropsTable
        title="FormPickerPopover"
        rows={[
          {
            prop: "FormPickerPopover",
            type: "ComponentProps<typeof Popover>",
            default: "modal={isMobile}",
            description:
              "A raiz; no telefone tranca a rolagem para a lista não arrastar a folha.",
          },
          {
            prop: "FormPickerPopoverTrigger",
            type: 'Omit<ComponentProps<"button">, "size"> & { size?: "sm" | "md" | "lg" | "xl" }',
            default: 'size="md"',
            description:
              "O gatilho é o campo: field-classes, altura da escada e chevron que gira.",
          },
          {
            prop: "FormPickerPopoverSearch",
            type: "ComponentProps<typeof SearchInput>",
            default: 'size="lg"',
            description:
              "A pílula de busca na superfície plate, com o × de limpar (onClear).",
          },
          {
            prop: "FormPickerPopoverList",
            type: 'ComponentProps<"div">',
            description:
              "A região rolável, com a dissolução, as setas de \u201ctem mais\u201d e o onWheel que para a propagação.",
          },
          {
            prop: "FormPickerPopoverItem",
            type: 'ComponentProps<"button"> & { selected?: boolean }',
            default: "selected={false}",
            description: "A linha: 44px de alvo, par hover/active e aria-pressed.",
          },
          {
            prop: "FormPickerPopoverEmpty",
            type: 'ComponentProps<"p">',
            description: "A lista vazia: respiro e tinta fixos, texto de quem chama.",
          },
          {
            prop: "FormPickerPopoverFooter / FooterAction",
            type: 'ComponentProps<"div"> / ComponentProps<typeof Button>',
            description:
              "O pé e a saída para gerenciar a lista — secondary, lg, largura toda, asChild com um Link.",
          },
        ]}
      />
    </>
  )
}

function LayoutDemo() {
  const [layout, setLayout] = React.useState<"stack" | "inline">("stack")
  const [envios, setEnvios] = React.useState(0)
  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setEnvios((v) => v + 1)
  }

  return (
    <>
      <Controles
        inicio={<Eixo rotulo="layout" valores={["stack", "inline"] as const} valor={layout} onChange={setLayout} />}
      />
      {layout === "stack" ? (
        <Form className="w-full max-w-sm" onSubmit={enviar}>
          <FormInput
            label="E-mail"
            name="email"
            type="email"
            placeholder="voce@exemplo.com"
            description="Usamos só para o aviso de fatura."
          />
          <FormInput label="Apelido" name="nick" placeholder="—" optional />
          <FormActions>
            <FormCancel>Cancelar</FormCancel>
            <FormSubmit>Salvar</FormSubmit>
          </FormActions>
        </Form>
      ) : (
        <Form layout="inline" className="w-full max-w-md" onSubmit={enviar}>
          <FormInput
            label="E-mail"
            name="email"
            type="email"
            placeholder="email@exemplo.com"
          />
          <FormSubmit>Convidar</FormSubmit>
        </Form>
      )}
      <span className="text-xs text-muted-foreground">
        Envios: <span className="nums">{envios}</span>
      </span>
    </>
  )
}

function SemRotuloDemo() {
  const [labels, setLabels] = React.useState<"visible" | "hidden">("hidden")
  const [icone, setIcone] = React.useState(false)
  const [limpar, setLimpar] = React.useState(true)
  const [nota, setNota] = React.useState(true)
  const [erro, setErro] = React.useState(false)

  return (
    <>
      <Controles
        inicio={
          <Eixo
            rotulo="labels"
            valores={["visible", "hidden"] as const}
            valor={labels}
            onChange={setLabels}
            rotulos={{ visible: "em cima", hidden: "escondido" }}
          />
        }
        fim={
          <Interruptores>
            <Interruptor id="sr-icone" rotulo="icon" valor={icone} onChange={setIcone} />
            <Interruptor id="sr-limpar" rotulo="clearable" valor={limpar} onChange={setLimpar} />
            <Interruptor id="sr-nota" rotulo="description" valor={nota} onChange={setNota} />
            <Interruptor id="sr-erro" rotulo="error" valor={erro} onChange={setErro} />
          </Interruptores>
        }
      />
      <Form
        key={labels}
        className="w-full max-w-sm"
        labels={labels}
        onSubmit={(e) => e.preventDefault()}
      >
        <FormInput
          label="E-mail"
          name="email"
          type="email"
          defaultValue="ana@exemplo.com"
          icon={icone ? <EnvelopeIcon /> : undefined}
          clearable={limpar}
          description={nota ? "Usamos só para o aviso de fatura." : undefined}
          error={erro ? "Digite um e-mail válido." : undefined}
        />
        <FormInput
          label="Apelido"
          name="nick"
          optional
          icon={icone ? <UserIcon /> : undefined}
          clearable={limpar}
        />
        <FormActions>
          <FormCancel>Cancelar</FormCancel>
          <FormSubmit>Salvar</FormSubmit>
        </FormActions>
      </Form>
    </>
  )
}

function SemRotuloIphone() {
  return (
    <IphoneFrame title="Formulário sem rótulo num iPhone">
      <Form labels="hidden" className="px-4 pt-16" onSubmit={(e) => e.preventDefault()}>
        <FormInput label="E-mail" type="email" icon={<EnvelopeIcon />} clearable />
        <FormInput label="Telefone" type="tel" icon={<PhoneIcon />} clearable />
        <FormInput label="Apelido" optional icon={<UserIcon />} />
        <FormActions>
          <FormCancel>Cancelar</FormCancel>
          <FormSubmit>Salvar</FormSubmit>
        </FormActions>
      </Form>
    </IphoneFrame>
  )
}

function ValidacaoDemo() {
  const [convites, setConvites] = React.useState(0)

  return (
    <Form
      className="w-full max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault()
        await new Promise((r) => setTimeout(r, 1500))
        setConvites((v) => v + 1)
      }}
    >
      <FormInput
        label="Nome"
        name="nome"
        required
        minLength={3}
        placeholder="Ana Souza"
      />
      <FormInput
        label="E-mail"
        name="email"
        type="email"
        required
        placeholder="ana@exemplo.com"
        description={`Convites enviados: ${convites}`}
      />
      <FormActions start={<FormCancel>Voltar</FormCancel>}>
        <FormSubmit>Convidar</FormSubmit>
      </FormActions>
    </Form>
  )
}

function ControlesDemo() {
  const [data, setData] = React.useState<Date | undefined>(undefined)
  const [aviso, setAviso] = React.useState(true)
  const [resumo, setResumo] = React.useState(false)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <FormField
        label="Vencimento"
        description="O dia em que a conta vence."
        error={data ? undefined : "Escolha uma data."}
      >
        <DatePicker value={data} onChange={setData} />
      </FormField>
      <FormField label="Repetir">
        <Select defaultValue="mensal">
          <FormControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="mensal">Todo mês</SelectItem>
            <SelectItem value="anual">Todo ano</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormSwitch
        variant="card"
        label="Fatura fechando"
        description="Três dias antes do fechamento do cartão."
        checked={aviso}
        onCheckedChange={setAviso}
      />
      <FormSwitch
        label="Resumo semanal"
        description="Toda segunda, o que entrou e o que saiu."
        checked={resumo}
        onCheckedChange={setResumo}
      />
    </div>
  )
}

function EmDialogoDemo() {
  const [salvos, setSalvos] = React.useState(0)

  return (
    <div className="flex flex-col items-start gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Cadastrar cartão</Button>
        </DialogTrigger>
        <DialogContent layout="fixed">
          <Form
            layout="none"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              setSalvos((v) => v + 1)
            }}
          >
            <DialogHeader>
              <DialogTitle>Cadastro de cartão</DialogTitle>
              <DialogDescription>
                O Enter num campo aciona o botão do rodapé, que é portalizado.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4">
              <FormInput label="Nome do cartão" placeholder="Nubank" />
              <FormInput label="Últimos quatro dígitos" placeholder="4412" />
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <FormCancel>Cancelar</FormCancel>
              </DialogClose>
              <FormSubmit>Salvar</FormSubmit>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
      <span className="text-xs text-muted-foreground">
        Salvos: <span className="nums">{salvos}</span>
      </span>
    </div>
  )
}

function EmFolhaDemo() {
  const [salvos, setSalvos] = React.useState(0)
  const [valor, setValor] = React.useState("")

  return (
    <IphoneFrame title="Folha de nova transação num iPhone">
      {/* A folha é real, e é o que a tela do app monta. Dentro da moldura o
          `useIsMobile` lê a janela de dentro, então a 375px o `Sheet` toma o
          ramo gaveta — o que abre aqui é o `vaul`, com alça, arraste e véu.
          Ela só pôde deixar de ser maquete quando o ramo gaveta passou a
          portalizar para o `body` da janela ativa: sem isso a folha escapava
          do `<iframe>` e cobria a página do catálogo. */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="m-auto">
            Nova transação
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" fillMobileViewport>
          {/* A cromagem é a do `Dialog`, nas duas superfícies — é o que a casa
              já dizia da folha ("não existem `SheetHeader`/`SheetFooter`") e o
              que o chrome de folha contradizia. O `DialogTitle` acha o contexto
              aqui porque as três superfícies são a mesma primitiva do Radix. */}
          <DialogHeader>
            <DialogHeaderRow
              endAdornment={<DialogCloseButton placement="inline" />}
            >
              <DialogTitle>Nova transação</DialogTitle>
              <DialogDescription>
                Salvos: <span className="nums">{salvos}</span>
              </DialogDescription>
            </DialogHeaderRow>
          </DialogHeader>
          <Form
            layout="none"
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              setSalvos((v) => v + 1)
            }}
          >
            <DialogBody className="flex flex-col gap-4 pb-4">
              <FormInput label="Descrição" placeholder="Mercado" />
              <FormInput
                money
                label="Valor"
                value={valor}
                onValueChange={setValor}
              />
              <FormInput label="Data" placeholder="05/09/2026" />
              <FormInput label="Categoria" placeholder="Alimentação" optional />
              <FormInput label="Conta" placeholder="Nubank" />
              <FormInput label="Etiquetas" placeholder="mensal, casa" optional />
              {/* Sete campos, e não três. Um formulário curto não precisaria de
                  cabeçalho fixo nem de rodapé fixo — o padrão que esta seção
                  documenta só existe porque o corpo não cabe. Com três, ele
                  transbordava 17px, menos que os 44 da rampa de dissolução. */}
              <FormTextarea
                label="Observação"
                placeholder="Compra do mês"
                optional
                rows={4}
              />
            </DialogBody>
            <FormActions variant="sticky">
              <FormSubmit className="w-full">Salvar</FormSubmit>
            </FormActions>
          </Form>
        </SheetContent>
      </Sheet>
    </IphoneFrame>
  )
}

function EstadoDemo() {
  const [pending, setPending] = React.useState(false)
  const [texto, setTexto] = React.useState("")
  const [erro, setErro] = React.useState<string | undefined>(undefined)
  const [envios, setEnvios] = React.useState(0)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Controles
        fim={
          <Interruptores>
            <Interruptor id="ds-form-pending" rotulo="pending" valor={pending} onChange={setPending} />
          </Interruptores>
        }
      />
      <Form
        pending={pending}
        onSubmit={(e) => {
          e.preventDefault()
          // Validação de verdade, para o erro geral ter causa: sem observação, o
          // formulário não envia e a frase aparece.
          if (!texto.trim()) {
            setErro("Escreva uma observação antes de salvar.")
            return
          }
          setErro(undefined)
          setEnvios((v) => v + 1)
        }}
      >
        <FormError>{erro}</FormError>
        <FormTextarea
          label="Observação"
          rows={3}
          placeholder="Enter quebra linha"
          description="⌘/Ctrl+Enter envia de dentro do textarea."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <FormActions align="between">
          <span className="self-center text-xs text-muted-foreground">
            Envios: <span className="nums">{envios}</span>
          </span>
          <div className="flex gap-2">
            <FormCancel>Cancelar</FormCancel>
            <FormSubmit pendingLabel="Salvando…">Salvar</FormSubmit>
          </div>
        </FormActions>
      </Form>
    </div>
  )
}

function EnterDeferDemo() {
  const [n, setN] = React.useState(0)

  return (
    <Form
      layout="none"
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setN((v) => v + 1)
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Campo de texto</FieldLabel>
          <FieldControl>
            <Input placeholder="Enter aqui envia" />
          </FieldControl>
        </Field>
        <Field>
          <FieldLabel>Seletor</FieldLabel>
          {/* O `FieldControl` embrulha o **gatilho**, e não a raiz do Radix:
              `Select.Root` não renderiza nó nenhum, então o `id` não chegaria
              a lugar algum e o rótulo apontaria para o vazio. */}
          <Select>
            <FieldControl>
              <SelectTrigger>
                <SelectValue placeholder="Enter aqui abre a lista" />
              </SelectTrigger>
            </FieldControl>
            <SelectContent>
              <SelectItem value="mercado">Mercado</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Observação</FieldLabel>
          <FieldControl>
            <Textarea placeholder="Enter quebra linha; ⌘/Ctrl+Enter envia" />
          </FieldControl>
        </Field>
      </FieldGroup>
      <FormActions align="between">
        <span className="self-center text-xs text-muted-foreground">
          Envios: <span className="nums">{n}</span>
        </span>
        <FormSubmit>Salvar</FormSubmit>
      </FormActions>
    </Form>
  )
}

const CARTOES = [
  { nome: "Nubank", fim: "4412" },
  { nome: "Itaú", fim: "8830" },
  { nome: "Inter", fim: "2091" },
  { nome: "C6", fim: "7745" },
  { nome: "BTG", fim: "1203" },
  { nome: "Will", fim: "6658" },
  { nome: "Neon", fim: "3317" },
]

function PickerDemo() {
  const [aberto, setAberto] = React.useState(false)
  const [busca, setBusca] = React.useState("")
  const [escolhido, setEscolhido] = React.useState<
    (typeof CARTOES)[number] | null
  >(null)
  const [enviou, setEnviou] = React.useState(0)

  const filtrados = CARTOES.filter((c) =>
    c.nome.toLowerCase().includes(busca.trim().toLowerCase())
  )

  return (
    <Form
      className="w-full max-w-xs"
      onSubmit={(e) => {
        e.preventDefault()
        setEnviou((n) => n + 1)
      }}
    >
      <FormField label="Cartão">
        <FormPickerPopover
          open={aberto}
          onOpenChange={(o) => {
            setAberto(o)
            if (!o) setBusca("")
          }}
        >
          <FormControl>
            <FormPickerPopoverTrigger>
              {escolhido ? (
                <span className="truncate">
                  {escolhido.nome} · •••• {escolhido.fim}
                </span>
              ) : (
                <FormPickerPopoverPlaceholder>
                  Selecione o cartão
                </FormPickerPopoverPlaceholder>
              )}
            </FormPickerPopoverTrigger>
          </FormControl>
          <FormPickerPopoverContent>
            <FormPickerPopoverSearch
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onClear={() => setBusca("")}
              placeholder="Buscar cartão…"
            />
            <FormPickerPopoverList>
              {filtrados.length > 0 ? (
                filtrados.map((c) => (
                  <FormPickerPopoverItem
                    key={c.nome}
                    selected={c.nome === escolhido?.nome}
                    onClick={() => {
                      setEscolhido(c)
                      setAberto(false)
                    }}
                  >
                    <span className="truncate">{c.nome}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground nums">
                      •••• {c.fim}
                    </span>
                  </FormPickerPopoverItem>
                ))
              ) : (
                <FormPickerPopoverEmpty>
                  Nenhum cartão com esse nome.
                </FormPickerPopoverEmpty>
              )}
            </FormPickerPopoverList>
            <FormPickerPopoverFooter>
              <FormPickerPopoverFooterAction>
                <Link href="/credit-cards">Cadastrar cartão</Link>
              </FormPickerPopoverFooterAction>
            </FormPickerPopoverFooter>
          </FormPickerPopoverContent>
        </FormPickerPopover>
      </FormField>
      {/* O envio existe para o Enter ter um alvo — é ele que prova que o Enter
          na busca não salva o formulário. */}
      <FormActions align="between">
        <span aria-live="polite" className="self-center text-xs text-muted-foreground">
          {enviou === 0 ? "não enviado" : `enviado ${enviou}×`}
        </span>
        <FormSubmit>Salvar</FormSubmit>
      </FormActions>
    </Form>
  )
}
