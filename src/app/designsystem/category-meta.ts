import {
  CubeIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  SwatchIcon,
  WindowIcon,
} from "@heroicons/react/16/solid"
import type { Category } from "./ds-doc"

/**
 * O ícone e o nome em português de cada camada. O ícone é `16/solid` (paleta em `size-4`, navegação em `size-3`);
 * o `label` alimenta as `keywords` da linha de camada. `tint` é a parada do arco-íris que pinta o escopo da
 * paleta, pulando âmbar e lima, que a luz fixa do tema claro não segura.
 */
export const CATEGORY_META: Record<
  Category,
  { Icon: typeof CubeIcon; label: string; tint: string }
> = {
  Foundations: { Icon: SwatchIcon, label: "Fundações", tint: "var(--brand-teal)" },
  Atoms: { Icon: CubeIcon, label: "Átomos", tint: "var(--brand-blue)" },
  Molecules: { Icon: Squares2X2Icon, label: "Moléculas", tint: "var(--brand-violet)" },
  Organisms: { Icon: RectangleGroupIcon, label: "Organismos", tint: "var(--brand-magenta)" },
  Templates: { Icon: WindowIcon, label: "Templates", tint: "var(--brand-coral)" },
}
