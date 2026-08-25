"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function TabsDoc() {
  return (
    <>
      <Usage>
        Painéis irmãos do mesmo nível, dos quais só um aparece por vez. Se as opções <em>filtram</em> a mesma lista em vez de trocar o conteúdo, o componente é <code>ToggleGroup</code>.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Tabs defaultValue="extrato">
  <TabsList>
    <TabsTrigger value="extrato">Extrato</TabsTrigger>
    <TabsTrigger value="categorias">Categorias</TabsTrigger>
  </TabsList>
  <TabsContent value="extrato">…</TabsContent>
</Tabs>`}
        previewClassName="items-stretch"
      >
        <Tabs defaultValue="extrato" className="w-full">
          <TabsList>
            <TabsTrigger value="extrato">Extrato</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
          </TabsList>
          <TabsContent value="extrato">
            <p className="text-sm text-muted-foreground">
              12 transações entre 01/03 e 28/03.
            </p>
          </TabsContent>
          <TabsContent value="categorias">
            <p className="text-sm text-muted-foreground">
              Mercado, Transporte e Lazer.
            </p>
          </TabsContent>
          <TabsContent value="parcelas">
            <p className="text-sm text-muted-foreground">
              3 compras parceladas em andamento.
            </p>
          </TabsContent>
        </Tabs>
      </DocSection>

      <DocNote title="A aba ativa precisa sobreviver a um refresh">
        Quando o conteúdo de cada aba é endereçável — e num app de finanças quase sempre é — o valor pertence à URL. Sem isso, compartilhar o link manda a pessoa para a primeira aba.
      </DocNote>

      <DocNote title="Poucas abas, e que caibam">
        Cinco abas não cabem em 360px sem encolher a ponto de não se ler. No
        telefone, ou são três, ou a navegação é outra coisa.
      </DocNote>
    </>
  )
}
