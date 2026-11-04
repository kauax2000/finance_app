"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { QrCode } from "@/components/ui/qr-code"
import { useQuickCreateTransaction } from "@/components/layout/quick-actions"
import { InstallPwaSheet } from "@/components/pwa/install-pwa-sheet"
import { ROUTES } from "@/config/navigation"
import { useAparelhoDeLancar, type AparelhoDeLancar } from "@/hooks/use-aparelho-de-lancar"

const semAssinatura = () => () => {}

const NO_APP = "No app instalado você lança em segundos, direto da tela de início."

const FRASE: Record<Exclude<AparelhoDeLancar, "sabendo">, string> = {
    "iphone-instalado": "Põe os gastos em dia: quem lança todo dia sabe para onde o dinheiro vai.",
    "android-instalado": "Põe os gastos em dia: quem lança todo dia sabe para onde o dinheiro vai.",
    "navegador-iphone": NO_APP,
    "navegador-android": `${NO_APP} No menu do navegador, toque em Instalar app.`,
    computador: "O dia a dia do Finance é no celular: lá você lança na hora da compra.",
}

/** Depois de 10 dias sem acesso: reforça o app, com o caminho de cada aparelho. */
export function DialogoDeVolta({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const aparelho = useAparelhoDeLancar()
    const lancar = useQuickCreateTransaction()
    const [instalar, setInstalar] = useState(false)
    // O mesmo link do "No celular" de Configurações.
    const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => "")
    const noTelefone = origem ? `${origem}${ROUTES.ME}#no-celular` : ""

    if (aparelho === "sabendo") return null

    const instalado = aparelho === "iphone-instalado" || aparelho === "android-instalado"
    const iphone = aparelho === "navegador-iphone"
    // Sem ação ao lado, o "Agora não" é o botão único: preenche.
    const sozinho = !instalado && !iphone

    return (
        <>
            <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Que bom te ver de volta</DialogTitle>
                        <DialogDescription>{FRASE[aparelho]}</DialogDescription>
                    </DialogHeader>
                    {aparelho === "computador" && noTelefone ? (
                        <div className="flex justify-center py-2">
                            <QrCode value={noTelefone} label="Abrir o Finance no telefone" link={false} />
                        </div>
                    ) : null}
                    <DialogFooter
                        start={
                            instalado ? (
                                <Button variant="link" asChild>
                                    <Link href="/transactions?conferir=1">Ver o que está a conferir</Link>
                                </Button>
                            ) : undefined
                        }
                    >
                        <DialogClose asChild>
                            <Button type="button" variant={sozinho ? "secondary" : "tertiary"}>
                                Agora não
                            </Button>
                        </DialogClose>
                        {instalado ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                    onOpenChange(false)
                                    lancar("expense")
                                }}
                            >
                                Lançar um gasto
                            </Button>
                        ) : iphone ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                    onOpenChange(false)
                                    setInstalar(true)
                                }}
                            >
                                Como instalar
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {iphone ? <InstallPwaSheet open={instalar} onOpenChange={setInstalar} /> : null}
        </>
    )
}
