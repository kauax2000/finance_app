"use client"

import { useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { BoltIcon, ChevronRightIcon, CreditCardIcon, MicrophoneIcon } from "@heroicons/react/16/solid"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { mensagemDoErroDeToken, NOME_INVALIDO } from "@/components/account/atalho-secao"
import { useAuth } from "@/components/providers"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleRow } from "@/components/ui/collapsible"
import { DeviceFrame } from "@/components/ui/device-frame"
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
import { currencyBRL } from "@/lib/formatters"
import { MOLA, SAIDA } from "@/lib/spring"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

/** O link do atalho pronto no iCloud; sem ele, o passo 2 ensina a montar à mão. */
export const ATALHO_PRONTO: string | undefined = process.env.NEXT_PUBLIC_CAPTURE_SHORTCUT_URL || undefined

/** O endereço da captura no projeto Supabase, com ou sem barra no fim. */
export function enderecoDeCaptura(): string {
    return `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "")}/functions/v1/capture`
}

/** A janela mede 288 e o aparelho (`h-130`), 520: ancorado embaixo, ele sobe 232. */
const SUBIDA_DO_APARELHO = -232

const TITULOS = [
    "Dê um nome a este iPhone",
    "Adicione o atalho",
    "Fale com a Siri",
    "Lance ao pagar (opcional)",
] as const

/** Que ponta do aparelho fica à vista na janela, por passo. */
const ANCORA: ("topo" | "baixo")[] = ["topo", "baixo", "topo", "topo"]

/** O alvo do toque: o anel que pulsa sobre o que a pessoa toca. */
function Toque({ className }: { className?: string }) {
    return (
        <span className={cn("pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-1/2", className)}>
            <span className="absolute inset-0 rounded-full bg-foreground/15 motion-safe:animate-ping" />
            <span className="absolute inset-0 rounded-full ring-2 ring-foreground/60" />
        </span>
    )
}

