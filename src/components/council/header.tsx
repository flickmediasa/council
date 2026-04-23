import Link from "next/link";
import { ViewSwitcher } from "./view-switcher";
import { MuteToggle } from "./mute-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-mono text-lg font-semibold tracking-tight"
        >
          Council
        </Link>
        <div className="flex items-center gap-2">
          <ViewSwitcher />
          <MuteToggle />
        </div>
      </div>
    </header>
  );
}
