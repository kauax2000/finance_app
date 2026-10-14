"use client"

import * as React from "react"
import { ChevronUpDownIcon } from "@heroicons/react/16/solid"
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

export function WorkspaceSwitcher({
    appearance = "sidebar",
}: {
    appearance?: "sidebar" | "header"
}) {
    const { currentWorkspace, loading } = useWorkspace()

    const [menuOpen, setMenuOpen] = React.useState(false)
    const [createOpen, setCreateOpen] = React.useState(false)

    const trigger =
        appearance === "header" ? (
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="tertiary"
                    size="icon-md"
                    aria-haspopup="menu"
                    aria-label="Trocar carteira"
                    className={cn(
                        "w-auto min-w-8 shrink-0 gap-1.5 px-1 font-normal",
                        "[--button-hover-fill:color-mix(in_oklab,var(--accent)_80%,transparent)] dark:[--button-hover-fill:color-mix(in_oklab,var(--accent)_80%,transparent)] group-active:[--button-hover:1]",
                    )}
                >
                    {loading ? (
                        <Skeleton className="size-6 shrink-0 rounded-md" />
                    ) : currentWorkspace ? (
                        <WorkspaceBrandMark
                            iconKey={currentWorkspace.icon}
                            backgroundColor={
                                currentWorkspace.icon_background_color
                            }
                            className="size-6 shrink-0 rounded-md"
                            iconClassName="size-3"
                        />
                    ) : (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <span className="text-2xs font-semibold">?</span>
                        </div>
                    )}
                    {loading ? (
                        <Skeleton className="size-3 shrink-0 rounded-sm" />
                    ) : (
                        <ChevronUpDownIcon className="size-3 shrink-0 text-muted-foreground" />
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
            {/* Na barra: 8 do recuo da placa flutuante + 8 de calha. */}
            <DropdownMenuContent
                side={appearance === "header" ? "bottom" : "right"}
                align="start"
                sideOffset={appearance === "header" ? 8 : 16}
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
                <div className="flex shrink-0">{menu}</div>
            ) : (
                <SidebarHeader className="min-w-0">
                    {menu}
                </SidebarHeader>
            )}
        </>
    )
}
