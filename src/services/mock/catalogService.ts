import type { CatalogService, Department, Programme, StudyLevel } from "../types";
import { wait } from "./db";

export const DEPARTMENTS: Department[] = [
  { id: "accounting", name: "Accounting" },
  { id: "computer-engineering", name: "Computer Engineering" },
  { id: "computer-science", name: "Computer Science" },
  { id: "economics", name: "Economics" },
  { id: "english", name: "English" },
  { id: "law", name: "Law" },
  { id: "marketing", name: "Marketing and Customer Management" },
  { id: "mathematics", name: "Mathematics" },
  { id: "nursing", name: "Nursing and Midwifery" },
  { id: "political-science", name: "Political Science" },
  { id: "psychology", name: "Psychology" },
];

export const PROGRAMMES: Programme[] = [
  { id: "bsc-accounting", name: "BSc Administration (Accounting)", departmentId: "accounting", studyLevel: "undergraduate" },
  { id: "bsc-computer-engineering", name: "BSc Computer Engineering", departmentId: "computer-engineering", studyLevel: "undergraduate" },
  { id: "bsc-computer-science", name: "BSc Computer Science", departmentId: "computer-science", studyLevel: "undergraduate" },
  { id: "bsc-information-technology", name: "BSc Information Technology", departmentId: "computer-science", studyLevel: "undergraduate" },
  { id: "ba-economics", name: "BA Economics", departmentId: "economics", studyLevel: "undergraduate" },
  { id: "ba-english", name: "BA English", departmentId: "english", studyLevel: "undergraduate" },
  { id: "llb", name: "Bachelor of Laws (LLB)", departmentId: "law", studyLevel: "undergraduate" },
  { id: "bsc-marketing", name: "BSc Administration (Marketing)", departmentId: "marketing", studyLevel: "undergraduate" },
  { id: "bsc-mathematics", name: "BSc Mathematics", departmentId: "mathematics", studyLevel: "undergraduate" },
  { id: "bsc-nursing", name: "BSc Nursing", departmentId: "nursing", studyLevel: "undergraduate" },
  { id: "ba-political-science", name: "BA Political Science", departmentId: "political-science", studyLevel: "undergraduate" },
  { id: "ba-psychology", name: "BA Psychology", departmentId: "psychology", studyLevel: "undergraduate" },
  { id: "mba-accounting", name: "MBA Accounting", departmentId: "accounting", studyLevel: "postgraduate" },
  { id: "msc-computer-science", name: "MSc Computer Science", departmentId: "computer-science", studyLevel: "postgraduate" },
  { id: "mphil-economics", name: "MPhil Economics", departmentId: "economics", studyLevel: "postgraduate" },
  { id: "llm", name: "Master of Laws (LLM)", departmentId: "law", studyLevel: "postgraduate" },
  { id: "msc-nursing", name: "MSc Nursing", departmentId: "nursing", studyLevel: "postgraduate" },
  { id: "mphil-political-science", name: "MPhil Political Science", departmentId: "political-science", studyLevel: "postgraduate" },
  { id: "mphil-clinical-psychology", name: "MPhil Clinical Psychology", departmentId: "psychology", studyLevel: "postgraduate" },
];

const LEVELS: Record<StudyLevel, string[]> = {
  undergraduate: ["Level 100", "Level 200", "Level 300", "Level 400"],
  postgraduate: ["Year 1", "Year 2", "Year 3", "Year 4"],
};

export const mockCatalogService: CatalogService = {
  async forStudyLevel(level) {
    await wait(500);
    const programmes = PROGRAMMES.filter((p) => p.studyLevel === level);
    const departmentIds = new Set(programmes.map((p) => p.departmentId));
    return {
      departments: DEPARTMENTS.filter((d) => departmentIds.has(d.id)),
      programmes,
      levels: LEVELS[level],
    };
  },
};
