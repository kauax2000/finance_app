"use client"

import * as React from "react"

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
import {
  ENTER_DEFERRAL_RULES,
  Form,
  FormActions,
  FormCancel,
  FormError,
  FormInput,
  FormSubmit,
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
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { PhoneFrame } from "../ds-frame"
import { Group, Spec, Stack } from "../ds-kit"

export default function FormDoc() {
  return (
    <>
      <Usage>
          O formulário do projeto: o <code>&lt;form&gt;</code>, o contrato do <Kbd>Enter</Kbd> e as peças curtas sobre <code>Field</code>, <code>Button</code> e <code>Spinner</code>. Use em todo fluxo que salva ou confirma com uma ação principal, nunca <code>&lt;form&gt;</code> cru. Rótulo e erro sem formulário são o <code>Field</code>.
      </Usage>

      <DocSection
        title="Empilhado"
        description="A forma de autenticação e configurações. layout='stack' lê --space-block, o mesmo respiro do PageSection."
        code={`<Form onSubmit={handleSubmit}>
  <FormInput label="E-mail" name="email" type="email" description="Usamos para o aviso de fatura." />
  <FormInput label="Apelido" name="nick" optional />
  <FormActions>
    <FormCancel onClick={fechar}>Cancelar</FormCancel>
    <FormSubmit>Salvar</FormSubmit>
  </FormActions>
</Form>`}
        previewClassName="items-stretch"
      >
        <EmpilhadoDemo />
      </DocSection>

      <DocNote title="Um campo é uma linha, e a ligação vem junto">
          <code>FormInput</code> monta rótulo, controle, ajuda e erro com <code>htmlFor</code>, <code>aria-describedby</code> e <code>aria-invalid</code> ligados. Não monte <code>Label</code> + <code>Input</code> à mão.
      </DocNote>

      <DocNote title="size é o controle; fieldSize é o andaime">
          <code>size</code> é a altura do <code>Input</code>; <code>fieldSize</code>, o degrau de rótulo, ajuda e erro, herdado do <code>FieldGroup</code>. Um <code>Field</code> não sabe que controle carrega.
      </DocNote>

      <DocSection
        title="Em linha"
        description="Campo e botão na mesma linha, como numa busca. O botão alinha pela base do campo, não do rótulo."
        code={`<Form layout="inline" onSubmit={buscar}>
  <FormInput label="Buscar" name="q" className="flex-1" />
  <FormSubmit>Buscar</FormSubmit>
</Form>`}
        previewClassName="items-stretch"
      >
        <EmLinhaDemo />
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
          O papel já implica <code>aria-live=&quot;assertive&quot;</code>; um <code>aria-live=&quot;polite&quot;</code> explícito o contradiz. Quem quer a caixa compõe <code>&lt;Alert tone=&quot;destructive&quot; variant=&quot;plain&quot;&gt;</code> na tela.
      </DocNote>

      <DocNote title="A tecla morta não envia o formulário">
          Durante a composição de um acento o <Kbd>Enter</Kbd> é do editor de entrada, e a guarda de <code>isComposing</code> não envia.
      </DocNote>

      <DocNote title="Um controle novo que use o Enter">
          Ganha um <code>data-slot</code> e uma linha em <code>shouldDeferEnterToWidget</code>, ou a exceção fica documentada no componente.
      </DocNote>

      <DocNote title="CustomForm continua válido">
          É <code>Form</code> com <code>layout=&quot;none&quot;</code>.
      </DocNote>

      <DocNote title="A ação principal é a única type=&quot;submit&quot;">
          Cancelar, alternar e todo o resto levam <code>type=&quot;button&quot;</code> — senão o cancelar vira o alvo do <Kbd>Enter</Kbd> e o formulário fecha em vez de salvar. Com dois <code>type=&quot;submit&quot;</code>, o Enter escolhe o primeiro do DOM; a segunda ação vira <code>type=&quot;button&quot;</code> com <code>onClick</code>.
      </DocNote>

      <Group
        title="Onde o Enter não é sequestrado"
        description="shouldDeferEnterToWidget, em ui/form.tsx, lida da fonte para não divergir do código."
      >
        <Spec title="As regras" meta="ENTER_DEFERRAL_RULES">
          <Stack className="gap-2">
            {ENTER_DEFERRAL_RULES.map((rule) => (
              <div key={rule.match} className="flex flex-col">
                <code className="font-mono text-2xs text-foreground">
                  {rule.match}
                </code>
                <span className="text-xs text-muted-foreground">
                  {rule.why}
                </span>
              </div>
            ))}
          </Stack>
        </Spec>
      </Group>

      <DocSection
        title="Os campos deferem o Enter"
        description="Experimente: Enter no campo de texto envia; dentro da observação, quebra linha — e ⌘/Ctrl+Enter envia de lá mesmo; sobre o seletor, abre a lista."
        previewClassName="items-stretch"
      >
        <EnterDeferDemo />
      </DocSection>

      <DocNote title="Todo campo de texto num portal precisa da regra">
          Eventos de portal sobem pela árvore do React: sem a regra, o <Kbd>Enter</Kbd> na busca de um seletor ancorado salva a transação, mesmo fora do <code>&lt;form&gt;</code> no DOM.
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
              "Enviando. Desce por contexto para FormSubmit e FormCancel.",
          },
          {
            prop: "id",
            type: "string",
            description:
              "Gerado por useId; liga um botão que vive fora do <form>.",
          },
          {
            prop: "onSubmit",
            type: "React.FormEventHandler<HTMLFormElement>",
            description: "Como em qualquer form. Chame preventDefault().",
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
        title="FormInput e FormTextarea"
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
            prop: "…resto",
            type: "ComponentProps<typeof Input | typeof Textarea>",
            description: "Vai inteiro para o controle: name, type, size, ref.",
          },
        ]}
      />

      <PropsTable
        title="FormActions, FormSubmit, FormCancel e FormError"
        rows={[
          {
            prop: "FormActions variant",
            type: '"inline" | "sticky"',
            description:
              "inline é a fileira comum; sticky é o rodapé fixo de uma folha, sem fio nem tinta.",
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
              "O rótulo enquanto envia; sem ele, só o Spinner entra.",
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
            prop: "FormError",
            type: "ComponentProps<typeof P>",
            description:
              "O erro do formulário inteiro; some quando não há mensagem.",
          },
        ]}
      />
    </>
  )
}

