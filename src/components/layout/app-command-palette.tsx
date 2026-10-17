"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    ArrowPathRoundedSquareIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    BellIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    CreditCardIcon,
    RectangleStackIcon,
    TagIcon,
    UserIcon,
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
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { useGlobalShellDialogsOptional } from "@/components/layout/global-shell-dialogs-provider"
import { useNotificationsUi } from "@/components/layout/notifications-ui-provider"
import {
    useQuickCreateSubscription,
    useQuickCreateTransaction,
} from "@/components/layout/quick-actions"
import {
    TELAS_BUSCAVEIS,
    type TelaBuscavel,
} from "@/components/layout/app-search-sources"
import type { HeroIcon } from "@/types/navigation"
import {
    ROUTES,
    categoryDetailPath,
    creditCardDetailPath,
} from "@/config/navigation"
import { ranquear } from "@/lib/app-search"
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
 */

/** A chave dos recentes no `localStorage`: guarda o `href` do destino. */
const RECENTES = "app:busca"

/** Quantas linhas cada grupo local mostra com texto. */
const POR_GRUPO = 5

/**
 * Notificações não é rota: é o painel do `NotificationsUiProvider`. Entra no
 * fim de "Telas", abre o painel e não vira recente.
 */
const NOTIFICACOES: TelaBuscavel = {
    href: ROUTES.NOTIFICATIONS,
    name: "Notificações",
    icon: BellIcon,
    palavras: [],
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
            {/* O conteúdo desmonta ao fechar, e com ele a busca e as consultas
                que só a paleta liga: reabrir começa do campo vazio. */}
            <PaletteBody close={() => onOpenChange(false)} />
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

function PaletteBody({ close }: { close: () => void }) {
    const router = useRouter()
    const [query, setQuery] = React.useState("")
    const q = query.trim()
    const { recents, add } = useCommandRecents(RECENTES)

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
    const termo = useDebouncedValue(query, 250)
    const busca = React.useMemo(
        () => parseBuscaTransacoes(termo, new Date()),
        [termo],
    )
    const casaTexto = (nome: string) =>
        busca.texto !== "" && commandFilter(nome, busca.texto) > 0
    const transacoes = useTransactionsSearchQuery({
        workspaceId,
        busca,
        categoriaIds: (categorias.data ?? [])
            .filter((c) => casaTexto(c.name))
            .map((c) => c.id),
        cartaoIds: (cartoes.data ?? [])
            .filter((c) => casaTexto(c.name))
            .map((c) => c.id),
    })
    // Pelo termo de agora, não pelo atrasado: enquanto a espera corre, o grupo
    // já diz "Buscando…" em vez de mostrar o resultado do termo anterior.
    const procuraTransacoes =
        q !== "" && buscaPronta(parseBuscaTransacoes(query, new Date()))
    const buscando =
        procuraTransacoes && (query !== termo || transacoes.isLoading)
    const erroTransacoes = procuraTransacoes && !buscando && transacoes.isError
    const linhasTransacoes =
        procuraTransacoes && !buscando ? (transacoes.data ?? []) : []

    const shell = useGlobalShellDialogsOptional()
    const notificacoes = useNotificationsUi()
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

    // Com o campo vazio: as telas que não estão nos recentes, e Notificações
    // no fim. Com texto: as 5 melhores de cada grupo, e só os que acharam algo.
    const achar = <T,>(
        itens: readonly T[] | undefined,
        chave: (item: T) => { valor: string; palavras?: string[] },
    ) => (q ? ranquear(itens ?? [], q, chave, POR_GRUPO) : [])
    const telas = q
        ? ranquear([...TELAS_BUSCAVEIS, NOTIFICACOES], q, (t) => ({ valor: t.name, palavras: t.palavras }), POR_GRUPO)
        : [
              ...TELAS_BUSCAVEIS.filter(
                  (t) => !recentes.some((r) => r.href === t.href),
              ),
              NOTIFICACOES,
          ]
    const acoesVistas = q
        ? ranquear(acoes, q, (a) => ({ valor: a.label, palavras: a.palavras }), POR_GRUPO)
        : acoes
    const cartoesVistos = achar(cartoes.data, (c) => ({ valor: c.name, palavras: [c.last_four] }))
    const categoriasVistas = achar(categorias.data, (c) => ({
        valor: c.name,
        palavras: [c.type === "income" ? "receita" : "despesa"],
    }))
    const parcelasVistas = achar(parcelas.data, (p) => ({
        valor: p.description ?? "",
        palavras: valores(p.installment_amount),
    }))
    const assinaturasVistas = achar(assinaturas.data, (a) => ({ valor: a.name, palavras: valores(a.amount) }))
    const contasVistas = achar(contas.data, (c) => ({ valor: c.name, palavras: valores(c.amount_estimated) }))
    const membrosVistos = achar(membros.data, (m) => ({ valor: m.full_name || m.email, palavras: [m.email] }))
    const carteirasVistas = achar(
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
                        onSelect={() =>
                            tela === NOTIFICACOES
                                ? agir(notificacoes.open)
                                : ir(tela.href)
                        }
                    >
                        <CommandItemIcon>
                            <tela.icon />
                        </CommandItemIcon>
                        <CommandItemTitle>
                            <CommandHighlight>{tela.name}</CommandHighlight>
                        </CommandItemTitle>
                        {tela === NOTIFICACOES ? null : <CommandItemArrow />}
                    </CommandItem>
                ))}
            </CommandGroup>
        ) : null

    return (
        <>
            <CommandInput
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Buscar uma tela, uma transação, um cartão…"
                aria-label="Buscar no app"
            />

            <CommandList>
                {/* O vazio só depois de a consulta responder: enquanto ela
                    corre, o "Buscando…" do grupo de transações ocupa o lugar, e
                    com erro a linha do erro diz o que houve. */}
                {buscando || erroTransacoes ? null : (
                    <CommandEmpty>
                        <CommandEmptyTitle>
                            {`Nada encontrado para "${query}".`}
                        </CommandEmptyTitle>
                        <CommandEmptyDescription>
                            A busca cobre telas, ações, transações, cartões,
                            categorias, parcelas, assinaturas, contas, membros e
                            carteiras.
                        </CommandEmptyDescription>
                        <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            onClick={() => setQuery("")}
                        >
                            Limpar busca
                        </Button>
                    </CommandEmpty>
                )}

                {/* Os recentes só com o campo vazio: com texto, o mesmo
                    destino já aparece no grupo dele. */}
                {!q && recentes.length > 0 ? (
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

                {buscando || erroTransacoes || linhasTransacoes.length > 0 ? (
                    <CommandGroup heading="Transações">
                        {buscando ? (
                            <CommandLoading label="Buscando transações">
                                <Spinner />
                                Buscando…
                            </CommandLoading>
                        ) : erroTransacoes ? (
                            // Uma linha que não se escolhe: o resto da paleta segue.
                            <CommandLoading label="Não deu para buscar transações agora.">
                                Não deu para buscar transações agora.
                            </CommandLoading>
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
