import type { CourseService } from "../types";
import { CATALOGUE, SEMESTERS, clone } from "./courseData";
import { wait } from "./db";

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export const mockCourseService: CourseService = {
  async semesters() {
    await wait(300);
    return clone(SEMESTERS);
  },
  async search(_semesterId, query) {
    await wait(350);
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return clone(
      CATALOGUE.filter(
        (c) => squash(c.code).includes(squash(q)) || c.title.toLowerCase().includes(q),
      ).slice(0, 8),
    );
  },
};
