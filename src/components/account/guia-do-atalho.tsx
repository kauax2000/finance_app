"use client"

import { useState, type ReactNode } from "react"
import Image, { type StaticImageData } from "next/image"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { mensagemDoErroDeToken, NOME_INVALIDO } from "@/components/account/atalho-secao"
import { useAuth } from "@/components/providers"
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
import { CustomForm, FormCancel, FormControl, FormError, FormField, FormInput, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Muted, P } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { useAlturaAnimada } from "@/hooks/use-altura-animada"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import baixar from "./assets/atalho-1-baixar.webp"
import arquivos from "./assets/atalho-2-arquivos.webp"
import configurar from "./assets/atalho-3-configurar.webp"
import colar from "./assets/atalho-4-colar.webp"
import siri from "./assets/atalho-5-siri.webp"
import applePay from "./assets/atalho-6-apple-pay.webp"

/** O atalho assinado por `scripts/atalho/gerar-atalho.py`, servido de `public/atalho/`. */
const ARQUIVO_DO_ATALHO = "/atalho/Lan%C3%A7ar%20gasto.shortcut"

/** Uma peça do passo: surge do desfoque, como as linhas dos diálogos (`menu-content-in`, 500ms, `--ease-out`). */
const PECA: Variants = {
    oculto: { opacity: 0, filter: "blur(10px)" },
    visivel: {
        opacity: [0, 1, 1],
        filter: ["blur(10px)", "blur(4px)", "blur(0px)"],
        transition: { duration: 0.5, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] },
    },
}

type Tela = {
    imagem: StaticImageData
    /** Onde tocar, em % da imagem inteira; sem ele, a tela só mostra o que acontece. */
    ponto?: { x: number; y: number }
    /** Que ponta da imagem fica à vista na janela. */
    ancora: "topo" | "baixo"
}

/*
 * Capturas do iOS 27 na moldura do PSD de `docs/design/mockups/` (`scripts/atalho/moldura.py`).
 * Os passos 6 e 7 são montados sobre a tela de início real (`scripts/atalho/cenas.py`): o simulador
 * não tem Siri nem Apple Pay. shortcut: montagens, não capturas; trocar pelo print do iPhone quando houver.
 */
/** A notificação depois do Apple Pay: a tela do passo 7 e a do vazio da seção. */
export const TELA_DA_NOTIFICACAO: Tela = { imagem: applePay, ancora: "topo" }

const PASSOS: { titulo: string; tela?: Tela }[] = [
    { titulo: "Dê um nome a este iPhone" },
    { titulo: "Baixe o atalho", tela: { imagem: baixar, ponto: { x: 82.2, y: 50.3 }, ancora: "baixo" } },
    { titulo: "Abra o arquivo", tela: { imagem: arquivos, ponto: { x: 50, y: 29.7 }, ancora: "topo" } },
    {
        titulo: "Toque em Configurar Atalho",
        tela: { imagem: configurar, ponto: { x: 50, y: 92.4 }, ancora: "baixo" },
    },
    { titulo: "Cole o código", tela: { imagem: colar, ponto: { x: 50, y: 29.8 }, ancora: "topo" } },
    { titulo: "Fale com a Siri", tela: { imagem: siri, ancora: "topo" } },
    { titulo: "Lance ao pagar (opcional)", tela: TELA_DA_NOTIFICACAO },
]

