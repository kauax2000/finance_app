"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function DrawerDoc() {
  return (
    <>
      <Usage>
        Uma gaveta que se arrasta. A diferença para o <code>Sheet</code>{" "}
        é
        física: o Drawer acompanha o dedo, tem inércia e fecha pelo gesto. Vale
        quando abrir e fechar é frequente e casual — uma prévia, um seletor
        rápido.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Drawer>
  <DrawerTrigger asChild><Button>Abrir</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filtros</DrawerTitle>
    </DrawerHeader>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Abrir filtros</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
              <DrawerDescription>
                Arraste para baixo para fechar.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Aplicar</Button>
              <DrawerClose asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </DocSection>

      <DocNote title="Drawer ou Sheet?">
        O app já resolve formulário no telefone com{" "}
        <code>Sheet side=&quot;bottom&quot; fillMobileViewport</code>, e ali o
        arraste é um problema: um formulário longo precisa rolar, e o gesto de
        rolar disputa com o gesto de fechar. Use Drawer para conteúdo curto que
        não rola.
      </DocNote>
    </>
  )
}
