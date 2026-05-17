import { redirect } from "next/navigation"
import { ROUTES } from "@/config/navigation"

export default function SettingsCreditCardsRedirectPage() {
    redirect(ROUTES.CREDIT_CARDS)
}
