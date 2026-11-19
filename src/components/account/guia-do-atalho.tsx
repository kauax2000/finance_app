"use client"

import { useState, type MouseEvent, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { mensagemDoErroDeToken, NOME_INVALIDO } from "@/components/account/atalho-secao"
import { arquivoDoAtalho, GATILHOS, type Gatilho } from "@/components/account/gatilhos-do-atalho"
import { nomeLivre } from "@/components/account/nome-livre"
import {
    CaixaDoPasso,
    JanelaDoAparelho,
    PecaDoPasso,
    PontosDoPasso,
    type Tela,
    usePreCarregarTelas,
} from "@/components/account/passo-a-passo"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Muted, P } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { useDisplayMode, useIsIos } from "@/hooks/use-display-mode"
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
 * salva "Lançar gasto.shortcut.html", mesmo com o servidor mandando nome e tipo certos, e o
 * Atalhos não o reconhece. Lá o botão entrega ao Safari o caminho do `href` do link (o arquivo
 * do gatilho escolhido) por `x-safari-https://` (iOS 17+), que baixa o `.shortcut`. Se o Safari não abrir (iOS antigo), o download segue no próprio app.
 */
function baixarPeloSafari(evento: MouseEvent<HTMLAnchorElement>) {
    const { protocol, host } = window.location
    // O caminho é o do próprio link: o arquivo do gatilho escolhido (`arquivoDoAtalho`).
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
    { titulo: "Como você vai abrir?" },
    { titulo: "Dê um nome a este iPhone" },
    { titulo: "Baixe o atalho", tela: { imagem: baixar, ponto: { x: 82.2, y: 50.3 }, ancora: "baixo" } },
    { titulo: "Abra o arquivo", tela: { imagem: arquivos, ponto: { x: 50, y: 29.7 }, ancora: "topo" } },
    {
        titulo: "Toque em Configurar Atalho",
        tela: { imagem: configurar, ponto: { x: 50, y: 92.4 }, ancora: "baixo" },
    },
    { titulo: "Cole o código", tela: { imagem: colar, ponto: { x: 50, y: 29.8 }, ancora: "topo" } },
    { titulo: "Ligue o gatilho" },
]

