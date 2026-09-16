"use client"

import { createElement } from "react"
import {
    Label,
} from "@/components/ui/label"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
} from "@/components/ui/item"
import {
    Field,
    FieldControl,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Input } from "@/components/ui/input"
import {
    WORKSPACE_ACCENT_PALETTE,
    WORKSPACE_ICON_KEYS,
    WORKSPACE_ICON_MAP,
    type WorkspaceIconKey,
    WORKSPACE_ICON_LABELS,
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

/** O teto do nome da carteira — o contador acima lê daqui. */
const NOME_MAX = 120

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
            <Item variant="muted" size="md" className="gap-3">
                <ItemMedia>
                    <WorkspaceBrandMark
                        iconKey={icon}
                        backgroundColor={previewColor}
                        className="size-10 rounded-lg"
                        iconClassName="size-5"
                    />
                </ItemMedia>
                <ItemContent>
                    <ItemDescription className="text-xs leading-snug text-muted-foreground">
                        {previewHint}
                    </ItemDescription>
                </ItemContent>
            </Item>

            <Field>
                <div className="flex items-baseline justify-between gap-2">
                    <FieldLabel>Nome</FieldLabel>
                    {/* O `maxLength` truncava calado: o campo simplesmente parava
                        de aceitar tecla. A contagem só aparece perto do teto,
                        porque um contador sempre visível é ruído nos 100
                        primeiros caracteres. */}
                    {name.length >= NOME_MAX - 20 ? (
                        <span className="nums text-2xs text-muted-foreground">
                            {name.length}/{NOME_MAX}
                        </span>
                    ) : null}
                </div>
                <FieldControl>
                    <Input
                        id={nameId}
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Ex.: Casa, Freelance"
                        autoComplete="off"
                        maxLength={NOME_MAX}
                    />
                </FieldControl>
            </Field>

            <FieldSet className="gap-2">
                <FieldLegend variant="label">Cor de destaque</FieldLegend>
                <div className="flex flex-wrap items-center gap-2">
                    <ToggleGroup
                        type="single"
                        value={
                            WORKSPACE_ACCENT_PALETTE.find(
                                (hex) => hex.toLowerCase() === previewColor.toLowerCase()
                            ) ?? ""
                        }
                        onValueChange={(next) => {
                            if (next) onPreviewColorChange(next)
                        }}
                        aria-label="Cor de destaque"
                        className="flex-wrap gap-2"
                    >
                        {WORKSPACE_ACCENT_PALETTE.map((hex) => (
                            <ToggleGroupItem
                                key={hex}
                                value={hex}
                                className="size-8 min-w-0 rounded-md border-2 border-transparent p-0 data-[state=on]:border-primary data-[state=on]:ring-2 data-[state=on]:ring-primary/30"
                                style={{ backgroundColor: hex }}
                                aria-label={`Cor ${hex}`}
                            />
                        ))}
                    </ToggleGroup>
                    <Label className="cursor-pointer gap-2 text-xs font-normal text-muted-foreground">
                        <span className="whitespace-nowrap">Outra</span>
                        {/* Cru de propósito: o seletor de cor nativo não tem peça no
                            sistema, e o `Input` lhe daria a moldura de um campo. */}
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
                    </Label>
                </div>
            </FieldSet>

            <FieldSet className="gap-2">
                <FieldLegend variant="label">Ícone</FieldLegend>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    size="lg"
                    value={icon}
                    onValueChange={(next) => {
                        if (next) onIconChange(next as typeof icon)
                    }}
                    aria-label="Ícone"
                    className="grid grid-cols-5 gap-2"
                >
                    {WORKSPACE_ICON_KEYS.map((key) => {
                        const Cmp = WORKSPACE_ICON_MAP[key]
                        return (
                            <ToggleGroupItem
                                key={key}
                                value={key}
                                className="size-11"
                                aria-label={`Ícone ${WORKSPACE_ICON_LABELS[key]}`}
                            >
                                {createElement(Cmp, {
                                    className: "size-5",
                                })}
                            </ToggleGroupItem>
                        )
                    })}
                </ToggleGroup>
            </FieldSet>

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
