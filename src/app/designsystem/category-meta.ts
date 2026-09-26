import {
  CubeIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  SwatchIcon,
  WindowIcon,
} from "@heroicons/react/16/solid"
import type { Category } from "./ds-doc"

/**
 * O ícone e o nome em português de cada camada.
 *
 * O ícone serve a paleta (`ds-search`, em `size-4`) e o título da navegação
 * lateral (`ds-shell`, em `size-3`) — os dois corpos são o micro, por isso o
 * conjunto é `16/solid` mesmo sendo um mapa. O `label` não aparece na tela:
 * ele alimenta as `keywords` da linha de camada, para "átomo" e "organismos"
 * casarem numa busca que fala inglês na navegação.
 *
 * `tint` é a parada do arco-íris que pinta o escopo da paleta quando a camada
 * é escolhida — uma por camada, na ordem do degradê, pulando âmbar e lima,
 * que a luz fixa do tema claro não segura. Por decisão do dono.
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
