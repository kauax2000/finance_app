import { InviteScene } from "@/components/auth/scenes/invite-scene"
import { LoginScene } from "@/components/auth/scenes/login-scene"
import { RecoveryScene } from "@/components/auth/scenes/recovery-scene"
import { RegisterScene } from "@/components/auth/scenes/register-scene"
import { sceneFamily, type AuthSceneId } from "@/components/auth/showcase/scene-context"

/** O passo da linha do tempo da cena antiga para cada id da recuperação. */
const PASSO_DA_RECUPERACAO = {
    "recovery.email": "email",
    "recovery.code": "code",
    "recovery.password": "password",
    "recovery.link-checking": "password",
    "recovery.link-expired": "email",
    "recovery.done": "done",
} as const

/**
 * O que o painel de marca mostra para cada cena.
 *
 * **Provisório** (Fase 2 do plano do painel animado): cada família aponta
 * para a cena antiga de `components/auth/scenes/`. As cenas novas, por
 * `SCENES`, entram na Fase 8 e substituem este arquivo por inteiro.
 */
export function AuthShowcase({ scene }: { scene: AuthSceneId }) {
    switch (sceneFamily(scene)) {
        case "login":
            return <LoginScene />
        case "register":
            return <RegisterScene />
        case "invite":
            return <InviteScene />
        case "recovery":
            return <RecoveryScene step={PASSO_DA_RECUPERACAO[scene as keyof typeof PASSO_DA_RECUPERACAO]} />
    }
}
