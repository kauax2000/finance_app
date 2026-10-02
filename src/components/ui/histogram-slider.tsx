"use client"

import * as React from "react"

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionListItem,
  DescriptionTerm,
} from "@/components/ui/description-list"
import { Input } from "@/components/ui/input"
import { MoneyDisplay } from "@/components/ui/money-display"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { currencyBRL, numberBR } from "@/lib/formatters"
import { formatMoneyBrlInput, parseMoneyBrl } from "@/lib/money-brl"
import { cn } from "@/lib/utils"

/**
 * A faixa de valor sobre uma **distribuição**: um histograma atrás de um slider
 * de dois punhos, com as barras dentro da seleção acesas e as de fora
 * apagadas, e a leitura do mínimo e do máximo embaixo.
 *
 * É o filtro de preço que todo marketplace tem, e aqui ele serve para escolher
 * faixa de valor sabendo **onde o dado está** — um intervalo entre R$ 0 e
 * R$ 5.000 não diz nada; o mesmo intervalo com o histograma mostra que metade
 * das transações cai abaixo de R$ 200.
 *
 * ## O que é da peça, e o que é da tela
 *
 * A referência desenha um título em cima ("Price Range"). Ele **não** mora
 * aqui: título é chrome de tela, e quem o escreve é o `PageSectionHeader` ou o
 * `FieldLabel` (invariante 1). A leitura das duas pontas, sim, é da peça — ela é a
 * leitura do próprio controle, e não um bloco que por acaso ficou ao lado.
 *
 * ## `bins` é contagem crua
 *
 * Quem chama entrega a distribuição e a peça normaliza. Ela não busca dado
 * nenhum, não agrupa nada e não sabe de onde vieram os números — o que a
 * mantém utilizável com qualquer fonte.
 *
 * ## As barras não são `ChartSparkline`, e isso é exceção deliberada
 *
 * A primitiva de distribuição decorativa da casa é a `ChartSparkline
 * variant="bars"`, e ela seria a escolha certa se as barras fossem só um
 * desenho. Mas ela **não expõe `<Cell>`**, e "barra fora da seleção apaga" é
 * exatamente uma decisão por barra. Recharts precisaria de um `Cell` por
 * barra, que a peça não oferece. Então as barras são elementos próprios — por
 * um limite medido da primitiva, não por desconhecê-la.
 *
 * ## O alvo, o foco e o teclado são do `Slider`
 *
 * Nada de punho desenhado à mão: o `Slider` já traz o alvo de 44px num
 * pseudo-elemento, o anel de foco do sistema, as setas do teclado e os rótulos
 * em pt-BR dos dois punhos. As barras são `aria-hidden` porque quem carrega a
 * semântica é ele.
 */

/** A largura de uma faixa, em unidades do valor. */
function larguraDaFaixa(min: number, max: number, total: number): number {
  return total > 0 ? (max - min) / total : 0
}

/**
 * A faixa `i` acende quando está **inteira dentro** das duas linhas-guia.
 *
 * **Isto inverte a regra da rodada 107 de propósito.** Lá a faixa acendia por
 * *sobreposição*, para a coluna da ponta acender assim que o punho entrava
 * nela. Com a linha-guia desenhada, a sobreposição passou a mentir: a coluna
 * sob o punho acendia **metade para fora** da linha, e o olho lia a borda da
 * seleção num lugar e o corte em outro. Com as linhas na tela, elas são a
 * fronteira — e o que acende é o que está entre elas.
 *
 * O custo aceito é o inverso do de lá: a coluna da ponta só acende quando o
 * punho a ultrapassa por inteiro, então a travessia é um degrau mais tardia.
 * Em troca, o que se vê aceso é exatamente o que as linhas delimitam.
 */
export function faixaAtiva(
  index: number,
  { min, max, total, de, ate }: {
    min: number
    max: number
    total: number
    de: number
    ate: number
  }
): boolean {
  const w = larguraDaFaixa(min, max, total)
  if (w <= 0) return false
  const inicio = min + index * w
  const fim = inicio + w
  // Contenção, e não interseção: a faixa inteira tem de caber entre as guias.
  return inicio >= de && fim <= ate
}

/**
 * A altura de uma barra, em porcentagem.
 *
 * O **piso** existe para contagem 1 contra um máximo alto não sair em 0% — uma
 * faixa que tem dado precisa desenhar alguma coisa, senão o histograma mente
 * dizendo que ali não há nada. Contagem **zero** continua zero, que é verdade.
 */
