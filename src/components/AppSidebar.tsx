import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, GitBranch, MessagesSquare, GitCompare, ClipboardCheck, LogOut, Cpu, BookOpen, Workflow,
  Layers, Truck, ShoppingCart, BarChart3, FolderOpen,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const topItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderOpen },
];

const platformGroups = [
  { label: "NPI Intel", items: [
    { title: "Documents", url: "/documents", icon: FileText },
    { title: "Knowledge Board", url: "/knowledge", icon: BookOpen },
    { title: "Traceability", url: "/traceability", icon: GitBranch },
    { title: "Research", url: "/research", icon: MessagesSquare },
    { title: "Gate Reviews", url: "/gates", icon: ClipboardCheck },
    { title: "Changes", url: "/changes", icon: GitCompare },
  ]},
  { label: "BOM Intel", items: [{ title: "BOMs", url: "/bom", icon: Layers }] },
  { label: "Supply Intel", items: [{ title: "Suppliers", url: "/supply", icon: Truck }] },
  { label: "Procure Intel", items: [
    { title: "Procurement", url: "/procurement", icon: ShoppingCart },
    { title: "Spend Analytics", url: "/procurement/spend", icon: BarChart3 },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-glow shadow-elegant">
            <Cpu className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">Spectrum</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Engineering Agent</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {platformGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <div className="mb-1 px-3 pt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {group.label}
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink to={item.url} className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-accent-foreground">{user?.email}</p>
              <p className="text-[10px] text-muted-foreground">Signed in</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
