"use client"
/* eslint-disable @next/next/no-img-element -- menu avatar from user metadata URL */

import { useAuth } from "@/components/providers"
import { getAvatarColor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

type AccountMenuUserSummaryProps = {
    className?: string
}

export function AccountMenuUserSummary({ className }: AccountMenuUserSummaryProps) {
    const { user, profile, profileReady } = useAuth()

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarColor =
        profile?.avatar_color?.trim() ||
        (user?.email ? getAvatarColor(user.email) : getAvatarColor(userName))

    return (
        <div
            className={cn(
                "flex items-center gap-3 border-b border-border/60 px-2.5 pb-2.5 pt-2 text-left",
                className
            )}
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {user?.user_metadata?.avatar_url ? (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt={userName}
                        className="aspect-square size-full object-cover"
                    />
                ) : !profileReady ? (
                    <div
                        className="h-full w-full animate-pulse bg-muted"
                        aria-hidden
                    />
                ) : (
                    <div
                        className={`flex h-full w-full items-center justify-center text-sm font-medium text-white ${avatarColor}`}
                    >
                        {getInitials(userName)}
                    </div>
                )}
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                </span>
            </div>
        </div>
    )
}
