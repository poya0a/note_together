import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export function createYjs(roomId: string) {
    const doc = new Y.Doc();

    const provider = new HocuspocusProvider({
        url: "wss://note-together-kappa.onrender.com",
        name: roomId,
        document: doc,
    });

    return { doc, provider };
}

export async function sendYjsCommand(
    provider: HocuspocusProvider,
    type: "SAVE" | "DELETE"
    ) {
    provider.sendStateless(JSON.stringify({ type }));
}
