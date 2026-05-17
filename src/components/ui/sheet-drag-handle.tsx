export function SheetDragHandle() {
  return (
    <div
      data-slot="sheet-drag-handle"
      className="flex shrink-0 justify-center pt-2.5 pb-2"
      aria-hidden
    >
      <div className="h-1.5 w-12 rounded-full bg-muted-foreground/35" />
    </div>
  )
}
