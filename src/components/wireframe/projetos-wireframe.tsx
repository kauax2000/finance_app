"use client"

import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, type FormEvent } from "react"

import { WireframeBox } from "@/components/wireframe/wireframe-box"
import { useWorkspace } from "@/components/workspace-provider"
import { projetoDetailPath, ROUTES } from "@/config/navigation"
import { currencyBRL } from "@/lib/formatters"
import {
    AINDA_NAO_DISPONIVEL,
    criarProjeto,
    editarCarteiraProjeto,
    editarProjeto,
    lancamentosDaCarteira,
    lerProjeto,
    listarProjetos,
    type CamposDoProjeto,
    type Tolerante,
} from "@/lib/projetos/dados"
import { formatMoneyBrlInput } from "@/lib/money-brl"
import { camposDaCarteiraProjeto, orcamentoTotal } from "@/lib/projetos/modelos"
import { resumoDoProjeto, SEM_CATEGORIA, type ResumoDoProjeto } from "@/lib/projetos/resumo"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { supabase, type Project, type Workspace } from "@/lib/supabase"
import { NADA_MUDOU } from "@/lib/supabase-errors"
import { formatDatePtBr } from "@/lib/transaction-date"

const botao = "border border-muted-foreground/60 px-2 py-1 font-mono text-foreground disabled:opacity-50"
const campo = "border border-muted-foreground/60 bg-transparent px-2 py-1 font-mono text-foreground"
const link = "text-foreground underline"

const chaveDaLista = (ws: string | null) => ["projetos", ws] as const
const chaveDoProjeto = (id: string) => ["projeto", id] as const

function mensagem(e: unknown): string {
    return e instanceof Error ? e.message : "Não foi possível salvar."
}

/** Sem a tabela no banco, a escrita volta com este texto; com erro, a mensagem dele. */
async function salvar(acao: () => Promise<Tolerante<null>>): Promise<string | null> {
    try {
        return (await acao()).disponivel ? null : AINDA_NAO_DISPONIVEL
    } catch (e) {
        return mensagem(e)
    }
}

function periodo(x: { starts_on?: string | null; ends_on?: string | null }): string | null {
    const { starts_on: inicio, ends_on: fim } = x
    if (!inicio && !fim) return null
    return `${inicio ? formatDatePtBr(inicio) : "…"} a ${fim ? formatDatePtBr(fim) : "…"}`
}

/** Os nomes das categorias e das pessoas da carteira, para as quebras do resumo. */
function useNomes(workspaceId: string | null) {
    const categorias = useQuery({
        queryKey: ["projetos", "categorias", workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const { data, error } = await supabase.from("categories").select("id, name").eq("workspace_id", workspaceId as string)
            if (error) throw error
            return new Map((data ?? []).map((c) => [c.id as string, c.name as string]))
        },
    })
    const membros = useMemberDirectoryQuery(workspaceId)
    return {
        categoria: (id: string) => (id === SEM_CATEGORIA ? "Sem categoria" : (categorias.data?.get(id) ?? "Categoria")),
        pessoa: (id: string) => {
            const m = membros.data?.find((p) => p.user_id === id)
            return m?.full_name || m?.email || "Alguém"
        },
    }
}

