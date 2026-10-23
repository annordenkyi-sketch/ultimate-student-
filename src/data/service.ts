/**
 * dataService — the single swap-point for real APIs.
 *
 * Every screen reads data through this file. When you have real APIs,
 * replace each function body with `fetch(...)` and leave the signatures
 * alone. All functions return Promises so the UI already handles loading.
 */
import type {
  Announcement,
  Deadline,
  EventItem,
  NotificationItem,
  Profile,
  SearchResultGroup,
  SectionId,
  SectionItem,
} from "@/data/types";

import { academic } from "@/data/mocks/academic";
import { navigation } from "@/data/mocks/navigation";
import { accommodation } from "@/data/mocks/accommodation";
import { services } from "@/data/mocks/services";
import { social } from "@/data/mocks/social";
import { opportunities } from "@/data/mocks/opportunities";
import { announcements } from "@/data/mocks/announcements";
import { deadlines } from "@/data/mocks/deadlines";
import { events } from "@/data/mocks/events";
import { notifications } from "@/data/mocks/notifications";

const SECTIONS: Record<SectionId, SectionItem[]> = {
  academic,
  navigation,
  accommodation,
  services,
  social,
  opportunities,
};

// Small artificial delay so loading states are real.
const delay = <T>(value: T, ms = 180): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), ms));

export const dataService = {
  getSection(id: SectionId): Promise<SectionItem[]> {
    return delay(SECTIONS[id] ?? []);
  },

  getItem(section: SectionId, itemId: string): Promise<SectionItem | undefined> {
    return delay(SECTIONS[section]?.find((i) => i.id === itemId));
  },

  getAnnouncements(profile: Profile | null): Promise<Announcement[]> {
    const filtered = announcements.filter((a) => {
      if (!profile) return true;
      const { studentTypes, living, international } = a.audience;
      const typeOk = !studentTypes || studentTypes.includes(profile.studentType);
      const livingOk = !living || living.includes(profile.living);
      const intlOk = international == null || profile.isInternational === international;
      return typeOk && livingOk && intlOk;
    });
    return delay(filtered);
  },

  getDeadlines(): Promise<Deadline[]> {
    const sorted = [...deadlines].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return delay(sorted);
  },

  getEventsThisWeek(): Promise<EventItem[]> {
    const now = new Date();
    const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const filtered = events
      .filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= inAWeek;
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    // If no events fall in the real week (mock dates), return the first few.
    return delay(filtered.length ? filtered : events.slice(0, 3));
  },

  getNotifications(): Promise<NotificationItem[]> {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return delay(sorted);
  },

  search(query: string): Promise<SearchResultGroup[]> {
    const q = query.trim().toLowerCase();
    if (!q) return delay([]);
    const groups: SearchResultGroup[] = (
      Object.keys(SECTIONS) as SectionId[]
    ).map((section) => ({
      section,
      items: SECTIONS[section].filter((item) => {
        const haystack = [
          item.title,
          item.subtitle ?? "",
          item.summary,
          item.details ?? "",
          ...item.tags,
          item.location?.label ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      }),
    }));
    return delay(groups.filter((g) => g.items.length > 0));
  },

  getItemsByIds(ids: Array<{ section: SectionId; itemId: string }>): Promise<SectionItem[]> {
    const items: SectionItem[] = [];
    for (const { section, itemId } of ids) {
      const item = SECTIONS[section]?.find((i) => i.id === itemId);
      if (item) items.push(item);
    }
    return delay(items);
  },
};
