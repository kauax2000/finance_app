"use client"

/**
 * A barra de baixo do telefone: as abas de tela, a aba Você e o "+". A quarta
 * aba era o "Mais", que abria um menu com as telas que não cabiam (rodadas 278
 * e 342); desde a rodada 346 é a Você, uma aba de verdade que leva à página
 * `/me`, com o avatar da pessoa no lugar do glifo.
 */
import * as React from "react"

import { usePathname } from "next/navigation"
import { publicarAbasFora } from "@/components/layout/abas-fora"
import { QuickActionButton } from "@/components/layout/quick-actions"
import { VoceAvatar } from "@/components/layout/voce-avatar"
import { BottomBar, BottomBarTab } from "@/components/ui/bottom-bar"
import { getMobileNavTabs, isVoceTabActive, solidIconFor } from "@/config/mobile-navigation"
import { isExactPath, ROUTES } from "@/config/navigation"
import { quemSai } from "@/lib/overflow"

function isMobileNavTabActive(pathname: string, href: string): boolean {
    if (href === ROUTES.DASHBOARD_CATEGORIES) {
        return pathname === href || pathname.startsWith(`${href}/`)
    }
    return isExactPath(pathname, href)
}

/** O respiro mínimo do nome dentro da aba (8 de cada lado); abaixo dele, a aba aperta. */
const FOLGA_DO_ROTULO = 16
/** O alvo de toque: nenhuma aba conta menos que isso. */
const PISO_DA_ABA = 44
/** O `gap-0.5` e o `p-0.5` da pílula. */
const VAO = 2

/**
 * Quantas abas do fim saem para a página Você quando a pílula não as comporta
 * com folga (rodada 342): cada aba pede o nome + 16, nunca menos de 44. A Você e
 * a primeira aba ficam sempre. O nome é medido no canvas, com a fonte de um
 * rótulo à vista: a aba que saiu não está no DOM, e uma largura guardada da
 * primeira pintura (no app instalado do iOS, antes do CSS) a deixava fora para
 * sempre. Remede a cada render, quando a página muda de tamanho e quando a
 * fonte chega.
 */
function useAbasQueSaem(nomes: string[]) {
    const raiz = React.useRef<HTMLDivElement>(null)
    const [saem, setSaem] = React.useState(0)
    const chave = nomes.join("|")

    // Sem dependências: a pílula e o rótulo são procurados a cada medida, e não
    // guardados — se a barra remonta, um observador preso à pílula antiga
    // mediria um nó solto (largura 0) e tiraria todas as abas. Quem observa é o
    // `<html>`, que nunca remonta.
    React.useLayoutEffect(() => {
        const contexto = document.createElement("canvas").getContext("2d")
        if (!contexto) return
        const ordem = [...chave.split("|"), "Você"]

        const medir = () => {
            const pilula = raiz.current?.querySelector<HTMLElement>('[data-slot="bottom-bar-tabs"]')
            const rotulo = pilula?.querySelector<HTMLElement>('[data-slot="bottom-bar-label"]')
            if (!pilula || !rotulo) return
            // Sem caixa (no desktop a barra é `md:hidden`, e a casca a monta mesmo
            // assim): a largura 0 tiraria todas as abas, e a página Você as listaria.
            if (pilula.clientWidth === 0) {
                setSaem(0)
                return
            }
            contexto.font = getComputedStyle(rotulo).font
            const larguras = ordem.map((nome) =>
                Math.max(PISO_DA_ABA, contexto.measureText(nome).width + FOLGA_DO_ROTULO)
            )
            const fora = quemSai(larguras, pilula.clientWidth - 2 * VAO, {
                ponta: "fim",
                fixos: new Set([0, ordem.length - 1]),
                reserva: 0,
                gap: VAO,
            })
            setSaem(fora.length)
        }

        medir()
        const observador = new ResizeObserver(medir)
        observador.observe(document.documentElement)
        void document.fonts?.ready.then(medir)
        return () => observador.disconnect()
    })

    return { raiz, saem }
}

export function MobileBottomNav() {
    const pathname = usePathname()
    const navTabs = getMobileNavTabs()
    const { raiz, saem } = useAbasQueSaem(navTabs.map((item) => item.name))
    const naBarra = navTabs.slice(0, navTabs.length - saem)
    const noMais = navTabs.slice(navTabs.length - saem)
    const hrefsQueSairam = noMais.map((item) => item.href)

    // Quem saiu aparece no topo da página Você, que não mede a barra: ela lê o
    // que a barra publica. A cada render, porque a medida muda o `saem`; a mesma
    // lista não notifica ninguém.
    React.useEffect(() => {
        publicarAbasFora(hrefsQueSairam)
    })
    // Sem a barra, ninguém saiu dela: a lista não sobrevive à desmontagem.
    React.useEffect(() => () => publicarAbasFora([]), [])

    return (
        <div ref={raiz} className="contents">
            <BottomBar labels action={<QuickActionButton variant="fab" />}>
                {naBarra.map((item) => (
                    <BottomBarTab
                        key={item.href}
                        href={item.href}
                        label={item.name}
                        icon={item.icon}
                        iconActive={solidIconFor(item.icon)}
                        active={isMobileNavTabActive(pathname, item.href)}
                    />
                ))}

                {/* Você fica ativa em /me e nas telas que a página abre (como no iOS, o
                    que foi empurrado de uma aba continua debaixo dela). O avatar nunca
                    espera num esqueleto: sem o perfil, é o círculo neutro. */}
                <BottomBarTab
                    href={ROUTES.ME}
                    label="Você"
                    media={<VoceAvatar size="xs" />}
                    active={isVoceTabActive(pathname, hrefsQueSairam)}
                />
            </BottomBar>
        </div>
    )
}
