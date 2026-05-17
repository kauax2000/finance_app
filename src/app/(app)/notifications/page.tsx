import { redirect } from "next/navigation"
import { ROUTES } from "@/config/navigation"

/** Legacy URL: open the notifications drawer via query sync in the app shell. */
export default function NotificationsPage() {
    redirect(`${ROUTES.DASHBOARD}?notifications=1`)
}
