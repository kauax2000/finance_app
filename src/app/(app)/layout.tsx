import { cookies } from "next/headers"
import AppLayoutClient from "./layout-client"
import {
    defaultSidebarOpenFromCookie,
    SIDEBAR_STATE_COOKIE_NAME,
} from "@/lib/sidebar-state-cookie"

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SIDEBAR_STATE_COOKIE_NAME)?.value
    const defaultSidebarOpen = defaultSidebarOpenFromCookie(raw)
    return (
        <AppLayoutClient defaultSidebarOpen={defaultSidebarOpen}>
            {children}
        </AppLayoutClient>
    )
}
