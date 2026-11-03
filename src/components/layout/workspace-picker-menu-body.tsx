"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRightStartOnRectangleIcon, PencilIcon, PlusIcon } from "@heroicons/react/16/solid"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import {
    Alert,
    AlertAction,
    AlertActions,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import type { Workspace } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export type WorkspacePickerMenuBodyCallbacks = {
    closePicker: () => void
    afterWorkspaceChosen?: () => void
    openCreateDialog: () => void
    /** O lápis do dono: sempre à vista na carteira atual, nas outras na passagem. */
    editarCarteira?: (id: string) => void
    /** Se a pessoa é dona da carteira (e a linha dela leva o lápis). */
    podeEditarCarteira?: (id: string) => boolean
    /** Na linha da carteira atual: sair, para quem não é dono. */
    sairDaCarteira?: () => void
}

type WorkspacePickerMenuBodyProps = {
    callbacks: WorkspacePickerMenuBodyCallbacks
}

/**
 * O miolo do seletor de carteira, feito das peças do `DropdownMenu`: trocar de
 * carteira é escolher uma entre várias, então cada grupo é um
 * `DropdownMenuRadioGroup` (o ponto marca a atual), os títulos são
 * `DropdownMenuLabel` e "Criar carteira" é um `DropdownMenuItem`. Antes eram
 * `<button>` crus com o realce escrito à mão, porque o miolo também servia uma
 * gaveta fora do menu do Radix — essa gaveta não existe mais.
 */
