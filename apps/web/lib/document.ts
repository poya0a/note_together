export type DocumentSummary = {
    id: string;
    title: string;
};

export type DocumentData = {
    id: string;
    title: string;
    yjs_state: string;
    created_at: string;
};

export async function createNewDocument (newId: string) {
    try {
        const res = await fetch("/api/document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: newId }),
        });
        
        if (!res.ok) return [];

        const data = await res.json();
        return data?.document ?? null;
    } catch (err) {
        throw err;
    }
};

export async function fetchTitleList(documentIds: string[]) {
    try {
        const res = await fetch("/api/document/titles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ documentIds }),
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.documents as { id: string; title: string }[];
    } catch (err) {
        throw err;
    }
}

export async function fetchDocument(documentId: string) {
    try {
        const res = await fetch(
        `/api/document/${documentId}`,
        { cache: "no-store" }
        );

        if (!res.ok) return null;

        const data = await res.json();
        return data?.document ?? null;
    } catch {
        return null;
    }
}