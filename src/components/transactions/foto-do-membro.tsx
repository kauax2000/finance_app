import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { identityToneFor } from "@/lib/avatar"
import type { MemberDirectoryRow } from "@/lib/queries/use-member-directory"
import { cn, getInitials } from "@/lib/utils"

/** A foto do membro (ou as iniciais no tom dele) no degrau `xs` (ou `2xs`, do tamanho do texto), como o `QuemLancou` da lista. */
export function FotoDoMembro({ membro, size = "xs" }: { membro: MemberDirectoryRow; size?: "2xs" | "xs" }) {
    const nome = membro.full_name || membro.email
    const tom = identityToneFor(membro.avatar_color, membro.email || nome)
    return (
        <Avatar size={size} aria-hidden>
            {membro.avatar_url ? <AvatarImage src={membro.avatar_url} alt="" /> : null}
            <AvatarFallback className={cn("font-semibold", tom.surface, tom.ink)}>{getInitials(nome)}</AvatarFallback>
        </Avatar>
    )
}
