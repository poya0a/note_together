import { randomColor, randomUserName } from "@/utils/random";

export type UserInfo = {
    name: string;
    color: string;
};

export type ClientData = {
    user: UserInfo;
    documents: string[];
};

const LOCAL_STORAGE_KEY = "noteTogetherClientData";

const MAX_DOCS = 20;

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

export function getOrCreateClientData(): ClientData {
    if (!isBrowser()) {
        return {
            user: { name: '', color: '' },
            documents: [],
        };
    }

    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (err) {
        throw err;
    }

    const data: ClientData = {
        user: {
            name: randomUserName(),
            color: randomColor(),
        },
        documents: [],
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return data;
}

export function addDocument(documentId: string) {
    if (!isBrowser()) return;

    const data = getOrCreateClientData();

    data.documents = [
        documentId,
        ...data.documents.filter(id => id !== documentId),
    ].slice(0, MAX_DOCS);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function removeDocument(documentId: string) {
    if (!isBrowser()) return;

    const data = getOrCreateClientData();

    data.documents = data.documents.filter(id => id !== documentId);

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function getLastOpenedDocument(): string | null {
    const data = getOrCreateClientData();
    if (data.documents.length === 0) return null;
    return data.documents[data.documents.length - 1];
}

export function getUserInfo(): UserInfo {
    return getOrCreateClientData().user;
}
