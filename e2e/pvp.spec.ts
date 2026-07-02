import { expect, test, type Page } from "@playwright/test";
import { io as socketClient, type Socket } from "socket.io-client";
import {
  board,
  dbAvailable,
  firstPlayableHandCard,
  occupiedCells,
  playFirstAvailableMove,
  signIn,
  uniqueEmail,
} from "./helpers";

test("guests are asked to sign in before online play", async ({ page }) => {
  await page.goto("/play/pvp");

  await expect(page.getByText(/to duel online/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Quick match/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: /Create room/ })).toHaveCount(
    0,
  );
});

function emitAck(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`no ack for ${event}`)),
      10_000,
    );
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    socket.emit(event, payload, (response: Record<string, unknown>) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

test("the socket server rejects pvp actions without a session", async ({
  baseURL,
}) => {
  const socket = socketClient(baseURL!, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    // The legacy payload shape claimed an arbitrary user id; identity now
    // comes only from the session cookie, so this must be turned away.
    const createAck = await emitAck(socket, "pvp:create", {
      userId: "someone-else",
      name: "Mallory",
    });
    expect(createAck).toMatchObject({
      ok: false,
      error: "Sign in to play PvP.",
    });

    const rejoinAck = await emitAck(socket, "pvp:rejoin", {
      roomId: "AAAAAA",
      userId: "someone-else",
    });
    expect(rejoinAck).toMatchObject({
      ok: false,
      error: "Sign in to play PvP.",
    });
  } finally {
    socket.disconnect();
  }
});

/** Poll both seats until one of them is on the clock. */
async function whoeverActs(pages: [Page, Page]): Promise<Page> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const candidate of pages) {
      if ((await firstPlayableHandCard(candidate).count()) > 0) {
        return candidate;
      }
    }
    await pages[0].waitForTimeout(250);
  }
  throw new Error("Neither player became the active turn.");
}

test("two signed-in players duel live over an invite room", async ({
  browser,
  request,
}) => {
  test.skip(!(await dbAvailable(request)), "requires the local database");
  test.setTimeout(150_000);

  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  try {
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();
    await Promise.all([
      signIn(host, uniqueEmail("pvp-host"), "Hosta"),
      signIn(guest, uniqueEmail("pvp-guest"), "Guesta"),
    ]);

    await host.goto("/play/pvp");
    await host.getByRole("button", { name: /Create room/ }).click();
    const codeChip = host.getByTestId("room-code");
    await expect(codeChip).toBeVisible();
    const code = (await codeChip.textContent())!.trim();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    await guest.goto("/play/pvp");
    await guest.getByPlaceholder("ROOM CODE").fill(code);
    await guest.getByRole("button", { name: "Join", exact: true }).click();

    // the joined match routes both seats into the duel
    await expect(board(host)).toBeVisible({ timeout: 20_000 });
    await expect(board(guest)).toBeVisible({ timeout: 20_000 });

    // a move by whoever won the flip must sync to the other board
    const first = await whoeverActs([host, guest]);
    const second = first === host ? guest : host;
    await playFirstAvailableMove(first);
    await expect(occupiedCells(first)).toHaveCount(1, { timeout: 15_000 });
    await expect(occupiedCells(second)).toHaveCount(1, { timeout: 15_000 });

    // and the reply syncs back
    await playFirstAvailableMove(second);
    await expect(occupiedCells(second)).toHaveCount(2, { timeout: 15_000 });
    await expect(occupiedCells(first)).toHaveCount(2, { timeout: 15_000 });
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});

test("a signed-in player cannot join their own room", async ({
  page,
  request,
}) => {
  test.skip(!(await dbAvailable(request)), "requires the local database");

  await signIn(page, uniqueEmail("pvp-self"), "Solo");
  await page.goto("/play/pvp");
  await page.getByRole("button", { name: /Create room/ }).click();
  const codeChip = page.getByTestId("room-code");
  await expect(codeChip).toBeVisible();
  const code = (await codeChip.textContent())!.trim();

  await page.getByPlaceholder("ROOM CODE").fill(code);
  await page.getByRole("button", { name: "Join", exact: true }).click();
  await expect(
    page.getByText("You are already seated in this room."),
  ).toBeVisible();
});
