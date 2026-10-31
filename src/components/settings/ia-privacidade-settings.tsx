import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SettingsRow, SettingsSection } from "@/components/settings/settings-section"
import { ROUTES } from "@/config/navigation"

/** A IA do app (Bloco 3B): quem lê, o limite do dia e a política de privacidade. */
export function IaPrivacidadeSettings() {
    return (
        <SettingsSection titulo="IA e privacidade" alcance="Vale para toda a sua conta.">
            <Card padding="none">
                <SettingsRow
                    titulo="Groq e Cloudflare leem o que você manda, sem treinar com seus dados"
                    descricao="Até 30 chamadas por dia (frase, foto do recibo e fatura; uma fatura longa gasta várias). Tudo que a IA preenche fica a conferir."
                />
                <Separator />
                <SettingsRow titulo="Política de privacidade">
                    <Button variant="link" asChild>
                        <Link href={ROUTES.PRIVACY}>Política de privacidade</Link>
                    </Button>
                </SettingsRow>
            </Card>
        </SettingsSection>
    )
}
