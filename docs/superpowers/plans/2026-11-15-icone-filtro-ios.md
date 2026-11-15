# O filtro com o ícone do iOS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o botão de filtro (cabeçalho e `ToolbarFilterButton`) passa a usar um ícone desenhado de três linhas centradas.

**Architecture:** um componente de ícone novo em `src/components/icons/`, no molde do `SidebarToggleIcon`, registrado como exceção do auditor; dois consumidores trocam o import.

**Tech Stack:** Next 16, React 19, Heroicons, Vitest (testes de fonte).

**Spec:** `docs/superpowers/specs/2026-11-15-icone-filtro-ios-design.md`

## Global Constraints

- O desenho é exato (path abaixo); grade 16, `fill="currentColor"`, igual ao `SidebarToggleIcon`.
- O `DataTable` ("exibir") e o `CalendarIcon` do cabeçalho não mudam.
- Sem prettier. `git add` só dos arquivos da tarefa (nunca `graphify-out/graph.json`). Commit termina com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push. Comentários em português.

## Review Focus

- Nenhum `AdjustmentsHorizontalIcon` sobra em `app-header.tsx` e `toolbar.tsx`; o do `data-table.tsx` fica.
- O auditor não acusa o SVG novo (`npm run ds:audit -- --rule G src/components/icons`).

---

### Task 1: `FilterLinesIcon` no cabeçalho e na `Toolbar`

**Files:**
- Create: `src/components/icons/filter-lines-icon.tsx`
- Create: `src/components/icons/filter-lines-icon.test.ts`
- Modify: `src/components/layout/app-header.tsx` (import e o `<AdjustmentsHorizontalIcon className="size-4" />` do filtro)
- Modify: `src/components/ui/toolbar.tsx` (import e o padrão `icon` do `ToolbarFilterButton`)
- Modify: `.claude/skills/design-system-guard/scripts/audit.mjs` (`DRAWN_SVG_FILES`)
- Modify: `AGENTS.md` (Ícones, "A exceção é o que não é ícone") e `src/app/designsystem/docs/iconography.tsx` (a `DocNote` "A exceção é o que não é ícone")

**Interfaces:**
- Produces: `export function FilterLinesIcon(props: SVGProps<SVGSVGElement>)`.

- [ ] **Step 1: Write the failing test** — `src/components/icons/filter-lines-icon.test.ts`, com `lerFonte`/`semComentarios` de `@/test/fonte`:

```ts
it("o cabeçalho e a Toolbar filtram com o FilterLinesIcon", () => {
    for (const f of ["src/components/layout/app-header.tsx", "src/components/ui/toolbar.tsx"]) {
        const fonte = semComentarios(lerFonte(f))
        expect(fonte).toContain('from "@/components/icons/filter-lines-icon"')
        expect(fonte).not.toContain("AdjustmentsHorizontalIcon")
    }
    expect(semComentarios(lerFonte("src/components/ui/data-table.tsx"))).toContain("AdjustmentsHorizontalIcon")
})
it("é um desenho nomeado no auditor, na grade 16/solid", () => {
    expect(lerFonte(".claude/skills/design-system-guard/scripts/audit.mjs")).toContain('"filter-lines-icon"')
    const icone = lerFonte("src/components/icons/filter-lines-icon.tsx")
    expect(icone).toContain('viewBox="0 0 16 16"')
    expect(icone).toContain('fill="currentColor"')
    expect(icone).toContain('data-slot="icon"')
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/components/icons/filter-lines-icon.test.ts` → FAIL.

- [ ] **Step 3: Implement**
  - `FilterLinesIcon`: copie a forma do `SidebarToggleIcon` (svg com `xmlns`, `viewBox="0 0 16 16"`, `fill="currentColor"`, `aria-hidden="true"`, `data-slot="icon"`, `{...props}`), docstring em português (o filtro do iOS, `line.3.horizontal.decrease`; o Heroicons não tem; por isso em `DRAWN_SVG_FILES`; decisão do dono em 15/11/2026). Um `<path>` com este `d` exato:
    `M2.75 3.5h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5ZM4.75 7.25h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5ZM6.75 11h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5Z`
  - `app-header.tsx`: o ícone do filtro vira `<FilterLinesIcon className="size-4" />`; tirar `AdjustmentsHorizontalIcon` do import do Heroicons.
  - `toolbar.tsx`: `icon = <FilterLinesIcon aria-hidden />`; tirar `AdjustmentsHorizontalIcon` do import.
  - `audit.mjs`: somar `"filter-lines-icon"` a `DRAWN_SVG_FILES`, logo depois de `"sidebar-toggle-icon"`, com o comentário `// O filtro do iOS (line.3.horizontal.decrease): o Heroicons não tem; decisão do dono (15/11/2026).`
  - `AGENTS.md` e `iconography.tsx`: na regra da exceção, somar que a lista também leva o pictograma que o Heroicons não tem, por decisão do dono (a barra lateral e o filtro do iOS).

- [ ] **Step 4: Run to verify it passes** — `npx vitest run src/components/icons src/components/ui/toolbar* src/components/layout && npx tsc --noEmit && npx eslint src/components/icons src/components/layout/app-header.tsx src/components/ui/toolbar.tsx && npm run ds:audit -- src/components/icons src/components/layout/app-header.tsx src/components/ui/toolbar.tsx` → PASS, auditor sem violação nova.

- [ ] **Step 5: Commit** — os sete arquivos acima, mensagem `feat(icones): o filtro com as três linhas do iOS`.

### Task 2 (controlador): conferir a 375px e no desktop, com e sem filtro; `graphify update .`.
