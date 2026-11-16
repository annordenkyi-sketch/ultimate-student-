import { services, type StudentAccount } from "@/services";
import { useAsync } from "./useAsync";

/** Programme and department names for the student's academic profile. Null while loading. */
export const useAcademicNames = (account: StudentAccount | null) => {
  const level = account?.studyLevel ?? "undergraduate";
  const { state } = useAsync(() => services.catalog.forStudyLevel(level), [level]);
  const academic = account?.academic;
  if (!academic || state.status !== "ready") return null;
  return {
    programme: state.data.programmes.find((p) => p.id === academic.programmeId)?.name ?? null,
    department: state.data.departments.find((d) => d.id === academic.departmentId)?.name ?? null,
    level: academic.level,
  };
};
