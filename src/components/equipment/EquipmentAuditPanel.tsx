import { useEquipmentAudit } from '@/hooks/useEquipment';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Wrench, Shield, Plus, Pencil, Trash2, Activity } from 'lucide-react';

const HUMAN_FIELD: Record<string, string> = {
  name: 'Name', asset_tag: 'Asset Tag', category: 'Category', sub_type: 'Sub-type',
  status: 'Status', manufacturer: 'Manufacturer', model: 'Model', serial_number: 'Serial #',
  vendor: 'Vendor', purchase_date: 'Purchase Date', purchase_cost: 'Purchase Cost',
  warranty_until: 'Warranty Until', location: 'Location', room: 'Room', bench: 'Bench',
  assigned_operator: 'Operator', condition_rating: 'Condition Rating', photo_url: 'Photo',
  measurement_min: 'Measure Min', measurement_max: 'Measure Max', measurement_unit: 'Unit',
  accuracy: 'Accuracy', resolution: 'Resolution',
  operating_temp_min: 'Op Temp Min', operating_temp_max: 'Op Temp Max',
  operating_humidity_min: 'Op RH Min', operating_humidity_max: 'Op RH Max',
  power_requirements: 'Power', firmware_version: 'Firmware', software_version: 'Software',
  accessories: 'Accessories', calibration_interval_days: 'Cal Interval (days)',
  calibration_traceability: 'Traceability', accreditation_body: 'Accreditation',
  last_calibration_date: 'Last Calibration', next_calibration_due: 'Next Cal Due',
  notes: 'Notes',
};

function actionMeta(action: string) {
  if (action.startsWith('cal')) return { Icon: Shield, label: action.replace(/_/g, ' '), tone: 'bg-blue-500/10 text-blue-600' };
  if (action.startsWith('maint')) return { Icon: Wrench, label: action.replace(/_/g, ' '), tone: 'bg-amber-500/10 text-amber-600' };
  if (action === 'created') return { Icon: Plus, label: 'created', tone: 'bg-emerald-500/10 text-emerald-600' };
  if (action === 'deleted') return { Icon: Trash2, label: 'deleted', tone: 'bg-destructive/10 text-destructive' };
  if (action === 'updated') return { Icon: Pencil, label: 'updated', tone: 'bg-muted text-foreground' };
  return { Icon: Activity, label: action, tone: 'bg-muted text-muted-foreground' };
}

function fmtVal(v: any) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

export function EquipmentAuditPanel({ equipmentId }: { equipmentId: string }) {
  const { data: events = [], isLoading } = useEquipmentAudit(equipmentId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!events.length) return <p className="text-sm text-muted-foreground">No history yet.</p>;

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
      <ul className="space-y-4">
        {events.map(ev => {
          const { Icon, label, tone } = actionMeta(ev.action);
          const details = (ev.details as any) || {};
          const changes = details.changes as Record<string, { from: any; to: any }> | undefined;
          return (
            <li key={ev.id} className="relative">
              <span className={`absolute -left-[18px] top-0.5 h-4 w-4 rounded-full grid place-items-center ${tone}`}>
                <Icon className="h-2.5 w-2.5" />
              </span>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] capitalize">{label}</Badge>
                <span>{format(new Date(ev.created_at), 'MMM d, yyyy HH:mm')}</span>
                {ev.changed_by_name && <span>· {ev.changed_by_name}</span>}
              </div>
              {changes ? (
                <div className="text-xs space-y-0.5">
                  {Object.entries(changes).map(([field, diff]) => (
                    <div key={field} className="flex flex-wrap items-center gap-1">
                      <span className="font-medium">{HUMAN_FIELD[field] || field}:</span>
                      <span className="text-muted-foreground line-through">{fmtVal(diff.from)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{fmtVal(diff.to)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {Object.entries(details).map(([k, v]) => (
                    <span key={k} className="mr-3"><span className="font-medium">{HUMAN_FIELD[k] || k}:</span> {fmtVal(v)}</span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
