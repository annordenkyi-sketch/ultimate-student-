import { services } from "@/services";
import { useAsync } from "@/lib/useAsync";

/** End date of the current semester ("YYYY-MM-DD"), for default goal deadlines. Null while loading. */
export const useSemester = () => {
  const { state, reload } = useAsync(() => services.courses.semesters(), []);
  const current = state.status === "ready" ? (state.data.find((s) => s.current) ?? state.data[state.data.length - 1] ?? null) : null;
  return { semester: current, failed: state.status === "error", reload };
};
