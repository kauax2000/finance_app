"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function DialogDoc() {
  return (
    <>
      <Usage>
        Uma tarefa curta sem sair da tela: renomear, escolher, ajustar. No telefone, um formulário de verdade cabe melhor num <code>Sheet</code> de baixo.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Dialog>
  <DialogTrigger asChild><Button>Renomear</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Renomear carteira</DialogTitle>
      <DialogDescription>O nome aparece no seletor.</DialogDescription>
    </DialogHeader>
    …
    <DialogFooter>
      <DialogClose asChild><Button variant="tertiary">Cancelar</Button></DialogClose>
      <Button type="submit">Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Renomear carteira</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renomear carteira</DialogTitle>
              <DialogDescription>
                O nome aparece no seletor e nos relatórios.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ds-dialog-nome">Nome</Label>
              <Input id="ds-dialog-nome" defaultValue="Conta corrente" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="tertiary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocSection>

      <DocNote title="DialogTitle é obrigatório">
        Ele é o nome acessível do diálogo: sem ele, o leitor de tela anuncia
        &ldquo;diálogo&rdquo; e nada mais, e o Radix ainda avisa no console. Se o
        título não deve aparecer, ele existe assim mesmo com{" "}
        <code>className=&quot;sr-only&quot;</code>.
      </DocNote>

      <DocNote title="O rodapé tem uma hierarquia só">
        Cancelar é <code>ghost</code> e vem antes; a ação é <code>default</code>. Como <code>DialogClose</code> é um passa-tudo, ele recebe <code>asChild</code> com um <code>Button variant=&quot;ghost&quot; type=&quot;button&quot;</code> dentro — sem o <code>type</code>, vira o alvo do Enter.
      </DocNote>
    </>
  )
}
