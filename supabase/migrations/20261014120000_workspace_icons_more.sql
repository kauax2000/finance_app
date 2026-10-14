-- Mais ícones de carteira: dezessete chaves novas no seletor (dinheiro, cartão,
-- contas, orçamento, loja, imóvel, compras, transporte, educação, conquista,
-- projeto, ideias, festa, férias, lazer, reforma, favorita).
--
-- A lista espelha `WORKSPACE_ICON_KEYS` (`src/lib/workspace-icons.ts`).
-- `dumbbell` continua aceito: o seletor só deixou de oferecê-lo.
-- Idempotente: pode rodar pelo editor SQL e depois pelo `db push`.

alter table public.workspaces drop constraint if exists workspaces_icon_allowed;

alter table public.workspaces
  add constraint workspaces_icon_allowed
  check (icon = any (array['briefcase', 'home', 'users', 'plane', 'heart', 'shopping-cart', 'wallet', 'building-2', 'laptop', 'trending-up', 'gift', 'sparkles', 'target', 'zap', 'coffee', 'music', 'camera', 'dumbbell', 'book-open', 'globe', 'banknotes', 'credit-card', 'calculator', 'chart-pie', 'building-storefront', 'home-modern', 'shopping-bag', 'truck', 'academic-cap', 'trophy', 'rocket-launch', 'light-bulb', 'cake', 'sun', 'film', 'wrench-screwdriver', 'star']::text[]));
