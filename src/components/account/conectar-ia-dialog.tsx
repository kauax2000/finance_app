"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { ChevronLeftIcon, ShieldCheckIcon } from "@heroicons/react/16/solid"
import { LinkIcon } from "@heroicons/react/20/solid"
import { urlDoMcp } from "@/components/account/ias-secao"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { Capa, GARANTIAS, type Marca } from "@/components/account/marcas-de-ia"
import { CaixaDoPasso, PecaDoPasso, PontosDoPasso } from "@/components/account/passo-a-passo"
import { Button } from "@/components/ui/button"
import { FormCancel } from "@/components/ui/form"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Muted, P } from "@/components/ui/typography"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    brotarPasso,
    chegarAEscolha,
    chegarAoValor,
    recolherPasso,
    sairDaEscolhaPeloNome,
    sairDoValor,
    semMovimento,
    type OrigemDaViagem,
} from "@/lib/viagem-de-passo"

type Ia = "claude" | "chatgpt" | "claude-code"

/** Cada IA: a capa, a linha da escolha, o que copiar (passo 2) e o caminho dela (passo 3). */
const IAS: Record<
    Ia,
    {
        nome: string
        marca: Marca
        linha: string
        copiar: { titulo: string; texto: string; rotulo: string; valor: (url: string) => string }
        colar: { titulo: string; itens: string[] }
        /** O aviso de que os menus mudam: o terminal não tem menu. */
        menus: boolean
    }
> = {
    claude: {
        nome: "Claude",
        marca: "claude",
        linha: "Funciona em todos os planos. No gratuito, cabe um conector.",
        copiar: {
            titulo: "Copie o endereço do Finance",
            texto: "É por ele que o Claude chega ao seu Finance.",
            rotulo: "Endereço do Finance",
            valor: (url) => url,
        },
        colar: {
            titulo: "Cole no Claude",
            itens: [
                "Abra Configurações › Conectores.",
                "Toque em Adicionar conector personalizado.",
                "Dê o nome Finance e cole o endereço.",
            ],
        },
        menus: true,
    },
    chatgpt: {
        nome: "ChatGPT",
        marca: "chatgpt",
        linha: "Precisa de um plano pago e do Modo desenvolvedor.",
        copiar: {
            titulo: "Copie o endereço do Finance",
            texto: "É por ele que o ChatGPT chega ao seu Finance.",
            rotulo: "Endereço do Finance",
            valor: (url) => url,
        },
        colar: {
            titulo: "Cole no ChatGPT",
            itens: [
                "Abra Configurações › Conectores › Avançado e ligue o Modo desenvolvedor.",
                "Toque em Criar, dê o nome Finance e cole o endereço.",
                "Em Autenticação, escolha OAuth.",
            ],
        },
        menus: true,
    },
    "claude-code": {
        nome: "Claude Code",
        marca: "claude",
        linha: "No terminal, para quem programa.",
        copiar: {
            titulo: "Copie o comando",
            texto: "Ele adiciona o Finance ao Claude Code.",
            rotulo: "Comando do Claude Code",
            valor: (url) => `claude mcp add --transport http finance ${url}`,
        },
        colar: {
            titulo: "Rode no terminal",
            itens: [
                "Cole o comando no terminal e aperte Enter.",
                "Depois, digite /mcp e entre com a sua conta do Finance.",
            ],
        },
        menus: false,
    },
}

const TOTAL = 5

/** A capa da IA escolhida no topo do passo: é ilustração, o texto diz o resto. */
function Visual({ children }: { children: ReactNode }) {
    return (
        <PecaDoPasso className="flex items-center justify-center gap-3 py-2">
            {children}
        </PecaDoPasso>
    )
}

