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
import { Code } from "@/components/ui/code"
import { ColorTile } from "@/components/ui/color-tile"
import { MoneyDisplay } from "@/components/ui/money-display"
import { TILE_PALETTE as PALETA, tileColorFor } from "@/lib/tile-palette"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const SIZES = ["xs", "md", "lg", "xl", "2xl"] as const

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

/**
 * O que o banco pode trazer, passado pela mesma função que o ladrilho usa:
 * presets antigos dobrados, uma parada da marca e um hexadecimal digitado.
 */
const GRAVADOS = [
  { gravado: "#10B981", origem: "preset antigo de categoria" },
  { gravado: "#2563EB", origem: "preset antigo de carteira" },
  { gravado: "#6B7280", origem: "o cinza antigo" },
  { gravado: "#F5CB70", origem: "parada da marca" },
  { gravado: "#FF6B00", origem: "digitado no seletor livre" },
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

      <DocSection
        title="Tamanhos"
        description="24, 32, 36, 40 e 44px, com os nomes que o Button e o Input dão às mesmas medidas — ladrilho md ao lado de botão md alinha sem ninguém dizer nada. O xs é o de dentro de uma linha: a opção de um Select e o gatilho md, sem crescer nenhum dos dois. Só o 2xl alcança os 44px de alvo de toque: use-o quando o ladrilho for clicável."
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

      <DocNote title="O ícone é sólido, no conjunto do tamanho">
        <code>md</code> e <code>lg</code> desenham o ícone a 16px (<code>16/solid</code>); <code>xl</code> e <code>2xl</code> a 20 (<code>20/solid</code>), pela régua de Iconografia. Um glifo de contorno espremido na caixa apaga a única coisa que distingue uma linha da seguinte antes de se ler o nome.
      </DocNote>

      <DocNote title="Quem manda no corpo do ícone é o degrau, e não quem chama">
        <code>[&gt;svg]:size-4</code> é um seletor de descendente (0,1,1) e a classe no próprio <code>svg</code> é 0,1,0: um <code>size-5</code> escrito no ícone computa <strong>16px</strong> do mesmo jeito. Medido. Para trocar a medida, troque o degrau.
      </DocNote>

      <DocSection
        title="Duas versões — a construção do Avatar"
        description="tint=&quot;vivid&quot; (o padrão) é a cor na claridade 0,76 com o croma cheio e a tinta escura; tint=&quot;soft&quot; é quase branca (0,95), com o ícone no tom forte do mesmo matiz. Um valor só nos dois temas, e as cores arbitrárias leem como família porque compartilham a claridade e o croma, não o matiz."
        code={`<ColorTile color="#B7E18C" />
<ColorTile color="#B7E18C" tint="soft" />`}
        previewClassName="flex-col items-start gap-3"
      >
        {(["vivid", "soft"] as const).map((tint) => (
          <div key={tint} className="flex flex-wrap gap-2">
            {CATEGORIAS.map(({ cor, icone: Icone, nome }) => (
              <ColorTile key={nome} color={cor} tint={tint}>
                <Icone aria-hidden />
              </ColorTile>
            ))}
          </div>
        ))}
      </DocSection>

      <DocNote title="A claridade e o croma são do sistema; o matiz é da pessoa">
        A viva é <code>oklch(from var(--tile-color) 0.76 clamp(0, (c − 0,02) × 10, 0,2) h)</code>: qualquer cor com matiz vai ao croma cheio, e cinza continua cinza. Um multiplicador só não serve, porque os hexadecimais gravados vão de 0,079 (índigo) a 0,12 de croma. A suave é <code>0.95 min(c, 0.05)</code>, com a tinta em <code>0.42</code> no mesmo matiz. Medido em <code>scripts/tile-contrast.mjs</code>, 192 células (as duas versões, oito paradas e os extremos, quatro degraus, dois temas): a viva vai de <strong>6,66 a 9,44</strong> e a suave de <strong>6,48 a 7,64</strong>, piso 4,5. Até a rodada 183 havia uma versão só, pastel (0,86 e croma até 0,12), e o dono a recusou.
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
            <Code className="w-20 shrink-0">{cor}</Code>
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

      <DocSection
        title="Da cor gravada ao ladrilho"
        description="O que o banco traz passa por tileColorFor antes de virar a variável do ladrilho — a mesma função, aqui ao vivo. Preset antigo vira a parada de matiz mais próximo; o cinza antigo vira o neutro; parada da marca e cor digitada atravessam intactas."
        code={`import { tileColorFor } from "@/lib/tile-palette"

tileColorFor("#10B981") // → a parada teal
tileColorFor("#6B7280") // → null, o ladrilho sem cor
tileColorFor("#FF6B00") // → "#FF6B00", intacta`}
        previewClassName="flex-col items-stretch gap-3"
      >
        {GRAVADOS.map(({ gravado, origem }) => {
          const final = tileColorFor(gravado)
          return (
            <div key={gravado} className="flex flex-wrap items-center gap-3">
              <ColorTile color={gravado}>
                <BanknotesIcon aria-hidden />
              </ColorTile>
              <Code>{gravado}</Code>
              <span className="text-2xs text-muted-foreground">→</span>
              <Code>{final ?? "null"}</Code>
              <span className="text-xs text-muted-foreground">{origem}</span>
            </div>
          )
        })}
      </DocSection>

      <DocNote title="O que já está gravado é dobrado na leitura, sem escrever no banco">
        <code>tileColorFor</code> leva cada um dos 22 presets que o produto já ofereceu para a parada de matiz mais próximo — desvio medido de 0,9° a 32,5° —, no precedente de <code>identityToneFor</code>. <strong>O que a pessoa digitou no seletor livre atravessa intacto</strong>, e o cinza legado (<code>#6B7280</code>, croma 0,023) vira o neutro em vez de virar azul, porque num croma daquele o matiz é ruído. A dobra é idempotente, e é isso que permite aplicá-la no ladrilho <em>e</em> na tela de detalhe, onde o gráfico lê a mesma cor crua.
      </DocNote>

      <DocNote title="Ausência de cor não é a marca">
        O padrão foi <code>--primary</code> enquanto o primário era o verde da marca. Com o branding preto e branco ele virou croma 0, e o ladrilho &quot;sem cor&quot; passou a ser a tecla da marca esmaecida sem ninguém mexer no componente — lia como desativado. <code>--muted-foreground</code> é neutro nos dois temas de propósito. O arco-íris <strong>não</strong> entra como preenchimento: sob um ícone oito paradas não têm um contraste só, e ele mora nas peças de marca (ver <code>/designsystem/brand</code>). Ele entra pela outra ponta — as cores que a pessoa <strong>escolhe</strong> são as oito paradas.
      </DocNote>

      <DocNote title="Duas versões, e nenhum enfeite">
        Ele já foi lustrado (degradê branco, borda clara, sombra, <code>backdrop-blur</code>), já teve um eixo <code>glass</code>, e por muitas rodadas foi um véu de 12%/18% sobre o cartão. Tudo isso saiu: sobrou uma superfície e uma tinta, hoje em duas versões — a viva e a suave —, as mesmas do <code>Avatar</code> e da amostra do <code>Toggle</code>. Os dois são a mesma construção, separados pela forma e por quem escolhe a cor.
      </DocNote>

      <DocNote title="O raio cresce com a caixa">
        8px em <code>md</code> e <code>lg</code>, 10px em <code>xl</code> e <code>2xl</code>. O <code>Avatar</code> já dividiu essa progressão, e deixou de dividir: ele é redondo sempre, porque identifica <strong>pessoa</strong>, e o ladrilho identifica coisa.
      </DocNote>

      <DocNote title="Onde o app usa">
        <code>md</code>, o padrão, na lista de gastos por categoria da fatura, no passo de categorias do onboarding e no cabeçalho do detalhe de categoria. <code>lg</code> nos cartões de categoria de receita e despesa e na marca da carteira (<code>WorkspaceBrandMark</code>, no seletor e nas configurações). <code>2xl</code> no topo das contas a pagar — o cartão de resumo, o de pendência e a folha de detalhe. Uma chamada sai da escada: a fatura escreve <code>sm:size-9</code> por cima do <code>md</code>, porque o degrau não é responsivo.
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
            prop: "tint",
            type: '"vivid" | "soft"',
            default: '"vivid"',
            description: "vivid é a cor cheia com a tinta escura; soft é quase branca, com o ícone no tom forte do matiz.",
          },
          {
            prop: "size",
            type: '"xs" | "md" | "lg" | "xl" | "2xl"',
            default: '"md"',
            description: "24px, 32px, 36px, 40px e 44px. xs é o de dentro de uma linha de lista; só o 2xl alcança o alvo de toque.",
          },
        ]}
      />
    </>
  )
}
