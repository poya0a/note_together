import * as Y from "yjs";
import type { Extension, onStatelessPayload } from "@hocuspocus/server";
import { supabaseServer } from "../lib/supabase/server.js";

type ClientMessage =
  | { type: "SAVE"; title?: string }
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
    const { data } = await supabaseServer
      .from("note_together")
      .select("yjs_state")
      .eq("id", documentName)
      .single();

    if (!data) {
      return document;
    }

    if (data.yjs_state) {
      const update = new Uint8Array(data.yjs_state);
      Y.applyUpdate(document, update);
    }

    return document;
  },

  async onStateless({ document, documentName, payload }: onStatelessPayload) {
    const message = parseMessage(payload);
    if (!message) return;

    if (message.type === "SAVE") {
      const update = Y.encodeStateAsUpdate(document);
      const yTitle = document.getText("title").toString();

      await supabaseServer.from("note_together").upsert({
        id: documentName,
        title: yTitle,
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
        document.broadcastStateless(
          JSON.stringify({ type: "DELETED" })
        );
        document.destroy();
      }
    }
  },
};
