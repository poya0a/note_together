import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function createYjs(roomId: string) {
    const doc = new Y.Doc();

    const provider = new WebsocketProvider(
        'wss://demos.yjs.dev',
        roomId,
        doc
    );

    return { doc, provider };
}
