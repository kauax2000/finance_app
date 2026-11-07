"use client"

import { useLayoutEffect, useRef, useState, type FormEvent } from "react"

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
import {
    chegarAEscolha,
    chegarAoValor,
    sairDaEscolha,
    sairDoValor,
    segurarTeclado,
    semMovimento,
    type OrigemDaViagem,
} from "@/components/members/viagem-do-passo"
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
            const inicio = passoInicial(pessoas.length)
            setPasso(inicio)
            setEscolhida(inicio === 2 ? (semLimite[0] ?? null) : null)
            setValor("")
            setErro(null)
            setMudou(false)
        }
    }

    // A troca de passo é um gesto (`viagem-do-passo`): o nome tocado vira o título.
    // Cabeçalho, corpo e rodapé remontam pela chave do passo, e as entradas rodam
    // no layout do passo novo, antes da pintura.
    const cabecalhoRef = useRef<HTMLDivElement>(null)
    const corpoRef = useRef<HTMLDivElement>(null)
    const rodapeRef = useRef<HTMLDivElement>(null)
    const origem = useRef<OrigemDaViagem | null>(null)
    const voltou = useRef(false)
    const [trocando, setTrocando] = useState(false)
    const soltarTeclado = useRef<(() => void) | null>(null)

    useLayoutEffect(() => {
        const [cab, corpo, pe] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current]
        if (!mudou || !cab || !corpo || !pe || semMovimento()) return
        // O `autoFocus` do campo já pegou o foco: a ponte do teclado sai.
        soltarTeclado.current?.()
        soltarTeclado.current = null
        if (passo === 2 && origem.current) chegarAoValor(corpo, cab, pe, origem.current)
        if (passo === 1 && voltou.current) chegarAEscolha(corpo, cab, pe)
        origem.current = null
        voltou.current = false
    }, [passo, mudou])

    const titulo = passo === 1 ? "Adicionar limite" : `Limite de ${escolhida?.nome ?? ""}`

    function irPara(n: 1 | 2) {
        setMudou(true)
        setErro(null)
        setPasso(n)
    }

    async function escolher(l: LinhaDoLimite, linha: HTMLElement) {
        if (trocando) return
        const [cab, corpo, pe] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current]
        const nome = linha.querySelector("[data-nome]")
        if (cab && corpo && pe && nome && !semMovimento()) {
            origem.current = { nome: nome.getBoundingClientRect(), linha: linha.getBoundingClientRect() }
            setTrocando(true)
            soltarTeclado.current = segurarTeclado(corpo)
            await sairDaEscolha(corpo, cab, pe, linha)
            setTrocando(false)
        }
        setEscolhida(l)
        setValor("")
        irPara(2)
    }

    async function voltar() {
        if (trocando) return
        const [cab, corpo, pe] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current]
        if (cab && corpo && pe && !semMovimento()) {
            setTrocando(true)
            await sairDoValor(corpo, cab, pe)
            setTrocando(false)
            voltou.current = true
        }
        irPara(1)
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
        <div>
            {/* Linhas de menu: sem fio, cantos de linha alta e o realce no toque. */}
            <ItemGroup className="-mx-3 w-auto gap-1">
                {lista.map((l) => {
                    const membro = pessoas.find((m) => m.user_id === l.user_id)
                    return (
                        <Item key={l.user_id} interactive asChild>
                            <button type="button" data-linha onClick={(e) => void escolher(l, e.currentTarget)}>
                                {membro ? (
                                    <ItemMedia>
                                        <AvatarDoMembro member={membro} size="sm" />
                                    </ItemMedia>
                                ) : null}
                                <ItemContent className="min-w-0">
                                    <ItemTitle className="truncate pointer-coarse:text-base">
                                        <span data-nome>{l.nome}</span>
                                    </ItemTitle>
                                    <ItemDescription>{`${currencyBRL(l.gastoCentavos / 100)} no mês`}</ItemDescription>
                                </ItemContent>
                                <ItemChevron />
                            </button>
                        </Item>
                    )
                })}
            </ItemGroup>
        </div>
    )

    const campo = (
        <div className="flex flex-col gap-3">
            <FormInput
                money
                label="Limite mensal em R$"
                placeholder="1.234,56"
                autoFocus
                value={valor}
                onValueChange={(v) => setValor(v)}
            />
            <FormError>{erro}</FormError>
        </div>
    )

    return (
        <Dialog surface="auto" pending={salvando} open={open} onOpenChange={onOpenChange}>
            <DialogContent layout="fixed">
                <DialogHeader key={`cabecalho-${passo}`} ref={cabecalhoRef}>
                    <DialogTitle>
                        {passo === 1 ? (
                            titulo
                        ) : (
                            <>
                                <span data-prefixo>Limite de </span>
                                <span data-nome>{escolhida?.nome ?? ""}</span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {passo === 1 ? "Escolha a pessoa." : "Quanto esta pessoa pode gastar por mês."}
                    </DialogDescription>
                </DialogHeader>
                <CustomForm pending={salvando} onSubmit={salvar}>
                    <DialogBody ref={corpoRef}>
                        <span aria-live="polite" className="sr-only">
                            {mudou ? titulo : null}
                        </span>
                        {/* Formulário: o diálogo acompanha a altura de cada passo (a altura do maior é só dos tutoriais). */}
                        <div key={passo} data-passo>
                            {passo === 1 ? escolha : campo}
                        </div>
                    </DialogBody>
                    <DialogFooter key={`rodape-${passo}`} ref={rodapeRef}>
                        {passo === 2 && pessoas.length > 1 ? (
                            <Button type="button" variant="tertiary" disabled={salvando} onClick={() => void voltar()}>
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