/** As mini telas, uma por passo, desenhadas com tokens. */
function TelaDoPasso({ passo, nome }: { passo: number; nome: string }) {
    if (passo === 0)
        return (
            <div className="flex flex-col gap-3 px-4 pt-6">
                <p className="text-sm font-semibold">Conectar o iPhone</p>
                <div className="rounded-row bg-muted px-3 py-2 text-xs">
                    <p className="text-muted-foreground">Nome do aparelho</p>
                    <p className="truncate font-medium">{nome || "iPhone"}</p>
                </div>
                <div className="relative mt-2 flex h-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    Criar código
                    <Toque className="top-1/2 left-1/2" />
                </div>
            </div>
        )
    if (passo === 1)
        return (
            <div className="flex h-full flex-col items-center justify-end gap-4 px-4 pb-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-surface bg-info-muted text-info-muted-foreground">
                    <BoltIcon className="size-4" />
                </span>
                <div>
                    <p className="text-sm font-semibold">Lançar gasto</p>
                    <p className="text-xs text-muted-foreground">Atalho do Finance</p>
                </div>
                <div className="relative flex h-8 w-full items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    Adicionar atalho
                    <Toque className="top-1/2 left-1/2" />
                </div>
            </div>
        )
    if (passo === 2)
        return (
            <div className="flex h-full flex-col justify-end gap-2 px-4 pb-10">
                <p className="self-end rounded-surface bg-muted px-3 py-2 text-xs">E aí Siri, lançar gasto</p>
                <p className="self-end rounded-surface bg-muted px-3 py-2 text-xs">42 mercado nubank</p>
                <span className="mt-2 flex size-10 items-center justify-center self-center rounded-full bg-foreground/10">
                    <MicrophoneIcon className="size-4" />
                </span>
            </div>
        )
    return (
        <div className="flex flex-col gap-3 px-4 pt-6">
            <p className="text-sm font-semibold">Automação</p>
            <div className="flex flex-col rounded-row bg-muted text-xs">
                {["Hora do dia", "Alarme", "Carteira", "Mensagem"].map((linha) => (
                    <div key={linha} className="relative flex items-center gap-2 px-3 py-2">
                        {linha === "Carteira" ? <CreditCardIcon className="size-3.5" /> : null}
                        <span className="flex-1">{linha}</span>
                        <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                        {linha === "Carteira" ? <Toque className="top-1/2 left-1/3" /> : null}
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * O guia para conectar o iPhone: cria o código do aparelho, ensina a adicionar o
 * atalho, a falar com a Siri e a automação do pagamento. O código vive só no
 * estado deste guia: fechar por qualquer caminho o descarta.
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
    const [criando, setCriando] = useState(false)

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        setCodigo(null)
        if (open) {
            setPasso(0)
            const primeiro = (profile?.full_name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0]
            setNome(primeiro ? `iPhone de ${primeiro}` : "iPhone")
            setCarteira("")
            setErro(null)
        }
    }

    const carteiraEscolhida = carteira || currentWorkspaceId || ""
    const nomeDaCarteira = workspaces.find((w) => w.id === carteiraEscolhida)?.name ?? "sua carteira"
    const ultimo = passo === TITULOS.length - 1
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
        const { data, error } = await supabase.rpc("create_capture_token", {
            p_workspace_id: carteiraEscolhida,
            p_name: n,
        })
        setCriando(false)
        if (error) return setErro(mensagemDoErroDeToken(error))
        setCodigo(data)
        setPasso(1)
        aoCriar()
        // Sem permissão ou sem área de transferência, o código segue à vista para copiar.
        if ("clipboard" in navigator) navigator.clipboard.writeText(data).catch(() => {})
    }

    const textos: ReactNode[] = [
        "O nome ajuda a reconhecer o aparelho na lista.",
        <>
            Toque no botão, depois em <strong>Adicionar atalho</strong>. Quando ele pedir o código, cole: já está
            copiado.
        </>,
        <>
            Diga <strong>E aí Siri, lançar gasto</strong> e depois o gasto: <strong>42 mercado nubank</strong>. Ele
            cai em {nomeDaCarteira}; o que ficar em dúvida vai para A conferir.
        </>,
        <>
            No app Atalhos: <strong>Automação › + › Carteira</strong>, escolha seus cartões, marque{" "}
            <strong>Executar imediatamente</strong> e escolha <strong>Lançar gasto</strong>. Cada compra com o iPhone
            entra sozinha.
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
                        <div
                            aria-hidden
                            className={cn(
                                "relative mx-auto h-72 w-60 shrink-0 overflow-hidden",
                                // O aparelho dissolve no lado em que a janela o corta.
                                ANCORA[passo] === "topo"
                                    ? "[mask-image:linear-gradient(to_top,transparent,#000_4rem)]"
                                    : "[mask-image:linear-gradient(to_bottom,transparent,#000_4rem)]"
                            )}
                        >
                            <motion.div
                                initial={false}
                                animate={{ y: ANCORA[passo] === "topo" ? 0 : SUBIDA_DO_APARELHO }}
                                transition={movimento}
                                className="absolute inset-x-0 top-0"
                            >
                                <DeviceFrame
                                    form="phone"
                                    className="h-130"
                                    notification={
                                        passo === 2 ? (
                                            <div className="text-xs">
                                                <p className="font-semibold">Gasto lançado</p>
                                                <p className="nums text-muted-foreground">
                                                    {currencyBRL(42)} · Mercado
                                                </p>
                                            </div>
                                        ) : undefined
                                    }
                                >
                                    {TITULOS.map((t, i) => (
                                        <div
                                            key={t}
                                            className={cn(
                                                "absolute inset-0 transition-opacity duration-(--duration-slow) ease-(--ease-out)",
                                                i === passo ? "opacity-100" : "opacity-0"
                                            )}
                                        >
                                            <TelaDoPasso passo={i} nome={nome} />
                                        </div>
                                    ))}
                                </DeviceFrame>
                            </motion.div>
                        </div>
                        <div aria-hidden className="flex shrink-0 justify-center gap-1.5">
                            {TITULOS.map((t, i) => (
                                <span
                                    key={t}
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
                                        {passo + 1} · {TITULOS[passo]}
                                    </P>
                                    <Muted>{textos[passo]}</Muted>
                                </motion.div>
                            </AnimatePresence>
                        </div>

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

                        {passo === 1 ? (
                            <>
                                <CampoDeCopiar rotulo="Código do aparelho" valor={codigo ?? ""} />
                                {ATALHO_PRONTO ? (
                                    <Button asChild variant="primary">
                                        <a href={ATALHO_PRONTO} target="_blank" rel="noreferrer">
                                            Abrir o atalho
                                        </a>
                                    </Button>
                                ) : (
                                    <Alert tone="warning">
                                        <AlertDescription>O atalho pronto ainda não está disponível.</AlertDescription>
                                    </Alert>
                                )}
                                <Collapsible variant="card" defaultOpen={!ATALHO_PRONTO}>
                                    <CollapsibleRow>Montar à mão</CollapsibleRow>
                                    <CollapsibleContent>
                                        <div className="flex flex-col gap-3">
                                            <Muted>
                                                No app Atalhos, crie um atalho que envie o que você disser para este
                                                endereço, junto com o código do aparelho.
                                            </Muted>
                                            <CampoDeCopiar rotulo="Endereço" valor={enderecoDeCaptura()} />
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </>
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
                                    variant={passo === 1 && ATALHO_PRONTO ? "secondary" : "primary"}
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
