"use client"

import * as React from "react"
import Link from "next/link"
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Workspace } from "@/lib/supabase"

const workspaceRowIconBoxClassDefault =
    "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-sidebar text-sidebar-foreground [&_svg]:text-sidebar-foreground"

const workspaceRowIconBoxClassComfortable =
    "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/80 text-foreground [&_svg]:text-foreground"

/** Estilo alinhado ao DropdownMenuItem, sem exigir contexto Radix Menu (funciona no sheet móvel). */
const pickerRowInteractiveClass =
    "relative flex w-full cursor-pointer select-none items-center text-left text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground active:bg-accent/90 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"

export type WorkspacePickerMenuBodyCallbacks = {
    closePicker: () => void
    afterWorkspaceChosen?: () => void
    openCreateDialog: () => void
}

type WorkspacePickerDensity = "default" | "comfortable"

type WorkspacePickerMenuBodyProps = {
    callbacks: WorkspacePickerMenuBodyCallbacks
    className?: string
    /** `comfortable`: linhas e ícones maiores para toque (ex.: sheet móvel). */
    density?: WorkspacePickerDensity
}

function WorkspacePickerWorkspaceRow({
    workspace,
    isActive,
    comfortable,
    itemRowClass,
    markClass,
    labelClass,
    onPick,
}: {
    workspace: Workspace
    isActive: boolean
    comfortable: boolean
    itemRowClass: string
    markClass: string
    labelClass: string
    onPick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onPick}
            aria-current={isActive ? "true" : undefined}
            className={cn(
                pickerRowInteractiveClass,
                itemRowClass,
                isActive &&
                    "bg-primary/10 ring-1 ring-inset ring-primary/20 hover:bg-primary/15 hover:text-accent-foreground dark:bg-primary/15 dark:ring-primary/30 dark:hover:bg-primary/20",
            )}
        >
            <WorkspaceBrandMark
                iconKey={workspace.icon}
                backgroundColor={workspace.icon_background_color}
                className={markClass}
                iconClassName={comfortable ? "size-5" : undefined}
            />
            <span className={labelClass}>{workspace.name}</span>
            {isActive ? (
                <span
                    className={cn(
                        "flex shrink-0 items-center justify-center",
                        comfortable ? "size-9" : "size-7",
                    )}
                    aria-hidden
                >
                    <CheckIcon
                        className={comfortable ? "size-5 text-primary" : "size-4 text-primary"}
                        aria-hidden
                    />
                </span>
            ) : null}
        </button>
    )
}

