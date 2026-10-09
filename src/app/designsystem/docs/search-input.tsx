"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SearchInput } from "@/components/ui/search-input"
import { Caption } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CATEGORIAS = ["Mercado", "Moradia", "Transporte", "Saúde", "Lazer", "Educação"]

export default function SearchInputDoc() {
  return (
    <>
      <Usage>
        O campo de busca do projeto: a pílula com a lupa quieta, a semântica de{" "}
        <code>type=&quot;search&quot;</code> e o × do navegador trocado pelo nosso.
        É o mesmo desenho do gatilho do cabeçalho deste catálogo e do campo da{" "}
        <Link href="/designsystem/command" className="underline">
          paleta
        </Link>{" "}
        e do{" "}
        <Link href="/designsystem/combobox" className="underline">
          Combobox
        </Link>
        . Use-o em toda busca, em vez de <code>&lt;Input type=&quot;search&quot;&gt;</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Com onClear, o × aparece quando há texto e devolve o foco ao campo. Sem onClear, não há botão — um × que não limpa nada é pior que nenhum."
        code={`<SearchInput
  value={q}
  onChange={(e) => setQ(e.target.value)}
  onClear={() => setQ("")}
  placeholder="Buscar na descrição…"
/>`}
        previewClassName="flex-col items-stretch"
      >
        <Demo />
      </DocSection>

      <DocSection
        title="A escada"
        description="Os degraus dos outros campos — 28, 32, 36 e 40 —, com o respiro e o recuo crescendo junto. md é o gatilho do cabeçalho, lg é a pílula da paleta. No dedo, os três de baixo sobem a 40, o piso dos campos."
        code={`<SearchInput size="sm" />
<SearchInput size="md" />   {/* o padrão */}
<SearchInput size="lg" />
<SearchInput size="xl" />`}
        previewClassName="flex-col items-stretch"
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <SearchInput
              key={size}
              size={size}
              placeholder={`size="${size}"`}
              aria-label={`Busca ${size}`}
            />
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Dentro de um painel flutuante"
        description="surface=&quot;plate&quot; é a pílula de vidro: a tinta da placa e um anel de 1px, sem preenchimento. Num popover, um campo preenchido seria uma segunda superfície sobre a placa. É a busca do Combobox e da paleta (pelo CommandInput, que monta este componente), do FormPickerPopover e do filtro de categorias."
        code={`<PopoverContent>
  <SearchInput surface="plate" placeholder="Buscar categoria…" />
  …
</PopoverContent>`}
      >
        <PlacaDemo />
      </DocSection>

      <DocSection
        title="Atalho"
        description="shortcut põe a tecla à direita, sem pastilha — o ⌘K do cabeçalho — e a tecla foca o campo de verdade. Sem modificadora, ela não dispara com o foco num campo de texto, onde é texto. Com texto, o lugar é do ×. Nesta página ⌘K e / são da paleta do catálogo; aperte F."
        code={`<SearchInput shortcut="/" />
<SearchInput shortcut="mod+k" />`}
        previewClassName="flex-col items-stretch"
      >
        <SearchInput
          shortcut="f"
          placeholder="Buscar transação…"
          aria-label="Buscar transação"
          className="max-w-sm"
        />
      </DocSection>

      <DocSection
        title="Marca"
        description="variant=&quot;brand&quot;: a borda acende em arco-íris conforme o ponteiro se aproxima — o gatilho do cabeçalho deste catálogo. Só na superfície field. Uma por tela."
        code={`<SearchInput variant="brand" />`}
        previewClassName="flex-col items-stretch"
      >
        <SearchInput
          variant="brand"
          placeholder="Buscar componentes e tokens…"
          aria-label="Buscar componentes e tokens"
          className="max-w-sm"
        />
      </DocSection>

      <DocSection
        title="Carregando"
        description="pending troca a lupa pelo Spinner e marca aria-busy, sem mudar o tamanho — para a busca que vai ao servidor. O campo continua aceitando texto."
        code={`<SearchInput value={q} onChange={…} pending={buscando} />`}
        previewClassName="flex-col items-stretch"
      >
        <PendenteDemo />
      </DocSection>

      <DocNote title="Uma receita, três peças">
        O gatilho do cabeçalho é um <code>&lt;button&gt;</code> (um campo que não aceita texto é a promessa que a paleta cumpre), o campo da paleta tem de ser o <code>Command.Input</code> do cmdk, e o <code>SearchInput</code> é um <code>&lt;input&gt;</code>. O <code>CommandInput</code> — a busca do <code>CommandDialog</code> e do <code>Combobox</code> — <strong>é</strong> o <code>SearchInput</code>: ele o monta com o campo do cmdk como filho, e o <code>Slot</code> funde nele as classes e o <code>ref</code>. O gatilho do cabeçalho é um botão e não pode ser o componente, então ele veste a receita, <code>lib/search-field-classes</code>: a pílula, a escada, as duas superfícies, a lupa, o × e a tecla sem pastilha. Antes o cabeçalho e a paleta concordavam por cópia, e a busca da tabela de transações era uma caixa <code>rounded-lg</code> de outro desenho.
      </DocNote>

      <DocNote title="O × do WebKit sai; a semântica fica">
        O WebKit desenha o próprio botão de limpar, fora do tema e da escada. <code>type=&quot;search&quot;</code> continua — é ele que dá a tecla &quot;Buscar&quot; no iOS e o <code>searchbox</code> do leitor de tela —, e o desenho é trocado pelo nosso <code>Button</code> redondo.
      </DocNote>

      <DocNote title="Onde o app usa">
        No painel de filtros das transações (descrição e cartão na página, categoria no popover, com <code>surface=&quot;plate&quot;</code>), no <code>FormPickerPopoverSearch</code> — o seletor de categoria da transação e o da assinatura — e em todo <code>Combobox</code> e <code>CommandDialog</code>, pelo <code>CommandInput</code>.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "onClear",
            type: "() => void",
            description: "Mostra o × quando há texto. Sem ele, não há botão.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "28 / 32 / 36 / 40; 40 no dedo.",
          },
          {
            prop: "surface",
            type: '"field" | "plate"',
            default: '"field"',
            description: "plate é a pílula de vidro, para dentro de painel flutuante.",
          },
          {
            prop: "shortcut",
            type: "string",
            description:
              "A tecla que foca o campo, na grafia do Kbd (\"/\", \"mod+k\"). Escreve o aria-keyshortcuts.",
          },
          {
            prop: "variant",
            type: '"default" | "brand"',
            default: '"default"',
            description: "brand acende a borda perto do ponteiro. Só com surface field.",
          },
          {
            prop: "pending",
            type: "boolean",
            default: "false",
            description: "A lupa vira Spinner, e a pílula, aria-busy.",
          },
          {
            prop: "clearLabel",
            type: "string",
            default: '"Limpar busca"',
            description: "O nome do ×. Troque quando a busca tiver assunto próprio.",
          },
          {
            prop: "className / inputClassName",
            type: "string",
            description: "className dimensiona a pílula; inputClassName veste o campo de texto de dentro.",
          },
          {
            prop: "children · leading · focusRing · touchFloor · rootProps",
            type: "—",
            description:
              "Para quem monta a pílula em volta de outro campo — o CommandInput: o campo do cmdk como filho, o escopo entre a lupa e o texto, e a paleta sem anel nem piso de toque.",
          },
          {
            prop: "placeholder",
            type: "string",
            default: '"Buscar…"',
            description: "Placeholder não é rótulo: passe aria-label quando não houver um visível.",
          },
        ]}
      />
    </>
  )
}

