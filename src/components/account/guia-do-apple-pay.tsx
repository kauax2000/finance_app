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
    usePreCarregarTelas,
} from "@/components/account/passo-a-passo"
import { CheckCircleIcon } from "@heroicons/react/20/solid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Muted, P } from "@/components/ui/typography"

/** A frase que a pessoa cola em "Descrever um atalho" (iOS 27): a automação sai dela. */
export const DESCRICAO_DA_AUTOMACAO =
    "Quando eu pagar com a Carteira, executar o atalho Lançar gasto (ou, se não houver, Lançar gasto rápido) na hora, sem pedir confirmação."

const PASSOS: { titulo: string; texto: ReactNode; extra?: ReactNode; tela?: Tela }[] = [
    {
        titulo: "Abra o app Atalhos",
        texto: (
            <>
                Toque no app <strong>Atalhos</strong>. Não achou? Deslize a tela para baixo e busque.
            </>
        ),
        tela: TELAS_DO_APPLE_PAY.atalhos,
    },
    {
        titulo: "Toque em Automação e no +",
        texto: (
            <>
                Toque em <strong>Automação</strong> e depois no <strong>+</strong>, embaixo.
            </>
        ),
        tela: TELAS_DO_APPLE_PAY.adicionar,
    },
    {
        titulo: "Cole a descrição",
        texto: (
            <>
                Copie o texto e cole em <strong>Descrever um atalho</strong>.
            </>
        ),
        extra: (
            <>
                <CampoDeCopiar rotulo="Descrição da automação" valor={DESCRICAO_DA_AUTOMACAO} multilinha />
                <Muted>
                    Sem essa caixa? Toque em <strong>Transação</strong>, marque <strong>Executar Imediatamente</strong>{" "}
                    e escolha <strong>Lançar gasto</strong> (ou <strong>Lançar gasto rápido</strong>, se instalou o de toque).
                </Muted>
            </>
        ),
        tela: TELAS_DO_APPLE_PAY.descrever,
    },
    {
        titulo: "Confira e salve",
        texto: <>Antes de salvar, confira os três pontos da automação.</>,
        // Sem captura desta tela (não se desenha tela de iPhone): o que conferir, em lista.
        extra: (
            <>
                <Card padding="none">
                    <ItemGroup variant="divided">
                        {[
                            <>
                                Quando: <strong>Transação</strong> na Carteira
                            </>,
                            <>
                                <strong>Executar Imediatamente</strong> ligado
                            </>,
                            <>
                                Ação: <strong>Lançar gasto</strong> (ou <strong>Lançar gasto rápido</strong>)
                            </>,
                        ].map((linha, i) => (
                            <Item key={i} variant="flush">
                                <ItemMedia variant="icon">
                                    <CheckCircleIcon className="size-5 text-success" aria-hidden />
                                </ItemMedia>
                                <ItemContent>
                                    <ItemTitle className="font-normal">{linha}</ItemTitle>
                                </ItemContent>
                            </Item>
                        ))}
                    </ItemGroup>
                </Card>
                <Muted>Tudo certo? Salve no canto de cima da tela.</Muted>
            </>
        ),
    },
    {
        titulo: "Pague com o iPhone",
        texto: (
            <>
                Na próxima compra, o gasto entra sozinho: <strong>Gasto lançado: R$ 42,90</strong>.
            </>
        ),
        tela: TELA_DA_NOTIFICACAO,
    },
]

/** O guia da automação da Carteira: o Lançar gasto roda sozinho a cada compra com Apple Pay. */
export function GuiaDoApplePay({
    open,
    onOpenChange,
    onConcluir,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** O Pronto do último passo: quem abre guarda que a pessoa terminou. */
    onConcluir?: () => void
}) {
    const reduzido = useReducedMotion()
    const [passo, setPasso] = useState(0)
    // O primeiro passo ao abrir não anima: só a troca de passo.
    const [mudou, setMudou] = useState(false)
    usePreCarregarTelas(open, PASSOS.map((p) => p.tela))

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

    function corpo(i: number) {
        const p = PASSOS[i]
        return (
            <>
                <PecaDoPasso>
                    <P className="font-semibold">
                        {i + 1} · {p.titulo}
                        <span className="sr-only"> de {PASSOS.length}</span>
                    </P>
                    <Muted>{p.texto}</Muted>
                </PecaDoPasso>
                {p.extra ? <PecaDoPasso className="flex flex-col gap-2">{p.extra}</PecaDoPasso> : null}
                {p.tela ? (
                    <PecaDoPasso>
                        <JanelaDoAparelho tela={p.tela} />
                    </PecaDoPasso>
                ) : null}
            </>
        )
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
                    <CaixaDoPasso
                        chave={atual.titulo}
                        entrar={!reduzido && mudou}
                        fantasmas={PASSOS.map((_, i) => corpo(i))}
                    >
                        {corpo(passo)}
                    </CaixaDoPasso>
                </DialogBody>
                <PontosDoPasso total={PASSOS.length} atual={passo} />
                <DialogFooter>
                    {/* No primeiro passo o Voltar guarda o lugar, invisível: o rodapé tem a mesma
                        altura em todos os passos, e a gaveta não muda de tamanho. */}
                    <Button
                        type="button"
                        variant="tertiary"
                        disabled={passo === 0}
                        aria-hidden={passo === 0 || undefined}
                        tabIndex={passo === 0 ? -1 : undefined}
                        className={passo === 0 ? "invisible" : undefined}
                        onClick={() => irPara(passo - 1)}
                    >
                        Voltar
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={
                            ultimo
                                ? () => {
                                      onConcluir?.()
                                      onOpenChange(false)
                                  }
                                : () => irPara(passo + 1)
                        }
                    >
                        {ultimo ? "Pronto" : "Próximo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
