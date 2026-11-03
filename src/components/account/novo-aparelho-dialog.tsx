"use client"

import { useState } from "react"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { enderecoDeCaptura } from "@/components/account/como-configurar-dialog"
import { mensagemDoErroDeToken, NOME_INVALIDO } from "@/components/account/atalho-secao"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormControl, FormError, FormField, FormInput, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase } from "@/lib/supabase"

/**
 * Cria um token de captura. O texto do token vive só no estado deste diálogo:
 * fechar por qualquer caminho o descarta, e reabrir mostra o formulário vazio.
 */
export function NovoAparelhoDialog({
    open,
    onOpenChange,
    aoCriar,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    aoCriar: () => void
}) {
    const { workspaces, currentWorkspaceId } = useWorkspace()
    const [nome, setNome] = useState("")
    const [carteira, setCarteira] = useState("")
    const [erro, setErro] = useState<string | null>(null)
    const [tokenNovo, setTokenNovo] = useState<string | null>(null)
    const [criando, setCriando] = useState(false)

    const carteiraEscolhida = carteira || currentWorkspaceId || ""

    function handleOpenChange(next: boolean) {
        if (!next) {
            setTokenNovo(null)
            setNome("")
            setCarteira("")
            setErro(null)
        }
        onOpenChange(next)
    }

    async function criar() {
        const n = nome.trim()
        if (n.length < 1 || n.length > 60) return setErro(NOME_INVALIDO)
        if (!carteiraEscolhida) return setErro("Escolha a carteira padrão.")
        setCriando(true)
        setErro(null)
        const { data, error } = await supabase.rpc("create_capture_token", {
            p_workspace_id: carteiraEscolhida,
            p_name: n,
        })
        setCriando(false)
        if (error) return setErro(mensagemDoErroDeToken(error))
        setTokenNovo(data)
        setNome("")
        aoCriar()
    }

    return (
        <Dialog surface="auto" pending={criando} open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                {tokenNovo ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Guarde agora: ele não aparece de novo.</DialogTitle>
                            <DialogDescription>
                                Cole o token no Atalho. Se perder, revogue e crie outro.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogBody className="flex flex-col gap-4">
                            <CampoDeCopiar rotulo="Token" valor={tokenNovo} />
                            <CampoDeCopiar rotulo="Endereço da captura" valor={enderecoDeCaptura()} />
                        </DialogBody>
                        <DialogFooter>
                            <Button type="button" variant="primary" onClick={() => handleOpenChange(false)}>
                                Já guardei
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Novo aparelho</DialogTitle>
                            <DialogDescription>
                                O token deixa o aparelho lançar gastos sem abrir o app.
                            </DialogDescription>
                        </DialogHeader>
                        <CustomForm
                            onSubmit={(e) => {
                                e.preventDefault()
                                return criar()
                            }}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <DialogBody className="flex flex-col gap-4">
                                <FormInput
                                    label="Nome do aparelho"
                                    value={nome}
                                    maxLength={60}
                                    placeholder="iPhone da Ana"
                                    onChange={(e) => setNome(e.target.value)}
                                />
                                <FormField label="Carteira padrão">
                                    <Select value={carteiraEscolhida} onValueChange={setCarteira}>
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
                                <FormCancel onClick={() => handleOpenChange(false)}>Cancelar</FormCancel>
                                <FormSubmit>Criar</FormSubmit>
                            </DialogFooter>
                        </CustomForm>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
