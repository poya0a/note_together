import * as Y from "yjs";
import type { Extension, onStatelessPayload } from "@hocuspocus/server";
import { supabaseServer } from "../lib/supabase/server.js";

export const DatabaseExtension: Extension = {
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
      const update = Buffer.from(data.yjs_state, "base64");
      Y.applyUpdate(document, new Uint8Array(update));
    }
    
    meta.set("loaded", true);
    return document;
  },

  async onStateless({ document, documentName, payload }: onStatelessPayload) {
    const message =
      typeof payload === "string"
        ? JSON.parse(payload)
        : JSON.parse(new TextDecoder().decode(payload));

    if (!message) return;

    if (message.type === "SAVE") {
      const update = Y.encodeStateAsUpdate(document);
      const meta = document.getMap("meta");
      const title = meta.get("title") ?? "";


      await supabaseServer.from("note_together").upsert({
        id: documentName,
        title,
        yjs_state: Buffer.from(update).toString("base64"),
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
