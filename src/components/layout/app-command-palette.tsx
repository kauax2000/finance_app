"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    ArrowPathRoundedSquareIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    CreditCardIcon,
    PlusIcon,
    RectangleStackIcon,
    Squares2X2Icon,
    TagIcon,
    UserIcon,
    WalletIcon,
} from "@heroicons/react/16/solid"
import { Button } from "@/components/ui/button"
import { ColorTile } from "@/components/ui/color-tile"
import {
    CommandDialog,
    CommandDock,
    CommandDockItem,
    CommandEmpty,
    CommandEmptyDescription,
    CommandEmptyTitle,
    CommandGroup,
    CommandHighlight,
    CommandInput,
    CommandItem,
    CommandItemArrow,
    CommandItemDescription,
    CommandItemIcon,
    CommandItemMeta,
    CommandItemTitle,
    CommandList,
    CommandLoading,
    CommandPages,
    useCommandPages,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import {
    useQuickCreateSubscription,
    useQuickCreateTransaction,
} from "@/components/layout/quick-actions"
import { TELAS_BUSCAVEIS } from "@/components/layout/app-search-sources"
import type { HeroIcon } from "@/types/navigation"
import {
    ROUTES,
    categoryDetailPath,
    creditCardDetailPath,
} from "@/config/navigation"
import { ranquear } from "@/lib/app-search"
import {
    ESCOPOS,
    casarEscopos,
    escopoExato,
    lerComando,
    type Escopo,
    type EscopoId,
} from "@/lib/app-search-scopes"
import { commandFilter } from "@/lib/command-filter"
import { creditCardIdentitySubtitle } from "@/lib/credit-card-display"
import { currencyBRL, signedCurrencyBRL } from "@/lib/formatters"
import { formatTransactionDmyPtBr } from "@/lib/transaction-date"
import {
    buscaPronta,
    parseBuscaTransacoes,
    verTodasHref,
} from "@/lib/transaction-search"
import { useBillsListQuery } from "@/lib/queries/use-bills-list"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { useInstallmentPlansQuery } from "@/lib/queries/use-installment-plans"
import { useMemberDirectoryQuery } from "@/lib/queries/use-member-directory"
import { useSubscriptionsQuery } from "@/lib/queries/use-subscriptions"
import { useTransactionsSearchQuery } from "@/lib/queries/use-transactions-search"
import { useCommandRecents } from "@/hooks/use-command-recents"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

/**
 * A busca global do app: ⌘K (ou Ctrl+K) em qualquer tela da casca, e a lupa
 * da barra do topo.
 *
 * Ela não abre caminho novo nenhum — é um atalho para os que já existem. Na
 * raiz, sem sub-página, ela acha: as telas (`app-search-sources`, com
 * sinônimos), as ações do "+ Adicionar" e da casca (pelos mesmos ganchos), as
 * transações (a única consulta que depende do termo, com espera de 250ms), e
 * cartões, categorias, compras parceladas, assinaturas, contas a pagar,
 * membros e carteiras, que vêm das listas do espaço — as de categorias e
 * cartões já estão no cache da casca, e as outras ligam quando a paleta abre.
 *
 * **Quem filtra é a paleta** (`shouldFilter: false`): cada grupo escolhe até 5
 * linhas pela nota do `commandFilter` (`ranquear`), e o cmdk desenha o que
 * recebeu, na ordem recebida. Assim uma transação achada pelo valor ("150") não
 * some por não ter "150" no nome, e não sobe acima das telas.
 *
 * **O "/" escolhe onde buscar** (`app-search-scopes`): na raiz, um "/" no
 * começo troca a lista pelo grupo "Buscar em"; escolher um lugar (ou digitar o
 * comando inteiro e um espaço) o põe no campo como escopo, de uma sub-página do
 * `CommandPages`. No escopo só o grupo dele aparece, com até 50 linhas (20
 * transações), e o Backspace duas vezes com o campo vazio volta à raiz — o
 * gesto do componente.
 */

/** A chave dos recentes no `localStorage`: guarda o `href` do destino. */
const RECENTES = "app:busca"

/** Quantas linhas cada grupo local mostra com texto. */
const POR_GRUPO = 5

/** Quantas linhas o grupo mostra dentro do escopo dele. */
const POR_ESCOPO = 50

/** O ícone de cada escopo: o do grupo dele na lista. */
const ICONE_DO_ESCOPO: Record<EscopoId, HeroIcon> = {
    telas: Squares2X2Icon,
    acoes: PlusIcon,
    transacoes: RectangleStackIcon,
    cartoes: CreditCardIcon,
    categorias: TagIcon,
    parcelas: CalendarDaysIcon,
    assinaturas: ArrowPathRoundedSquareIcon,
    contas: ClipboardDocumentCheckIcon,
    membros: UserIcon,
    carteiras: WalletIcon,
}

const parcelaHref = (id: string) => `${ROUTES.TRANSACTIONS}?plan=${id}`
const assinaturaHref = (id: string) => `${ROUTES.TRANSACTIONS}?sub=${id}`
const contaHref = (id: string) => `${ROUTES.BILLS}?detail=${id}`

/** O valor como a pessoa digita: "49,90" acha pelo formatado, "49.9" pelo cru. */
const valores = (n: number | null) => (n == null ? [] : [currencyBRL(n), String(n)])

type AppCommandPaletteProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

/**
 * A paleta. Quem guarda o `open` é a barra do topo, porque o gatilho mora nela
 * (o `TopBarSearch`: ícone no telefone, pílula no desktop) e a paleta, uma vez só.
 */
export function AppCommandPalette({ open, onOpenChange }: AppCommandPaletteProps) {
    // ⌘K vale até dentro de um campo: é o gesto de sair de onde se está, como
    // na busca do catálogo.
    const alternar = React.useRef(() => onOpenChange(!open))
    React.useEffect(() => {
        alternar.current = () => onOpenChange(!open)
    })
    React.useEffect(() => {
        function aoTeclar(event: KeyboardEvent) {
            if (
                event.key.toLowerCase() !== "k" ||
                !(event.metaKey || event.ctrlKey)
            ) {
                return
            }
            event.preventDefault()
            alternar.current()
        }
        document.addEventListener("keydown", aoTeclar)
        return () => document.removeEventListener("keydown", aoTeclar)
    }, [])

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Buscar no app"
            description="Vá para uma tela, adicione algo ou encontre uma transação, um cartão, uma categoria, uma parcela, uma assinatura, uma conta, um membro ou uma carteira."
            commandProps={{ filter: commandFilter, shouldFilter: false }}
        >
            {/* O conteúdo desmonta ao fechar, e com ele a busca, o escopo e as
                consultas que só a paleta liga: reabrir começa na raiz, vazia. */}
            <CommandPages>
                <PaletteBody close={() => onOpenChange(false)} />
            </CommandPages>
        </CommandDialog>
    )
}

