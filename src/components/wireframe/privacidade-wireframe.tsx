import Link from "next/link"
import { ROUTES } from "@/config/navigation"
import { WireframeBox } from "@/components/wireframe/wireframe-box"

/**
 * A política de privacidade mínima (Bloco 3B, Decisão 13): pública, sem
 * sessão. Diz só o que o código faz hoje — a cadeia de IA mora em
 * `supabase/functions/_shared/ia-config.ts` e a redação em `_shared/redigir.ts`.
 */
export function PrivacidadeWireframe() {
    return (
        <main className="mx-auto max-w-2xl px-4 py-8">
            <WireframeBox bloco="3" titulo="Privacidade">
                <h1 className="text-base font-bold text-foreground">Privacidade</h1>
                <p>Atualizada em 22 de outubro de 2026.</p>

                <h2 className="font-bold text-foreground">O que o app guarda</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>A conta: nome, e-mail e foto do perfil.</li>
                    <li>As carteiras e quem é membro de cada uma.</li>
                    <li>
                        Os lançamentos (valor, data, descrição, categoria e forma de pagamento), as categorias, os
                        orçamentos, as contas a pagar e as assinaturas.
                    </li>
                    <li>
                        Os cartões: apelido, os 4 últimos dígitos, validade, limite e os dias de fechamento e
                        vencimento. O número inteiro do cartão nunca é guardado.
                    </li>
                    <li>
                        Os anexos (foto ou PDF), num armazenamento privado: só abrem por um link que vale uma hora.
                    </li>
                </ul>
                <p>Os membros de uma carteira veem os dados dela. Ninguém de fora vê.</p>

                <h2 className="font-bold text-foreground">Inteligência artificial</h2>
                <p>
                    A IA lê uma frase confusa, a foto de um recibo e o texto da fatura em PDF quando a leitura
                    normal não fecha. Ela só preenche: todo lançamento que passou por ela fica &quot;a conferir&quot;.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        O provedor principal é a <strong>Groq</strong>, nos Estados Unidos. Se ela falhar, a
                        reserva é a <strong>Cloudflare</strong> (Workers AI), também dos Estados Unidos. Por isso o
                        que vai à IA sai do Brasil: é uma transferência internacional de dados.
                    </li>
                    <li>Nenhum dos dois treina modelos com os seus dados. Os dois são usados no plano grátis.</li>
                    <li>
                        A Groq não guarda o que recebe quando a retenção zero (ZDR) está ligada na conta do app. A
                        Cloudflare guarda pelo prazo da política dela.
                    </li>
                </ul>

                <h2 className="font-bold text-foreground">O que sai antes do envio</h2>
                <p>Do texto (a frase e a fatura), o app tira antes de enviar:</p>
                <ul className="list-disc space-y-1 pl-5">
                    <li>o número do cartão (ficam só os 4 últimos dígitos);</li>
                    <li>CPF e CNPJ;</li>
                    <li>e-mail e telefone;</li>
                    <li>CEP e endereço;</li>
                    <li>o nome das pessoas da carteira.</li>
                </ul>
                <p>
                    <strong>A foto vai como está</strong>: não há como tirar nada de uma imagem. Recibos e
                    comprovantes costumam mostrar o cartão mascarado.
                </p>

                <h2 className="font-bold text-foreground">Limite e cache</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        Cada pessoa usa a IA até 30 vezes por dia (no horário de Brasília). Depois disso, o app
                        segue sem IA até o dia seguinte.
                    </li>
                    <li>
                        A resposta da IA fica guardada, presa a uma impressão digital (hash) do que foi enviado, e
                        não ao seu nome. O mesmo pedido repetido é respondido daí, sem nova chamada e sem contar no
                        limite. Uma limpeza semanal apaga o que passou de 30 dias.
                    </li>
                    <li>
                        O app conta quantas vezes cada pessoa usou a IA por dia, e quantas chamadas cada provedor
                        atendeu, sem dizer de quem.
                    </li>
                </ul>

                <h2 className="font-bold text-foreground">Exportar e apagar</h2>
                <ul className="list-disc space-y-1 pl-5">
                    <li>
                        Hoje dá para exportar em CSV a lista de assinaturas. A exportação de todos os dados ainda
                        não existe.
                    </li>
                    <li>
                        Em <strong>Minha conta</strong>, &quot;Excluir conta&quot; apaga a conta, as carteiras que você
                        criou (também para os outros membros), os lançamentos, as categorias, as preferências e o
                        perfil. A exclusão pede a sua senha e não tem volta.
                    </li>
                </ul>

                <p>
                    <Link href={ROUTES.ACCOUNT} className="text-foreground underline">
                        Abrir Minha conta
                    </Link>
                </p>
            </WireframeBox>
        </main>
    )
}
