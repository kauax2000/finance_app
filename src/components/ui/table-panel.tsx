import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardNote, CardToolbar } from "@/components/ui/card"
import { TableSizeContext } from "@/components/ui/table"

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
 */
function TablePanel({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <TableSizeContext.Provider value="lg">
      <Card
        data-slot="table-panel"
        padding="none"
        variant="outline"
        className={cn("gap-0", className)}
        {...props}
      />
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
 */
function TablePanelToolbar({
  className,
  ...props
}: React.ComponentProps<typeof CardToolbar>) {
  return (
    <CardToolbar data-slot="table-panel-toolbar" className={className} {...props} />
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
  return (
    <CardNote
      data-slot="table-panel-footer"
      className={cn(
        "flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    />
  )
}

export { TablePanel, TablePanelFooter, TablePanelToolbar }
