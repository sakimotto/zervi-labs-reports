import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  FlaskConical,
  ClipboardList,
  BookOpen,
  Cpu,
  Layers,
  FileText,
  Truck,
  Users,
  ScrollText,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, keywords: 'home overview' },
  { label: 'Tests', path: '/tests', icon: FlaskConical, keywords: 'samples jobs' },
  { label: 'Test Programs', path: '/test-programs', icon: ClipboardList, keywords: 'templates' },
  { label: 'Test Methods', path: '/test-methods', icon: BookOpen, keywords: 'methods library' },
  { label: 'Equipment', path: '/equipment', icon: Cpu, keywords: 'instruments calibration' },
  { label: 'Materials', path: '/materials', icon: Layers, keywords: 'fabric textile spec' },
  { label: 'Standards', path: '/standards', icon: FileText, keywords: 'specifications iso' },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, keywords: 'vendors' },
  { label: 'Customers', path: '/customers', icon: Users, keywords: 'clients oem brands' },
  { label: 'SOPs', path: '/sops', icon: ScrollText, keywords: 'procedures' },
];

const QUICK_CREATE = [
  { label: 'New Test', path: '/tests', state: { create: true }, icon: FlaskConical },
  { label: 'New Material', path: '/materials', state: { create: true }, icon: Layers },
  { label: 'New Equipment', path: '/equipment', state: { create: true }, icon: Cpu },
  { label: 'New Supplier', path: '/suppliers', state: { create: true }, icon: Truck },
  { label: 'New Customer', path: '/customers', state: { create: true }, icon: Users },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const go = (path: string, state?: any) => {
    onOpenChange(false);
    navigate(path, state ? { state } : undefined);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, create records, or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick create">
          {QUICK_CREATE.map((item) => (
            <CommandItem
              key={item.label}
              value={`create ${item.label}`}
              onSelect={() => go(item.path, item.state)}
            >
              <Plus className="mr-2 h-4 w-4 text-primary" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.keywords}`}
              onSelect={() => go(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
              <CommandShortcut>
                <ArrowRight className="h-3 w-3" />
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Hook to open palette via ⌘K / Ctrl+K. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return { open, setOpen };
}
