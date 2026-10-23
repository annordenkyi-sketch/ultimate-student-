import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChecklistTask } from "@/data/types";
import { defaultChecklist } from "@/data/mocks/checklist";
import { STORAGE_KEYS, storage } from "@/lib/storage";

interface ChecklistCtx {
  tasks: ChecklistTask[];
  toggleTask: (id: string) => void;
  resetChecklist: () => void;
  progress: { done: number; total: number };
}

const Ctx = createContext<ChecklistCtx | null>(null);

export const ChecklistProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [tasks, setTasks] = useState<ChecklistTask[]>(() =>
    storage.get<ChecklistTask[]>(STORAGE_KEYS.checklist, defaultChecklist),
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      );
      storage.set(STORAGE_KEYS.checklist, next);
      return next;
    });
  }, []);

  const resetChecklist = useCallback(() => {
    storage.set(STORAGE_KEYS.checklist, defaultChecklist);
    setTasks(defaultChecklist);
  }, []);

  const progress = useMemo(
    () => ({
      done: tasks.filter((t) => t.done).length,
      total: tasks.length,
    }),
    [tasks],
  );

  const value = useMemo(
    () => ({ tasks, toggleTask, resetChecklist, progress }),
    [tasks, toggleTask, resetChecklist, progress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useChecklist = (): ChecklistCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChecklist must be used inside ChecklistProvider");
  return ctx;
};
