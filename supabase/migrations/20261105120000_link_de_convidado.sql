-- O link de convite passa a levar o papel (membro ou convidado), como o convite
-- por e-mail. O aceite já grava `workspace_invites.role` e o patrocinador do
-- convidado, então só a regra "convidado exige e-mail" sai.
alter table public.workspace_invites drop constraint if exists workspace_invites_guest_requer_email;
