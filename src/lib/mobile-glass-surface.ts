import { cn } from "@/lib/utils"

/**
 * O vidro da barra de baixo do telefone (a ilha da `BottomBar`).
 *
 * O arquivo tinha também o casco, as linhas e os separadores dos dois menus da
 * barra — o "+ Adicionar" e o menu da conta —, escritos à mão sobre um
 * `DropdownMenu` e um `Popover`. Os dois viraram `Drawer` na rodada 212 e as
 * constantes ficaram sem consumidor; saíram.
 */
export const MOBILE_GLASS_SURFACE_CLASSNAME = cn(
    "mobile-glass-surface shadow-lg ring-1 ring-foreground/10"
)
