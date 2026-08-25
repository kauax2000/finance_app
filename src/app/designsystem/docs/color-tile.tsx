"use client"

import { ColorTile } from "@/components/ui/color-tile"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["sm", "default", "lg"] as const

/** Cores como o banco as guarda: hex escolhido pela pessoa, não token. */
const RUNTIME_COLORS = ["#0EA5E9", "#F97316", "#8B5CF6", "#10B981"]

export default function ColorTileDoc() {
  return (
    <>
      <Usage>
        O ladrilho que carrega uma cor <strong>escolhida pela pessoa</strong> —
        ícone de categoria, marca de conta, capa de conta a pagar. Se a cor vem
        do tema e não do banco, isto aqui é o componente errado: use{" "}
        <code>bg-muted</code> com o ícone em <code>text-muted-foreground</code>,
        ou um <code>Badge</code>.
      </Usage>

      <DocSection
        title="Tamanhos"
        code={`<ColorTile size="lg" color={category.color}>
  <TagIcon />
</ColorTile>`}
      >
        {SIZES.map((size) => (
          <ColorTile key={size} size={size} color="#0EA5E9">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </ColorTile>
        ))}
      </DocSection>

      <DocSection
        title="A cor vem do banco"
        description="Quatro categorias diferentes, quatro cores gravadas. O verniz e o fio são os mesmos nos quatro — é isso que faz quatro cores arbitrárias lerem como uma família."
        code={`<ColorTile color={category.color} />`}
      >
        {RUNTIME_COLORS.map((color) => (
          <ColorTile key={color} color={color}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
            </svg>
          </ColorTile>
        ))}
      </DocSection>

      <DocSection
        title="Sem cor"
        description="Categoria recém-criada, importação sem cor, dado velho. Cai em --primary em vez de ficar transparente."
        code={`<ColorTile color={undefined} />`}
      >
        <ColorTile color={undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </ColorTile>
        <ColorTile color="   ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </ColorTile>
      </DocSection>

      <DocNote title="O único lugar onde white e black crus estão certos">
        A invariante do projeto é token-first, e o auditor marca{" "}
        <code>border-white</code> e <code>ring-black</code> em qualquer tela. Aqui
        eles são <strong>material, não tema</strong>: o fundo é uma cor de runtime
        arbitrária, e o verniz claro por cima com o fio escuro por baixo têm que
        ser idênticos no claro e no escuro — senão o ladrilho muda de aparência
        sem que a cor gravada tenha mudado. Este arquivo está na lista de exceção
        de runtime do auditor; nenhuma tela está.
      </DocNote>

      <DocNote title="O que ele não resolve">
        O conteúdo é branco sempre. Contra o azul e o violeta acima, sobra
        contraste; contra um amarelo claro que a pessoa escolheu, o ícone some.
        Resolver exige medir contraste contra a cor gravada e virar para escuro
        abaixo do limiar — decisão de produto, porque muda a aparência de
        categorias que já existem.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "color",
            type: "string | null | undefined",
            default: "var(--primary)",
            description:
              "A cor gravada no banco. Vazia ou só espaços cai no padrão.",
          },
          {
            prop: "size",
            type: '"sm" | "default" | "lg"',
            default: '"default"',
            description: "32px, 36px e 44px. O lg é o único que passa nos 44px de alvo de toque — use-o quando o ladrilho for clicável.",
          },
        ]}
      />
    </>
  )
}
