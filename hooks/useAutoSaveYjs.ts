import { useEffect } from "react";
import * as Y from "yjs";
import { supabaseClient } from "@/lib/supabase/client";

export function useAutoSaveYjs(
    doc: Y.Doc | null,
    pageId: string | null,
    title: string
) {
    useEffect(() => {
        if (!doc || !pageId) return;

        const timer = setInterval(() => {
            const update = Y.encodeStateAsUpdate(doc);

            supabaseClient.from("documents").upsert({
                id: pageId,
                title,
                yjs_state: update,
            });
        }, 1000 * 60 * 5);

        return () => clearInterval(timer);
    }, [doc, pageId, title]);
}