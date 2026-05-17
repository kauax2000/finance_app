import { redirect } from "next/navigation"
import { ROUTES } from "@/config/navigation"

export default function WalletsRedirectPage() {
    redirect(ROUTES.DASHBOARD)
}
