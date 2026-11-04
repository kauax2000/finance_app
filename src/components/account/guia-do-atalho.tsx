"use client"

import { useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { CampoDeCopiar } from "@/components/account/campo-de-copiar"
import { mensagemDoErroDeToken, NOME_INVALIDO } from "@/components/account/atalho-secao"
import {
    CaixaDoPasso,
    JanelaDoAparelho,
    PecaDoPasso,
    PontosDoPasso,
    type Tela,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Muted, P } from "@/components/ui/typography"
import { useWorkspace } from "@/components/workspace-provider"
import { supabase, type CaptureToken } from "@/lib/supabase"
import baixar from "./assets/atalho-1-baixar.webp"
import arquivos from "./assets/atalho-2-arquivos.webp"
import configurar from "./assets/atalho-3-configurar.webp"
import colar from "./assets/atalho-4-colar.webp"
import siri from "./assets/atalho-5-siri.webp"

/** O atalho assinado por `scripts/atalho/gerar-atalho.py`, servido de `public/atalho/`. */
const ARQUIVO_DO_ATALHO = "/atalho/Lan%C3%A7ar%20gasto.shortcut"

/*
 * Capturas do iOS 27 na moldura do PSD de `docs/design/mockups/` (`scripts/atalho/moldura.py`).
 * O passo 6 é montado sobre a tela de início real (`scripts/atalho/cenas.py`): o simulador
 * não tem Siri nem Apple Pay. shortcut: montagens, não capturas; trocar pelo print do iPhone quando houver.
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
    { titulo: "Como abrir o atalho" },
]

const TELA_DA_SIRI: Tela = { imagem: siri, ancora: "topo" }

/** As quatro maneiras de abrir o atalho: a escolha da pessoa, uma frase cada. */
const COMO_ABRIR = [
    { valor: "siri", rotulo: "Siri", texto: 'Diga "E aí Siri, Lançar gasto".' },
    { valor: "acao", rotulo: "Botão de Ação", texto: "Ajustes › Botão de Ação › Atalho › Lançar gasto." },
    {
        valor: "toque",
        rotulo: "Toque traseiro",
        texto: "Ajustes › Acessibilidade › Toque › Toque traseiro › Toque triplo › Lançar gasto.",
    },
    {
        valor: "inicio",
        rotulo: "Tela de início",
        texto: "No app Atalhos, toque e segure Lançar gasto › Compartilhar › Adicionar à Tela de Início.",
    },
] as const

/**
 * O guia para conectar o iPhone: cria o código do aparelho, baixa o atalho
 * assinado, ensina a colar o código nele e a falar com a Siri. O código vive só no estado deste guia: fechar por qualquer caminho
 * o descarta. Com `substituir`, o guia troca o código daquele aparelho: o antigo não pode ser mostrado de novo (só o hash é
 * guardado), então cria um novo com o mesmo nome e carteira e só então desconecta o antigo.
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
    /** O aparelho cujo código este guia troca: nome e carteira vêm dele, e ele é desconectado depois que o novo existe. */
    substituir?: CaptureToken
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
    const [como, setComo] = useState<(typeof COMO_ABRIR)[number]["valor"]>("siri")
    const [criando, setCriando] = useState(false)

    const [abertoAntes, setAbertoAntes] = useState(open)
    if (open !== abertoAntes) {
        setAbertoAntes(open)
        setCodigo(null)
        setCopiado(false)
        if (open) {
            setPasso(0)
            setComo("siri")
            setMudou(false)
            const primeiro = (profile?.full_name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0]
            setNome(substituir?.name ?? (primeiro ? `iPhone de ${primeiro}` : "iPhone"))
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
        // Voltar ao passo 1 com o código criado só segue: criar de novo faria outro aparelho.
        if (codigo) return irPara(1)
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
            {COMO_ABRIR.find((o) => o.valor === como)?.texto} O atalho pergunta a frase ou um formulário, conforme o
            Lançamento inteligente em Configurações. Ele cai em {nomeDaCarteira}.
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
                        <CaixaDoPasso chave={PASSOS[passo].titulo} entrar={!reduzido && mudou}>
                            <PecaDoPasso>
                                <P className="font-semibold">
                                    {passo + 1} · {PASSOS[passo].titulo}
                                    <span className="sr-only"> de {PASSOS.length}</span>
                                </P>
                                <Muted>{textos[passo]}</Muted>
                            </PecaDoPasso>

                            {/* A ação do passo vem antes da imagem: no telefone ela fica à vista sem rolar. */}
                            {passo === 1 ? (
                                <PecaDoPasso className="flex flex-col">
                                    <Button asChild variant="primary">
                                        <a href={ARQUIVO_DO_ATALHO} download>
                                            Baixar o atalho
                                        </a>
                                    </Button>
                                </PecaDoPasso>
                            ) : null}
                            {passo === 4 ? (
                                <PecaDoPasso>
                                    <CampoDeCopiar rotulo="Código do aparelho" valor={codigo ?? ""} />
                                </PecaDoPasso>
                            ) : null}

                            {ultimo ? (
                                <PecaDoPasso className="flex flex-col gap-4">
                                    <Tabs value={como} onValueChange={(v) => setComo(v as typeof como)}>
                                        <TabsList aria-label="Como abrir o atalho" scrollable>
                                            {COMO_ABRIR.map((o) => (
                                                <TabsTrigger key={o.valor} value={o.valor}>
                                                    {o.rotulo}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </Tabs>
                                    {como === "siri" ? <JanelaDoAparelho tela={TELA_DA_SIRI} /> : null}
                                </PecaDoPasso>
                            ) : null}

                            {PASSOS[passo].tela ? (
                                <PecaDoPasso>
                                    <JanelaDoAparelho tela={PASSOS[passo].tela} />
                                </PecaDoPasso>
                            ) : null}

                            {passo === 0 ? (
                                <PecaDoPasso className="flex flex-col gap-4">
                                    <FormInput
                                        label="Nome do aparelho"
                                        value={nome}
                                        maxLength={60}
                                        disabled={codigo != null}
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
                                </PecaDoPasso>
                            ) : null}
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
