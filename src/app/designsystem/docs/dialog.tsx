"use client"

import * as React from "react"
import { TrashIcon, UserPlusIcon } from "@heroicons/react/16/solid"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderRow,
  DialogMedia,
  DialogSteps,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import { Form, FormCancel, FormSubmit } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Controles, DocNote, DocSection, Eixo, PropsTable, Usage } from "../ds-doc"

const CAMPOS = [
  "Nome do cartão",
  "Últimos quatro dígitos",
  "Dia de fechamento",
  "Dia de vencimento",
  "Limite",
  "Mês de validade",
  "Ano de validade",
  "Apelido interno",
]

const PASSOS = ["Renda", "Categorias", "Revisão"]

export default function DialogDoc() {
  return (
    <>
      <Usage>
          Uma tarefa curta sem sair da tela: renomear, escolher, ajustar. Para confirmar o que não tem volta é o <code>AlertDialog</code>. <code>size</code> é a largura, <code>layout</code> decide quem manda na altura — o conteúdo (<code>auto</code>) ou a janela (<code>fixed</code>) —, e <code>surface=&quot;auto&quot;</code> faz o mesmo diálogo virar gaveta no telefone.
      </Usage>

      <DocSection
        title="Padrão"
        description="layout=&quot;auto&quot;: a altura vem do conteúdo e o casco dá o respiro. Para um campo, uma escolha, um aviso — o que cabe sem rolar."
        code={`<Dialog>
  <DialogTrigger asChild><Button>Renomear</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Renomear carteira</DialogTitle>
      <DialogDescription>O nome aparece no seletor.</DialogDescription>
    </DialogHeader>
    …
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="tertiary">Cancelar</Button>
      </DialogClose>
      <Button type="submit">Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">renomear carteira</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear carteira</DialogTitle>
              <DialogDescription>
                O nome aparece no seletor e nos relatórios.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ds-dialog-nome">Nome</Label>
              <Input id="ds-dialog-nome" defaultValue="Conta corrente" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="tertiary">
                  cancelar
                </Button>
              </DialogClose>
              <Button type="submit">salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <DocSection
        title="Formulário, e a gaveta no telefone"
        description={
          <>
            <code>layout=&quot;fixed&quot;</code>: a altura é teto e o corpo
            rola entre cabeçalho e rodapé parados — use <code>DialogBody</code>,
            cujo <code>min-h-0</code> é o que faz rolar. Com{" "}
            <code>surface=&quot;auto&quot;</code>, abaixo de 768px o mesmo
            diálogo é a gaveta do <code>Sheet</code>, arrastável e com a área
            segura: nada de <code>if (isMobile)</code> trocando de componente.
          </>
        }
        code={`<Dialog surface="auto">
  <DialogContent layout="fixed">
    <DialogHeader>…</DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>…</DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog surface="auto">
          <DialogTrigger asChild>
            <Button variant="outline">cadastrar cartão</Button>
          </DialogTrigger>
          <DialogContent layout="fixed">
            <DialogHeader>
              <DialogTitle>Cadastro de cartão</DialogTitle>
              <DialogDescription>
                Dados para identificar o cartão nas despesas.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
              {CAMPOS.map((campo, i) => (
                <Field key={campo}>
                  <FieldLabel htmlFor={`ds-dialog-campo-${i}`}>
                    {campo}
                  </FieldLabel>
                  <Input id={`ds-dialog-campo-${i}`} placeholder={campo} />
                </Field>
              ))}
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="tertiary">
                  cancelar
                </Button>
              </DialogClose>
              <Button type="submit">cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <DocSection
        title="Salvando e o rascunho"
        description={
          <>
            <code>pending</code> trava o diálogo enquanto salva: Esc, véu, ×,
            Cancelar e o arraste da gaveta não fecham, e o casco marca{" "}
            <code>aria-busy</code>; o botão é o <code>FormSubmit</code>, com o
            andamento. <code>dirty</code> + <code>confirmDiscard</code> faz
            fechar um formulário alterado perguntar antes.
          </>
        }
        code={`<Dialog surface="auto" pending={salvando} dirty={alterado} confirmDiscard>
  <DialogContent>
    <Form pending={salvando} onSubmit={salvar}>
      …
      <DialogFooter>
        <DialogClose asChild><FormCancel>cancelar</FormCancel></DialogClose>
        <FormSubmit pendingLabel="salvando…">salvar</FormSubmit>
      </DialogFooter>
    </Form>
  </DialogContent>
</Dialog>`}
      >
        <SalvarDemo />
      </DocSection>

      <DocSection
        title="Ícone e controle no cabeçalho"
        description={
          <>
            <code>DialogMedia</code> põe o ícone na linha do título, na cor
            dele e sem poço — a forma do <code>AlertDialogMedia</code>.{" "}
            <code>DialogHeaderRow</code> põe um controle na linha do título sem
            disputar a largura do texto. Título sobre descrição não tem{" "}
            <code>gap</code>: é par de identidade, e quem os separa é a
            entrelinha.
          </>
        }
        code={`<DialogHeader>
  <DialogMedia><UserPlusIcon /></DialogMedia>
  <DialogTitle>Convidar pessoa</DialogTitle>
  <DialogDescription>…</DialogDescription>
</DialogHeader>

<DialogHeaderRow endAdornment={<Badge tone="warning">Rascunho</Badge>}>…</DialogHeaderRow>`}
      >
        <CabecalhoDemo />
      </DocSection>

      <DocSection
        title="Passos"
        description={
          <>
            <code>DialogSteps</code> diz &ldquo;Passo 2 de 3&rdquo; com a barra
            segmentada, dentro do cabeçalho. Com ele um diálogo{" "}
            <code>fixed</code> ocupa o teto de altura, e a janela não pula
            quando o passo troca. &ldquo;Voltar&rdquo; vai em{" "}
            <code>DialogFooter start</code>.
          </>
        }
        code={`<DialogHeader>
  <DialogSteps current={passo} total={3} labels={["Renda", "Categorias", "Revisão"]} />
  <DialogTitle>…</DialogTitle>
</DialogHeader>
…
<DialogFooter start={passo > 0 ? <Button variant="tertiary">Voltar</Button> : null}>…</DialogFooter>`}
      >
        <PassosDemo />
      </DocSection>

      <DocSection
        title="Ação à esquerda no rodapé"
        description={
          <>
            <code>start</code> é a ação do outro lado — &ldquo;Excluir&rdquo;,
            &ldquo;Voltar&rdquo; —, encostada à esquerda no desktop e embaixo
            de tudo no telefone.
          </>
        }
        code={`<DialogFooter
  start={<Button variant="tertiary"><TrashIcon />Excluir</Button>}
>
  <DialogClose asChild><Button variant="tertiary">Cancelar</Button></DialogClose>
  <Button>Salvar</Button>
</DialogFooter>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">editar conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conta de luz</DialogTitle>
              <DialogDescription>Mensal, vence todo dia 10.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ds-dialog-conta">Nome</Label>
              <Input id="ds-dialog-conta" defaultValue="Conta de luz" />
            </div>
            <DialogFooter
              start={
                <Button
                  type="button"
                  variant="tertiary"
                  className="text-destructive"
                >
                  <TrashIcon aria-hidden />
                  excluir
                </Button>
              }
            >
              <DialogClose asChild>
                <Button type="button" variant="tertiary">
                  cancelar
                </Button>
              </DialogClose>
              <Button type="submit">salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <DocSection
        title="Largura"
        description="Quatro degraus e a tela cheia, com md como padrão, o mesmo do AlertDialog. Abaixo de sm todos ocupam a janela menos 2rem; full ocupa a janela com 2rem de margem, e com layout fixed também a altura."
        code={`<DialogContent size="sm">…</DialogContent>
<DialogContent>…</DialogContent>          {/* md */}
<DialogContent size="full" layout="fixed">…</DialogContent>`}
        previewClassName="flex-col items-start gap-3"
      >
        <LarguraDemo />
      </DocSection>

      <PropsTable
        title="Props · Dialog"
        rows={[
          {
            prop: "surface",
            type: '"dialog" | "auto"',
            default: '"dialog"',
            description:
              "auto: diálogo no desktop, a gaveta do Sheet abaixo de 768px.",
          },
          {
            prop: "pending",
            type: "boolean",
            default: "false",
            description:
              "Salvando: Esc, véu, ×, Cancelar e o arraste não fecham; aria-busy no casco.",
          },
          {
            prop: "dirty / confirmDiscard",
            type: "boolean / boolean | { title, description }",
            default: "false",
            description:
              "Com os dois, fechar um formulário alterado pergunta “Descartar alterações?”.",
          },
        ]}
      />

      <PropsTable
        title="Props · DialogContent"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl" | "full"',
            default: '"md"',
            description:
              "A largura máxima a partir de sm: 384, 448, 512, 576, ou a janela com 2rem de margem.",
          },
          {
            prop: "layout",
            type: '"auto" | "fixed"',
            default: '"auto"',
            description:
              "Quem manda na altura: auto, o conteúdo; fixed, a janela, com o corpo rolando em DialogBody.",
          },
          {
            prop: "showCloseButton",
            type: "boolean",
            default: "true",
            description:
              "O × no canto; desligue quando o cabeçalho tiver o próprio fechar.",
          },
        ]}
      />

      <PropsTable
        title="Slots"
        rows={[
          {
            prop: "DialogHeader",
            type: "div",
            description:
              "Título e descrição sem gap (par de identidade), e sem fio.",
          },
          {
            prop: "DialogMedia",
            type: "span",
            description: "O ícone na linha do título. Antes do título.",
          },
          {
            prop: "DialogSteps",
            type: "current · total · labels",
            description:
              "Passo N de M com a barra segmentada; o fixed passa a ocupar o teto.",
          },
          {
            prop: "DialogHeaderRow",
            type: "div · endAdornment",
            description:
              "Um controle na linha do título, numa coluna que não encolhe.",
          },
          {
            prop: "DialogBody",
            type: "div",
            description:
              "O corpo rolável do layout fixed, com overscroll-contain para o gesto não vazar.",
          },
          {
            prop: "DialogFooter",
            type: "div · showCloseButton · start",
            description:
              "A tira de ações, sem tinta nem fio; start encosta uma ação à esquerda.",
          },
        ]}
      />

      <DocNote title="A placa é --background de vidro">
          Ela veste <code>modalSurfaceClassName</code>: <code>--background</code> a 85%, e 50% no escuro onde há borrão — mais aberta que a flutuante (<code>--popover</code> 85/60) justamente porque pousa sobre um véu. <code>--popover</code> leria como opaco sobre a página velada. O borrão vê o véu mais a página, então para um efeito mais visível mexa no véu, não na placa.
      </DocNote>

      <DocNote title="Brota do centro, como os menus">
          Do <code>md</code> para cima a placa nasce no centro com o gesto dos menus (<code>menu-morph</code>, 380ms) até o raio do modal, e recolhe nele ao fechar (<code>menu-unmorph</code>, 210ms). O conteúdo chega peça a peça, do desfoque, depois da forma: <code>--dialog-reveal-atraso</code> soma 150ms à cascata. Abaixo do <code>md</code> continua a mola de antes (<code>zoom-in-95</code>), e a gaveta é do <code>vaul</code>.
      </DocNote>

      <DocNote title="O cabeçalho reserva o lugar do ×">
          O × é <code>absolute</code>; o título e a coluna do adorno desviam do território dele sozinhos, e só quando ele existe (<code>showCloseButton={"{false}"}</code> devolve a largura). Sem isso, um título longo passa por baixo do botão.
      </DocNote>

      <DocNote title="DialogTitle é obrigatório">
          É o nome acessível do diálogo: sem ele o leitor de tela anuncia só &ldquo;diálogo&rdquo;. Se não deve aparecer, use <code>className=&quot;sr-only&quot;</code>. Na gaveta ele continua ligado: as três superfícies são a mesma primitiva.
      </DocNote>

      <DocNote title="O rodapé tem uma hierarquia só">
          Cancelar é <code>tertiary</code> e vem antes; a ação é <code>primary</code>, ou <code>destructive</code> quando não tem volta. Num <code>Form</code>, <code>FormCancel</code> e <code>FormSubmit</code> já trazem isso, com o andamento — o &ldquo;Salvando…&rdquo; não se escreve à mão.
      </DocNote>

      <DocNote title="O rodapé sangra por variável, não por número">
          <code>--dialog-bleed</code> desconta o recuo do casco em <code>auto</code> e vale zero em <code>fixed</code>. Não escreva <code>-mx-*</code> no rodapé: um número fixo supõe um recuo que o layout pode não ter.
      </DocNote>
    </>
  )
}

function SalvarDemo() {
  const [aberto, setAberto] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [nome, setNome] = React.useState("Conta corrente")
  const original = "Conta corrente"

  return (
    <Dialog
      surface="auto"
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v)
        if (v) setNome(original)
      }}
      pending={salvando}
      dirty={nome !== original}
      confirmDiscard
    >
      <DialogTrigger asChild>
        <Button variant="outline">renomear e salvar</Button>
      </DialogTrigger>
      <DialogContent>
        <Form
          layout="none"
          pending={salvando}
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            setSalvando(true)
            window.setTimeout(() => {
              setSalvando(false)
              setAberto(false)
            }, 1800)
          }}
        >
          <DialogHeader>
            <DialogTitle>Renomear carteira</DialogTitle>
            <DialogDescription>
              Mude o nome e tente fechar: o diálogo pergunta antes. Salve, e
              ele trava até terminar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-dialog-salvar">Nome</Label>
            <Input
              id="ds-dialog-salvar"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <FormCancel>cancelar</FormCancel>
            </DialogClose>
            <FormSubmit pendingLabel="salvando…">salvar</FormSubmit>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CabecalhoDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">com ícone</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogMedia>
              <UserPlusIcon />
            </DialogMedia>
            <DialogTitle>Convidar pessoa</DialogTitle>
            <DialogDescription>
              Ela recebe um e-mail e entra na carteira com o papel escolhido.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ds-dialog-email">E-mail</Label>
            <Input id="ds-dialog-email" type="email" placeholder="nome@exemplo.com" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="tertiary">
                cancelar
              </Button>
            </DialogClose>
            <Button type="submit">convidar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">com selo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogHeaderRow
              endAdornment={
                <Badge tone="warning" size="sm">
                  Rascunho
                </Badge>
              }
            >
              <DialogTitle>Assinatura mensal</DialogTitle>
              <DialogDescription>
                Ainda não foi cobrada neste ciclo.
              </DialogDescription>
            </DialogHeaderRow>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="tertiary">
                fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PassosDemo() {
  const [passo, setPasso] = React.useState(0)

  return (
    <Dialog surface="auto" onOpenChange={(v) => v && setPasso(0)}>
      <DialogTrigger asChild>
        <Button variant="outline">configurar categorias</Button>
      </DialogTrigger>
      <DialogContent layout="fixed">
        <DialogHeader>
          <DialogSteps current={passo} total={PASSOS.length} labels={PASSOS} />
          <DialogTitle>
            {
              [
                "Qual é a sua renda mensal?",
                "Escolha as categorias",
                "Revise e conclua",
              ][passo]
            }
          </DialogTitle>
          <DialogDescription>
            {
              [
                "Opcional: ela sugere os limites do próximo passo.",
                "Cada categoria pode ter um limite por mês.",
                "Dá para mudar tudo depois, em Categorias.",
              ][passo]
            }
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {passo === 0 ? (
            <Field>
              <FieldLabel htmlFor="ds-dialog-renda">Renda</FieldLabel>
              <Input id="ds-dialog-renda" inputMode="decimal" placeholder="R$ 0,00" />
            </Field>
          ) : passo === 1 ? (
            ["Mercado", "Moradia", "Transporte", "Lazer"].map((c) => (
              <Field key={c}>
                <FieldLabel htmlFor={`ds-dialog-cat-${c}`}>{c}</FieldLabel>
                <Input id={`ds-dialog-cat-${c}`} inputMode="decimal" placeholder="R$ 0,00" />
              </Field>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              4 categorias, R$ 3.200,00 de limites no mês.
            </p>
          )}
        </DialogBody>
        <DialogFooter
          start={
            passo > 0 ? (
              <Button
                type="button"
                variant="tertiary"
                onClick={() => setPasso((p) => p - 1)}
              >
                voltar
              </Button>
            ) : null
          }
        >
          {passo < PASSOS.length - 1 ? (
            <Button type="button" onClick={() => setPasso((p) => p + 1)}>
              continuar
            </Button>
          ) : (
            <DialogClose asChild>
              <Button type="button">concluir</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LarguraDemo() {
  const [size, setSize] = React.useState<"sm" | "md" | "lg" | "xl" | "full">(
    "md"
  )
  const medida = { sm: "384", md: "448 · padrão", lg: "512", xl: "576", full: "a janela com 2rem de margem" }[size]

  return (
    <>
      <Controles
        inicio={
          <Eixo rotulo="size" valores={["sm", "md", "lg", "xl", "full"] as const} valor={size} onChange={setSize} />
        }
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">abrir</Button>
        </DialogTrigger>
        <DialogContent
          size={size}
          layout={size === "full" ? "fixed" : "auto"}
        >
          <DialogHeader>
            <DialogTitle>size=&quot;{size}&quot;</DialogTitle>
            <DialogDescription>{medida}.</DialogDescription>
          </DialogHeader>
          {size === "full" ? <DialogBody /> : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="tertiary">
                fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
