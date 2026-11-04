"use client"

import { useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import {
    CaixaDoPasso,
    JanelaDoAparelho,
    PecaDoPasso,
    PontosDoPasso,
    TELA_DA_NOTIFICACAO,
    TELAS_DO_APPLE_PAY,
    type Tela,
} from "@/components/account/passo-a-passo"
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
import { Muted, P } from "@/components/ui/typography"

/** A frase que a pessoa cola em "Descrever um atalho" (iOS 27): a automação sai dela. */
export const DESCRICAO_DA_AUTOMACAO =
    "Quando eu pagar com qualquer cartão da Carteira, executar na hora o atalho Lançar gasto com a compra, sem pedir confirmação."

const PASSOS: { titulo: string; texto: ReactNode; extra?: ReactNode; tela?: Tela }[] = [
    {
        titulo: "Abra o app Atalhos",
        texto: (
            <>
                Na tela de início, toque no app <strong>Atalhos</strong>. Se não achar, deslize para baixo no meio da
                tela e busque por Atalhos.
            </>
        ),
        tela: TELAS_DO_APPLE_PAY.atalhos,
    },
    {
        titulo: "Toque em Automação e no +",
        texto: (
            <>
                Na tela <strong>Biblioteca</strong>, toque em <strong>Automação</strong>. Depois toque no{" "}
                <strong>+</strong>, embaixo.
            </>
        ),
        tela: TELAS_DO_APPLE_PAY.adicionar,
    },
    {
        titulo: "Cole a descrição",
        texto: (
            <>
                Copie o texto abaixo, toque em <strong>Descrever um atalho</strong> e cole. O iPhone monta a automação
                sozinho.
            </>
        ),
        extra: (
            <>
                <CampoDeCopiar rotulo="Descrição da automação" valor={DESCRICAO_DA_AUTOMACAO} multilinha />
                <Muted>
                    Não aparece essa caixa? Em iPhones mais antigos, escolha <strong>Transação</strong>, marque os
                    cartões e <strong>Executar Imediatamente</strong>, toque em <strong>Seguinte</strong> e escolha{" "}
                    <strong>Lançar gasto</strong>.
                </Muted>
            </>
        ),
        tela: TELAS_DO_APPLE_PAY.descrever,
    },
    {
        titulo: "Confira e salve",
        texto: (
            <>
                Veja se a automação roda o <strong>Lançar gasto</strong> quando você paga com a Carteira, sem pedir
                confirmação. Se estiver certo, salve.
            </>
        ),
    },
    {
        titulo: "Pague com o iPhone",
        texto: (
            <>
                Na próxima compra com o iPhone, o gasto aparece sozinho: <strong>Gasto lançado: R$ 42,90</strong>.
            </>
        ),
        tela: TELA_DA_NOTIFICACAO,
    },
]

/** O guia da automação da Carteira: o Lançar gasto roda sozinho a cada compra com Apple Pay. */
export function GuiaDoApplePay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const reduzido = useReducedMotion()
    const [passo, setPasso] = useState(0)
    // O primeiro passo ao abrir não anima: só a troca de passo.
    const [mudou, setMudou] = useState(false)

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        if (open) {
            setPasso(0)
            setMudou(false)
        }
    }

    const atual = PASSOS[passo]
    const ultimo = passo === PASSOS.length - 1

    function irPara(n: number) {
        setMudou(true)
        setPasso(n)
    }

    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lançar ao pagar</DialogTitle>
                    <DialogDescription>Siga os passos no iPhone. Leva um minuto.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <span aria-live="polite" className="sr-only">
                        Passo {passo + 1} de {PASSOS.length}: {atual.titulo}
                    </span>
                    <CaixaDoPasso chave={atual.titulo} entrar={!reduzido && mudou}>
                        <PecaDoPasso>
                            <P className="font-semibold">
                                {passo + 1} · {atual.titulo}
                                <span className="sr-only"> de {PASSOS.length}</span>
                            </P>
                            <Muted>{atual.texto}</Muted>
                        </PecaDoPasso>
                        {atual.extra ? <PecaDoPasso className="flex flex-col gap-2">{atual.extra}</PecaDoPasso> : null}
                        {atual.tela ? (
                            <PecaDoPasso>
                                <JanelaDoAparelho tela={atual.tela} />
                            </PecaDoPasso>
                        ) : null}
                    </CaixaDoPasso>
                </DialogBody>
                <PontosDoPasso total={PASSOS.length} atual={passo} />
                <DialogFooter>
                    {passo > 0 ? (
                        <Button type="button" variant="tertiary" onClick={() => irPara(passo - 1)}>
                            Voltar
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="primary"
                        onClick={ultimo ? () => onOpenChange(false) : () => irPara(passo + 1)}
                    >
                        {ultimo ? "Pronto" : "Próximo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
