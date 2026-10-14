"use client"

import { createElement } from "react"
import { CheckIcon, EyeDropperIcon } from "@heroicons/react/16/solid"
import { Label } from "@/components/ui/label"
import { toggleStyle, toggleVariants } from "@/components/ui/toggle"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
    Field,
    FieldControl,
    FieldCounter,
    FieldDescription,
    FieldHeader,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import { WorkspaceBrandMark } from "@/components/workspace/workspace-brand-mark"
import { Input } from "@/components/ui/input"
import { FormError } from "@/components/ui/form"
import {
    WORKSPACE_ACCENT_PALETTE,
    WORKSPACE_ICON_KEYS,
    WORKSPACE_ICON_MAP,
    type WorkspaceIconKey,
    WORKSPACE_ICON_LABELS,
} from "@/lib/workspace-icons"
import { TILE_PALETTE, TILE_WORKSPACE_DEFAULT } from "@/lib/tile-palette"
import { cn } from "@/lib/utils"

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
    /** A frase sob o nome, que diz onde a marca aparece. */
    previewHint: string
}

/** O teto do nome da carteira — o contador acima lê daqui. */
const NOME_MAX = 120

/**
 * Cor e ícone dividem a mesma grade de 36px, com o vão distribuído: as nove
 * amostras (oito da paleta e a livre) cabem numa fileira, e os ícones caem nas
 * mesmas colunas. No telefone a grade refaz as colunas pela largura.
 */
const GRADE = "grid grid-cols-[repeat(auto-fill,--spacing(9))] justify-between gap-2"

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
    const daPaleta =
        WORKSPACE_ACCENT_PALETTE.find(
            (hex) => hex.toLowerCase() === previewColor.toLowerCase()
        ) ?? ""

    return (
        <div className="flex flex-col gap-6">
            {/* A prévia é a própria marca, ao lado do nome: o que se digita e o
                que se escolhe abaixo aparecem juntos, como na barra lateral. */}
            <Field>
                <FieldHeader>
                    <FieldLabel>Nome</FieldLabel>
                    {/* O `maxLength` truncava calado: o campo simplesmente parava
                        de aceitar tecla. O contador só aparece perto do teto. */}
                    <FieldCounter value={name} max={NOME_MAX} />
                </FieldHeader>
                <div className="flex items-center gap-3">
                    <WorkspaceBrandMark
                        iconKey={icon}
                        backgroundColor={previewColor}
                        size="xl"
                    />
                    <FieldControl>
                        <Input
                            id={nameId}
                            size="xl"
                            className="min-w-0 flex-1"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="Ex.: Casa, Freelance"
                            autoComplete="off"
                            maxLength={NOME_MAX}
                        />
                    </FieldControl>
                </div>
                <FieldDescription>{previewHint}</FieldDescription>
            </Field>

            <FieldSet className="gap-3">
                <FieldLegend variant="label">Cor</FieldLegend>
                <ToggleGroup
                    type="single"
                    value={daPaleta}
                    onValueChange={(next) => {
                        if (next) onPreviewColorChange(next)
                    }}
                    aria-label="Cor"
                    variant="swatch"
                    size="icon-lg"
                    className={GRADE}
                >
                    {/* A paleta de destaque é a do ladrilho (`TILE_COLORS`),
                        e com ela vem o nome: a amostra deixa de soletrar
                        um hexadecimal no leitor de tela, como na categoria. */}
                    {TILE_PALETTE.map(({ hex, nome }) => (
                        <ToggleGroupItem
                            key={hex}
                            value={hex}
                            color={hex}
                            aria-label={`Cor ${nome}`}
                        />
                    ))}
                    {/* A cor livre é a nona amostra. O seletor nativo não tem peça
                        no sistema: ele mora escondido dentro de um `Label` que
                        veste a amostra (`toggleVariants` + `toggleStyle`), cinza
                        com o conta-gotas até a pessoa escolher, e então na cor
                        dela, com o tique das outras. */}
                    <Label
                        data-state={daPaleta ? "off" : "on"}
                        className={cn(
                            toggleVariants({ variant: "swatch", size: "icon-lg" }),
                            "relative cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-ring/45"
                        )}
                        style={toggleStyle(daPaleta ? null : previewColor)}
                    >
                        {daPaleta ? <EyeDropperIcon aria-hidden /> : <CheckIcon aria-hidden />}
                        <input
                            type="color"
                            value={
                                /^#[0-9A-Fa-f]{6}$/.test(previewColor)
                                    ? previewColor
                                    : TILE_WORKSPACE_DEFAULT
                            }
                            onChange={(e) => onPreviewColorChange(e.target.value)}
                            className="sr-only"
                            aria-label="Outra cor"
                        />
                    </Label>
                </ToggleGroup>
            </FieldSet>

            <FieldSet className="gap-3">
                <FieldLegend variant="label">Ícone</FieldLegend>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    size="icon-lg"
                    value={icon}
                    onValueChange={(next) => {
                        if (next) onIconChange(next as typeof icon)
                    }}
                    aria-label="Ícone"
                    className={GRADE}
                >
                    {WORKSPACE_ICON_KEYS.map((key) => (
                        <ToggleGroupItem
                            key={key}
                            value={key}
                            aria-label={`Ícone ${WORKSPACE_ICON_LABELS[key]}`}
                        >
                            {createElement(WORKSPACE_ICON_MAP[key])}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </FieldSet>

            <FormError className="font-medium">{displayError}</FormError>
        </div>
    )
}
