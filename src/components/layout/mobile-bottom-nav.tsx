"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline"

import { usePathname } from "next/navigation"
import { QuickActionButton } from "@/components/layout/quick-actions"
import { MobileAccountMenu } from "@/components/layout/mobile-account-menu"
import {
    BottomBar,
    BottomBarSlot,
    BottomBarTab,
} from "@/components/ui/bottom-bar"
import { useAuth } from "@/components/providers"
import { Skeleton } from "@/components/ui/skeleton"
import {
    getActiveMobileAccountMenuNavItem,
    getMobileNavTabs,
    solidIconFor,
    type MobileAccountMenuNavItem,
} from "@/config/mobile-navigation"
import { isExactPath, ROUTES } from "@/config/navigation"
import { identityToneFor, type IdentityTone } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

function isMobileNavTabActive(pathname: string, href: string): boolean {
    if (href === ROUTES.DASHBOARD_CATEGORIES) {
        return pathname === href || pathname.startsWith(`${href}/`)
    }
    return isExactPath(pathname, href)
}

type MobileAccountMenuSlotContentProps = {
    activeMenuNavItem: MobileAccountMenuNavItem | null
    showEllipsis: boolean
    showSkeleton: boolean
    userName: string
    avatarTone: IdentityTone
    avatarUrl?: string | null
}

/**
 * O conteúdo do slot da conta — quatro estados, e quem os conhece é o app.
 *
 * A troca entrava por `AnimatePresence`, e essa era a **única** linha do
 * repositório que importava `motion` — uma dependência inteira (mais o
 * `framer-motion` que ela arrasta) para um crossfade de 220ms. Aqui ela é a
 * mesma receita que o `Avatar` e o `Popover` já usam: a `key` remonta o nó, e o
 * `animate-in` roda na entrada.
 *
 * A troca é **só de entrada**, e é decisão: sem `AnimatePresence` o que sai
 * teria de ficar na árvore um ciclo para transicionar, e a troca aqui acontece
 * em carregamento e em login — não é um gesto que alguém acompanha.
 *
 * `animation-duration-*` e não `duration-*`: o segundo escreve
 * `transition-duration` junto, que num nó sem transição é declaração morta — a
 * lição que o `Popover` registra.
 */
function MobileAccountMenuSlotContent({
    activeMenuNavItem,
    showEllipsis,
    showSkeleton,
    userName,
    avatarTone,
    avatarUrl,
}: MobileAccountMenuSlotContentProps) {
    const slotKey = showEllipsis
        ? "ellipsis"
        : showSkeleton
          ? "skeleton"
          : activeMenuNavItem
            ? `icon:${activeMenuNavItem.href}`
            : "avatar"

    function renderSlot() {
        if (showEllipsis) {
            return <EllipsisHorizontalIcon className="size-6 shrink-0" aria-hidden />
        }

        if (showSkeleton) {
            return <Skeleton className="size-6 shrink-0 rounded-md" />
        }

        if (activeMenuNavItem) {
            // Quando o slot mostra o ícone de uma rota, aquela rota **está**
            // ativa — então ele preenche, pela mesma regra das abas. Sem isso a
            // barra teria duas gramáticas para o mesmo estado.
            const Icon =
                solidIconFor(activeMenuNavItem.icon) ?? activeMenuNavItem.icon
            return <Icon className="size-6 shrink-0" aria-hidden />
        }

        return (
            <Avatar size="xs" shape="rounded" className="shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={userName} /> : null}
                <AvatarFallback className={cn(avatarTone.surface, avatarTone.ink)}>
                    {getInitials(userName)}
                </AvatarFallback>
            </Avatar>
        )
    }

    return (
        <span
            key={slotKey}
            className="flex animate-in fade-in zoom-in-95 items-center justify-center animation-duration-(--duration-base) ease-(--ease-out)"
        >
            {renderSlot()}
        </span>
    )
}

export function MobileBottomNav() {
    const pathname = usePathname()
    const { user, profile, loading, profileReady } = useAuth()

    const navTabs = getMobileNavTabs()
    const activeMenuNavItem = getActiveMobileAccountMenuNavItem(pathname)

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const avatarTone = identityToneFor(
        profile?.avatar_color,
        user?.email || userName
    )

    const showSkeleton = loading || (user != null && !profileReady)
    const showEllipsis = !user && !loading

    return (
        <BottomBar action={<QuickActionButton variant="fab" />}>
            {navTabs.map((item) => (
                <BottomBarTab
                    key={item.href}
                    href={item.href}
                    label={item.name}
                    icon={item.icon}
                    iconActive={solidIconFor(item.icon)}
                    active={isMobileNavTabActive(pathname, item.href)}
                />
            ))}

            <MobileAccountMenu>
                <BottomBarSlot
                    active={activeMenuNavItem != null}
                    aria-label={
                        activeMenuNavItem?.name ??
                        "Abrir menu da conta e mais opções"
                    }
                >
                    <MobileAccountMenuSlotContent
                        activeMenuNavItem={activeMenuNavItem}
                        showEllipsis={showEllipsis}
                        showSkeleton={showSkeleton}
                        userName={userName}
                        avatarTone={avatarTone}
                        avatarUrl={user?.user_metadata?.avatar_url}
                    />
                </BottomBarSlot>
            </MobileAccountMenu>
        </BottomBar>
    )
}
