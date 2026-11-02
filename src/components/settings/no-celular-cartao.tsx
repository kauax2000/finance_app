"use client"

import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { QrCode, QrCodeCopy } from "@/components/ui/qr-code"
import { Muted } from "@/components/ui/typography"
import iphone from "./assets/iphone-17-pro-prata.webp"

/**
 * O cartão "No celular" do desktop: o iPhone 17 Pro (do PSD em
 * `docs/design/mockups/`) vaza por cima da borda de cima do cartão e é cortado
 * embaixo, e o QR flutua sobre a borda dele. O `Card` é `overflow-visible` porque
 * a base recortaria o aparelho na borda de cima; o corte de baixo, rente à borda
 * do cartão, é do `clip-path` da camada da imagem (o aparelho fica longe dos
 * cantos, então não precisa do raio). Abaixo de 36rem de cartão o aparelho some
 * e o QR volta ao fluxo, para não cobrir o texto.
 */
export function NoCelularCartao({ value }: { value: string }) {
    // Cada cópia feita soma 1, e o `QrCode` toca a onda.
    const [onda, setOnda] = useState(0)

    return (
        <div className="@container/no-celular">
            <Card padding="none" className="relative h-56 overflow-visible @max-xl/no-celular:h-auto">
                <div className="pointer-events-none absolute inset-0 [clip-path:inset(-5rem_-2rem_0_-2rem)] @max-xl/no-celular:hidden">
                    <Image
                        src={iphone}
                        alt=""
                        sizes="196px"
                        className="absolute -top-16 right-8 w-49 select-none drop-shadow-xl"
                    />
                </div>
                <div className="flex h-full min-w-0 items-center justify-between gap-6 p-4">
                    <div className="flex min-w-0 flex-col justify-center @xl/no-celular:w-54">
                        <p className="text-sm font-medium">Abra o Finance no telefone</p>
                        <Muted>Aponte a câmera para o código. Lá você liga o lançamento inteligente e instala o app.</Muted>
                        <QrCodeCopy value={value} onCopied={() => setOnda((n) => n + 1)} className="mt-3" />
                    </div>
                    <QrCode
                        value={value}
                        label="Abrir o Finance no telefone"
                        link={false}
                        wave={onda}
                        className="@xl/no-celular:absolute @xl/no-celular:right-44 @xl/no-celular:bottom-4 @xl/no-celular:shadow-xl"
                    />
                </div>
            </Card>
        </div>
    )
}
