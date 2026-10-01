"use client"

import { useRouter } from "next/navigation"
import {
    ArrowRightIcon,
    ArrowTopRightOnSquareIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/16/solid"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuHeader,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

/**
 * O botão direito (e o toque longo) num cartão de categoria: as ações do
 * menu de três pontos, mais abrir. O cartão é um link esticado, e o menu
 * toma o lugar do menu do navegador sobre ele — por isso "Abrir em nova
 * aba" está aqui. O menu de três pontos continua: este é atalho.
 */
export function CategoryCardContextMenu({
    name,
    description,
    href,
    onEdit,
    onDelete,
    children,
}: {
    name: string
    description?: string
    href: string
    onEdit: () => void
    onDelete: () => void
    children: React.ReactNode
}) {
    const router = useRouter()
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent
                size="xl"
                header={<ContextMenuHeader title={name} description={description} />}
            >
                <ContextMenuItem onSelect={() => router.push(href)}>
                    <ArrowRightIcon aria-hidden />
                    Abrir
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() => window.open(href, "_blank", "noopener")}
                >
                    <ArrowTopRightOnSquareIcon aria-hidden />
                    Abrir em nova aba
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={onEdit}>
                    <PencilIcon aria-hidden />
                    Editar
                </ContextMenuItem>
                <ContextMenuItem variant="destructive" onSelect={onDelete}>
                    <TrashIcon aria-hidden />
                    Excluir
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
