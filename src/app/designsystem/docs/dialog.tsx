"use client"

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
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

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

export default function DialogDoc() {
  return (
    <>
      <Usage>
          Uma tarefa curta sem sair da tela: renomear, escolher, ajustar. Para confirmar o que não tem volta é o <code>AlertDialog</code>; um formulário longo no telefone cabe melhor num <code>Sheet</code>. <code>size</code> é a largura e <code>layout</code> decide quem manda na altura — o conteúdo (<code>auto</code>) ou a janela (<code>fixed</code>).
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
            <Button variant="outline">Renomear carteira</Button>
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
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <DocSection
        title="Formulário"
        description="layout=&quot;fixed&quot;: a altura é teto e o corpo rola entre cabeçalho e rodapé parados. Use DialogBody e não escreva o corpo à mão: sem o min-h-0 dele, o diálogo cresce até sair da tela em vez de rolar."
        code={`<DialogContent layout="fixed">
  <Form layout="none" className="flex min-h-0 flex-1 flex-col">
    <DialogHeader>
      <DialogTitle>Cadastro de cartão</DialogTitle>
      <DialogDescription>…</DialogDescription>
    </DialogHeader>
    <DialogBody>…</DialogBody>
    <DialogFooter>…</DialogFooter>
  </Form>
</DialogContent>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Cadastrar cartão</Button>
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
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <DocSection
        title="Largura"
        description="Quatro degraus, com md como padrão, o mesmo do AlertDialog. Abaixo de sm todos ocupam a janela menos 2rem."
        code={`<DialogContent size="sm">…</DialogContent>
<DialogContent>…</DialogContent>          {/* md */}
<DialogContent size="lg">…</DialogContent>
<DialogContent size="xl">…</DialogContent>`}
      >
        {(
          [
            ["sm", "384"],
            ["md", "448 · padrão"],
            ["lg", "512"],
            ["xl", "576"],
          ] as const
        ).map(([size, medida]) => (
          <Dialog key={size}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                {size}
              </Button>
            </DialogTrigger>
            <DialogContent size={size}>
              <DialogHeader>
                <DialogTitle>
                  size=&quot;{size}&quot;
                </DialogTitle>
                <DialogDescription>{medida} pixels no máximo.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="tertiary">
                    Fechar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
      </DocSection>

      <DocSection
        title="Controle no cabeçalho"
        description="DialogHeaderRow põe um controle na linha do título sem disputar a largura do texto — selo de estado, ajuda ou o fechar de um cabeçalho fixo."
        code={`<DialogHeader>
  <DialogHeaderRow endAdornment={<Badge tone="warning">Rascunho</Badge>}>
    <DialogTitle>Assinatura mensal</DialogTitle>
    <DialogDescription>Ainda não foi cobrada.</DialogDescription>
  </DialogHeaderRow>
</DialogHeader>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir com selo</Button>
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
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <PropsTable
        title="Props · DialogContent"
        rows={[
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description:
              "A largura máxima a partir de sm: 384, 448, 512, 576. Abaixo disso, a janela menos 2rem.",
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
              "Título e descrição, sem fio: quem separa é o respiro e a dissolução onde há rolagem.",
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
            type: "div · showCloseButton",
            description:
              "A tira de ações na borda de baixo, sem tinta nem fio.",
          },
        ]}
      />

      <DocNote title="A placa é --background de vidro">
          Ela veste <code>modalSurfaceClassName</code>: <code>--background</code> a 85%, e 40% no escuro onde há borrão. <code>--popover</code> leria como opaco sobre a página velada. O borrão vê o véu mais a página, então para um efeito mais visível mexa no véu, não na placa.
      </DocNote>

      <DocNote title="O cabeçalho reserva o lugar do ×">
          O × é <code>absolute</code>; o título e a coluna do adorno desviam do território dele sozinhos, e só quando ele existe (<code>showCloseButton={"{false}"}</code> devolve a largura). Sem isso, um título longo passa por baixo do botão.
      </DocNote>

      <DocNote title="DialogTitle é obrigatório">
          É o nome acessível do diálogo: sem ele o leitor de tela anuncia só &ldquo;diálogo&rdquo;. Se não deve aparecer, use <code>className=&quot;sr-only&quot;</code>.
      </DocNote>

      <DocNote title="O rodapé tem uma hierarquia só">
          Cancelar é <code>tertiary</code> e vem antes; a ação é <code>primary</code>, ou <code>destructive</code> quando não tem volta. <code>DialogClose</code> recebe <code>asChild</code> com um <code>Button variant=&quot;tertiary&quot; type=&quot;button&quot;</code> — sem o <code>type</code>, ele vira o alvo do Enter dentro de um <code>Form</code>.
      </DocNote>

      <DocNote title="O rodapé sangra por variável, não por número">
          <code>--dialog-bleed</code> desconta o recuo do casco em <code>auto</code> e vale zero em <code>fixed</code>. Não escreva <code>-mx-*</code> no rodapé: um número fixo supõe um recuo que o layout pode não ter.
      </DocNote>
    </>
  )
}
