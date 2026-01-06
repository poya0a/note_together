import { Server } from "@hocuspocus/server";
import { DatabaseExtension } from "@/server/extensions/DatabaseExtension";

export const server = new Server({
  port: Number(process.env.PORT) || 1234,
  extensions: [DatabaseExtension],
});

server.listen();