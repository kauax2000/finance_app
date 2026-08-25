"use client"

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function MenubarDoc() {
  return (
    <>
      <Usage>
        A barra de menus de aplicativo de desktop. Faz sentido em ferramentas densas, com dezenas de comandos por assunto. Este app não é uma delas.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Exportar<MenubarShortcut>⌘E</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}
        previewClassName="items-start"
      >
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Exportar CSV
                <MenubarShortcut>⌘E</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Importar extrato</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Ocultar valores</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </DocSection>

      <DocNote title="Está no catálogo, mas provavelmente não deveria ir para uma tela">
        A navegação deste produto é a <code>Sidebar</code> e a ilha do telefone. Uma barra de menus seria um terceiro sistema; ele existe aqui por paridade de catálogo.
      </DocNote>
    </>
  )
}
