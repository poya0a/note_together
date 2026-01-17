"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateClientData, getDocuments, getLastOpenedDocument, addDocumentId, removeDocumentId } from "@/lib/clientStorage/clientData";
import { createNewDocument, fetchDocument } from "@/lib/document";
import { useDocumentStore } from "@/store/useDocumentStore";

async function findValidDocument(documentIds: string[]) {
    for (const id of documentIds) {
        const doc = await fetchDocument(id);
        // 서버에 문서 없는 경우 스토리지에서 삭제
        if (!doc) {
            removeDocumentId(id);
        } else {
            return doc;
        }
    }
    return null;
}

export default function NoteTogetherEntry() {
    const router = useRouter();
    const { document, setDocument } = useDocumentStore(state => state);

    useEffect(() => {
        const init = async () => {
            // 사용자 데이터
            getOrCreateClientData();
            const documentsData = getDocuments();
            const lastDocId = getLastOpenedDocument();

            let targetDocId: string | null = null;

            // 스토리지에 문서 아이디가 있는 경우
            if (lastDocId) {
                // 현재 문서 데이터와 스토리지 아이디가 일치하지 않는 경우
                if (lastDocId !== document.id) {
                    const findDoc = await findValidDocument(documentsData);
                    // 서버에 일치하는 문서가 있는 경우
                    if(findDoc) {
                        setDocument(findDoc);
                        targetDocId = findDoc.id;
                    } else {
                        // 없는 경우 생성
                        const newDocId = crypto.randomUUID();
                        // 서버에 저장
                        const newDoc = await createNewDocument(newDocId);
                        if (newDoc) {
                            setDocument(newDoc);
                            addDocumentId(newDocId);
                            targetDocId = newDocId;
                        } else {
                            router.replace("/not-found");
                        }
                        
                    }
                } else {
                    targetDocId = lastDocId;
                }
            } else {
                // 스토리지에 문서 아이디가 없는 경우 생성
                const newDocId = crypto.randomUUID();
                // 서버에 저장
                const newDoc = await createNewDocument(newDocId);
                if (newDoc) {
                    setDocument(newDoc);
                    addDocumentId(newDocId);
                    targetDocId = newDocId;
                } else {
                    router.replace("/not-found");
                }
            }
            // 페이지 이동
            if (targetDocId) {
                router.replace(`/document/${targetDocId}`);
            }
        };
        init();
    }, [router]);

    return null;
}