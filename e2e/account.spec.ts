import { expect, test } from "@playwright/test";
import { dbAvailable, signIn, uniqueEmail } from "./helpers";

test.beforeEach(async ({ request }) => {
  test.skip(!(await dbAvailable(request)), "requires the local database");
});

test("signs in, sees the starter profile, and signs out", async ({ page }) => {
  await signIn(page, uniqueEmail("profile"), "Prospero");

  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText("Prospero")).toBeVisible();
  await expect(page.getByText("Currency")).toBeVisible();
  await expect(page.getByText("Deck slots")).toBeVisible();

  await page.getByRole("button", { name: /Log out/ }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("renames and saves the starter deck", async ({ page }) => {
  await signIn(page, uniqueEmail("decks"));

  await page.goto("/decks");
  // the bootstrap deck seeds the builder asynchronously with its five cards;
  // renaming before that would be stomped by the seed
  await expect(page.getByText("5/5")).toBeVisible({ timeout: 15_000 });
  const nameInput = page.getByLabel("Deck name");
  await expect(nameInput).toHaveValue("First Road");
  await expect(page.getByRole("button", { name: "Saved" })).toBeDisabled();

  await nameInput.fill("Road Test");
  await page.getByRole("button", { name: "Save deck" }).click();

  await expect(page.getByText("Deck saved.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Road Test" })).toBeVisible();
});

test("opens a booster and reveals its cards", async ({ page }) => {
  await signIn(page, uniqueEmail("shop"));

  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();

  // the Wayfarer Pack costs 120 of the 500 starter currency
  await page.getByRole("button", { name: "120" }).click();

  const reveal = page.getByLabel("Pack contents");
  await expect(reveal).toBeVisible({ timeout: 15_000 });
  await reveal.getByRole("button", { name: /Reveal all|Continue/ }).click();
  await reveal.getByRole("button", { name: "Continue" }).click();
  await expect(reveal).toBeHidden();

  // the pull is kept on the page and the currency chip reflects the spend
  // (the chip renders in both the desktop and mobile bars — match the visible one)
  await expect(page.getByText("Last pull")).toBeVisible();
  await expect(
    page.getByText("380").filter({ visible: true }).first(),
  ).toBeVisible();
});

test("guests cannot buy boosters", async ({ page }) => {
  await page.goto("/shop");
  await expect(
    page.getByText("Sign in on the Profile tab to buy boosters."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "120" })).toBeDisabled();
});
