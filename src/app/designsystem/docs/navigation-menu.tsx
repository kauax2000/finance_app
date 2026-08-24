"use client"

import Link from "next/link"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { DocNote, DocSection, Usage } from "../ds-doc"

export default function NavigationMenuDoc() {
  return (
    <>
      <Usage>
        Navegação horizontal com painéis suspensos, do tipo que um site
        institucional usa no topo. A navegação <em>deste</em> produto é a{" "}
        <code>Sidebar</code> no desktop e a ilha na base no telefone.
      </Usage>

      <DocSection
        title="Padrão"
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
      <NavigationMenuContent>…</NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`}
        previewClassName="items-start"
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Finanças</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-64 gap-1 p-2">
                  {["Carteiras", "Cartões", "Assinaturas"].map((item) => (
                    <li key={item}>
                      <NavigationMenuLink asChild>
                        <Link
                          href="#"
                          className="block rounded-md p-2 text-sm hover:bg-accent active:bg-accent"
                        >
                          {item}
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </DocSection>

      <DocNote title="Um terceiro sistema de navegação seria um a mais">
        Este app já tem dois: a barra lateral e a ilha do telefone. Somar uma
        barra suspensa no topo daria três lugares onde procurar a mesma tela.
        Está no catálogo por paridade; usá-lo numa tela pede uma conversa antes.
      </DocNote>
    </>
  )
}
