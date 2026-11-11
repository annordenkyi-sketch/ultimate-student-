import { MobileBackButton } from "./MobileBackButton";
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
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[var(--app-max)] items-center gap-3 px-4 pb-2 pt-3">
        {showBack && <MobileBackButton onlyMobile={false} />}
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