export function WorkspacePickerMenuBody({ callbacks }: WorkspacePickerMenuBodyProps) {
    const {
        currentWorkspaceId,
        workspaces,
        workspaceRoleById,
        loading,
        error,
        setCurrentWorkspaceId,
        refreshWorkspaces,
        pendingWorkspaceInvites,
    } = useWorkspace()

    const ownedWorkspaces = React.useMemo(
        () => workspaces.filter((w) => workspaceRoleById[w.id] === "owner"),
        [workspaces, workspaceRoleById]
    )
    const memberWorkspaces = React.useMemo(
        () => workspaces.filter((w) => workspaceRoleById[w.id] !== "owner"),
        [workspaces, workspaceRoleById]
    )

    function pickWorkspace(id: string) {
        void setCurrentWorkspaceId(id)
        callbacks.closePicker()
        callbacks.afterWorkspaceChosen?.()
    }

    const opcoes = (lista: Workspace[]) => (
        <DropdownMenuRadioGroup
            value={currentWorkspaceId ?? ""}
            onValueChange={pickWorkspace}
        >
            {lista.map((workspace) => {
                const atual = workspace.id === currentWorkspaceId
                const podeEditar = callbacks.podeEditarCarteira?.(workspace.id) ?? false
                const editar = podeEditar ? callbacks.editarCarteira : undefined
                const sair = atual && !podeEditar ? callbacks.sairDaCarteira : undefined
                const item = (
                    <DropdownMenuRadioItem
                        key={workspace.id}
                        value={workspace.id}
                        indicator="media"
                        className={editar || sair ? "pr-10 pointer-coarse:pr-12" : undefined}
                        // Os tons da barra lateral, de onde o seletor abre: a passagem é o hover
                        // de uma linha dela (`--sidebar-accent` a 50%), e a carteira atual é a
                        // pílula do ativo (`--sidebar-accent` cheio) — mais forte que a passagem,
                        // inclusive com o foco nela.
                    >
                        <WorkspaceBrandMark
                            iconKey={workspace.icon}
                            backgroundColor={workspace.icon_background_color}
                            size="xs"
                        />
                        <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                    </DropdownMenuRadioItem>
                )
                if (!editar && !sair) return item
                // A ação da carteira atual mora dentro da linha, à direita, mas é um item
                // irmão (um botão dentro do `menuitemradio` seria interativo aninhado). O
                // `data-menu-row` devolve o respiro entre as linhas (`MENU_ROW_GAP`). O menu
                // fecha antes, para o diálogo não abrir com o menu por cima.
                return (
                    <div key={workspace.id} data-menu-row className="group/linha relative">
                        {item}
                        {editar ? (
                            <DropdownMenuItem
                                className={cn(
                                    "absolute top-1/2 right-1 mt-0! -translate-y-1/2 rounded-full! pointer-coarse:min-h-9",
                                    // Fora da atual, o lápis aparece na passagem do cursor e com o
                                    // foco na linha; no toque fica sempre à vista.
                                    !atual &&
                                        "opacity-0 transition-opacity group-hover/linha:opacity-100 group-focus-within/linha:opacity-100 pointer-coarse:opacity-100",
                                )}
                                aria-label={`Editar carteira ${workspace.name}`}
                                onSelect={() => {
                                    callbacks.closePicker()
                                    editar(workspace.id)
                                }}
                            >
                                <PencilIcon aria-hidden />
                            </DropdownMenuItem>
                        ) : sair ? (
                            <DropdownMenuItem
                                className="absolute top-1/2 right-1 mt-0! -translate-y-1/2 rounded-full! pointer-coarse:min-h-9"
                                aria-label={`Sair da carteira ${workspace.name}`}
                                onSelect={() => {
                                    callbacks.closePicker()
                                    sair()
                                }}
                            >
                                <ArrowRightStartOnRectangleIcon aria-hidden />
                            </DropdownMenuItem>
                        ) : null}
                    </div>
                )
            })}
        </DropdownMenuRadioGroup>
    )

    return (
        <>
            {!loading && pendingWorkspaceInvites.length > 0 ? (
                <>
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Convites</DropdownMenuLabel>
                        {pendingWorkspaceInvites.map((inv) => (
                            <DropdownMenuItem key={inv.id} asChild>
                                <Link
                                    href={`/invites/accept?invite=${encodeURIComponent(inv.id)}`}
                                    onClick={() => callbacks.closePicker()}
                                >
                                    {inv.workspace ? (
                                        <WorkspaceBrandMark
                                            iconKey={inv.workspace.icon}
                                            backgroundColor={inv.workspace.icon_background_color}
                                            size="xs"
                                        />
                                    ) : null}
                                    <span className="min-w-0 flex-1 truncate">
                                        {inv.workspace?.name ?? "Convite"}
                                    </span>
                                    <Badge size="xs" tone="neutral">
                                        Convite
                                    </Badge>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                </>
            ) : null}

            <DropdownMenuLabel>Minhas carteiras</DropdownMenuLabel>
            {loading ? (
                <div className="flex flex-col gap-1 px-2 py-1" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex h-9 items-center gap-2">
                            <Skeleton shape="tile" size="xs" />
                            <Skeleton shape="text" className="flex-1" />
                        </div>
                    ))}
                </div>
            ) : ownedWorkspaces.length > 0 ? (
                opcoes(ownedWorkspaces)
            ) : (
                <DropdownMenuItem disabled>
                    {workspaces.length > 0
                        ? "Nenhuma carteira própria"
                        : "Nenhuma carteira encontrada"}
                </DropdownMenuItem>
            )}

            {!loading && memberWorkspaces.length > 0 ? (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Compartilhadas comigo</DropdownMenuLabel>
                    {opcoes(memberWorkspaces)}
                </>
            ) : null}

            {error ? (
                // A lista que não carregou, não um erro de formulário: o `Alert`.
                <div className="px-1 py-1">
                    <Alert tone="destructive" size="sm">
                        <AlertTitle>Não foi possível carregar as carteiras</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        <AlertActions>
                            <AlertAction onClick={() => void refreshWorkspaces()}>
                                Tentar novamente
                            </AlertAction>
                        </AlertActions>
                    </Alert>
                </div>
            ) : null}

            <DropdownMenuItem onSelect={() => callbacks.openCreateDialog()}>
                <PlusIcon />
                Criar carteira
            </DropdownMenuItem>
        </>
    )
}
