import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, FlaskConical, Hash, Search } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface SkuPickerProps {
  value: string;
  isTemp: boolean;
  onChange: (value: string, isTemp: boolean, materialId?: string) => void;
  materialId?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

/**
 * Searches the materials catalog by SKU/name. Toggle "Override SKU" to enter a
 * temporary SKU (TMP-prefixed) for one-off supplier samples that aren't yet in
 * the ERP catalog. The temp SKU can be promoted to a real material later.
 */
export function SkuPicker({
  value,
  isTemp,
  onChange,
  materialId,
  placeholder = 'Search SKU or material name…',
  error,
  disabled,
}: SkuPickerProps) {
  const { data: materials = [], isLoading } = useMaterials();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => materials.find((m: any) => m.id === materialId),
    [materials, materialId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials.slice(0, 50);
    return materials
      .filter(
        (m: any) =>
          m.material_code?.toLowerCase().includes(q) ||
          m.name?.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [materials, search]);

  const handleToggleTemp = (next: boolean) => {
    if (next) {
      // Switching to temp: seed with TMP- if empty
      const seed = value && value.toUpperCase().startsWith('TMP-')
        ? value
        : `TMP-${new Date().getFullYear()}-`;
      onChange(seed, true, undefined);
    } else {
      // Switching back: clear so the user picks from catalog
      onChange('', false, undefined);
    }
  };

  const handleTempChange = (raw: string) => {
    // Force TMP- prefix as the user types
    let v = raw.trim();
    if (v && !v.toUpperCase().startsWith('TMP-')) {
      v = `TMP-${v.replace(/^tmp-?/i, '')}`;
    }
    onChange(v, true, undefined);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor="sku-toggle"
          className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground cursor-pointer"
        >
          <Switch
            id="sku-toggle"
            checked={isTemp}
            onCheckedChange={handleToggleTemp}
            disabled={disabled}
          />
          Override SKU (temporary)
        </Label>
        {isTemp && (
          <Badge variant="outline" className="bg-warning-soft text-warning border-warning/30 text-[10px]">
            TEMP
          </Badge>
        )}
      </div>

      {isTemp ? (
        <div className="space-y-1">
          <div className="relative">
            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => handleTempChange(e.target.value)}
              placeholder="TMP-2026-001"
              maxLength={100}
              disabled={disabled}
              className={cn('pl-8 font-mono text-sm', error && 'border-destructive')}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use for new supplier samples not yet in ERP. Must start with{' '}
            <code className="font-mono">TMP-</code>. You can promote it to the catalog later.
          </p>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                'w-full justify-between h-10 font-normal',
                !value && 'text-muted-foreground',
                error && 'border-destructive',
              )}
            >
              <span className="flex items-center gap-2 min-w-0 truncate">
                <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
                {value ? (
                  <>
                    <span className="font-mono text-sm">{value}</span>
                    {selected?.name && (
                      <span className="text-xs text-muted-foreground truncate">
                        — {selected.name}
                      </span>
                    )}
                  </>
                ) : (
                  placeholder
                )}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search by SKU or name…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? 'Loading catalog…' : (
                    <div className="px-3 py-4 text-center text-xs space-y-2">
                      <div className="text-muted-foreground">
                        No material matches “{search}”.
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => {
                          handleToggleTemp(true);
                          setOpen(false);
                        }}
                      >
                        + Use as temporary SKU
                      </Button>
                    </div>
                  )}
                </CommandEmpty>
                {value && (
                  <CommandGroup heading="Selection">
                    <CommandItem
                      onSelect={() => {
                        onChange('', false, undefined);
                        setOpen(false);
                      }}
                    >
                      <span className="text-xs text-muted-foreground">Clear selection</span>
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup heading="Materials catalog">
                  {filtered.map((m: any) => {
                    const sku = m.material_code || '';
                    const isActive = m.id === materialId;
                    return (
                      <CommandItem
                        key={m.id}
                        value={`${sku} ${m.name}`}
                        onSelect={() => {
                          onChange(sku, false, m.id);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-3.5 w-3.5',
                            isActive ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold">
                              {sku || <em className="text-muted-foreground">no code</em>}
                            </span>
                            {m.material_type && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4">
                                {m.material_type}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {m.name}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
