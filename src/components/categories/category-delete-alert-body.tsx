import { AlertDialogList } from "@/components/ui/alert-dialog"

/**
 * O texto das confirmações "Excluir categoria?" (grade e detalhe). Vai dentro
 * da `AlertDialogDescription`, que é um `<div>` e já afasta os parágrafos.
 */
export function CategoryDeleteAlertBody({ categoryName }: { categoryName: string }) {
    return (
        <>
            <p>Esta ação não pode ser desfeita.</p>
            <p className="text-foreground">
                A categoria <span className="font-medium">“{categoryName}”</span> será removida.
            </p>
            <AlertDialogList>
                <li>
                    Receitas e despesas que usavam esta categoria permanecem no extrato, mas ficam sem
                    categoria até você escolher outra.
                </li>
                <li>Orçamentos definidos para esta categoria serão removidos.</li>
            </AlertDialogList>
        </>
    )
}
