"use client"

import { urlDoMcp } from "@/components/account/ias-secao"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { Button } from "@/components/ui/button"
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
import { Muted } from "@/components/ui/typography"

/** A URL do MCP e como cada IA a conecta. */
export function ConectarIaDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const url = urlDoMcp(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Conectar uma IA</DialogTitle>
                    <DialogDescription>Copie o endereço e cole no conector da IA.</DialogDescription>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-4">
                    <CampoDeCopiar rotulo="Endereço do MCP" valor={url} />
                    <div className="flex flex-col gap-3 text-sm">
                        <div>
                            <strong>Claude</strong>
                            <Muted>Configurações › Conectores › Adicionar conector personalizado, cole a URL.</Muted>
                        </div>
                        <div>
                            <strong>ChatGPT</strong>
                            <Muted>Configurações › Conectores (modo desenvolvedor ligado), cole a URL.</Muted>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                            <strong>Claude Code</strong>
                            <CampoDeCopiar
                                rotulo="Comando do Claude Code"
                                valor={`claude mcp add --transport http finance-app ${url}`}
                            />
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Fechar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
