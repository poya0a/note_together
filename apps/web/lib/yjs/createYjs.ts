import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

const hocuspocusServerURL = process.env.HOCUS_POCUS_SERVER_URL!;

export function createYjs(documentId: string) {
    const doc = new Y.Doc();

    const provider = new HocuspocusProvider({
        url: hocuspocusServerURL,
        name: documentId,
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
