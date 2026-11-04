"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { useAbasFora } from "@/components/layout/abas-fora"
import { EditProfileDialog } from "@/components/account/edit-profile-dialog"
import { SeloDeMembro } from "@/components/account/selo-de-membro"
import { VoceAvatar } from "@/components/layout/voce-avatar"
import { CartaoDaIa } from "@/components/me/cartao-da-ia"
import { descricaoDaLista, iaNaVoce } from "@/components/me/estado-na-voce"
import { MePageSkeleton } from "@/components/me/me-page-skeleton"
import { NesteCelularGrupo } from "@/components/settings/neste-celular-grupo"
import { rolarAteAncora } from "@/components/settings/settings-section"
import { useAuth } from "@/components/providers"
import { useWorkspace } from "@/components/workspace-provider"
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/20/solid"
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
import { ROUTES } from "@/config/navigation"
import { useIasConectadas } from "@/hooks/use-ias-conectadas"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatTransactionMonthYearPtBr } from "@/lib/transaction-date"

export default function MePage() {
    const { user, loading, profileReady, signOut } = useAuth()
    const [saindo, setSaindo] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [editarAberto, setEditarAberto] = useState(false)
    const grupos = getVoceGroups(useAbasFora(), useWorkspace().papel)
    const isMobile = useIsMobile()
    const esperando = loading || (user && !profileReady)
    const ias = useIasConectadas()
    // Até a primeira IA, o cartão de conectar toma o lugar da linha de IAs conectadas.
    const ia = iaNaVoce({
        carregando: ias.isPending && Boolean(user),
        erro: ias.isError,
        quantos: ias.data?.length ?? 0,
    })
    const descricaoDasIas = descricaoDaLista((ias.data ?? []).map((g) => g.client.name), "IAs")

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

    // Como na Você: sem o perfil, o nome e o tom do avatar ainda não são os
    // da pessoa, e a página inteira espera no esqueleto da rota.
    if (esperando) {
        return <MePageSkeleton />
    }

    return (
        <AlertDialog
            pending={saindo}
            onOpenChange={(aberto) => {
                if (!aberto) setErro(null)
            }}
        >
            <div className="min-w-0 max-w-full space-y-5">
                {/* Não é link: a conta tem a linha dela no grupo Conta. */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <VoceAvatar size="xl" onEdit={() => setEditarAberto(true)} />
                    {/* Nome sobre e-mail é par de identidade: sem `gap`. */}
                    <div className="min-w-0 max-w-full">
                        <H2 className="truncate">{userName}</H2>
                        {userEmail ? <Muted className="truncate">{userEmail}</Muted> : null}
                    </div>
                    {user?.created_at ? (
                        <div className="flex items-center justify-center gap-2">
                            <SeloDeMembro desde={user.created_at} />
                            <Muted aria-hidden="true">Membro desde {formatTransactionMonthYearPtBr(user.created_at)}</Muted>
                        </div>
                    ) : null}
                </div>

                {grupos.map((grupo) => (
                    <Fragment key={grupo.id}>
                        {/* O convite da IA é seção própria, antes da Conta: dentro dela, o cartão engolia a lista. */}
                        {grupo.id === "conta" && ia === "cartao" ? (
                            <PageSection size="sm">
                                <PageSectionHeader>
                                    <PageSectionTitle>Inteligência artificial</PageSectionTitle>
                                </PageSectionHeader>
                                <CartaoDaIa />
                            </PageSection>
                        ) : null}
                        {grupo.items.length === 0 ? null : (
                            <PageSection size="sm">
                                <PageSectionHeader>
                                    <PageSectionTitle>{grupo.label}</PageSectionTitle>
                                </PageSectionHeader>
                                <Card padding="none">
                                    <ItemGroup variant="divided">
                                        {grupo.items.filter((item) => !(ia === "cartao" && item.href === ROUTES.SETTINGS_IAS)).map((item) => {
                                            const Icon = miniIconFor(item.icon) ?? item.icon
                                            const descricao = item.href === ROUTES.SETTINGS_IAS ? descricaoDasIas : item.description
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
                                                            {descricao ? <ItemDescription>{descricao}</ItemDescription> : null}
                                                        </ItemContent>
                                                        <ItemChevron />
                                                    </Link>
                                                </Item>
                                            )
                                        })}
                                    </ItemGroup>
                                </Card>
                                {/* Sair limpa a fila offline: pede confirmação. Não abre tela, então não tem chevron. Fica fora do cartão, sem moldura, embaixo da lista. */}
                                {grupo.id === "conta" ? (
                                    <Item variant="flush" interactive asChild className="min-h-12 rounded-row-lg">
                                        <AlertDialogTrigger asChild>
                                            <button type="button">
                                                <ItemMedia variant="icon" className="text-destructive">
                                                    <ArrowRightStartOnRectangleIcon className="size-5" aria-hidden />
                                                </ItemMedia>
                                                <ItemContent>
                                                    <ItemTitle className="text-destructive pointer-coarse:text-base">Sair</ItemTitle>
                                                </ItemContent>
                                            </button>
                                        </AlertDialogTrigger>
                                    </Item>
                                ) : null}
                            </PageSection>
                        )}
                        {/* No meio: entre a carteira e a conta. */}
                        {grupo.id === "carteira" && isMobile ? <NesteCelularGrupo /> : null}
                    </Fragment>
                ))}

                <EditProfileDialog open={editarAberto} onOpenChange={setEditarAberto} />

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
            </div>
        </AlertDialog>
    )
}
