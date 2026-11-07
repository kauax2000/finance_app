"use client"

import { useState, type FormEvent } from "react"
import { useReducedMotion } from "motion/react"

import { CaixaDoPasso, PecaDoPasso } from "@/components/account/passo-a-passo"
import { AvatarDoMembro, type MemberWithProfile } from "@/components/members/pessoas-secao"
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
import { CustomForm, FormCancel, FormError, FormInput, FormSubmit } from "@/components/ui/form"
import { Item, ItemChevron, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { currencyBRL } from "@/lib/formatters"
import { ERRO_DO_LIMITE, lerLimiteDigitado, passoInicial, type LinhaDoLimite } from "@/lib/limites/limites"

/**
 * "Adicionar limite" em dois passos: escolher quem (das pessoas sem limite),
 * depois o valor. Com uma pessoa só, abre direto no valor, sem "Voltar".
 * Fechar descarta: ao abrir, recomeça do primeiro passo com o campo limpo.
 */
export function AdicionarLimiteDialog({
    open,
    onOpenChange,
    semLimite,
    pessoas,
    onSalvar,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** As linhas de quem ainda não tem limite. */
    semLimite: LinhaDoLimite[]
    pessoas: MemberWithProfile[]
    onSalvar: (userId: string, valor: number) => Promise<void>
}) {
    const reduzido = useReducedMotion()
    const [passo, setPasso] = useState<1 | 2>(1)
    // Congelados ao abrir e ao escolher: salvar relê o pacote antes de fechar, e a
    // pessoa salva sai de `semLimite` durante a saída (o título perdia o nome).
    const [lista, setLista] = useState(semLimite)
    const [escolhida, setEscolhida] = useState<LinhaDoLimite | null>(null)
    const [valor, setValor] = useState("")
    const [erro, setErro] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)
    // O passo ao abrir não anima: só a troca de passo.
    const [mudou, setMudou] = useState(false)

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        if (open) {
            setLista(semLimite)
            setPasso(passoInicial(semLimite.length))
            setEscolhida(semLimite.length === 1 ? semLimite[0] : null)
            setValor("")
            setErro(null)
            setMudou(false)
        }
    }

    const titulo = passo === 1 ? "Adicionar limite" : `Limite de ${escolhida?.nome ?? ""}`

    function irPara(n: 1 | 2) {
        setMudou(true)
        setErro(null)
        setPasso(n)
    }

    async function salvar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!escolhida) return
        const n = lerLimiteDigitado(valor)
        if (n == null) {
            setErro(ERRO_DO_LIMITE)
            return
        }
        setSalvando(true)
        setErro(null)
        try {
            await onSalvar(escolhida.user_id, n)
            onOpenChange(false)
        } catch (err) {
            setErro(err instanceof Error ? err.message : "Não foi possível salvar o limite.")
        } finally {
            setSalvando(false)
        }
    }

    const escolha = (
        <PecaDoPasso>
            <ItemGroup variant="divided">
                {lista.map((l) => {
                    const membro = pessoas.find((m) => m.user_id === l.user_id)
                    return (
                        <Item key={l.user_id} variant="flush" size="lg" interactive asChild>
                            <button
                                type="button"
                                onClick={() => {
                                    setEscolhida(l)
                                    setValor("")
                                    irPara(2)
                                }}
                            >
                                {membro ? (
                                    <ItemMedia>
                                        <AvatarDoMembro member={membro} size="sm" />
                                    </ItemMedia>
                                ) : null}
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="truncate pointer-coarse:text-base">{l.nome}</ItemTitle>
                                    <ItemDescription>{`${currencyBRL(l.gastoCentavos / 100)} no mês`}</ItemDescription>
                                </ItemContent>
                                <ItemChevron />
                            </button>
                        </Item>
                    )
                })}
            </ItemGroup>
        </PecaDoPasso>
    )

    function campo(fantasma: boolean) {
        return (
            <PecaDoPasso className="flex flex-col gap-3">
                <FormInput
                    money
                    label="Limite mensal em R$"
                    placeholder="1.234,56"
                    autoFocus={!fantasma}
                    value={valor}
                    onValueChange={(v) => setValor(v)}
                />
                {fantasma ? null : <FormError>{erro}</FormError>}
            </PecaDoPasso>
        )
    }

    // Os dois passos dão à caixa a altura do maior: a gaveta não muda de tamanho na troca.
    const fantasmas = lista.length > 1 ? [escolha, campo(true)] : [campo(true)]

    return (
        <Dialog surface="auto" pending={salvando} open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                    <DialogDescription>
                        {passo === 1 ? "Escolha a pessoa." : "Quanto esta pessoa pode gastar por mês."}
                    </DialogDescription>
                </DialogHeader>
                <CustomForm pending={salvando} onSubmit={salvar}>
                    <DialogBody>
                        <span aria-live="polite" className="sr-only">
                            {mudou ? titulo : null}
                        </span>
                        <CaixaDoPasso chave={String(passo)} entrar={!reduzido && mudou} fantasmas={fantasmas}>
                            {passo === 1 ? escolha : campo(false)}
                        </CaixaDoPasso>
                    </DialogBody>
                    <DialogFooter>
                        {passo === 2 && lista.length > 1 ? (
                            <Button type="button" variant="tertiary" disabled={salvando} onClick={() => irPara(1)}>
                                Voltar
                            </Button>
                        ) : (
                            <FormCancel onClick={() => onOpenChange(false)}>Cancelar</FormCancel>
                        )}
                        {passo === 2 ? <FormSubmit>Salvar</FormSubmit> : null}
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
