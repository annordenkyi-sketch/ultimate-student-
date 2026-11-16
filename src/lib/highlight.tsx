const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Props {
  text: string;
  query?: string;
}

/** Wraps each word of `query` found in `text` in a <mark>. */
export const Highlight = ({ text, query }: Props) => {
  const words = (query ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-oxford-sand px-0.5 text-oxford-ink">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};
