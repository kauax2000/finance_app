"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function CardDoc() {
  return (
    <>
      <Usage>
        Agrupa conteúdo que se lê junto. Cartão dentro de cartão não: dois níveis de superfície elevada apagam a hierarquia do primeiro. Para subdividir, <code>Separator</code> ou <code>PageSection</code>.
      </Usage>

      <DocSection
        title="Completo"
        code={`<Card>
  <CardHeader>
    <CardTitle>Fatura de março</CardTitle>
    <CardDescription>Fecha em 28/03</CardDescription>
    <CardAction><Button variant="tertiary" size="sm">Ver</Button></CardAction>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>`}
        previewClassName="items-stretch"
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Fatura de março</CardTitle>
            <CardDescription>Fecha em 28/03, vence em 05/04</CardDescription>
            <CardAction>
              <Button variant="tertiary" size="sm">
                Ver
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <MoneyDisplay value={1482.3} size="2xl" tone="expense" />
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              12 transações em 3 categorias
            </p>
          </CardFooter>
        </Card>
      </DocSection>

      <DocSection
        title="Só com conteúdo"
        description="Nem todo cartão precisa de cabeçalho. Quando o conteúdo se explica, o título é repetição."
        code={`<Card>
  <CardContent>…</CardContent>
</Card>`}
        previewClassName="items-stretch"
      >
        <Card className="w-full max-w-sm">
          <CardContent>
            <p className="text-sm text-muted-foreground">Saldo disponível</p>
            <MoneyDisplay value={8432.15} size="xl" />
          </CardContent>
        </Card>
      </DocSection>

      <DocNote title="Título e descrição não levam gap">
        <code>CardHeader</code> já entrega a entrelinha. São o mesmo dado em duas linhas — a regra do par de identidade está em <strong>Espaçamento e largura</strong>.
      </DocNote>
    </>
  )
}
