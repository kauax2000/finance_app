"use client"

import { useState } from "react"
import Image from "next/image"
import { CreditCardIcon, MicrophoneIcon, PencilSquareIcon, SparklesIcon } from "@heroicons/react/16/solid"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { QrCode, QrCodeCopy } from "@/components/ui/qr-code"
import iphone from "./assets/iphone-17-pro-prata.webp"

/** A lista do que o celular faz; as três primeiras só existem no iPhone. */
const VANTAGENS = [
    { icone: MicrophoneIcon, texto: "Lance falando com a Siri ou com um toque", iphone: true },
    { icone: PencilSquareIcon, texto: "Um formulário rápido quando não dá para falar", iphone: true },
    { icone: CreditCardIcon, texto: "Pague com Apple Pay e o gasto entra sozinho", iphone: true },
    { icone: SparklesIcon, texto: "Lance digitando uma frase, com o app na tela de início", iphone: false },
]

/**
 * O cartão "No celular" do desktop: o iPhone 17 Pro (do PSD em
 * `docs/design/mockups/`) vaza por cima da borda de cima do cartão e é cortado
 * embaixo, e o QR flutua sobre a borda dele. O `Card` é `overflow-visible` porque
 * a base recortaria o aparelho na borda de cima; o corte de baixo, rente à borda
 * do cartão, é do `clip-path` da camada da imagem (o aparelho fica longe dos
 * cantos, então não precisa do raio). Abaixo de 36rem de cartão o aparelho some
 * e o QR volta ao fluxo, para não cobrir o texto. O texto vende o celular: o
 * computador é para ver e organizar, e a lista cresce com a altura mínima.
 */
export function NoCelularCartao({ value }: { value: string }) {
    // Cada cópia feita soma 1, e o `QrCode` toca a onda.
    const [onda, setOnda] = useState(0)

    return (
        <div className="@container/no-celular">
            <Card padding="none" className="relative min-h-56 overflow-visible">
                <div className="pointer-events-none absolute inset-0 [clip-path:inset(-5rem_-2rem_0_-2rem)] @max-xl/no-celular:hidden">
                    <Image
                        src={iphone}
                        alt=""
                        sizes="196px"
                        className="absolute -top-16 right-8 w-49 select-none drop-shadow-xl"
                    />
                </div>
                <div className="flex h-full min-w-0 items-center justify-between gap-6 p-4">
                    <div className="flex min-w-0 flex-col justify-center @xl/no-celular:w-64">
                        <p className="text-base font-semibold">O dia a dia é no celular</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            No computador você vê e organiza. Na rua, lança pelo celular.
                        </p>
                        <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                            {VANTAGENS.map(({ icone: Icone, texto, iphone: soIphone }) => (
                                <li key={texto} className="flex items-start gap-2">
                                    <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                                    <span>
                                        {texto}
                                        {soIphone && (
                                            <Badge size="xs" tone="neutral" className="ml-1.5 align-middle">
                                                no iPhone
                                            </Badge>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
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
