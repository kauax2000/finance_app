"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function HoverCardDoc() {
  return (
    <>
      <Usage>
        Uma prévia rica ao pousar o cursor. Sempre <strong>redundante</strong> — clicar precisa levar à mesma informação, porque no toque ele não existe.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<HoverCard>
  <HoverCardTrigger asChild><Button variant="link">Ana</Button></HoverCardTrigger>
  <HoverCardContent>…</HoverCardContent>
</HoverCard>`}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">Ana Ribeiro</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-72">
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback className="bg-identity-4-surface text-identity-4">
                  AR
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Ana Ribeiro</p>
                <p className="text-xs text-muted-foreground">
                  Membro desde março · 42 transações
                </p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </DocSection>

      <DocNote title="Diferença para o Tooltip">
        Tooltip é uma frase e é anunciado por <code>aria-describedby</code>.
        HoverCard é um bloco com estrutura e pode conter links. Se cabe numa
        linha, é tooltip.
      </DocNote>
    </>
  )
}
