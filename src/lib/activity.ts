import { invokeEdgeJson } from './edge-invoke'

export type ActivityLogType =
    | 'family_member_invited'
    | 'family_member_joined'
    | 'family_member_removed'
    | 'family_permission_changed'
    | 'family_role_changed'
    | 'password_change'
    | 'profile_update'
    | 'security_settings'
    | 'device_added'
    | 'device_removed'

export type ActivityStatus = 'success' | 'failed' | 'pending'

export interface ActivityLog {
    id: string
    type: ActivityLogType
    description: string
    ip_address: string
    device: string
    created_at: string
    status: ActivityStatus
    metadata?: Record<string, unknown>
}

export interface CreateActivityInput {
    type: ActivityLogType
    description: string
    status?: ActivityStatus
    metadata?: Record<string, unknown>
}

const isDev = process.env.NODE_ENV === 'development'

function stableStringify(val: unknown): string {
    if (val === null || typeof val !== 'object') return JSON.stringify(val)
    if (Array.isArray(val)) return `[${val.map(stableStringify).join(',')}]`
    const o = val as Record<string, unknown>
    const keys = Object.keys(o).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`).join(',')}}`
}

function hashString(s: string): string {
    let hash = 0
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
    }
    return Math.abs(hash).toString(16)
}

/**
 * Builds the same dedupe key as the activity-logs Edge Function (for tests / debugging).
 * The server always recomputes from metadata on insert.
 */
export function buildDedupeKey(userId: string, type: string, metadata: Record<string, unknown>): string {
    const parts: string[] = [userId, type]

    const fieldMap: Record<string, string[]> = {
        family_member_invited: ['invite_id', 'invited_email'],
        family_member_joined: ['member_id'],
        family_member_removed: ['member_id'],
        family_permission_changed: ['member_id', 'permissions'],
        family_role_changed: ['member_id', 'role'],
        password_change: [],
        device_added: ['device_id', 'device_type'],
        device_removed: ['device_id', 'device_removed_bulk', 'revoked_session_id'],
    }

    if (type === 'profile_update' || type === 'security_settings') {
        const keys = Object.keys(metadata).sort()
        for (const k of keys) {
            parts.push(k, stableStringify(metadata[k]))
        }
    } else {
        const fields = fieldMap[type] ?? []
        for (const f of fields) {
            const v = metadata[f]
            if (v !== undefined && v !== null) {
                parts.push(f, typeof v === 'object' ? stableStringify(v) : String(v))
            }
        }
    }

    return hashString(parts.join('|'))
}

function mapActivity(row: {
    id: string
    type: string
    description: string
    ip_address?: string | null
    device?: string | null
    status: string
    created_at: string
    metadata?: Record<string, unknown>
}): ActivityLog {
    return {
        id: row.id,
        type: row.type as ActivityLogType,
        description: row.description,
        ip_address: row.ip_address ?? '',
        device: row.device ?? 'Desconhecido',
        status: row.status as ActivityStatus,
        created_at: row.created_at,
        metadata: row.metadata,
    }
}

export async function getActivities(filter: string = 'all'): Promise<ActivityLog[]> {
    try {
        const path = `activity-logs?filter=${encodeURIComponent(filter)}`
        const { activities } = await invokeEdgeJson<{ activities: ActivityLog[] }>(path, {
            method: 'GET',
        })
        return (activities ?? []).map((a) => mapActivity(a))
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Falha ao carregar atividades'
        if (isDev) console.error('Activity fetch error:', message)
        throw e instanceof Error ? e : new Error(message)
    }
}

export async function createActivity(input: CreateActivityInput): Promise<ActivityLog | null> {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

    try {
        const res = await invokeEdgeJson<{
            activity: ActivityLog | null
            skipped?: boolean
        }>('activity-logs', {
            method: 'POST',
            body: {
                type: input.type,
                description: input.description,
                status: input.status ?? 'success',
                metadata: input.metadata ?? {},
                user_agent: userAgent,
            },
        })

        if (res.skipped || !res.activity) {
            return null
        }

        return mapActivity(res.activity)
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Falha ao registrar atividade'
        if (isDev) console.error('Activity create error:', message)
        throw e instanceof Error ? e : new Error(message)
    }
}
