"use client"

import { useState, type MouseEvent, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import {
    ChevronLeftIcon,
    CursorArrowRippleIcon,
    DevicePhoneMobileIcon,
    HandRaisedIcon,
    LockClosedIcon,
    MicrophoneIcon,
    Squares2X2Icon,
} from "@heroicons/react/16/solid"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import {
    alvoDaTroca,
    type Gatilho,
    mensagemDoErroDeToken,
    type Modo,
    MODOS_DO_ATALHO,
    modoDoGatilho,
} from "@/components/account/gatilhos-do-atalho"
import { OrbeDaSiri } from "@/components/account/orbe-da-siri"
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormControl, FormError, FormField, FormSubmit } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Muted, P } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
import { useIsMobile } from "@/hooks/use-mobile"
import { menuPanelTintClassName } from "@/lib/glass-classes"
import { supabase, type CaptureToken } from "@/lib/supabase"
import { cn } from "@/lib/utils"
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
 * Atalhos não o reconhece. Lá o botão entrega ao Safari o caminho do `href` do link (o arquivo
 * do modo, ou o do outro) por `x-safari-https://` (iOS 17+), que baixa o `.shortcut`. Se o Safari não abrir (iOS antigo), o download segue no próprio app.
 */
function baixarPeloSafari(evento: MouseEvent<HTMLAnchorElement>) {
    const { protocol, host } = window.location
    // O caminho é o do próprio link: o arquivo do modo escolhido, ou o do outro.
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
    { titulo: "Como você vai usar?" },
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

/** Como ligar cada gatilho: a frase da Siri (voz) ou o caminho em Ajustes de cada aba do toque, e a tela dele. */
const COMO_ABRIR: Record<Gatilho, { texto: string; tela: Tela }> = {
    siri: {
        texto: 'Diga "E aí Siri, Lançar gasto". Ela pergunta e responde falando.',
        tela: { imagem: siri, ancora: "topo" },
    },
    acao: {
        texto: "Ajustes › Botão de Ação › deslize até Atalho › Escolher um Atalho › Lançar gasto rápido.",
        tela: { imagem: botaoDeAcao, ponto: { x: 50, y: 71.9 }, ancora: "baixo" },
    },
    toque: {
        texto: "Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto rápido.",
        tela: { imagem: acessibilidade, ponto: { x: 30, y: 41.1 }, ancora: "topo" },
    },
    bloqueio: {
        texto: "Toque e segure a Tela Bloqueada › Personalizar › toque no + de baixo › Executar Atalho › Lançar gasto rápido.",
        tela: { imagem: telaBloqueada, ponto: { x: 16.7, y: 52.7 }, ancora: "baixo" },
    },
    inicio: {
        texto: "No app Atalhos, toque e segure Lançar gasto rápido › Compartilhar › Adicionar à Tela de Início.",
        tela: { imagem: telaDeInicio, ponto: { x: 32, y: 67 }, ancora: "baixo" },
    },
}

/**
 * Onde o mesmo "Lançar gasto rápido" pode morar: os ícones da legenda do passo 1 (com `nome`)
 * e as abas do último passo. Rótulos curtos nas abas: as quatro cabem em 343px; o nome inteiro está no texto da aba.
 */
const LUGARES: { valor: Exclude<Gatilho, "siri">; rotulo: string; nome: string; aria?: string; icone: typeof MicrophoneIcon }[] = [
    { valor: "acao", rotulo: "Botão", nome: "Botão de Ação", icone: DevicePhoneMobileIcon },
    { valor: "toque", rotulo: "Costas", nome: "Costas", aria: "Toque nas costas", icone: HandRaisedIcon },
    { valor: "bloqueio", rotulo: "Bloqueio", nome: "Bloqueio", icone: LockClosedIcon },
    { valor: "inicio", rotulo: "Ícone", nome: "Ícone", icone: Squares2X2Icon },
]

/**
 * O guia para adicionar um atalho: escolhe voz ou toque e a carteira, cria o código do atalho, baixa o atalho daquele modo
 * assinado, ensina a colar o código nele e a abrir o atalho. O código vive só no estado deste guia: fechar por qualquer caminho
 * o descarta. Há um atalho de cada modo: criar o de um modo que já existe (ou o de `substituir`, o Baixar de novo) cria o novo
 * e só então desconecta o antigo, cujo código não pode ser mostrado de novo (só o hash é guardado).
 */
export function GuiaDoAtalho({
    open,
    onOpenChange,
    aoCriar,
    substituir,
    atalhos = [],
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    aoCriar: () => void
    /** O atalho cujo código este guia troca: modo e carteira vêm dele, e ele é desconectado depois que o novo existe. */
    substituir?: CaptureToken
    /** Os atalhos ativos: o do modo escolhido é trocado pelo novo. */
    atalhos?: CaptureToken[]
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
    const [modo, setModo] = useState<Modo>("voz")
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
            // Baixar de novo abre com o modo do atalho marcado; um atalho novo começa no toque.
            setModo(modoDoGatilho(substituir?.atalho_gatilho ?? null))
            setLugar(LUGARES.find((l) => l.valor === substituir?.atalho_gatilho)?.valor ?? "acao")
            setMudou(false)
            setCarteira(substituir?.workspace_id ?? "")
            setErro(null)
        }
    }

    const carteiraEscolhida = carteira || currentWorkspaceId || workspaces[0]?.id || ""
    const nomeDaCarteira = workspaces.find((w) => w.id === carteiraEscolhida)?.name ?? "sua carteira"
    const ultimo = passo === PASSOS.length - 1
    const atual = MODOS_DO_ATALHO.find((m) => m.valor === modo)!
    const trocado = alvoDaTroca(modo, substituir, atalhos)

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
        // Voltar ao passo 2 com o código criado só segue: criar de novo faria outro atalho.
        // Trocar o modo depois disso muda só o arquivo do passo 3; o código é o mesmo.
        if (codigo) return irPara(2)
        if (!carteiraEscolhida) return setErro("Escolha a carteira dos gastos.")
        setCriando(true)
        setErro(null)
        let resposta
        let erroDaTroca: { code?: string; message?: string } | null = null
        try {
            resposta = await supabase.rpc("create_capture_token", {
                p_workspace_id: carteiraEscolhida,
                p_name: atual.nome,
                p_gatilho: modo === "voz" ? "siri" : "toque",
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
        irPara(2)
        aoCriar()
        // Sem permissão ou sem área de transferência, o código segue à vista para copiar.
        // No Safari a cópia depois da espera costuma ser recusada: o texto só promete o que houve.
        if ("clipboard" in navigator)
            navigator.clipboard.writeText(data).then(() => setCopiado(true)).catch(() => {})
    }

    /** Os textos dos passos; o do último sai de `alvo`, para cada fantasma medir a própria combinação. */
    const textos = (alvo: Gatilho): ReactNode[] => [
        <>
            {MODOS_DO_ATALHO.find((m) => m.valor === modoDoGatilho(alvo))!.descricao} Instala{" "}
            <strong>{MODOS_DO_ATALHO.find((m) => m.valor === modoDoGatilho(alvo))!.nome}</strong>.
        </>,
        <>
            O atalho se chama <strong>{atual.nome}</strong>.
        </>,
        noAppDoIphone ? (
            <>
                O atalho é o <strong>{atual.nome}</strong>. Toque em <strong>Baixar o atalho</strong>: o Safari abre. Lá,
                toque em <strong>Baixar</strong>.
            </>
        ) : (
            <>
                O atalho é o <strong>{atual.nome}</strong>. Toque em <strong>Baixar o atalho</strong> e depois em{" "}
                <strong>Baixar</strong>.
            </>
        ),
        <>
            Toque em ⬇︎ na barra do Safari, ou abra o app <strong>Arquivos</strong>, e toque em{" "}
            <strong>{atual.nome}</strong>.
        </>,
        `O app Atalhos abre com o ${atual.nome}.`,
        <>
            {copiado
                ? "Toque no campo e cole: o código já está copiado."
                : "Copie o código abaixo, toque no campo e cole."}{" "}
            Depois, <strong>Adicionar Atalho</strong>.
        </>,
        <>
            {/* A Siri também segue o Lançamento inteligente (frase ou formulário), só que por voz; a linha só vale para o toque. */}
            {alvo === "siri"
                ? `${COMO_ABRIR.siri.texto} `
                : "O atalho pergunta a frase ou um formulário, conforme o Lançamento inteligente, em Você › Neste celular. "}
            O gasto cai em {nomeDaCarteira}.
        </>,
    ]

    /**
     * O passo `i`; no último, `alvo` é a Siri (voz) ou a aba do toque. `fantasma` é a cópia
     * que só dá altura à caixa: o campo dele nasce desligado, e nada nele envia.
     */
    function passoDe(i: number, alvo: Gatilho, fantasma = false) {
        const outro = MODOS_DO_ATALHO.find((m) => m.valor !== modoDoGatilho(alvo))!
        const texto = textos(alvo)[i]
        const ondeFica = LUGARES.find((l) => l.valor === alvo)
        return (
            <>
                <PecaDoPasso>
                    <P className="font-semibold">
                        {i + 1} · {PASSOS[i].titulo}
                        <span className="sr-only"> de {PASSOS.length}</span>
                    </P>
                    {/* No passo 1 a frase vem embaixo do seletor. */}
                    {i === 0 ? null : <Muted>{texto}</Muted>}
                </PecaDoPasso>

                {/*
                 * O passo 1 é o palco: o celular grande mostra o que o modo faz, a legenda de vidro
                 * sobe sobre a base dele (a Siri, ou o lugar do toque com os quatro ícones), e o
                 * seletor vem embaixo. A legenda tem altura fixa: nada pula entre Voz e Toque.
                 */}
                {i === 0 ? (
                    <>
                        <PecaDoPasso className="mt-2">
                            <JanelaDoAparelho tamanho="palco" tela={COMO_ABRIR[alvo].tela} />
                        </PecaDoPasso>
                        <PecaDoPasso
                            className={cn(
                                menuPanelTintClassName,
                                "relative -mt-20 flex h-14 items-center gap-3 rounded-surface px-3 ring-1 ring-foreground/10"
                            )}
                        >
                            {ondeFica ? (
                                <>
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-row bg-foreground text-background">
                                        <ondeFica.icone aria-hidden className="size-4" />
                                    </span>
                                    <P className="min-w-0 flex-1 truncate font-semibold">{ondeFica.nome}</P>
                                    <ToggleGroup
                                        type="single"
                                        variant="floating"
                                        size="icon-sm"
                                        aria-label="Onde fica o atalho"
                                        value={alvo}
                                        disabled={fantasma}
                                        onValueChange={(v) => v && setLugar(v as Exclude<Gatilho, "siri">)}
                                        className="shrink-0"
                                    >
                                        {LUGARES.map((l) => (
                                            // Só ícone: o `floating` dá 44 de altura no dedo, e o `pointer-coarse:w-11`, 44 de largura; no cursor, o quadrado de 28.
                                            <ToggleGroupItem key={l.valor} value={l.valor} aria-label={l.aria ?? l.nome} icon={l.icone} className="px-0 pointer-coarse:w-11" />
                                        ))}
                                    </ToggleGroup>
                                </>
                            ) : (
                                <>
                                    <OrbeDaSiri className="size-8 shrink-0" />
                                    <P className="min-w-0 flex-1 truncate font-semibold">“E aí Siri, Lançar gasto”</P>
                                </>
                            )}
                        </PecaDoPasso>
                        <PecaDoPasso>
                            <ToggleGroup
                                type="single"
                                variant="segmented"
                                stretch
                                aria-label="Como você vai usar o atalho"
                                value={modoDoGatilho(alvo)}
                                disabled={fantasma}
                                onValueChange={(v) => {
                                    if (!v) return
                                    setModo(v as Modo)
                                }}
                            >
                                {MODOS_DO_ATALHO.map((o) => (
                                    <ToggleGroupItem
                                        key={o.valor}
                                        value={o.valor}
                                        icon={o.valor === "voz" ? MicrophoneIcon : CursorArrowRippleIcon}
                                    >
                                        {o.rotulo}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </PecaDoPasso>
                        <PecaDoPasso>
                            <Muted className="text-center">{texto}</Muted>
                        </PecaDoPasso>
                    </>
                ) : null}
                {i === 2 ? (
                    <PecaDoPasso className="flex flex-col">
                        <Button asChild variant="primary">
                            <a href={atual.arquivo} download onClick={noAppDoIphone ? baixarPeloSafari : undefined}>
                                Baixar o atalho
                            </a>
                        </Button>
                    </PecaDoPasso>
                ) : null}
                {i === 5 ? (
                    <PecaDoPasso>
                        <CampoDeCopiar rotulo="Código do atalho" valor={codigo ?? ""} />
                    </PecaDoPasso>
                ) : null}

                {i === PASSOS.length - 1 && alvo === "siri" ? (
                    <PecaDoPasso>
                        <JanelaDoAparelho tela={COMO_ABRIR.siri.tela} />
                    </PecaDoPasso>
                ) : null}
                {i === PASSOS.length - 1 && alvo !== "siri" ? (
                    <PecaDoPasso>
                        <Tabs value={alvo} onValueChange={(v) => setLugar(v as Exclude<Gatilho, "siri">)}>
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
                {i === PASSOS.length - 1 ? (
                    // O "outro" sai do `alvo`, não do `modo`: o fantasma não muda com a escolha do passo 1.
                    <PecaDoPasso className="flex flex-col items-start">
                        <Muted>Quer o outro também? O mesmo código serve.</Muted>
                        <Button asChild variant="link">
                            <a href={outro.arquivo} download onClick={noAppDoIphone ? baixarPeloSafari : undefined}>
                                Baixar {outro.nome}
                            </a>
                        </Button>
                    </PecaDoPasso>
                ) : null}

                {PASSOS[i].tela ? (
                    <PecaDoPasso>
                        <JanelaDoAparelho tela={PASSOS[i].tela} />
                    </PecaDoPasso>
                ) : null}

                {i === 1 ? (
                    <PecaDoPasso className="flex flex-col gap-4">
                        {trocado && codigo == null ? (
                            <Muted>
                                {trocado.atalho_gatilho == null ? "Substitui o atalho antigo." : `Substitui o seu atalho de ${modo} atual.`}
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

    // Todo passo, o primeiro em Voz e em Toque, e o último na voz e em cada aba do toque: a caixa tem a altura do maior.
    const fantasmas = [
        passoDe(0, "siri", true),
        ...PASSOS.slice(0, -1).map((_, i) => passoDe(i, lugar, true)),
        ...(["siri", ...LUGARES.map((l) => l.valor)] as Gatilho[]).map((a) => passoDe(PASSOS.length - 1, a, true)),
    ]

    return (
        <Dialog surface="auto" pending={criando} open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar atalho</DialogTitle>
                    <DialogDescription>Lance gastos pela Siri, pelo Botão de Ação ou com um toque, sem abrir o app.</DialogDescription>
                </DialogHeader>
                <CustomForm
                    onSubmit={(e) => {
                        e.preventDefault()
                        // O passo 1 avança, o 2 cria o código; nos outros o Enter num campo de copiar não faz nada.
                        if (passo === 0) return irPara(1)
                        if (passo === 1) return criar()
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
                            {passoDe(passo, modo === "voz" ? "siri" : lugar)}
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
                                <FormSubmit>{`Continuar com ${atual.rotulo}`}</FormSubmit>
                            </>
                        ) : passo === 1 ? (
                            <>
                                <FormCancel onClick={() => irPara(passo - 1)}>Voltar</FormCancel>
                                <FormSubmit>{codigo ? "Próximo" : "Criar código"}</FormSubmit>
                            </>
                        ) : (
                            <>
                                <FormCancel onClick={() => irPara(passo - 1)}>Voltar</FormCancel>
                                <Button
                                    type="button"
                                    variant={passo === 2 ? "secondary" : "primary"}
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