export function WorkspacePickerMenuBody({
    callbacks,
    className,
    density = "default",
}: WorkspacePickerMenuBodyProps) {
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

    const comfortable = density === "comfortable"

    const ownedWorkspaces = React.useMemo(
        () => workspaces.filter((w) => workspaceRoleById[w.id] === "owner"),
        [workspaces, workspaceRoleById]
    )
    const memberWorkspaces = React.useMemo(
        () => workspaces.filter((w) => workspaceRoleById[w.id] !== "owner"),
        [workspaces, workspaceRoleById]
    )

    const showSharedSection =
        !loading && workspaces.length > 0 && memberWorkspaces.length > 0

    const itemRowClass = cn(
        "gap-2 rounded-md",
        comfortable ? "min-h-12 gap-3 rounded-lg px-3 py-3" : "px-2 py-2"
    )
    const markClass = comfortable
        ? "size-9 shrink-0 rounded-lg"
        : "size-7 shrink-0 rounded-md"
    const labelClass = comfortable
        ? "min-w-0 flex-1 truncate text-left text-base font-medium"
        : "min-w-0 flex-1 truncate text-left text-sm font-medium"
    const placeholderClass = comfortable
        ? "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/80 text-muted-foreground"
        : "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-sidebar text-sidebar-foreground"
    const plusBoxClass = comfortable
        ? workspaceRowIconBoxClassComfortable
        : workspaceRowIconBoxClassDefault
    const plusGlyphClass = comfortable ? "size-5" : "size-4"
    /** Padding horizontal só no conteúdo; separadores ficam largura total do dropdown. */
    const insetX = comfortable ? "px-3" : "px-2"
    const sectionTitleClass = cn(
        comfortable
            ? "pb-2 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            : "pb-2 pt-1 text-xs font-medium text-muted-foreground",
        insetX
    )
    const inviteScrollMax = comfortable ? "max-h-[50vh]" : "max-h-[10rem]"
    const ownedScrollMax = showSharedSection
        ? comfortable
            ? "max-h-[50vh]"
            : "max-h-[11rem]"
        : comfortable
          ? "max-h-[55vh]"
          : "max-h-[18rem]"
    const sharedScrollMax = comfortable ? "max-h-[50vh]" : "max-h-[11rem]"
    const disabledRowClass = comfortable ? "h-12 min-h-12" : "h-10"

    function pickWorkspace(id: string) {
        void setCurrentWorkspaceId(id)
        callbacks.closePicker()
        callbacks.afterWorkspaceChosen?.()
    }

    return (
        <div className={cn("overflow-hidden rounded-xl py-2", className)}>
            {loading ? null : pendingWorkspaceInvites.length > 0 ? (
                <>
                    <p className={sectionTitleClass}>Convites</p>
                    <div
                        className={cn(
                            "overflow-y-auto py-1",
                            insetX,
                            inviteScrollMax
                        )}
                    >
                        {pendingWorkspaceInvites.map((inv) => {
                            const w = inv.workspace
                            const token = inv.token_raw?.trim()
                            if (!token) return null
                            return (
                                <Link
                                    key={inv.id}
                                    href={`/invites/accept?token=${encodeURIComponent(token)}`}
                                    onClick={() => callbacks.closePicker()}
                                    className={cn(
                                        pickerRowInteractiveClass,
                                        itemRowClass,
                                        "flex items-center"
                                    )}
                                >
                                    {w ? (
                                        <WorkspaceBrandMark
                                            iconKey={w.icon}
                                            backgroundColor={w.icon_background_color}
                                            className={markClass}
                                            iconClassName={comfortable ? "size-5" : undefined}
                                        />
                                    ) : (
                                        <div className={placeholderClass}>
                                            <span className="text-xs font-semibold">?</span>
                                        </div>
                                    )}
                                    <span className={labelClass}>{w?.name ?? "Convite"}</span>
                                    <Badge
                                        variant="secondary"
                                        className="shrink-0 px-1.5 py-0 text-[0.6rem]"
                                    >
                                        Convite
                                    </Badge>
                                </Link>
                            )
                        })}
                    </div>
                    <Separator className="my-2 w-full shrink-0 bg-border" decorative />
                </>
            ) : null}

            <p className={sectionTitleClass}>Minhas carteiras</p>

            <div
                className={cn(
                    "overflow-y-auto py-1",
                    insetX,
                    ownedScrollMax
                )}
            >
                {loading ? (
                    <div className="space-y-2 py-1" aria-busy="true">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex items-center gap-2 rounded-md px-2",
                                    comfortable ? "py-3" : "py-2"
                                )}
                            >
                                <Skeleton
                                    className={cn(
                                        "shrink-0 rounded-md",
                                        comfortable ? "size-9 rounded-lg" : "size-7"
                                    )}
                                />
                                <Skeleton
                                    className={cn(
                                        "min-w-0 flex-1",
                                        comfortable ? "h-5" : "h-4"
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                ) : workspaces.length > 0 ? (
                    <>
                        {ownedWorkspaces.length > 0 ? (
                            ownedWorkspaces.map((workspace) => {
                                const isActive = workspace.id === currentWorkspaceId
                                return (
                                    <WorkspacePickerWorkspaceRow
                                        key={workspace.id}
                                        workspace={workspace}
                                        isActive={isActive}
                                        comfortable={comfortable}
                                        itemRowClass={itemRowClass}
                                        markClass={markClass}
                                        labelClass={labelClass}
                                        onPick={() => pickWorkspace(workspace.id)}
                                    />
                                )
                            })
                        ) : (
                            <div
                                className={cn(
                                    pickerRowInteractiveClass,
                                    itemRowClass,
                                    disabledRowClass,
                                    "pointer-events-none justify-start text-muted-foreground opacity-50"
                                )}
                                role="status"
                            >
                                Nenhuma carteira própria
                            </div>
                        )}
                    </>
                ) : (
                    <div
                        className={cn(
                            pickerRowInteractiveClass,
                            itemRowClass,
                            disabledRowClass,
                            "pointer-events-none justify-start text-muted-foreground opacity-50"
                        )}
                        role="status"
                    >
                        Nenhuma carteira encontrada
                    </div>
                )}
            </div>

            {showSharedSection ? (
                <>
                    <Separator className="my-2 w-full shrink-0 bg-border" decorative />
                    <p className={sectionTitleClass}>Compartilhados comigo</p>
                    <div
                        className={cn(
                            "overflow-y-auto py-1",
                            insetX,
                            sharedScrollMax
                        )}
                    >
                        {memberWorkspaces.map((workspace) => {
                            const isActive = workspace.id === currentWorkspaceId
                            return (
                                <WorkspacePickerWorkspaceRow
                                    key={workspace.id}
                                    workspace={workspace}
                                    isActive={isActive}
                                    comfortable={comfortable}
                                    itemRowClass={itemRowClass}
                                    markClass={markClass}
                                    labelClass={labelClass}
                                    onPick={() => pickWorkspace(workspace.id)}
                                />
                            )
                        })}
                    </div>
                </>
            ) : null}

            {error ? (
                <div
                    role="alert"
                    className={cn(
                        "mt-1 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-2",
                        insetX
                    )}
                >
                    <p className="text-xs font-medium text-destructive">
                        Não foi possível concluir esta ação
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">{error}</p>
                    <button
                        type="button"
                        className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => void refreshWorkspaces()}
                    >
                        Tentar novamente
                    </button>
                </div>
            ) : null}

            <Separator className="my-2 w-full shrink-0 bg-border" decorative />
            <div className={cn("py-1", insetX)}>
                <button
                    type="button"
                    onClick={() => {
                        callbacks.closePicker()
                        callbacks.openCreateDialog()
                    }}
                    className={cn(pickerRowInteractiveClass, itemRowClass)}
                >
                    <span className={plusBoxClass}>
                        <PlusIcon className={plusGlyphClass} />
                    </span>
                    <span
                        className={cn(
                            "flex-1 text-muted-foreground",
                            comfortable && "text-base"
                        )}
                    >
                        Criar carteira
                    </span>
                </button>
            </div>
        </div>
    )
}
