import { createServer } from "node:http";
import next from "next";
import { registerRealtimeServer } from "./src/server/realtime";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  handle(request, response);
});

registerRealtimeServer(server);

server.listen(port, hostname, () => {
  console.log(`Tessera ready on http://${hostname}:${port}`);
});
