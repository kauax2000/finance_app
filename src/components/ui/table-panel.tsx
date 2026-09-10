"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { TableSizeContext } from "@/components/ui/table"

/**
 * Verdadeiro dentro da moldura. Existe só para a `TablePanelToolbar` avisar
 * quando é passada como filho — ali ela cairia dentro do painel, calada.
 */
const TablePanelFrameContext = React.createContext(false)

/**
 * A tabela como o app a mostra: moldura, barra de ações opcional, tabela e
 * rodapé de paginação — o que `transactions-table.tsx` e
 * `subscriptions/page-client.tsx` montavam em 7 lugares com quatro grafias
 * diferentes de arredondar os cantos:
 *
 * ```
 * <Card className="gap-0 overflow-hidden border border-border py-0 shadow-none ring-0">
 *   <CardContent className="relative flex flex-col p-0">
 *     <div className={cn("min-w-0", …rounded-t-xl/rounded-b-xl condicionais…)}>
 * ```
 *
 * `Card` já resolvia isso — `padding="none"` zera o recuo do corpo
 * (`--card-px: 0px`) e `overflow-hidden` recorta os cantos de todo filho —,
 * e as quatro grafias eram a prova de que faltava a peça, não de que o
 * `Card` não bastava. `TablePanel` é essa peça: `Card padding="none"
 * variant="outline"`, publicando `lg` em `TableSizeContext` — nenhuma tela
 * dentro dele escreve `size`, porque `lg` é a densidade confortável que os 7
 * painéis já usavam.
 *
 * **Sem eixo de superfície.** As 7 chamadas são a mesma variante do `Card`,
 * sem uma segunda evidência — e eixo sem contagem é ficção, a régua que este
 * sistema já aplicou ao cortar dois eixos de outros componentes. O dia em que
 * uma tela pedir outra superfície, ela entra com o caso que a justifica.
 *
 * **A barra de topo mora fora da moldura**, por pedido do dono: a contagem e
 * as ações de seleção (excluir etc.) ficam acima do painel, e a moldura começa
 * no cabeçalho da tabela. **A barra é prop (`toolbar`), e não filho.** Ela já
 * foi separada dos outros filhos pelo tipo da função, e isso quebrou medido: a
 * cada edição deste arquivo o Fast Refresh troca a função, a página segue
 * criando o elemento com a antiga, a comparação deixa de bater e as quatro
 * barras do catálogo caíam para dentro da moldura. É a decisão que o
 * `DropdownMenu` já registra para `header`/`footer`: detectar peça entre os
 * filhos não funciona, e slot como prop é o idioma daqui — que também não
 * depende de fragmento nem de embrulho. `className` vai ao envelope, que
 * é quem dimensiona o conjunto; o resto das props segue na moldura.
 *
 * O envelope declara o recuo horizontal de tira: a variável mora no `Card`, e
 * fora dele o recuo da barra cairia a zero calado.
 */
function TablePanel({
  className,
  toolbar,
  children,
  ...props
}: React.ComponentProps<typeof Card> & {
  /** A barra de topo, acima da moldura. Passe uma `TablePanelToolbar`. */
  toolbar?: React.ReactNode
}) {
  return (
    <TableSizeContext.Provider value="lg">
      <div
        data-slot="table-panel-group"
        className={cn(
          "flex min-w-0 flex-col gap-(--space-inline)",
          "[--card-strip-px:--spacing(4)]",
          className
        )}
      >
        {toolbar}
        <Card
          data-slot="table-panel"
          padding="none"
          variant="outline"
          className={cn(
            "gap-0",
            // **A última linha não soma fio com a moldura.** O `Card` já fecha
            // embaixo, e no painel sem rodapé o divisor da última linha
            // encostava na borda dele — dois fios empilhados. Ele sai **só
            // quando não há rodapé**: com rodapé, o fio é o que separa as
            // linhas dele, role o corpo ou não. A condição é a presença do
            // rodapé, e não a rolagem: sem rodapé e rolado até o fim, a última
            // linha também encosta na moldura. É CSS puro, então não pisca na
            // primeira pintura.
            "[&:not(:has(>[data-slot=table-panel-footer]))_[data-slot=table-viewport]>table>tbody>tr:last-child]:border-b-0",
            // **`clip-path`, e não só o `overflow-hidden` do `Card`.** O borrão
            // do cabeçalho fixo vira camada própria, e no Chrome acelerado ela
            // escapa do recorte arredondado de um `overflow` — os cantos do
            // vidro saíam da moldura. O `clip-path`
            // recorta em qualquer motor, no raio que o `Card` já desenha, e
            // ainda limita o que o borrão enxerga ao que está dentro dela.
            "[clip-path:inset(0_round_var(--radius-xl))]"
          )}
          {...props}
        >
          <TablePanelFrameContext.Provider value>
            {children}
          </TablePanelFrameContext.Provider>
        </Card>
      </div>
    </TableSizeContext.Provider>
  )
}

