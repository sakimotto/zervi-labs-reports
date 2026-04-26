import { useCallback, useEffect, useState } from "react";
import { SKILL_MODES, type SkillModeId, type StarterPrompt } from "@/components/copilot/skillModes";

const STORAGE_KEY = "lab-copilot-starter-overrides-v1";

type OverridesMap = Partial<Record<SkillModeId, StarterPrompt[]>>;

function readStorage(): OverridesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(map: OverridesMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  // Notify other listeners in the same tab
  window.dispatchEvent(new CustomEvent("lab-copilot-starters-updated"));
}

/**
 * Per-mode starter prompt overrides, persisted in localStorage.
 * Falls back to the built-in starters defined in skillModes.ts when no
 * override exists for a mode.
 */
export function useStarterOverrides() {
  const [overrides, setOverrides] = useState<OverridesMap>(() => readStorage());

  // Sync across tabs and from save() calls in the same tab.
  useEffect(() => {
    const refresh = () => setOverrides(readStorage());
    window.addEventListener("storage", refresh);
    window.addEventListener("lab-copilot-starters-updated", refresh as EventListener);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("lab-copilot-starters-updated", refresh as EventListener);
    };
  }, []);

  const getStarters = useCallback(
    (modeId: SkillModeId): StarterPrompt[] => {
      return overrides[modeId] ?? SKILL_MODES[modeId].starters;
    },
    [overrides]
  );

  const saveStarters = useCallback((modeId: SkillModeId, starters: StarterPrompt[]) => {
    const next = { ...readStorage(), [modeId]: starters };
    writeStorage(next);
  }, []);

  const resetStarters = useCallback((modeId: SkillModeId) => {
    const next = { ...readStorage() };
    delete next[modeId];
    writeStorage(next);
  }, []);

  const isCustomized = useCallback(
    (modeId: SkillModeId) => Boolean(overrides[modeId]),
    [overrides]
  );

  return { getStarters, saveStarters, resetStarters, isCustomized };
}
