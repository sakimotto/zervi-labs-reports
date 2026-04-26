import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { SKILL_MODES, type SkillModeId, type StarterPrompt } from "@/components/copilot/skillModes";

const CACHE_KEY = "lab-copilot-starter-overrides-v1";

type OverridesMap = Partial<Record<SkillModeId, StarterPrompt[]>>;

function readCache(): OverridesMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(map: OverridesMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Per-mode starter prompt overrides.
 *
 * - Source of truth: `copilot_starter_overrides` (synced across devices via Supabase, RLS-protected).
 * - localStorage acts as a fast cache so the UI renders instantly on load and survives offline use.
 * - Falls back to built-in starters from skillModes.ts when no override exists.
 */
export function useStarterOverrides() {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState<OverridesMap>(() => readCache());

  // Hydrate from the database on auth change.
  useEffect(() => {
    if (!user) {
      setOverrides(readCache());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("copilot_starter_overrides")
        .select("mode, starters")
        .eq("user_id", user.id);
      if (cancelled || error || !data) return;
      const map: OverridesMap = {};
      for (const row of data) {
        const starters = Array.isArray(row.starters) ? (row.starters as unknown as StarterPrompt[]) : null;
        if (starters && starters.length > 0) {
          map[row.mode as SkillModeId] = starters;
        }
      }
      setOverrides(map);
      writeCache(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const getStarters = useCallback(
    (modeId: SkillModeId): StarterPrompt[] => {
      return overrides[modeId] ?? SKILL_MODES[modeId].starters;
    },
    [overrides]
  );

  const saveStarters = useCallback(
    async (modeId: SkillModeId, starters: StarterPrompt[]) => {
      // Optimistic local update.
      setOverrides((prev) => {
        const next = { ...prev, [modeId]: starters };
        writeCache(next);
        return next;
      });

      if (!user) {
        toast({
          title: "Saved locally",
          description: "Sign in to sync your starter cards across devices.",
        });
        return;
      }

      const { error } = await supabase
        .from("copilot_starter_overrides")
        .upsert(
          {
            user_id: user.id,
            mode: modeId,
            starters: starters as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,mode" }
        );

      if (error) {
        toast({
          title: "Sync failed",
          description: `${error.message} — kept local copy.`,
          variant: "destructive",
        });
      }
    },
    [user]
  );

  const resetStarters = useCallback(
    async (modeId: SkillModeId) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[modeId];
        writeCache(next);
        return next;
      });

      if (!user) return;

      const { error } = await supabase
        .from("copilot_starter_overrides")
        .delete()
        .eq("user_id", user.id)
        .eq("mode", modeId);

      if (error) {
        toast({
          title: "Reset failed to sync",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [user]
  );

  const isCustomized = useCallback(
    (modeId: SkillModeId) => Boolean(overrides[modeId]),
    [overrides]
  );

  return { getStarters, saveStarters, resetStarters, isCustomized };
}
