"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateClientData } from "@/lib/clientStorage/clientData";
import { createNewDocument, fetchTitleList, fetchDocument } from "@/lib/document";
import { useDocumentStore } from "@/store/useDocumentStore";

export default function NoteTogetherEntry() {
    const router = useRouter();
    const { setList, setDocument } = useDocumentStore(state => state);

    useEffect(() => {
        const init = async () => {
            const clientData = getOrCreateClientData();
            let targetDocId = clientData.documents[clientData.documents.length - 1];

            let titles = clientData.documents && clientData.documents.length > 0 ? await fetchTitleList(clientData.documents) : null;
            let doc = targetDocId ? await fetchDocument(targetDocId) : null;
            
            if (!doc || !titles) {
                targetDocId = crypto.randomUUID();

                await createNewDocument(targetDocId);
                doc = await fetchDocument(targetDocId);
                titles = await fetchTitleList([targetDocId])
            }

            setList(titles);
            setDocument(doc);

            clientData.documents = [targetDocId];
            localStorage.setItem("noteTogetherClientData", JSON.stringify(clientData));

            router.replace(`/document/${targetDocId}`);     
        };

        init();
    }, [router, setList, setDocument]);

    return null;
}