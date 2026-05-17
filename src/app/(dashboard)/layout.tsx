import { cookies } from "next/headers"
import DashboardLayoutClient from "./layout-client"
import {
    defaultSidebarOpenFromCookie,
    SIDEBAR_STATE_COOKIE_NAME,
} from "@/lib/sidebar-state-cookie"

type RouteParams = Record<string, string | string[] | undefined>

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<RouteParams>
}) {
    await params
    const cookieStore = await cookies()
    const raw = cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value
    const defaultSidebarOpen = defaultSidebarOpenFromCookie(raw)
    return (
        <DashboardLayoutClient defaultSidebarOpen={defaultSidebarOpen}>
            {children}
        </DashboardLayoutClient>
    )
}
