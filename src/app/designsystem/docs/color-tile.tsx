"use client"

import {
  BanknotesIcon,
  BoltIcon,
  CakeIcon,
  HomeIcon,
  ShoppingCartIcon,
  TruckIcon,
} from "@heroicons/react/16/solid"
import {
  HomeIcon as HomeMiniIcon,
  ReceiptPercentIcon as ReceiptMiniIcon,
} from "@heroicons/react/20/solid"
import { ColorTile } from "@/components/ui/color-tile"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Muted } from "@/components/ui/typography"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["sm", "md", "lg"] as const

/** Cores como o banco as guarda: hex escolhido pela pessoa, não token. */
const CATEGORIAS = [
  { cor: "#10B981", icone: CakeIcon, nome: "Mercado" },
  { cor: "#F59E0B", icone: TruckIcon, nome: "Transporte" },
  { cor: "#8B5CF6", icone: HomeIcon, nome: "Moradia" },
  { cor: "#0EA5E9", icone: BoltIcon, nome: "Energia" },
] as const

/** Os extremos que a paleta livre do workspace permite. */
const EXTREMOS = [
  { cor: "#FFFF00", rotulo: "amarelo puro" },
  { cor: "#FFFFFF", rotulo: "branco" },
  { cor: "#111827", rotulo: "quase preto" },
] as const