/** Como ligar cada gatilho: o caminho em Ajustes (ou a frase da Siri) e a tela dele. */
const COMO_ABRIR: Record<Gatilho, { texto: string; tela: Tela }> = {
    siri: {
        texto: 'Diga "E aí Siri, Lançar gasto". Ela pergunta e responde falando.',
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
 * O guia para conectar o iPhone: escolhe o gatilho, cria o código do aparelho, baixa o atalho daquele gatilho
 * assinado, ensina a colar o código nele e a abrir o atalho. O código vive só no estado deste guia: fechar por qualquer caminho
 * o descarta. Com `substituir`, o guia troca o código daquele aparelho: o antigo não pode ser mostrado de novo (só o hash é
 * guardado), então cria um novo com o mesmo nome e carteira e só então desconecta o antigo.
 */
export function GuiaDoAtalho({
    open,
    onOpenChange,
    aoCriar,
    substituir,
    nomesEmUso = [],
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    aoCriar: () => void
    /** O aparelho cujo código este guia troca: nome e carteira vêm dele, e ele é desconectado depois que o novo existe. */
    substituir?: CaptureToken
    /** Os nomes dos aparelhos já conectados: a sugestão de um aparelho novo não repete nenhum. */
    nomesEmUso?: string[]
}) {
    const { profile, user } = useAuth()
    const { workspaces, currentWorkspaceId } = useWorkspace()
    const reduzido = useReducedMotion()
    const [passo, setPasso] = useState(0)
    // O primeiro passo ao abrir não entra pelo lado: só a troca de passo anda.
    const [mudou, setMudou] = useState(false)
    const [nome, setNome] = useState("")
    const [carteira, setCarteira] = useState("")
    const [erro, setErro] = useState<string | null>(null)
    const [codigo, setCodigo] = useState<string | null>(null)
    const [copiado, setCopiado] = useState(false)
    const [gatilho, setGatilho] = useState<Gatilho>("siri")
    const [criando, setCriando] = useState(false)
    const { isStandalone } = useDisplayMode()
    const noAppDoIphone = useIsIos() && isStandalone
    usePreCarregarTelas(open, [...PASSOS.map((p) => p.tela), ...Object.values(COMO_ABRIR).map((c) => c.tela)])

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        setCodigo(null)
        setCopiado(false)
        if (open) {
            setPasso(0)
            // Baixar de novo abre com o gatilho do aparelho marcado.
            setGatilho(substituir?.atalho_gatilho ?? "siri")
            setMudou(false)
            const primeiro = (profile?.full_name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0]
            setNome(substituir?.name ?? nomeLivre(primeiro ? `iPhone de ${primeiro}` : "iPhone", nomesEmUso))
            setCarteira(substituir?.workspace_id ?? "")
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
        // Voltar ao passo 2 com o código criado só segue: criar de novo faria outro aparelho.
        // Trocar o gatilho depois disso muda só o arquivo do passo 3; o código é o mesmo.
        if (codigo) return irPara(2)
        const n = nome.trim()
        if (n.length < 1 || n.length > 60) return setErro(NOME_INVALIDO)
        if (!carteiraEscolhida) return setErro("Escolha a carteira dos gastos.")
        setCriando(true)
        setErro(null)
        let resposta
        let erroDaTroca: { code?: string; message?: string } | null = null
        try {
            resposta = await supabase.rpc("create_capture_token", { p_workspace_id: carteiraEscolhida, p_name: n })
            // Só com o código novo criado o antigo sai; se a desconexão falhar, o novo funciona do mesmo jeito.
            if (!resposta.error && substituir) {
                try {
                    erroDaTroca = (await supabase.rpc("revoke_capture_token", { p_id: substituir.id })).error
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

    const textos = (gatilhoDoPasso: Gatilho): ReactNode[] => [
        "O atalho que você baixa já vem pronto para o jeito escolhido.",
        "O nome ajuda a reconhecer o aparelho na lista.",
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
            {COMO_ABRIR[gatilhoDoPasso].texto}{" "}
            {/* A Siri só fala: a frase ou o formulário é dos outros gatilhos. */}
            {gatilhoDoPasso === "siri"
                ? null
                : "O atalho pergunta a frase ou um formulário, conforme o Lançamento inteligente, em Você › Neste celular. "}
            O gasto cai em {nomeDaCarteira}.
        </>,
    ]

    /**
     * O passo `i`, com o gatilho `gatilhoDoPasso` no último. `fantasma` é a cópia
     * que só dá altura à caixa: o campo dele nasce desligado, e nada nele envia.
     */
    function passoDe(i: number, gatilhoDoPasso: Gatilho, fantasma = false) {
        return (
            <>
                <PecaDoPasso>
                    <P className="font-semibold">
                        {i + 1} · {PASSOS[i].titulo}
                        <span className="sr-only"> de {PASSOS.length}</span>
                    </P>
                    <Muted>{textos(gatilhoDoPasso)[i]}</Muted>
                </PecaDoPasso>

                {/* A ação do passo vem antes da imagem: no telefone ela fica à vista sem rolar. */}
                {i === 0 ? (
                    <PecaDoPasso>
                        <RadioGroup
                            aria-label="Como você vai abrir o atalho"
                            variant="card"
                            value={gatilho}
                            disabled={fantasma}
                            onValueChange={(v) => setGatilho(v as Gatilho)}
                        >
                            {GATILHOS.map((o) => (
                                <RadioGroupItem key={o.valor} value={o.valor} description={o.descricao}>
                                    {o.rotulo}
                                </RadioGroupItem>
                            ))}
                        </RadioGroup>
                    </PecaDoPasso>
                ) : null}
                {i === 2 ? (
                    <PecaDoPasso className="flex flex-col">
                        <Button asChild variant="primary">
                            <a href={arquivoDoAtalho(gatilho)} download onClick={noAppDoIphone ? baixarPeloSafari : undefined}>
                                Baixar o atalho
                            </a>
                        </Button>
                    </PecaDoPasso>
                ) : null}
                {i === 5 ? (
                    <PecaDoPasso>
                        <CampoDeCopiar rotulo="Código do aparelho" valor={codigo ?? ""} />
                    </PecaDoPasso>
                ) : null}

                {i === PASSOS.length - 1 ? (
                    <PecaDoPasso>
                        <JanelaDoAparelho key={gatilhoDoPasso} tela={COMO_ABRIR[gatilhoDoPasso].tela} />
                    </PecaDoPasso>
                ) : null}

                {PASSOS[i].tela ? (
                    <PecaDoPasso>
                        <JanelaDoAparelho tela={PASSOS[i].tela} />
                    </PecaDoPasso>
                ) : null}

                {i === 1 ? (
                    <PecaDoPasso className="flex flex-col gap-4">
                        <FormInput
                            label="Nome do aparelho"
                            value={nome}
                            maxLength={60}
                            disabled={fantasma || codigo != null}
                            onChange={(e) => setNome(e.target.value)}
                        />
                        {substituir ? (
                            <Muted>O código antigo para de funcionar quando você criar este.</Muted>
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
                                                {w.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>
                        ) : null}
                    </PecaDoPasso>
                ) : null}
            </>
        )
    }

    // Todo passo, e o último em cada gatilho: a caixa tem a altura do maior.
    const fantasmas = [
        ...PASSOS.slice(0, -1).map((_, i) => passoDe(i, gatilho, true)),
        ...GATILHOS.map((o) => passoDe(PASSOS.length - 1, o.valor, true)),
    ]

    return (
        <Dialog surface="auto" pending={criando} open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Conectar o iPhone</DialogTitle>
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
                            {passoDe(passo, gatilho)}
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
                                <FormSubmit>Próximo</FormSubmit>
                            </>
                        ) : passo === 1 ? (
                            <>
                                <Button type="button" variant="tertiary" onClick={() => irPara(0)}>
                                    Voltar
                                </Button>
                                <FormSubmit>{codigo ? "Próximo" : "Criar código"}</FormSubmit>
                            </>
                        ) : (
                            <>
                                <Button type="button" variant="tertiary" onClick={() => irPara(passo - 1)}>
                                    Voltar
                                </Button>
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
            </DialogContent>
        </Dialog>
    )
}