function Demo() {
  const [q, setQ] = React.useState("Mercado")

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <SearchInput
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onClear={() => setQ("")}
        placeholder="Buscar na descrição…"
        aria-label="Buscar na descrição"
      />
      <Caption>
        {q ? (
          <>
            Buscando por <span className="font-medium text-foreground">{q}</span>.
          </>
        ) : (
          "Digite para o × aparecer."
        )}
      </Caption>
    </div>
  )
}

function PlacaDemo() {
  const [q, setQ] = React.useState("")
  const achadas = CATEGORIAS.filter((c) => c.toLowerCase().includes(q.toLowerCase()))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">categorias</Button>
      </PopoverTrigger>
      <PopoverContent align="start" padding="none" className="w-64">
        <div className="p-2">
          <SearchInput
            surface="plate"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ("")}
            placeholder="Buscar categoria…"
            aria-label="Buscar categoria"
          />
        </div>
        <ul className="px-2 pb-2 text-sm">
          {achadas.map((c) => (
            <li key={c} className="rounded-surface px-2 py-1.5">
              {c}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function PendenteDemo() {
  const [q, setQ] = React.useState("aluguel")

  return (
    <SearchInput
      value={q}
      onChange={(e) => setQ(e.target.value)}
      onClear={() => setQ("")}
      pending
      placeholder="Buscar no servidor…"
      aria-label="Buscar no servidor"
      className="max-w-sm"
    />
  )
}