export function alturaDaBarra(contagem: number, maximo: number): number {
  if (contagem <= 0 || maximo <= 0) return 0
  return Math.max(6, (contagem / maximo) * 100)
}

/**
 * A **fresta** antes da coluna `index`, em porcentagem da largura.
 *
 * A guia marca a **fronteira** da seleção, e por isso pousa entre duas colunas
 * e não sobre uma: com a regra de contenção, o corte é exatamente a aresta
 * entre a última apagada e a primeira acesa. Uma guia no eixo de uma coluna
 * diria que o corte passa pelo meio dela, que é o que ela não faz.
 *
 * A conta ideal é `index / total`. A fresta real é levemente deslocada, porque
 * o respiro de 1px entra no passo — o erro é `g · (index/total − 0,5)`, ou
 * seja **no máximo meio pixel** com `g = 1`.
 */
export function frestaDaGuia(index: number, total: number): number {
  if (total <= 0) return 0
  return (index / total) * 100
}

/**
 * A coluna em que uma guia pousa.
 *
 * **A guia não pode ficar presa ao punho, e a razão é do Radix.** Ele recua o
 * punho em meia-largura nas pontas (`left: calc(70% - 2.8px)`), então o centro
 * dele **não** cai no mesmo x que a coluna — medido, 1,73px de desvio numa
 * coluna de 6,02px. Presa ao punho ela nunca acerta a fresta.
 *
 * Então a guia se ancora na **fresta**: antes da primeira coluna acesa e
 * depois da última, que é onde o corte de fato está. Sem nenhuma acesa
 * (seleção mais estreita que uma faixa), ela cai na fresta mais próxima do
 * valor — a linha tem de existir mesmo quando não há o que acender.
 */
export function colunaDaGuia(
  valor: number,
  { min, max, total, de, ate, ponta }: {
    min: number
    max: number
    total: number
    de: number
    ate: number
    ponta: "inicio" | "fim"
  }
): number {
  const acesas: number[] = []
  for (let i = 0; i < total; i++) {
    if (faixaAtiva(i, { min, max, total, de, ate })) acesas.push(i)
  }
  if (acesas.length > 0) {
    // A fronteira: antes da primeira acesa, e **depois** da última.
    return ponta === "inicio" ? acesas[0] : acesas[acesas.length - 1] + 1
  }
  const w = larguraDaFaixa(min, max, total)
  if (w <= 0) return 0
  return Math.min(total, Math.max(0, Math.round((valor - min) / w)))
}

/**
 * A âncora do arco-íris numa barra, em porcentagem — **aritmética, não
 * medida**.
 *
 * No `Slider` a mesma ancoragem precisou de `ResizeObserver` porque a largura
 * da faixa preenchida é arbitrária. Aqui as barras são uma divisão **igual e
 * conhecida**, então a posição sai do índice e não há o que observar. A
 * medição não é um reflexo: é o que se usa quando a geometria não se sabe.
 *
 * A conta é o posicionamento percentual do CSS resolvido para este caso: `P%`
 * alinha `P%` da imagem com `P%` do elemento, logo `offset = P/100 · (E − W)`.
 * Com a imagem do tamanho do contêiner (`W`), `N` barras iguais (`E = W/N`) e o
 * deslocamento desejado `−i·W/N`, sai `P = 100i/(N−1)`.
 */
export function ancoraDaBarra(index: number, total: number): number {
  if (total <= 1) return 0
  return (100 * index) / (total - 1)
}

/*
 * **Não há atraso por coluna, e isso é decisão.**
 *
 * Houve um: o esmaecimento era escalonado pela distância até a guia, para a
 * cor "sair" das linhas. Ele saiu porque calculava uma ordem que **já existe**
 * — quem acende antes é a coluna por onde o punho passou antes, e isso o
 * arraste produz sozinho. Toda coluna leva o **mesmo tempo** entre o neutro e
 * o pintado; o que varia é o instante em que ela é alcançada.
 *
 * A consequência, dita: num **salto** (clique longe, mudança programática) não
 * há ordem de passagem, e a seleção inteira dissolve junta. É o certo pela
 * mesma regra — sem punho passando, não há quem venha antes.
 */