/** O guia de conectar uma IA: escolher, copiar, colar, autorizar e testar. */
export function ConectarIaDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const url = urlDoMcp(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    const reduzido = useReducedMotion()
    const celular = useIsMobile()
    const [passo, setPasso] = useState(0)
    const [ia, setIa] = useState<Ia | null>(null)
    // O primeiro passo ao abrir não anima: só a troca de passo.
    const [mudou, setMudou] = useState(false)

    // Fechar descarta o progresso: ao abrir, volta ao passo 1 sem IA escolhida.
    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        if (open) {
            setPasso(0)
            setIa(null)
            setMudou(false)
        }
    }

    const escolhida = ia ? IAS[ia] : null
    const ultimo = passo === TOTAL - 1

    // A troca de passo é um gesto (`viagem-de-passo`): da escolha, o nome da IA viaja
    // até o título e o guia brota do cartão; entre os passos do guia, o passo recolhe
    // e o seguinte brota. Cabeçalho e rodapé remontam só entre a escolha e o guia.
    const cabecalhoRef = useRef<HTMLDivElement>(null)
    const corpoRef = useRef<HTMLDivElement>(null)
    const rodapeRef = useRef<HTMLDivElement>(null)
    // O passo atual, sem os fantasmas: as linhas da escolha se procuram só nele.
    const atualRef = useRef<HTMLDivElement>(null)
    const origem = useRef<OrigemDaViagem | null>(null)
    const gesto = useRef<"escolheu" | "voltou" | "seguiu" | null>(null)
    const [trocando, setTrocando] = useState(false)

    useLayoutEffect(() => {
        const [cab, corpo, pe, atual] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current, atualRef.current]
        const g = gesto.current
        gesto.current = null
        if (!mudou || !g || !cab || !corpo || !pe || !atual || semMovimento()) return
        if (g === "escolheu" && origem.current) chegarAoValor(corpo, cab, pe, origem.current)
        else if (g === "voltou") chegarAEscolha(atual, cab, pe)
        else brotarPasso(corpo)
        origem.current = null
    }, [passo, mudou])

    async function irPara(n: number) {
        if (trocando) return
        const [cab, corpo, pe, atual] = [cabecalhoRef.current, corpoRef.current, rodapeRef.current, atualRef.current]
        if (cab && corpo && pe && atual && !semMovimento()) {
            setTrocando(true)
            const tocada = passo === 0 ? atual.querySelector<HTMLElement>(`[data-linha="${ia}"]`) : null
            const nome = tocada?.querySelector("[data-nome]")
            if (tocada && nome) {
                origem.current = { nome: nome.getBoundingClientRect(), linha: tocada.getBoundingClientRect() }
                await sairDaEscolhaPeloNome(atual, cab, pe, tocada)
                gesto.current = "escolheu"
            } else if (n === 0) {
                await sairDoValor(corpo, cab, pe)
                gesto.current = "voltou"
            } else if (passo > 0) {
                await recolherPasso(corpo)
                gesto.current = "seguiu"
            }
            setTrocando(false)
        }
        setMudou(true)
        setPasso(n)
    }

    /** O passo `n` com a IA `esc`: o atual, e os fantasmas que dão à caixa a altura do maior. */
    function passoDe(n: number, esc: (typeof IAS)[Ia] | null) {
        let titulo = "Escolha sua IA"
        let conteudo: ReactNode = (
            <PecaDoPasso>
                <RadioGroup
                    variant="card"
                    aria-label="Sua IA"
                    value={ia ?? ""}
                    onValueChange={(v) => {
                        if (!trocando) setIa(v as Ia)
                    }}
                >
                    {(Object.keys(IAS) as Ia[]).map((chave) => (
                        // A linha da viagem: o `RadioGroupItem` não repassa atributo ao cartão.
                        <div key={chave} data-linha={chave}>
                            <RadioGroupItem
                                value={chave}
                                icon={<Capa marca={IAS[chave].marca} tamanho="media" />}
                                description={IAS[chave].linha}
                            >
                                <span data-nome>{IAS[chave].nome}</span>
                            </RadioGroupItem>
                        </div>
                    ))}
                </RadioGroup>
            </PecaDoPasso>
        )
        let texto: ReactNode = null

        if (esc && n === 1) {
            titulo = esc.copiar.titulo
            texto = esc.copiar.texto
            conteudo = (
                <PecaDoPasso>
                    <CampoDeCopiar rotulo={esc.copiar.rotulo} valor={esc.copiar.valor(url)} />
                </PecaDoPasso>
            )
        } else if (esc && n === 2) {
            titulo = esc.colar.titulo
            conteudo = (
                <PecaDoPasso className="flex flex-col gap-2">
                    <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-muted-foreground">
                        {esc.colar.itens.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ol>
                    {esc.menus ? (
                        <Muted className="text-xs">Os nomes dos menus podem mudar um pouco conforme a versão do app.</Muted>
                    ) : null}
                </PecaDoPasso>
            )
        } else if (esc && n === 3) {
            titulo = "Autorize no Finance"
            texto = "A IA abre uma página do Finance pedindo acesso. Confira o nome dela e toque em Permitir."
            conteudo = (
                <PecaDoPasso>
                    <ul className="flex flex-col gap-1.5">
                        {GARANTIAS.map((g) => (
                            <li key={g} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                                {g}
                            </li>
                        ))}
                    </ul>
                </PecaDoPasso>
            )
        } else if (esc && n === 4) {
            titulo = "Faça a primeira pergunta"
            texto = "Abra uma conversa nova e pergunte:"
            conteudo = (
                <>
                    <PecaDoPasso>
                        <CampoDeCopiar rotulo="Pergunta de exemplo" valor="Faça um raio-x do meu mês e me dê 3 dicas para economizar." />
                    </PecaDoPasso>
                    <PecaDoPasso>
                        <Muted>Pronto: ela aparece aqui em IAs conectadas, e você desconecta quando quiser.</Muted>
                    </PecaDoPasso>
                </>
            )
        }

        // Do passo 2 em diante, a capa da IA escolhida; no de autorizar, o Finance ligado a ela.
        const visual =
            esc && n > 0 ? (
                <Visual>
                    {n === 3 ? (
                        <>
                            <Capa marca="finance" tamanho="media" />
                            <LinkIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                        </>
                    ) : null}
                    <Capa marca={esc.marca} tamanho="media" />
                </Visual>
            ) : null

        return {
            titulo,
            corpo: (
                <>
                    {visual}
                    <PecaDoPasso>
                        <P className="font-semibold">
                            {n + 1} · {titulo}
                            <span className="sr-only"> de {TOTAL}</span>
                        </P>
                        {texto ? <Muted>{texto}</Muted> : null}
                    </PecaDoPasso>
                    {conteudo}
                </>
            ),
        }
    }

    const { titulo, corpo } = passoDe(passo, escolhida)
    // Todo passo de toda IA: a altura não muda ao escolher a IA nem ao trocar de passo.
    const fantasmas = [
        passoDe(0, null).corpo,
        ...Array.from({ length: TOTAL - 1 }, (_, i) =>
            Object.values(IAS).map((outra) => passoDe(i + 1, outra).corpo)
        ).flat(),
    ]

    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader key={passo === 0 ? "cabecalho-escolha" : "cabecalho-guia"} ref={cabecalhoRef}>
                    <DialogTitle>
                        {passo === 0 || !escolhida ? (
                            "Conectar minha IA"
                        ) : (
                            <>
                                <span data-prefixo>Conectar o </span>
                                <span data-nome>{escolhida.nome}</span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>Leva uns 2 minutos. No fim, ela já responde sobre o seu dinheiro.</DialogDescription>
                </DialogHeader>
                <DialogBody ref={corpoRef}>
                    <span aria-live="polite" className="sr-only">
                        Passo {passo + 1} de {TOTAL}: {titulo}
                    </span>
                    <CaixaDoPasso chave={String(passo)} entrar={!reduzido && mudou} fantasmas={fantasmas}>
                        {/* Só o passo atual leva `data-passo`: ele recolhe e brota; os fantasmas, não. */}
                        <div ref={atualRef} data-passo className="flex flex-col gap-4">
                            {corpo}
                        </div>
                    </CaixaDoPasso>
                </DialogBody>
                <PontosDoPasso total={TOTAL} atual={passo} />
                <DialogFooter key={passo === 0 ? "rodape-escolha" : "rodape-guia"} ref={rodapeRef}>
                    {passo > 0 ? (
                        <FormCancel disabled={trocando} onClick={() => void irPara(passo - 1)}>
                            Voltar
                        </FormCancel>
                    ) : null}
                    <Button
                        type="button"
                        variant="primary"
                        // Sem IA escolhida, os passos seguintes não têm caminho.
                        disabled={!escolhida || trocando}
                        onClick={ultimo ? () => onOpenChange(false) : () => void irPara(passo + 1)}
                    >
                        {ultimo ? "Concluir" : "Próximo"}
                    </Button>
                </DialogFooter>
                {/* O ‹ é o espelho do ✕, como no Importar: no telefone o Voltar do rodapé (`FormCancel`) some, e ele sobe ao canto. */}
                {celular && passo > 0 ? (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label="Voltar"
                        disabled={trocando}
                        className="absolute top-2.5 left-2.5 z-20"
                        onClick={() => void irPara(passo - 1)}
                    >
                        <ChevronLeftIcon />
                    </Button>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