function Quebra({ titulo, valores, nome }: { titulo: string; valores: Record<string, number>; nome: (id: string) => string }) {
    const linhas = Object.entries(valores).sort((a, b) => b[1] - a[1])
    return (
        <div>
            <p className="text-foreground">{titulo}</p>
            {linhas.length === 0 ? <p>Nada ainda.</p> : null}
            <ul>
                {linhas.map(([id, centavos]) => (
                    <li key={id}>
                        {nome(id)}: {currencyBRL(centavos / 100)}
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** O resumo (Decisão 1): gasto, falta, por categoria e por pessoa. */
function Resumo({ resumo, workspaceId }: { resumo: ResumoDoProjeto; workspaceId: string }) {
    const nomes = useNomes(workspaceId)
    const falta = resumo.faltaCentavos
    return (
        <div className="space-y-2">
            <p className="text-base text-foreground">
                Gasto: <strong>{currencyBRL(resumo.gastoCentavos / 100)}</strong>
            </p>
            <p>
                {falta == null
                    ? "Sem orçamento."
                    : falta >= 0
                      ? `Falta: ${currencyBRL(falta / 100)} do orçamento`
                      : `Passou do orçamento em ${currencyBRL(-falta / 100)}`}
            </p>
            <Quebra titulo="Por categoria" valores={resumo.porCategoria} nome={nomes.categoria} />
            <Quebra titulo="Por pessoa" valores={resumo.porPessoa} nome={nomes.pessoa} />
        </div>
    )
}

/** Nome, período e orçamento: criar e editar. Um submit só; o navegador valida. */
function FormularioDoProjeto({
    inicial,
    rotulo,
    enviar,
}: {
    inicial?: CamposDoProjeto
    rotulo: string
    enviar: (c: CamposDoProjeto) => Promise<string | null>
}) {
    const [nome, setNome] = useState(inicial?.name ?? "")
    const [inicio, setInicio] = useState(inicial?.starts_on ?? "")
    const [fim, setFim] = useState(inicial?.ends_on ?? "")
    const [orcamento, setOrcamento] = useState(inicial?.budget_total != null ? formatMoneyBrlInput(Number(inicial.budget_total)) : "")
    const [pendente, setPendente] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const total = orcamentoTotal(orcamento)
        if (!total.ok) return setErro(total.erro)
        setPendente(true)
        setErro(null)
        const falha = await enviar({
            name: nome.trim(),
            starts_on: inicio || null,
            ends_on: fim || null,
            budget_total: total.valor,
        })
        setPendente(false)
        setErro(falha)
        if (!falha && !inicial) {
            setNome("")
            setInicio("")
            setFim("")
            setOrcamento("")
        }
    }

    return (
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
            <label className="flex flex-col">
                Nome
                <input className={campo} required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
            </label>
            <label className="flex flex-col">
                Começa em (opcional)
                <input className={campo} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </label>
            <label className="flex flex-col">
                Termina em (opcional)
                <input className={campo} type="date" min={inicio || undefined} value={fim} onChange={(e) => setFim(e.target.value)} />
            </label>
            <label className="flex flex-col">
                Orçamento total em R$ (opcional)
                <input
                    className={campo}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={orcamento}
                    onChange={(e) => setOrcamento(e.target.value)}
                />
            </label>
            <div>
                <button type="submit" className={botao} disabled={pendente}>
                    {pendente ? "Salvando…" : rotulo}
                </button>
            </div>
            {erro ? <p role="alert">{erro}</p> : null}
        </form>
    )
}

function SoAdulto() {
    return (
        <WireframeBox bloco={7} titulo="Projetos">
            <p>Os projetos são de quem é dono ou membro da carteira.</p>
        </WireframeBox>
    )
}

/** `/projetos`: a lista (ativos e arquivados) e o criar. Só do adulto (Ruling 3). */
export function ProjetosWireframe() {
    const { currentWorkspaceId, papel } = useWorkspace()
    const queryClient = useQueryClient()
    const lista = useQuery({
        queryKey: chaveDaLista(currentWorkspaceId),
        enabled: Boolean(currentWorkspaceId),
        queryFn: () => listarProjetos(currentWorkspaceId as string),
    })

    if (papel === "guest") return <SoAdulto />

    const projetos = lista.data?.disponivel ? lista.data.dados : []
    const ativos = projetos.filter((p) => !p.archived_at)
    const arquivados = projetos.filter((p) => p.archived_at)

    return (
        <WireframeBox bloco={7} titulo="Projetos">
            <p>Um projeto usa o cartão e as pessoas da casa, com um período e um orçamento próprios.</p>
            {lista.isPending && currentWorkspaceId ? <p>Carregando…</p> : null}
            {lista.error ? <p role="alert">{mensagem(lista.error)}</p> : null}
            {lista.data && !lista.data.disponivel ? <p>{AINDA_NAO_DISPONIVEL}</p> : null}
            {lista.data?.disponivel ? (
                <>
                    <ListaDeProjetos titulo="Ativos" projetos={ativos} vazio="Nenhum projeto ativo." />
                    {arquivados.length ? <ListaDeProjetos titulo="Arquivados" projetos={arquivados} /> : null}
                    <p className="font-bold text-foreground">Novo projeto</p>
                    <FormularioDoProjeto
                        rotulo="Criar projeto"
                        enviar={async (c) => {
                            const falha = await salvar(() => criarProjeto(currentWorkspaceId as string, c))
                            if (!falha) await queryClient.invalidateQueries({ queryKey: chaveDaLista(currentWorkspaceId) })
                            return falha
                        }}
                    />
                </>
            ) : null}
        </WireframeBox>
    )
}

function ListaDeProjetos({ titulo, projetos, vazio }: { titulo: string; projetos: Project[]; vazio?: string }) {
    return (
        <div>
            <p className="font-bold text-foreground">{titulo}</p>
            {projetos.length === 0 && vazio ? <p>{vazio}</p> : null}
            <ul className="space-y-1">
                {projetos.map((p) => (
                    <li key={p.id}>
                        <Link href={projetoDetailPath(p.id)} className={link}>
                            {p.name}
                        </Link>
                        {periodo(p) ? ` · ${periodo(p)}` : ""}
                        {p.budget_total != null ? ` · orçamento ${currencyBRL(p.budget_total)}` : ""}
                    </li>
                ))}
            </ul>
        </div>
    )
}

/** `/projetos/[id]`: o resumo, o editar e o arquivar. */
export function ProjetoWireframe({ id }: { id: string }) {
    const { papel } = useWorkspace()
    const queryClient = useQueryClient()
    const projeto = useQuery({ queryKey: chaveDoProjeto(id), queryFn: () => lerProjeto(id) })
    const [arquivando, setArquivando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const p = projeto.data?.disponivel ? projeto.data.dados : null
    const resumo = useMemo(() => (p ? resumoDoProjeto(p.transactions ?? [], p.budget_total) : null), [p])

    if (papel === "guest") return <SoAdulto />

    async function atualizar() {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: chaveDoProjeto(id) }),
            queryClient.invalidateQueries({ queryKey: ["projetos"] }),
        ])
    }

    async function alternarArquivo(projetoAtual: Project) {
        const arquivar = !projetoAtual.archived_at
        if (arquivar && !window.confirm("Arquivar este projeto? Ele deixa de aceitar lançamento novo.")) return
        setArquivando(true)
        setErro(null)
        const falha = await salvar(() => editarProjeto(id, { archived_at: arquivar ? new Date().toISOString() : null }))
        if (!falha) await atualizar()
        setErro(falha)
        setArquivando(false)
    }

    return (
        <WireframeBox bloco={7} titulo="Projeto">
            <Link href={ROUTES.PROJETOS} className={link}>
                Voltar aos projetos
            </Link>
            {projeto.isPending ? <p>Carregando…</p> : null}
            {projeto.error ? <p role="alert">{mensagem(projeto.error)}</p> : null}
            {projeto.data && !projeto.data.disponivel ? <p>{AINDA_NAO_DISPONIVEL}</p> : null}
            {projeto.data?.disponivel && !p ? <p>Este projeto não existe mais.</p> : null}
            {p && resumo ? (
                <>
                    <h2 className="font-bold text-foreground">
                        {p.name}
                        {p.archived_at ? " (arquivado)" : ""}
                    </h2>
                    {periodo(p) ? <p>{periodo(p)}</p> : null}
                    <Resumo resumo={resumo} workspaceId={p.workspace_id} />
                    <p className="font-bold text-foreground">Editar</p>
                    <FormularioDoProjeto
                        key={p.updated_at}
                        inicial={p}
                        rotulo="Salvar"
                        enviar={async (c) => {
                            const falha = await salvar(() => editarProjeto(id, c))
                            if (!falha) await atualizar()
                            return falha
                        }}
                    />
                    <div>
                        <button type="button" className={botao} disabled={arquivando} onClick={() => void alternarArquivo(p)}>
                            {p.archived_at ? "Desarquivar" : "Arquivar"}
                        </button>
                    </div>
                    {erro ? <p role="alert">{erro}</p> : null}
                </>
            ) : null}
        </WireframeBox>
    )
}

/**
 * O Painel da carteira de projeto (Decisão 2): o resumo da carteira inteira no
 * lugar do "seguro para gastar", com o orçamento total e o período dela.
 */
export function ResumoDaCarteiraProjetoWireframe({ workspace }: { workspace: Workspace }) {
    const lancs = useQuery({
        queryKey: ["carteira-projeto", workspace.id],
        queryFn: () => lancamentosDaCarteira(workspace.id),
    })
    const resumo = useMemo(
        () => (lancs.data ? resumoDoProjeto(lancs.data, workspace.budget_total ?? null) : null),
        [lancs.data, workspace.budget_total],
    )
    return (
        <WireframeBox bloco={7} titulo="Carteira de projeto">
            <p>
                {workspace.name}
                {periodo(workspace) ? ` · ${periodo(workspace)}` : ""}
            </p>
            {lancs.isPending ? <p>Carregando…</p> : null}
            {lancs.error ? <p role="alert">{mensagem(lancs.error)}</p> : null}
            {resumo ? <Resumo resumo={resumo} workspaceId={workspace.id} /> : null}
        </WireframeBox>
    )
}

/** As opções do seletor: os ativos, mais o escolhido se ele foi arquivado depois. */
export function opcoesDoProjeto(lista: Project[], valor: string): Project[] {
    return lista.filter((p) => !p.archived_at || p.id === valor)
}

/**
 * O projeto no formulário de despesa (Decisão 1): o convidado também escolhe
 * (a RLS deixa ler). Só os ativos, mais o atual se ele foi arquivado depois.
 * Sem projeto nenhum, não aparece. Quem esconde na privada é o formulário (M7).
 */
export function ProjetoDoLancamentoWireframe({ valor, onChange }: { valor: string; onChange: (id: string) => void }) {
    const { currentWorkspaceId } = useWorkspace()
    const lista = useQuery({
        queryKey: chaveDaLista(currentWorkspaceId),
        enabled: Boolean(currentWorkspaceId),
        queryFn: () => listarProjetos(currentWorkspaceId as string),
    })
    // Sem a tabela no banco, o formulário fica como era: só as telas inteiras dizem "Ainda não disponível".
    if (!lista.data?.disponivel) return null
    const opcoes = opcoesDoProjeto(lista.data.dados, valor)
    if (opcoes.length === 0) return null
    return (
        <WireframeBox bloco={7} titulo="Projeto">
            <label className="flex flex-col">
                Projeto (opcional)
                <select className={campo} value={valor} onChange={(e) => onChange(e.target.value)}>
                    <option value="">Sem projeto</option>
                    {opcoes.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                            {p.archived_at ? " (arquivado)" : ""}
                        </option>
                    ))}
                </select>
            </label>
        </WireframeBox>
    )
}

