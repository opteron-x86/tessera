import { expect, test } from "@playwright/test";
import {
  board,
  firstPlayableHandCard,
  occupiedCells,
  playFirstAvailableMove,
  startPveDuel,
} from "./helpers";

test("guest plays an opening move against the AI", async ({ page }) => {
  await startPveDuel(page);

  await playFirstAvailableMove(page);

  // our card lands; the AI replies on its own tile shortly after
  await expect(occupiedCells(page).first()).toBeVisible();
  await expect(occupiedCells(page)).toHaveCount(2, { timeout: 15_000 });
});

test("shows the rules and match log rail during a duel", async ({ page }) => {
  await startPveDuel(page);

  // on desktop the match rail (rules + log) is docked beside the board
  await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Match log" })).toBeVisible();
});

test("guest duel runs to its outcome and restarts", async ({ page }) => {
  test.setTimeout(120_000);
  await startPveDuel(page);

  // Alternate turns until the 9 tiles fill. The coin flip decides whether we
  // place 5 cards or 4, so wait each round for either our turn or the outcome.
  const outcome = page.getByRole("heading", { name: /Victory|Defeat|Draw/ });
  for (let move = 0; move < 5; move += 1) {
    await expect(outcome.or(firstPlayableHandCard(page))).toBeVisible({
      timeout: 20_000,
    });
    if (await outcome.isVisible()) {
      break;
    }
    await playFirstAvailableMove(page);
  }

  await expect(outcome).toBeVisible({ timeout: 30_000 });
  // the duel screen renders desktop and mobile boards; match the visible overlay
  await expect(
    page.getByText(/Final score \d – \d/).filter({ visible: true }),
  ).toBeVisible();

  // play again resets the board for a fresh duel
  await page.getByRole("button", { name: /Play again/ }).click();
  await expect(
    page.getByRole("heading", { name: /Victory|Defeat|Draw/ }),
  ).toBeHidden({ timeout: 15_000 });
  await expect(board(page)).toBeVisible();
});

test("leaving an active duel asks for confirmation first", async ({
  page,
}) => {
  await startPveDuel(page);

  await page.getByRole("button", { name: /Leave game/ }).click();
  await expect(page.getByText("Leave this duel?")).toBeVisible();

  await page.getByRole("button", { name: "Keep playing" }).click();
  await expect(page.getByText("Leave this duel?")).toBeHidden();
  await expect(board(page)).toBeVisible();

  await page.getByRole("button", { name: /Leave game/ }).first().click();
  await page
    .getByRole("button", { name: /Leave game/ })
    .last()
    .click();
  await expect(page).toHaveURL(/\/play$/);
});
