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
        Uma gaveta que se arrasta. A diferença para o <code>Sheet</code> é física: acompanha o dedo, tem inércia e fecha pelo gesto. Vale quando abrir e fechar é casual.
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
                <Button type="button" variant="tertiary">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </DocSection>

      <DocNote title="Drawer ou Sheet?">
        O app resolve formulário no telefone com <code>Sheet side=&quot;bottom&quot;</code>, e ali o arraste atrapalha: rolar disputa com fechar. Use Drawer para conteúdo curto que não rola.
      </DocNote>
    </>
  )
}
