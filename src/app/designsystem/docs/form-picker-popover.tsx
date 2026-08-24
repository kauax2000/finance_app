"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  FormPickerPopoverContent,
  formPickerListScrollClassName,
} from "@/components/ui/form-picker-popover"
import { Label } from "@/components/ui/label"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DocNote, DocSection, PropsTable, Usage } from "../ds-doc"

const CARTOES = ["Nubank", "Itaú", "Inter", "C6", "BTG", "Will", "Neon"]

export default function FormPickerPopoverDoc() {
  return (
    <>
      <Usage>
        O posicionamento de um popover ancorado num campo de formulário: largura
        igual à do gatilho, folga de colisão com as bordas, altura limitada ao
        espaço disponível, e o foco que <strong>não</strong>{" "}
        pula ao abrir nem ao
        fechar.
      </Usage>

      <DocSection
        title="Em uso"
        code={`<Popover>
  <PopoverTrigger asChild><Button variant="outline">Escolher</Button></PopoverTrigger>
  <FormPickerPopoverContent>
    <div className={formPickerListScrollClassName}>…</div>
  </FormPickerPopoverContent>
</Popover>`}
        previewClassName="items-stretch"
      >
        <PickerDemo />
      </DocSection>

      <DocNote title="Por que o foco não pula">
        Num popover ancorado a um campo, roubar o foco fecha o teclado do
        telefone e faz a folha inteira saltar. <code>onOpenAutoFocus</code> e{" "}
        <code>onCloseAutoFocus</code> já vêm com <code>preventDefault()</code>;
        se você os passar, os seus rodam <em>depois</em> disso, não no lugar.
      </DocNote>

      <DocNote title="formPickerListScrollClassName não é decoração">
        Ele carrega <code>touch-pan-y</code>, <code>overscroll-contain</code> e o{" "}
        <code>-webkit-overflow-scrolling</code>. Sem isso, rolar a lista dentro
        de uma folha rola a folha junto, e no iOS a rolagem trava no fim.
      </DocNote>

      <DocNote title="Não é o Combobox">
        Este resolve <em>onde</em> o painel aparece. <code>Combobox</code>{" "}
        resolve busca, navegação por teclado e semântica de listbox. Os dois se
        compõem; nenhum substitui o outro.
      </DocNote>

      <PropsTable
        rows={[
          {
            prop: "FormPickerPopoverContent",
            type: "ComponentProps<typeof PopoverContent>",
            description: "Aceita tudo do PopoverContent; sobrepõe posicionamento e foco.",
          },
          {
            prop: "formPickerListScrollClassName",
            type: "string",
            description: "As classes da região rolável interna.",
          },
        ]}
      />
    </>
  )
}

function PickerDemo() {
  const [aberto, setAberto] = React.useState(false)
  const [escolhido, setEscolhido] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <Label htmlFor="ds-picker">Cartão</Label>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            id="ds-picker"
            type="button"
            variant="outline"
            className="w-full justify-start font-normal"
          >
            {escolhido ?? (
              <span className="text-muted-foreground">Escolher cartão</span>
            )}
          </Button>
        </PopoverTrigger>
        <FormPickerPopoverContent>
          <div className={cn(formPickerListScrollClassName, "max-h-48")}>
            {CARTOES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setEscolhido(c)
                  setAberto(false)
                }}
                className="flex min-h-11 w-full items-center rounded-md px-2 text-left text-sm hover:bg-accent active:bg-accent"
              >
                {c}
              </button>
            ))}
          </div>
        </FormPickerPopoverContent>
      </Popover>
    </div>
  )
}
