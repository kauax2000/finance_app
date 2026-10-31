"use client"

import { useRef, useState } from "react"
import { useWorkspace } from "@/components/workspace-provider"
import { WorkspaceAppearanceFormFields } from "@/components/workspace/workspace-appearance-form-fields"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CustomForm, FormCancel, FormSubmit } from "@/components/ui/form"
import { randomWorkspaceAccentColor, type WorkspaceIconKey } from "@/lib/workspace-icons"
import { ModelosDeCarteiraWireframe } from "@/components/wireframe/modelos-de-carteira-wireframe"
import { CarteiraProjetoForm } from "@/components/settings/carteira-projeto-form"
import type { Workspace } from "@/lib/supabase"
import { AINDA_NAO_DISPONIVEL, criarCarteiraDeModelo } from "@/lib/projetos/dados"
import { MODELOS_DE_CARTEIRA, type ModeloDeCarteira } from "@/lib/projetos/modelos"

export type ProjectFormDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}


export function ProjectFormDialog({
    open,
    onOpenChange,
}: ProjectFormDialogProps) {
    const { createWorkspace, updateWorkspace, refreshWorkspaces, setCurrentWorkspaceId, error: contextError } = useWorkspace()
    // A carteira criada espera o diálogo terminar de sair para virar a atual.
    const criada = useRef<string | null>(null)

    const [name, setName] = useState("")
    const [icon, setIcon] = useState<WorkspaceIconKey>("home")
    const [previewColor, setPreviewColor] = useState(() =>
        randomWorkspaceAccentColor()
    )
    const [modelo, setModelo] = useState<ModeloDeCarteira | null>(null)
    // A carteira de um modelo de projeto, já criada: o passo das datas e do orçamento.
    const [carteiraDeProjeto, setCarteiraDeProjeto] = useState<Workspace | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    // Enquanto cria, o `pending` do `Dialog` já segura todo pedido de fechar.
    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setLocalError(null)
        }
        onOpenChange(next)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        const trimmed = name.trim()
        // A Pessoal não cria nada: o nome não vale nela.
        if (!trimmed && modelo !== "pessoal") {
            setLocalError("Informe um nome para a carteira.")
            return
        }

        if (modelo) {
            // O modelo (Bloco 7C) cria pela RPC, com as categorias e o modo dele.
            setSubmitting(true)
            try {
                const r = await criarCarteiraDeModelo(modelo, trimmed)
                if (!r.disponivel) {
                    setLocalError(AINDA_NAO_DISPONIVEL)
                    return
                }
                criada.current = r.dados
                // O ícone e a cor que a pessoa escolheu valem sobre os do modelo.
                if (modelo !== "pessoal") {
                    await updateWorkspace(r.dados, { icon, icon_background_color: previewColor })
                }
                const lista = await refreshWorkspaces()
                const nova = lista.find((w) => w.id === r.dados)
                const deProjeto = MODELOS_DE_CARTEIRA.find((m) => m.id === modelo)?.purpose === "project"
                if (deProjeto && nova) setCarteiraDeProjeto(nova)
                else onOpenChange(false)
            } catch (e) {
                setLocalError(e instanceof Error ? e.message : "Não foi possível criar a carteira.")
            } finally {
                setSubmitting(false)
            }
            return
        }

        setSubmitting(true)
        const created = await createWorkspace({
            name: trimmed,
            icon,
            type: "shared",
            icon_background_color: previewColor,
        })
        setSubmitting(false)
        if (created) {
            criada.current = created.id
            onOpenChange(false)
        }
    }

    const displayError = localError ?? contextError

    // Diálogo no desktop, gaveta alta no telefone (`surface="auto"`).
    return (
        <Dialog
            surface="auto"
            pending={submitting}
            open={open}
            onOpenChange={handleOpenChange}
        >
            {/* O `onCloseAutoFocus` chega depois da animação de saída (o Radix
                desmonta o conteúdo só quando ela acaba): só então a carteira
                nova entra, com a troca animada do provedor. */}
            <DialogContent
                layout="fixed"
                onCloseAutoFocus={() => {
                    const id = criada.current
                    criada.current = null
                    if (id) void setCurrentWorkspaceId(id)
                }}
            >
                <DialogHeader>
                    <DialogTitle>Nova carteira</DialogTitle>
                </DialogHeader>
                {carteiraDeProjeto ? (
                    <CarteiraProjetoForm
                        key={carteiraDeProjeto.id}
                        workspace={carteiraDeProjeto}
                        onSalvo={() => onOpenChange(false)}
                        onCancelar={() => onOpenChange(false)}
                        onPendente={setSubmitting}
                        cancelarLabel="Agora não"
                    />
                ) : (
                    <CustomForm
                        pending={submitting}
                        onSubmit={(e) => void handleSubmit(e)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <DialogBody>
                            <ModelosDeCarteiraWireframe
                                modelo={modelo}
                                onModeloChange={setModelo}
                                erro={modelo === "pessoal" ? displayError : null}
                            />
                            {/* A Pessoal não cria nada: sem nome nem aparência. */}
                            {modelo === "pessoal" ? null : (
                                <WorkspaceAppearanceFormFields
                                    name={name}
                                    onNameChange={setName}
                                    icon={icon}
                                    onIconChange={setIcon}
                                    previewColor={previewColor}
                                    onPreviewColorChange={setPreviewColor}
                                    displayError={displayError}
                                    idPrefix="project-dialog-create"
                                    previewHint="Assim ela aparece na barra lateral e nos menus."
                                />
                            )}
                        </DialogBody>
                        <DialogFooter>
                            <DialogClose asChild>
                                <FormCancel>Cancelar</FormCancel>
                            </DialogClose>
                            <FormSubmit>{modelo === "pessoal" ? "Abrir a Pessoal" : "Criar carteira"}</FormSubmit>
                        </DialogFooter>
                    </CustomForm>
                )}
            </DialogContent>
        </Dialog>
    )
}
