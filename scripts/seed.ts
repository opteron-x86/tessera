import { ensureCatalog, ensurePlayerBootstrap } from "../src/lib/economy";
import { prisma } from "../src/lib/db";

async function main() {
  await ensureCatalog();

  const demo = await prisma.user.upsert({
    where: { email: "player@tessera.local" },
    update: { name: "Wayfarer" },
    create: {
      email: "player@tessera.local",
      name: "Wayfarer"
    }
  });

  await ensurePlayerBootstrap(demo.id);
  console.log("Seeded Tessera catalog and demo player.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