type Acao = {
    id: string
    label: string
    icon: HeroIcon
    palavras: string[]
    executar: () => void
}

const MAX_IDS_NA_BUSCA = 50

function PaletteBody({ close }: { close: () => void }) {
    const router = useRouter()
    const [query, setQuery] = React.useState("")
    const q = query.trim()
    const { recents, add } = useCommandRecents(RECENTES)

    const pages = useCommandPages()
    const escopo = pages.current as EscopoId | undefined
    const rotulo = ESCOPOS.find((e) => e.id === escopo)?.rotulo
    // Dentro do escopo, "/" é texto: o comando só é lido na raiz.
    const comando = escopo ? null : lerComando(query)
    const lugares = comando ? casarEscopos(comando.parcial) : []

    const inputRef = React.useRef<HTMLInputElement>(null)
    const restoRef = React.useRef("")
    const entrar = (e: Escopo, resto = "") => {
        restoRef.current = resto
        const Icone = ICONE_DO_ESCOPO[e.id]
        pages.push({ id: e.id, label: e.rotulo, icon: <Icone aria-hidden /> })
    }
    // O campo esvazia num efeito dele quando a página muda, e o efeito do
    // filho roda antes deste: o que veio depois do comando ("/membros ana")
    // entra por último. O `input` sintético devolve a seleção ao ocioso, como
    // na busca do catálogo.
    React.useEffect(() => {
        if (restoRef.current) {
            setQuery(restoRef.current)
            restoRef.current = ""
        }
        inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }))
    }, [escopo])
    /** O atalho de quem digita: o comando inteiro e um espaço entram direto. */
    const digitar = (valor: string) => {
        const lido = escopo ? null : lerComando(valor)
        const exato = lido?.fechado ? escopoExato(lido.parcial) : null
        if (exato && lido) entrar(exato, lido.resto)
        else setQuery(valor)
    }

    const { user } = useAuth()
    const { currentWorkspaceId, workspaces, setCurrentWorkspaceId } = useWorkspace()
    const workspaceId = user && currentWorkspaceId ? currentWorkspaceId : null
    // Categorias e cartões: as mesmas chaves que o `GlobalShellDialogsProvider`
    // já carrega, então é leitura do cache. As outras listas ligam aqui, com a
    // paleta aberta (este corpo só monta com ela), para o nome de um recente
    // se resolver mesmo com o campo vazio.
    const categorias = useCategoriesQuery(workspaceId)
    const cartoes = useCreditCardsQuery(workspaceId)
    const parcelas = useInstallmentPlansQuery(workspaceId)
    const assinaturas = useSubscriptionsQuery(workspaceId)
    const membros = useMemberDirectoryQuery(workspaceId)
    const contas = useBillsListQuery(workspaceId, true)

    // A consulta de transações espera a pessoa parar de digitar. O texto que
    // sobra do termo também casa a categoria e o cartão pelo nome, e os ids
    // deles vão junto ("mercado" acha as transações da categoria Mercado).
    // Com o "/" aberto, ou num escopo que não é o delas, o termo é vazio, e a
    // espera é sobre ele: o "/transacoes" de antes de entrar não vira busca.
    const termoAgora =
        (escopo ? escopo === "transacoes" : !comando) ? query : ""
    const termo = useDebouncedValue(termoAgora, 250)
    const busca = React.useMemo(
        () => parseBuscaTransacoes(termo, new Date()),
        [termo],
    )
    // No máximo 50 ids de cada: um termo curto num espaço com centenas de
    // categorias estouraria a URL do `or=`. Os melhor casados ficam.
    const idsQueCasam = (lista: { id: string; name: string }[] | undefined) =>
        (lista ?? [])
            .map((item) => ({ id: item.id, nota: busca.texto === "" ? 0 : commandFilter(item.name, busca.texto) }))
            .filter((item) => item.nota > 0)
            .sort((a, b) => b.nota - a.nota)
            .slice(0, MAX_IDS_NA_BUSCA)
            .map((item) => item.id)
    const transacoes = useTransactionsSearchQuery({
        workspaceId,
        busca,
        categoriaIds: idsQueCasam(categorias.data),
        cartaoIds: idsQueCasam(cartoes.data),
        limite: escopo === "transacoes" ? 20 : 8,
    })
    // Pelo termo de agora, não pelo atrasado: enquanto a espera corre, o grupo
    // já diz "Buscando…" em vez de mostrar o resultado do termo anterior.
    const procuraTransacoes =
        termoAgora.trim() !== "" &&
        buscaPronta(parseBuscaTransacoes(termoAgora, new Date()))
    const buscando =
        procuraTransacoes && (termoAgora !== termo || transacoes.isLoading)
    // Offline a consulta fica pausada, sem erro e sem dado: conta como erro,
    // senão o grupo some e a paleta diz "Nada encontrado".
    const erroTransacoes =
        procuraTransacoes &&
        !buscando &&
        (transacoes.isError ||
            (transacoes.fetchStatus === "paused" && transacoes.data === undefined))
    const linhasTransacoes =
        procuraTransacoes && !buscando ? (transacoes.data ?? []) : []
    // No escopo, sem termo que busque, a linha diz o que digitar (sem consulta).
    const dicaTransacoes = escopo === "transacoes" && !procuraTransacoes

    const shell = useGlobalShellDialogsOptional()
    const criarTransacao = useQuickCreateTransaction()
    const criarAssinatura = useQuickCreateSubscription()

    /** Navega sem guardar: o destino não se resolve pelo cache (transação, "Ver todas"). */
    const navegar = (href: string) => {
        close()
        router.push(href)
    }
    const ir = (href: string) => {
        add(href)
        navegar(href)
    }
    const agir = (acao: () => void) => {
        close()
        acao()
    }

    /** As ações do "+ Adicionar" e as duas da casca, que só existem com ela. */
    const acoes: Acao[] = [
        { id: "expense", label: "Nova despesa", icon: ArrowTrendingDownIcon, palavras: ["gasto", "saída"], executar: () => criarTransacao("expense") },
        { id: "installment", label: "Nova parcelada", icon: CalendarDaysIcon, palavras: [], executar: () => criarTransacao("installment") },
        { id: "income", label: "Nova receita", icon: ArrowTrendingUpIcon, palavras: ["entrada", "salário"], executar: () => criarTransacao("income") },
        { id: "subscription", label: "Nova assinatura", icon: ArrowPathRoundedSquareIcon, palavras: [], executar: criarAssinatura },
        ...(shell
            ? [
                  { id: "category", label: "Nova categoria", icon: TagIcon, palavras: [], executar: shell.openCategoryCreate },
                  { id: "card", label: "Novo cartão", icon: CreditCardIcon, palavras: [], executar: shell.openCreditCardCreate },
              ]
            : []),
    ]

    /** O nome de todo destino que pode virar recente, pelo `href`. */
    const destinos = new Map<string, string>([
        ...TELAS_BUSCAVEIS.map((tela) => [tela.href, tela.name] as const),
        ...(categorias.data ?? []).map(
            (c) => [categoryDetailPath(c.id), c.name] as const,
        ),
        ...(cartoes.data ?? []).map(
            (c) => [creditCardDetailPath(c.id), c.name] as const,
        ),
        ...(parcelas.data ?? []).map(
            (p) => [parcelaHref(p.id), p.description || "Compra parcelada"] as const,
        ),
        ...(assinaturas.data ?? []).map(
            (a) => [assinaturaHref(a.id), a.name] as const,
        ),
        ...(contas.data ?? []).map((c) => [contaHref(c.id), c.name] as const),
    ])
    const recentes = recents.flatMap((href) => {
        const label = destinos.get(href)
        return label ? [{ href, label }] : []
    })

    // O que cada grupo mostra. Com o "/" aberto, ou fora do escopo dele, nada.
    // No escopo: até 50, na ordem da fonte com o campo vazio. Na raiz: com
    // texto, as 5 melhores, e só os que acharam algo; vazio, `semTexto` (as
    // telas que não estão nos recentes, as ações).
    const achar = <T,>(
        id: EscopoId,
        itens: readonly T[] | undefined,
        chave: (item: T) => { valor: string; palavras?: string[] },
        semTexto: readonly T[] = [],
    ): readonly T[] => {
        if (comando || (escopo && escopo !== id)) return []
        const lista = itens ?? []
        if (q) return ranquear(lista, q, chave, escopo ? POR_ESCOPO : POR_GRUPO)
        return escopo ? lista.slice(0, POR_ESCOPO) : semTexto
    }
    const telas = achar(
        "telas",
        TELAS_BUSCAVEIS,
        (t) => ({ valor: t.name, palavras: t.palavras }),
        TELAS_BUSCAVEIS.filter((t) => !recentes.some((r) => r.href === t.href)),
    )
    const acoesVistas = achar("acoes", acoes, (a) => ({ valor: a.label, palavras: a.palavras }), acoes)
    const cartoesVistos = achar("cartoes", cartoes.data, (c) => ({ valor: c.name, palavras: [c.last_four] }))
    const categoriasVistas = achar("categorias", categorias.data, (c) => ({
        valor: c.name,
        palavras: [c.type === "income" ? "receita" : "despesa"],
    }))
    const parcelasVistas = achar("parcelas", parcelas.data, (p) => ({
        valor: p.description ?? "",
        palavras: valores(p.installment_amount),
    }))
    const assinaturasVistas = achar("assinaturas", assinaturas.data, (a) => ({ valor: a.name, palavras: valores(a.amount) }))
    const contasVistas = achar("contas", contas.data, (c) => ({ valor: c.name, palavras: valores(c.amount_estimated) }))
    const membrosVistos = achar("membros", membros.data, (m) => ({ valor: m.full_name || m.email, palavras: [m.email] }))
    const carteirasVistas = achar(
        "carteiras",
        workspaces.filter((w) => w.id !== currentWorkspaceId),
        (w) => ({ valor: w.name }),
    )

    const grupoTelas =
        telas.length > 0 ? (
            <CommandGroup heading="Telas">
                {telas.map((tela) => (
                    <CommandItem
                        key={tela.href}
                        value={`tela:${tela.href}`}
                        onSelect={() => ir(tela.href)}
                    >
                        <CommandItemIcon>
                            <tela.icon />
                        </CommandItemIcon>
                        <CommandItemTitle>
                            <CommandHighlight>{tela.name}</CommandHighlight>
                        </CommandItemTitle>
                        <CommandItemArrow />
                    </CommandItem>
                ))}
            </CommandGroup>
        ) : null

    return (
        <>
            {/* O escopo no campo, o esvaziar a cada página e os dois
                Backspaces são do `CommandInput`, pela pilha do `CommandPages`. */}
            <CommandInput
                ref={inputRef}
                autoFocus
                value={query}
                onValueChange={digitar}
                placeholder={
                    rotulo ? `Buscar em ${rotulo}…` : "Buscar, ou / para escolher onde…"
                }
                aria-label={rotulo ? `Buscar em ${rotulo}` : "Buscar no app"}
            />

            <CommandList>
                {/* O vazio só depois de a consulta responder: enquanto ela
                    corre, o "Buscando…" do grupo de transações ocupa o lugar, e
                    com erro a linha do erro diz o que houve. */}
                {buscando || erroTransacoes || dicaTransacoes ? null : (
                    <CommandEmpty>
                        <CommandEmptyTitle>
                            {comando
                                ? `Nenhum lugar com "/${comando.parcial}".`
                                : rotulo
                                  ? q
                                      ? `Nada em ${rotulo} para "${query}".`
                                      : `Nada em ${rotulo}.`
                                  : `Nada encontrado para "${query}".`}
                        </CommandEmptyTitle>
                        <CommandEmptyDescription>
                            {comando
                                ? "Digite só / para ver todos os lugares."
                                : rotulo
                                  ? "Apague o escopo com Backspace para buscar em tudo."
                                  : "A busca cobre telas, ações, transações, cartões, categorias, parcelas, assinaturas, contas, membros e carteiras."}
                        </CommandEmptyDescription>
                        {query ? (
                            <Button
                                type="button"
                                variant="tertiary"
                                size="sm"
                                onClick={() => setQuery("")}
                            >
                                Limpar busca
                            </Button>
                        ) : null}
                    </CommandEmpty>
                )}

                {lugares.length > 0 ? (
                    <CommandGroup heading="Buscar em">
                        {lugares.map((e) => {
                            const Icone = ICONE_DO_ESCOPO[e.id]
                            return (
                                <CommandItem
                                    key={e.id}
                                    value={`escopo:${e.id}`}
                                    onSelect={() => entrar(e)}
                                >
                                    <CommandItemIcon>
                                        <Icone />
                                    </CommandItemIcon>
                                    <CommandItemTitle>{e.rotulo}</CommandItemTitle>
                                    <CommandItemMeta>
                                        <CommandItemDescription>
                                            {e.comando}
                                        </CommandItemDescription>
                                        <CommandItemArrow />
                                    </CommandItemMeta>
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                ) : null}

                {/* Os recentes só na raiz com o campo vazio: com texto, o mesmo
                    destino já aparece no grupo dele. */}
                {!q && !escopo && recentes.length > 0 ? (
                    <CommandGroup heading="Recentes">
                        {recentes.map((item) => (
                            <CommandItem
                                key={item.href}
                                value={`recente:${item.href}`}
                                onSelect={() => ir(item.href)}
                            >
                                <CommandItemIcon>
                                    <ClockIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>{item.label}</CommandItemTitle>
                                <CommandItemArrow />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {q ? grupoTelas : null}

                {acoesVistas.length > 0 ? (
                    <CommandGroup heading="Ações">
                        {acoesVistas.map((acao) => (
                            <CommandItem
                                key={acao.id}
                                value={`acao:${acao.id}`}
                                onSelect={() => agir(acao.executar)}
                            >
                                <CommandItemIcon>
                                    <acao.icon />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{acao.label}</CommandHighlight>
                                </CommandItemTitle>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {q ? null : grupoTelas}

                {buscando || erroTransacoes || dicaTransacoes || linhasTransacoes.length > 0 ? (
                    <CommandGroup heading="Transações">
                        {dicaTransacoes ? (
                            <div
                                role="status"
                                className="flex justify-center py-6 text-sm text-muted-foreground"
                            >
                                Digite uma descrição, um valor ou uma data.
                            </div>
                        ) : buscando ? (
                            <CommandLoading label="Buscando transações">
                                <Spinner />
                                Buscando…
                            </CommandLoading>
                        ) : erroTransacoes ? (
                            // Uma linha que não se escolhe: o resto da paleta segue.
                            // `status`, não a barra de progresso do `CommandLoading`.
                            <div
                                role="status"
                                className="flex justify-center py-6 text-sm text-muted-foreground"
                            >
                                Não deu para buscar transações agora.
                            </div>
                        ) : (
                            <>
                                {linhasTransacoes.map((t) => (
                                    <CommandItem
                                        key={t.id}
                                        value={`transacao:${t.id}`}
                                        onSelect={() =>
                                            navegar(`${ROUTES.TRANSACTIONS}?txn=${t.id}`)
                                        }
                                    >
                                        <CommandItemIcon>
                                            {t.type === "income" ? (
                                                <ArrowTrendingUpIcon />
                                            ) : (
                                                <ArrowTrendingDownIcon />
                                            )}
                                        </CommandItemIcon>
                                        <CommandItemTitle>
                                            <CommandHighlight>
                                                {t.description || "Sem descrição"}
                                            </CommandHighlight>
                                        </CommandItemTitle>
                                        <CommandItemMeta>
                                            <CommandItemDescription className="nums">
                                                {`${formatTransactionDmyPtBr(t.date)} · ${signedCurrencyBRL(
                                                    t.type === "income"
                                                        ? Math.abs(t.amount)
                                                        : -Math.abs(t.amount),
                                                )}`}
                                            </CommandItemDescription>
                                            <CommandItemArrow />
                                        </CommandItemMeta>
                                    </CommandItem>
                                ))}
                                <CommandItem
                                    value="transacao:ver-todas"
                                    onSelect={() => navegar(verTodasHref(busca))}
                                >
                                    <CommandItemIcon>
                                        <RectangleStackIcon />
                                    </CommandItemIcon>
                                    <CommandItemTitle>
                                        Ver todas em Transações
                                    </CommandItemTitle>
                                    <CommandItemArrow />
                                </CommandItem>
                            </>
                        )}
                    </CommandGroup>
                ) : null}

                {cartoesVistos.length > 0 ? (
                    <CommandGroup heading="Cartões">
                        {cartoesVistos.map((c) => (
                            <CommandItem
                                key={c.id}
                                value={`cartao:${c.id}`}
                                onSelect={() => ir(creditCardDetailPath(c.id))}
                            >
                                <CommandItemIcon>
                                    <CreditCardIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{c.name}</CommandHighlight>
                                </CommandItemTitle>
                                <CommandItemMeta>
                                    <CommandItemDescription className="nums">
                                        {creditCardIdentitySubtitle(c)}
                                    </CommandItemDescription>
                                    <CommandItemArrow />
                                </CommandItemMeta>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {categoriasVistas.length > 0 ? (
                    <CommandGroup heading="Categorias">
                        {categoriasVistas.map((c) => (
                            <CommandItem
                                key={c.id}
                                value={`categoria:${c.id}`}
                                onSelect={() => ir(categoryDetailPath(c.id))}
                            >
                                <CommandItemIcon>
                                    <ColorTile size="xs" color={c.color} />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{c.name}</CommandHighlight>
                                </CommandItemTitle>
                                <CommandItemMeta>
                                    <CommandItemDescription>
                                        {c.type === "income" ? "Receita" : "Despesa"}
                                    </CommandItemDescription>
                                    <CommandItemArrow />
                                </CommandItemMeta>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {parcelasVistas.length > 0 ? (
                    <CommandGroup heading="Compras parceladas">
                        {parcelasVistas.map((p) => (
                            <CommandItem
                                key={p.id}
                                value={`parcela:${p.id}`}
                                onSelect={() => ir(parcelaHref(p.id))}
                            >
                                <CommandItemIcon>
                                    <CalendarDaysIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>
                                        {p.description || "Compra parcelada"}
                                    </CommandHighlight>
                                </CommandItemTitle>
                                <CommandItemMeta>
                                    <CommandItemDescription className="nums">
                                        {`${p.total_installments}× ${currencyBRL(p.installment_amount)}`}
                                    </CommandItemDescription>
                                    <CommandItemArrow />
                                </CommandItemMeta>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {assinaturasVistas.length > 0 ? (
                    <CommandGroup heading="Assinaturas">
                        {assinaturasVistas.map((a) => (
                            <CommandItem
                                key={a.id}
                                value={`assinatura:${a.id}`}
                                onSelect={() => ir(assinaturaHref(a.id))}
                            >
                                <CommandItemIcon>
                                    <ArrowPathRoundedSquareIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{a.name}</CommandHighlight>
                                </CommandItemTitle>
                                <CommandItemMeta>
                                    <CommandItemDescription className="nums">
                                        {currencyBRL(a.amount)}
                                    </CommandItemDescription>
                                    <CommandItemArrow />
                                </CommandItemMeta>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {contasVistas.length > 0 ? (
                    <CommandGroup heading="Contas a pagar">
                        {contasVistas.map((c) => (
                            <CommandItem
                                key={c.id}
                                value={`conta:${c.id}`}
                                onSelect={() => ir(contaHref(c.id))}
                            >
                                <CommandItemIcon>
                                    <ClipboardDocumentCheckIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{c.name}</CommandHighlight>
                                </CommandItemTitle>
                                <CommandItemMeta>
                                    {c.amount_estimated != null ? (
                                        <CommandItemDescription className="nums">
                                            {currencyBRL(c.amount_estimated)}
                                        </CommandItemDescription>
                                    ) : null}
                                    <CommandItemArrow />
                                </CommandItemMeta>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {membrosVistos.length > 0 ? (
                    <CommandGroup heading="Membros">
                        {membrosVistos.map((m) => (
                            <CommandItem
                                key={m.user_id}
                                value={`membro:${m.user_id}`}
                                onSelect={() => ir(ROUTES.MEMBERS)}
                            >
                                <CommandItemIcon>
                                    <UserIcon />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>
                                        {m.full_name || m.email}
                                    </CommandHighlight>
                                </CommandItemTitle>
                                <CommandItemMeta>
                                    {m.full_name ? (
                                        <CommandItemDescription>
                                            {m.email}
                                        </CommandItemDescription>
                                    ) : null}
                                    <CommandItemArrow />
                                </CommandItemMeta>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}

                {carteirasVistas.length > 0 ? (
                    <CommandGroup heading="Carteiras">
                        {carteirasVistas.map((w) => (
                            <CommandItem
                                key={w.id}
                                value={`carteira:${w.id}`}
                                // A mesma troca do seletor de carteira; a atual
                                // não está na lista.
                                onSelect={() =>
                                    agir(() => void setCurrentWorkspaceId(w.id))
                                }
                            >
                                <CommandItemIcon>
                                    <WorkspaceBrandMark
                                        iconKey={w.icon}
                                        backgroundColor={w.icon_background_color}
                                        size="xs"
                                    />
                                </CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{w.name}</CommandHighlight>
                                </CommandItemTitle>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ) : null}
            </CommandList>

            <CommandDock>
                <div className="flex items-center gap-2">
                    <CommandDockItem>
                        <KbdGroup mode="either" keys={["up", "down"]} />
                        navegar
                    </CommandDockItem>
                    {escopo ? (
                        <CommandDockItem>
                            <Kbd>⌫</Kbd>
                            sair do escopo
                        </CommandDockItem>
                    ) : (
                        <CommandDockItem>
                            <Kbd>/</Kbd>
                            escolher onde
                        </CommandDockItem>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <CommandDockItem>
                        <Kbd>↵</Kbd>
                        abrir
                    </CommandDockItem>
                    <CommandDockItem>
                        <Kbd>Esc</Kbd>
                        fechar
                    </CommandDockItem>
                </div>
            </CommandDock>
        </>
    )
}
