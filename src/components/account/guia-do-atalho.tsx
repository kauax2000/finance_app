"use client"

import { useState, type ReactNode } from "react"
import Image, { type StaticImageData } from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { mensagemDoErroDeToken, NOME_INVALIDO } from "@/components/account/atalho-secao"
import { useAuth } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleRow } from "@/components/ui/collapsible"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormControl, FormError, FormField, FormInput, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Muted, P } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { MOLA, SAIDA } from "@/lib/spring"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import baixar from "./assets/atalho-1-baixar.webp"
import arquivos from "./assets/atalho-2-arquivos.webp"
import configurar from "./assets/atalho-3-configurar.webp"
import colar from "./assets/atalho-4-colar.webp"

/** O atalho assinado por `scripts/atalho/gerar-atalho.py`, servido de `public/atalho/`. */
const ARQUIVO_DO_ATALHO = "/atalho/Lan%C3%A7ar%20gasto.shortcut"

/** O endereço da captura no projeto Supabase, com ou sem barra no fim. */
export function enderecoDeCaptura(): string {
    return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "")}/functions/v1/capture`
}

/** A janela mede 288 e o aparelho inteiro, 496: ancorado embaixo, ele sobe 208. */
const SUBIDA_DO_APARELHO = -208

type Tela = {
    imagem: StaticImageData
    /** Onde tocar, em % da imagem inteira. */
    ponto: { x: number; y: number }
    /** Que ponta da imagem fica à vista na janela. */
    ancora: "topo" | "baixo"
}

/*
 * Capturas do iOS 27 na moldura do PSD de `docs/design/mockups/` (`scripts/atalho/moldura.py`).
 * shortcut: sem captura real da Siri; o simulador não tem Siri, entra com o print do iPhone do dono.
 * shortcut: sem captura real da automação da Carteira; entra com o print do iPhone do dono.
 */
const PASSOS: { titulo: string; tela?: Tela }[] = [
    { titulo: "Dê um nome a este iPhone" },
    { titulo: "Baixe o atalho", tela: { imagem: baixar, ponto: { x: 82.2, y: 50.3 }, ancora: "baixo" } },
    { titulo: "Abra o arquivo", tela: { imagem: arquivos, ponto: { x: 50, y: 29.7 }, ancora: "topo" } },
    {
        titulo: "Toque em Configurar Atalho",
        tela: { imagem: configurar, ponto: { x: 50, y: 92.4 }, ancora: "baixo" },
    },
    { titulo: "Cole o código", tela: { imagem: colar, ponto: { x: 50, y: 29.8 }, ancora: "topo" } },
    { titulo: "Fale com a Siri" },
    { titulo: "Lance ao pagar (opcional)" },
]

const TELAS = PASSOS.flatMap((p) => (p.tela ? [p.tela] : []))

/**
 * O guia para conectar o iPhone: cria o código do aparelho, baixa o atalho
 * assinado, ensina a colar o código nele, a falar com a Siri e a automação do
 * pagamento. O código vive só no estado deste guia: fechar por qualquer caminho
 * o descarta.
 */
export function GuiaDoAtalho({
    open,
    onOpenChange,
    aoCriar,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    aoCriar: () => void
}) {
    const { profile, user } = useAuth()
    const { workspaces, currentWorkspaceId } = useWorkspace()
    const reduzido = useReducedMotion()
    const [passo, setPasso] = useState(0)
    const [nome, setNome] = useState("")
    const [carteira, setCarteira] = useState("")
    const [erro, setErro] = useState<string | null>(null)
    const [codigo, setCodigo] = useState<string | null>(null)
    const [copiado, setCopiado] = useState(false)
    const [criando, setCriando] = useState(false)

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        setCodigo(null)
        setCopiado(false)
        if (open) {
            setPasso(0)
            const primeiro = (profile?.full_name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0]
            setNome(primeiro ? `iPhone de ${primeiro}` : "iPhone")
            setCarteira("")
            setErro(null)
        }
    }

    const carteiraEscolhida = carteira || currentWorkspaceId || workspaces[0]?.id || ""
    const nomeDaCarteira = workspaces.find((w) => w.id === carteiraEscolhida)?.name ?? "sua carteira"
    const ultimo = passo === PASSOS.length - 1
    const tela = PASSOS[passo].tela
    const movimento = reduzido ? { duration: 0 } : MOLA

    function fechar() {
        setCodigo(null)
        onOpenChange(false)
    }

    function handleOpenChange(next: boolean) {
        if (!next) setCodigo(null)
        onOpenChange(next)
    }

    async function criar() {
        // Voltar ao passo 1 com o código criado só segue: criar de novo faria outro aparelho.
        if (codigo) return setPasso(1)
        const n = nome.trim()
        if (n.length < 1 || n.length > 60) return setErro(NOME_INVALIDO)
        if (!carteiraEscolhida) return setErro("Escolha a carteira dos gastos.")
        setCriando(true)
        setErro(null)
        let resposta
        try {
            resposta = await supabase.rpc("create_capture_token", { p_workspace_id: carteiraEscolhida, p_name: n })
        } finally {
            // Um erro lançado não deixa o diálogo travado em `pending`.
            setCriando(false)
        }
        const { data, error } = resposta
        if (error) return setErro(mensagemDoErroDeToken(error))
        setCodigo(data)
        setPasso(1)
        aoCriar()
        // Sem permissão ou sem área de transferência, o código segue à vista para copiar.
        // No Safari a cópia depois da espera costuma ser recusada: o texto só promete o que houve.
        if ("clipboard" in navigator)
            navigator.clipboard.writeText(data).then(() => setCopiado(true)).catch(() => {})
    }

    const textos: ReactNode[] = [
        "O nome ajuda a reconhecer o aparelho na lista.",
        <>
            Toque em <strong>Baixar o atalho</strong> e depois em <strong>Baixar</strong>.
        </>,
        <>
            Toque em ⬇︎ na barra do Safari, ou abra o app <strong>Arquivos</strong>, e toque em{" "}
            <strong>Lançar gasto</strong>.
        </>,
        "O app Atalhos abre com o Lançar gasto.",
        <>
            {copiado
                ? "Toque no campo e cole: o código já está copiado."
                : "Copie o código abaixo, toque no campo e cole."}{" "}
            Depois, <strong>Adicionar Atalho</strong>.
        </>,
        <>
            Diga <strong>E aí Siri, lançar gasto</strong> e depois o gasto: <strong>42 mercado nubank</strong>. Ele
            cai em {nomeDaCarteira}; o que ficar em dúvida vai para A conferir.
        </>,
        <>
            No app Atalhos, abra o <strong>Lançar gasto</strong>, toque em <strong>Adicionar automação</strong>,
            escolha <strong>Carteira</strong> e seus cartões e marque <strong>Executar imediatamente</strong>.
        </>,
    ]

    return (
        <Dialog surface="auto" pending={criando} open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Conectar o iPhone</DialogTitle>
                    <DialogDescription>Lance gastos falando com a Siri, sem abrir o app.</DialogDescription>
                </DialogHeader>
                <CustomForm
                    onSubmit={(e) => {
                        e.preventDefault()
                        // Só o passo 1 envia: nos outros o Enter num campo de copiar não faz nada.
                        if (passo === 0) return criar()
                    }}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <DialogBody className="flex flex-col gap-4">
                        <div aria-hidden className="flex shrink-0 justify-center gap-1.5">
                            {PASSOS.map((p, i) => (
                                <span
                                    key={p.titulo}
                                    className={cn(
                                        "h-1.5 rounded-full transition-[width,background-color] duration-(--duration-spring) ease-(--ease-spring)",
                                        i === passo ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/40"
                                    )}
                                />
                            ))}
                        </div>
                        <div aria-live="polite" className="shrink-0">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={passo}
                                    initial={reduzido ? false : { opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={
                                        reduzido
                                            ? { opacity: 0, transition: { duration: 0 } }
                                            : { opacity: 0, y: -6, transition: SAIDA }
                                    }
                                    transition={MOLA}
                                >
                                    <P className="font-semibold">
                                        {passo + 1} · {PASSOS[passo].titulo}
                                        <span className="sr-only"> de {PASSOS.length}</span>
                                    </P>
                                    <Muted>{textos[passo]}</Muted>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* A ação do passo vem antes da imagem: no telefone ela fica à vista sem rolar. */}
                        {passo === 1 ? (
                            <Button asChild variant="primary">
                                <a href={ARQUIVO_DO_ATALHO} download>
                                    Baixar o atalho
                                </a>
                            </Button>
                        ) : null}
                        {passo === 4 ? <CampoDeCopiar rotulo="Código do aparelho" valor={codigo ?? ""} /> : null}

                        {tela ? (
                            <div
                                aria-hidden
                                className={cn(
                                    "relative mx-auto h-72 w-60 shrink-0 overflow-hidden",
                                    // O aparelho dissolve no lado em que a janela o corta.
                                    tela.ancora === "topo"
                                        ? "[mask-image:linear-gradient(to_top,transparent,#000_4rem)]"
                                        : "[mask-image:linear-gradient(to_bottom,transparent,#000_4rem)]"
                                )}
                            >
                                {/* Um aparelho só: as telas trocam no fade, ele anda quando o corte muda
                                    de lado e o alvo desliza até o próximo toque. */}
                                <motion.div
                                    initial={false}
                                    animate={{ y: tela.ancora === "topo" ? 0 : SUBIDA_DO_APARELHO }}
                                    transition={movimento}
                                    className="absolute inset-x-0 top-0 aspect-[720/1488]"
                                >
                                    {TELAS.map((t) => (
                                        <Image
                                            key={t.imagem.src}
                                            src={t.imagem}
                                            alt=""
                                            sizes="240px"
                                            placeholder="blur"
                                            className={cn(
                                                "absolute inset-0 h-auto w-60 max-w-none transition-opacity duration-(--duration-slow) ease-(--ease-out)",
                                                t === tela ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    ))}
                                    <motion.span
                                        initial={false}
                                        animate={{ left: `${tela.ponto.x}%`, top: `${tela.ponto.y}%` }}
                                        transition={movimento}
                                        className="absolute size-8 -translate-x-1/2 -translate-y-1/2"
                                    >
                                        <span className="absolute inset-0 rounded-full bg-scrim-foreground/30 motion-safe:animate-ping" />
                                        <span className="absolute inset-0 rounded-full ring-2 ring-scrim-foreground" />
                                    </motion.span>
                                </motion.div>
                            </div>
                        ) : null}

                        {passo === 0 ? (
                            <>
                                <FormInput
                                    label="Nome do aparelho"
                                    value={nome}
                                    maxLength={60}
                                    disabled={codigo != null}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                                {workspaces.length > 1 ? (
                                    <FormField label="Os gastos caem em">
                                        <Select
                                            value={carteiraEscolhida}
                                            onValueChange={setCarteira}
                                            disabled={codigo != null}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a carteira" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {workspaces.map((w) => (
                                                    <SelectItem key={w.id} value={w.id}>
                                                        {w.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormField>
                                ) : null}
                                <FormError>{erro}</FormError>
                            </>
                        ) : null}

                        {passo === 4 ? (
                            <Collapsible variant="card">
                                <CollapsibleRow>Montar à mão</CollapsibleRow>
                                <CollapsibleContent>
                                    <div className="flex flex-col gap-3">
                                        <Muted>
                                            Fora do iPhone, crie uma automação que envie o que você disser para este
                                            endereço, junto com o código do aparelho.
                                        </Muted>
                                        <CampoDeCopiar rotulo="Endereço" valor={enderecoDeCaptura()} />
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ) : null}
                    </DialogBody>
                    <DialogFooter>
                        {passo === 0 ? (
                            <>
                                <FormCancel onClick={fechar}>Cancelar</FormCancel>
                                <FormSubmit>{codigo ? "Próximo" : "Criar código"}</FormSubmit>
                            </>
                        ) : (
                            <>
                                <Button type="button" variant="tertiary" onClick={() => setPasso(passo - 1)}>
                                    Voltar
                                </Button>
                                <Button
                                    type="button"
                                    variant={passo === 1 ? "secondary" : "primary"}
                                    onClick={ultimo ? fechar : () => setPasso(passo + 1)}
                                >
                                    {ultimo ? "Pronto" : "Próximo"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </CustomForm>
            </DialogContent>
        </Dialog>
    )
}