/**
 * Quantos estão na faixa (rodada 216): a soma das colunas **acesas**, com a
 * mesma regra de contenção que as acende — o número diz o que a pessoa vê.
 */
export function contagemNaFaixa(
  bins: number[],
  { min, max, de, ate }: { min: number; max: number; de: number; ate: number }
): { dentro: number; total: number } {
  const total = bins.length
  let dentro = 0
  let soma = 0
  bins.forEach((n, i) => {
    soma += n
    if (faixaAtiva(i, { min, max, total, de, ate })) dentro += n
  })
  return { dentro, total: soma }
}

/** As marcas do eixo: `n` valores igualmente espaçados de `min` a `max`. */
export function marcasDoEixo(min: number, max: number, n: number): number[] {
  if (n < 2 || max <= min) return [min]
  return Array.from({ length: n }, (_, k) => min + ((max - min) * k) / (n - 1))
}

/**
 * O valor que sai para quem chama. Com a **cauda aberta**, o punho no fim
 * quer dizer "daí para cima", e sai `Infinity` — um filtro que recebesse
 * `max` cortaria fora o gasto de R$ 30.000 que a última coluna diz conter.
 */
export function valorDeSaida(
  par: [number, number],
  { max, openEnd }: { max: number; openEnd: boolean }
): [number, number] {
  return openEnd && par[1] >= max ? [par[0], Infinity] : par
}

/** As alturas do histograma: 40 · 64 · 96. */
const ALTURA = {
  sm: "[--histogram-h:--spacing(10)]",
  md: "[--histogram-h:--spacing(16)]",
  lg: "[--histogram-h:--spacing(24)]",
} as const

/** As colunas do esqueleto: uma crista plausível, fixa — nada de aleatório no render. */
const ESQUELETO = [30, 55, 80, 65, 90, 70, 50, 60, 40, 45, 30, 35, 25, 20, 28, 18, 14, 16, 10, 12, 8, 9, 6, 7]

type Atalho = { label: string; value: [number, number] }
type Referencia = { value: number; label: string }

type HistogramSliderProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue"
> & {
  /** O nome acessível do controle. */
  label: string
  /** A distribuição, em contagem crua por faixa. */
  bins: number[]
  min?: number
  max?: number
  /** Com `openEnd`, o fim da faixa pode vir como `Infinity`. */
  value?: [number, number]
  defaultValue?: [number, number]
  onValueChange?: (value: [number, number]) => void
  /** Uma vez, ao soltar o punho, escolher um atalho ou confirmar um campo. */
  onValueCommit?: (value: [number, number]) => void
  /** Repassado ao `Slider` e às barras acesas. */
  variant?: "default" | "brand"
  /** O termo de cada ponta da leitura. */
  minLabel?: string
  maxLabel?: string
  /** Escreve o valor na leitura, no eixo e no leitor de tela. Sem ele, reais. */
  format?: (value: number) => string
  /** A altura do histograma: 40 · 64 · 96. */
  size?: keyof typeof ALTURA
  /**
   * A contagem na faixa. `true` escreve "312 de 1.204"; uma função recebe as
   * duas contagens e escreve a frase com o substantivo da tela.
   */
  count?: boolean | ((dentro: number, total: number) => React.ReactNode)
  /** O eixo embaixo: `true` são 5 marcas, um número escolhe quantas. */
  axis?: boolean | number
  /** A leitura vira campos: digitar move o punho. */
  editable?: boolean
  /** Linhas tracejadas com rótulo — a média, a mediana, um teto. */
  references?: Referencia[]
  /** Fichas que levam os punhos de uma vez. */
  presets?: Atalho[]
  /** A última coluna vale "daí para cima": a leitura diz "R$ 6.400+". */
  openEnd?: boolean
  /** A distribuição está chegando: esqueleto nas colunas e o controle travado. */
  pending?: boolean
}

