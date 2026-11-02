"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAbasFora } from "@/components/layout/abas-fora"
import { VoceAvatar } from "@/components/layout/voce-avatar"
import { MePageSkeleton } from "@/components/me/me-page-skeleton"
import { NesteCelularGrupo } from "@/components/settings/neste-celular-grupo"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogError,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import {
    Item,
    ItemChevron,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"
import { PageSection, PageSectionHeader, PageSectionTitle } from "@/components/ui/page-section"
import { H2, Muted } from "@/components/ui/typography"
import { getVoceGroups, miniIconFor } from "@/config/mobile-navigation"
import { useIsMobile } from "@/hooks/use-mobile"

export default function MePage() {
    const { user, loading, profileReady, signOut } = useAuth()
    const [saindo, setSaindo] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const grupos = getVoceGroups(useAbasFora(), useWorkspace().papel)
    const isMobile = useIsMobile()
    const esperando = loading || (user && !profileReady)

    // O QR do desktop abre em `#no-celular`, e o grupo só existe depois do esqueleto.
    useEffect(() => {
        if (!esperando) rolarAteAncora(window.location.hash, document)
    }, [esperando])

    const userName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário"
    const userEmail = user?.email || ""

    const sair = async () => {
        setErro(null)
        setSaindo(true)
        const { error } = await signOut()
        // Com sucesso a tela troca para o login; sem, o diálogo fica com o erro.
        if (error) {
            setErro(error)
            setSaindo(false)
        }
    }

    // Como em Minha conta: sem o perfil, o nome e o tom do avatar ainda não são os
    // da pessoa, e a página inteira espera no esqueleto da rota.
    if (esperando) {
        return <MePageSkeleton />
    }

    return (
        <div className="min-w-0 max-w-full space-y-5">
            {/* Não é link: a conta tem a linha dela no grupo Conta. */}
            <div className="flex flex-col items-center gap-3 text-center">
                <VoceAvatar size="xl" />
                {/* Nome sobre e-mail é par de identidade: sem `gap`. */}
                <div className="min-w-0 max-w-full">
                    <H2 className="truncate">{userName}</H2>
                    {userEmail ? <Muted className="truncate">{userEmail}</Muted> : null}
                </div>
            </div>

            {grupos.map((grupo) =>
                grupo.items.length === 0 ? null : (
                    <PageSection key={grupo.id} size="sm">
                        <PageSectionHeader>
                            <PageSectionTitle>{grupo.label}</PageSectionTitle>
                        </PageSectionHeader>
                        <Card padding="none">
                            <ItemGroup variant="divided">
                                {grupo.items.map((item) => {
                                    const Icon = miniIconFor(item.icon) ?? item.icon
                                    return (
                                        <Item key={item.href} variant="flush" interactive asChild className="min-h-12">
                                            <Link href={item.href}>
                                                <ItemMedia variant="icon">
                                                    <Icon className="size-5" aria-hidden />
                                                </ItemMedia>
                                                <ItemContent>
                                                    {/* 16 no toque, como as linhas dos menus (`menu-classes`): o `ItemTitle` para em 14. */}
                                                    <ItemTitle className="pointer-coarse:text-base">
                                                        {item.name}
                                                        {item.beta ? <Badge size="xs">Beta</Badge> : null}
                                                    </ItemTitle>
                                                    {item.description ? <ItemDescription>{item.description}</ItemDescription> : null}
                                                </ItemContent>
                                                <ItemChevron />
                                            </Link>
                                        </Item>
                                    )
                                })}
                            </ItemGroup>
                        </Card>
                    </PageSection>
                ),
            )}

            {isMobile ? <NesteCelularGrupo /> : null}

            {/* Sair limpa a fila offline e a linha fica à vista: pede confirmação. */}
            <AlertDialog
                pending={saindo}
                onOpenChange={(aberto) => {
                    if (!aberto) setErro(null)
                }}
            >
                <Card padding="none">
                    <AlertDialogTrigger asChild>
                        <Item variant="flush" interactive asChild className="min-h-12">
                            <button type="button">
                                <ItemContent className="items-center">
                                    <ItemTitle className="text-destructive pointer-coarse:text-base">Sair</ItemTitle>
                                </ItemContent>
                            </button>
                        </Item>
                    </AlertDialogTrigger>
                </Card>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
                        <AlertDialogDescription>Lançamentos que ainda não sincronizaram serão perdidos.</AlertDialogDescription>
                    </AlertDialogHeader>
                    {erro ? <AlertDialogError>{erro}</AlertDialogError> : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                void sair()
                            }}
                        >
                            Sair
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