/**
 * A barra de topo — contagem, filtro, seleção em massa. É `CardToolbar` com o
 * nome do painel: mesma peça, mesmas duas variantes (`label` o rótulo apagado,
 * `title` o dado que nomeia o painel).
 *
 * **Nunca `role="toolbar"`.** O papel é um contrato de teclado — foco
 * itinerante entre os controles —, e nenhuma barra de seleção do app o
 * implementa; o app já escreve `role="toolbar"` à mão em 4 lugares sem
 * implementar o contrato, que é exatamente o defeito que `Toolbar` documenta
 * e se recusa a reproduzir.
 *
 * **Ela fica acima da moldura, sem fundo e sem borda.** Ela chegou a ter o
 * `bg-muted/50` do cabeçalho da tabela como destaque leve, e o dono o tirou:
 * fora da moldura, a posição já a separa da tabela. O fio **transparente** nas laterais é
 * carga estrutural: a moldura tem 1px de borda, e sem ele o texto da barra
 * cairia 1px à esquerda da coluna das células.
 *
 * **Sem recuo vertical, com `min-h-7`.** Fora da moldura quem separa a barra da
 * tabela é o vão do envelope (8px), e os 12px de cada lado sobravam — pedido do
 * dono. A altura mínima é a do botão de ação da seleção (`sm`, 28px), então a contagem e a seleção com
 * "Excluir" medem o mesmo e a barra não pula ao marcar uma linha.
 */
function TablePanelToolbar({
  className,
  ...props
}: React.ComponentProps<typeof CardToolbar>) {
  const naMoldura = React.useContext(TablePanelFrameContext)
  if (naMoldura && process.env.NODE_ENV !== "production") {
    console.error(
      "TablePanelToolbar dentro da moldura: passe a barra em <TablePanel toolbar={…}>, e não como filho."
    )
  }
  return (
    <CardToolbar
      data-slot="table-panel-toolbar"
      className={cn("min-h-7 border-x border-transparent py-0", className)}
      {...props}
    />
  )
}

/**
 * O rodapé de paginação — a contagem e os controles que 5 arquivos escreviam
 * como `CardNote className="flex-col … rounded-b-xl px-3 py-2.5 sm:flex-row …"`,
 * com o arredondamento repetido à mão porque a moldura não existia. Dentro de
 * `TablePanel` o `Card` já recorta o canto; aqui só fica o ritmo responsivo.
 */
function TablePanelFooter({
  className,
  ...props
}: React.ComponentProps<typeof CardNote>) {
  // A altura do rodapé vai para o painel, onde a `Table fade="bottom"` a lê como
  // faixa: as linhas sangram por baixo dele, como a lista sob a legenda do
  // `Command`. Medida, e não cravada — ele empilha no telefone e cresce no
  // toque, e uma faixa errada deixaria linha nítida sob o texto ou vão vazio.
  const medir = React.useCallback((el: HTMLDivElement | null) => {
    const painel = el?.parentElement
    if (!el || !painel) return
    const ro = new ResizeObserver(() =>
      painel.style.setProperty("--table-panel-foot-h", `${el.offsetHeight}px`)
    )
    ro.observe(el)
    return () => {
      ro.disconnect()
      painel.style.removeProperty("--table-panel-foot-h")
    }
  }, [])

  return (
    <CardNote
      ref={medir}
      data-slot="table-panel-footer"
      className={cn(
        // `relative` é carga estrutural: o viewport das linhas é posicionado e
        // sangra por baixo desta faixa, e um bloco estático pintaria atrás dele.
        "relative flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
        // **A altura de uma linha da tabela.** O painel é sempre `lg`, e ali a
        // linha mede 44 (12 + 20 + 12). Com o recuo das tiras (12) e o botão
        // `xs` da paginação (24) o rodapé saía 48 — 4px mais alto que as
        // linhas acima dele. 10 + 24 + 10 fecha em 44. No toque o botão cresce
        // a 44 e o rodapé cresce junto; as linhas não, e é de propósito.
        "py-2.5",
        className
      )}
      {...props}
    />
  )
}

export { TablePanel, TablePanelFooter, TablePanelToolbar }
