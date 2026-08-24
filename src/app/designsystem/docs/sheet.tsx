"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { DocNote, DocSection, Usage } from "../ds-doc"

const SIDES = ["left", "right", "top", "bottom"] as const

export default function SheetDoc() {
  return (
    <>
      <Usage>
        Um painel que desliza de uma borda. É o formulário do telefone: entra de
        baixo, ocupa a altura útil e deixa a ação principal perto do polegar. No
        desktop entra pela direita para não cobrir o conteúdo que a pessoa estava
        lendo.
      </Usage>

      <DocSection
        title="Os quatro lados"
        code={`<Sheet>
  <SheetTrigger asChild><Button>Abrir</Button></SheetTrigger>
  <SheetContent side="bottom">…</SheetContent>
</Sheet>`}
      >
        {SIDES.map((side) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="outline">{side}</Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle>Nova transação</SheetTitle>
                <SheetDescription>
                  Entra de <code>{side}</code>.
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button type="submit">Salvar</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </DocSection>

      <DocNote title="fillMobileViewport, para formulário no telefone">
        Com <code>side=&quot;bottom&quot;</code> e{" "}
        <code>fillMobileViewport</code>, a folha vai de uma folga no topo até a
        base, com altura fixa em <code>dvh</code>{" "}
        e respeitando a área segura. É
        o que impede a folha de encolher quando o teclado do iOS abre e a barra
        de endereço do Safari se retrai.
      </DocNote>

      <DocNote title="A animação tem curva própria">
        Entrada e saída usam <code>cubic-bezier(0.32, 0.72, 0, 1)</code>{" "}
        em
        300ms, que é o token <code>--ease-emphasized</code>. Com{" "}
        <code>prefers-reduced-motion</code>, o deslize vira um fade curto em vez
        de sumir de vez: a folha ainda precisa comunicar que apareceu.
      </DocNote>
    </>
  )
}
