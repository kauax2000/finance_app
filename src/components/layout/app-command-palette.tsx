"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    ArrowPathRoundedSquareIcon,
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    CalendarDaysIcon,
    ChartPieIcon,
    ClockIcon,
    CreditCardIcon,
    MagnifyingGlassIcon,
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
    CommandPage,
    CommandPages,
    useCommandPages,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { KbdGroup } from "@/components/ui/kbd-group"
import { Spinner } from "@/components/ui/spinner"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { ACCOUNT_MENU_PROFILE_LINK_ITEMS } from "@/components/layout/account-menu-links"
import {
    useQuickCreateSubscription,
    useQuickCreateTransaction,
} from "@/components/layout/quick-actions"
import type { NewTransactionMode } from "@/components/transactions/transactions-toolbar"
import {
    MAIN_NAVIGATION,
    MEMBERS_NAV_ITEM,
    SETTINGS_NAV_ITEM,
    categoryDetailPath,
    creditCardDetailPath,
} from "@/config/navigation"
import { commandFilter } from "@/lib/command-filter"
import { creditCardIdentitySubtitle } from "@/lib/credit-card-display"
import { useCategoriesQuery } from "@/lib/queries/use-categories"
import { useCreditCardsQuery } from "@/lib/queries/use-credit-cards"
import { ariaShortcut } from "@/lib/shortcut"
import { useCommandRecents } from "@/hooks/use-command-recents"

/**
 * A busca global do app: ⌘K (ou Ctrl+K) em qualquer tela da casca, e a lupa
 * da barra do topo.
 *
 * Ela não abre caminho novo nenhum — é um atalho para os que já existem:
 * as telas da navegação (`config/navigation`), as ações do "+ Adicionar"
 * (pelos mesmos ganchos de `quick-actions`) e o detalhe de uma categoria ou
 * de um cartão. Categorias e cartões vêm das mesmas consultas que a casca já
 * faz para os formulários globais, então abrir a paleta não vai ao banco.
 */

/** A chave dos recentes no `localStorage`: guarda o `href` do destino. */
const RECENTES = "app:busca"

/** As telas da navegação: lateral, menu da conta e o perfil. */
const TELAS = [
    ...MAIN_NAVIGATION,
    MEMBERS_NAV_ITEM,
    SETTINGS_NAV_ITEM,
    ...ACCOUNT_MENU_PROFILE_LINK_ITEMS.map(({ href, label, icon }) => ({
        href,
        name: label,
        icon,
    })),
]

/** As ações do "+ Adicionar", na ordem e com os nomes do menu dele. */
const NOVOS: ReadonlyArray<{
    mode: NewTransactionMode
    label: string
    icon: React.ReactNode
}> = [
    { mode: "expense", label: "Nova despesa", icon: <ArrowTrendingDownIcon /> },
    { mode: "installment", label: "Nova parcelada", icon: <CalendarDaysIcon /> },
    { mode: "income", label: "Nova receita", icon: <ArrowTrendingUpIcon /> },
]

type AppCommandPaletteProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

/**
 * A paleta. Quem guarda o `open` é a barra do topo, porque o gatilho mora nas
 * duas árvores dela (telefone e desktop) e a paleta, uma vez só.
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
            description="Vá para uma tela, adicione um lançamento ou abra uma categoria ou um cartão."
            commandProps={{ filter: commandFilter }}
        >
            {/* O conteúdo desmonta ao fechar, e com ele a busca e a pilha de
                páginas: reabrir começa da raiz. */}
            <CommandPages>
                <PaletteBody close={() => onOpenChange(false)} />
            </CommandPages>
        </CommandDialog>
    )
}

