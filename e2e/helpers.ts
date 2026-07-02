import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

/** Unique per-run credentials so authed tests never collide across runs. */
export function uniqueEmail(prefix: string) {
  const nonce = Math.random().toString(36).slice(2, 8);
  return `e2e-${prefix}-${Date.now()}-${nonce}@tessera.local`;
}

/**
 * Authenticated flows (credentials sign-in, decks, shop, PvP) need Postgres
 * behind the dev server; guest PvE does not. Specs skip on `db: false`.
 */
export async function dbAvailable(request: APIRequestContext) {
  try {
    const response = await request.get("/api/health");
    if (!response.ok()) {
      return false;
    }
    const body = (await response.json()) as { db?: boolean };
    return body.db === true;
  } catch {
    return false;
  }
}

/** Sign in through the Profile screen's credentials form. */
export async function signIn(page: Page, email: string, name = "Wayfarer") {
  await page.goto("/profile");
  await page.getByPlaceholder("Name").fill(name);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: /Log out/ })).toBeVisible({
    timeout: 15_000,
  });
}

/** Enter a PvE duel from the opponent ladder and wait for the board. */
export async function startPveDuel(page: Page, opponent = /Old Road Tutor/) {
  await page.goto("/play/pve");
  await expect(
    page.getByRole("heading", { name: "Choose an opponent" }),
  ).toBeVisible();
  await page.getByRole("button", { name: opponent }).click();
  await expect(board(page)).toBeVisible();
}

export function board(page: Page) {
  return page.getByRole("grid", { name: "Tessera board" });
}

/** Hand cards overlap; clicking their exposed top-left edge is always safe. */
export function firstPlayableHandCard(page: Page): Locator {
  return page
    .getByLabel("Your hand")
    .getByRole("button", { disabled: false })
    .first();
}

/**
 * Play one move as soon as it is this page's turn: pick the first enabled
 * hand card, then the first legal (empty, enabled) tile. Waits out the
 * opening coin flip and the opponent's turn via the enabled-state locators.
 */
export async function playFirstAvailableMove(page: Page) {
  await firstPlayableHandCard(page).click({
    position: { x: 24, y: 12 },
    timeout: 15_000,
  });
  await page
    .getByRole("gridcell", { name: /empty/, disabled: false })
    .first()
    .click();
}

/** Count of board tiles currently holding a card. */
export function occupiedCells(page: Page) {
  return page.getByRole("gridcell", { name: /held by/ });
}
