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
import { TILE_PALETTE as PALETA } from "@/lib/tile-palette"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["md", "lg", "xl", "2xl"] as const

/**
 * Cores como o banco as guarda: hex escolhido pela pessoa, não token. Desde a
 * rodada 96 as amostras que ele oferece são as oito paradas da marca.
 */
const CATEGORIAS = [
  { cor: "#B7E18C", icone: CakeIcon, nome: "Mercado" },
  { cor: "#F5CB70", icone: TruckIcon, nome: "Transporte" },
  { cor: "#D0C4FF", icone: HomeIcon, nome: "Moradia" },
  { cor: "#6EE2FF", icone: BoltIcon, nome: "Energia" },
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
        <code>md</code> e <code>lg</code> desenham o ícone a 16px (<code>16/solid</code>); <code>xl</code> e <code>2xl</code> a 20 (<code>20/solid</code>), pela régua de Iconografia. Um glifo de contorno espremido na caixa apaga a única coisa que distingue uma linha da seguinte antes de se ler o nome.
      </DocNote>

      <DocNote title="Quem manda no corpo do ícone é o degrau, e não quem chama">
        <code>[&gt;svg]:size-4</code> é um seletor de descendente (0,1,1) e a classe no próprio <code>svg</code> é 0,1,0: um <code>size-5</code> escrito no ícone computa <strong>16px</strong> do mesmo jeito. Medido. Para trocar a medida, troque o degrau.
      </DocNote>

      <DocSection
        title="Tamanhos"
        description="32, 36, 40 e 44px, com os nomes que o Button e o Input dão às mesmas medidas — ladrilho md ao lado de botão md alinha sem ninguém dizer nada. Só o 2xl alcança os 44px de alvo de toque: use-o quando o ladrilho for clicável."
        code={`<ColorTile size="2xl" color={bill.color}>
  <ReceiptPercentIcon aria-hidden />
</ColorTile>`}
      >
        {SIZES.map((size) => (
          <ColorTile key={size} size={size} color="#6EE2FF">
            {size === "xl" || size === "2xl" ? (
              <ReceiptMiniIcon aria-hidden />
            ) : (
              <ShoppingCartIcon aria-hidden />
            )}
          </ColorTile>
        ))}
      </DocSection>

      <DocSection
        title="Superfície chapada, tinta escura — a construção do Avatar"
        description="A cor preenche a caixa e a tinta é sempre a mesma, um valor só nos dois temas. Cores arbitrárias leem como família porque compartilham a claridade e o teto de croma, não o matiz."
        code={`<ColorTile color="#B7E18C" />
<ColorTile color="#F5CB70" />`}
      >
        {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
          <ColorTile key={nome} color={cor}>
            <Icone aria-hidden />
          </ColorTile>
        ))}
      </DocSection>

      <DocNote title="A claridade é do sistema; o matiz é da pessoa">
        A superfície é <code>oklch(from var(--tile-color) 0.86 min(c, 0.12) h)</code>: o matiz vem de quem escolheu, a claridade fica presa na banda da rampa de identidade e o croma tem teto. Com a tinta em <code>--identity-foreground</code>, <strong>qualquer</strong> cor de runtime cai entre 10,63 e 11,74 — a mesma faixa que as seis identidades do <code>Avatar</code> entregam (10,17 a 12,12). Preto, branco e cinza chegam neutros e a 11,2. Não há o que medir por cor: o contraste é estrutural.
      </DocNote>

      <DocNote title="Por que a cor não entra crua, e por que o croma tem teto">
        Chapar a parada da marca como ela é reprova: com a tinta escura, índigo dá <strong>3,55</strong>, violeta 3,21 e magenta 4,09; com tinta branca, âmbar <strong>1,94</strong>, lima 1,83, teal 2,23 e azul 2,42. <strong>Nenhuma tinta única serve as oito</strong> — é o desenho que esta peça já teve e abandonou, quando 4 dos 10 presets reprovavam nos 3:1. E sem o teto de croma o magenta cai a 7,70 e o croma das peças varia de 0,12 a 0,28: oito ladrilhos numa lista deixam de ler como uma família.
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
        description="Categoria recém-criada, importação sem cor, dado velho: cai no cinza do sistema (--muted-foreground) em vez de ficar transparente."
        code={`<ColorTile color={undefined} />`}
      >
        <ColorTile color={undefined}>
          <HomeIcon aria-hidden />
        </ColorTile>
        <ColorTile color="   " size="2xl">
          <HomeMiniIcon aria-hidden />
        </ColorTile>
      </DocSection>

      <DocSection
        title="A paleta que a pessoa escolhe é a da marca"
        description="As oito paradas do arco-íris, em TILE_PALETTE. Eram duas listas de hexadecimais crus do Tailwind — dez para categoria, doze para carteira —, sem relação nenhuma com o produto."
        code={`import { TILE_PALETTE, tileColorFor } from "@/lib/tile-palette"`}
      >
        {PALETA.map(({ hex, nome }) => (
          <div key={hex} className="flex flex-col items-center gap-1">
            <ColorTile color={hex}>
              <BanknotesIcon aria-hidden />
            </ColorTile>
            <span className="text-2xs text-muted-foreground">{nome}</span>
          </div>
        ))}
      </DocSection>

      <DocNote title="O que já está gravado é dobrado na leitura, sem escrever no banco">
        <code>tileColorFor</code> leva cada um dos 22 presets que o produto já ofereceu para a parada de matiz mais próximo — desvio medido de 0,9° a 32,5° —, no precedente de <code>identityToneFor</code>. <strong>O que a pessoa digitou no seletor livre atravessa intacto</strong>, e o cinza legado (<code>#6B7280</code>, croma 0,023) vira o neutro em vez de virar azul, porque num croma daquele o matiz é ruído. A dobra é idempotente, e é isso que permite aplicá-la no ladrilho <em>e</em> na tela de detalhe, onde o gráfico lê a mesma cor crua.
      </DocNote>

      <DocNote title="Ausência de cor não é a marca">
        O padrão foi <code>--primary</code> enquanto o primário era o verde da marca. Com o branding preto e branco ele virou croma 0, e o ladrilho &quot;sem cor&quot; passou a ser a tecla da marca esmaecida sem ninguém mexer no componente — lia como desativado. <code>--muted-foreground</code> é neutro nos dois temas de propósito. O arco-íris <strong>não</strong> entra aqui: ele mora no wordmark, no campo de acesso e nas variantes <code>brand</code> do <code>Button</code> e do <code>Badge</code>, e sob ícone sete matizes não têm um contraste só.
      </DocNote>

      <DocNote title="Uma versão só">
        Ele já foi lustrado (degradê branco, borda clara, sombra, <code>backdrop-blur</code>), já teve um eixo <code>glass</code>, e por muitas rodadas foi um véu de 12%/18% sobre o cartão com a tinta e o fio normalizados e um par de valores por tema. Tudo isso saiu: sobrou uma superfície e uma tinta. O mesmo arco do <code>Avatar</code>, que largou o vidro, o anel de arco-íris, o degradê, o grão e o ponto de luz — e agora os dois são a mesma construção, separados pela forma e por quem escolhe a cor.
      </DocNote>

      <DocNote title="O raio cresce com a caixa">
        8px em <code>md</code> e <code>lg</code>, 10px em <code>xl</code> e <code>2xl</code>. O <code>Avatar</code> já dividiu essa progressão, e deixou de dividir: ele é redondo sempre, porque identifica <strong>pessoa</strong>, e o ladrilho identifica coisa.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "color",
            type: "string | null | undefined",
            default: "var(--muted-foreground)",
            description: "A cor gravada no banco, em qualquer notação do CSS. Vazia ou só espaços cai no cinza do sistema.",
          },
          {
            prop: "size",
            type: '"md" | "lg" | "xl" | "2xl"',
            default: '"md"',
            description: "32px, 36px, 40px e 44px. Só o 2xl alcança o alvo de toque.",
          },
        ]}
      />
    </>
  )
}
