import { z } from "zod";

export const CARD_RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const;
export const POWER_TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const slugSchema = z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const affinityValueSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[A-Za-z][A-Za-z -]*$/);

export const sideValueSchema = z.number().int().min(1).max(11);

const affinitySchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized === "" || normalized.toLowerCase() === "none" ? undefined : normalized;
}, affinityValueSchema.optional());

export const cardSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    series: slugSchema.optional(),
    collectorNumber: z.string().min(1).optional(),
    rarity: z.enum(CARD_RARITIES),
    tier: z.number().int().min(1).max(10),
    affinity: affinitySchema,
    sides: z
      .object({
        top: sideValueSchema,
        right: sideValueSchema,
        bottom: sideValueSchema,
        left: sideValueSchema
      })
      .strict(),
    lore: z.string().min(1),
    artUrl: z.string().min(1).optional(),
    palette: z
      .object({
        primary: hexColorSchema,
        secondary: hexColorSchema,
        ink: hexColorSchema
      })
      .strict()
  })
  .strict();

export const cardSetSchema = z
  .object({
    series: slugSchema,
    name: z.string().min(1).optional(),
    cards: z.array(cardSchema).min(1)
  })
  .strict();

export type CardSetFile = z.infer<typeof cardSetSchema>;

export function parseCardSetFile(input: unknown, source: string): CardSetFile {
  const parsed = cardSetSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid card set ${source}: ${details}`);
  }

  return {
    ...parsed.data,
    cards: parsed.data.cards.map((card) => ({
      ...card,
      series: card.series ?? parsed.data.series
    }))
  };
}

export function assertUniqueCardIds(cardSets: CardSetFile[]) {
  const seen = new Map<string, string>();

  for (const set of cardSets) {
    for (const card of set.cards) {
      const previous = seen.get(card.id);
      if (previous) {
        throw new Error(`Duplicate card id "${card.id}" in ${set.series}; already used in ${previous}.`);
      }
      seen.set(card.id, set.series);
    }
  }
}