/**
 * As datas e o orçamento total da carteira de projeto (spec §12: "datas e
 * orçamento total, sem ciclo"), só para o dono. Mora nas Configurações e no
 * passo depois de criar uma carteira de um modelo de projeto. Sem `workspace`,
 * vale a carteira atual; fora do `project` ou sem ser dono, nada aparece.
 */
export function DatasDaCarteiraProjetoWireframe({ workspace, onSalvo }: { workspace?: Workspace; onSalvo?: () => void }) {
    const { currentWorkspace, isWorkspaceOwner, refreshWorkspaces } = useWorkspace()
    const alvo = workspace ?? currentWorkspace
    if (!alvo || alvo.purpose !== "project" || !isWorkspaceOwner(alvo.id)) return null
    return <FormularioDaCarteiraProjeto key={alvo.id} alvo={alvo} refresh={refreshWorkspaces} onSalvo={onSalvo} />
}

function FormularioDaCarteiraProjeto({
    alvo,
    refresh,
    onSalvo,
}: {
    alvo: Workspace
    refresh: () => Promise<unknown>
    onSalvo?: () => void
}) {
    const [inicio, setInicio] = useState(alvo.starts_on ?? "")
    const [fim, setFim] = useState(alvo.ends_on ?? "")
    const [orcamento, setOrcamento] = useState(alvo.budget_total != null ? formatMoneyBrlInput(Number(alvo.budget_total)) : "")
    const [pendente, setPendente] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        const r = camposDaCarteiraProjeto({ inicio, fim, orcamento })
        if (!r.ok) {
            setAviso(r.erro)
            return
        }
        setPendente(true)
        setAviso(null)
        try {
            const salvo = await editarCarteiraProjeto(alvo.id, r.campos)
            if (!salvo.disponivel) setAviso(AINDA_NAO_DISPONIVEL)
            else if (!salvo.dados?.length) setAviso(NADA_MUDOU)
            else {
                await refresh()
                setAviso("Salvo.")
                onSalvo?.()
            }
        } catch (erro) {
            setAviso(mensagem(erro))
        } finally {
            setPendente(false)
        }
    }

    return (
        <WireframeBox bloco={7} titulo="Datas e orçamento da carteira de projeto">
            <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-2">
                <label className="flex flex-col">
                    Começa em (opcional)
                    <input className={campo} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                </label>
                <label className="flex flex-col">
                    Termina em (opcional)
                    <input className={campo} type="date" min={inicio || undefined} value={fim} onChange={(e) => setFim(e.target.value)} />
                </label>
                <label className="flex flex-col">
                    Orçamento total em R$ (opcional)
                    <input
                        className={campo}
                        inputMode="decimal"
                        placeholder="0,00"
                        value={orcamento}
                        onChange={(e) => setOrcamento(e.target.value)}
                    />
                </label>
                <div>
                    <button type="submit" className={botao} disabled={pendente}>
                        {pendente ? "Salvando…" : "Salvar datas e orçamento"}
                    </button>
                </div>
                {aviso ? <p role="status">{aviso}</p> : null}
            </form>
        </WireframeBox>
    )
}
