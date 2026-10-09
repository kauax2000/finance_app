"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Toolbar,
    ToolbarActions,
    ToolbarFilterButton,
    ToolbarFilters,
} from "@/components/ui/toolbar"
import {
    ArrowsUpDownIcon,
    FunnelIcon,
    PlusIcon,
} from "@heroicons/react/16/solid"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Menubar,
    MenubarContent,
    MenubarMenu,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarTrigger,
} from "@/components/ui/menubar"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  DialogBody,
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"

export type BillsPageMode = "pending" | "bills"

export type BillsPendingFilter = "all" | "overdue" | "soon"

export type BillsModelFilter = "all" | "active" | "inactive"

export type BillsSortKey = "due_date" | "amount" | "name"

export type BillsSortDir = "asc" | "desc"

const MODE_TABS: { value: BillsPageMode; label: string }[] = [
    { value: "bills", label: "Contas" },
    { value: "pending", label: "Pendentes" },
]

const PENDING_FILTER: { value: BillsPendingFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "overdue", label: "Atrasadas" },
    { value: "soon", label: "Próximos 30 dias" },
]

const MODEL_FILTER: { value: BillsModelFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Ativas" },
    { value: "inactive", label: "Inativas" },
]

function sortSummaryLabel(
    mode: BillsPageMode,
    key: BillsSortKey,
    dir: BillsSortDir
): string {
    if (key === "name")
        return `Nome (${dir === "asc" ? "A–Z" : "Z–A"})`
    if (key === "due_date")
        return `Vencimento (${dir === "asc" ? "mais antigo primeiro" : "mais recente primeiro"})`
    return `Valor (${dir === "asc" ? "menor primeiro" : "maior primeiro"})`
}

function filtersActive(
    mode: BillsPageMode,
    pendingFilter: BillsPendingFilter,
    modelFilter: BillsModelFilter
): boolean {
    if (mode === "pending") return pendingFilter !== "all"
    return modelFilter !== "all"
}

function sortOptionsForMode(mode: BillsPageMode): readonly (readonly [BillsSortKey, BillsSortDir])[] {
    if (mode === "bills") {
        return [
            ["name", "asc"],
            ["name", "desc"],
            ["amount", "desc"],
            ["amount", "asc"],
        ] as const
    }
    return [
        ["due_date", "asc"],
        ["due_date", "desc"],
        ["amount", "desc"],
        ["amount", "asc"],
    ] as const
}

type BillsToolbarProps = {
    mode: BillsPageMode
    onModeChange: (m: BillsPageMode) => void
    pendingFilter: BillsPendingFilter
    onPendingFilterChange: (f: BillsPendingFilter) => void
    modelFilter: BillsModelFilter
    onModelFilterChange: (f: BillsModelFilter) => void
    sortKey: BillsSortKey
    sortDir: BillsSortDir
    onSortChange: (key: BillsSortKey, dir: BillsSortDir) => void
    onNewBill: () => void
    hasTable: boolean
    filtersSheetOpen?: boolean
    onFiltersSheetOpenChange?: (open: boolean) => void
    mobileFiltersTrigger?: "toolbar" | "external"
}

