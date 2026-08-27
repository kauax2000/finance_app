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
        O ladrilho que carrega uma cor <strong>escolhida pela pessoa</strong> —{" "}
        <code>categories.color</code>, <code>bills.color</code>, a marca de um
        workspace. Ele existe para um lugar só: onde um <strong>ícone
        precisa ser reconhecido de relance</strong>, no começo de uma linha de
        lista ou no topo de um cartão. Se a cor vem do tema e não do banco, é o
        componente errado: use <code>bg-muted</code> ou um <code>Badge</code>.
      </Usage>

      <DocSection
        title="Em uma linha de lista"
        description="É para isto que ele foi feito. O ícone é o que a pessoa varre com o olho — o nome só confirma. Por isso ele é sólido e ocupa a caixa inteira: contorno fino a 16px, no começo de uma lista de vinte, some."
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
              <span className="nums shrink-0 text-sm text-muted-foreground">
                R$ 1.240,00
              </span>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocNote title="O ícone é o conteúdo, e por isso é sólido">
        Os degraus <code>sm</code> e <code>md</code>{" "}
        desenham o ícone a 16px, o <code>lg</code>{" "}
        a 20. Pela régua de <strong>Iconografia</strong>, 16 é o micro
        (<code>16/solid</code>) e 20 é o mini (<code>20/solid</code>) — os
        conjuntos são <em>redesenhos</em>, não escalas. O app vinha desenhando o
        glifo de contorno de 24px espremido nas duas caixas: traço fino demais,
        detalhe que some, e nenhuma presença numa lista. Um ladrilho com ícone
        apagado não serve para nada — ele é a única coisa que distingue uma
        linha da seguinte antes de se ler o nome.
      </DocNote>

      <DocSection
        title="Tamanhos"
        description="32, 36 e 44px. O lg é o único que passa nos 44px de alvo de toque — use-o quando o ladrilho for clicável."
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
        description="O ladrilho dissolve a cor gravada num véu sobre o cartão e devolve o mesmo matiz, saturado, no ícone — a mesma construção do Avatar com os tons de identidade. Quatro cores arbitrárias lendo como uma família: o que elas compartilham é a receita, não o tom."
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
        <code>oklch(from var(--tile-color) 0.42 c h)</code>{" "}
        pega matiz e croma do que ela escolheu e <strong>troca a
        claridade</strong> pela do sistema — 0,42 no claro, 0,78 no escuro, os
        mesmos números da rampa de identidade. Amarelo puro e azul-marinho
        chegam ao ícone com o mesmo peso.
        <br />
        <br />
        Ele já preencheu de cor cheia com ícone branco, e{" "}
        <strong>quatro dos dez presets de categoria reprovavam</strong>{" "}
        nos 3:1 da WCAG 1.4.11 — âmbar 2,15, esmeralda 2,54. A correção da vez
        foi medir a luminância e virar a tinta para escura quando o branco não
        alcançava: funcionava, mas era conta consertando um desenho que não
        fechava. Fixando a claridade, não há o que medir.
      </DocNote>

      <DocSection
        title="Os extremos da paleta livre"
        description="A cor de workspace é um seletor livre: dá para escolher branco. Antes, branco e amarelo puro apagavam o ícone por completo — 1,00 e 1,07 de contraste. Aqui eles são só mais três matizes."
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
        description="Categoria recém-criada, importação sem cor, dado velho. Cai em --primary em vez de ficar transparente."
        code={`<ColorTile color={undefined} />`}
      >
        <ColorTile color={undefined}>
          <HomeIcon aria-hidden />
        </ColorTile>
        <ColorTile color="   " size="lg">
          <HomeMiniIcon aria-hidden />
        </ColorTile>
      </DocSection>

      <DocNote title="Chapado, e sem verniz">
        Ele já teve degradê branco na diagonal, borda clara em cima, sombra
        embaixo e um <code>backdrop-blur</code>{" "}
        — quatro camadas fingindo uma pastilha de vidro. O resto do sistema não
        fala essa língua: o botão preenche chapado, o badge preenche chapado, o
        trilho do slider é uma faixa lisa. Sobrou o véu, o raio e um fio.
      </DocNote>

      <DocNote title="O raio cresce com a caixa">
        8px em <code>sm</code> e <code>md</code>, 10px em <code>lg</code>{" "}
        — a mesma progressão do <code>Avatar</code>{" "}
        com <code>shape=&quot;rounded&quot;</code>, para que um avatar e um
        ladrilho do mesmo tamanho, lado a lado numa lista, tenham o mesmo canto.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "color",
            type: "string | null | undefined",
            default: "var(--primary)",
            description:
              "A cor gravada no banco. Vazia ou só espaços cai no padrão. Qualquer notação de cor do CSS serve.",
          },
          {
            prop: "size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "32px, 36px e 44px.",
          },
        ]}
      />
    </>
  )
}
