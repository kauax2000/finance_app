import { LancarPeloIphoneVazio } from "@/components/account/lancar-pelo-iphone-vazio"
import { Card } from "@/components/ui/card"

/**
 * Na página Você, no iPhone instalado e até o primeiro aparelho: o convite de lançar pelo iPhone.
 * O guia mora em quem chama, fora do ramo do cartão: criar o primeiro aparelho troca o cartão
 * pela linha, e o guia montado aqui sumiria no meio, levando o código recém-criado.
 */
export function CartaoDeLancar({ onConectar }: { onConectar: () => void }) {
    return (
        <Card padding="none">
            <LancarPeloIphoneVazio onConectar={onConectar} />
        </Card>
    )
}
