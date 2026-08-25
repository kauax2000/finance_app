-- O vocabulário de ícones deixou de ser Lucide.
--
-- `categories.icon` e `workspaces.icon` guardam chaves escolhidas pela pessoa
-- ('utensils', 'paw-print', 'coffee'…). As chaves NÃO mudam: elas estão
-- gravadas nas linhas dos usuários e travadas por CHECK. O que mudou é o glifo
-- que a interface desenha para cada uma — hoje Heroicons, em
-- `category-appearance-fields.tsx` e `workspace-icons.ts`.
--
-- Esta migração só corrige o comentário da coluna, que ainda dizia
-- 'Lucide-style icon id' e apontava para uma biblioteca que o app não usa mais.

COMMENT ON COLUMN "public"."bills"."icon" IS
  'Icon id from the shared category vocabulary (see CATEGORY_ICONS); null = default in UI';
