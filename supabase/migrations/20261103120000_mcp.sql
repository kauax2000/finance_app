-- MCP: lançamento criado por uma IA externa (Claude, ChatGPT) entra com source = 'ia_externa'.
alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions
  add constraint transactions_source_check check (source in (
    'app', 'quick_text', 'shortcut', 'apple_pay', 'whatsapp', 'share',
    'import_pdf', 'import_sheet', 'import_statement', 'recurring', 'ia_externa'
  ));
