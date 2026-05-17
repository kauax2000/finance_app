import { createActivity } from './activity'
import { isEdgeInvokeTransportFailure } from './edge-errors'
import { invokeEdgeJson } from './edge-invoke'
import { supabase } from './supabase'

function isClientSideAuthError(message: string): boolean {
    return message.includes('faça login novamente')
}

export { parseEdgeFunctionError } from './edge-errors'

const DEVICE_ID_KEY = 'finance_app_device_id'

export interface Session {
    id: string
    user_id: string
    device_id?: string | null
    device_fingerprint?: string | null
    device_type: 'desktop' | 'mobile' | 'tablet'
    device_name: string
    browser: string
    os: string
    ip_address: string
    user_agent: string
    created_at: string
    last_active_at: string
    is_active: boolean
    is_current: boolean
}

const SESSION_ID_KEY = 'finance_app_session_id'

const isDev = process.env.NODE_ENV === 'development'

function hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
    }
    return Math.abs(hash).toString(16)
}

/** Persistent ID per browser profile (localStorage). */
export function getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return ''
    const stored = localStorage.getItem(DEVICE_ID_KEY)
    if (stored) return stored
    const newId = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, newId)
    return newId
}

/** Fingerprint from UA + screen + timezone + language (fallback / legacy). */
export function getDeviceFingerprint(): string {
    if (typeof window === 'undefined') return ''
    const components = [
        navigator.userAgent,
        `${screen.width}x${screen.height}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language,
    ]
    return hashCode(components.join('|'))
}

export function getDeviceInfo(): {
    device_id: string
    fingerprint: string
    userAgent: string
    screen: string
    timezone: string
    language: string
} {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    return {
        device_id: getOrCreateDeviceId(),
        fingerprint: getDeviceFingerprint(),
        userAgent,
        screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
        timezone:
            typeof Intl !== 'undefined'
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : '',
        language: typeof navigator !== 'undefined' ? navigator.language : '',
    }
}

export function getCurrentSessionId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SESSION_ID_KEY)
}

export function setCurrentSessionId(sessionId: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(SESSION_ID_KEY, sessionId)
}

export async function getSessions(): Promise<Session[]> {
    if (isDev) {
        console.log('Fetching sessions via supabase.functions.invoke')
    }

    const { sessions } = await invokeEdgeJson<{ sessions: Session[] }>('sessions', {
        method: 'GET',
    })
    const currentSessionId = getCurrentSessionId()

    return (sessions ?? []).map((session: Session) => ({
        ...session,
        is_current: session.id === currentSessionId,
    }))
}

export async function createSession(): Promise<string | null> {
    try {
        const { userAgent, device_id, fingerprint } = getDeviceInfo()

        const { session, reused } = await invokeEdgeJson<{
            session?: Session & { id: string }
            reused?: boolean
        }>('sessions', {
            method: 'POST',
            body: {
                user_agent: userAgent,
                device_id: device_id || undefined,
                device_fingerprint: fingerprint || undefined,
            },
        })

        if (session?.id) {
            setCurrentSessionId(session.id)
            if (!reused) {
                const deviceType = session.device_type ?? 'desktop'
                void createActivity({
                    type: 'device_added',
                    description: 'Novo dispositivo registrado nesta conta',
                    status: 'success',
                    metadata: {
                        device_id: device_id || undefined,
                        device_type: deviceType,
                    },
                }).catch(() => {
                    /* edge / rede */
                })
            }
            return session.id
        }

        return null
    } catch (error) {
        if (isDev && isEdgeInvokeTransportFailure(error)) {
            console.warn(
                '[sessions] Edge Function indisponível (esperado se não correr `npm run supabase:functions:serve` ou sem deploy).',
                error instanceof Error ? error.message : error
            )
            return null
        }
        console.error('Error creating session:', error)
        return null
    }
}

export async function revokeSession(sessionId: string): Promise<void> {
    try {
        const metadata: Record<string, unknown> = {}
        try {
            const sessions = await getSessions()
            const target = sessions.find((s) => s.id === sessionId)
            if (target?.device_id) {
                metadata.device_id = target.device_id
            }
        } catch {
            /* ignore */
        }

        await invokeEdgeJson('sessions', {
            method: 'POST',
            body: { action: 'revoke_session', session_id: sessionId },
        })

        void createActivity({
            type: 'device_removed',
            description: 'Sessão encerrada em outro dispositivo',
            status: 'success',
            metadata: { ...metadata, revoked_session_id: sessionId },
        }).catch(() => {
            /* opcional */
        })
    } catch (error) {
        console.error('Error revoking session:', error)
        throw error
    }
}

export async function revokeAllSessions(): Promise<void> {
    try {
        const currentSessionId = getCurrentSessionId()

        await invokeEdgeJson('sessions', {
            method: 'POST',
            body: { action: 'revoke_all', except_session_id: currentSessionId },
        })

        void createActivity({
            type: 'device_removed',
            description: 'Encerradas todas as sessões em outros dispositivos',
            status: 'success',
            metadata: { device_removed_bulk: true },
        }).catch(() => {
            /* opcional */
        })
    } catch (error) {
        console.error('Error revoking all sessions:', error)
        throw error
    }
}

export async function updateSessionActivity(): Promise<void> {
    try {
        const currentSessionId = getCurrentSessionId()
        if (!currentSessionId) return

        await invokeEdgeJson(
            `sessions?session_id=${encodeURIComponent(currentSessionId)}`,
            {
                method: 'PATCH',
            }
        )
    } catch (error) {
        console.error('Error updating session activity:', error)
    }
}

export function clearCurrentSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SESSION_ID_KEY)
}

/**
 * If this browser's app session was revoked (or edge rejects JWT+session), sign out locally.
 * Call after restoring Supabase auth so revoked devices lose access on next load/navigation.
 */
export async function validateCurrentSession(): Promise<boolean> {
    try {
        const currentSessionId = getCurrentSessionId()
        if (!currentSessionId) {
            return true
        }

        // Avoid getSessions() here: it console.error + rethrows on any failure, which surfaces
        // as a noisy console error even when we intentionally treat unreachable Edge as "skip".
        const { sessions: rawSessions } = await invokeEdgeJson<{ sessions: Session[] }>('sessions', {
            method: 'GET',
        })
        const sessions = rawSessions ?? []
        const stillActive = sessions.some((s) => s.id === currentSessionId && s.is_active)
        if (!stillActive) {
            clearCurrentSession()
            await supabase.auth.signOut()
            return false
        }
        return true
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        if (isEdgeInvokeTransportFailure(e) || isClientSideAuthError(message)) {
            return true
        }
        if (
            message.includes('Session expired or invalidated') ||
            message.includes('Sessão inválida')
        ) {
            clearCurrentSession()
            await supabase.auth.signOut()
            return false
        }
        return true
    }
}

export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `Há ${minutes}min`
    if (hours < 24) return `Há ${hours}h`
    if (days < 7) return `Há ${days}d`

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    })
}
