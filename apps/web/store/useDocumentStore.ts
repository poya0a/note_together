import { create } from "zustand";
import { DocumentSummary, DocumentData } from "@/lib/document";

type DocumentStore = {
    list: DocumentSummary[];
    setList: (docs: DocumentSummary[]) => void;
    
    document: DocumentData;
    setDocument: (doc: DocumentData) => void;
    clearDocument: () => void;
};

export const useDocumentStore = create<DocumentStore>((set) => ({
    list: [],
    setList: docs => set({ list: docs }),

    document: {
        id: "",
        title: "",
        yjs_state: "",
        created_at: "",
    },
    setDocument: (doc) => set({ document: doc }),
    clearDocument: () => set({ document: 
        {
            id: "",
            title: "",
            yjs_state: "",
            created_at: "",
        }
    }),
}));