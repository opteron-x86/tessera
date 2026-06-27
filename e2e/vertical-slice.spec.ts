import { expect, test } from "@playwright/test";

test("renders the playable Tessera duel", async ({ page }) => {
  await page.goto("/");

  // "/" redirects to the Play arena — choose Versus AI, then an opponent.
  await page.getByRole("link", { name: /Versus AI/ }).click();
  await expect(page.getByRole("heading", { name: "Choose an opponent" })).toBeVisible();
  await page.getByRole("button", { name: /Old Road Tutor/ }).click();

  // the duel board is now mounted
  await expect(page.getByRole("grid", { name: "Tessera board" })).toBeVisible();

  // pick a card from your hand (click its exposed top edge — hand cards overlap)
  await page
    .getByRole("button", { name: /Piasa Whelp/ })
    .first()
    .click({ position: { x: 24, y: 12 } });
  // the AI may open on a random tile, so place on the first empty one
  await page
    .getByRole("gridcell", { name: /empty/ })
    .first()
    .click();

  // a card now occupies the board (owner may flip after the AI replies)
  await expect(page.getByRole("gridcell", { name: /held by/ }).first()).toBeVisible();
});

test("shows the rules and match log rail during a duel", async ({ page }) => {
  await page.goto("/play");

  // enter a duel first
  await page.getByRole("link", { name: /Versus AI/ }).click();
  await expect(page.getByRole("heading", { name: "Choose an opponent" })).toBeVisible();
  await page.getByRole("button", { name: /Old Road Tutor/ }).click();
  await expect(page.getByRole("grid", { name: "Tessera board" })).toBeVisible();

  // on desktop the match rail (rules + log) is docked beside the board
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

  // PvP lobby is its own page, reached from the arena's Online Duel card
  await page.getByRole("link", { name: "Play" }).first().click();
  await page.getByRole("link", { name: /Online Duel/ }).click();
  await expect(page.getByRole("heading", { name: "PvP duel" })).toBeVisible();
});
