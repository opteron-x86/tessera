import clsx from "clsx";
import type { CardTemplate, PlayerSlot, Sides } from "@/game/types";
import { affinityColor, isHolo, normalizeSides, rarityColor } from "@/lib/client/cards";

type Variant = "hand" | "board" | "compact" | "reveal";

const SIZES: Record<Variant, string> = {
  hand: "aspect-[3/4]",
  board: "h-full w-full",
  compact: "h-24 w-[72px]",
  reveal: "aspect-[3/4]"
};

const OWNER_COLOR: Record<PlayerSlot, string> = {
  one: "var(--player-one)",
  two: "var(--player-two)"
};

export function CardFace({
  card,
  variant = "hand",
  selected = false,
  owner,
  sidesOverride,
  className
}: {
  card: CardTemplate;
  variant?: Variant;
  selected?: boolean;
  owner?: PlayerSlot;
  sidesOverride?: Sides;
  className?: string;
}) {
  const sides = normalizeSides(sidesOverride ?? card.sides);
  const rarity = rarityColor(card.rarity);
  const affinity = affinityColor(card.affinity);
  const compact = variant === "compact";
  const fullCardArt = card.artUrl?.endsWith(".png") ?? false;

  // In a duel the whole card is tinted by its controller (classic Triple Triad);
  // outside a duel (collection, shop, deck builder) it keeps its affinity colour.
  const owned = owner !== undefined;
  const primary = owned ? OWNER_COLOR[owner] : card.palette?.primary ?? "#4f5d8f";

  return (
    <div
      style={
        {
          "--card-primary": primary,
          "--card-ink": "#f4f6fb",
          "--affinity-color": affinity,
          "--gem-color": rarity,
          borderColor: owned ? OWNER_COLOR[owner] : rarity
        } as React.CSSProperties
      }
      className={clsx(
        "card-face relative isolate overflow-hidden rounded-md border-2 shadow-e1 transition-transform duration-base",
        isHolo(card.rarity) && "card-holo",
        selected && "ring-2 ring-accent shadow-glow",
        SIZES[variant],
        className
      )}
    >
      {fullCardArt ? (
        <img src={card.artUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          {/* depth + framing */}
          <div className="card-vignette" aria-hidden />
          <div className="card-frame" aria-hidden />
          <span className="card-gem" aria-hidden />

          {/* art window with affinity-tinted glow (sits above the name plate) */}
          <div className="absolute inset-x-2 bottom-9 top-7 grid place-items-center">
            <div className="card-glow" aria-hidden />
            <img
              src={card.artUrl ?? "/cards/card-back.png"}
              alt=""
              className="relative max-h-full w-auto opacity-95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            />
          </div>
        </>
      )}

      {/* values clustered in the top-left diamond, classic Triple Triad style.
          On a board card below `lg` we instead pin them to the N/E/S/W edge
          centers so the tiny mobile tiles stay legible. */}
      <div
        className={clsx(
          "absolute left-1.5 top-1.5 z-10 grid-cols-[18px_18px_18px] grid-rows-[18px_18px_18px] place-items-center",
          variant === "board" ? "hidden lg:grid" : "grid"
        )}
      >
        <span className="value-chip col-start-2 row-start-1">{sides.top}</span>
        <span className="value-chip col-start-1 row-start-2">{sides.left}</span>
        <span className="value-chip col-start-3 row-start-2">{sides.right}</span>
        <span className="value-chip col-start-2 row-start-3">{sides.bottom}</span>
      </div>

      {variant === "board" && (
        <div className="pointer-events-none absolute inset-0 z-10 lg:hidden" aria-hidden>
          <span className="value-chip absolute left-1/2 top-0.5 -translate-x-1/2">{sides.top}</span>
          <span className="value-chip absolute bottom-0.5 left-1/2 -translate-x-1/2">
            {sides.bottom}
          </span>
          <span className="value-chip absolute left-0.5 top-1/2 -translate-y-1/2">{sides.left}</span>
          <span className="value-chip absolute right-0.5 top-1/2 -translate-y-1/2">
            {sides.right}
          </span>
        </div>
      )}

      {/* name plate with affinity accent bar — hidden on mobile board tiles */}
      {!compact && (
        <div className={clsx("card-name", variant === "board" && "!hidden lg:!flex")}>
          <span className="truncate">{card.name}</span>
        </div>
      )}
    </div>
  );
}
