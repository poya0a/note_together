"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateClientData } from "@/lib/clientStorage/clientData";
import { createNewDocument, fetchDocument } from "@/lib/document";
import { useDocumentStore } from "@/store/useDocumentStore";

export default function NoteTogetherEntry() {
    const router = useRouter();
    const { setList, document, setDocument } = useDocumentStore(state => state);

    useEffect(() => {
        const init = async () => {
            const clientData = getOrCreateClientData();

            // 기존 문서 데이터가 있는 경우
            if (document && clientData.documents && clientData.documents.length > 0) {
                const lastDocId = clientData.documents[clientData.documents.length - 1];
                // 현재 문서 데이터와 아이디가 일치하는 경우
                if (lastDocId !== document.id) {
                    const doc = await fetchDocument(lastDocId);
                    setDocument(doc);
                }
                router.replace(`/document/${lastDocId}`);  
                // 문서 데이터가 없는 경우
            } else {
                const newId = crypto.randomUUID();

                // 문서 생성
                const newDoc = await createNewDocument(newId);

                if (newDoc) {
                    // 전역 변수에 저장
                    setDocument(newDoc);
                    setList([{
                        id: newDoc.id,
                        title: ""
                    }]);
                    
                    // 로컬 스토리지 데이터 업데이트
                    clientData.documents = [newDoc.id];
                    localStorage.setItem("noteTogetherClientData", JSON.stringify(clientData));

                    router.replace(`/document/${newDoc.id}`);
                }
            }
        };
        init();
    }, [router]);

    return null;
}