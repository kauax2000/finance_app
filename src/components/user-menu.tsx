"use client"

import { useAuth } from "@/components/providers"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sparkles,
    BadgeCheck,
    CreditCard,
    LogOut,
    User,
    Settings,
} from "lucide-react"
import Link from "next/link"
import { getInitials } from "@/lib/utils"

const avatarColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
]

function getAvatarColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % avatarColors.length
    return avatarColors[index]
}

interface UserMenuProps {
    children: React.ReactNode
}

export function UserMenu({ children }: UserMenuProps) {
    const { user, signOut } = useAuth()

    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarColor = getAvatarColor(userName)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={4}>
                {/* Informações do usuário (topo) */}
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-muted">
                            {user?.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt={userName}
                                    className="aspect-square size-full object-cover"
                                />
                            ) : (
                                <div className={`flex h-full w-full items-center justify-center text-white text-sm font-medium ${avatarColor}`}>
                                    {getInitials(userName)}
                                </div>
                            )}
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{userName}</span>
                            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Informações de conta */}
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                    <Link href="/account">
                        <BadgeCheck className="h-4 w-4" />
                        <span className="flex-1">Minha conta</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                    <Link href="/plans">
                        <CreditCard className="h-4 w-4" />
                        <span className="flex-1">Planos e pagamentos</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Sair do app */}
                <DropdownMenuItem
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950"
                    onClick={() => signOut()}
                >
                    <LogOut className="h-4 w-4" />
                    <span className="flex-1">Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
