import * as Y from "yjs";
import { supabaseServer } from "../lib/supabase/server.js";
function parseMessage(payload) {
    try {
        const text = typeof payload === "string"
            ? payload
            : new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data?.type === "SAVE" || data?.type === "DELETE")
            return data;
        return null;
    }
    catch {
        return null;
    }
}
function toUint8Array(input) {
    if (!input)
        return new Uint8Array();
    if (Buffer.isBuffer(input)) {
        return new Uint8Array(input);
    }
    if (input instanceof Uint8Array) {
        return input;
    }
    if (typeof input === "string") {
        const clean = input.startsWith("\\x") ? input.slice(2) : input;
        const bytes = new Uint8Array(clean.length / 2);
        for (let i = 0; i < clean.length; i += 2) {
            bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
        }
        return bytes;
    }
    throw new Error("Invalid yjs_state type");
}
export const DatabaseExtension = {
    async onLoadDocument({ document, documentName }) {
        const meta = document.getMap("meta");
        if (meta.get("loaded")) {
            return document;
        }
        const { data } = await supabaseServer
            .from("note_together")
            .select("yjs_state")
            .eq("id", documentName)
            .single();
        if (!data) {
            return document;
        }
        if (data.yjs_state) {
            const update = toUint8Array(data.yjs_state);
            if (update.length > 0) {
                Y.applyUpdate(document, update);
            }
        }
        meta.set("loaded", true);
        return document;
    },
    async onStateless({ document, documentName, payload }) {
        const message = typeof payload === "string"
            ? JSON.parse(payload)
            : JSON.parse(new TextDecoder().decode(payload));
        if (!message)
            return;
        if (message.type === "SAVE") {
            const update = Y.encodeStateAsUpdate(document);
            const meta = document.getMap("meta");
            const title = meta.get("title") ?? "";
            await supabaseServer.from("note_together").upsert({
                id: documentName,
                title,
                yjs_state: Buffer.from(update),
                updated_at: new Date().toISOString(),
            });
        }
        if (message.type === "DELETE") {
            const { error } = await supabaseServer
                .from("note_together")
                .delete()
                .eq("id", documentName);
            if (!error) {
                document.broadcastStateless(JSON.stringify({ type: "DELETED" }));
                document.destroy();
            }
        }
    },
};