/** A janela do passo: o aparelho parado na ponta dele, e o alvo no lugar do toque. */
export function JanelaDoAparelho({ tela, compacta = false }: { tela: Tela; compacta?: boolean }) {
    return (
        <div
            aria-hidden
            className={cn(
                "relative mx-auto shrink-0 overflow-hidden",
                // Compacta: só o topo do aparelho, para o vazio da seção.
                compacta ? "h-36 w-48" : "h-72 w-60",
                // O aparelho dissolve no lado em que a janela o corta.
                tela.ancora === "topo"
                    ? "[mask-image:linear-gradient(to_top,transparent,#000_4rem)]"
                    : "[mask-image:linear-gradient(to_bottom,transparent,#000_4rem)]"
            )}
        >
            {/* A janela mede 288 e o aparelho inteiro, 496: ancorado embaixo, ele sobe 208. */}
            <div
                className={cn(
                    "absolute inset-x-0 aspect-[720/1488]",
                    tela.ancora === "topo" ? "top-0" : "-top-52"
                )}
            >
                <Image
                    src={tela.imagem}
                    alt=""
                    sizes={compacta ? "192px" : "240px"}
                    placeholder="blur"
                    className={cn("absolute inset-0 h-auto max-w-none", compacta ? "w-48" : "w-60")}
                />
                {tela.ponto ? (
                    <span
                        style={{ left: `${tela.ponto.x}%`, top: `${tela.ponto.y}%` }}
                        className="absolute size-8 -translate-x-1/2 -translate-y-1/2"
                    >
                        <span className="absolute inset-0 rounded-full bg-scrim-foreground/30 motion-safe:animate-ping" />
                        <span className="absolute inset-0 rounded-full ring-2 ring-scrim-foreground" />
                    </span>
                ) : null}
            </div>
        </div>
    )
}

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
    // O primeiro passo ao abrir não entra pelo lado: só a troca de passo anda.
    const [mudou, setMudou] = useState(false)
    const alturaAnimada = useAlturaAnimada<HTMLDivElement>()
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
            setMudou(false)
            const primeiro = (profile?.full_name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0]
            setNome(primeiro ? `iPhone de ${primeiro}` : "iPhone")
            setCarteira("")
            setErro(null)
        }
    }

    const carteiraEscolhida = carteira || currentWorkspaceId || workspaces[0]?.id || ""
    const nomeDaCarteira = workspaces.find((w) => w.id === carteiraEscolhida)?.name ?? "sua carteira"
    const ultimo = passo === PASSOS.length - 1

    function irPara(n: number) {
        setMudou(true)
        setPasso(n)
    }

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
        if (codigo) return irPara(1)
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
        irPara(1)
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
            Diga <strong>E aí Siri, lançar gasto</strong> e responda o gasto, ou toque no atalho (ou no Botão de
            Ação) e <strong>digite</strong> na caixa que abre no topo: <strong>42 mercado nubank</strong>. Ele cai em{" "}
            {nomeDaCarteira}; o que ficar em dúvida vai para A conferir.
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
                    <DialogBody>
                        <span aria-live="polite" className="sr-only">
                            Passo {passo + 1} de {PASSOS.length}: {PASSOS[passo].titulo}
                        </span>
                        {/* Cada passo tem a altura dele, e a caixa anda de uma altura à outra numa
                            mola só: o passo entra no lugar, e os pontos e os botões vão junto com a
                            borda. `data-altura-em-voo` diz ao diálogo que a altura já anda aqui. */}
                        <div ref={alturaAnimada} data-altura-em-voo="">
                            {PASSOS.map((p, i) => {
                                if (i !== passo) return null
                                return (
                                    <motion.div
                                        key={p.titulo}
                                        // As peças do passo chegam uma a uma, do desfoque e no lugar (o
                                        // `menu-content-in` dos diálogos): nada anda de lado, e a única
                                        // coisa que se move é a altura da caixa.
                                        initial={reduzido || !mudou ? false : "oculto"}
                                        animate="visivel"
                                        transition={{ staggerChildren: 0.03, delayChildren: 0.04 }}
                                        className="flex flex-col gap-4"
                                    >
                                        <motion.div variants={PECA}>
                                            <P className="font-semibold">
                                                {i + 1} · {p.titulo}
                                                <span className="sr-only"> de {PASSOS.length}</span>
                                            </P>
                                            <Muted>{textos[i]}</Muted>
                                        </motion.div>

                                        {/* A ação do passo vem antes da imagem: no telefone ela fica à vista sem rolar. */}
                                        {i === 1 ? (
                                            <motion.div variants={PECA} className="flex flex-col">
                                                <Button asChild variant="primary">
                                                    <a href={ARQUIVO_DO_ATALHO} download>
                                                        Baixar o atalho
                                                    </a>
                                                </Button>
                                            </motion.div>
                                        ) : null}
                                        {i === 4 ? (
                                            <motion.div variants={PECA}>
                                                <CampoDeCopiar rotulo="Código do aparelho" valor={codigo ?? ""} />
                                            </motion.div>
                                        ) : null}

                                        {p.tela ? (
                                            <motion.div variants={PECA}>
                                                <JanelaDoAparelho tela={p.tela} />
                                            </motion.div>
                                        ) : null}

                                        {i === 0 ? (
                                            <motion.div variants={PECA} className="flex flex-col gap-4">
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
                                            </motion.div>
                                        ) : null}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </DialogBody>
                    {/* Os pontos têm lugar fixo, logo acima dos botões: não andam com o passo. */}
                    <div aria-hidden className="flex shrink-0 justify-center gap-1.5 pt-4">
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
                    <DialogFooter>
                        {passo === 0 ? (
                            <>
                                <FormCancel onClick={fechar}>Cancelar</FormCancel>
                                <FormSubmit>{codigo ? "Próximo" : "Criar código"}</FormSubmit>
                            </>
                        ) : (
                            <>
                                <Button type="button" variant="tertiary" onClick={() => irPara(passo - 1)}>
                                    Voltar
                                </Button>
                                <Button
                                    type="button"
                                    variant={passo === 1 ? "secondary" : "primary"}
                                    onClick={ultimo ? fechar : () => irPara(passo + 1)}
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
