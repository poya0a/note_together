import * as Y from "yjs";
import type { Extension, onStatelessPayload } from "@hocuspocus/server";
import { supabaseServer } from "@/lib/supabase/server";

type ClientMessage =
  | { type: "SAVE" }
  | { type: "DELETE" };

function parseMessage(payload: string | Uint8Array): ClientMessage | null {
  try {
    const text =
      typeof payload === "string"
        ? payload
        : new TextDecoder().decode(payload);

    const data = JSON.parse(text);
    if (data?.type === "SAVE" || data?.type === "DELETE") return data;
    return null;
  } catch {
    return null;
  }
}

export const DatabaseExtension: Extension = {
  async onLoadDocument({ document, documentName }) {
    const { data, error } = await supabaseServer
      .from("note_together")
      .select("yjs_state")
      .eq("id", documentName)
      .single();

    if (error || !data?.yjs_state) {
      return document;
    }

    const update = new Uint8Array(data.yjs_state);
    Y.applyUpdate(document, update);

    return document;
  },

  async onStateless(payload: onStatelessPayload) {
    const { document, documentName } = payload;
    const message = parseMessage(payload.payload);
    if (!message) return;

    if (message.type === "SAVE") {
      const update = Y.encodeStateAsUpdate(document);

      await supabaseServer.from("note_together").upsert({
        id: documentName,
        yjs_state: Buffer.from(update),
        updated_at: new Date().toISOString(),
      });
    }

    if (message.type === "DELETE") {
      await supabaseServer
        .from("note_together")
        .delete()
        .eq("id", documentName);

      document.broadcastStateless(
        JSON.stringify({ type: "DELETED" })
      );

      document.destroy();
    }
  },
};
