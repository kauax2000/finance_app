/* eslint-disable @next/next/no-img-element -- a foto vem de uma URL assinada do Storage, fora do otimizador */
"use client"

import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Card, CardMessage } from "@/components/ui/card"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { descricaoDoAnexo, tamanhoDoAnexo, urlsDoAnexo } from "@/lib/anexos"
import { supabase, type Attachment } from "@/lib/supabase"
import { formatDatePtBr } from "@/lib/transaction-date"

/** O anexo aberto dentro do app: a foto ou o PDF, com abrir em nova aba e baixar. */
export function VisualizadorDeAnexo({
    anexo,
    onOpenChange,
}: {
    anexo: Attachment | null
    onOpenChange: (open: boolean) => void
}) {
    const urls = useQuery({
        queryKey: ["anexo-url", anexo?.path],
        queryFn: () => urlsDoAnexo(supabase, anexo!.path),
        enabled: anexo != null,
        // A URL assinada vale 1 h: 50 min de folga antes de pedir outra.
        staleTime: 50 * 60 * 1000,
    })
    const pdf = anexo?.mime === "application/pdf"
    const prontas = urls.data ?? null

    return (
        <Dialog open={anexo != null} onOpenChange={onOpenChange} surface="auto">
            <DialogContent size="xl">
                <DialogHeader>
                    <DialogTitle>{pdf ? "PDF" : "Foto"}</DialogTitle>
                    <DialogDescription>
                        {anexo ? `${tamanhoDoAnexo(anexo.size_bytes)} · ${formatDatePtBr(anexo.created_at)}` : null}
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {urls.isPending ? (
                        <Skeleton className="h-96 w-full" />
                    ) : !prontas ? (
                        <Card padding="none">
                            <CardMessage tone="destructive">Não foi possível abrir o anexo.</CardMessage>
                        </Card>
                    ) : pdf ? (
                        <iframe src={prontas.ver} title={descricaoDoAnexo(anexo!)} className="h-[70dvh] w-full rounded-row-lg" />
                    ) : (
                        <img src={prontas.ver} alt={descricaoDoAnexo(anexo!)} className="w-full rounded-row-lg object-contain" />
                    )}
                </DialogBody>
                {prontas ? (
                    <DialogFooter>
                        <Button variant="tertiary" asChild>
                            <a href={prontas.ver} target="_blank" rel="noopener">
                                Abrir em nova aba
                            </a>
                        </Button>
                        <Button variant="primary" asChild>
                            <a href={prontas.baixar}>Baixar</a>
                        </Button>
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
