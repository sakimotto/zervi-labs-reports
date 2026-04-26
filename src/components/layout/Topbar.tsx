import { Search, Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import { CommandPalette, useCommandPalette } from '@/components/CommandPalette';

export function Topbar() {
  const { user, signOut } = useAuth();
  const { data: roles = [] } = useUserRoles();
  const navigate = useNavigate();
  const palette = useCommandPalette();
  const initials =
    user?.email
      ?.split('@')[0]
      .split(/[._-]/)
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/auth', { replace: true });
  };

  return (
    <>
      <header className="h-14 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-3 shrink-0 print:hidden sticky top-0 z-30">
        <SidebarTrigger className="shrink-0" />
        <div className="h-6 w-px bg-border shrink-0" />
        <Breadcrumbs className="shrink-0" />

        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            className="relative w-full max-w-md text-left h-8 rounded-md border border-transparent bg-muted/50 hover:bg-muted hover:border-border focus:bg-card focus:border-border focus:outline-none transition-colors px-8 text-sm text-muted-foreground"
            aria-label="Open command palette"
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" />
            Jump to page or create…
            <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold shrink-0 flex items-center justify-center hover:opacity-90 transition-opacity"
              aria-label="Account menu"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium truncate">{user?.email}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {(roles[0] ?? 'viewer').replace('_', ' ')}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
    </>
  );
}
