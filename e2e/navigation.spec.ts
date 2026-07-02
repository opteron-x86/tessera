import { expect, test } from "@playwright/test";

test("root redirects to the play arena", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole("heading", { name: "Duel Arena" })).toBeVisible();
});

test("shell navigation reaches every surface", async ({ page }) => {
  await page.goto("/play");

  await page.getByRole("link", { name: "Collection" }).first().click();
  await expect(page).toHaveURL(/\/collection$/);
  await expect(page.getByRole("heading", { name: "Collection" })).toBeVisible();

  await page.getByRole("link", { name: "Decks" }).first().click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(
    page.getByRole("heading", { name: "Deck Builder" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Shop" }).first().click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();

  await page.getByRole("link", { name: "Profile" }).first().click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

  await page.getByRole("link", { name: "Play" }).first().click();
  await expect(page).toHaveURL(/\/play$/);
});

test("arena routes into the PvE ladder and the PvP lobby", async ({
  page,
}) => {
  await page.goto("/play");

  await page.getByRole("link", { name: /Versus AI/ }).click();
  await expect(
    page.getByRole("heading", { name: "Choose an opponent" }),
  ).toBeVisible();

  await page.goto("/play");
  await page.getByRole("link", { name: /Online Duel/ }).click();
  await expect(page.getByRole("heading", { name: "PvP duel" })).toBeVisible();
});

test("guests browse their starter collection", async ({ page }) => {
  await page.goto("/collection");
  await expect(page.getByRole("heading", { name: "Collection" })).toBeVisible();
  await expect(page.getByText("Piasa Whelp").first()).toBeVisible();
});

test("visiting the duel screen without a live match returns to the arena", async ({
  page,
}) => {
  await page.goto("/play/duel");
  await expect(page).toHaveURL(/\/play$/);
});
