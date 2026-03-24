"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/providers"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { QuickActionButton } from "@/components/quick-actions"
import {
    LayoutDashboard,
    Wallet,
    ArrowLeftRight,
    PieChart,
    Settings,
    EllipsisVertical,
} from "lucide-react"
import { getInitials } from "@/lib/utils"

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/wallets": "Carteiras",
    "/dashboard/transactions": "Transações",
    "/dashboard/categories": "Categorias",
    "/dashboard/settings": "Configurações",
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Carteiras", href: "/dashboard/wallets", icon: Wallet },
    { name: "Transações", href: "/dashboard/transactions", icon: ArrowLeftRight },
    { name: "Categorias", href: "/dashboard/categories", icon: PieChart },
]

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

function UserProfile() {
    const { user } = useAuth()
    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarColor = getAvatarColor(userName)

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <UserMenu>
                    <button className="w-full flex items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 h-12 text-sm">
                        <div className="group/avatar relative flex h-8 w-8 shrink-0 select-none rounded-lg overflow-hidden bg-muted">
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
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-medium">{userName}</span>
                            <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                        </div>
                        <EllipsisVertical className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    </button>
                </UserMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="group-data-[collapsible=icon]:h-12">
                <SidebarMenuButton size="lg" className="h-12 w-full hover:bg-transparent hover:text-sidebar-accent-foreground">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="size-8! shrink-0 text-primary dark:text-white transition-all duration-200"
                    >
                        <path
                            d="M27.8004 6.52056C27.9105 7.06413 27.5571 7.59341 27.0129 7.70023L20.6453 8.95007C18.9288 9.2876 17.5787 10.5992 17.2119 12.2821L16.103 17.363H26.6451C27.1974 17.363 27.6451 17.8107 27.6451 18.363V19.9393C27.6451 20.4916 27.1974 20.9393 26.6451 20.9393H15.3222L14.7012 23.7959C13.4842 29.3797 5.39049 29.4098 4.1305 23.8352C3.3812 20.5144 5.9536 17.363 9.41364 17.363H12.3857L13.6588 11.532C14.3292 8.45614 16.7938 6.06486 19.9311 5.44795L26.3144 4.19201C26.8542 4.0858 27.3784 4.43558 27.4876 4.97481L27.8004 6.52056ZM9.41364 20.9393C8.27769 20.9393 7.43279 21.973 7.67921 23.0632C8.09367 24.8914 10.7479 24.8815 11.1481 23.0501L11.6094 20.9393H9.41364Z"
                            fill="currentColor"
                        />
                    </svg>
                    <span className="text-lg font-semibold whitespace-nowrap group-data-[collapsible=icon]:hidden">
                        Finance App
                    </span>
                </SidebarMenuButton>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup className="justify-start">
                    <QuickActionButton />
                </SidebarGroup>
                <SidebarGroup className="mt-2">
                    <SidebarMenu className="gap-2">
                        {navigation.map((item) => (
                            <SidebarMenuItem key={item.name}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                >
                                    <Link href={item.href} className="gap-3">
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        <span className="group-data-[collapsible=icon]:hidden">
                                            {item.name}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="mt-auto">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/dashboard/settings"}
                            >
                                <Link href="/dashboard/settings" className="gap-3">
                                    <Settings className="h-5 w-5 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        Configurações
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <UserProfile />
            </SidebarFooter>
        </Sidebar>
    )
}
