/**
 * Helpers to log family / household activity. Call these from invite, join, remove,
 * and permission flows when you implement shared accounts.
 */

import { createActivity } from './activity'

export async function logFamilyMemberInvited(invitedEmail: string, description?: string) {
    return createActivity({
        type: 'family_member_invited',
        description: description ?? `Convite enviado para ${invitedEmail}`,
        metadata: { invited_email: invitedEmail.toLowerCase().trim() },
    })
}

export async function logFamilyMemberJoined(memberId: string, description?: string) {
    return createActivity({
        type: 'family_member_joined',
        description: description ?? 'Membro da família entrou na conta',
        metadata: { member_id: memberId },
    })
}

export async function logFamilyMemberRemoved(memberId: string, description?: string) {
    return createActivity({
        type: 'family_member_removed',
        description: description ?? 'Membro removido da família',
        metadata: { member_id: memberId },
    })
}

export async function logFamilyPermissionChanged(
    memberId: string,
    permissions: Record<string, unknown>,
    description?: string
) {
    return createActivity({
        type: 'family_permission_changed',
        description: description ?? 'Permissões de um membro foram alteradas',
        metadata: { member_id: memberId, permissions },
    })
}

export async function logFamilyRoleChanged(
    memberId: string,
    role: string,
    description?: string
) {
    return createActivity({
        type: 'family_role_changed',
        description: description ?? 'Papel de um membro foi alterado',
        metadata: { member_id: memberId, role },
    })
}
