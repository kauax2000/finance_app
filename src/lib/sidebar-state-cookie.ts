export const SIDEBAR_STATE_COOKIE_NAME = "sidebar_state"

/** Matches `SidebarProvider` client cookie: expanded unless value is `"false"`. */
export function defaultSidebarOpenFromCookie(raw: string | undefined): boolean {
    return raw !== "false"
}
