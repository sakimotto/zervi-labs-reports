import {
  LayoutDashboard,
  FlaskConical,
  TestTubes,
  Truck,
  Users,
  BookOpen,
  ChevronLeft,
  Cpu,
  Layers,
  BookMarked,
  ClipboardList,
  Sparkles,
  CheckSquare,
  CalendarRange,
  Settings,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useUserRole';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Lab Copilot', url: '/copilot', icon: Sparkles },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Planning', url: '/planning', icon: CalendarRange },
  { title: 'Tests', url: '/tests', icon: FlaskConical },
  { title: 'Test Programs', url: '/test-programs', icon: ClipboardList },
  { title: 'Test Methods', url: '/test-methods', icon: TestTubes },
  { title: 'SOPs', url: '/sops', icon: BookOpen },
];

const labNav = [
  { title: 'Equipment', url: '/equipment', icon: Cpu },
  { title: 'Materials', url: '/materials', icon: Layers },
  { title: 'Standards', url: '/standards', icon: BookMarked },
];

const directoryNav = [
  { title: 'Suppliers', url: '/suppliers', icon: Truck },
  { title: 'Customers', url: '/customers', icon: Users },
];

const adminNav = [
  { title: 'Request Templates', url: '/admin/request-templates', icon: Sparkles },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;
  const isAdmin = useIsAdmin();

  const isActive = (path: string) =>
    path === '/' ? currentPath === '/' : currentPath.startsWith(path);

  const renderGroup = (label: string, items: typeof mainNav) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/50 px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors relative"
                >
                  <NavLink to={item.url} end={item.url === '/'}>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-sidebar-primary" />
                    )}
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-gradient-primary flex items-center justify-center shadow-elevated shrink-0">
            <FlaskConical className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-tight text-sidebar-foreground">ZERVI ASIA</span>
              <span className="text-[10px] text-sidebar-foreground/60 leading-none">Laboratory Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {renderGroup('Main', mainNav)}
        {renderGroup('Lab Resources', labNav)}
        {renderGroup('Directory', directoryNav)}
        {isAdmin && renderGroup('Admin', adminNav)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
