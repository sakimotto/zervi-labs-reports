import { ReactNode, useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, idx: number) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right' | 'center';
  width?: string;
  className?: string;
  headerClassName?: string;
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  className?: string;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  rowClassName?: (row: T) => string;
  /** Enable bulk selection (checkbox column) */
  selectable?: boolean;
  /** Controlled selection state */
  selectedIds?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (selected: Set<string>) => void;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  emptyState,
  className,
  defaultSort,
  rowClassName,
  selectable,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [data, columns, sort]);

  const toggleSort = (key: string) => {
    setSort((curr) => {
      if (!curr || curr.key !== key) return { key, direction: 'asc' };
      if (curr.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const allIds = useMemo(() => sorted.map((r) => String(rowKey(r))), [sorted, rowKey]);
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedIds?.has(id));
  const someSelected = selectable && allIds.some((id) => selectedIds?.has(id));

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allSelected) {
      allIds.forEach((id) => next.delete(id));
    } else {
      allIds.forEach((id) => next.add(id));
    }
    onSelectionChange(next);
  }, [allIds, allSelected, onSelectionChange, selectedIds]);

  const toggleOne = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      onSelectionChange(next);
    },
    [onSelectionChange, selectedIds],
  );

  const hideClass = (h?: 'sm' | 'md' | 'lg') =>
    h === 'sm' ? 'hidden sm:table-cell'
    : h === 'md' ? 'hidden md:table-cell'
    : h === 'lg' ? 'hidden lg:table-cell'
    : '';

  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  if (data.length === 0 && emptyState) {
    return <Card className={cn('overflow-hidden p-0 shadow-card', className)}>{emptyState}</Card>;
  }

  return (
    <Card className={cn('overflow-hidden p-0 shadow-card', className)}>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 backdrop-blur-sm sticky top-0 z-10">
            <tr className="border-b border-border">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => {
                const sortable = !!col.sortValue;
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                      alignClass(col.align),
                      hideClass(col.hideBelow),
                      sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.headerClassName,
                    )}
                    onClick={sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}>
                      {col.header}
                      {sortable && (
                        isSorted ? (
                          sort!.direction === 'asc'
                            ? <ChevronUp className="h-3 w-3" />
                            : <ChevronDown className="h-3 w-3" />
                        ) : <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const id = String(rowKey(row));
              const isSelected = selectedIds?.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border/60 last:border-b-0 transition-colors',
                    idx % 2 === 1 && 'bg-card-muted',
                    isSelected && 'bg-primary-soft/40',
                    onRowClick && 'cursor-pointer hover:bg-primary-soft/40',
                    rowClassName?.(row),
                  )}
                >
                  {selectable && (
                    <td
                      className="w-10 px-3 py-2.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(id);
                      }}
                    >
                      <Checkbox
                        checked={!!isSelected}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5',
                        alignClass(col.align),
                        hideClass(col.hideBelow),
                        col.className,
                      )}
                    >
                      {col.cell(row, idx)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Convenience cell for row actions menu trigger or icon button cluster. */
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export { MoreHorizontal };
