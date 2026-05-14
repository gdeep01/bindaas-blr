import { LayoutDashboard, Map, Brain, Mountain, Smile, Trash2, Activity } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Live City Map', url: '/map', icon: Map },
  { title: 'Smart Predictions', url: '/ai-insights', icon: Brain },
  { title: 'Area Livability', url: '/mood-index', icon: Smile },
  { title: 'Garbage Reports', url: '/garbage', icon: Trash2 },
  { title: 'Landslide & Disasters', url: '/landslide', icon: Mountain },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-card shrink-0">
            <Activity className="w-4 h-4 text-primary not-italic" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="truncate text-sm italic text-foreground">Bindaas BLR</h1>
              <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Bengaluru Traffic Intelligence</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-muted/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
