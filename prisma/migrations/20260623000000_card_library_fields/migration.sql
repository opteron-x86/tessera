CREATE TYPE "CardRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

ALTER TABLE "CardTemplate" ADD COLUMN "series" TEXT NOT NULL DEFAULT 'core';
ALTER TABLE "CardTemplate" ADD COLUMN "collectorNumber" TEXT;
ALTER TABLE "CardTemplate" ADD COLUMN "rarity" "CardRarity";

UPDATE "CardTemplate"
SET "rarity" = "tier"::text::"CardRarity";

ALTER TABLE "CardTemplate" ALTER COLUMN "rarity" SET NOT NULL;
ALTER TABLE "CardTemplate" DROP COLUMN "tier";
ALTER TABLE "CardTemplate" ADD COLUMN "tier" INTEGER NOT NULL DEFAULT 1;

DROP TYPE "CardTier";
