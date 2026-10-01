/**
 * O atalho de teclado, na grafia do `Kbd` (`"mod+k"`, `"/"`, `"alt+n"`).
 *
 * Morava dentro do `SearchInput`; desde a rodada 208 o `CommandItem` também
 * dispara por atalho, e a regra não pode divergir entre os dois. `mod` é ⌘ no
 * Apple e Ctrl no resto, como no `Kbd`.
 */

/**
 * Se a tecla é o atalho. `mod` aceita ⌘ ou Ctrl; sem modificadora pedida,
 * nenhuma pode estar descida — senão ⌘S salvaria e dispararia o atalho. O
 * Shift não reprova: em muitos teclados a `/` pede Shift.
 */
export function matchShortcut(
  atalho: string,
  e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">
): boolean {
  const partes = atalho.toLowerCase().split("+").map((p) => p.trim())
  const tecla = partes.pop()
  const comMod = partes.includes("mod")
  if (comMod !== (e.metaKey || e.ctrlKey)) return false
  if (partes.includes("alt") !== e.altKey) return false
  return e.key.toLowerCase() === tecla
}

/** `"mod+k"` → `"Meta+K Control+K"`, a grafia do `aria-keyshortcuts`. */
export function ariaShortcut(atalho: string): string {
  const partes = atalho.split("+").map((p) => p.trim())
  const tecla = partes.pop()!
  const fim = tecla.length === 1 ? tecla.toUpperCase() : tecla
  const mods = partes.map((p) =>
    /^shift$/i.test(p) ? "Shift" : /^(alt|opt)$/i.test(p) ? "Alt" : p.toLowerCase()
  )
  const com = (mod: string) => [...mods.map((m) => (m === "mod" ? mod : m)), fim].join("+")
  return mods.includes("mod") ? `${com("Meta")} ${com("Control")}` : com("")
}

/** Se o alvo do evento é um campo onde a tecla é texto. */
export function isEditableTarget(alvo: EventTarget | null): boolean {
  return (
    typeof HTMLElement !== "undefined" &&
    alvo instanceof HTMLElement &&
    (alvo.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName))
  )
}
