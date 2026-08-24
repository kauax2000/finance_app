"use client"

import {
  CreditCardIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DocNote, DocSection, Usage } from "../ds-doc"

const NAV = [
  { label: "Início", icon: LayoutDashboardIcon, active: true },
  { label: "Transações", icon: ReceiptIcon, badge: "42" },
  { label: "Carteiras", icon: WalletIcon },
  { label: "Cartões", icon: CreditCardIcon, badge: "3" },
]

export default function SidebarDoc() {
  return (
    <>
      <Usage>
        A navegação do desktop. Ela guarda o estado recolhido num cookie, então a
        escolha sobrevive ao recarregamento e não pisca no primeiro quadro — que
        é o defeito de guardar isso em <code>localStorage</code>.
      </Usage>

      <DocSection
        title="Estrutura"
        description="Grupo com rótulo, itens com ícone, e badge para contagem. O item ativo carrega isActive, que é o que o leitor de tela usa para dizer onde a pessoa está."
        code={`<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Finanças</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive>
              <LayoutDashboardIcon aria-hidden />
              Início
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</SidebarProvider>`}
        previewClassName="items-stretch p-0"
      >
        <div className="w-full overflow-hidden rounded-lg border border-border">
          <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="w-full">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Finanças</SidebarGroupLabel>
                  <SidebarMenu>
                    {NAV.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton isActive={item.active}>
                          <item.icon aria-hidden />
                          {item.label}
                        </SidebarMenuButton>
                        {item.badge ? (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>Conta</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <SettingsIcon aria-hidden />
                        Configurações
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </div>
      </DocSection>

      <DocNote title="Ela não existe no telefone">
        Abaixo de <code>md</code>{" "}
        a navegação é a ilha flutuante na base
        (<code>MobileNavIsland</code>) mais o menu de conta em folha. Não é a
        mesma barra encolhida: os alvos, a ordem e o que cabe são outros.
      </DocNote>

      <DocNote title="Recolhida, o rótulo vira tooltip">
        Com <code>collapsible=&quot;icon&quot;</code>, sobra o ícone. O{" "}
        <code>SidebarMenuButton</code> aceita <code>tooltip</code>{" "}
        para o nome
        continuar acessível — sem ele, a barra recolhida vira uma coluna de
        símbolos que só quem já sabe consegue usar.
      </DocNote>

      <DocNote title="A casca do app já está montada">
        <code>src/components/layout/</code> tem <code>app-sidebar</code>,{" "}
        <code>sidebar-app-shell</code> e <code>sidebar-user-profile</code>. Uma
        tela nova não monta a Sidebar: ela vive dentro dessa casca.
      </DocNote>
    </>
  )
}
