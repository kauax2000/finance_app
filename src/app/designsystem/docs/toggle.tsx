"use client"

import * as React from "react"
import {
  BookmarkIcon as BookmarkSolidIcon,
  EyeSlashIcon as EyeSlashSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/16/solid"
import {
  BookmarkIcon,
  EyeSlashIcon,
  HomeIcon,
  ShoppingCartIcon,
  StarIcon,
  TruckIcon,
} from "@heroicons/react/24/outline"

import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Caption } from "@/components/ui/typography"
import { TILE_PALETTE } from "@/lib/tile-palette"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

function DemoAmostras({ tint }: { tint?: "vivid" | "soft" }) {
  const [cor, setCor] = React.useState<string>(TILE_PALETTE[2].hex)
  return (
    <ToggleGroup
      type="single"
      variant="swatch"
      tint={tint}
      size="icon-md"
      value={cor}
      onValueChange={setCor}
      aria-label="Cor da categoria"
      className="flex-wrap justify-start gap-2"
    >
      {TILE_PALETTE.map(({ hex, nome }) => (
        <ToggleGroupItem key={hex} value={hex} color={hex} aria-label={`Cor ${nome}`} />
      ))}
    </ToggleGroup>
  )
}

export default function ToggleDoc() {
  return (
    <>
      <Usage>
        Um <strong>estado</strong> que liga e desliga: esconder valores, fixar uma coluna, favoritar. Botão faz algo acontecer e volta; o toggle passa a valer e fica. Se uma opção de um conjunto vale por vez — um filtro, uma cor, um ícone —, é o <code>ToggleGroup</code>, que usa estas mesmas peles.
      </Usage>

      <DocSection
        title="Peles e estados"
        description="plain, o padrão, não tem cromo em repouso; outline mostra a borda desde o repouso, para o toggle sozinho numa superfície sem outra pista de que ali se clica. Desligado é tinta apagada; ligado é tinta cheia sobre o secondary — quem carrega o sinal é o salto de tinta."
        code={`<Toggle>Ocultar valores</Toggle>
<Toggle defaultPressed>Ocultar valores</Toggle>
<Toggle variant="outline">Ocultar valores</Toggle>`}
        previewClassName="flex-col items-start gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Toggle icon={EyeSlashIcon}>ocultar valores</Toggle>
          <Toggle icon={EyeSlashIcon} defaultPressed>
            ocultar valores
          </Toggle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle variant="outline" icon={EyeSlashIcon}>
            ocultar valores
          </Toggle>
          <Toggle variant="outline" icon={EyeSlashIcon} defaultPressed>
            ocultar valores
          </Toggle>
          <Toggle variant="outline" icon={EyeSlashIcon} disabled>
            ocultar valores
          </Toggle>
        </div>
      </DocSection>

      <DocSection
        title="O ícone acende"
        description="icon e iconOn: contorno desligado, o par sólido ligado — a convenção das faces do ThemeToggle e das abas da BottomBar. É mais um sinal de estado além da tinta, e continua valendo sem cor. Os dois ficam montados e trocam por opacidade. Toque e veja."
        code={`import { StarIcon } from "@heroicons/react/24/outline"
import { StarIcon as StarSolidIcon } from "@heroicons/react/16/solid"

<Toggle icon={StarIcon} iconOn={StarSolidIcon}>favorita</Toggle>`}
      >
        <Toggle icon={StarIcon} iconOn={StarSolidIcon}>
          favorita
        </Toggle>
        <Toggle variant="outline" icon={BookmarkIcon} iconOn={BookmarkSolidIcon} defaultPressed>
          fixar coluna
        </Toggle>
        <Toggle variant="outline" size="icon-md" icon={EyeSlashIcon} iconOn={EyeSlashSolidIcon} aria-label="Ocultar valores" />
      </DocSection>

      <DocSection
        title="Tamanhos, e os degraus de ícone"
        description="sm 28, md 32 e lg 36 — os nomes do Button e do Input, então toggle ao lado de campo alinha sem ninguém dizer size. Os degraus icon-sm a icon-xl são quadrados (28 a 40), a coluna de ícone do Button, e é o que as grades de ícone da categoria e do workspace usam."
        code={`<Toggle size="sm">sm</Toggle>
<Toggle size="icon-lg" icon={HomeIcon} aria-label="Casa" />`}
        previewClassName="flex-col items-start gap-4"
      >
        <div className="flex items-end gap-3">
          {(["sm", "md", "lg"] as const).map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <Toggle variant="outline" size={s}>
                {s}
              </Toggle>
              <Caption>{s}</Caption>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-3">
          {(["icon-sm", "icon-md", "icon-lg", "icon-xl"] as const).map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <Toggle variant="outline" size={s} icon={HomeIcon} aria-label={`Casa ${s}`} />
              <Caption>{s}</Caption>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        title="Pílula"
        description="shape=&quot;pill&quot;, o eixo do Button: 100% arredondado, com meio degrau a mais de recuo; nos degraus de ícone vira círculo. É a forma dos filtros da tela de atividade."
        code={`<ToggleGroup type="single" variant="outline" shape="pill" size="sm" defaultValue="todas">
  <ToggleGroupItem value="todas" count={12}>Todas</ToggleGroupItem>
  …
</ToggleGroup>`}
        previewClassName="flex-col items-start gap-3"
      >
        <ToggleGroup type="single" variant="outline" shape="pill" size="sm" defaultValue="todas" aria-label="Filtrar atividades" className="flex-wrap gap-2">
          <ToggleGroupItem value="todas" count={12}>Todas</ToggleGroupItem>
          <ToggleGroupItem value="transacoes" count={8}>Transações</ToggleGroupItem>
          <ToggleGroupItem value="contas" count={4}>Contas</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup type="single" variant="outline" shape="pill" size="icon-md" defaultValue="casa" aria-label="Ícone">
          <ToggleGroupItem value="casa" icon={HomeIcon} aria-label="Casa" />
          <ToggleGroupItem value="mercado" icon={ShoppingCartIcon} aria-label="Mercado" />
          <ToggleGroupItem value="transporte" icon={TruckIcon} aria-label="Transporte" />
        </ToggleGroup>
      </DocSection>

      <DocSection
        title="Amostra de cor"
        description="variant=&quot;swatch&quot; com color: a amostra dos seletores de cor da categoria e do workspace. A superfície é a do ColorTile — a cor na claridade do sistema, viva ou suave (tint) —, então o que se escolhe é o que o ladrilho vai mostrar. A escolhida ganha contorno e tique, e o estado não depende só do contorno. O nome vai em aria-label: a amostra não tem texto."
        code={`<ToggleGroup type="single" variant="swatch" size="icon-md" value={cor} onValueChange={setCor}>
  {TILE_PALETTE.map(({ hex, nome }) => (
    <ToggleGroupItem key={hex} value={hex} color={hex} aria-label={\`Cor \${nome}\`} />
  ))}
</ToggleGroup>`}
      >
        <div className="flex flex-col gap-3">
          <DemoAmostras />
          <DemoAmostras tint="soft" />
        </div>
      </DocSection>

      <DocNote title="Ele não afunda ao clicar">
        O <code>active:translate-y-px</code> do <code>Button</code> promete que a peça volta. O toggle não volta — passa a valer —, então não afunda. E a pele sem contorno se chama <code>plain</code>, e não <code>tertiary</code>: o toggle não tem escada de pesos, só peles.
      </DocNote>

      <DocNote title="A amostra pintava outra cor">
        Os dois seletores pintavam o hexadecimal cru (<code>style=&#123;&#123; backgroundColor: hex &#125;&#125;</code>), e o ladrilho que a cor escolhida vai vestir mostra a mesma cor na claridade do sistema (<code>oklch(from … 0.86 min(c, 0.12) h)</code>). A pessoa escolhia uma cor e via outra. Eram também dois desenhos — um quadrado com anel primário no workspace, um círculo com borda na categoria. Hoje a amostra é uma, e a superfície é a do <code>ColorTile</code>.
      </DocNote>

      <DocNote title="Onde o app usa">
        Nenhuma tela usa o <code>Toggle</code> solto; o app o usa pelo <code>ToggleGroup</code>, em seis grupos — o sexto, as fichas de período da folha de filtros das transações, é <code>variant=&quot;chip&quot;</code> desde a rodada 199. Desde a rodada 183 eles saíram das classes à mão: os filtros da atividade (<code>rounded-full px-3</code>) são <code>shape=&quot;pill&quot;</code>; as duas paletas de cor são <code>variant=&quot;swatch&quot;</code>, e a do workspace deixou de soletrar o hexadecimal no leitor de tela; as grades de ícone (<code>size-9</code> e <code>size-11</code>) são <code>icon-lg</code> e <code>icon-xl</code> — a do workspace passou de 44 para 40, o degrau da escada.
      </DocNote>

      <PropsTable
        rows={[
          { prop: "pressed · defaultPressed", type: "boolean", description: "Controlado ou não." },
          { prop: "variant", type: '"plain" | "outline" | "swatch" | "chip"', default: '"plain"', description: "Sem cromo em repouso, com contorno desde o repouso, a amostra de cor, ou a ficha de filtro." },
          { prop: "size", type: '"sm" | "md" | "lg" | "icon-sm" | "icon-md" | "icon-lg" | "icon-xl"', default: '"md"', description: "28, 32, 36; os de ícone são quadrados de 28 a 40." },
          { prop: "shape", type: '"rounded" | "pill"', default: '"rounded"', description: "pill arredonda 100% e dá meio degrau de recuo; nos de ícone, círculo." },
          { prop: "icon · iconOn", type: "HeroIcon", description: "O ícone, e o par sólido que o substitui quando liga." },
          { prop: "color", type: "string", description: "Com swatch, a cor gravada — a mesma que o ColorTile recebe." },
          { prop: "tint", type: '"vivid" | "soft"', default: '"vivid"', description: "Com swatch, a versão da cor: a do ColorTile." },
          { prop: "count", type: "ReactNode", description: "A contagem ao lado do rótulo, tabular e no peso normal. Entra no nome acessível." },
        ]}
      />
    </>
  )
}
