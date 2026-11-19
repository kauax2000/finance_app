"use client"

import { useState, type MouseEvent, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import {
    ChevronLeftIcon,
    MicrophoneIcon,
} from "@heroicons/react/16/solid"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import {
    ARQUIVO_DO_ATALHO,
    type Gatilho,
    mensagemDoErroDeToken,
    NOME_DO_ATALHO,
} from "@/components/account/gatilhos-do-atalho"
import {
    CaixaDoPasso,
    JanelaDoAparelho,
    PecaDoPasso,
    PontosDoPasso,
    type Tela,
    usePreCarregarTelas,
} from "@/components/account/passo-a-passo"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormControl, FormError, FormField, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Muted, P } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import { useIsMobile } from "@/hooks/use-mobile"
import { supabase, type CaptureToken } from "@/lib/supabase"
import baixar from "./assets/atalho-1-baixar.webp"
import arquivos from "./assets/atalho-2-arquivos.webp"
import configurar from "./assets/atalho-3-configurar.webp"
import colar from "./assets/atalho-4-colar.webp"
import siri from "./assets/atalho-5-siri.webp"
import botaoDeAcao from "./assets/atalho-11-botao-de-acao.webp"
import acessibilidade from "./assets/atalho-12-acessibilidade.webp"
import telaDeInicio from "./assets/atalho-13-tela-de-inicio.webp"
import telaBloqueada from "./assets/atalho-14-tela-bloqueada.webp"

/**
 * No app instalado do iPhone o download não passa pelo Safari: abre num visualizador que
 * salva "<nome>.shortcut.html", mesmo com o servidor mandando nome e tipo certos, e o
 * Atalhos não o reconhece. Lá o botão entrega ao Safari o caminho do `href` do link
 * por `x-safari-https://` (iOS 17+), que baixa o `.shortcut`. Se o Safari não abrir (iOS antigo), o download segue no próprio app.
 */
function baixarPeloSafari(evento: MouseEvent<HTMLAnchorElement>) {
    const { protocol, host } = window.location
    const caminho = evento.currentTarget.getAttribute("href")
    if (protocol !== "https:" || !caminho) return
    evento.preventDefault()
    window.location.href = `x-safari-https://${host}${caminho}`
    window.setTimeout(() => {
        if (document.visibilityState === "visible") window.location.assign(caminho)
    }, 1500)
}

/*
 * Capturas do iOS 27 na moldura do PSD de `docs/design/mockups/` (`scripts/atalho/moldura.py`).
 * O passo 6 é montado sobre a tela de início real (`scripts/atalho/cenas.py`): o simulador
 * não tem Siri nem Apple Pay. shortcut: montagens, não capturas; trocar pelo print do iPhone quando houver.
 */
const PASSOS: { titulo: string; tela?: Tela }[] = [
    { titulo: "Escolha a carteira" },
    { titulo: "Baixe o atalho", tela: { imagem: baixar, ponto: { x: 82.2, y: 50.3 }, ancora: "baixo" } },
    { titulo: "Abra o arquivo", tela: { imagem: arquivos, ponto: { x: 50, y: 29.7 }, ancora: "topo" } },
    {
        titulo: "Toque em Configurar Atalho",
        tela: { imagem: configurar, ponto: { x: 50, y: 92.4 }, ancora: "baixo" },
    },
    { titulo: "Cole o código", tela: { imagem: colar, ponto: { x: 50, y: 29.8 }, ancora: "topo" } },
    { titulo: "Ligue o gatilho" },
]

/** Como abrir o atalho: a frase da Siri, ou o caminho em Ajustes de cada aba do toque, e a tela dele. */
const COMO_ABRIR: Record<Gatilho, { texto: string; tela: Tela }> = {
    siri: {
        texto: 'Diga "E aí Siri, Lançar gasto". Ela pergunta o gasto.',
        tela: { imagem: siri, ancora: "topo" },
    },
    acao: {
        texto: "Ajustes › Botão de Ação › deslize até Atalho › Escolher um Atalho › Lançar gasto.",
        tela: { imagem: botaoDeAcao, ponto: { x: 50, y: 71.9 }, ancora: "baixo" },
    },
    toque: {
        texto: "Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto.",
        tela: { imagem: acessibilidade, ponto: { x: 30, y: 41.1 }, ancora: "topo" },
    },
    bloqueio: {
        texto: "Toque e segure a Tela Bloqueada › Personalizar › toque no + de baixo › Executar Atalho › Lançar gasto.",
        tela: { imagem: telaBloqueada, ponto: { x: 16.7, y: 52.7 }, ancora: "baixo" },
    },
    inicio: {
        texto: "No app Atalhos, toque e segure Lançar gasto › Compartilhar › Adicionar à Tela de Início.",
        tela: { imagem: telaDeInicio, ponto: { x: 32, y: 67 }, ancora: "baixo" },
    },
}

