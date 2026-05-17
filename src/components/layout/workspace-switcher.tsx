"use client"

import * as React from "react"
import { ChevronUpDownIcon } from "@heroicons/react/24/outline"
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
                    variant="ghost"
                    size="icon-lg"
                    aria-haspopup="menu"
                    aria-label="Trocar carteira"
                    className={cn(
                        "h-9 w-auto min-w-9 shrink-0 gap-1.5 px-1.5 font-normal",
                        "hover:bg-accent/80 active:bg-accent group-active:bg-accent",
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
                            <span className="text-[10px] font-semibold">?</span>
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
                <SidebarMenuButton
                    size="lg"
                    variant="default"
                    className="h-12 w-full min-w-0 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    {loading ? (
                        <Skeleton className="size-8 shrink-0 rounded-lg" />
                    ) : currentWorkspace ? (
                        <WorkspaceBrandMark
                            iconKey={currentWorkspace.icon}
                            backgroundColor={
                                currentWorkspace.icon_background_color
                            }
                            className="size-8 rounded-lg"
                            iconClassName="size-4"
                        />
                    ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <span className="text-xs font-semibold">?</span>
                        </div>
                    )}
                    <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                        {loading ? (
                            <Skeleton className="h-4 w-[min(100%,9rem)]" />
                        ) : (
                            <p className="truncate text-sm font-medium leading-tight">
                                {currentWorkspace?.name ?? "Carteiras"}
                            </p>
                        )}
                    </div>
                    {loading ? (
                        <Skeleton className="size-4 shrink-0 rounded-sm group-data-[collapsible=icon]:hidden" />
                    ) : (
                        <ChevronUpDownIcon className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    )}
                </SidebarMenuButton>
            </DropdownMenuTrigger>
        )

    const menu = (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            {trigger}
            <DropdownMenuContent
                side={appearance === "header" ? "bottom" : "right"}
                align={appearance === "header" ? "start" : "start"}
                sideOffset={8}
                className="w-64 max-w-[calc(100vw-2rem)] rounded-xl p-0"
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
                <SidebarHeader className="min-w-0 group-data-[collapsible=icon]:h-12">
                    {menu}
                </SidebarHeader>
            )}
        </>
    )
}