function HistogramSlider({
  className,
  label,
  bins,
  min = 0,
  max = 100,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  variant,
  minLabel = "Mínimo",
  maxLabel = "Máximo",
  format,
  size = "md",
  count = false,
  axis = false,
  editable = false,
  references,
  presets,
  openEnd = false,
  pending = false,
  ...props
}: HistogramSliderProps) {
  const dinheiro = format === undefined
  const escrever = format ?? ((v: number) => currencyBRL(v))
  // O punho no fim, com a cauda aberta, é "daí para cima" — no texto e no
  // `aria-valuetext`.
  const escreverPonta = (v: number) =>
    openEnd && v >= max ? `${escrever(max)}+` : escrever(v)

  // A entrada aceita `Infinity` no fim (a cauda aberta); dentro, é `max`.
  const paraDentro = (par: [number, number]): [number, number] => [
    Math.max(min, par[0]),
    Math.min(max, par[1]),
  ]
  const inicial: [number, number] = paraDentro(defaultValue ?? [min, max])

  const maximo = React.useMemo(() => Math.max(0, ...bins), [bins])
  const total = bins.length

  /**
   * **O passo é a largura de uma faixa, e não uma prop.**
   *
   * É o que faz o punho parar sempre numa fronteira de coluna — e só assim ele
   * e a guia coincidem, porque a guia mora na fresta. Com passo livre, uma
   * linha presa às frestas não tem como estar sempre sob um punho que anda
   * contínuo: os dois se afastam até meia coluna.
   *
   * E é honesto como API: num filtro de faixa quem escolhe escolhe **faixas**,
   * e a resolução do histograma já diz qual é a menor delas.
   */
  const passo = larguraDaFaixa(min, max, total)
  const naGrade = (v: number) =>
    passo > 0 ? min + Math.round((v - min) / passo) * passo : v
  const inicialNaGrade: [number, number] = [
    naGrade(inicial[0]),
    naGrade(inicial[1]),
  ]

  // **O estado nasce na grade.** Sem isto o punho recebe o valor encaixado e as
  // guias leem o cru: os dois discordam até o primeiro arraste, e o desvio
  // medido foi de meio punho.
  const [interno, setInterno] = React.useState<[number, number]>(inicialNaGrade)
  const atual = value ? paraDentro(value) : interno

  const mudar = (par: [number, number], confirmar: boolean) => {
    if (value === undefined) setInterno(par)
    const saida = valorDeSaida(par, { max, openEnd })
    onValueChange?.(saida)
    if (confirmar) onValueCommit?.(saida)
  }

  // A leitura editável: o texto do campo só é rascunho enquanto ele tem foco;
  // fora dele, é o valor atual escrito.
  const [rascunho, setRascunho] = React.useState<{ ponta: 0 | 1; texto: string } | null>(null)
  const textoDoCampo = (v: number) =>
    dinheiro ? formatMoneyBrlInput(v) : String(v)
  const lerCampo = (t: string): number | null => {
    if (dinheiro) return parseMoneyBrl(t)
    const n = Number(t.replace(",", "."))
    return t.trim() && Number.isFinite(n) ? n : null
  }
  const confirmarCampo = (ponta: 0 | 1) => {
    if (!rascunho || rascunho.ponta !== ponta) return
    const lido = lerCampo(rascunho.texto)
    setRascunho(null)
    if (lido == null) return
    const v = Math.min(max, Math.max(min, lido))
    // Um campo não passa do outro: o mínimo digitado acima do máximo encosta nele.
    const par: [number, number] =
      ponta === 0 ? [Math.min(v, atual[1]), atual[1]] : [atual[0], Math.max(v, atual[0])]
    mudar(par, true)
  }

  const marcas = axis ? marcasDoEixo(min, max, axis === true ? 5 : axis) : []
  // No eixo o dinheiro é curto — "R$ 1,6 mil", não "R$ 1,60 mil": a marca é
  // escala, e não um valor que alguém vá conferir centavo a centavo.
  const escreverMarca = (m: number) =>
    dinheiro
      ? currencyBRL(m, { compact: true, minimumFractionDigits: 0, maximumFractionDigits: 1 })
      : escrever(m)
  const naRegua = (v: number) =>
    max > min ? (Math.min(max, Math.max(min, v)) - min) / (max - min) : 0
  const atalhoAtivo = presets?.findIndex(
    (a) => {
      const [de, ate] = paraDentro(a.value)
      return de === atual[0] && ate === atual[1]
    }
  )
  const contagem = count ? contagemNaFaixa(bins, { min, max, de: atual[0], ate: atual[1] }) : null

  const leitura = (ponta: 0 | 1) => {
    const v = atual[ponta]
    const termo = ponta === 0 ? minLabel : maxLabel
    if (editable) {
      const comum = {
        "aria-label": termo,
        size: "sm" as const,
        disabled: pending,
        className: cn("max-w-32", ponta === 1 && "ms-auto text-right"),
        onFocus: () => setRascunho({ ponta, texto: textoDoCampo(v) }),
        onBlur: () => confirmarCampo(ponta),
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") e.currentTarget.blur()
        },
      }
      const texto = rascunho?.ponta === ponta ? rascunho.texto : textoDoCampo(v)
      return dinheiro ? (
        <Input
          {...comum}
          money
          value={texto}
          onValueChange={(raw) => setRascunho({ ponta, texto: raw })}
        />
      ) : (
        <Input
          {...comum}
          inputMode="decimal"
          value={texto}
          onChange={(e) => setRascunho({ ponta, texto: e.target.value })}
        />
      )
    }
    if (dinheiro && !(openEnd && ponta === 1 && v >= max)) {
      return <MoneyDisplay value={v} size="md" />
    }
    return <span className="nums">{escreverPonta(v)}</span>
  }

  return (
    <div
      className={cn("flex w-full flex-col gap-4", ALTURA[size], className)}
      aria-busy={pending || undefined}
      {...props}
    >
      {presets?.length ? (
        <ToggleGroup
          type="single"
          variant="chip"
          size="sm"
          aria-label={`Atalhos de ${label.toLowerCase()}`}
          disabled={pending}
          value={atalhoAtivo != null && atalhoAtivo >= 0 ? String(atalhoAtivo) : ""}
          onValueChange={(i) => {
            const atalho = i === "" ? undefined : presets[Number(i)]
            if (atalho) mudar(paraDentro(atalho.value), true)
          }}
          className="flex-wrap"
        >
          {presets.map((a, i) => (
            <ToggleGroupItem key={a.label} value={String(i)}>
              {a.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}

      {/* O controle **é** o histograma: o `Slider` cobre a mesma caixa das
          colunas, então clicar ou arrastar em qualquer ponto delas move um
          punho, e os punhos pousam no meio da crista — como na referência.
          As barras ficam por baixo e `pointer-events-none`, para não
          interceptarem nada; quem carrega o papel e o teclado é o slider.
          Com linha de referência, o rótulo dela mora numa faixa acima. */}
      <div
        className={cn(
          "relative h-(--histogram-h)",
          references?.length && "mt-5"
        )}
      >
        {/* **A régua, recuada meio punho de cada lado.**

            O centro do punho do Radix viaja de `7px` a `largura − 7px` — é a
            correção de meia-largura que ele aplica para o punho não sair do
            trilho. Uma grade de colunas que encosta nas bordas vive noutro
            sistema de coordenadas, e aí punho e fresta nunca coincidem: foi
            esse o desvio medido (1,73px no meio, até 7px nas pontas).

            Recuada, a grade passa a ocupar **exatamente** a faixa que o punho
            percorre, e uma fronteira de coluna cai no mesmo x que o valor
            correspondente. O `1.75` é meio punho (`size-3.5` = 14px). */}
        <div className="absolute inset-y-0 inset-x-1.75">
          {pending ? (
            // O esqueleto tem a forma das colunas, e pulsa — o movimento único
            // do `Skeleton`. As colunas reais não existem ainda.
            <div
              aria-hidden
              data-slot="histogram-slider-skeleton"
              className="pointer-events-none absolute inset-0 flex animate-pulse items-end gap-px"
            >
              {ESQUELETO.map((h, i) => (
                <div
                  key={i}
                  className="min-h-1 flex-1 rounded-t-full bg-skeleton"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          ) : (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-end gap-px"
            >
              {bins.map((contagemDaFaixa, i) => {
                const ativa = faixaAtiva(i, {
                  min,
                  max,
                  total,
                  de: atual[0],
                  ate: atual[1],
                })
                return (
                  <div
                    key={i}
                    data-slot="histogram-slider-bar"
                    data-active={ativa ? "" : undefined}
                    className={cn(
                      // O topo é **domo**, e não um canto de 2px: com a coluna
                      // fina, `rounded-t-full` dá meia-circunferência da
                      // largura dela e o histograma lê como uma crista, não
                      // como uma cerca de tijolos. O `min-h-1` é o piso do
                      // desenho — abaixo disso o domo não chega a existir.
                      //
                      // A coluna é a superfície **apagada**, e ela não
                      // transiciona cor nenhuma: quem atravessa é a camada de
                      // cima.
                      "relative min-h-1 flex-1 rounded-t-full bg-input-fill"
                    )}
                    style={{ height: `${alturaDaBarra(contagemDaFaixa, maximo)}%` }}
                  >
                    {/* A tinta acesa é uma **camada**, e ela está sempre
                        montada — só a opacidade muda.

                        É a lição da rodada 103, e aqui ela veio de um defeito
                        medido: `transition-colors` cobre `background-color` e
                        **não** `background-image`, então na variante de marca
                        o degradê aparecia e sumia de estalo enquanto a tinta
                        apagada dissolvia em 150ms — o pior dos dois. Degradê
                        não interpola; quem liga e desliga é uma opacidade.

                        Montar e desmontar a camada não serviria: não há o que
                        esmaecer num nó que acabou de nascer. */}
                    <span
                      aria-hidden
                      data-slot="histogram-slider-fill"
                      className={cn(
                        "absolute inset-0 rounded-t-full",
                        // `--duration-slow` e não `--duration-base`: a
                        // travessia é decoração de estado, não resposta a um
                        // clique, e a 200ms ela ainda lê como troca. A 300 ela
                        // lê como dissolução.
                        "opacity-0 transition-opacity duration-(--duration-slow) ease-(--ease-out)",
                        ativa && "opacity-100",
                        variant !== "brand" && "bg-primary",
                        // `brand-rainbow-image` declara `--brand-rainbow` no
                        // elemento; sem ela o `bg-(image:…)` cai para `none`
                        // calado. E `bg-no-repeat` não é zelo: a imagem é mais
                        // larga que a coluna, e sem ele ela ladrilharia.
                        variant === "brand" &&
                          "brand-rainbow-image bg-(image:--brand-rainbow) bg-no-repeat"
                      )}
                      style={
                        variant === "brand"
                          ? {
                              backgroundSize: `${total * 100}% 100%`,
                              backgroundPositionX: `${ancoraDaBarra(i, total).toFixed(3)}%`,
                            }
                          : undefined
                      }
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* As duas guias. Elas se ancoram na **coluna**, e não no punho: o
              Radix recua o punho meia-largura nas pontas, então o centro dele
              não cai no mesmo x que a coluna — medido, 1,73px de desvio numa
              coluna de 6,02. Ancoradas na fresta, elas pousam na fronteira
              exata.

              Começam na altura do centro do punho (metade do histograma) e
              descem até a base, e são `pointer-events-none` para não disputar
              o arraste com o slider que as cobre. */}
          {pending
            ? null
            : (["inicio", "fim"] as const).map((ponta) => {
                const coluna = colunaDaGuia(
                  ponta === "inicio" ? atual[0] : atual[1],
                  { min, max, total, de: atual[0], ate: atual[1], ponta }
                )
                return (
                  <span
                    key={ponta}
                    aria-hidden
                    data-slot="histogram-slider-guide"
                    className={cn(
                      "pointer-events-none absolute top-1/2 bottom-0 w-px -translate-x-1/2",
                      // Quem a torna visível é a **inversão**, e não um fio em
                      // volta. No escuro `--primary-accent` e `--primary` são
                      // a mesma cor (`oklch(0.985)`), então na variante padrão
                      // a linha sumia dentro da coluna acesa — e um `outline`
                      // de 1px em volta de um fio de 1px é metade da peça
                      // sendo moldura. `mix-blend-difference` não escolhe cor
                      // nenhuma: escura sobre coluna clara, clara sobre a
                      // superfície escura. Os 70% deixam a inversão
                      // **parcial**, que é marcar sem cortar a coluna.
                      "bg-primary-accent/70 mix-blend-difference"
                    )}
                    style={{ left: `${frestaDaGuia(coluna, total).toFixed(3)}%` }}
                  />
                )
              })}

          {/* A linha de referência (rodada 216): tracejada, da base ao topo,
              com o rótulo acima da caixa — por cima das colunas ele cobriria a
              crista. Ela não se ancora na grade: a média não cai numa fresta. */}
          {references?.map((r) => (
            <span
              key={`${r.label}-${r.value}`}
              aria-hidden
              data-slot="histogram-slider-reference"
              className="pointer-events-none absolute inset-y-0 -translate-x-1/2 border-l border-dashed border-muted-foreground"
              style={{ left: `${(naRegua(r.value) * 100).toFixed(3)}%` }}
            >
              <span className="absolute bottom-full left-0 mb-1 -translate-x-1/2 text-2xs whitespace-nowrap text-muted-foreground">
                {r.label}
              </span>
            </span>
          ))}
        </div>

        {/* O trilho e a faixa ficam **invisíveis**: quem mostra o intervalo são
            as colunas acesas, e uma barra pintada por cima delas seria o mesmo
            dado desenhado duas vezes. Some a cor **e** a imagem —
            `bg-transparent` sozinho não apaga o degradê da variante de marca,
            que é `background-image`. Sobram os punhos e a área de toque. */}
        <Slider
          className={cn(
            "absolute inset-0 h-full",
            "[&_[data-slot=slider-track]]:bg-transparent",
            "[&_[data-slot=slider-range]]:bg-none [&_[data-slot=slider-range]]:bg-transparent"
          )}
          aria-label={label}
          // O leitor de tela ouve o valor escrito — em reais, por padrão, e
          // "R$ 6.400+" no fim da cauda aberta (o `format` do `Slider`,
          // rodada 177).
          format={escreverPonta}
          min={min}
          max={max}
          step={passo > 0 ? passo : undefined}
          disabled={pending}
          // **Sempre controlado.** Com atalho e campo, o valor muda por fora do
          // arraste, e um `defaultValue` deixava o punho onde estava enquanto
          // as colunas e a leitura iam para a faixa nova — medido.
          value={[...atual]}
          onValueChange={(v) => mudar([v[0] ?? min, v[1] ?? max], false)}
          onValueCommit={(v) =>
            onValueCommit?.(valorDeSaida([v[0] ?? min, v[1] ?? max], { max, openEnd }))
          }
        />
      </div>

      {/* O eixo (rodada 216): marcas no mesmo recuo da régua, a primeira
          encostada à esquerda e a última à direita, as do meio centradas. */}
      {marcas.length > 1 ? (
        <div
          aria-hidden
          data-slot="histogram-slider-axis"
          className="relative -mt-2 mx-1.75 h-4 text-2xs text-muted-foreground nums"
        >
          {marcas.map((m, k) => (
            <span
              key={k}
              className={cn(
                "absolute top-0 whitespace-nowrap",
                k === 0 ? "left-0" : k === marcas.length - 1 ? "right-0" : "-translate-x-1/2"
              )}
              style={
                k === 0 || k === marcas.length - 1
                  ? undefined
                  : { left: `${(naRegua(m) * 100).toFixed(3)}%` }
              }
            >
              {escreverMarca(m)}
              {k === marcas.length - 1 && openEnd ? "+" : null}
            </span>
          ))}
        </div>
      ) : null}

      {/* A leitura é um par termo/valor de cada ponta, e não dois cartões.

          Os cartões custavam 70px de altura em moldura, preenchimento e recuo
          para mostrar duas linhas de texto — chrome a mais numa peça que já
          tem histograma, trilho e duas guias. Como `<dl>` a mesma informação
          cabe em 41, e a semântica fica correta: "Mínimo" é o **termo** de
          "R$ 468,75", não o rótulo de um cartão.

          Mínimo à esquerda e máximo à direita, no mesmo recuo da régua das
          colunas — assim cada valor cai sob a ponta do trilho a que ele
          pertence, em vez de flutuar centralizado numa caixa. */}
      <DescriptionList
        layout="grid"
        size="sm"
        columns={2}
        className="gap-0 px-1.75"
      >
        <DescriptionListItem>
          <DescriptionTerm>{minLabel}</DescriptionTerm>
          <DescriptionDetails size="lg">{leitura(0)}</DescriptionDetails>
        </DescriptionListItem>
        <DescriptionListItem align="end">
          <DescriptionTerm>{maxLabel}</DescriptionTerm>
          <DescriptionDetails size="lg">{leitura(1)}</DescriptionDetails>
        </DescriptionListItem>
      </DescriptionList>

      {/* Quantos a faixa pega. Região viva: o número muda no arraste e no
          atalho, e quem não vê as colunas precisa ouvir o efeito. */}
      {contagem ? (
        <p
          aria-live="polite"
          data-slot="histogram-slider-count"
          className="-mt-2 px-1.75 text-xs text-muted-foreground nums"
        >
          {pending
            ? "Contando…"
            : typeof count === "function"
              ? count(contagem.dentro, contagem.total)
              : `${numberBR(contagem.dentro)} de ${numberBR(contagem.total)}`}
        </p>
      ) : null}
    </div>
  )
}

export { HistogramSlider }
