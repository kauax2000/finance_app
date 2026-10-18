"use client"

import * as React from "react"
import Link from "next/link"
import { PlusIcon } from "@heroicons/react/16/solid"
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

export type WorkspacePickerMenuBodyCallbacks = {
    closePicker: () => void
    afterWorkspaceChosen?: () => void
    openCreateDialog: () => void
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
const CARTEIRA_TONS = [
    "focus:bg-sidebar-accent/50 focus:text-sidebar-accent-foreground",
    "data-[state=checked]:not-focus:bg-sidebar-accent data-[state=checked]:focus:bg-sidebar-accent",
    "data-[state=checked]:text-sidebar-accent-foreground",
].join(" ")

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
            {lista.map((workspace) => (
                <DropdownMenuRadioItem
                    key={workspace.id}
                    value={workspace.id}
                    indicator="media"
                    // Os tons da barra lateral, de onde o seletor abre: a passagem é o hover
                    // de uma linha dela (`--sidebar-accent` a 50%), e a carteira atual é a
                    // pílula do ativo (`--sidebar-accent` cheio) — mais forte que a passagem,
                    // inclusive com o foco nela.
                    className={CARTEIRA_TONS}
                >
                    <WorkspaceBrandMark
                        iconKey={workspace.icon}
                        backgroundColor={workspace.icon_background_color}
                        size="xs"
                    />
                    <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                </DropdownMenuRadioItem>
            ))}
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
