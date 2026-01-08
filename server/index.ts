import { Server } from "@hocuspocus/server";
import { DatabaseExtension } from "@/server/extensions/DatabaseExtension";

const PORT = Number(process.env.PORT) || 1234;

const server = new Server({
  port: PORT,
  extensions: [DatabaseExtension],
});

server.listen();

console.log(`✅ Hocuspocus server listening on port ${PORT}`);