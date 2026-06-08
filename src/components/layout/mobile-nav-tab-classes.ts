import { cn } from "@/lib/utils"

/** Island tab slot — fills an equal quarter of the nav row. */
export const mobileNavTabRootClass =
    "group flex h-full w-full min-w-0 items-stretch transition-transform active:scale-[0.98]"

export function mobileNavTabInnerClass(active: boolean) {
    return cn(
        "flex h-full w-full items-center justify-center rounded-xl transition-[background-color,color,transform] duration-300 ease-out motion-reduce:transition-none",
        active
            ? "bg-foreground/10 text-foreground dark:bg-white/12 dark:text-primary-foreground"
            : "text-muted-foreground group-active:text-foreground"
    )
}

export function mobileNavTabIconClass(active: boolean) {
    return cn(
        "size-6 shrink-0",
        active
            ? "text-foreground dark:text-primary-foreground"
            : "text-muted-foreground group-active:text-foreground"
    )
}
