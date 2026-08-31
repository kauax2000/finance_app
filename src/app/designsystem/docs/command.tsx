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

      <DocNote title="O grupo se separa por respiro e por rótulo, nunca por fio">
        Duas coisas faziam os grupos se dissolverem numa fileira só. O
        cabeçalho era <code>text-xs font-medium</code> — <strong>o mesmo peso
        das linhas</strong>, um degrau menor e mais claro, que é a receita de
        &quot;linha desabilitada&quot; e não de rótulo. E o{" "}
        <code>py-1</code> simétrico o deixava equidistante dos dois grupos,
        pertencendo a nenhum. Agora ele é caixa alta com{" "}
        <code>tracking-wider</code>, a mesma régua do cabeçalho da{" "}
        <code>Table</code>, e o respiro é assimétrico: 10px de margem acima do
        grupo contra 2px abaixo do rótulo, então ele pertence à lista que
        encima. Ficou visível quando a busca deste catálogo perdeu as
        descrições e todo item virou uma linha só.
        <br />
        <strong>
          A folga é margem no grupo, não recuo no cabeçalho
        </strong>{" "}
        — duas propriedades diferentes não disputam, enquanto um{" "}
        <code>pt</code> base mais um <code>pt</code> sob variante seriam a mesma
        propriedade duas vezes, decidida por ordem de emissão do Tailwind. E o
        primeiro grupo <em>visível</em> não recebe a folga por{" "}
        <code>[cmdk-group]:not([hidden])~&amp;</code>: o cmdk esconde os grupos
        sem resultado com o atributo <code>hidden</code>{" "}
        <strong>sem os tirar do DOM</strong>, então eles ficam no meio da
        fileira. Medido buscando &quot;card&quot;: <code>Átomos</code> sai
        escondido entre <code>Fundações</code> e <code>Moléculas</code>, e um
        seletor de adjacência (<code>+</code>) perderia o segundo grupo
        visível.
      </DocNote>

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
  <CommandInput placeholder="Buscar…" />   {/* rente, sem fio: o conteúdo dissolve */}
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

      <DocNote title="A superfície é uma só, e o que separa as faixas é a dissolução">
        A cor é declarada <strong>uma vez</strong>, na casca —{" "}
        <code>bg-popover/85</code> com <code>backdrop-blur</code>. Houve uma
        versão com vidro só nas pontas (<code>bg-background/85</code>, o do{" "}
        <code>&lt;header&gt;</code>) e ela ficava{" "}
        <strong>mais escura que o meio</strong>: <code>oklch(0.145)</code> nas
        faixas contra <code>oklch(0.205)</code> na lista, no tema escuro. Tom
        igual só é garantido quando a cor é declarada uma vez.
        <br />
        <br />
        <strong>Nenhuma das três faixas pinta</strong>, e o que marca os limites
        é o conteúdo sumindo, não uma superfície cobrindo. O rodapé sempre foi
        assim: transparente, só reservando altura, com uma{" "}
        <code>mask-image</code> na própria lista fazendo o trabalho. A faixa de
        busca passou a ser também.
        <br />
        <br />
        Tirar dela só o fio não bastava, e o motivo é aritmético: ela repintava{" "}
        <code>bg-popover/85</code> sobre um casco que já é{" "}
        <code>bg-popover/85</code>, e dois 85% empilhados dão{" "}
        <strong>97,75%</strong>. No tema escuro <code>--popover</code> é mais
        claro que a página, então a faixa era um retângulo <em>mais claro</em>{" "}
        com uma aresta na base — o mesmo bloco aceso que o rodapé já tinha
        registrado ao tentar pintar um gradiente. O <code>backdrop-blur</code>{" "}
        saiu junto: a borda do borrão desenha a linha sozinha. Quem esconde o
        conteúdo sob o campo é a rampa, não uma tinta.
      </DocNote>

      <DocNote title="Uma curva só, e ela cresce com a rolagem nos dois lados">
        Cada ponta dá <strong>44px</strong> ao conteúdo para se dissolver, com a
        mesma curva espelhada e o mesmo piso (0,06). E a zona{" "}
        <strong>cresce no passo em que a ponta consome o conteúdo</strong> — em
        cima com o <code>scrollTop</code>, embaixo com o que falta rolar.
        <br />
        <br />
        Um interruptor seria um pop severo, e a conta explica: o item da ponta
        nasce a 4px da faixa e mede 28px, então ele cabe <em>inteiro</em> dentro
        da zona — ligá-la de uma vez o levaria de chapado a um degradê de
        15%→80% em 1px de rolagem. Crescendo junto, nos dois extremos não há
        zona e o item da ponta fica nítido.
        <br />
        <br />
        A curva é <strong>sigmoide</strong>, e isso não é preciosismo: uma
        ease-out sai do chapado com inclinação máxima, e descontinuidade de
        derivada contra uma superfície lisa é o que o olho mais detecta — banda
        de Mach, numa linha horizontal que atravessa a paleta inteira. Vê-se o{" "}
        <em>começo</em> do fade, não um fade.
      </DocNote>

      <DocNote title="O rodapé mede só a legenda, e é por isso que não sobra branco">
        <code>--command-footer-h</code> já embutiu a pista de dissolução (72px =
        28 da legenda + 44 de pista), e era o que produzia{" "}
        <strong>~44px de branco</strong> entre o último item e o texto sempre
        que se rolava até o fim: no fim não há conteúdo para dissolver ali. A
        pista virou <code>--command-foot-fade</code>, que é máscara e não ocupa
        espaço. Hoje o vão é de 4px, medido.
        <br />
        <br />
        A altura depende da <strong>presença do rodapé</strong> — nunca da
        rolagem —, como a da faixa de busca depende da presença do campo. Ela já
        dependeu de <code>data-scrollable</code>, e isso era um laço:{" "}
        <code>pb</code> é <code>footer-h + 4</code>, então declarar “esta lista
        rola” <em>acrescentava 36px ao próprio conteúdo</em> e realimentava a
        condição que produziu a decisão. Uma lista que transbordava 20px virava
        rolável, ganhava <code>pb</code> 76, passava a transbordar 56, e nunca
        mais era reavaliada — <strong>histerese</strong>, não laço divergente, e
        por isso passou despercebida. Medido: uma demo desta página com 288 de
        altura e 297 de conteúdo estava marcada como rolável quando, com{" "}
        <code>pb</code> de 40, ela não rolaria.
        <br />
        <br />
        O <code>Combobox</code> pagava o mesmo sem nunca ter rodapé: 76px de
        calha vazia no fim de cada popover, e uma lista que só rolava por causa
        do próprio recuo. Agora <code>footer-h</code> é 0 lá.
      </DocNote>

      <DocNote title="scroll-pb é carga estrutural, não simetria">
        Ele conta a zona <em>inteira</em> (
        <code>footer-h + fade-h + 4</code> = 84), e sem isso a navegação por
        seta quebra: o <code>scrollIntoView</code> do cmdk depositaria o item
        selecionado a 40px do fundo enquanto a zona de baixo chega a 80 — item
        ativo renderizado a 0,05 de alfa. Medido depois: o item ativo para a
        4px da zona, fora dela. A margem já existia antes (76 contra 72), mas
        por acidente, e ninguém a tinha registrado.
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
