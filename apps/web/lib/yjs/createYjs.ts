import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

const hocuspocusServerURL = process.env.NEXT_PUBLIC_HOCUS_POCUS_SERVER_URL!;

export function createYjs(documentId: string) {
    const doc = new Y.Doc();

    const title = doc.getText("title");
    const content = doc.getXmlFragment("content");

    const provider = new HocuspocusProvider({
        url: hocuspocusServerURL,
        name: documentId,
        document: doc,
    });

    return {
        doc,
        provider,
        title,
        content, 
};
}

export async function sendYjsCommand(
    provider: HocuspocusProvider,
    data:
        | { type: "SAVE"; title?: string }
        | { type: "DELETE" }
) {
    provider.sendStateless(JSON.stringify(data));
}