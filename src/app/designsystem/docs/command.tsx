"use client"

import { Cog6ToothIcon, CreditCardIcon, PlusIcon, WalletIcon } from "@heroicons/react/16/solid"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  CommandEmptyDescription,
  CommandEmptyTitle,
  CommandFooter,
  CommandHint,
  CommandItemContent,
  CommandItemDescription,
  CommandItemTitle,
  CommandLoading,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function CommandDoc() {
  return (
    <>
      <Usage>
        A paleta de comandos: uma busca que encontra telas, ações e registros ao mesmo tempo. É o atalho de quem usa o app todo dia.
      </Usage>

      <DocSection
        title="Inline"
        description="A mesma lista, sem o diálogo. Serve dentro de um popover ou de uma folha."
        code={`<Command>
  <CommandInput placeholder="Buscar…" />
  <CommandList>
    <CommandEmpty>Nada encontrado.</CommandEmpty>
    <CommandGroup heading="Ir para">
      <CommandItem>Carteiras</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`}
        previewClassName="items-stretch"
      >
        <Command variant="panel" className="w-full max-w-md">
          <CommandInput placeholder="Buscar tela, ação ou transação…" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Ir para">
              <CommandItem>
                <WalletIcon aria-hidden />
                Carteiras
              </CommandItem>
              <CommandItem>
                <CreditCardIcon aria-hidden />
                Cartões
              </CommandItem>
              <CommandItem>
                <Cog6ToothIcon aria-hidden />
                Configurações
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Ações">
              <CommandItem>
                <PlusIcon aria-hidden />
                Nova transação
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DocSection>

      <DocSection
        title="Como diálogo (⌘K)"
        code={`const [open, setOpen] = React.useState(false)

React.useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((v) => !v)
    }
  }
  document.addEventListener("keydown", onKey)
  return () => document.removeEventListener("keydown", onKey)
}, [])

<CommandDialog open={open} onOpenChange={setOpen}>…</CommandDialog>`}
      >
        <CommandDialogDemo />
      </DocSection>

      <DocSection
        title="Linha de duas linhas"
        code={`<CommandItem>
  <CommandItemContent>
    <CommandItemTitle>Nova transação</CommandItemTitle>
    <CommandItemDescription>Lança uma despesa ou receita</CommandItemDescription>
  </CommandItemContent>
  <CommandShortcut>⌘N</CommandShortcut>
</CommandItem>`}
      >
        <Command variant="panel" className="max-w-sm">
          <CommandList>
            <CommandGroup heading="Ações">
              {[
                ["Nova transação", "Lança uma despesa ou receita", "⌘N"],
                ["Nova fatura", "Registra uma conta a pagar", "⌘F"],
              ].map(([t, d, k]) => (
                <CommandItem key={t}>
                  <CommandItemContent>
                    <CommandItemTitle>{t}</CommandItemTitle>
                    <CommandItemDescription>{d}</CommandItemDescription>
                  </CommandItemContent>
                  <CommandShortcut>{k}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DocSection>

      <DocSection
        title="Vazio e carregando"
        code={`<CommandEmpty>
  <CommandEmptyTitle>Nada encontrado para "xyz".</CommandEmptyTitle>
  <CommandEmptyDescription>A busca cobre nome e descrição.</CommandEmptyDescription>
</CommandEmpty>

<CommandLoading><Spinner /> Buscando…</CommandLoading>`}
      >
        <div className="flex w-full flex-col gap-4">
          <Command variant="panel" className="max-w-sm">
            <CommandList>
              <CommandEmpty>
                <CommandEmptyTitle>
                  Nada encontrado para &quot;xyz&quot;.
                </CommandEmptyTitle>
                <CommandEmptyDescription>
                  A busca cobre o nome e a descrição de cada página.
                </CommandEmptyDescription>
              </CommandEmpty>
            </CommandList>
          </Command>
          <Command variant="panel" className="max-w-sm">
            <CommandList>
              <CommandLoading>
                <Spinner />
                Buscando no servidor…
              </CommandLoading>
            </CommandList>
          </Command>
        </div>
      </DocSection>

      <DocNote title="O tique que nunca acendia">
        A linha renderizava um <code>CheckIcon</code> escondido por{" "}
        <code>opacity-0</code> e revelado por{" "}
        <code>group-data-[checked=true]</code>. <strong>O cmdk não emite{" "}
        <code>data-checked</code></strong> — medido no DOM, os atributos de um
        item são <code>data-slot</code>, <code>data-disabled</code>,{" "}
        <code>data-selected</code> e <code>data-value</code>. O ícone nunca
        aparecia. E no <code>Combobox</code>, que desenha o próprio check, cada
        linha saía com <strong>dois ícones</strong> — um funcionando e um
        permanentemente invisível. Quem marca seleção é quem sabe o que está
        selecionado, e isso não é a paleta.
      </DocNote>

      <DocNote title="O corpo é o dos menus, os estados não">
        A geometria vem de <code>menuItemGeometryClassName</code>: o{" "}
        <code>Command</code> é a quarta superfície de comandos do projeto e era
        a única fora da régua. Os <strong>estados</strong> ficam aqui porque o
        cmdk os escreve diferente: a linha ativa é <code>data-selected</code> e
        não <code>:focus</code>, e <code>data-disabled=&quot;false&quot;</code>{" "}
        fica <em>sempre presente</em> no elemento — a regra por presença dos
        menus apagaria toda linha.
      </DocNote>

      <DocSection
        title="As três faixas"
        code={`<Command variant="panel">
  <CommandInput placeholder="Buscar…" />   {/* rente, com o fio embaixo */}
  <CommandList>…</CommandList>             {/* o recuo é daqui */}
  <CommandFooter>                          {/* sangra, tinta mais quieta */}
    <CommandHint><Kbd>↵</Kbd> abrir</CommandHint>
  </CommandFooter>
</Command>`}
      >
        <Command variant="panel" className="max-w-sm">
          <CommandInput placeholder="Buscar…" />
          <CommandList>
            <CommandGroup heading="Ir para">
              <CommandItem>Carteiras</CommandItem>
              <CommandItem>Cartões</CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandFooter>
            <CommandHint>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navegar
            </CommandHint>
            <CommandHint>
              <Kbd>↵</Kbd>
              abrir
            </CommandHint>
          </CommandFooter>
        </Command>
      </DocSection>

      <DocNote title="A superfície é uma só, e o que separa as faixas é o fio">
        A casca pinta e borra — <code>bg-popover/85</code> com{" "}
        <code>backdrop-blur</code> —, e as três faixas não têm tinta própria.
        Houve uma versão com vidro só nas pontas (<code>bg-background/85</code>,
        o do <code>&lt;header&gt;</code>) e ela ficava{" "}
        <strong>mais escura que o meio</strong>: <code>oklch(0.145)</code> nas
        faixas contra <code>oklch(0.205)</code> na lista, no tema escuro. Tom
        igual só é garantido quando a cor é declarada uma vez.
      </DocNote>

      <DocNote title="O recuo é da lista, e o vidro precisa de algo atrás">
        O recuo saiu da casca e foi para o <code>CommandList</code>, que é onde
        há linhas — e com isso o <code>-mx-1</code> do separador volta a sangrar
        exatamente ele. Já o vidro impôs a sua própria condição:{" "}
        <code>backdrop-filter</code> sobre uma cor opaca não desenha nada, então
        o casco do <code>CommandDialog</code> ficou transparente para o borrão
        alcançar a página.
      </DocNote>

      <DocNote title="O campo é o mesmo do cabeçalho do catálogo">
        <code>h-8</code> (o degrau <code>md</code>), <code>rounded-lg</code>,{" "}
        <code>border-border</code> e <code>bg-input-fill/30</code> — as mesmas
        medidas do gatilho de busca lá em cima. Quem abre a paleta vem de clicar
        naquele campo: encontrar outro desenho do outro lado do gesto quebra a
        continuidade.
      </DocNote>

      <DocNote title="O topo não se mexe enquanto a lista encolhe">
        Um diálogo comum centraliza pela altura <strong>real</strong>. Numa
        paleta isso faz o campo de busca subir e descer sob o cursor a cada
        tecla, conforme os resultados diminuem. Aqui o topo é fixado onde a
        caixa <em>cheia</em> começaria —{" "}
        <code>calc(50% - altura-máxima / 2)</code> — e o que encolhe é a borda
        de baixo. Medido: com 89, 8, 3, 1 e zero resultados, o topo fica em
        178px e só a base se move (690 → 476 → 340).
        <br />
        <br />
        O <code>top-1/3</code> que o shadcn usa resolve o mesmo sintoma
        chutando um terço da tela; esta conta acerta o centro de verdade quando
        a lista está cheia, que é como a paleta abre.
      </DocNote>

      <DocNote title="Duas variantes, e a pergunta é quem desenha a moldura">
        <code>bare</code> não desenha nada — nem borda, nem canto: ele{" "}
        <strong>herda o raio de quem o contém</strong>. Dentro de um{" "}
        <code>Popover</code> ele fica com os 10px do popover; dentro de um{" "}
        <code>CommandDialog</code>, com os 14px do diálogo. <code>panel</code> é
        o oposto: a paleta solta numa página, que precisa da própria moldura.
        <br />
        <br />
        Houve uma terceira, <code>dialog</code>, e ela foi apagada. Existia só
        para cravar <code>rounded-xl</code> e bater com o casco — um número que
        pertence ao <em>contêiner</em>, copiado para dentro do componente.
        Herdando, a paleta acerta qualquer superfície sem saber de nenhuma. E
        antes dela houve <code>inline | dialog</code>, que decidia só o
        arredondamento e deixava <strong>as quatro demonstrações desta página
        escrevendo <code>border border-border</code> à mão</strong>.
      </DocNote>

      <DocNote title="O primeiro consumidor é este catálogo">
        A busca do cabeçalho aqui em cima é um <code>CommandDialog</code>{" "}
        — abra com <kbd>⌘</kbd><kbd>K</kbd>. O código está em{" "}
        <code>src/app/designsystem/ds-search.tsx</code> e serve de referência
        para as duas decisões que o componente não toma: o que entra na lista e
        como se filtra.
      </DocNote>

      <DocNote title="O filtro padrão do cmdk é difuso, e isto é em português">
        O padrão pontua por aproximação, então &ldquo;cor&rdquo; devolve Carousel e Combobox junto com Cores. A busca do catálogo passa um <code>filter</code> por substring, com acentos removidos dos dois lados.
      </DocNote>

      <DocNote title="⌘K precisa de um gatilho visível também">
        Um atalho que só existe no teclado não existe no telefone e ninguém descobre. O botão no cabeçalho é o que torna a paleta encontrável; o <kbd>⌘</kbd><kbd>K</kbd> desenhado dentro dele ensina o atalho.
      </DocNote>
      <PropsTable
        rows={[
          {
            prop: "variant",
            type: '"bare" | "panel"',
            default: '"bare"',
            description:
              "bare não desenha moldura e herda o canto de quem o contém; panel traz borda e sombra próprias, para a paleta solta numa página.",
          },
          {
            prop: "CommandItemContent",
            type: 'ComponentProps<"span">',
            description:
              "A pilha de nome sobre descrição — sem gap, porque é o mesmo dado em duas linhas.",
          },
          {
            prop: "CommandEmptyTitle / Description",
            type: 'ComponentProps<"p">',
            description:
              "As duas linhas do vazio: o que não foi achado, e o que tentar em vez disso.",
          },
          {
            prop: "CommandFooter / CommandHint",
            type: 'ComponentProps<"div"> / <"span">',
            description:
              "A terceira faixa: sangra até as bordas, traz o fio e a tinta quieta. Hint é a dupla tecla + o que ela faz.",
          },
          {
            prop: "CommandLoading",
            type: "ComponentProps<typeof Command.Loading>",
            description:
              "Busca assíncrona. O cmdk sempre teve; o projeto não expunha.",
          },
        ]}
      />
    </>
  )
}

function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Buscar
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar tela, ação ou transação…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ir para">
            <CommandItem onSelect={() => setOpen(false)}>
              <WalletIcon aria-hidden />
              Carteiras
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <CreditCardIcon aria-hidden />
              Cartões
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandFooter>
          <CommandHint>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navegar
          </CommandHint>
          <CommandHint>
            <Kbd>↵</Kbd>
            abrir
          </CommandHint>
        </CommandFooter>
      </CommandDialog>
    </>
  )
}
