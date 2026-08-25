"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { MoneyDisplay } from "@/components/ui/money-display"
import { DocNote, DocSection, Usage } from "../ds-doc"

const CARTOES = [
  { nome: "Nubank", fatura: 1482.3 },
  { nome: "Itaú", fatura: 894.15 },
  { nome: "Inter", fatura: 320.0 },
  { nome: "C6", fatura: 0 },
]

export default function CarouselDoc() {
  return (
    <>
      <Usage>
        Itens de mesma importância que deslizam na horizontal. Nunca para conteúdo que precisa ser comparado — o que está fora da tela não se compara.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Carousel>
  <CarouselContent>
    <CarouselItem className="basis-2/3 sm:basis-1/3">…</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
        previewClassName="items-stretch px-10"
      >
        <Carousel className="w-full">
          <CarouselContent>
            {CARTOES.map((c) => (
              <CarouselItem key={c.nome} className="basis-2/3 sm:basis-1/2">
                <Card>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{c.nome}</p>
                    <MoneyDisplay value={c.fatura} size="lg" tone="expense" />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DocSection>

      <DocNote title="O último item precisa vazar da borda">
        Com <code>basis-2/3</code>, o item seguinte aparece pela metade e é isso
        que diz que há mais. Um carrossel em que o item cabe exatamente na
        largura parece uma lista de um item só, e ninguém desliza.
      </DocNote>

      <DocNote title="As setas não existem no telefone">
        No toque, quem navega é o gesto. As setas continuam no DOM porque quem
        usa teclado precisa delas: são botões reais, focáveis, com{" "}
        <code>aria-label</code>.
      </DocNote>
    </>
  )
}
