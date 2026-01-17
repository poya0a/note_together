import { create } from "zustand";
import { DocumentSummary } from "@/lib/document";

type DocumentStore = {
    list: DocumentSummary[];
    setList: (docs: DocumentSummary[]) => void;
    
    document: DocumentSummary;
    setDocument: (doc: DocumentSummary) => void;
};

export const useDocumentStore = create<DocumentStore>((set) => ({
    list: [],
    setList: docs => set({ list: docs }),

    document: {
        id: "",
        title: "",
    },
    setDocument: (doc) => set({ document: doc }),
}));