function EmpilhadoDemo() {
  const [salvos, setSalvos] = React.useState(0)

  return (
    <Form
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault()
        setSalvos((v) => v + 1)
      }}
    >
      <FormInput
        label="E-mail"
        name="email"
        type="email"
        placeholder="voce@exemplo.com"
        description="Usamos só para o aviso de fatura."
      />
      <FormInput label="Apelido" name="nick" placeholder="—" optional />
      <FormActions align="between">
        <span className="self-center text-xs text-muted-foreground">
          Salvos: <span className="nums">{salvos}</span>
        </span>
        <div className="flex gap-2">
          <FormCancel>Cancelar</FormCancel>
          <FormSubmit>Salvar</FormSubmit>
        </div>
      </FormActions>
    </Form>
  )
}

function EmLinhaDemo() {
  const [buscas, setBuscas] = React.useState(0)

  return (
    <Form
      layout="inline"
      className="w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault()
        setBuscas((v) => v + 1)
      }}
    >
      <FormInput
        label="Buscar"
        name="q"
        type="search"
        placeholder="Mercado"
        fieldClassName="flex-1"
      />
      <FormSubmit>Buscar</FormSubmit>
      <span className="self-center pb-2 text-xs text-muted-foreground">
        <span className="nums">{buscas}</span>
      </span>
    </Form>
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
    <PhoneFrame title="Folha de nova transação num telefone">
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
    </PhoneFrame>
  )
}

function EstadoDemo() {
  const [pending, setPending] = React.useState(false)
  const [texto, setTexto] = React.useState("")
  const [erro, setErro] = React.useState<string | undefined>(undefined)
  const [envios, setEnvios] = React.useState(0)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="ds-form-pending"
          checked={pending}
          onCheckedChange={setPending}
        />
        <Label htmlFor="ds-form-pending">Simular envio em curso</Label>
      </div>
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
