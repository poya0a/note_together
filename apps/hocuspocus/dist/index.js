import "dotenv/config";
import { Server } from "@hocuspocus/server";
import { DatabaseExtension } from "./extensions/DatabaseExtension.js";
const PORT = Number(process.env.PORT) || 1234;
const server = new Server({
    port: PORT,
    extensions: [DatabaseExtension],
});
server.listen();
