import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";

interface Props {
  title?: string;
  showSearch?: boolean;
  showBack?: boolean;
}

export const AppHeader = ({
  title,
  showSearch = true,
  showBack = false,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const canGoBack = showBack && location.key !== "default";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[var(--app-max)] items-center gap-2 px-4 pb-2 pt-3">
        {canGoBack && (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="rounded-lg p-1.5 text-muted hover:bg-paper"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h1 className="text-base font-semibold text-ink">{title}</h1>
        )}
      </div>
      {showSearch && (
        <div className="mx-auto max-w-[var(--app-max)] px-4 pb-3">
          <SearchBar />
        </div>
      )}
    </header>
  );
};
