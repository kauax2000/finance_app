-- Lançar ao pagar (3/nov/2026): quando a pessoa termina o guia do Apple Pay, o
-- app guarda o momento, e o cartão de Configurações passa de "Configurar" a
-- "Aguardando a 1ª compra". "Funcionando" vem da primeira transação com
-- `source = 'apple_pay'`, sem coluna. As políticas de user_settings (cada um lê
-- e atualiza a própria linha) já cobrem a coluna nova.
alter table public.user_settings
    add column if not exists apple_pay_configurado_em timestamptz;
