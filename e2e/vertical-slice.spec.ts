import { expect, test } from "@playwright/test";

test("renders the playable Tessera duel", async ({ page }) => {
  await page.goto("/");

  // "/" redirects to the Play arena
  await expect(page.getByRole("grid", { name: "Tessera board" })).toBeVisible();

  // pick a card from your hand (click its exposed top edge — hand cards overlap)
  await page
    .getByRole("button", { name: /Ember Page/ })
    .first()
    .click({ position: { x: 24, y: 12 } });
  await page.getByRole("gridcell", { name: /Tile 5/ }).click();

  // a card now occupies the board (owner may flip after the AI replies)
  await expect(page.getByRole("gridcell", { name: /held by/ }).first()).toBeVisible();
});

test("opens the match log and rules in a modal", async ({ page }) => {
  await page.goto("/play");

  await page.getByRole("button", { name: "Match" }).click();
  await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Match log" })).toBeVisible();
});

test("navigates collection, decks, shop, and the PvP lobby", async ({ page }) => {
  await page.goto("/play");

  await page.getByRole("link", { name: "Decks" }).click();
  await expect(page.getByRole("heading", { name: "Deck Builder" })).toBeVisible();

  await page.getByRole("link", { name: "Collection" }).click();
  await expect(page.getByRole("heading", { name: "Collection" })).toBeVisible();

  await page.getByRole("link", { name: "Shop" }).click();
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();

  // PvP lobby lives behind the "Rooms" button in PvP mode
  await page.getByRole("link", { name: "Play" }).first().click();
  await page.getByRole("button", { name: "PvP", exact: true }).click();
  await page.getByRole("button", { name: "Rooms" }).click();
  await expect(page.getByRole("heading", { name: "PvP duel" })).toBeVisible();
});
