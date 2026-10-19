"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronUpDownIcon } from "@heroicons/react/16/solid"
import { UserGroupIcon as UserGroupMiniIcon } from "@heroicons/react/20/solid"
import { useWorkspace } from "@/components/workspace-provider"
import { CreateProjectDialog } from "@/components/workspace/create-project-dialog"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { WorkspacePickerMenuBody } from "@/components/layout/workspace-picker-menu-body"
import {
    SidebarHeader,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { isWorkspaceIconKey, WORKSPACE_ICON_MAP_MINI } from "@/lib/workspace-icons"

export function WorkspaceSwitcher({
    appearance = "sidebar",
}: {
    appearance?: "sidebar" | "header"
}) {
    const { currentWorkspace, loading } = useWorkspace()

    const [menuOpen, setMenuOpen] = React.useState(false)
    const [createOpen, setCreateOpen] = React.useState(false)

    // No header (só no telefone) a carteira é o título da barra, como o
    // "Instagram ⌄": o ícone e o nome em branco, sem o ladrilho de cor, e o
    // chevron que diz que abre. O ícone é o mini (20), o do degrau `xl`.
    const IconeDaCarteira =
        currentWorkspace && isWorkspaceIconKey(currentWorkspace.icon)
            ? WORKSPACE_ICON_MAP_MINI[currentWorkspace.icon]
            : UserGroupMiniIcon

    const trigger =
        appearance === "header" ? (
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="tertiary"
                    aria-haspopup="menu"
                    aria-label={`Trocar carteira: ${currentWorkspace?.name ?? "Carteiras"}`}
                    className={cn(
                        "h-11 max-w-full min-w-0 gap-1.5 px-3 text-base font-semibold text-foreground",
                        "[--button-hover-fill:color-mix(in_oklab,var(--accent)_80%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,var(--accent)_80%,transparent)]",
                    )}
                >
                    {loading ? (
                        <Skeleton className="h-5 w-32" />
                    ) : (
                        <>
                            <IconeDaCarteira className="size-5 shrink-0" aria-hidden />
                            <span className="min-w-0 truncate">
                                {currentWorkspace?.name ?? "Carteiras"}
                            </span>
                            <ChevronDownIcon
                                className="size-4 shrink-0 opacity-70 transition-transform duration-(--duration-base) ease-(--ease-out) group-aria-expanded/button:rotate-180"
                                aria-hidden
                            />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
        ) : (
            <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                    {loading ? (
                        <Skeleton shape="tile" size="md" />
                    ) : currentWorkspace ? (
                        <WorkspaceBrandMark
                            iconKey={currentWorkspace.icon}
                            backgroundColor={
                                currentWorkspace.icon_background_color
                            }
                            size="md"
                        />
                    ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-row bg-muted text-muted-foreground">
                            <span className="text-xs font-semibold">?</span>
                        </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                        {loading ? (
                            <Skeleton className="h-4 w-full max-w-36" />
                        ) : (
                            <p className="truncate text-sm font-medium leading-tight">
                                {currentWorkspace?.name ?? "Carteiras"}
                            </p>
                        )}
                    </div>
                    {loading ? (
                        <Skeleton className="size-4 shrink-0 rounded-sm" />
                    ) : (
                        <ChevronUpDownIcon className="text-muted-foreground" />
                    )}
                </SidebarMenuButton>
            </DropdownMenuTrigger>
        )

    const menu = (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            {trigger}
            {/* 4px do botão (sem encostar nele) e por cima da borda da placa — o
                botão fica 8 para dentro dela aberta e 16 recolhida. Encostado e
                alinhado à borda, lia como parte do fundo. */}
            <DropdownMenuContent
                side={appearance === "header" ? "bottom" : "right"}
                // No header o menu brota do centro, sob o título.
                align={appearance === "header" ? "center" : "start"}
                sideOffset={appearance === "header" ? 8 : 4}
                size="xl"
            >
                <WorkspacePickerMenuBody
                    callbacks={{
                        closePicker: () => setMenuOpen(false),
                        openCreateDialog: () => setCreateOpen(true),
                    }}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <>
            <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
            {appearance === "header" ? (
                // Encolhe com a caixa do centro da barra: o nome trunca em vez de
                // passar por cima das ações.
                <div className="flex min-w-0 max-w-full">{menu}</div>
            ) : (
                <SidebarHeader className="min-w-0">
                    {menu}
                </SidebarHeader>
            )}
        </>
    )
}