/**
 * Onde o mesmo "Lançar gasto" pode morar num toque: as abas do último passo, abaixo da Siri.
 * Rótulos curtos: as quatro cabem em 343px; o caminho inteiro está no texto da aba.
 */
const LUGARES: { valor: Exclude<Gatilho, "siri">; rotulo: string }[] = [
    { valor: "acao", rotulo: "Botão" },
    { valor: "toque", rotulo: "Costas" },
    { valor: "bloqueio", rotulo: "Bloqueio" },
    { valor: "inicio", rotulo: "Ícone" },
]

/**
 * O guia para adicionar um atalho: escolhe a carteira, cria o código do atalho, baixa o "Lançar gasto" assinado (um arquivo
 * só, para a Siri e para o toque), ensina a colar o código nele e a abrir o atalho. O código vive só no estado deste guia:
 * fechar por qualquer caminho o descarta. O de `substituir` (Baixar de novo) é desconectado só depois que o novo existe,
 * porque o código dele não pode ser mostrado de novo (só o hash é guardado).
 */
export function GuiaDoAtalho({
    open,
    onOpenChange,
    aoCriar,
    substituir,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    aoCriar: () => void
    /** O atalho cujo código este guia troca: a carteira vem dele, e ele é desconectado depois que o novo existe. */
    substituir?: CaptureToken
}) {
    const { workspaces, currentWorkspaceId } = useWorkspace()
    const reduzido = useReducedMotion()
    const [passo, setPasso] = useState(0)
    // O primeiro passo ao abrir não entra pelo lado: só a troca de passo anda.
    const [mudou, setMudou] = useState(false)
    const [carteira, setCarteira] = useState("")
    const [erro, setErro] = useState<string | null>(null)
    const [codigo, setCodigo] = useState<string | null>(null)
    const [copiado, setCopiado] = useState(false)
    const [lugar, setLugar] = useState<Exclude<Gatilho, "siri">>("acao")
    const [criando, setCriando] = useState(false)
    const { isStandalone } = useDisplayMode()
    const noAppDoIphone = useIsIos() && isStandalone
    const celular = useIsMobile()
    usePreCarregarTelas(open, [...PASSOS.map((p) => p.tela), ...Object.values(COMO_ABRIR).map((c) => c.tela)])

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        setCodigo(null)
        setCopiado(false)
        if (open) {
            setPasso(0)
            setLugar(LUGARES.find((l) => l.valor === substituir?.atalho_gatilho)?.valor ?? "acao")
            setMudou(false)
            setCarteira(substituir?.workspace_id ?? "")
            setErro(null)
        }
    }

    const carteiraEscolhida = carteira || currentWorkspaceId || workspaces[0]?.id || ""
    const nomeDaCarteira = workspaces.find((w) => w.id === carteiraEscolhida)?.name ?? "sua carteira"
    const ultimo = passo === PASSOS.length - 1
    const trocado = substituir

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
        // Voltar ao passo da carteira com o código criado só segue: criar de novo faria outro atalho.
        if (codigo) return irPara(1)
        if (!carteiraEscolhida) return setErro("Escolha a carteira dos gastos.")
        setCriando(true)
        setErro(null)
        let resposta
        let erroDaTroca: { code?: string; message?: string } | null = null
        try {
            resposta = await supabase.rpc("create_capture_token", {
                p_workspace_id: carteiraEscolhida,
                p_name: NOME_DO_ATALHO,
            })
            // Só com o código novo criado o antigo sai; se a desconexão falhar, o novo funciona do mesmo jeito.
            if (!resposta.error && trocado) {
                try {
                    erroDaTroca = (await supabase.rpc("revoke_capture_token", { p_id: trocado.id })).error
                } catch {
                    erroDaTroca = {}
                }
            }
        } finally {
            // Um erro lançado não deixa o diálogo travado em `pending`.
            setCriando(false)
        }
        const { data, error } = resposta
        if (error) return setErro(mensagemDoErroDeToken(error))
        setCodigo(data)
        // A carteira do código fica fixa: o último passo nomeia a que foi usada.
        setCarteira(carteiraEscolhida)
        if (erroDaTroca) setErro(`O código antigo continua valendo. ${mensagemDoErroDeToken(erroDaTroca)}`)
        irPara(1)
        aoCriar()
        // Sem permissão ou sem área de transferência, o código segue à vista para copiar.
        // No Safari a cópia depois da espera costuma ser recusada: o texto só promete o que houve.
        if ("clipboard" in navigator)
            navigator.clipboard.writeText(data).then(() => setCopiado(true)).catch(() => {})
    }

    /** Os textos dos passos; o do último sai de `alvo`, a aba do toque, para cada fantasma medir a própria aba. */
    const textos: ReactNode[] = [
        <>
            O atalho se chama <strong>{NOME_DO_ATALHO}</strong>, e serve para a Siri e para um toque.
        </>,
        noAppDoIphone ? (
            <>
                Toque em <strong>Baixar o atalho</strong>: o Safari abre. Lá, toque em <strong>Baixar</strong>.
            </>
        ) : (
            <>
                Toque em <strong>Baixar o atalho</strong> e depois em <strong>Baixar</strong>.
            </>
        ),
        <>
            Toque em ⬇︎ na barra do Safari, ou abra o app <strong>Arquivos</strong>, e toque em{" "}
            <strong>{NOME_DO_ATALHO}</strong>.
        </>,
        `O app Atalhos abre com o ${NOME_DO_ATALHO}.`,
        <>
            {copiado
                ? "Toque no campo e cole: o código já está copiado."
                : "Copie o código abaixo, toque no campo e cole."}{" "}
            Depois, <strong>Adicionar Atalho</strong>.
        </>,
        <>
            {COMO_ABRIR.siri.texto} Ou ponha o atalho num toque, num destes lugares. O gasto cai em {nomeDaCarteira}.
        </>,
    ]

    /**
     * O passo `i`; no último, `alvo` é a aba do toque. `fantasma` é a cópia
     * que só dá altura à caixa: o campo dele nasce desligado, e nada nele envia.
     */
    function passoDe(i: number, alvo: Exclude<Gatilho, "siri">, fantasma = false) {
        const texto = textos[i]
        return (
            <>
                <PecaDoPasso>
                    <P className="font-semibold">
                        {i + 1} · {PASSOS[i].titulo}
                        <span className="sr-only"> de {PASSOS.length}</span>
                    </P>
                    <Muted>{texto}</Muted>
                </PecaDoPasso>

                {i === 1 ? (
                    <PecaDoPasso className="flex flex-col">
                        <Button asChild variant="primary">
                            <a href={ARQUIVO_DO_ATALHO} download onClick={noAppDoIphone ? baixarPeloSafari : undefined}>
                                Baixar o atalho
                            </a>
                        </Button>
                    </PecaDoPasso>
                ) : null}
                {i === 4 ? (
                    <PecaDoPasso>
                        <CampoDeCopiar rotulo="Código do atalho" valor={codigo ?? ""} />
                    </PecaDoPasso>
                ) : null}

                {i === PASSOS.length - 1 ? (
                    <PecaDoPasso className="flex h-14 items-center gap-3">
                        {/* O ícone da voz: o microfone em cor num círculo neutro (o logo da Siri é da Apple). */}
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-info">
                            <MicrophoneIcon aria-hidden className="size-4" />
                        </span>
                        <P className="min-w-0 flex-1 truncate font-semibold">“E aí Siri, Lançar gasto”</P>
                    </PecaDoPasso>
                ) : null}
                {i === PASSOS.length - 1 ? (
                    <PecaDoPasso>
                        {/* A aba guarda a própria escolha: trocar de aba redesenha só as abas, e não o guia com os fantasmas (a troca demorava). */}
                        <Tabs defaultValue={alvo}>
                            <TabsList aria-label="Onde pôr o atalho">
                                {LUGARES.map((l) => (
                                    <TabsTrigger key={l.valor} value={l.valor} disabled={fantasma}>
                                        {l.rotulo}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {LUGARES.map((l) => (
                                <TabsContent key={l.valor} value={l.valor} className="flex flex-col gap-4">
                                    <Muted>{COMO_ABRIR[l.valor].texto}</Muted>
                                    <JanelaDoAparelho tela={COMO_ABRIR[l.valor].tela} />
                                </TabsContent>
                            ))}
                        </Tabs>
                    </PecaDoPasso>
                ) : null}

                {PASSOS[i].tela ? (
                    <PecaDoPasso>
                        <JanelaDoAparelho tela={PASSOS[i].tela} />
                    </PecaDoPasso>
                ) : null}

                {i === 0 ? (
                    <PecaDoPasso className="flex flex-col gap-4">
                        {trocado && codigo == null ? (
                            <Muted>
                                {trocado.atalho_gatilho == null ? "Substitui o atalho antigo." : "Substitui o seu atalho atual."}
                            </Muted>
                        ) : null}
                        {workspaces.length > 1 ? (
                            <FormField label="Os gastos caem em">
                                <Select
                                    value={carteiraEscolhida}
                                    onValueChange={setCarteira}
                                    disabled={fantasma || codigo != null}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a carteira" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {workspaces.map((w) => (
                                            <SelectItem key={w.id} value={w.id}>
                                                <WorkspaceBrandMark iconKey={w.icon} backgroundColor={w.icon_background_color} size="xs" />
                                                <span className="truncate">{w.name}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        ) : (
                            <Muted>Os gastos caem em {nomeDaCarteira}.</Muted>
                        )}
                    </PecaDoPasso>
                ) : null}
            </>
        )
    }

    // Todo passo, e o último em cada aba do toque: a caixa tem a altura do maior.
    const fantasmas = [
        ...PASSOS.slice(0, -1).map((_, i) => passoDe(i, lugar, true)),
        ...LUGARES.map((l) => passoDe(PASSOS.length - 1, l.valor, true)),
    ]

    return (
        <Dialog surface="auto" pending={criando} open={open} onOpenChange={handleOpenChange}>
            {/* Sem descrição: o passo diz o que fazer (pedido do dono, 19/11/2026). */}
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Adicionar atalho</DialogTitle>
                </DialogHeader>
                <CustomForm
                    onSubmit={(e) => {
                        e.preventDefault()
                        // O passo 1 cria o código; nos outros o Enter num campo de copiar não faz nada.
                        if (passo === 0) return criar()
                    }}
                    className="flex min-h-0 min-w-0 flex-1 flex-col"
                >
                    <DialogBody>
                        <span aria-live="polite" className="sr-only">
                            Passo {passo + 1} de {PASSOS.length}: {PASSOS[passo].titulo}
                        </span>
                        <CaixaDoPasso
                            chave={PASSOS[passo].titulo}
                            entrar={!reduzido && mudou}
                            fantasmas={fantasmas}
                        >
                            {passoDe(passo, lugar)}
                            {erro ? (
                                <PecaDoPasso>
                                    <FormError>{erro}</FormError>
                                </PecaDoPasso>
                            ) : null}
                        </CaixaDoPasso>
                    </DialogBody>
                    {/* Os pontos têm lugar fixo, logo acima dos botões: não andam com o passo. */}
                    <PontosDoPasso total={PASSOS.length} atual={passo} />
                    <DialogFooter>
                        {passo === 0 ? (
                            <>
                                <FormCancel onClick={fechar}>Cancelar</FormCancel>
                                <FormSubmit>{codigo ? "Próximo" : "Criar código"}</FormSubmit>
                            </>
                        ) : (
                            <>
                                <FormCancel onClick={() => irPara(passo - 1)}>Voltar</FormCancel>
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
                {/* O ‹ é o espelho do ✕, como no Importar: no telefone o Voltar do rodapé (`FormCancel`) some, e ele sobe ao canto. */}
                {celular && passo > 0 ? (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="icon-md"
                        aria-label="Voltar"
                        disabled={criando}
                        className="absolute top-2.5 left-2.5 z-20"
                        onClick={() => irPara(passo - 1)}
                    >
                        <ChevronLeftIcon />
                    </Button>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
