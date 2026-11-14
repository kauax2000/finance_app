/* eslint-disable @next/next/no-img-element -- a foto vem de uma URL assinada do Storage, fora do otimizador */
"use client"

import * as React from "react"
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
    // Ao fechar, `anexo` vira null mas o diálogo ainda sai animando: ele segue mostrando o último.
    const [ultimo, setUltimo] = React.useState(anexo)
    if (anexo && anexo !== ultimo) setUltimo(anexo)
    const mostrado = anexo ?? ultimo
    const urls = useQuery({
        // A chave segue o mostrado: fechando, as URLs do cache ficam; abrindo outro, não reaparecem as do anterior.
        queryKey: ["anexo-url", mostrado?.path],
        // Sem URL é erro, não sucesso: senão o `null` ficaria 50 min no cache e reabrir não tentaria de novo.
        queryFn: async () => {
            const r = await urlsDoAnexo(supabase, mostrado!.path)
            if (!r) throw new Error("Sem URL assinada")
            return r
        },
        enabled: anexo != null,
        // A URL assinada vale 1 h: 50 min de folga antes de pedir outra.
        staleTime: 50 * 60 * 1000,
        retry: false,
    })
    const pdf = mostrado?.mime === "application/pdf"
    const prontas = urls.data ?? null

    return (
        <Dialog open={anexo != null} onOpenChange={onOpenChange} surface="auto">
            <DialogContent size="xl">
                <DialogHeader>
                    <DialogTitle>{pdf ? "PDF" : "Foto"}</DialogTitle>
                    <DialogDescription>
                        {mostrado ? `${tamanhoDoAnexo(mostrado.size_bytes)} · ${formatDatePtBr(mostrado.created_at)}` : null}
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {urls.isPending || (urls.isFetching && !urls.data) ? (
                        <Skeleton className="h-96 w-full" />
                    ) : !prontas ? (
                        <Card padding="none">
                            <CardMessage tone="destructive">Não foi possível abrir o anexo.</CardMessage>
                        </Card>
                    ) : pdf ? (
                        <iframe src={prontas.ver} title={descricaoDoAnexo(mostrado!)} className="h-[70dvh] w-full rounded-row-lg" />
                    ) : (
                        <img src={prontas.ver} alt={descricaoDoAnexo(mostrado!)} className="w-full rounded-row-lg object-contain" />
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
                            {/* Nova aba também: na mesma janela, o app instalado saía para o arquivo. */}
                            <a href={prontas.baixar} target="_blank" rel="noopener" download>
                                Baixar
                            </a>
                        </Button>
                    </DialogFooter>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
