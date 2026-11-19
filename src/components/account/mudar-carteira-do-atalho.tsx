"use client"

import { useState } from "react"

import { mensagemDoErroDeToken } from "@/components/account/atalho-secao"
import { tituloDoAtalho } from "@/components/account/gatilhos-do-atalho"
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormCancel, FormControl, FormError, FormField, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"

/** Troca a carteira de um atalho sem baixá-lo de novo: o código continua o mesmo. */
export function MudarCarteiraDoAtalho({
    atalho,
    onOpenChange,
    aoMudar,
}: {
    atalho: CaptureToken | null
    onOpenChange: (open: boolean) => void
    aoMudar: () => void
}) {
    const { workspaces } = useWorkspace()
    const [carteira, setCarteira] = useState("")
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const escolhida = carteira || atalho?.workspace_id || ""

    function mudarAberto(aberto: boolean) {
        if (!aberto) {
            setCarteira("")
            setErro(null)
        }
        onOpenChange(aberto)
    }

    async function salvar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!atalho) return
        if (escolhida === atalho.workspace_id) return mudarAberto(false)
        setSalvando(true)
        setErro(null)
        const { error } = await supabase.rpc("set_capture_token_workspace", { p_id: atalho.id, p_workspace_id: escolhida })
        setSalvando(false)
        if (error) return setErro(mensagemDoErroDeToken(error))
        mudarAberto(false)
        aoMudar()
    }

    return (
        <Dialog surface="auto" pending={salvando} open={atalho != null} onOpenChange={mudarAberto}>
            <DialogContent>
                <Form pending={salvando} onSubmit={(e) => void salvar(e)}>
                    <DialogHeader>
                        <DialogTitle>Mudar carteira</DialogTitle>
                        <DialogDescription>
                            {atalho ? `Os gastos de "${tituloDoAtalho(atalho)}" passam a cair na carteira escolhida.` : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody className="flex flex-col gap-4">
                        <FormField label="Os gastos caem em">
                            <Select value={escolhida} onValueChange={setCarteira}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a carteira" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {workspaces.map((w) => (
                                        <SelectItem key={w.id} value={w.id}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormError>{erro}</FormError>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose asChild>
                            <FormCancel>Cancelar</FormCancel>
                        </DialogClose>
                        <FormSubmit>Salvar</FormSubmit>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
