"use client"

import { useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import {
    CaixaDoPasso,
    JanelaDoAparelho,
    PecaDoPasso,
    PontosDoPasso,
    TELA_DA_NOTIFICACAO,
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

const PASSOS: { titulo: string; texto: ReactNode; tela?: Tela }[] = [
    // shortcut: sem captura real do iOS 27 (o simulador não tem Apple Pay); trocar pelo print do iPhone quando houver.
    {
        titulo: "Abra o Lançar gasto",
        texto: (
            <>
                No app <strong>Atalhos</strong>, toque e segure o <strong>Lançar gasto</strong> e escolha{" "}
                <strong>Editar</strong>.
            </>
        ),
    },
    // shortcut: sem captura real do iOS 27 (o simulador não tem Apple Pay); trocar pelo print do iPhone quando houver.
    {
        titulo: "Crie a automação da Carteira",
        texto: (
            <>
                Toque em <strong>Adicionar automação</strong>, escolha <strong>Carteira</strong> e marque os cartões
                que você usa no iPhone.
            </>
        ),
    },
    {
        titulo: "Marque Executar imediatamente",
        texto: (
            <>
                Assim ele não pergunta nada a cada compra. Pague com o iPhone e o gasto aparece:{" "}
                <strong>Gasto lançado: R$ 42,90</strong>.
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
                    <DialogDescription>O Lançar gasto roda sozinho a cada compra com Apple Pay.</DialogDescription>
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
