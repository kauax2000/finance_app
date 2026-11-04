"use client"

import { useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { ShieldCheckIcon } from "@heroicons/react/16/solid"
import { LinkIcon } from "@heroicons/react/20/solid"
import { urlDoMcp } from "@/components/account/ias-secao"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { Capa, GARANTIAS, type Marca } from "@/components/account/marcas-de-ia"
import { CaixaDoPasso, PecaDoPasso, PontosDoPasso } from "@/components/account/passo-a-passo"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Muted, P } from "@/components/ui/typography"

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

    function irPara(n: number) {
        setMudou(true)
        setPasso(n)
    }

    let titulo = "Escolha sua IA"
    let conteudo: ReactNode = (
        <PecaDoPasso>
            <RadioGroup
                variant="card"
                aria-label="Sua IA"
                value={ia ?? ""}
                onValueChange={(v) => setIa(v as Ia)}
            >
                {(Object.keys(IAS) as Ia[]).map((chave) => (
                    <RadioGroupItem
                        key={chave}
                        value={chave}
                        icon={<Capa marca={IAS[chave].marca} tamanho="media" />}
                        description={IAS[chave].linha}
                    >
                        {IAS[chave].nome}
                    </RadioGroupItem>
                ))}
            </RadioGroup>
        </PecaDoPasso>
    )
    let texto: ReactNode = null

    if (escolhida && passo === 1) {
        titulo = escolhida.copiar.titulo
        texto = escolhida.copiar.texto
        conteudo = (
            <PecaDoPasso>
                <CampoDeCopiar rotulo={escolhida.copiar.rotulo} valor={escolhida.copiar.valor(url)} />
            </PecaDoPasso>
        )
    } else if (escolhida && passo === 2) {
        titulo = escolhida.colar.titulo
        conteudo = (
            <PecaDoPasso className="flex flex-col gap-2">
                <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-muted-foreground">
                    {escolhida.colar.itens.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ol>
                {escolhida.menus ? (
                    <Muted className="text-xs">Os nomes dos menus podem mudar um pouco conforme a versão do app.</Muted>
                ) : null}
            </PecaDoPasso>
        )
    } else if (escolhida && passo === 3) {
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
    } else if (escolhida && passo === 4) {
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
        escolhida && passo > 0 ? (
            <Visual>
                {passo === 3 ? (
                    <>
                        <Capa marca="finance" tamanho="media" />
                        <LinkIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                    </>
                ) : null}
                <Capa marca={escolhida.marca} tamanho="media" />
            </Visual>
        ) : null

    return (
        <Dialog surface="auto" open={open} onOpenChange={onOpenChange}>
            {/* Passo a passo: `fixed` dá à gaveta do telefone a altura alta de saída, e ela
                não muda de tamanho a cada passo (a troca animada truncava). No desktop o
                diálogo continua medindo o conteúdo. */}
            <DialogContent layout="fixed">
                <DialogHeader>
                    <DialogTitle>Conectar minha IA</DialogTitle>
                    <DialogDescription>Leva uns 2 minutos. No fim, ela já responde sobre o seu dinheiro.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <span aria-live="polite" className="sr-only">
                        Passo {passo + 1} de {TOTAL}: {titulo}
                    </span>
                    <CaixaDoPasso chave={String(passo)} entrar={!reduzido && mudou}>
                        {visual}
                        <PecaDoPasso>
                            <P className="font-semibold">
                                {passo + 1} · {titulo}
                                <span className="sr-only"> de {TOTAL}</span>
                            </P>
                            {texto ? <Muted>{texto}</Muted> : null}
                        </PecaDoPasso>
                        {conteudo}
                    </CaixaDoPasso>
                </DialogBody>
                <PontosDoPasso total={TOTAL} atual={passo} />
                <DialogFooter>
                    {passo > 0 ? (
                        <Button type="button" variant="tertiary" onClick={() => irPara(passo - 1)}>
                            Voltar
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        variant="primary"
                        // Sem IA escolhida, os passos seguintes não têm caminho.
                        disabled={!escolhida}
                        onClick={ultimo ? () => onOpenChange(false) : () => irPara(passo + 1)}
                    >
                        {ultimo ? "Concluir" : "Próximo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