function PaletteBody({ close }: { close: () => void }) {
    const router = useRouter()
    const { current, push } = useCommandPages()
    const [query, setQuery] = React.useState("")
    const { recents, add } = useCommandRecents(RECENTES)

    const { user } = useAuth()
    const { currentWorkspaceId } = useWorkspace()
    const workspaceId = user && currentWorkspaceId ? currentWorkspaceId : null
    // As mesmas chaves que o `GlobalShellDialogsProvider` já carrega: aqui é
    // leitura do cache, não consulta nova.
    const categorias = useCategoriesQuery(workspaceId)
    const cartoes = useCreditCardsQuery(workspaceId)

    const criarTransacao = useQuickCreateTransaction()
    const criarAssinatura = useQuickCreateSubscription()

    const ir = (href: string) => {
        add(href)
        close()
        router.push(href)
    }
    const agir = (acao: () => void) => {
        close()
        acao()
    }

    /** O nome de todo destino que pode virar recente, pelo `href`. */
    const destinos = new Map<string, string>([
        ...TELAS.map((tela) => [tela.href, tela.name] as const),
        ...(categorias.data ?? []).map(
            (c) => [categoryDetailPath(c.id), c.name] as const,
        ),
        ...(cartoes.data ?? []).map(
            (c) => [creditCardDetailPath(c.id), c.name] as const,
        ),
    ])
    const recentes = recents.flatMap((href) => {
        const label = destinos.get(href)
        return label ? [{ href, label }] : []
    })

    const carregando =
        (current === "categorias" && categorias.isLoading) ||
        (current === "cartoes" && cartoes.isLoading)

    return (
        <>
            <CommandInput
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder={
                    current === "categorias"
                        ? "Buscar uma categoria…"
                        : current === "cartoes"
                          ? "Buscar um cartão…"
                          : "Buscar uma tela ou ação…"
                }
                aria-label="Buscar no app"
            />

            <CommandList>
                {carregando ? (
                    <CommandLoading>
                        <Spinner />
                        Carregando…
                    </CommandLoading>
                ) : (
                    <CommandEmpty>
                        <CommandEmptyTitle>
                            {vazioTitulo(current, query)}
                        </CommandEmptyTitle>
                        {query ? (
                            <>
                                <CommandEmptyDescription>
                                    {current
                                        ? "A busca cobre o nome de cada item desta lista."
                                        : "A busca cobre as telas e as ações de adicionar. Categorias e cartões ficam em Categorias… e Cartões…"}
                                </CommandEmptyDescription>
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="sm"
                                    onClick={() => setQuery("")}
                                >
                                    Limpar busca
                                </Button>
                            </>
                        ) : null}
                    </CommandEmpty>
                )}

                <CommandPage>
                    {/* Os recentes só com o campo vazio: com texto, o mesmo
                        destino já aparece no grupo dele. */}
                    {!query && recentes.length > 0 ? (
                        <CommandGroup heading="Recentes">
                            {recentes.map((item) => (
                                <CommandItem
                                    key={item.href}
                                    value={`recente ${item.href}`}
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

                    <CommandGroup heading="Ir para">
                        {TELAS.map((tela) => (
                            <CommandItem
                                key={tela.href}
                                value={tela.name}
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

                    <CommandGroup heading="Procurar">
                        <SubPageItem
                            label="Categorias…"
                            icon={<ChartPieIcon />}
                            onSelect={() =>
                                push({
                                    id: "categorias",
                                    label: "Categorias",
                                    icon: <ChartPieIcon />,
                                })
                            }
                        />
                        <SubPageItem
                            label="Cartões…"
                            icon={<CreditCardIcon />}
                            onSelect={() =>
                                push({
                                    id: "cartoes",
                                    label: "Cartões",
                                    icon: <CreditCardIcon />,
                                })
                            }
                        />
                    </CommandGroup>

                    <CommandGroup heading="Ações">
                        {NOVOS.map((novo) => (
                            <CommandItem
                                key={novo.mode}
                                value={novo.label}
                                onSelect={() =>
                                    agir(() => criarTransacao(novo.mode))
                                }
                            >
                                <CommandItemIcon>{novo.icon}</CommandItemIcon>
                                <CommandItemTitle>
                                    <CommandHighlight>{novo.label}</CommandHighlight>
                                </CommandItemTitle>
                            </CommandItem>
                        ))}
                        <CommandItem
                            value="Nova assinatura"
                            onSelect={() => agir(criarAssinatura)}
                        >
                            <CommandItemIcon>
                                <ArrowPathRoundedSquareIcon />
                            </CommandItemIcon>
                            <CommandItemTitle>
                                <CommandHighlight>Nova assinatura</CommandHighlight>
                            </CommandItemTitle>
                        </CommandItem>
                    </CommandGroup>
                </CommandPage>

                <CommandPage id="categorias">
                    {carregando ? null : (
                        <CommandGroup heading="Categorias" count>
                            {(categorias.data ?? []).map((c) => (
                                <CommandItem
                                    key={c.id}
                                    // O tipo entra no valor: "Outros" de despesa
                                    // e de receita não podem acender juntos.
                                    value={`${c.name} ${c.type}`}
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
                    )}
                </CommandPage>

                <CommandPage id="cartoes">
                    {carregando ? null : (
                        <CommandGroup heading="Cartões" count>
                            {(cartoes.data ?? []).map((c) => (
                                <CommandItem
                                    key={c.id}
                                    value={`${c.name} ${c.last_four}`}
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
                    )}
                </CommandPage>
            </CommandList>

            <CommandDock>
                <div className="flex items-center gap-2">
                    <CommandDockItem>
                        <KbdGroup mode="either" keys={["up", "down"]} />
                        navegar
                    </CommandDockItem>
                    {current ? (
                        <CommandDockItem>
                            <Kbd>⌫</Kbd>
                            voltar
                        </CommandDockItem>
                    ) : null}
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

/** A linha que abre uma sub-página: o nome e a seta de entrar. */
function SubPageItem({
    label,
    icon,
    onSelect,
}: {
    label: string
    icon: React.ReactNode
    onSelect: () => void
}) {
    return (
        <CommandItem value={label} onSelect={onSelect}>
            <CommandItemIcon>{icon}</CommandItemIcon>
            <CommandItemTitle>
                <CommandHighlight>{label}</CommandHighlight>
            </CommandItemTitle>
            <CommandItemArrow />
        </CommandItem>
    )
}

function vazioTitulo(pagina: string | undefined, query: string): string {
    if (pagina === "categorias") {
        return query
            ? `Nenhuma categoria com "${query}".`
            : "Nenhuma categoria nesta carteira."
    }
    if (pagina === "cartoes") {
        return query
            ? `Nenhum cartão com "${query}".`
            : "Nenhum cartão cadastrado."
    }
    return `Nada encontrado para "${query}".`
}

/**
 * A lupa da barra do topo. `aria-keyshortcuts` anuncia o atalho, e a dica o
 * mostra a quem tem cursor.
 */
export function AppSearchButton({ onClick }: { onClick: () => void }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="tertiary"
                    size="icon-md"
                    aria-label="Buscar"
                    aria-haspopup="dialog"
                    aria-keyshortcuts={ariaShortcut("mod+k")}
                    onClick={onClick}
                >
                    <MagnifyingGlassIcon />
                </Button>
            </TooltipTrigger>
            <TooltipContent shortcut="mod+k">Buscar</TooltipContent>
        </Tooltip>
    )
}