export function BillsToolbar({
    mode,
    onModeChange,
    pendingFilter,
    onPendingFilterChange,
    modelFilter,
    onModelFilterChange,
    sortKey,
    sortDir,
    onSortChange,
    onNewBill,
    hasTable,
    filtersSheetOpen,
    onFiltersSheetOpenChange,
    mobileFiltersTrigger = "toolbar",
}: BillsToolbarProps) {
    const [internalSheetOpen, setInternalSheetOpen] = React.useState(false)
    const sheetControlled =
        typeof filtersSheetOpen === "boolean" &&
        typeof onFiltersSheetOpenChange === "function"
    const sheetOpen = sheetControlled ? filtersSheetOpen : internalSheetOpen
    const setSheetOpen = sheetControlled ? onFiltersSheetOpenChange! : setInternalSheetOpen

    const active = filtersActive(mode, pendingFilter, modelFilter)
    const sortOpts = sortOptionsForMode(mode)

    return (
        <>
            {/* Presa sob a barra do topo enquanto a lista rola; a placa
                atravessa a calha da página (16px no telefone, 24 a partir de
                `md`, a da casca do app). */}
            <Toolbar
                sticky
                className="[--toolbar-bleed:--spacing(4)] md:[--toolbar-bleed:--spacing(6)]"
            >
                <ToolbarFilters className="max-w-full shrink-0 flex-none">
                    {/* Aba, e não filtro: ela troca o cartão da tela e reseta o
                        eixo de ordenação. O `Tabs` de fábrica (a pílula
                        `floating`) substituiu o trilho que estava aqui à mão,
                        com foco itinerante e o marcador que viaja. */}
                    <Tabs
                        value={mode}
                        onValueChange={(next) =>
                            onModeChange(next as BillsPageMode)
                        }
                        className={cn(
                            "w-fit max-w-full shrink-0",
                            !hasTable && "pointer-events-none opacity-50"
                        )}
                    >
                        <TabsList aria-label="Modo de visualização">
                            {MODE_TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    disabled={!hasTable}
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    <Badge
                        size="xs"
                        className="shrink-0"
                    >
                        Beta
                    </Badge>
                </ToolbarFilters>

                {/* Uma árvore só. No telefone, o botão de filtros abre a folha
                    (filtrar e ordenar juntos) — quando a tela não o põe na
                    barra do topo (`external`); a partir de `md`, a barra de
                    menus filtra e ordena: o rádio marca a opção valendo e o
                    cabeçalho do painel a repete. */}
                <ToolbarActions className="min-w-0">
                    {mobileFiltersTrigger === "toolbar" ? (
                        <ToolbarFilterButton
                            type="button"
                            label="Filtros e ordenação"
                            count={active ? 1 : 0}
                            className="md:hidden"
                            onClick={() => setSheetOpen(true)}
                            disabled={!hasTable}
                        />
                    ) : null}
                    <Menubar
                        size="sm"
                        aria-label="Filtrar e ordenar"
                        className="max-md:hidden"
                    >
                        <MenubarMenu value="filtrar">
                            <MenubarTrigger
                                icon={<FunnelIcon aria-hidden />}
                                chevron
                                count={active ? 1 : undefined}
                                disabled={!hasTable}
                            >
                                Filtrar
                            </MenubarTrigger>
                            <MenubarContent title="Filtrar">
                                {mode === "pending" ? (
                                    <MenubarRadioGroup
                                        value={pendingFilter}
                                        onValueChange={(v) =>
                                            onPendingFilterChange(v as BillsPendingFilter)
                                        }
                                    >
                                        {PENDING_FILTER.map((f) => (
                                            <MenubarRadioItem key={f.value} value={f.value}>
                                                {f.label}
                                            </MenubarRadioItem>
                                        ))}
                                    </MenubarRadioGroup>
                                ) : (
                                    <MenubarRadioGroup
                                        value={modelFilter}
                                        onValueChange={(v) =>
                                            onModelFilterChange(v as BillsModelFilter)
                                        }
                                    >
                                        {MODEL_FILTER.map((f) => (
                                            <MenubarRadioItem key={f.value} value={f.value}>
                                                {f.label}
                                            </MenubarRadioItem>
                                        ))}
                                    </MenubarRadioGroup>
                                )}
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu value="ordenar">
                            <MenubarTrigger
                                icon={<ArrowsUpDownIcon aria-hidden />}
                                chevron
                                disabled={!hasTable}
                            >
                                Ordenar
                            </MenubarTrigger>
                            <MenubarContent title="Ordenar">
                                <MenubarRadioGroup
                                    value={`${sortKey}-${sortDir}`}
                                    onValueChange={(v) => {
                                        const [k, d] = v.split("-") as [BillsSortKey, BillsSortDir]
                                        onSortChange(k, d)
                                    }}
                                >
                                    {sortOpts.map(([k, d]) => (
                                        <MenubarRadioItem key={`${k}-${d}`} value={`${k}-${d}`}>
                                            {sortSummaryLabel(mode, k, d)}
                                        </MenubarRadioItem>
                                    ))}
                                </MenubarRadioGroup>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={onNewBill}
                        disabled={!hasTable}
                    >
                        <PlusIcon aria-hidden />
                        Nova conta
                    </Button>
                </ToolbarActions>
            </Toolbar>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent
                    side="bottom"
                    variant="flush"
                    fillMobileViewport
                    className="flex w-full flex-col gap-4 rounded-t-modal pt-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
                >
                    <DialogHeader>
                        <DialogTitle>Filtros e ordenação</DialogTitle>
                        <DialogDescription>
                            Ajuste o que aparece na lista e a ordem dos itens.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                    <div className="space-y-6 pb-2">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Filtrar
                            </p>
                            <div className="grid gap-2">
                                {mode === "pending"
                                    ? PENDING_FILTER.map((f) => (
                                          <Button
                                              key={f.value}
                                              type="button"
                                              variant={
                                                  pendingFilter === f.value
                                                      ? "secondary"
                                                      : "outline"
                                              }
                                              size="sm"
                                              className="h-10 justify-start text-sm"
                                              onClick={() =>
                                                  onPendingFilterChange(f.value)
                                              }
                                          >
                                              {f.label}
                                          </Button>
                                      ))
                                    : MODEL_FILTER.map((f) => (
                                          <Button
                                              key={f.value}
                                              type="button"
                                              variant={
                                                  modelFilter === f.value
                                                      ? "secondary"
                                                      : "outline"
                                              }
                                              size="sm"
                                              className="h-10 justify-start text-sm"
                                              onClick={() =>
                                                  onModelFilterChange(f.value)
                                              }
                                          >
                                              {f.label}
                                          </Button>
                                      ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Ordenar por
                            </p>
                            <div className="grid gap-2">
                                {sortOpts.map(([k, d]) => (
                                    <Button
                                        key={`${k}-${d}`}
                                        type="button"
                                        variant={
                                            sortKey === k && sortDir === d
                                                ? "secondary"
                                                : "outline"
                                        }
                                        size="sm"
                                        className="h-10 justify-start text-sm"
                                        onClick={() => onSortChange(k, d)}
                                    >
                                        {sortSummaryLabel(mode, k, d)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="xl" className="w-full"
                            onClick={() => setSheetOpen(false)}
                        >
                            Concluir
                        </Button>
                    </div>
                    </DialogBody>
                <DialogCloseButton />
                </SheetContent>
            </Sheet>
        </>
    )
}
