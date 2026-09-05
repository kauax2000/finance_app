"use client"

import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormActions,
  FormCancel,
  FormError,
  FormInput,
  FormSubmit,
  FormTextarea,
} from "@/components/ui/form"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import {
  MobileSheetFormBody,
  MobileSheetFormStickyHeader,
} from "@/components/ui/mobile-sheet-form-chrome"
import { Switch } from "@/components/ui/switch"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"
import { PhoneFrame, PhoneFrameSheet } from "../ds-phone"

export default function FormDoc() {
  return (
    <>
      <Usage>
        O formulário do projeto: o <code>&lt;form&gt;</code>, o contrato do{" "}
        <Kbd>Enter</Kbd> e as peças que compõem os átomos — <code>FormInput</code>{" "}
        sobre o <code>Field</code>, <code>FormSubmit</code> sobre o{" "}
        <code>Button</code> e o <code>Spinner</code>. As sete regras do Enter
        estão em{" "}
        <Link href="/designsystem/formularios" className="underline">
          Formulários e Enter
        </Link>
        , lidas da fonte.
      </Usage>

      <DocSection
        title="Empilhado"
        description="A forma de uma tela de autenticação ou de configurações. layout='stack' lê --space-block, o mesmo token de 16px que o PageSection usa entre blocos — o formulário não inventa um respiro próprio."
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
        <code>FormInput</code> monta <code>Field</code> + <code>FieldLabel</code>{" "}
        + <code>FieldControl</code> + <code>Input</code> +{" "}
        <code>FieldDescription</code> + <code>FieldError</code>, com{" "}
        <code>htmlFor</code>, <code>aria-describedby</code> e{" "}
        <code>aria-invalid</code> ligados pelo <code>Field</code>. O app tem{" "}
        <strong>104 campos escritos à mão</strong> em cinco dialetos de
        espaçamento, e o <code>Field</code> tinha zero consumidores fora deste
        catálogo — a ligação já existia; faltava uma forma curta de pedi-la.
      </DocNote>

      <DocNote title="size é o controle; fieldSize é o andaime">
        <code>size</code> vai para o <code>Input</code> — é a escada de altura{" "}
        <code>sm…xl</code>. <code>fieldSize</code> é o degrau do rótulo, da ajuda
        e do erro, e por padrão herda do <code>FieldGroup</code> em volta. São
        dois eixos porque um <code>Field</code> não sabe que controle carrega:
        ancorar um no outro é o defeito que <code>field.tsx</code> registra.
      </DocNote>

      <DocSection
        title="Em linha"
        description="Campo e botão na mesma linha — o formulário de busca. items-end alinha o botão pela base do campo, e não pela do rótulo."
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
        description="O Form embrulha cabeçalho, corpo e rodapé; o DialogFooter é quem dá a fileira, com FormCancel e FormSubmit dentro. FormActions é para o formulário que não está num diálogo."
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

      <DocNote title="O botão fora do form, e até onde o contexto chega">
        <code>FormSubmit</code> escreve <code>form={"{id}"}</code> sempre. Dentro
        do <code>&lt;form&gt;</code> isso é inócuo — o Enter acha o botão na
        primeira busca. <strong>Fora dele é o que faz o Enter funcionar</strong>:
        um <code>DialogFooter</code> é portalizado, e contexto do React atravessa
        portal. O que ele <em>não</em> atravessa é <strong>slot irmão</strong> —
        quando outro componente renderiza o rodapé ao lado do formulário, como o{" "}
        <code>footer=</code> do assistente de categorias, não há contexto a
        herdar, e ali <code>form=&quot;um-id&quot;</code> explícito continua sendo
        a resposta.
      </DocNote>

      <DocSection
        title="Em folha no telefone"
        description="Cabeçalho fixo, corpo rolável e FormActions variant='sticky' — o rodapé que o chrome de folha não tinha, e que cinco arquivos do app derivavam à mão com três !important."
        code={`<SheetContent side="bottom" fillMobileViewport className={mobileFormSheetContentClassName}>
  <MobileSheetFormStickyHeader
    title="Nova transação"
    endAdornment={<MobileSheetFormHeaderCloseButton />}
  />
  <Form layout="none" className="flex min-h-0 flex-1 flex-col">
    <MobileSheetFormBody className="flex flex-col gap-4 pb-4">
      <FormInput label="Descrição" />
    </MobileSheetFormBody>
    <FormActions variant="sticky">
      <FormSubmit className="w-full">Salvar</FormSubmit>
    </FormActions>
  </Form>
</SheetContent>`}
        previewClassName="justify-center"
      >
        <EmFolhaDemo />
      </DocSection>

      <DocNote title="O rodapé fixo não desenha fio nem tinta">
        É a regra <strong>J</strong>: quem marca a fronteira é o conteúdo
        dissolvendo na borda do <code>MobileSheetFormBody</code> logo acima. E ele
        não traz área segura — ela é da <strong>superfície</strong>, e o casco da
        folha já a carrega; somar aqui dobraria o recuo.
      </DocNote>

      <DocSection
        title="Enviando, e o erro que não é de campo"
        description="pending desce por contexto: desabilita o cancelar, e no enviar troca o rótulo, mostra o Spinner e marca aria-busy. O Enter durante o envio não duplica — o botão está desabilitado, e é isso que a busca do Enter filtra."
        code={`<Form pending={saving} onSubmit={handleSubmit}>
  <FormError>{erroGeral}</FormError>
  <FormTextarea label="Observação" description="Enter quebra linha; ⌘+Enter envia." />
  <FormActions>
    <FormCancel>Cancelar</FormCancel>
    <FormSubmit pendingLabel="Salvando…">Salvar</FormSubmit>
  </FormActions>
</Form>`}
        previewClassName="items-stretch"
      >
        <EstadoDemo />
      </DocSection>

      <DocNote title="FormError não é um Alert">
        Ele é uma frase, com <code>role=&quot;alert&quot;</code> e nada mais. O
        papel já implica <code>aria-live=&quot;assertive&quot;</code>, e um{" "}
        <code>aria-live=&quot;polite&quot;</code> explícito <strong>vence</strong>{" "}
        o implícito — <code>role=&quot;alert&quot; aria-live=&quot;polite&quot;</code>,
        que uma tela do app escreve, é uma região polida chamada de alerta. Não é
        redundância, é contradição. O app tem três contratos diferentes para a
        mesma coisa; aqui é um. Quem quer a caixa compõe{" "}
        <code>&lt;Alert tone=&quot;destructive&quot; variant=&quot;plain&quot;&gt;</code>{" "}
        na tela — compor a molécula dentro da molécula reprovaria a taxonomia.
      </DocNote>

      <DocNote title="A tecla morta não envia o formulário">
        Enquanto um acento está sendo composto, o <Kbd>Enter</Kbd> confirma o
        caractere — ele pertence ao editor de método de entrada, não ao
        formulário. Sem essa guarda, digitar <code>ç</code> ou <code>ã</code> num
        teclado que compõe enviava o formulário no meio da palavra.{" "}
        <code>isComposing</code> não existia em lugar nenhum deste repositório.
      </DocNote>

      <DocNote title="Um controle novo que use o Enter">
        Ou ganha um <code>data-slot</code> estável e uma linha em{" "}
        <code>shouldDeferEnterToWidget</code> — que é exportada, e tem teste —,
        ou a exceção fica documentada no próprio componente. O que não vale é
        descobrir em produção.
      </DocNote>

      <DocNote title="CustomForm continua válido">
        Ele é <code>Form</code> com <code>layout=&quot;none&quot;</code>. São 54
        chamadas em 29 arquivos, todas trazendo o próprio <code>gap</code> —
        trocar o nome sem trocar o conteúdo seria diff sem ganho. Elas migram
        quando a tela migrar os campos e os botões.
      </DocNote>

      <PropsTable
        title="Form"
        rows={[
          {
            prop: "layout",
            type: '"stack" | "inline" | "none"',
            description:
              "stack (padrão) empilha com --space-block; inline põe campo e botão na mesma linha; none é o que o CustomForm sempre foi.",
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
              "Gerado por useId quando não vem. É o que liga um botão que vive fora do <form>, pelo atributo form.",
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
              "Chamado sempre, depois da normalização. O evento pode chegar com defaultPrevented.",
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
              "A ajuda. Só renderiza quando existe — FieldDescription se registra mesmo vazia, e um aria-describedby apontando para um parágrafo vazio é pior que nenhum.",
          },
          {
            prop: "error",
            type: "React.ReactNode",
            description:
              "A mensagem. Renderizá-la é o que torna o campo inválido — o Field percebe sozinho.",
          },
          {
            prop: "optional",
            type: "boolean",
            description:
              "Marca o campo como opcional. A convenção do app é marcar o opcional, não o obrigatório.",
          },
          {
            prop: "fieldSize",
            type: '"sm" | "md"',
            description:
              "O degrau do andaime. Não é a altura do controle — essa é o size, que vai para o Input.",
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
              "inline é a fileira comum; sticky é o rodapé fixo de uma folha, sem fio, sem tinta e sem área segura.",
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
              "O rótulo enquanto envia. Sem ele o rótulo não muda — só o Spinner entra.",
          },
          {
            prop: "FormSubmit pending",
            type: "boolean",
            description:
              "Sobrescreve o pending do formulário, para um botão que envia outra coisa.",
          },
          {
            prop: "FormCancel",
            type: "ComponentProps<typeof Button>",
            description:
              "type='button' e variant='tertiary' são da peça, não de quem chama: é a tabela do rodapé.",
          },
          {
            prop: "FormError",
            type: "ComponentProps<typeof P>",
            description:
              "O erro do formulário inteiro. role='alert' e nada mais; some quando não há mensagem.",
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
    <PhoneFrame title="Prévia da folha de nova transação num telefone">
      <PhoneFrameSheet>
        {/* `children` em vez de `title`: com `title` a peça renderiza um
            `DialogTitle`, que exige o contexto do `Dialog` — e esta
            demonstração é a casca da folha fora de uma folha. Numa tela de
            verdade é `title` que se usa, e é ele que dá o nome acessível. */}
        <MobileSheetFormStickyHeader>
          <p className="font-heading text-base leading-tight font-medium">
            Nova transação
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Salvos: <span className="nums">{salvos}</span>
          </p>
        </MobileSheetFormStickyHeader>
        <Form
          layout="none"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault()
            setSalvos((v) => v + 1)
          }}
        >
          <MobileSheetFormBody className="flex flex-col gap-4 pb-4">
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
          </MobileSheetFormBody>
          <FormActions variant="sticky">
            <FormSubmit className="w-full">Salvar</FormSubmit>
          </FormActions>
        </Form>
      </PhoneFrameSheet>
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
          description="⌘+Enter envia de dentro do textarea."
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
