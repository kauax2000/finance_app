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
        Uma tarefa curta sem sair da tela: renomear, escolher, ajustar. No
        telefone, um formulário de verdade cabe melhor num <code>Sheet</code> de
        baixo. Dois eixos: <code>size</code> é a largura,{" "}
        <code>layout</code> é quem manda na altura — o conteúdo (<code>auto</code>
        ) ou a janela (<code>fixed</code>, com o corpo rolando entre cabeçalho e
        rodapé parados).
      </Usage>

      <DocSection
        title="Padrão"
        description="layout=&quot;auto&quot;: a altura vem do conteúdo, e o casco dá o respiro. É o diálogo de um campo, de uma escolha, de um aviso — o que cabe na tela sem rolar."
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
        description="layout=&quot;fixed&quot;: a altura é teto, e o corpo rola entre um cabeçalho e um rodapé parados. É a forma mais comum do app — 13 das 25 chamadas —, e era escrita à mão em cinco classes no casco mais três em cada corpo rolável. DialogBody é essas três, e a do meio (min-h-0) é a que falha calada: sem ela um item de flex não encolhe abaixo do conteúdo, e o diálogo cresce até sair da tela em vez de rolar."
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
        description="Quatro degraus, e o padrão é md — o mesmo do AlertDialog, e o que 17 das 19 chamadas explícitas do app já pediam escrevendo sm:max-w-md na tela. Em telas estreitas todos caem para a largura da janela menos 2rem: a escada só vale a partir de sm."
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
        description="DialogHeaderRow põe um controle na linha do título sem que ele dispute a largura do texto: o título e a descrição ficam numa coluna que encolhe, o adorno numa que não. Serve ao selo de estado, ao botão de ajuda, ao fechar próprio de um cabeçalho fixo."
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
              "Quem manda na altura. auto: o conteúdo, com o respiro no casco. fixed: a janela, com o corpo rolando em DialogBody entre cabeçalho e rodapé parados.",
          },
          {
            prop: "showCloseButton",
            type: "boolean",
            default: "true",
            description:
              "O × no canto. Desligue quando o cabeçalho tiver o próprio fechar — dois alvos para a mesma saída competem.",
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
              "Título e descrição, sem fio embaixo: o que separa as faixas é o respiro, e o conteúdo dissolvendo onde há rolagem. Já vem shrink-0 e, em layout=\"fixed\", com o recuo da tira — as duas coisas que as 16 chamadas escreviam toda vez.",
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
              "O corpo rolável do layout fixed: min-h-0 flex-1 overflow-y-auto, mais overscroll-contain para o gesto não vazar para a página atrás.",
          },
          {
            prop: "DialogFooter",
            type: "div · showCloseButton",
            description:
              "A tira de ações encostada na borda de baixo, nos dois layouts. Sem tingido e sem fio: o recuo e o peso dos botões já dizem que ali começa outra coisa.",
          },
        ]}
      />

      <DocNote title="A placa é --background de vidro, e a tela é que decidiu">
        Ela veste <code>modalSurfaceClassName</code>: <code>--background</code>{" "}
        a 85%, <strong>40%</strong> no escuro onde o borrão existe — mais aberta que
        a flutuante (60%), porque a 60% sobre a página ela lia como fosca. Uma
        rodada a levou a <code>--popover</code> para igualar o DatePicker, e o
        resultado leu como <strong>opaco</strong>: a 60% sobre a página velada o{" "}
        <code>--popover</code> compõe acima de tudo que está atrás, e nada
        atravessa. O <code>--background</code> afunda no véu, e é o borrão que a
        distingue — para um modal, que cobre a página inteira, é este o tom que
        lê como material.
        <br />
        <br />
        <strong>O que o borrão vê aqui é o véu</strong>, a 40%, mais a página:
        medido, delta 0 sobre um card, 2 sobre a página, 15 sobre um botão{" "}
        <code>primary</code>. Quem quiser o efeito mais visível mexe no véu, e
        não na placa.
      </DocNote>

      <DocNote title="O × não reserva lugar — o cabeçalho reserva por ele">
        O botão de fechar é <code>absolute</code>, então nada no cabeçalho sabe
        que ele existe: sem ajuda, um título longo ou o{" "}
        <code>endAdornment</code> de um <code>DialogHeaderRow</code> passa por
        baixo dele — 16px, medidos. O título e a coluna do adorno desviam do
        território do × por conta própria, e só quando há um × para desviar
        (<code>showCloseButton={"{false}"}</code> devolve a largura inteira). No
        telefone o desvio é <strong>simétrico</strong>, porque ali o cabeçalho é
        centralizado e um recuo de um lado só tira o título do eixo.
      </DocNote>

      <DocNote title="DialogTitle é obrigatório">
        Ele é o nome acessível do diálogo: sem ele, o leitor de tela anuncia
        &ldquo;diálogo&rdquo; e nada mais, e o Radix ainda avisa no console. Se o
        título não deve aparecer, ele existe assim mesmo com{" "}
        <code>className=&quot;sr-only&quot;</code>.
      </DocNote>

      <DocNote title="O rodapé tem uma hierarquia só">
        Cancelar é <code>tertiary</code> e vem antes; a ação que o diálogo veio
        propor é <code>primary</code>, ou <code>destructive</code> quando não tem
        volta. Como <code>DialogClose</code> é um passa-tudo, ele recebe{" "}
        <code>asChild</code> com um{" "}
        <code>Button variant=&quot;tertiary&quot; type=&quot;button&quot;</code>{" "}
        dentro — sem o <code>type</code>, ele vira o alvo do Enter dentro de um{" "}
        <code>Form</code>.
      </DocNote>

      <DocNote title="O rodapé sangra por variável, não por número">
        Ele precisa alcançar a borda do diálogo, e o quanto recuar depende do
        layout: em <code>auto</code> o casco tem recuo e o rodapé o desconta; em{" "}
        <code>fixed</code> o casco não tem, e não há o que descontar. Isso é uma
        variável (<code>--dialog-bleed</code>) e não uma regra de grupo de
        propósito — como regra, ela venceria por especificidade os{" "}
        <code>mx-0</code> que sete telas ainda escrevem, e quebraria exatamente
        quem a mudança veio servir. O valor fixo anterior
        (<code>-mx-4 -mb-4</code>) pressupunha um <code>p-4</code> que 13 das 25
        chamadas não usam, e era por isso que elas o anulavam.
      </DocNote>
    </>
  )
}
