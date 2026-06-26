"use client";

import clsx from "clsx";
import { Coins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastViewport } from "@/components/ui/feedback";
import { useTessera } from "@/lib/client/store";
import { NAV_ITEMS } from "./nav";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CurrencyChip() {
  const { playerCurrency } = useTessera();
  return (
    <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 px-3 py-1 text-sm font-semibold tabular-nums text-gold">
      <Coins size={15} />
      {playerCurrency}
    </span>
  );
}

function Brand() {
  return (
    <Link href="/play" className="flex items-center gap-2">
      <img src="/tessera-mark.svg" alt="" className="h-8 w-8" />
      <span className="heading font-display text-xl font-bold">Tessera</span>
    </Link>
  );
}

function NavRail() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface px-3 py-5 backdrop-blur-sm lg:flex">
      <div className="px-2 pb-5">
        <Brand />
      </div>
      <nav className="flex flex-col">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "heading flex items-center gap-3 px-3 py-3 text-sm font-semibold transition-colors duration-fast",
                active ? "row-select text-content" : "text-content-muted hover:text-content"
              )}
            >
              <Icon size={18} className={active ? "text-accent" : undefined} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
              active ? "text-accent" : "text-content-muted"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
      <Brand />
      <CurrencyChip />
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <div className="hidden items-center justify-end px-6 py-4 lg:flex">
          <CurrencyChip />
        </div>
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <ToastViewport />
    </div>
  );
}
