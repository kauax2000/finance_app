# Membros no telefone: convidar na barra e a carteira no topo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** No telefone, a tela Membros abre com a carteira (cartão no topo) e o convite sai do botão grande para um botão redondo na barra, no lugar da lupa.

**Spec:** pedido do dono em 07/11/2026, sobre o mockup `public/_mockups/membros-topo.html`: misturar a opção A (convidar na barra) com a D (cartão da carteira), com ajustes: "trocar o botão de search pelo botão adicionar convidado em branco, conforme é hoje, para só ter um botão do lado direito"; "adicione a parte da carteira nessa tela, já que no mobile, diferente do desktop, a gente não está vendo qual carteira".

## Global Constraints

- **Só no telefone** (abaixo do `md`). O desktop não muda (o `PageHeader` com o botão "Convidar pessoa" continua).
- **Barra do topo em `/members`, para quem pode convidar (dono):** à direita, **um botão só**: redondo, no tamanho dos outros da barra (44 no toque), **preenchido em `primary`** ("em branco, conforme é hoje" — no escuro o primário é branco), ícone de pessoa com "+" (`UserPlusIcon` do conjunto certo para o tamanho), `aria-label` "Convidar pessoa", abre o mesmo diálogo de convite de hoje. A lupa **sai** nessa rota para o dono. Quem não é dono continua com a lupa e sem convite.
- O cabeçalho tem de ter a forma certa **no clique**, antes do `AdiarMontagem` (mesmo motivo de `mobileHeaderFilterFor` em `src/config/mobile-navigation.ts`): a rota declara a ação; a página publica o `onClick` (padrão do filtro em `src/components/layout/page-chrome-provider.tsx`). Enquanto o papel não é conhecido, prefira a forma do dono só quando já se sabe que é dono (não piscar lupa ↔ convite para o membro).
- O botão grande "Convidar pessoa" de largura cheia **sai do telefone**.
- **Cartão da carteira no topo (telefone):** `Card` com o ladrilho da carteira (o mesmo da barra lateral/seletor de carteira — `ColorTile` com o ícone e a cor da carteira; reusar o que o seletor usa), o **nome da carteira**, os avatares empilhados (`AvatarGroup` + `AvatarGroupItem`, a escada do `Avatar`) e o texto `{n} pessoas` (`1 pessoa` no singular). Sem botão dentro (o convite está na barra). Não é clicável.
- Design system do `AGENTS.md`; nada novo em `src/components/ui/` nem `globals.css` **sem pedir**: se `TopBarAction` não tiver um jeito de ficar preenchido em `primary`, **pare e reporte** (não invente variante) — use o que existir (por exemplo um `Button variant="primary" size="icon-lg"` com a geometria da barra) e explique.
- Jornada: o convite muda de lugar no telefone — atualizar `docs/JORNADAS.md` (Membros) e `docs/atlas/template.html`, `python3 docs/atlas/build.py`.
- Banco de dev = produção: não convidar ninguém ao testar (abrir o diálogo e fechar). Não trocar a carteira ativa.
- Commit só dos arquivos da tarefa; trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; sem `git stash`; `graph.json` fora.

## Review Focus

1. Membro (não dono) em `/members` no telefone: lupa à direita, sem convite, sem piscar. Teste de fonte/função.
2. Dono: um botão só à direita, preenchido, 44 no toque, abre o diálogo de convite. Navegador a 375 px.
3. Outras rotas: a lupa continua igual. Teste.
4. Desktop sem mudança. Navegador.
5. Carteira com 1 pessoa: "1 pessoa". Teste.
