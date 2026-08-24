"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function AccordionDoc() {
  return (
    <>
      <Usage>
        Uma lista de assuntos em que a pessoa lê um ou outro, não todos. Bom para
        perguntas frequentes e para detalhes secundários. Ruim para conteúdo que
        precisa ser comparado: o que está fechado não pode ser comparado com
        nada.
      </Usage>

      <DocSection
        title="Um por vez"
        code={`<Accordion type="single" collapsible>
  <AccordionItem value="a">
    <AccordionTrigger>Pergunta</AccordionTrigger>
    <AccordionContent>Resposta.</AccordionContent>
  </AccordionItem>
</Accordion>`}
        previewClassName="items-stretch"
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="fechamento">
            <AccordionTrigger>Quando a fatura fecha?</AccordionTrigger>
            <AccordionContent>
              No dia de fechamento do cartão. Compras feitas depois disso entram
              na fatura do mês seguinte.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="parcelas">
            <AccordionTrigger>Como as parcelas aparecem?</AccordionTrigger>
            <AccordionContent>
              Cada parcela é lançada no mês da fatura correspondente, e não toda
              no mês da compra.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="orcamento">
            <AccordionTrigger>O orçamento considera parcelas?</AccordionTrigger>
            <AccordionContent>
              Só a parcela do mês corrente. As futuras aparecem na projeção.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocSection>

      <DocSection
        title="Vários abertos"
        code={`<Accordion type="multiple" defaultValue={["a"]}>…</Accordion>`}
        previewClassName="items-stretch"
      >
        <Accordion
          type="multiple"
          defaultValue={["mercado"]}
          className="w-full"
        >
          <AccordionItem value="mercado">
            <AccordionTrigger>Mercado</AccordionTrigger>
            <AccordionContent>4 transações · R$ 612,40</AccordionContent>
          </AccordionItem>
          <AccordionItem value="transporte">
            <AccordionTrigger>Transporte</AccordionTrigger>
            <AccordionContent>7 transações · R$ 218,90</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DocSection>

      <DocNote title="collapsible é o que permite fechar tudo">
        Sem ele, <code>type=&quot;single&quot;</code>{" "}
        obriga um item a ficar
        sempre aberto. Isso é certo quando o acordeão é a navegação do conteúdo,
        e errado quando ele é opcional.
      </DocNote>
    </>
  )
}
