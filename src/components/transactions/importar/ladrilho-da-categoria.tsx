import { CategoryIconPreview, normalizeCategoryIcon } from "@/components/categories/category-appearance-fields"
import { ColorTile } from "@/components/ui/color-tile"

/** O ladrilho da categoria (cor e ícone), o mesmo do formulário de lançamento. */
export function LadrilhoDaCategoria({ categoria }: { categoria: { color?: string | null; icon?: string | null } }) {
    return (
        <ColorTile size="xs" color={categoria.color} className="shrink-0">
            <CategoryIconPreview name={normalizeCategoryIcon(categoria.icon)} />
        </ColorTile>
    )
}
