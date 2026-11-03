"use client"

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

/** Resolve quando o 2.0 chegar à `main`; até lá, o caminho no texto ao lado do link diz onde está. */
export const GUIA = "https://github.com/kauax2000/finance_app/blob/main/docs/captura/atalho-iphone.md"

/** O endereço da captura no projeto Supabase, com ou sem barra no fim. */
export function enderecoDeCaptura(): string {
    return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "")}/functions/v1/capture`
}

/** O endereço da captura e o guia do Atalho do iPhone, do Apple Pay e do compartilhar. */
export function ComoConfigurarDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Como configurar</DialogTitle>
                    <DialogDescription>
                        Use o endereço e um token no Atalho do iPhone, no Apple Pay ou no compartilhar.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="flex flex-col gap-4">
                    <CampoDeCopiar rotulo="Endereço da captura" valor={enderecoDeCaptura()} />
                    <p className="text-sm">
                        Guia passo a passo:{" "}
                        <a href={GUIA} target="_blank" rel="noreferrer" className="underline">
                            docs/captura/atalho-iphone.md
                        </a>{" "}
                        no repositório.
                    </p>
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
