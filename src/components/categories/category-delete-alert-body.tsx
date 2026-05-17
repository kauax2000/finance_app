/** Shared copy for “Excluir categoria?” confirmations (grid + detail). */
export function CategoryDeleteAlertBody({ categoryName }: { categoryName: string }) {
    return (
        <div className="space-y-2 text-sm text-muted-foreground">
            <p>Esta ação não pode ser desfeita.</p>
            <p className="text-foreground">
                A categoria <span className="font-medium">“{categoryName}”</span> será removida.
            </p>
            <ul className="list-inside list-disc space-y-1 text-foreground">
                <li>
                    Receitas e despesas que usavam esta categoria permanecem no extrato, mas ficam sem
                    categoria até você escolher outra.
                </li>
                <li>Orçamentos definidos para esta categoria serão removidos.</li>
            </ul>
        </div>
    )
}
