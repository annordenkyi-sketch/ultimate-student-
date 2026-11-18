import { Navigate, useLocation, useParams } from "react-router-dom";

/**
 * Short shareable links (flow 09), e.g. /lecture/CSCD301-2 or /news/midsem-timetable,
 * that open the matching screen. Any query string (such as ref=notification) is kept.
 */
const ALIASES = {
  lecture: (id: string) => `/lectures/${id}`,
  news: (id: string) => `/announcements/${id}`,
  event: (id: string) => `/events/${id}`,
  goal: (id: string) => `/for-you/goals/${id}`,
  deadline: (date: string) => `/for-you/plan?day=${date}`,
} as const;

export const LinkAlias = ({ kind }: { kind: keyof typeof ALIASES }) => {
  const { id = "" } = useParams();
  const { search } = useLocation();
  const target = ALIASES[kind](encodeURIComponent(id));
  const extra = search.replace(/^\?/, "");
  return <Navigate to={extra ? `${target}${target.includes("?") ? "&" : "?"}${extra}` : target} replace />;
};
