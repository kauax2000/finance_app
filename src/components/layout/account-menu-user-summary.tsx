"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers"
import { identityToneFor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

type AccountMenuUserSummaryProps = {
    className?: string
}

export function AccountMenuUserSummary({ className }: AccountMenuUserSummaryProps) {
    const { user, profile, profileReady } = useAuth()

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""
    const avatarTone = identityToneFor(
        profile?.avatar_color,
        user?.email || userName
    )

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-2.5 pb-2.5 pt-2 text-left",
                className
            )}
        >
            <Avatar size="sm" shape="rounded" className="shrink-0">
                {user?.user_metadata?.avatar_url ? (
                    <AvatarImage
                        src={user.user_metadata.avatar_url}
                        alt={userName}
                    />
                ) : null}
                {profileReady ? (
                    <AvatarFallback className={cn(avatarTone.surface, avatarTone.ink)}>
                        {getInitials(userName)}
                    </AvatarFallback>
                ) : (
                    <AvatarFallback className="animate-pulse" aria-hidden />
                )}
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                </span>
            </div>
        </div>
    )
}
