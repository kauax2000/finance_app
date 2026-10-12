import { Card, CardContent, CardToolbar } from "@/components/ui/card"
import {
    Timeline,
    TimelineDescription,
    TimelineItem,
    TimelineTitle,
} from "@/components/ui/timeline"

type Step = "email" | "code" | "password" | "done"

const PASSOS = [
    { id: "email", titulo: "Código enviado", desc: "Seis dígitos no seu e-mail." },
    { id: "code", titulo: "Código conferido", desc: "Só quem tem acesso ao e-mail chega aqui." },
    { id: "password", titulo: "Nova senha", desc: "As sessões antigas são encerradas." },
] as const

const ORDEM: Step[] = ["email", "code", "password", "done"]

/**
 * A cena da recuperação: a mesma sequência do formulário, ao vivo. O passo
 * atual é `current`, os anteriores `done`. É a peça que se mexe nesta
 * jornada — o resto das cenas fica parado depois da entrada.
 */
export function RecoveryScene({ step }: { step: Step }) {
    const atual = ORDEM.indexOf(step)
    return (
        <Card variant="elevated">
            <CardToolbar variant="title">Recuperar o acesso</CardToolbar>
            <CardContent>
                <Timeline aria-label="Passos da recuperação">
                    {PASSOS.map((p, i) => (
                        <TimelineItem
                            key={p.id}
                            state={i < atual ? "done" : i === atual ? "current" : "upcoming"}
                        >
                            <TimelineTitle>{p.titulo}</TimelineTitle>
                            <TimelineDescription>{p.desc}</TimelineDescription>
                        </TimelineItem>
                    ))}
                </Timeline>
            </CardContent>
        </Card>
    )
}