export default function ColorTileDoc() {
  return (
    <>
      <Usage>
        O ladrilho que carrega uma cor <strong>escolhida pela pessoa</strong> — <code>categories.color</code>, <code>bills.color</code>, a marca de um workspace —, onde um ícone precisa ser reconhecido de relance: começo de linha de lista ou topo de cartão. Se a cor vem do tema e não do banco, é o componente errado: use <code>bg-muted</code> ou um <code>Badge</code>.
      </Usage>

      <DocSection
        title="Em uma linha de lista"
        description="O caso para que ele existe: o ícone é o que o olho varre, e o nome só confirma. Por isso ele é sólido e ocupa a caixa."
        code={`<ColorTile color={category.color}>
  <CakeIcon aria-hidden />
</ColorTile>`}
        previewClassName="flex-col items-stretch gap-0 p-0"
      >
        <ul className="w-full divide-y divide-border" role="list">
          {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
            <li key={nome} className="flex items-center gap-3 px-4 py-3">
              <ColorTile color={cor}>
                <Icone aria-hidden />
              </ColorTile>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {nome}
              </span>
              <MoneyDisplay value={1240} tone="muted" className="shrink-0" />
            </li>
          ))}
        </ul>
      </DocSection>

      <DocNote title="O ícone é sólido, no conjunto do tamanho">
        <code>sm</code> e <code>md</code> desenham o ícone a 16px (<code>16/solid</code>) e <code>lg</code> a 20 (<code>20/solid</code>), pela régua de Iconografia. Um glifo de contorno espremido na caixa apaga a única coisa que distingue uma linha da seguinte antes de se ler o nome.
      </DocNote>

      <DocSection
        title="Tamanhos"
        description="32, 36 e 44px. Só o lg passa nos 44px de alvo de toque — use-o quando o ladrilho for clicável."
        code={`<ColorTile size="lg" color={bill.color}>
  <ReceiptPercentIcon aria-hidden />
</ColorTile>`}
      >
        {SIZES.map((size) => (
          <ColorTile key={size} size={size} color="#0EA5E9">
            {size === "lg" ? (
              <ReceiptMiniIcon aria-hidden />
            ) : (
              <ShoppingCartIcon aria-hidden />
            )}
          </ColorTile>
        ))}
      </DocSection>

      <DocSection
        title="A cor entra como matiz, não como preenchimento"
        description="A cor gravada vira um véu sobre o cartão e volta, saturada, no ícone — a construção do Avatar. Cores arbitrárias leem como família porque compartilham a receita, não o tom."
        code={`<ColorTile color="#10B981" />   // véu 12% + ícone no mesmo matiz
<ColorTile color="#F59E0B" />`}
      >
        {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
          <ColorTile key={nome} color={cor}>
            <Icone aria-hidden />
          </ColorTile>
        ))}
      </DocSection>

      <DocNote title="A claridade é do sistema; o matiz é da pessoa">
        <code>oklch(from var(--tile-color) 0.42 c h)</code> mantém matiz e croma e troca a claridade pela do sistema (0,42 no claro, 0,78 no escuro). Amarelo puro e azul-marinho chegam ao ícone com o mesmo peso — cor cheia com ícone branco reprovaria os 3:1 em vários presets.
      </DocNote>

      <DocSection
        title="Os extremos da paleta livre"
        description="A cor de workspace é um seletor livre: dá para escolher branco. Aqui branco, amarelo puro e quase preto são só mais três matizes."
        code={`<ColorTile color="#FFFFFF" />`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {EXTREMOS.map(({ cor, rotulo }) => (
          <div key={cor} className="flex items-center gap-3">
            <ColorTile color={cor}>
              <BanknotesIcon aria-hidden />
            </ColorTile>
            <code className="w-20 shrink-0 font-mono text-2xs text-muted-foreground">
              {cor}
            </code>
            <span className="text-xs text-muted-foreground">{rotulo}</span>
          </div>
        ))}
      </DocSection>

      <DocSection
        title="Sem cor"
        description="Categoria recém-criada, importação sem cor, dado velho: cai em --primary em vez de ficar transparente."
        code={`<ColorTile color={undefined} />`}
      >
        <ColorTile color={undefined}>
          <HomeIcon aria-hidden />
        </ColorTile>
        <ColorTile color="   " size="lg">
          <HomeMiniIcon aria-hidden />
        </ColorTile>
      </DocSection>

      <DocNote title="O raio cresce com a caixa">
        8px em <code>sm</code> e <code>md</code>, 10px em <code>lg</code> — a progressão do <code>Avatar</code> com <code>shape=&quot;rounded&quot;</code>, para avatar e ladrilho do mesmo tamanho terem o mesmo canto numa lista.
      </DocNote>

      <DocSection
        title="Em vidro"
        description="A cor da pessoa vira o tom da lâmina em vez do véu, lida da --tile-color que o style publica."
        code={`<ColorTile glass color={category.color}>
  <CakeIcon aria-hidden />
</ColorTile>`}
      >
        {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
          <ColorTile key={nome} glass color={cor}>
            <Icone aria-hidden />
          </ColorTile>
        ))}
      </DocSection>

      <DocSection
        title="Ao lado do chapado"
        description="Em cima, véu opaco sobre o cartão; embaixo, lâmina. A diferença aparece na aresta: o fio colorido dá lugar ao aro."
        code={`<ColorTile color="#10B981" />
<ColorTile glass color="#10B981" />`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
              <ColorTile key={nome} color={cor}>
                <Icone aria-hidden />
              </ColorTile>
            ))}
            <Muted className="text-2xs">chapado</Muted>
          </div>
          <div className="flex items-center gap-3">
            {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
              <ColorTile key={nome} glass color={cor}>
                <Icone aria-hidden />
              </ColorTile>
            ))}
            <Muted className="text-2xs">vidro</Muted>
          </div>
        </div>
      </DocSection>

      <DocNote title="O tom do vidro é o véu do chapado">
        Sob vidro o tom é o mesmo <code>color-mix</code> do véu (12% no claro, 18% no escuro), então os dois corpos saem idênticos. Aqui o percentual é diluição do hex cru; a 100% pintaria a cor cheia.
      </DocNote>

      <DocNote title="Sob vidro, véu e fio não são escritos">
        O shorthand <code>background</code> da utility apagaria o véu, e o fio viraria segunda aresta ao lado do aro — o tom não tinge o aro. A tinta atravessa intacta.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "color",
            type: "string | null | undefined",
            default: "var(--primary)",
            description: "A cor gravada no banco, em qualquer notação do CSS. Vazia ou só espaços cai no padrão.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "32px, 36px e 44px.",
          },
          {
            prop: "glass",
            type: "boolean",
            default: "false",
            description: "A lâmina de vidro no lugar do véu: a cor vira --glass-tone, a tinta não muda e o fio sai.",
          },
        ]}
      />
    </>
  )
}
