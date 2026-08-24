"use client"

import * as React from "react"
import {
  CreditCardIcon,
  PlusIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function CommandDoc() {
  return (
    <>
      <Usage>
        A paleta de comandos: uma caixa de busca que encontra telas, ações e
        registros ao mesmo tempo. É o atalho de quem usa o app todo dia e não
        quer atravessar três cliques de navegação.
      </Usage>

      <DocSection
        title="Inline"
        description="A mesma lista, sem o diálogo. Serve dentro de um popover ou de uma folha."
        code={`<Command>
  <CommandInput placeholder="Buscar…" />
  <CommandList>
    <CommandEmpty>Nada encontrado.</CommandEmpty>
    <CommandGroup heading="Ir para">
      <CommandItem>Carteiras</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`}
        previewClassName="items-stretch"
      >
        <Command className="w-full max-w-md rounded-lg border border-border">
          <CommandInput placeholder="Buscar tela, ação ou transação…" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Ir para">
              <CommandItem>
                <WalletIcon aria-hidden />
                Carteiras
              </CommandItem>
              <CommandItem>
                <CreditCardIcon aria-hidden />
                Cartões
              </CommandItem>
              <CommandItem>
                <SettingsIcon aria-hidden />
                Configurações
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Ações">
              <CommandItem>
                <PlusIcon aria-hidden />
                Nova transação
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DocSection>

      <DocSection
        title="Como diálogo (⌘K)"
        code={`const [open, setOpen] = React.useState(false)

React.useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setOpen((v) => !v)
    }
  }
  document.addEventListener("keydown", onKey)
  return () => document.removeEventListener("keydown", onKey)
}, [])

<CommandDialog open={open} onOpenChange={setOpen}>…</CommandDialog>`}
      >
        <CommandDialogDemo />
      </DocSection>

      <DocNote title="O app ainda não tem busca global">
        Não existe nenhuma ocorrência de <code>CommandDialog</code>{" "}
        fora desta
        página. Este é o componente que a lacuna pede, e a tela que o consumir
        precisa decidir duas coisas que o componente não decide: o que entra na
        lista (telas, ações, transações, categorias) e como o resultado é
        ordenado quando vem de fontes diferentes.
      </DocNote>

      <DocNote title="⌘K precisa de um gatilho visível também">
        Um atalho que só existe no teclado não existe no telefone e não é
        descoberto por ninguém. O botão de busca no cabeçalho é o que torna a
        paleta encontrável; o <kbd>⌘</kbd><kbd>K</kbd>{" "}
        é o atalho para quem já
        sabe.
      </DocNote>
    </>
  )
}

function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Buscar
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar tela, ação ou transação…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ir para">
            <CommandItem onSelect={() => setOpen(false)}>
              <WalletIcon aria-hidden />
              Carteiras
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <CreditCardIcon aria-hidden />
              Cartões
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
