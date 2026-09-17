"use client"

import * as React from "react"

import { SearchInput } from "@/components/ui/search-input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function SearchInputDoc() {
  return (
    <>
      <Usage>
          O campo de busca do projeto: lupa, a semântica de <code>type=&quot;search&quot;</code> e o × do navegador já suprimido. Use-o em toda busca em vez de <code>&lt;Input type=&quot;search&quot;&gt;</code> cru; dentro de um seletor ancorado, a busca é a do <code>FormPickerPopover</code>.
      </Usage>

      <DocSection
        title="Padrão"
        description="Com onClear, o botão de limpar aparece quando há texto. Sem onClear, não há botão — um × que não limpa nada é pior que nenhum."
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

      <DocNote title="O × do WebKit sai; a semântica fica">
          O WebKit desenha o próprio botão de limpar, fora do tema e da escada. <code>type=&quot;search&quot;</code> continua — é ele que dá a tecla &quot;Buscar&quot; no iOS —, e o desenho é trocado por um <code>InputGroupButton</code> no addon <code>inline-end</code>. Vale para qualquer campo de busca do app.
      </DocNote>

      <DocSection
        title="A escada"
        description="Os degraus dos outros campos, para a busca casar com o controle ao lado — inclusive o --toolbar-control de uma Toolbar."
        code={`<SearchInput size="sm" />
<SearchInput size="md" />   {/* o padrão */}
<SearchInput size="lg" />`}
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

      <PropsTable
        rows={[
          {
            prop: "onClear",
            type: "() => void",
            description:
              "Mostra o botão de limpar quando há texto. Sem ele, não há botão.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg" | "xl"',
            default: '"md"',
            description: "A escada dos campos. 28 / 32 / 36 / 40.",
          },
          {
            prop: "clearLabel",
            type: "string",
            default: '"Limpar busca"',
            description:
              "O nome acessível do botão de limpar. Troque quando a busca tiver assunto próprio.",
          },
          {
            prop: "placeholder",
            type: "string",
            default: '"Buscar…"',
            description:
              "Placeholder não é rótulo: passe aria-label quando não houver um visível.",
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
      <p className="text-xs text-muted-foreground">
        {q ? (
          <>
            Buscando por <span className="font-medium text-foreground">{q}</span>
            .
          </>
        ) : (
          "Digite para o botão de limpar aparecer."
        )}
      </p>
    </div>
  )
}
