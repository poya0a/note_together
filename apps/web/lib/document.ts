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
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/document`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: newId }),
        });

        if (!res.ok) return [];

        const data = await res.json();
        return data.documents as { id: string; title: string }[];
    } catch (err) {
        console.error("Failed to create document :", err);
        return [];
    }
};

export async function fetchTitleList(documentIds: string[]) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/document/titles`, {
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
        console.error("Failed to fetch document titles:", err);
        return [];
    }
}

export async function fetchDocument(documentId: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/document/${documentId}`);
        if (!res.ok) return null;

        const data = await res.json();
        return data.document ?? null;
    } catch (err) {
        console.error("Failed to fetch document:", err);
        return null;
    }
}