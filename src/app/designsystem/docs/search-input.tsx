"use client"

import * as React from "react"

import { SearchInput } from "@/components/ui/search-input"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

export default function SearchInputDoc() {
  return (
    <>
      <Usage>
        O campo de busca do projeto: lupa, a semântica de{" "}
        <code>type=&quot;search&quot;</code> e o × do navegador já suprimido.
        Ele existe porque a regra já existia e não tinha casa — e das quatro
        buscas escritas à mão no app, três a violam.
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

      <DocNote title="O × do WebKit é chrome do navegador, e sai">
        Em <code>type=&quot;search&quot;</code> o WebKit desenha o próprio botão
        de limpar: azul do sistema, medida do sistema, sem conhecer o tema escuro
        nem a escada de controles.{" "}
        <strong>A semântica fica</strong> — é ela que dá a tecla
        &quot;Buscar&quot; no teclado do iOS e o papel que o leitor de tela
        anuncia —, e só o desenho é substituído, por um{" "}
        <code>InputGroupButton</code> no addon <code>inline-end</code>.
      </DocNote>

      <DocSection
        title="A escada"
        description="Os mesmos degraus dos outros campos, para a busca casar com o controle ao lado dela — inclusive com o --toolbar-control de uma Toolbar."
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

      <DocNote title="Regra sem dono é regra que se esquece">
        O <code>AGENTS.md</code> registra a supressão do × desde a rodada do
        seletor ancorado, e diz que ela{" "}
        <em>&quot;vale para qualquer campo de busca do app&quot;</em>. Medido: o{" "}
        <code>FormPickerPopoverSearch</code> acerta sozinho, e as três buscas de{" "}
        <code>transactions-filters-panel.tsx</code> (linhas 418, 538 e 772) são{" "}
        <code>&lt;Input type=&quot;search&quot;&gt;</code> cru, com o × do
        navegador aparecendo. Quatro usos, três violações — foi a contagem que
        transformou a regra em peça.
      </DocNote>

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
