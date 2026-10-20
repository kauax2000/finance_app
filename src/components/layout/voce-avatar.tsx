"use client"

import { useAuth } from "@/components/providers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { identityToneFor } from "@/lib/avatar"
import { cn, getInitials } from "@/lib/utils"

/**
 * O avatar da pessoa na aba Você (`xs`, o glifo de 24) e no topo da página
 * Você (`xl`). O nome e o tom são os do Minha conta. Enquanto o perfil não
 * chegou, o círculo neutro sem letras: nunca um esqueleto — a rodada 278 tirou
 * o avatar da barra justamente pelo esqueleto que piscava a cada carga.
 */
export function VoceAvatar({ size }: { size: "xs" | "xl" }) {
    const { user, profile, loading, profileReady } = useAuth()
    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const avatarTone = identityToneFor(profile?.avatar_color, user?.email || userName)
    const pronto = !loading && Boolean(user) && profileReady
    const avatarUrl: string | undefined = user?.user_metadata?.avatar_url

    return (
        // Na aba o nome já é "Você": o avatar é só o desenho.
        <Avatar size={size} className="shrink-0" aria-hidden={size === "xs" ? true : undefined}>
            {pronto && avatarUrl ? <AvatarImage src={avatarUrl} alt={userName} /> : null}
            {pronto ? (
                <AvatarFallback className={cn("font-semibold", avatarTone.surface, avatarTone.ink)}>
                    {getInitials(userName)}
                </AvatarFallback>
            ) : (
                <AvatarFallback className="bg-muted" />
            )}
        </Avatar>
    )
}
