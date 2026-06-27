"use client";

import clsx from "clsx";
import { ArrowDownWideNarrow, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CardRarity } from "@/game/types";
import { affinityColor } from "@/lib/client/cards";
import { RARITY_FILTERS, SORT_OPTIONS, type CardFilterState, type CardSort } from "./filter";

export function FilterChip({
  label,
  active,
  dot,
  onClick
}: {
  label: string;
  active: boolean;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "heading flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-line text-content-faint hover:text-content"
      )}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {label}
    </button>
  );
}

type Props = CardFilterState & {
  affinities: string[];
  onQuery: (value: string) => void;
  onRarity: (value: CardRarity | "ALL") => void;
  onAffinity: (value: string) => void;
  onSort: (value: CardSort) => void;
};

/** Shared search + rarity/affinity chips + sort control for card surfaces. */
export function CardFilterBar({
  query,
  rarity,
  affinity,
  sort,
  affinities,
  onQuery,
  onRarity,
  onAffinity,
  onSort
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search cards"
            className="w-full pl-9"
          />
        </div>
        <label className="relative flex items-center">
          <ArrowDownWideNarrow
            size={15}
            className="pointer-events-none absolute left-2.5 text-content-faint"
          />
          <select
            value={sort}
            onChange={(event) => onSort(event.target.value as CardSort)}
            aria-label="Sort cards"
            className="h-11 rounded-md border border-line bg-surface-2 pl-8 pr-3 text-sm font-medium text-content"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-0.5">
        {RARITY_FILTERS.map((value) => (
          <FilterChip
            key={value}
            label={value}
            active={rarity === value}
            onClick={() => onRarity(value)}
          />
        ))}
      </div>

      {affinities.length > 0 && (
        <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-0.5">
          <FilterChip label="ALL" active={affinity === "ALL"} onClick={() => onAffinity("ALL")} />
          {affinities.map((value) => (
            <FilterChip
              key={value}
              label={value}
              dot={affinityColor(value)}
              active={affinity === value}
              onClick={() => onAffinity(value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
