"use client"

import { createElement, useRef, useState } from "react"
import { useAuth } from "@/components/providers"
import { toastError } from "@/lib/toast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowRightStartOnRectangleIcon, UserCircleIcon } from "@heroicons/react/16/solid"
import Link from "next/link"
import { EditProfileDialog } from "@/components/account/edit-profile-dialog"
import { ACCOUNT_MENU_LINK_ITEMS } from "@/components/layout/account-menu-links"
import { ROUTES } from "@/config/navigation"
import { microIconFor } from "@/config/mobile-navigation"
import { useWorkspace } from "@/components/workspace-provider"
import { itensDeNavegacaoPara } from "@/lib/papeis/rotas-do-convidado"

interface UserMenuProps {
    children: React.ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
    const { signOut } = useAuth()
    const { papel } = useWorkspace()
    const [editarAberto, setEditarAberto] = useState(false)
    const gatilhoRef = useRef<HTMLButtonElement>(null)

    // O Radix só devolve o foco ao gatilho quando o menu fecha; o diálogo abre depois, então o devolvemos ao fechá-lo.
    const aoMudarEditar = (aberto: boolean) => {
        setEditarAberto(aberto)
        if (!aberto) requestAnimationFrame(() => gatilhoRef.current?.focus())
    }

    // A lista do papel (Bloco 7A): Planos vale para todos.
    const dropdownLinkItems = itensDeNavegacaoPara(papel, ACCOUNT_MENU_LINK_ITEMS).filter(
        ({ href }) =>
            href !== ROUTES.SETTINGS && href !== ROUTES.MEMBERS
    )

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild ref={gatilhoRef}>
                    {children}
                </DropdownMenuTrigger>
                {/* 4px do botão (sem encostar nele) e por cima da borda da placa — o
                    botão fica 8 para dentro dela aberta e 16 recolhida. Encostado e
                    alinhado à borda, lia como parte do fundo. */}
                <DropdownMenuContent
                    size="xl"
                    align="end"
                    side="right"
                    sideOffset={4}
                >
                    {/* As páginas da conta e, por último, sair. Sem cabeçalho de identidade:
                        o nome e o e-mail já estão no botão que abre o menu, logo ao lado.
                        "Sair" em vermelho, por escolha do dono, como na gaveta do telefone.
                        Editar perfil abre o diálogo no lugar, como o lápis da foto em Você. */}
                    <DropdownMenuItem onSelect={() => setEditarAberto(true)}>
                        <UserCircleIcon />
                        Editar perfil
                    </DropdownMenuItem>
                    {dropdownLinkItems.map(({ href, label, icon }) => (
                        <DropdownMenuItem key={href} asChild>
                            <Link href={href}>
                                {createElement(microIconFor(icon) ?? icon)}
                                {label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={async () => {
                        const { error } = await signOut()
                        if (error) toastError(error)
                    }}>
                        <ArrowRightStartOnRectangleIcon />
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {/* Fora do menu: ele fecha ao escolher, e o diálogo fica. */}
            <EditProfileDialog open={editarAberto} onOpenChange={aoMudarEditar} />
        </>
    )
}
