"use client"

import { createElement } from "react"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
    WORKSPACE_ACCENT_PALETTE,
    WORKSPACE_ICON_KEYS,
    WORKSPACE_ICON_MAP,
    type WorkspaceIconKey,
} from "@/lib/workspace-icons"

type WorkspaceAppearanceFormFieldsProps = {
    name: string
    onNameChange: (value: string) => void
    icon: WorkspaceIconKey
    onIconChange: (key: WorkspaceIconKey) => void
    previewColor: string
    onPreviewColorChange: (hex: string) => void
    displayError: string | null
    /** Prefix for input ids (avoid duplicate ids on page + dialog) */
    idPrefix: string
    /** Hint under the preview mark */
    previewHint: string
}

export function WorkspaceAppearanceFormFields({
    name,
    onNameChange,
    icon,
    onIconChange,
    previewColor,
    onPreviewColorChange,
    displayError,
    idPrefix,
    previewHint,
}: WorkspaceAppearanceFormFieldsProps) {
    const nameId = `${idPrefix}-name`

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <WorkspaceBrandMark
                    iconKey={icon}
                    backgroundColor={previewColor}
                    className="size-10 rounded-lg"
                    iconClassName="size-5"
                />
                <p className="text-xs text-muted-foreground leading-snug">
                    {previewHint}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor={nameId}>Nome</Label>
                <Input
                    id={nameId}
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Ex.: Casa, Freelance"
                    autoComplete="off"
                    maxLength={120}
                />
            </div>

            <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Cor de destaque</legend>
                <div className="flex flex-wrap items-center gap-2">
                    {WORKSPACE_ACCENT_PALETTE.map((hex) => (
                        <button
                            key={hex}
                            type="button"
                            onClick={() => onPreviewColorChange(hex)}
                            className={cn(
                                "size-8 rounded-md border-2 transition-transform hover:scale-105",
                                previewColor.toLowerCase() === hex.toLowerCase()
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-transparent"
                            )}
                            style={{ backgroundColor: hex }}
                            aria-label={`Cor ${hex}`}
                            aria-pressed={
                                previewColor.toLowerCase() ===
                                hex.toLowerCase()
                            }
                        />
                    ))}
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <span className="whitespace-nowrap">Outra</span>
                        <input
                            type="color"
                            value={
                                /^#[0-9A-Fa-f]{6}$/.test(previewColor)
                                    ? previewColor
                                    : "#2563EB"
                            }
                            onChange={(e) =>
                                onPreviewColorChange(e.target.value)
                            }
                            className="h-8 w-12 cursor-pointer rounded border border-border bg-background p-0.5"
                            aria-label="Escolher cor personalizada"
                        />
                    </label>
                </div>
            </fieldset>

            <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Ícone</legend>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
                    {WORKSPACE_ICON_KEYS.map((key) => {
                        const Cmp = WORKSPACE_ICON_MAP[key]
                        const selected = icon === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onIconChange(key)}
                                className={cn(
                                    "flex size-11 items-center justify-center rounded-lg border text-foreground transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    selected
                                        ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background"
                                        : "border-border bg-background"
                                )}
                                aria-pressed={selected}
                                aria-label={`Ícone ${key}`}
                            >
                                {createElement(Cmp, {
                                    className: "size-5",
                                })}
                            </button>
                        )
                    })}
                </div>
            </fieldset>

            {displayError ? (
                <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                >
                    {displayError}
                </p>
            ) : null}
        </div>
    )
}
